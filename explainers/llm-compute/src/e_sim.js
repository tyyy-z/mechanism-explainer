// ================= PERFORMANCE MODEL (roofline · bytes & FLOPs per token · KV cache) =================
// All hardware numbers = "typical public" spec-sheet values (see SRC); model shapes = public Llama-family configs.
const GPUS = {
  A100: { name: 'A100 SXM 80GB', bw: 2.039e12, peak: 312e12, fp8: false, hbm: 80e9, sms: 108, smsFull: 128, l2: 40, nvl: 600e9, stacks: 5, tag: 'typical public' },
  H100: { name: 'H100 SXM5 80GB', bw: 3.35e12, peak: 989e12, fp8: true, hbm: 80e9, sms: 132, smsFull: 144, l2: 50, nvl: 900e9, stacks: 5, tag: 'typical public' },
  B200: { name: 'B200 (2-die)', bw: 8.0e12, peak: 2250e12, fp8: true, hbm: 192e9, sms: 148, smsFull: 160, l2: 126, nvl: 1800e9, stacks: 8, tag: B('typical public · varies by SKU' , 'typical public · 依 SKU 而异' )},
};
const CPUSPEC = { name: B('Illustrative server CPU (64 cores, AVX-512)', '示意服务器 CPU (64 核, AVX-512)'), cores: 64, ghz: 2.5, fmaUnits: 2, lanes32: 16, bw: 0.30e12, tag: 'illustrative' };
CPUSPEC.peak = CPUSPEC.cores * CPUSPEC.ghz * 1e9 * CPUSPEC.fmaUnits * CPUSPEC.lanes32 * 2; // FP32 FLOP/s ≈ 10 TFLOP/s
// public Llama-family shapes (d_model, layers, kv heads, head_dim, ffn, vocab)
const MODELS = [
  { n: '1B', L: 16, d: 2048, kvh: 8, hd: 64, ff: 8192, V: 128256, tied: true, ref: 'Llama-3.2-1B' },
  { n: '7B', L: 32, d: 4096, kvh: 32, hd: 128, ff: 11008, V: 32000, ref: 'Llama-2-7B (MHA)' },
  { n: '8B', L: 32, d: 4096, kvh: 8, hd: 128, ff: 14336, V: 128256, ref: 'Llama-3-8B (GQA)' },
  { n: '13B', L: 40, d: 5120, kvh: 40, hd: 128, ff: 13824, V: 32000, ref: 'Llama-2-13B (MHA)' },
  { n: '70B', L: 80, d: 8192, kvh: 8, hd: 128, ff: 28672, V: 128256, ref: 'Llama-3-70B (GQA)' },
  { n: '405B', L: 126, d: 16384, kvh: 8, hd: 128, ff: 53248, V: 128256, ref: 'Llama-3.1-405B (GQA)' },
];
for (const m of MODELS) {
  m.layerW = m.d * (m.d + 2 * m.kvh * m.hd) + m.d * m.d + 3 * m.d * m.ff;
  m.P = m.L * m.layerW + m.V * m.d * (m.tied ? 1 : 2);
  m.nh = m.d / m.hd;
}
const PREC = { FP16: { w: 2, kv: 2, cx: 1, n: 'FP16/BF16' }, FP8: { w: 1, kv: 1, cx: 2, n: 'FP8 (W8A8)' }, INT4: { w: 0.5, kv: 2, cx: 1, n: 'INT4 (W4A16)' } };
const BATCHES = [1, 2, 4, 8, 16, 32, 64, 128, 256];
const CTXS = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
// live configuration (sliders)
const CFG = { gpu: 'H100', model: 4, prec: 'FP16', batch: 0, ctx: 3, prompt: 2048, bw: 3.35, peak: 989, tp: 1, graphs: true, simd: 'AVX512' };
function hw() { const g = GPUS[CFG.gpu]; return { bw: CFG.bw * 1e12 * CFG.tp, peak: CFG.peak * 1e12 * CFG.tp, hbm: g.hbm * CFG.tp, g }; }
function cfgNums() { const m = MODELS[CFG.model], p = PREC[CFG.prec], B = BATCHES[CFG.batch], ctx = CTXS[CFG.ctx]; return { m, p, B, ctx }; }
const kvPerTok = (m, p) => 2 * m.L * m.kvh * m.hd * p.kv;       // bytes per token of context (K and V, all layers)
function peakFor(p) { const H = hw(); return H.peak * (p.cx > 1 && (GPUS[CFG.gpu].fp8) ? p.cx : 1); }
const KGAP = 1e-6; // per-kernel tail/gap on the GPU (illustrative)
// one kernel record: {name, type, flops, bytes, t}
function kern(name, type, flops, bytes, H, pk) { const tc = flops / pk, tm = bytes / H.bw; return { name, type, flops, bytes, tc, tm, t: Math.max(tc, tm) + KGAP, bound: tm >= tc ? 'mem' : 'comp', ai: flops / Math.max(1, bytes) }; }
// kernels for ONE layer of one decode step (B sequences, each with `ctx` tokens of history)
function layerKernels(m, p, B, ctx, H, pk, prefillT = 0) {
  const T = prefillT || B; // tokens processed this step
  const a = 2; // activations in 16-bit
  const qkvN = m.d + 2 * m.kvh * m.hd;
  const g = (nm, N, K) => kern(nm, 'gemm', 2 * T * N * K, N * K * p.w + T * (N + K) * a, H, pk);
  const attnF = prefillT ? 2 * prefillT * (prefillT / B) * m.d : 4 * B * ctx * m.d; // QKᵀ + PV = 4·T·ctx·d; causal prefill ≈ half
  const attnB = prefillT ? (T * qkvN * a * 2) : B * ctx * 2 * m.kvh * m.hd * p.kv + B * m.d * a * 2;
  return [
    kern('RMSNorm', 'mem', 5 * T * m.d, 2 * T * m.d * a, H, pk),
    g('QKV GEMM', qkvN, m.d),
    kern('RoPE + write KV', 'mem', 6 * T * m.d, T * qkvN * a + T * 2 * m.kvh * m.hd * p.kv, H, pk),
    kern(prefillT ? 'FlashAttention' : 'Attention (paged)', 'attn', attnF, attnB, H, pk),
    g('O-proj GEMM', m.d, m.d),
    kern('Add + RMSNorm', 'mem', 6 * T * m.d, 3 * T * m.d * a, H, pk),
    g('Gate/Up GEMM', 2 * m.ff, m.d),
    kern('SiLU × mul', 'mem', 4 * T * m.ff, 3 * T * m.ff * a, H, pk),
    g('Down GEMM', m.d, m.ff),
    kern('Residual add', 'mem', T * m.d, 3 * T * m.d * a, H, pk),
  ];
}
// full step (decode token or prefill). Returns time breakdown + kernel list + bytes split
function stepModel(kind = 'decode', over = {}) {
  const { m, p, B, ctx } = Object.assign(cfgNums(), over);
  const H = hw(), pk = peakFor(p), T = kind === 'prefill' ? B * CFG.prompt : B;
  const lay = layerKernels(m, p, B, ctx, H, pk, kind === 'prefill' ? T : 0);
  const head = [kern('Embedding gather', 'mem', 0, T * m.d * 2 + T * 4, H, pk)];
  const tail = [kern('Final norm', 'mem', 5 * T * m.d, 2 * T * m.d * 2, H, pk), kern('LM head GEMM', 'gemm', 2 * (kind === 'prefill' ? B : T) * m.V * m.d, m.V * m.d * p.w + B * m.V * 4, H, pk), kern('Softmax/sampling (top-p)', 'mem', 5 * B * m.V, B * m.V * 4 * 2, H, pk)];
  const nK = head.length + tail.length + m.L * lay.length;
  const tLayer = lay.reduce((s, k) => s + k.t, 0);
  // tensor parallel all-reduce: 2 per layer (after O-proj and Down), ring: 2(n-1)/n × bytes
  const n = CFG.tp, nvl = GPUS[CFG.gpu].nvl;
  const arBytes = T * m.d * 2, tAR = n > 1 ? 2 * m.L * (6e-6 + 2 * (n - 1) / n * arBytes / nvl) : 0;
  const tGPU = head[0].t + tail.reduce((s, k) => s + k.t, 0) + m.L * tLayer + tAR;
  const launch = CFG.graphs ? 0.3e-6 : 8e-6; // per-kernel host cost (illustrative: eager framework ≈ 5–10 µs; CUDA Graphs replays the whole token)
  const tCPU = nK * launch + 25e-6;      // + host-side sampling/scheduling (illustrative)
  const t = Math.max(tGPU, tCPU);
  const wBytes = m.P * p.w, kvBytes = kind === 'prefill' ? T * kvPerTok(m, p) : B * ctx * kvPerTok(m, p);
  const allBytes = head[0].bytes + tail.reduce((s, k) => s + k.bytes, 0) + m.L * lay.reduce((s, k) => s + k.bytes, 0);
  const wRead = (m.L * m.layerW + m.V * m.d) * p.w; // weights streamed per step: all layers + LM head (embedding table is only gathered row-by-row)
  const actBytes = Math.max(0, allBytes - wRead - kvBytes);
  const flops = head[0].flops + tail.reduce((s, k) => s + k.flops, 0) + m.L * lay.reduce((s, k) => s + k.flops, 0);
  const tMem = allBytes / H.bw, tComp = flops / pk;
  const kvTotal = B * Math.min(ctx + 1, 1e9) * kvPerTok(m, p);
  const need = wBytes + (kind === 'prefill' ? B * (CFG.prompt) * kvPerTok(m, p) : kvTotal);
  const tIdeal = (wRead + kvBytes) / H.bw;
  return { tIdeal, kind, m, p, B, ctx, T, H, pk, lay, head, tail, nK, tLayer, tAR, tGPU, tCPU, t, wBytes, wRead, kvBytes, actBytes, allBytes, flops, tMem, tComp, ai: flops / allBytes, tokps: kind === 'prefill' ? T / t : B / t, need, fits: need * 1.08 <= H.hbm, cpuBound: tCPU > tGPU };
}
// roofline helpers
const roof = (ai, bw, peak) => Math.min(peak, ai * bw);
// formatting
function fB(x) { return x >= 1e12 ? (x / 1e12).toFixed(2) + ' TB' : x >= 1e9 ? (x / 1e9).toFixed(x >= 1e11 ? 0 : x >= 1e10 ? 1 : 2) + ' GB' : x >= 1e6 ? (x / 1e6).toFixed(x >= 1e8 ? 0 : 1) + ' MB' : x >= 1e3 ? (x / 1e3).toFixed(1) + ' KB' : x.toFixed(0) + ' B'; }
function fT(s) { return s >= 1 ? s.toFixed(2) + ' s' : s >= 1e-3 ? (s * 1e3).toFixed(s >= 0.1 ? 0 : s >= 0.01 ? 1 : 2) + ' ms' : (s * 1e6).toFixed(s >= 1e-4 ? 0 : 1) + ' µs'; }
function fF(x) { return x >= 1e15 ? (x / 1e15).toFixed(2) + ' P' : x >= 1e12 ? (x / 1e12).toFixed(x >= 1e14 ? 0 : 1) + ' T' : x >= 1e9 ? (x / 1e9).toFixed(1) + ' G' : (x / 1e6).toFixed(1) + ' M'; }
function fN(x) { return x >= 1e4 ? Math.round(x).toLocaleString('en-US') : x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2); }
// ---------- toy out-of-order core (for the CPU pipeline step) ----------
// a dot-product loop body: two loads, one FMA (depends on both), pointer add, compare+branch. Unrolled ×3.
const OOO = { prog: [], cyc: 0, fetched: 0, retired: 0, flushes: 0, ipc: 0, log: [] };
function oooReset(mispredictAt = 19) {
  OOO.prog = []; OOO.stall = 0; OOO.cyc = 0; OOO.fetched = 0; OOO.retired = 0; OOO.flushes = 0; OOO.mp = mispredictAt;
  for (let it = 0; it < 6; it++) {
    const b = OOO.prog.length;
    OOO.prog.push({ op: 'vmovups', k: 'ld', lat: 4, dep: [] }, { op: 'vmovups', k: 'ld', lat: 4, dep: [] }, { op: 'vfmadd231ps', k: 'fma', lat: 4, dep: [b, b + 1, it ? b - 3 : -1].filter(x => x >= 0) }, { op: 'add rsi,64', k: 'alu', lat: 1, dep: [] }, { op: 'cmp/jne', k: 'br', lat: 1, dep: [b + 3] });
  }
  OOO.prog.forEach((p, i) => Object.assign(p, { i, st: 'wait', tF: -1, tD: -1, tI: -1, tC: -1, tR: -1, port: -1 }));
}
// advance one cycle. widths: fetch/decode 4, issue up to 6 (ports: 2 load, 2 FMA, 2 ALU/branch), retire 4 in order
function oooCycle() {
  const c = ++OOO.cyc, P = OOO.prog;
  // retire (in order)
  let r = 0; while (OOO.retired < P.length && r < 4) { const p = P[OOO.retired]; if (p.st === 'done' && p.tC <= c - 1) { p.st = 'ret'; p.tR = c; OOO.retired++; r++; } else break; }
  // complete
  for (const p of P) if (p.st === 'exec' && c >= p.tI + p.lat) { p.st = 'done'; p.tC = c; if (p.k === 'br' && p.i === OOO.mp && !p.mpDone) { p.mpDone = true; OOO.flushes++; for (const q of P) if (q.i > p.i && q.st !== 'wait') { q.st = 'wait'; q.tF = q.tD = q.tI = q.tC = -1; q.flushed = c; } OOO.fetched = p.i + 1; OOO.stall = c + 3; } }
  // issue (out of order, oldest-first among ready)
  const ports = { ld: 2, fma: 2, alu: 2, br: 1 }; let issued = 0;
  for (const p of P) { if (p.st !== 'rs' || issued >= 6) continue; const ready = p.dep.every(d => P[d].st === 'done' || P[d].st === 'ret'); if (ready && ports[p.k] > 0 && c > p.tD) { ports[p.k]--; p.st = 'exec'; p.tI = c; p.port = p.k; issued++; } }
  // decode/rename into RS (window 24 entries)
  const inflight = P.filter(p => p.st === 'rs' || p.st === 'exec' || p.st === 'done').length;
  let d = 0; for (const p of P) { if (p.st === 'fe' && c > p.tF && d < 4 && inflight + d < 24) { p.st = 'rs'; p.tD = c; d++; } }
  // fetch
  if (!(OOO.stall && c < OOO.stall)) { let f = 0; while (OOO.fetched < P.length && f < 4) { const p = P[OOO.fetched]; p.st = 'fe'; p.tF = c; OOO.fetched++; f++; } }
  OOO.ipc = OOO.retired / c;
}
