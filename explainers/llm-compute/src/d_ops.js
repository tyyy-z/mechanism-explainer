// ================= ACTIVITY STATE + OPERATION SEQUENCER =================
CFG.mp = true;
// ACT = what the hardware is doing right now (targets set by op segments, display values damp toward them)
const mkAct = () => ({ cpu: 0, pcie: 0, pcieDir: 1, sm: 0, tc: 0, hbm: 0, l2: 0, nvl: 0, wave: -1, smMode: '', kv: 0, sram: 0, tower: -1, towerAll: 0 });
const ACT = mkAct(), ACTT = mkAct();
const OPR = { q: [], cur: null, t: 0, kind: '', chips: [], chip: -1, phase: '', dev: '', running: false, result: null, tv: 0, tvMax: 0, kHi: '', step: null, toks: [] };
let OPCLK = 0;
function setChips(list) { OPR.chips = list; OPR.chip = -1; renderChips(); }
let OPSCALE = 1; // autoplay compresses segment durations a little
function seg(o) { const r = Object.assign({ dur: 1, enter() { }, tick() { }, exit() { } }, o); if (!r.done) r.dur *= OPSCALE; return r; }
function idleAct() { Object.assign(ACTT, mkAct()); }
function act(o) { idleAct(); Object.assign(ACTT, o); }
function startOp(kind) {
  if (OPR.running) return false;
  OPR.q = []; OPR.cur = null; OPR.kind = kind; OPR.result = null; OPR.running = true; OPR.tv = 0; OPR.kHi = ''; OPR.toks = [];
  OPR.step = stepModel('decode'); OPR.tvMax = OPR.step.t;
  ({ PROMPT: buildPrompt, PIPE: buildPipe, LAUNCH: buildLaunch, MMA: buildMMA, FWD: buildFwd, GEN: buildGen, KV: buildKV, TP: buildTP })[kind]();
  nextSeg(); return true;
}
function nextSeg() {
  if (OPR.cur) OPR.cur.exit();
  OPR.cur = OPR.q.shift() || null; OPR.t = 0;
  if (!OPR.cur) { OPR.running = false; OPR.phase = ''; OPR.dev = ''; idleAct(); onOpDone && onOpDone(); return; }
  if (OPR.cur.chip !== undefined) { OPR.chip = OPR.cur.chip; renderChips(); }
  OPR.phase = OPR.cur.label || ''; OPR.dev = OPR.cur.dev || '';
  OPR.cur.enter();
}
function tickOp(dt) {
  OPCLK += dt;
  if (!OPR.cur) return;
  OPR.t += dt; const u = clamp(OPR.t / OPR.cur.dur);
  OPR.cur.tick(u, dt);
  if (u >= 1 || (OPR.cur.done && OPR.cur.done())) nextSeg();
}
function abortOp() { OPR.q = []; OPR.cur = null; OPR.running = false; OPR.kHi = ''; idleAct(); }
function dampAct(dt) { for (const k in ACT) { if (typeof ACT[k] === 'number' && k !== 'wave' && k !== 'tower') ACT[k] = damp(ACT[k], ACTT[k], 6, dt); else ACT[k] = ACTT[k]; } }
// kernel timeline of one decode token (for the kern scope + tower cursor): [{name,type,t0,t1,layer}]
function tokenTimeline(s) {
  const out = []; let t = 0; const push = (k, layer) => { out.push({ name: k.name, type: k.type, t0: t, t1: t + k.t, layer, k }); t += k.t; };
  s.head.forEach(k => push(k, -1));
  const ar = s.tAR / Math.max(1, s.m.L);
  for (let l = 0; l < s.m.L; l++) { s.lay.forEach((k, j) => { push(k, l); if (ar && (j === 4 || j === 8)) { out.push({ name: 'all-reduce', type: 'comm', t0: t, t1: t + ar / 2, layer: l }); t += ar / 2; } }); }
  s.tail.forEach(k => push(k, -2));
  if (s.cpuBound) { const gap = s.tCPU - t; if (gap > 0) { out.push({ name: B('GPU waiting for CPU launch', 'GPU 空等 CPU 启动'), type: 'host', t0: t, t1: t + gap, layer: -3 }); t += gap; } }
  return { list: out, T: t };
}
// ---------- step 1: whole system ----------
function buildPrompt() {
  setChips([B('Tokenize', '分词'), B('Schedule', '调度'), 'PCIe ↓', 'Prefill', 'Decode', B('Sample → Output', '采样 → 输出')]);
  const s = OPR.step, pf = stepModel('prefill');
  OPR.q.push(seg({ dur: 1.5, chip: 0, label: B('CPU tokenization: “Why is the sky blue?” → BPE token IDs [9, 3521, 18…] (total: ' + CFG.prompt + ')', 'CPU 分词：“为什么天空是蓝色的？” → BPE token id [9, 3521, 18…] (共 ' + CFG.prompt + ' 个)'), dev: B('CPU · µs scale', 'CPU · µs 级'), enter() { act({ cpu: 1 }); } }));
  OPR.q.push(seg({ dur: 1.0, chip: 1, label: B('The inference server (e.g. vLLM) builds the batch, allocates KV blocks and prepares kernel arguments on the CPU', '推理服务器 (vLLM 一类) 在 CPU 上组 batch、分配 KV block、准备 kernel 参数'), dev: B('CPU · Scheduling', 'CPU · 调度'), enter() { act({ cpu: .7 }); } }));
  OPR.q.push(seg({ dur: 1.2, chip: 2, label: B('PCIe: a few KB of token IDs + kernel launch commands → GPU (weights already reside in HBM and bypass PCIe)', 'PCIe：几 KB 的 token id + kernel 启动命令 → GPU (权重早已常驻 HBM，不走 PCIe)'), dev: '~64 GB/s', enter() { act({ cpu: .3, pcie: 1, pcieDir: 1 }); } }));
  OPR.q.push(seg({ dur: 1.8, chip: 3, label: B(`Prefill: process all ${CFG.prompt} prompt tokens in parallel → large GEMM, Tensor Cores fully utilized (≈ ${fT(pf.t)})`, `Prefill：一次并行处理全部 ${CFG.prompt} 个提示词 token → 大 GEMM，Tensor Core 满载 (≈ ${fT(pf.t)})`), dev: B('Compute-bound', '算力受限'), enter() { act({ sm: 1, tc: 1, hbm: .5, l2: .8, smMode: 'full' }); } }));
  OPR.q.push(seg({ dur: 2.6, chip: 4, label: B(`Decode: generate 1 token at a time, but read all ${fB(s.wBytes)} of weights from HBM (≈ ${fT(s.t)}/token)`, `Decode：每次只生成 1 个 token，但要把全部 ${fB(s.wBytes)} 权重从 HBM 读一遍 (≈ ${fT(s.t)}/token)`), dev: B('Bandwidth-bound', '带宽受限'), enter() { act({ sm: 1, tc: .05, hbm: 1, l2: .6, smMode: 'decode' }); }, tick(u) { OPR.tv = fract(u * 3) * OPR.tvMax; } }));
  OPR.q.push(seg({ dur: 1.3, chip: 5, label: B('logits → softmax/sampling (top-p) → new token ID over PCIe to CPU → detokenize → stream output', 'logits → softmax/采样 (top-p) → 新 token id 经 PCIe 回 CPU → detokenize → 流式输出'), dev: 'GPU → CPU', enter() { act({ cpu: .6, pcie: 1, pcieDir: -1 }); } }));
}
// ---------- step 2: OoO CPU core ----------
function buildPipe() {
  setChips([B('Fetch', '取指'), B('Decode/rename', '译码/重命名'), B('Issue', '乱序发射'), B('Execute', '执行'), B('Retire', '按序提交')]);
  oooReset(CFG.mp ? 19 : -1); coreBuild(); CORE.acc = 0; CORE.sub = 0;
  OPR.q.push(seg({ dur: 40, chip: 0, label: B('Dot-product loop (vmovups ×2 → vfmadd231ps → add → cmp/jne) ×6 iterations', '点积循环 (vmovups ×2 → vfmadd231ps → add → cmp/jne) ×6 次迭代'), dev: B('Cycle 0', '周期 0'),
    enter() { act({ cpu: 1 }); },
    tick(u, dt) { CORE.acc += dt; while (CORE.acc >= CORE.cyc) { CORE.acc -= CORE.cyc; oooCycle(); } CORE.sub = CORE.acc / CORE.cyc;
      const P = OOO.prog, n = st => P.filter(p => p.st === st).length; const c = [n('fe'), n('fe') * .5, n('rs'), n('exec'), n('done')]; OPR.chip = c.indexOf(Math.max(...c)); renderChips();
      OPR.dev = B('Cycle ' + OOO.cyc + ' · IPC ' + OOO.ipc.toFixed(2), '周期 ' + OOO.cyc + ' · IPC ' + OOO.ipc.toFixed(2)); const fl = OOO.stall && OOO.cyc < OOO.stall;
      OPR.phase = B(fl ? 'Branch misprediction! Flush younger ROB instructions (red) and fetch from the correct address. Wasted cycles are the cost of speculation' : n('exec') ? `Out-of-order execution: ${n('exec')} instructions at execution ports, ${n('rs')} waiting for operands in RS; later independent instructions hide load latency` : 'Fetch / Decode', fl ? '分支误预测！冲刷 ROB 中更年轻的指令 (红)，从正确地址重新取指 —— 浪费的周期就是乱序核心的代价' : n('exec') ? `乱序执行：${n('exec')} 条在执行端口上，${n('rs')} 条在 RS 里等操作数；load 延迟被后面不相关的指令掩盖` : '取指 / 译码');
    }, done() { return OOO.retired >= OOO.prog.length; }, exit() { let g = 0; while (OOO.retired < OOO.prog.length && g++ < 600) oooCycle(); OPR.result = { cyc: OOO.cyc, ipc: OOO.ipc, fl: OOO.flushes }; } }));
}
// ---------- step 3: GPU launch → SMs in waves ----------
const OCC = { on: new Float32Array(144), tc: new Float32Array(144) };
function buildLaunch() {
  setChips(['cudaLaunchKernel', 'Wave 1', 'Wave 2', 'Wave 3', 'Decode GEMV']);
  const g = GPUS[CFG.gpu], n = g.sms, blocks = 3 * n;
  OPR.q.push(seg({ dur: 1.0, chip: 0, label: B('CPU calls cudaLaunchKernel(gemm, grid = 3 × ' + n + ' thread blocks); commands enter the GPU hardware queue through PCIe', 'CPU 调用 cudaLaunchKernel(gemm, grid = 3 × ' + n + ' 个 thread block)，命令经 PCIe 进入 GPU 的硬件队列'), dev: '~5 µs', enter() { act({ cpu: .8, pcie: 1, pcieDir: 1 }); } }));
  for (let w = 0; w < 3; w++) OPR.q.push(seg({ dur: 1.25, chip: 1 + w, label: B(`GigaThread distributes thread blocks ${w * n}–${(w + 1) * n - 1} across ${n} SMs (wave ${w + 1}/3); each block produces a 128×128 output tile`, `GigaThread 引擎把 thread block ${w * n}–${(w + 1) * n - 1} 分给 ${n} 个 SM (wave ${w + 1}/3)；每块 = 128×128 的输出 tile`), dev: B('Prefill GEMM · Compute-bound', 'Prefill GEMM · 算力受限'), enter() { act({ sm: 1, tc: 1, hbm: .45, l2: .8, wave: w, smMode: 'wave' }); }, tick(u) { ACT.waveU = u; } }));
  OPR.q.push(seg({ dur: 2.4, chip: 4, label: B(`decode (batch ${BATCHES[CFG.batch]}): all SMs are active, but each Tensor Core computes for only ~${(100 * OPR.step.tComp / OPR.step.t).toFixed(1)}% of the time; the rest is spent waiting for HBM`, `decode (batch ${BATCHES[CFG.batch]})：所有 SM 都"在跑"，但每个 Tensor Core 只有 ~${(100 * OPR.step.tComp / OPR.step.t).toFixed(1)}% 时间在算 —— 其余时间在等 HBM`), dev: B('GEMV · Bandwidth-bound', 'GEMV · 带宽受限'), enter() { act({ sm: 1, tc: .04, hbm: 1, l2: .6, smMode: 'decode' }); } }));
}
// ---------- step 4: inside one SM: data path + tensor-core MMA ----------
function buildMMA() {
  setChips(['TMA: HBM→SMEM', 'SMEM→RF', 'MMA k=0…15', B('Store C', '写回 C')]);
  OPR.q.push(seg({ dur: 1.8, chip: 0, label: B('TMA asynchronously moves A/B tiles from HBM through L2 into shared memory (each byte transferred once, then reused)', 'TMA 把 A、B 的 tile 从 HBM 经 L2 异步搬进 shared memory (每字节只搬一次，之后反复用)'), dev: 'HBM → L2 → SMEM', enter() { act({ hbm: 1, l2: 1, smMode: 'path' }); smMMA(-1, 0); } }));
  OPR.q.push(seg({ dur: .9, chip: 1, label: B('ldmatrix: warps load 16×16 A/B fragments into the register file', 'ldmatrix：warp 把 16×16 的 A/B 片段装进寄存器堆'), dev: 'SMEM → RF', enter() { act({ sram: 1, smMode: 'path2' }); } }));
  OPR.q.push(seg({ dur: 3.4, chip: 2, label: B('mma.sync: Tensor Core performs 16×16×16 = 4096 multiply-adds (shown as 16 outer-product accumulations over k)', 'mma.sync：Tensor Core 一次算完 16×16×16 = 4096 个乘加 (这里按 k 展开成 16 次外积累加)'), dev: B('FP16 input · FP32 accumulation', 'FP16 输入 · FP32 累加'), enter() { act({ tc: 1, smMode: 'mma' }); },
    tick(u) { const k = Math.min(15, Math.floor(u * 16)); smMMA(k, (k + 1) / 16); SMV.lab.k.set(() => tr(B(`k = ${k} · C += A[:,${k}] ⊗ B[${k},:] · Accumulated: ${(k + 1) * 256} MAC`, `k = ${k} · C += A[:,${k}] ⊗ B[${k},:] · 已累计 ${(k + 1) * 256} MAC`))); } }));
  OPR.q.push(seg({ dur: 1.0, chip: 3, label: B('C stays in registers to accumulate the next K segment; write back only after all K segments. Data reuse raises arithmetic intensity', 'C tile 留在寄存器里继续累加下一段 K；全部 K 做完才写回 —— 数据复用率 = 算术强度'), dev: B('AI ≈ tens to hundreds of FLOPs per byte', 'AI ≈ 每字节几十~几百 FLOP'), enter() { act({ sram: .5 }); } }));
}
// ---------- step 5: one decode token through the model (kernels) ----------
function buildFwd() {
  const s = OPR.step, TLn = tokenTimeline(s); OPR.tl = TLn; OPR.tvMax = TLn.T;
  setChips(['Embedding', 'Layer 1 (10 kernels)', 'Layer 2…' + s.m.L, 'LM head', B('Sampling', '采样')]);
  OPR.q.push(seg({ dur: .6, chip: 0, label: B('Embedding: select one vector by token ID (d = ' + s.m.d + ')', 'Embedding：按 token id 取一行向量 (d = ' + s.m.d + ')'), dev: fT(s.head[0].t), enter() { act({ hbm: .3, sm: .3, tower: 0 }); OPR.kHi = s.head[0].name; }, tick(u) { OPR.tv = u * s.head[0].t; } }));
  let t0 = s.head[0].t;
  s.lay.forEach((k, j) => { const a = t0; OPR.q.push(seg({ dur: k.type === 'gemm' ? .55 : .36, chip: 1, label: B(`${KERNEL_TEXT[k.name] ? KERNEL_TEXT[k.name].en : k.name}: read ${fB(k.bytes)}, compute ${fF(k.flops)}FLOP → AI ${k.ai.toFixed(1)} FLOP/B → ${k.bound === 'mem' ? 'Memory-bound' : 'Compute-bound'}`, `${KERNEL_TEXT[k.name] ? KERNEL_TEXT[k.name].zh : k.name}：读 ${fB(k.bytes)}，算 ${fF(k.flops)}FLOP → AI ${k.ai.toFixed(1)} FLOP/B → ${k.bound === 'mem' ? '访存受限' : '算力受限'}`), dev: fT(k.t) + ' · ' + (k.type === 'gemm' ? 'GEMM(V)' : k.type), enter() { act({ hbm: k.bound === 'mem' ? 1 : .4, sm: 1, tc: k.type === 'gemm' ? .1 : 0, l2: .6, tower: 100 + j, smMode: 'decode' }); OPR.kHi = k.name; }, tick(u) { OPR.tv = a + u * k.t; } })); t0 += k.t; });
  const L1 = t0, Lend = TLn.list.filter(x => x.layer >= 0).reduce((m, x) => Math.max(m, x.t1), 0);
  OPR.q.push(seg({ dur: 1.6, chip: 2, label: B(`Repeat the same 10 kernels for ${s.m.L - 1} more layers → each layer's weights used only once (batch ${s.B})`, `同样的 10 个 kernel 再重复 ${s.m.L - 1} 层 → 每层的权重都只用一次 (batch ${s.B})`), dev: B('×' + (s.m.L - 1) + ' layers', '×' + (s.m.L - 1) + ' 层'), enter() { act({ hbm: 1, sm: 1, tc: .05, tower: 200, smMode: 'decode' }); OPR.kHi = ''; }, tick(u) { OPR.tv = L1 + u * (Lend - L1); ACT.towerU = u; } }));
  let t1 = Lend; s.tail.forEach((k, j) => { const a = t1; OPR.q.push(seg({ dur: .5, chip: j < 2 ? 3 : 4, label: B(`${KERNEL_TEXT[k.name] ? KERNEL_TEXT[k.name].en : k.name}:${fB(k.bytes)} · ${fT(k.t)}` + (j === 1 ? ` (vocabulary ${s.m.V.toLocaleString()} × d)` : ''), `${KERNEL_TEXT[k.name] ? KERNEL_TEXT[k.name].zh : k.name}：${fB(k.bytes)} · ${fT(k.t)}` + (j === 1 ? ` (词表 ${s.m.V.toLocaleString()} × d)` : '')), dev: fT(k.t), enter() { act({ hbm: 1, sm: .8, tower: 300 + j }); OPR.kHi = k.name; }, tick(u) { OPR.tv = a + u * k.t; } })); t1 += k.t; });
  OPR.q.push(seg({ dur: 1.0, chip: 4, label: B(`One token complete: ${fT(s.t)} (≈ ${fN(s.tokps)} token/s). Total reads: ${fB(s.allBytes)}; weights account for ${(100 * s.wBytes / s.allBytes).toFixed(0)}%`, `一个 token 完成：${fT(s.t)} (≈ ${fN(s.tokps)} token/s)。总读取 ${fB(s.allBytes)}，其中权重占 ${(100 * s.wBytes / s.allBytes).toFixed(0)}%`), dev: B('The next token starts again', '下一个 token 从头再来'), enter() { act({ cpu: .5, pcie: .6, pcieDir: -1 }); OPR.tv = OPR.tvMax; } }));
}
// ---------- step 6 / 8: prefill then decode ----------
const OUTTOK = [B('The sky ', '天空'), B('appears ', '之所以'), B('to be ', '是'), B('blue ', '蓝色'), B('to us', '的'), B(', ', '，'), B(' ', '是'), B('because of ', '因为'), B('Rayleigh ', '瑞利'), B('scattering', '散射'), B('…', '……')];
function buildGen() {
  const pf = stepModel('prefill'), s = OPR.step; OPR.pf = pf;
  setChips(['Prefill ' + CFG.prompt + ' tok', 'Decode ×8']);
  OPR.q.push(seg({ dur: 2.2, chip: 0, label: B(`Prefill: ${CFG.prompt} tokens together → ~${fN(pf.ai)} operations per weight byte → hits the compute ceiling (${fT(pf.t)}, time to first token TTFT)`, `Prefill：${CFG.prompt} 个 token 一起算 → 每读 1 字节权重做 ~${fN(pf.ai)} 次运算 → 撞上算力屋顶 (${fT(pf.t)}，首 token 延迟 TTFT)`), dev: B('Compute-bound · GEMM', '算力受限 · GEMM'), enter() { act({ sm: 1, tc: 1, hbm: .5, l2: .9, towerAll: 1, smMode: 'full' }); OPR.mode = 'prefill'; } }));
  for (let i = 0; i < 8; i++) OPR.q.push(seg({ dur: .85, chip: 1, label: B(`Decode token ${i + 1}: 1 token × ${fB(s.wBytes)} weights → AI ≈ ${s.ai.toFixed(1)} → follows the bandwidth slope (${fT(s.t)}/token · ${fN(s.tokps)} tok/s)`, `Decode token ${i + 1}：1 个 token × ${fB(s.wBytes)} 权重 → AI ≈ ${s.ai.toFixed(1)} → 贴在带宽斜线上 (${fT(s.t)}/token · ${fN(s.tokps)} tok/s)`), dev: B('Bandwidth-bound · GEMV', '带宽受限 · GEMV'), enter() { act({ sm: 1, tc: .05, hbm: 1, l2: .6, tower: 200, smMode: 'decode' }); OPR.mode = 'decode'; }, tick(u) { ACT.towerU = u; OPR.tv = u * OPR.tvMax; }, exit() { OPR.toks.push(OUTTOK[i]); } }));
}
// ---------- step 7: KV cache with continuous batching + PagedAttention ----------
const KVS = { seqs: [], free: [], wCells: 0, cell: 0, nid: 0, rejected: 0, t: 0 };
const SEQCOL = ['#c77dba', '#5fc39c', '#d9a441', '#e58a6f', '#9a8ad6', '#6fb7d9', '#b4c76f', '#d96fa0'];
function kvInit() {
  const s = stepModel('decode'); KVS.cell = s.H.hbm / KVM.n; KVS.wCells = Math.min(KVM.n, Math.ceil(s.wBytes / KVS.cell));
  KVS.free = []; for (let i = KVS.wCells; i < KVM.n; i++) KVS.free.push(i);
  let sd = 77; for (let i = KVS.free.length - 1; i > 0; i--) { sd = (sd * 1103515245 + 12345) >>> 0; const j = sd % (i + 1); [KVS.free[i], KVS.free[j]] = [KVS.free[j], KVS.free[i]]; }
  KVS.seqs = []; KVS.nid = 0; KVS.rejected = 0; KVS.t = 0; KVS.kvTok = kvPerTok(s.m, s.p); KVS.s = s;
}
function kvAdd() { const id = KVS.nid++; const h = fract(Math.sin(id * 91.7) * 4371); KVS.seqs.push({ id, len: 256 + Math.floor(h * 1800), target: 2000 + Math.floor(fract(h * 13.1) * 30000), cells: [], col: SEQCOL[id % 8] }); }
function kvStep(dtok) {
  const maxB = BATCHES[CFG.batch];
  while (KVS.seqs.length < maxB) kvAdd();
  for (const q of KVS.seqs) { q.len += dtok; const need = Math.ceil(q.len * KVS.kvTok / KVS.cell); while (q.cells.length < need) { if (!KVS.free.length) { q.stall = true; break; } q.cells.push(KVS.free.pop()); } }
  for (let i = KVS.seqs.length - 1; i >= 0; i--) { const q = KVS.seqs[i]; if (q.len >= q.target || (q.stall && !KVS.free.length && i === 0)) { if (q.stall) KVS.rejected++; KVS.free.push(...q.cells.reverse()); KVS.seqs.splice(i, 1); } }
}
function buildKV() {
  setChips([B('Resident weights', '权重常驻'), B('Arrivals', '请求到达'), B('KV growth', '逐 token 增长'), 'FlashAttention', B('Finish → Reclaim', '完成 → 回收')]);
  kvInit();
  OPR.q.push(seg({ dur: 1.4, chip: 0, label: B(`Weights occupy ${fB(KVS.s.wBytes)} (blue); the remaining HBM becomes a KV block pool`, `权重先占掉 ${fB(KVS.s.wBytes)} (蓝)；剩下的 HBM 全部切成 KV block 池`), dev: B('KV per token = ' + fB(KVS.kvTok), '每 token KV = ' + fB(KVS.kvTok)), enter() { act({ hbm: .3 }); } }));
  OPR.q.push(seg({ dur: 1.2, chip: 1, label: B(`Scheduler admits ${BATCHES[CFG.batch]} requests: each receives blocks on demand, without physical contiguity (PagedAttention paging)`, `调度器接入 ${BATCHES[CFG.batch]} 个请求：每个请求按需领取 block，物理上不连续 (PagedAttention 的"分页")`), dev: 'continuous batching', enter() { kvStep(0); } }));
  OPR.q.push(seg({ dur: 6.0, chip: 2, label: B('Each new token grows every request\'s KV by 2·L·kv_heads·d_head·bytes; allocate another block when the current one fills', '每生成一个 token，每个请求的 KV 增长 2·L·kv_heads·d_head·bytes；满一块就再领一块'), dev: B('Time accelerated ×1000', '时间加速 ×1000'), enter() { act({ hbm: 1, kv: 1, sram: .6 }); },
    tick(u, dt) { kvStep(dt * 2600); const used = KVM.n - KVS.free.length - KVS.wCells; OPR.dev = B(`KV used: ${fB(used * KVS.cell)} · ${KVS.seqs.length} requests`, `KV 占用 ${fB(used * KVS.cell)} · ${KVS.seqs.length} 个请求`); OPR.chip = u > .35 && u < .7 ? 3 : u >= .7 ? 4 : 2; renderChips(); } }));
}
// ---------- step 9: tensor parallel over NVLink ----------
function buildTP() {
  const s = OPR.step, n = CFG.tp, tl = tokenTimeline(s); OPR.tl = tl; OPR.tvMax = tl.T;
  setChips([B('Shard weights', '切分权重'), B('Local GEMM', '各卡 GEMM'), 'all-reduce', B('× ' + s.m.L + ' layers', '× ' + s.m.L + ' 层')]);
  OPR.q.push(seg({ dur: 1.2, chip: 0, label: B(`TP = ${n}: partition each layer's W by columns/rows into ${n} shards (Megatron style); each GPU stores/reads 1/${n} of weights → ${fB(s.wBytes / n)}/GPU`, `TP = ${n}：每层的 W 按列/行切成 ${n} 份 (Megatron 式)，每卡只存/读 1/${n} 权重 → ${fB(s.wBytes / n)}/卡`), dev: n + ' GPU', enter() { act({ hbm: .4 }); } }));
  for (let r = 0; r < 3; r++) {
    OPR.q.push(seg({ dur: .9, chip: 1, label: B(`Layer ${r + 1}: ${n} GPUs read their own 1/${n} of weights in parallel (aggregate bandwidth ×${n})`, `Layer ${r + 1}：${n} 张卡并行读各自的 1/${n} 权重 (总带宽 ×${n})`), dev: fT(s.tLayer), enter() { act({ hbm: 1, sm: 1, tc: .05, smMode: 'decode' }); }, tick(u) { OPR.tv = (r + u * .8) * s.tGPU / s.m.L; } }));
    OPR.q.push(seg({ dur: .7, chip: 2, label: B(n > 1 ? `all-reduce: combine partial sums over NVLink/NVSwitch (2 per layer · ${fT(s.tAR / s.m.L)} · mainly latency-bound)` : 'TP = 1: no communication needed', n > 1 ? `all-reduce：把各卡的部分和经 NVLink/NVSwitch 相加 (每层 2 次 · ${fT(s.tAR / s.m.L)} · 多是延迟，不是带宽)` : 'TP = 1：不需要通信'), dev: n > 1 ? (GPUS[CFG.gpu].nvl / 1e9).toFixed(0) + ' GB/s' : '—', enter() { act({ nvl: n > 1 ? 1 : 0, hbm: .2 }); }, tick(u) { OPR.tv = (r + .8 + u * .2) * s.tGPU / s.m.L; } }));
  }
  OPR.q.push(seg({ dur: 1.4, chip: 3, label: B(`Per token: ${fT(s.t)}; weight reads ÷${n}, but add ${fT(s.tAR)} of communication${s.cpuBound ? '; CPU kernel launches also lag, leaving the GPU idle' : ''}`, `每 token ${fT(s.t)}：权重读取 ÷${n}，但多了 ${fT(s.tAR)} 通信${s.cpuBound ? '；且 CPU 启动 kernel 跟不上 → GPU 在空等' : ''}`), dev: fN(s.tokps) + ' tok/s', enter() { act({}); OPR.tv = OPR.tvMax; } }));
}
