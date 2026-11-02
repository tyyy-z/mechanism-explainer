// ================= UI: trail, controls, why box, scope, readouts, tooltip =================
let CUR = 0, SCOPE = 'kern', WHYTAB = 'why';
const ANSWERS = {};
const ICON = {
  play: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8-5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx=".6"/><rect x="9.4" y="3" width="2.6" height="10" rx=".6"/></svg>',
  check: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg>',
};
function setBtn(el, html) { if (el._h !== html) { el.innerHTML = html; el._h = html; } }
function scopePal() {
  return document.body.classList.contains('light')
    ? { fg: '#111113', tx2: '#3e3f44', mu: '#66686e', dim: '#b4b4ba', grid: 'rgba(17,17,19,.07)', base: '#c8c8cd', tr: '#111113', acc: '#2f6fbd', cur: 'rgba(47,111,189,.12)', ok: '#22704f', bad: '#b02a43', warn: '#9a6a10' }
    : { fg: '#f2f2f3', tx2: '#bdbdc0', mu: '#8a8c92', dim: '#55555b', grid: 'rgba(255,255,255,.055)', base: '#3a3a3e', tr: '#f2f2f3', acc: '#4a8ad6', cur: 'rgba(74,138,214,.14)', ok: '#5fc39c', bad: '#e5566f', warn: '#d9a441' };
}
let SC = scopePal();
const cpuPeak = () => CPUSPEC.peak * ({ scalar: 1 / 16, AVX2: .5, AVX512: 1 })[CFG.simd];
// toast: also publishes its rect (design px) so 3D labels avoid it
function toast(msg, ms = 3800) {
  const t = $('toast'); toast.msg = msg; t.textContent = tr(typeof msg === 'function' ? msg() : msg); t.style.opacity = 1; toast.until = SIM.t + ms / 1000 * Math.max(1, SIM.speed);
  const r = t.getBoundingClientRect(), s = $('stage').getBoundingClientRect();
  TOASTRECT = { x0: (r.left - s.left) / stageScale - 6, y0: (r.top - s.top) / stageScale - 6, x1: (r.right - s.left) / stageScale + 6, y1: (r.bottom - s.top) / stageScale + 6 };
}
function tickToast() { if (toast.until && SIM.t > toast.until) { $('toast').style.opacity = 0; toast.until = 0; TOASTRECT = null; } }
function renderTrail() {
  $('steps').innerHTML = STEPS.map((s, i) => { const title = tr(s.title), parts = title.split(LANG === 'zh' ? '：' : ': '); return `<div class="st ${i === CUR ? 'cur' : i < CUR ? 'done' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="${tr(B('Step', '步骤'))} ${i + 1}: ${title}"><div class="nd">${i < CUR ? ICON.check : String(i + 1).padStart(2, '0')}</div><div><div class="tt">${parts[0]}</div><div class="sb">${parts[1] || tr(s.sub)}</div></div></div>`; }).join('');
}
$('steps').addEventListener('click', e => { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } });
$('steps').addEventListener('keydown', e => { if (e.key === 'Enter') { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } } });
function renderChips() { const h = OPR.chips.map((c, i) => `<span class="${i === OPR.chip ? 'on' : i < OPR.chip ? 'done' : ''}">${tr(c)}</span>`).join(''); if (h !== renderChips.last) { $('cmdseq').innerHTML = h; renderChips.last = h; } }
// ---------- why box ----------
function renderWhy() {
  const s = STEPS[CUR]; const b = $('whybody');
  document.querySelectorAll('#whytabs button').forEach(x => x.classList.toggle('on', x.dataset.t === WHYTAB));
  if (WHYTAB === 'why') b.innerHTML = tr(s.why);
  else if (WHYTAB === 'math') b.innerHTML = tr(s.math);
  else if (WHYTAB === 'ex') b.innerHTML = tr(s.try);
  else if (WHYTAB === 'quiz') { const q = s.quiz; b.innerHTML = `<div class="quiz"><div class="q">${tr(q.q)}</div><div class="opts">${q.opts.map((o, i) => `<button data-i="${i}">${String.fromCharCode(65 + i)}. ${tr(o)}</button>`).join('')}</div><div class="fb" id="qfb"></div></div>`; }
  else if (WHYTAB === 'src') b.innerHTML = tr(B(`<p class="note">Sources for this step (all public; hardware values = typical public specifications, internal model parameters = illustrative):</p><ol style="margin:0;padding-left:18px;font-size:12px;line-height:1.55">${s.src.map(k => `<li>${tr(SRC[k])}</li>`).join('')}</ol>`, `<p class="note">本步引用 (全部为公开资料；硬件数值 = 典型公开规格，模型内部参数 = 示意)：</p><ol style="margin:0;padding-left:18px;font-size:12px;line-height:1.55">${s.src.map(k => `<li>${tr(SRC[k])}</li>`).join('')}</ol>`)) + (CUR === STEPS.length - 1 ? tr(B(`<p class="note" style="margin-top:6px"><b>Simplifications:</b> a per-kernel Roofline upper-bound estimate, ignoring cache hits and kernel fusion details, with fixed 1 µs gaps and illustrative CPU overhead/all-reduce latency. Real systems typically reach 60–90% of peak bandwidth. 3D geometry uses illustrative proportions and does not represent a specific chip layout. The CPU is a generic textbook out-of-order core.</p>`, `<p class="note" style="margin-top:6px"><b>简化说明：</b>性能模型是逐 kernel 的 roofline 上界估计 (无缓存命中、无 kernel 融合细节、固定 1 µs 间隙、示意的 CPU 开销与 all-reduce 延迟)；真实系统通常只达到峰值带宽的 60–90%。3D 几何为示意比例，不代表任何具体芯片版图。CPU 核心为通用教科书式乱序核心。</p>`)) : '');
  if (WHYTAB === 'quiz' && ANSWERS[CUR] != null) renderAnswer();
  if (window.renderMathInElement) try { renderMathInElement(b, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (e) { }
}
$('whytabs').addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; userTook(); WHYTAB = t.dataset.t; renderWhy(); });
$('whybody').addEventListener('click', e => { const t = e.target.closest('.quiz button'); if (!t) return; userTook(); const q = STEPS[CUR].quiz, i = +t.dataset.i; ANSWERS[CUR] = i; document.querySelectorAll('.quiz button').forEach((x, j) => { x.classList.remove('right', 'wrong'); if (j === q.a && i === q.a) x.classList.add('right'); }); if (i !== q.a) t.classList.add('wrong'); $('qfb').innerHTML = i === q.a ? tr(B('<span class="ok">Correct</span> ', '<span class="ok">正确</span>　')) + tr(q.fb) : tr(B('<span class="no">Incorrect</span> Try again. Hint: revisit the Why tab.', '<span class="no">不对</span>　再想想。提示：看「原理」标签页。')); });
// ---------- controls ----------
function cfgChanged() { if (STEPS[CUR].id === 'kv' && !OPR.running) kvInit(); syncControls(); updateReadouts(); }
function setGPU(v) { CFG.gpu = v; CFG.bw = GPUS[v].bw / 1e12; CFG.peak = GPUS[v].peak / 1e12; }
function segBind(id, key, conv, after) {
  $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; userTook(); const v = conv ? conv(b.dataset.v) : b.dataset.v; if (after) after(v); else CFG[key] = v; cfgChanged(); });
}
segBind('gpu', 'gpu', null, v => setGPU(v));
segBind('model', 'model', Number); segBind('prec', 'prec'); segBind('tp', 'tp', Number);
segBind('graphs', 'graphs', v => v === '1'); segBind('simd', 'simd'); segBind('mp', 'mp', v => v === '1');
const rng = (id, key) => $(id).addEventListener('input', e => { userTook(); CFG[key] = +e.target.value; cfgChanged(); });
rng('batch', 'batch'); rng('ctx', 'ctx'); rng('prompt', 'prompt'); rng('bw', 'bw'); rng('peak', 'peak');
$('btnRun').addEventListener('click', () => { userTook(); runCurrent(); });
$('btnStepOp').addEventListener('click', () => { userTook(); if (OPR.running) nextSeg(); });
$('btnPause').addEventListener('click', () => { userTook(); SIM.paused = !SIM.paused; setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause); });
$('speed').addEventListener('change', e => { userTook(); SIM.speed = +e.target.value; });
$('btnExplode').addEventListener('click', () => { userTook(); toggleExplode(); });
$('btnReset').addEventListener('click', () => { userTook(); user.daz = user.del = 0; user.zoom = 1; });
$('btnTheme').addEventListener('click', () => { document.body.classList.toggle('light'); });
$('btnAuto').addEventListener('click', () => { restartAutoplay(); });
document.querySelectorAll('#scopetabs button').forEach(b => b.addEventListener('click', () => { userTook(); SCOPE = b.dataset.s; syncControls(); }));
function runCurrent() { const s = STEPS[CUR]; if (OPR.running) abortOp(); startOp(s.op); syncControls(); }
function rangeFill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%'); }
const ROWS = ['r-gpu', 'r-model', 'r-prec', 'r-batch', 'r-ctx', 'r-prompt', 'r-bw', 'r-peak', 'r-tp', 'r-graphs', 'r-simd', 'r-mp'];
const kfmt = n => n >= 1024 ? (n / 1024) + 'K' : n;
function syncControls() {
  const s = STEPS[CUR];
  ROWS.forEach(id => $(id).style.display = s.rows.includes(id) ? '' : 'none');
  const on = (id, v) => document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  on('gpu', CFG.gpu); on('model', CFG.model); on('prec', CFG.prec); on('tp', CFG.tp); on('graphs', CFG.graphs ? 1 : 0); on('simd', CFG.simd); on('mp', CFG.mp ? 1 : 0);
  document.querySelectorAll('#prec button').forEach(b => { const dis = b.dataset.v === 'FP8' && !GPUS[CFG.gpu].fp8; b.classList.toggle('dis', dis); b.title = dis ? tr(B('A100 has no FP8 Tensor Cores: uses FP16 compute rate; only bytes are reduced', 'A100 无 FP8 Tensor Core：按 FP16 速率计算，只省字节')) : ''; });
  $('batch').value = CFG.batch; $('batchv').textContent = BATCHES[CFG.batch];
  $('ctx').value = CFG.ctx; $('ctxv').textContent = kfmt(CTXS[CFG.ctx]);
  $('prompt').value = CFG.prompt; $('promptv').textContent = CFG.prompt;
  $('bw').value = CFG.bw; $('bwv').textContent = CFG.bw.toFixed(2) + ' TB/s';
  $('peak').value = CFG.peak; $('peakv').textContent = Math.round(CFG.peak) + ' TF';
  setBtn($('btnRun'), OPR.running ? tr(B('<span class="spin"></span>Running…', '<span class="spin"></span>运行中…')) : ICON.play + tr(B('Run ', '运行 ')) + ({ PROMPT: tr(B('request', '一次请求')), PIPE: tr(B('dot product', '点积循环')), LAUNCH: tr(B('kernel launch', 'kernel 启动')), MMA: 'MMA', FWD: tr(B('1 token', '1 个 token')), GEN: 'prefill + decode', KV: tr(B('continuous batch', '连续批处理')), TP: tr(B('tensor parallel', '张量并行')) })[s.op]);
  setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause);
  document.querySelectorAll('#ctl input[type=range]').forEach(rangeFill);
  $('btnRun').disabled = OPR.running; $('btnRun').parentElement.style.display = s.run ? '' : 'none';
  $('btnStepOp').title = tr(B('Next phase', '跳到下一阶段'));
  document.querySelectorAll('#scopetabs button').forEach(b => b.classList.toggle('on', b.dataset.s === SCOPE));
}
// ---------- readouts ----------
const roW = (t, a) => [...String(t).replace(/<[^>]+>/g, '')].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 12 : a), 0);
function ro(pairs) { const h = pairs.map(([k, v]) => `<div${roW(k, 6.4) + roW(v, 7.3) > 150 ? ' class="w"' : ''}><span>${k}</span><b>${v}</b></div>`).join(''); if (h !== ro.last) { $('readouts').innerHTML = h; ro.last = h; } }
const fit = s => s.fits ? tr(B('<span class="pos">Fits</span>', '<span class="pos">装得下</span>')) : tr(B('<span class="neg">Does not fit</span>', '<span class="neg">装不下</span>'));
const bound = s => s.cpuBound ? tr(B('<span class="neg">CPU launch</span>', '<span class="neg">CPU 启动</span>')) : s.tMem >= s.tComp ? tr(B('<span class="neg">HBM bandwidth</span>', '<span class="neg">HBM 带宽</span>')) : tr(B('<span class="pos">Compute</span>', '<span class="pos">算力</span>'));
function updateReadouts() {
  const id = STEPS[CUR].id, s = stepModel('decode'), g = GPUS[CFG.gpu];
  if (id === 'sys') { const pf = stepModel('prefill'); ro([[tr(B('Model (public shape)', '模型 (公开形状)')), s.m.ref], [tr(B('Parameters', '参数量')), (s.m.P / 1e9).toFixed(1) + ' B'], [tr(B('Weight bytes', '权重字节')), fB(s.wBytes)], ['Prefill (TTFT)', fT(pf.t)], ['Decode / token', fT(s.t)], [tr(B('Request speed', '单请求速度')), fN(s.tokps) + ' tok/s'], [tr(B('PCIe token IDs', 'PCIe 传 token id')), fB(CFG.prompt * 4) + ' ≈ ' + fT(CFG.prompt * 4 / 64e9 + 2e-6)], [tr(B('HBM capacity', 'HBM 容量')), fit(s)]]); }
  else if (id === 'cpu') ro([[tr(B('Cycles', '周期')), OOO.cyc], [tr(B('Retired / total', '已提交 / 总数')), OOO.retired + ' / ' + (OOO.prog.length || 30)], ['IPC', OOO.ipc ? OOO.ipc.toFixed(2) : '—'], [tr(B('Flushes', '冲刷次数')), OOO.flushes], [tr(B('CPU peak (illustrative)', 'CPU 峰值 (示意)')), (cpuPeak() / 1e12).toFixed(2) + ' TFLOP/s'], [tr(B('DDR5 BW (illustrative)', 'DDR5 带宽 (示意)')), '0.30 TB/s'], [tr(B('vs H100 compute', 'vs H100 算力')), '÷' + Math.round(989e12 / cpuPeak())], [tr(B('vs H100 bandwidth', 'vs H100 带宽')), '÷' + Math.round(3.35 / .3)]]);
  else if (id === 'gpu') ro([['GPU', g.name], [tr(B('SMs enabled / full', 'SM 启用 / 满配')), g.sms + ' / ' + g.smsFull], [tr(B('FP16 dense peak', '峰值 FP16 dense')), (g.peak / 1e12).toFixed(0) + ' TFLOP/s'], ['HBM', fB(g.hbm) + ' · ' + (g.bw / 1e12).toFixed(2) + ' TB/s'], [tr(B('Ridge I*', '平衡点 I*')), (s.pk / s.H.bw).toFixed(0) + ' FLOP/B'], ['decode AI (B=' + s.B + ')', s.ai.toFixed(1) + ' FLOP/B'], [tr(B('Decode TC use', 'decode Tensor Core 利用率')), (100 * s.tComp / s.t).toFixed(2) + '%'], ['L2', g.l2 + ' MB']]);
  else if (id === 'sm') { const pf = stepModel('prefill'); ro([[tr(B('Per SM/cycle (FP16)', '每 SM 每周期 (FP16)')), tr(B('4096 FLOP (inferred)', '4096 FLOP (由公开峰值反推)'))], [tr(B('One MMA (illustrative)', '一条 MMA (示意)')), '16×16×16 = 4096 MAC'], ['GEMV AI (M=1)', '≈ ' + (2 / s.p.w).toFixed(1) + ' FLOP/B'], ['GEMM AI (M=' + CFG.prompt + ')', fN(pf.lay[6].ai) + ' FLOP/B'], [tr(B('Ridge point', '平衡点')), (s.pk / s.H.bw).toFixed(0) + ' FLOP/B'], [tr(B('Peak (', '峰值 (')) + CFG.prec + ')', (s.pk / 1e12).toFixed(0) + ' TFLOP/s']]); }
  else if (id === 'fwd') { const k = OPR.kHi ? [...s.head, ...s.lay, ...s.tail].find(x => x.name === OPR.kHi) : null; const gemT = s.m.L * s.lay.filter(x => x.type === 'gemm').reduce((a, x) => a + x.t, 0) + s.tail[1].t; ro([['kernel / token', s.nK], [tr(B('Per token', '每 token')), fT(s.t)], [tr(B('GEMM time share', 'GEMM 时间占比')), (100 * gemT / s.t).toFixed(0) + '%'], [tr(B('Attention share', 'Attention 占比')), (100 * s.m.L * s.lay[3].t / s.t).toFixed(1) + '%'], [tr(B('Current kernel', '当前 kernel')), k ? kernelText(k.name) : '—'], [tr(B('Read / compute', '读 / 算')), k ? fB(k.bytes) + ' / ' + fF(k.flops) + 'FLOP' : '—'], [tr(B('Time · Bound', '时间 · 受限')), k ? fT(k.t) + ' · ' + (k.bound === 'mem' ? tr(B('Memory', '访存')) : tr(B('Compute', '算力'))) : '—'], [tr(B('Weights / all reads', '权重占总读取')), (100 * s.wRead / s.allBytes).toFixed(0) + '%']]); }
  else if (id === 'pd') { const pf = stepModel('prefill'); ro([[tr(B('Prefill time (TTFT)', 'Prefill 时间 (TTFT)')), fT(pf.t)], ['Prefill AI', fN(pf.ai) + ' FLOP/B'], [tr(B('Prefill bound', 'Prefill 受限于')), bound(pf)], [tr(B('Prefill throughput', 'Prefill 吞吐')), fN(pf.tokps) + ' tok/s'], ['Decode / token', fT(s.t)], ['Decode AI', s.ai.toFixed(1) + ' FLOP/B'], [tr(B('Decode bound', 'Decode 受限于')), bound(s)], [tr(B('Generated', '已生成')), OPR.toks.length ? OPR.toks.map(tr).join('') : '—']]); }
  else if (id === 'kv') { const used = KVS.cell ? KVM.n - KVS.free.length - KVS.wCells : 0; ro([['KV / token', fB(kvPerTok(s.m, s.p))], [tr(B('KV / request (', '单请求 KV (')) + kfmt(s.ctx) + ')', fB(s.ctx * kvPerTok(s.m, s.p))], [tr(B('KV for B × ctx', 'B × ctx 的 KV')), fB(s.kvBytes)], [tr(B('Weights', '权重')), fB(s.wBytes)], [tr(B('Required / HBM', '需求 / HBM')), fB(s.need) + ' / ' + fB(s.H.hbm)], [tr(B('Fits in HBM', '是否装得下')), fit(s)], [tr(B('Active requests (anim.)', '活跃请求 (动画)')), KVS.seqs.length], [tr(B('KV blocks (anim.)', 'KV block 占用 (动画)')), KVS.cell ? fB(used * KVS.cell) : '—']]); }
  else if (id === 'sim') ro([[tr(B('Step time', '每步时间')), fT(s.t)], [tr(B('Total throughput', '总吞吐')), fN(s.tokps) + ' tok/s'], [tr(B('Per user', '每用户')), fN(1 / s.t) + ' tok/s'], [tr(B('Bottleneck', '瓶颈')), bound(s)], [tr(B('Bytes/bandwidth', '字节/带宽')), fT(s.tMem)], [tr(B('FLOPs/peak', 'FLOP/峰值')), fT(s.tComp)], [tr(B('Weights + KV', '权重 + KV')), fB(s.wBytes) + ' + ' + fB(s.kvBytes)], ['HBM ' + fB(s.H.hbm), fit(s)]]);
  else if (id === 'multi') ro([[tr(B('TP GPUs', 'TP 卡数')), CFG.tp], [tr(B('Weights / GPU', '每卡权重')), fB(s.wBytes / CFG.tp)], [tr(B('Per token', '每 token')), fT(s.t)], [tr(B('All-reduce total', 'all-reduce 合计')), fT(s.tAR) + ' (' + (100 * s.tAR / s.t).toFixed(0) + '%)'], [tr(B('GPU time', 'GPU 时间')), fT(s.tGPU)], [tr(B('CPU launch time', 'CPU 发射时间')), fT(s.tCPU)], [tr(B('Bottleneck', '瓶颈')), bound(s)], [tr(B('Total HBM', 'HBM 合计')), fit(s)]]);
}
// ---------- scope ----------
const sc = $('scope'); let sg = sc.getContext('2d'), SW = 0, SH = 0;
function sizeScope() { const r = sc.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); SW = sc.clientWidth; SH = sc.clientHeight; sc.width = Math.round(Math.max(1, r.width) * dpr); sc.height = Math.round(Math.max(1, r.height) * dpr); sg.setTransform(sc.width / Math.max(1, SW), 0, 0, sc.height / Math.max(1, SH), 0, 0); }
const CAP = {
  roof: B('Roofline (log–log): solid = GPU min(peak, AI×bandwidth); dashed = CPU. Circles = decode kernels; ◆ = prefill. Further left means more bandwidth-limited.', 'Roofline (双对数)：实线 = GPU 屋顶 min(峰值, AI×带宽)，虚线 = CPU。圆点 = 当前配置下 decode 的各 kernel，◆ = prefill。点越靠左越受带宽限制。'),
  hbm: B('Left: HBM bytes read per step (weights / KV / activations). Right: weights + KV versus context length (log scale); dashed = HBM capacity.', '左：每步从 HBM 读的字节 (权重 / KV / 激活)。右：权重 + KV 总量随上下文长度增长 (对数)，虚线 = HBM 容量。'),
  kern: B('Top: all kernels for one decode token, scaled by time. Middle: CPU launches. Bottom: 10 kernels in one layer. Vertical line = current animation time.', '上：一个 decode token 的全部 kernel (时间按比例)；中：CPU 发射；下：放大一层的 10 个 kernel。竖线 = 动画当前位置。'),
  occ: B('Each cell = 1 SM (144 on full die). Bright border = active thread block; fill height = actual Tensor Core utilization. Dark = disabled on this SKU.', '每格 = 1 个 SM (满配 144)。亮框 = 正在运行 thread block，填充高度 = Tensor Core 实际利用率。暗格 = 该 SKU 未启用。'),
};
function ytk(g, s, y, x0, x1) { g.strokeStyle = SC.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, Math.round(y) + .5); g.lineTo(x1, Math.round(y) + .5); g.stroke(); txt(g, s, x0 - 5, y + 4, SC.mu, 'right'); }
function txt(g, s, x, y, col = SC.mu, al = 'left', f = '11px "JetBrains Mono","Noto Sans SC",monospace') { g.fillStyle = col; g.font = f; g.textAlign = al; g.fillText(s, x, y); }
const SANS = '11px "Public Sans","Noto Sans SC",sans-serif';
const SCOPEINFO = { win: 0, op: 0 };
function drawScope() {
  const g = sg, W = SW, H = SH; if (!W || !H) return; g.clearRect(0, 0, W, H);
  SC = scopePal(); if ($('scopecap').textContent !== tr(CAP[SCOPE])) $('scopecap').textContent = tr(CAP[SCOPE]);
  const s = stepModel('decode');
  if (SCOPE === 'roof') {
    const L = 44, R = W - 8, T = 10, YB = H - 26, x = ai => L + (Math.log10(ai) + 1) / 5 * (R - L), y = p => YB - (Math.log10(p) - 10) / 6 * (YB - T);
    for (let e = 10; e <= 16; e++) ytk(g, e === 12 ? '1T' : e === 15 ? '1P' : '1e' + e, y(10 ** e), L, R);
    for (let e = -1; e <= 4; e++) { const xx = x(10 ** e); g.strokeStyle = SC.grid; g.beginPath(); g.moveTo(xx + .5, T); g.lineTo(xx + .5, YB); g.stroke(); txt(g, e < 0 ? '0.1' : String(10 ** e), xx, YB + 13, SC.mu, 'center'); }
    txt(g, tr(B('Arithmetic intensity FLOP/Byte →', '算术强度 FLOP/Byte →')), R, YB + 24, SC.mu, 'right', SANS); txt(g, 'FLOP/s', L - 40, T + 8, SC.mu, 'left');
    const curve = (bw, pk, col, dash) => { g.strokeStyle = col; g.lineWidth = 1.6; g.setLineDash(dash ? [4, 3] : []); g.beginPath(); for (let i = 0; i <= 100; i++) { const ai = 10 ** (-1 + i * .05), p = Math.max(1e10, roof(ai, bw, pk)); i ? g.lineTo(x(ai), y(p)) : g.moveTo(x(ai), y(p)); } g.stroke(); g.setLineDash([]); };
    curve(cpuBW(), cpuPeak(), SC.mu, true); curve(s.H.bw, s.pk, SC.acc, false);
    const rid = s.pk / s.H.bw; g.strokeStyle = SC.dim; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x(rid), y(s.pk)); g.lineTo(x(rid), YB); g.stroke(); g.setLineDash([]);
    txt(g, 'ridge ≈ ' + rid.toFixed(0), x(rid) + 4, YB - 6, SC.tx2);
    txt(g, GPUS[CFG.gpu].name.split(' ')[0] + ' ' + (s.pk / 1e12).toFixed(0) + ' TF', x(1e4) - 2, y(s.pk) - 5, SC.acc, 'right');
    txt(g, 'CPU ' + (cpuPeak() / 1e12).toFixed(1) + ' TF', x(1e4) - 2, y(cpuPeak()) - 5, SC.mu, 'right');
    const dot = (k, col, r, ring) => { const p = k.flops / k.t; if (!(k.ai > 0)) return; const xx = x(clamp(k.ai, .1, 1e4)), yy = y(clamp(p, 1e10, 1e16)); g.fillStyle = col; g.beginPath(); g.arc(xx, yy, r, 0, 7); g.fill(); if (ring) { g.strokeStyle = SC.fg; g.lineWidth = 1.5; g.beginPath(); g.arc(xx, yy, r + 3, 0, 7); g.stroke(); } return [xx, yy]; };
    s.lay.forEach(k => dot(k, KCOL[k.type], 3.5, OPR.kHi === k.name)); dot(s.tail[1], KCOL.gemm, 3.5, OPR.kHi === s.tail[1].name);
    const dp = dot({ ai: s.ai, flops: s.flops, t: s.t }, SC.fg, 5, OPR.mode === 'decode'); if (dp) txt(g, 'decode B=' + s.B, dp[0] + 9, dp[1] + 4, SC.fg, 'left', SANS);
    const pf = stepModel('prefill'); const pp = [x(clamp(pf.ai, .1, 1e4)), y(clamp(pf.flops / pf.t, 1e10, 1e16))];
    g.fillStyle = COL.attn; g.beginPath(); g.moveTo(pp[0], pp[1] - 6); g.lineTo(pp[0] + 6, pp[1]); g.lineTo(pp[0], pp[1] + 6); g.lineTo(pp[0] - 6, pp[1]); g.fill(); if (OPR.mode === 'prefill' && OPR.running) { g.strokeStyle = SC.fg; g.lineWidth = 1.5; g.strokeRect(pp[0] - 9, pp[1] - 9, 18, 18); }
    txt(g, 'prefill', pp[0] - 9, pp[1] + 18, COL.attn, 'right', SANS);
    if (STEPS[CUR].id === 'cpu') { const cp = roof(s.ai, cpuBW(), cpuPeak()); const xx = x(s.ai), yy = y(cp); g.strokeStyle = SC.fg; g.lineWidth = 1.5; g.beginPath(); g.arc(xx, yy, 5, 0, 7); g.stroke(); txt(g, tr(B('CPU decode ≈ ', 'CPU 跑 decode ≈ ')) + fN(cp / s.flops) + ' tok/s', xx + 9, yy + 14, SC.fg, 'left', SANS); }
    SCOPEINFO.win = 0; SCOPEINFO.op = 0;
  } else if (SCOPE === 'hbm') {
    const T = 16, YB = H - 26, bx = 14, bw = Math.min(70, W * .2);
    const tot = s.allBytes, parts = [[tr(B('Weights', '权重')), s.wRead, COL.w], ['KV', s.kvBytes, COL.kv], [tr(B('Activations', '激活')), s.actBytes, COL.act]];
    let yy = YB; parts.forEach(([n, v, c]) => { const h = (YB - T) * v / tot; g.fillStyle = c; g.fillRect(bx, yy - h, bw, Math.max(0, h - 1)); if (h > 14) txt(g, n, bx + bw / 2, yy - h / 2 + 4, '#111', 'center', SANS); yy -= h; });
    txt(g, tr(B('Read/step: ', '每步读 ')) + fB(tot), bx, T - 4, SC.tx2, 'left', SANS); txt(g, '÷ BW = ' + fT(tot / s.H.bw), bx, YB + 16, SC.tx2, 'left', SANS);
    const L = bx + bw + 46, R = W - 8, x = c => L + (Math.log2(c) - 9) / 8 * (R - L), y = b => YB - (Math.log10(b) - 8) / 5 * (YB - T);
    for (let e = 8; e <= 13; e++) ytk(g, e === 9 ? '1G' : e === 12 ? '1T' : e === 11 ? '100G' : e === 10 ? '10G' : e === 13 ? '10T' : '100M', y(10 ** e), L, R);
    CTXS.forEach((c, i) => { if (i % 2 === 0) txt(g, kfmt(c), x(c), YB + 13, SC.mu, 'center'); });
    const kvt = kvPerTok(s.m, s.p) * s.B;
    g.strokeStyle = COL.w; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, y(s.wBytes)); g.lineTo(R, y(s.wBytes)); g.stroke();
    g.strokeStyle = COL.kv; g.lineWidth = 2; g.beginPath(); CTXS.forEach((c, i) => { const v = s.wBytes + kvt * c; i ? g.lineTo(x(c), y(Math.min(1e13, v))) : g.moveTo(x(c), y(v)); }); g.stroke();
    g.strokeStyle = SC.bad; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(L, y(s.H.hbm)); g.lineTo(R, y(s.H.hbm)); g.stroke(); g.setLineDash([]);
    txt(g, 'HBM ' + fB(s.H.hbm), R, y(s.H.hbm) - 4, SC.bad, 'right', SANS); txt(g, tr(B('Weights', '权重')), L + 2, y(s.wBytes) + 13, COL.w, 'left', SANS); g.fillStyle = COL.kv; g.fillRect(L + 4, T + 2, 10, 3); txt(g, tr(B('Weights + KV (B=', '权重 + KV (B=')) + s.B + ')', L + 18, T + 7, COL.kv, 'left', SANS);
    const cx = x(s.ctx), cy = y(s.wBytes + kvt * s.ctx); g.fillStyle = SC.fg; g.beginPath(); g.arc(cx, cy, 4.5, 0, 7); g.fill();
    SCOPEINFO.win = 0; SCOPEINFO.op = 0;
  } else if (SCOPE === 'kern') {
    const tl = (OPR.running && OPR.tl) ? OPR.tl : tokenTimeline(s), Tt = Math.max(tl.T, s.tCPU), L = 8, R = W - 8, x = t => L + t / Tt * (R - L);
    txt(g, tr(B('One token: ', '一个 token：')) + fT(tl.T) + ' · ' + s.nK + ' kernels', L, 12, SC.tx2, 'left', SANS);
    const y0 = 20, y1 = 44;
    for (const k of tl.list) { g.fillStyle = KCOL[k.type] || SC.mu; const a = x(k.t0), b = x(k.t1); g.fillRect(a, y0, Math.max(.6, b - a), y1 - y0); }
    txt(g, 'CPU', L, y1 + 20, SC.mu, 'left', SANS);
    const launch = CFG.graphs ? .3e-6 : 8e-6; g.fillStyle = SC.dim; g.fillRect(x(0) + 28, y1 + 10, Math.max(1, x(s.tCPU) - x(0) - 28), 10);
    txt(g, CFG.graphs ? tr(B('CUDA Graph replay · ', 'CUDA Graph 一次重放 · ')) + fT(s.tCPU) : tr(B('eager: ', 'eager：')) + s.nK + ' × ' + fT(launch) + ' = ' + fT(s.tCPU), R, y1 + 32, s.cpuBound ? SC.bad : SC.mu, 'right', SANS);
    // zoom: one layer
    const zy0 = y1 + 48, zy1 = Math.min(H - 10, zy0 + 56), lay = s.lay, Lt = lay.reduce((a, k) => a + k.t, 0);
    txt(g, tr(B('Zoom: layer 1, ', '放大：第 1 层 ')) + fT(Lt) + ' (× ' + s.m.L + tr(B(' layers)', ' 层)')), L, zy0 - 4, SC.tx2, 'left', SANS);
    let t = 0; lay.forEach(k => { const a = L + t / Lt * (R - L), w = k.t / Lt * (R - L); g.fillStyle = KCOL[k.type]; g.globalAlpha = OPR.kHi && OPR.kHi !== k.name ? .45 : 1; g.fillRect(a, zy0 + 2, Math.max(1, w - 1.5), zy1 - zy0 - 22); g.globalAlpha = 1; if (OPR.kHi === k.name) { g.strokeStyle = SC.fg; g.lineWidth = 1.5; g.strokeRect(a - 1, zy0 + 1, w + .5, zy1 - zy0 - 20); } if (w > 34) txt(g, kernelText(k.name).replace(' GEMM', '').replace('Attention (paged)', 'Attn').replace('RoPE + write KV', 'RoPE').replace('Add + RMSNorm', '+Norm').replace('Residual add', '+').replace('SiLU × mul', 'SiLU'), a + 3, zy1 - 8, SC.tx2, 'left', '10px "JetBrains Mono","Noto Sans SC",monospace'); t += k.t; });
    if (OPR.running && OPR.tvMax) { const cx = x(clamp(OPR.tv, 0, tl.T)); g.fillStyle = SC.cur; g.fillRect(L, y0 - 3, cx - L, y1 - y0 + 6); g.strokeStyle = SC.fg; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, y0 - 4); g.lineTo(cx, y1 + 4); g.stroke(); }
    SCOPEINFO.win = Tt; SCOPEINFO.op = tl.T;
  } else if (SCOPE === 'occ') {
    const gg = GPUS[CFG.gpu], cols = 18, rows = 8, pad = 8, cw = (W - 2 * pad) / cols, ch = Math.min((H - 40) / rows, cw * 1.1);
    for (let i = 0; i < 144; i++) {
      const c = i % cols, r = Math.floor(i / cols), x0 = pad + c * cw + 1.5, y0 = 22 + r * ch + 1.5, w = cw - 3, h = ch - 3;
      if (!smEnabled(i)) { g.strokeStyle = SC.grid; g.strokeRect(x0, y0, w, h); continue; }
      g.fillStyle = SC.grid; g.fillRect(x0, y0, w, h);
      const u = OCC.tc[i]; if (u > 0) { g.fillStyle = COL.gemm; g.fillRect(x0, y0 + h * (1 - u), w, h * u); }
      if (OCC.on[i] > .05) { g.strokeStyle = SC.fg; g.globalAlpha = OCC.on[i]; g.lineWidth = 1.2; g.strokeRect(x0 + .5, y0 + .5, w - 1, h - 1); g.globalAlpha = 1; }
    }
    let su = 0, n = 0; for (let i = 0; i < 144; i++) if (smEnabled(i)) { su += OCC.tc[i]; n++; }
    txt(g, gg.sms + tr(B(' SMs enabled · Mean Tensor Core use: ', ' SM 启用 · Tensor Core 平均利用率 ')) + (100 * su / n).toFixed(1) + '%', pad, 14, SC.tx2, 'left', SANS);
    SCOPEINFO.win = 0; SCOPEINFO.op = 0;
  }
}
const cpuBW = () => CPUSPEC.bw;
// SKU enable mask: spread disabled SMs evenly across the 144 positions
function smEnabled(i) { const n = GPUS[CFG.gpu].sms; if (n >= 144) return true; const off = 144 - n; return Math.floor((i + 1) * off / 144) === Math.floor(i * off / 144); }
// ---------- tooltip ----------
let TIP = null;
function showTip(info, x, y) { TIP = { info, x, y }; const t = $('tip'); t.style.left = clamp(x + 14, 0, 1440 - 300) + 'px'; t.style.top = clamp(y + 10, 60, 810 - 160) + 'px'; t.style.opacity = 1; updateTip(); }
function updateTip() { if (!TIP) return; const i = TIP.info; const v = i.v ? i.v() : ''; const h = `<h5>${tr(i.name)}</h5><div class="tf">${tr(i.fn)}</div>${v ? tr(B(`<div class="tv"><span>Current</span>${v}</div>`, `<div class="tv"><span>当前值</span>${v}</div>`)) : ''}`; if (h !== updateTip.last) { $('tip').innerHTML = h; updateTip.last = h; const el = $('tip'); el.style.left = clamp(TIP.x + 14, 8, 1440 - el.offsetWidth - 8) + 'px'; el.style.top = clamp(TIP.y + 10, 60, 810 - el.offsetHeight - 8) + 'px'; } }
function hideTip() { TIP = null; $('tip').style.opacity = 0; }

function renderAnswer() {
  const q = STEPS[CUR].quiz, i = ANSWERS[CUR];
  document.querySelectorAll('.quiz button').forEach((x, j) => { x.classList.toggle('right', j === i && i === q.a); x.classList.toggle('wrong', j === i && i !== q.a); });
  $('qfb').innerHTML = i === q.a ? tr(B('<span class="ok">Correct</span> ', '<span class="ok">正确</span>　')) + tr(q.fb) : tr(B('<span class="no">Incorrect</span> Try again. Hint: revisit the Why tab.', '<span class="no">不对</span>　再想想。提示：看「原理」标签页。'));
}
