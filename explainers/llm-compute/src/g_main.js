// ================= MAIN: step logic, autoplay timeline, scene update, loop, test hooks =================
let AUTOPLAY = !INTERACTIVE_START, LT = 0, EVI = 0, EVLAST = 0, VIEW = '', HIDEAT = -1;
const ALLG = [BD.g, CORE.g, SMV.g, SMV.mma, TOWER.g, KVM.g, MULTI.g];
const GROUPS = { system: [BD.g], core: [CORE.g], gpu: [BD.g], sm: [SMV.g, SMV.mma], llm: [BD.g, TOWER.g], sim: [BD.g, TOWER.g], kv: [BD.g, KVM.g], multi: [BD.g, MULTI.g] };
function showGroups(v, only) { for (const g of ALLG) { const on = GROUPS[v].includes(g); if (on) g.visible = true; else if (only) g.visible = false; } }
function userTook() { if (AUTOPLAY) { AUTOPLAY = false; OPSCALE = 1; $('btnAuto').classList.remove('on'); setBtn($('btnAuto'), ICON.play + tr(B('Autoplay', '自动演示'))); } }
function applyCfg(c) { if (!c) return; Object.assign(CFG, c); if (c.gpu && c.bw === undefined) setGPU(c.gpu); }
function goStep(i, dur = 1.7) {
  i = clamp(i, 0, STEPS.length - 1); if (OPR.running) abortOp();
  CUR = i; const s = STEPS[i];
  SCOPE = s.scope; WHYTAB = 'why'; hideTip(); applyCfg(s.cfg);
  for (const ch in EXV) if (EXT[ch]) setExplode(ch, 0, 0.9);
  $('btnExplode').classList.remove('on');
  const v = s.view; showGroups(v, false);
  if (VIEW && VIEW !== v) HIDEAT = SIM.t + dur + 0.05;
  VIEW = v; shot(SHOTS[v], dur);
  if (s.id === 'kv') kvInit();
  if (s.id === 'cpu' && !OOO.prog.length) { oooReset(CFG.mp ? 19 : -1); coreBuild(); }
  OPR.mode = ''; OPR.tl = null;
  $('steptitle').innerHTML = `<span class="ix">${String(i + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}</span>${tr(s.title)}<small>${tr(s.sub)}</small>`;
  OPR.chips = []; renderChips(); OPR.phase = ''; OPR.dev = '';
  renderTrail(); renderWhy(); syncControls(); updateReadouts(); sizeScope();
}
function toggleExplode() {
  if (VIEW !== 'gpu' && VIEW !== 'system') { toast(B('Exploded view is available in Steps 1 and 3 (GPU package: separated HBM stacks and dies).', '爆炸视图在第 1、3 步 (GPU 封装：HBM 堆栈与 die 分层展开)。')); return; }
  const on = !EXT.gpu; setExplode('gpu', on ? 1 : 0, on ? 2.0 : 1.2);
  shot(SHOTS[on ? 'gpuX' : VIEW], on ? 2.0 : 1.4); $('btnExplode').classList.toggle('on', on);
}
function onOpDone() {
  const r = OPR.result, s = OPR.step; syncControls(); updateReadouts();
  const msg = {
    PROMPT: () => tr(B(`One request: TTFT ≈ ${fT(stepModel('prefill').t)}, then ≈ ${fT(s.t)} (${fN(s.tokps)} tok/s)`, `一次请求：TTFT ≈ ${fT(stepModel('prefill').t)}，之后每 token ≈ ${fT(s.t)} (${fN(s.tokps)} tok/s)`)),
    PIPE: () => r ? tr(B(`${r.cyc} cycles retire ${OOO.prog.length} instructions · IPC ${r.ipc.toFixed(2)}${r.fl ? ' · Misprediction flushes: ' + r.fl + ' times' : ''}`, `${r.cyc} 个周期提交 ${OOO.prog.length} 条指令 · IPC ${r.ipc.toFixed(2)}${r.fl ? ' · 误预测冲刷 ' + r.fl + ' 次' : ''}`)) : '',
    LAUNCH: () => tr(B(`3 GEMM waves fill ${GPUS[CFG.gpu].sms} SMs; decode Tensor Core utilization is only ~${(100 * s.tComp / s.t).toFixed(1)}%`, `GEMM 3 个 wave 填满 ${GPUS[CFG.gpu].sms} 个 SM；decode 时 Tensor Core 利用率只有 ~${(100 * s.tComp / s.t).toFixed(1)}%`)),
    MMA: () => tr(B('One 16×16 C tile complete: 4096 multiply-adds, A/B each read from HBM once', '一个 16×16 C tile 完成：4096 次乘加，A/B 各只从 HBM 读一次')),
    FWD: () => tr(B(`1 token = ${s.nK} kernels, ≈ ${fT(s.t)}; weight reads account for ${(100 * s.wRead / s.allBytes).toFixed(0)}%`, `1 个 token = ${s.nK} 个 kernel，≈ ${fT(s.t)}；权重读取占 ${(100 * s.wRead / s.allBytes).toFixed(0)}%`)),
    GEN: () => tr(B(`Prefill ${fT(OPR.pf ? OPR.pf.t : 0)} (compute-bound) → Decode ${fT(s.t)}/token (bandwidth-bound)`, `Prefill ${fT(OPR.pf ? OPR.pf.t : 0)} (算力受限) → Decode ${fT(s.t)}/token (带宽受限)`)),
    KV: () => tr(B(`KV pool: ${KVS.seqs.length} concurrent requests; reclaimed blocks immediately serve new arrivals`, `KV 池：${KVS.seqs.length} 个并发请求，已完成并回收的 block 立刻给新请求`)),
    TP: () => tr(B(`TP=${CFG.tp}: ${fT(s.t)}/token, including communication: ${fT(s.tAR)}${s.cpuBound ? '; CPU launches become the bottleneck' : ''}`, `TP=${CFG.tp}：${fT(s.t)}/token，其中通信 ${fT(s.tAR)}${s.cpuBound ? '，CPU 启动成为瓶颈' : ''}`)),
  }[OPR.kind];
  const m = msg && msg(); if (m) toast(msg);
}
// ---------- autoplay timeline: [delay after previous event (s), fn]; fn may return false to wait ----------
const idle = () => !OPR.running;
let RAMP = null;
const ramp = (key, to, dur) => () => { RAMP = { key, from: CFG[key], to, t0: LT, dur }; };
const TL = [
  [0.0, () => goStep(0, 0)],
  [0.8, () => { startOp('PROMPT'); syncControls(); }],
  [0.2, idle], [0.9, () => goStep(1)],
  [0.8, () => { CORE.cyc = .15; startOp('PIPE'); syncControls(); }], [0.2, idle],
  [1.2, () => { CORE.cyc = .42; goStep(2); }],
  [1.0, () => { setExplode('gpu', 1, 2.0); shot(SHOTS.gpuX, 2.0); }],
  [2.2, () => { setExplode('gpu', 0, 1.2); shot(SHOTS.gpu, 1.4); }],
  [0.4, () => { startOp('LAUNCH'); syncControls(); }], [0.2, idle],
  [0.6, () => goStep(3)], [0.8, () => { startOp('MMA'); syncControls(); }], [0.2, idle],
  [0.6, () => goStep(4)], [0.8, () => { startOp('FWD'); syncControls(); }], [0.2, idle],
  [0.6, () => goStep(5)], [0.7, () => { startOp('GEN'); syncControls(); }], [0.2, idle],
  [0.8, () => goStep(6)], [0.7, () => { startOp('KV'); syncControls(); }], [0.2, idle],
  [0.6, ramp('ctx', 8, 2.0)], [2.2, () => { toast(B('128K context: each request\'s KV approaches the size of the weights', '上下文 128K：每个请求的 KV 已接近权重本身的大小'), 3200); }],
  [1.6, () => goStep(7)],
  [0.8, () => { CFG.model = 4; CFG.batch = 0; CFG.ctx = 3; syncControls(); toast(B('70B FP16 = 141 GB > 80 GB: does not fit on one GPU (showing the speed upper bound)', '70B FP16 = 141 GB > 80 GB：单卡放不下 (先看速度上限)'), 3000); }],
  [1.8, ramp('peak', 3000, 1.4)], [1.6, () => toast(B('Compute ×3: decode time barely changes; compute is not its bottleneck', '算力 ×3：decode 时间几乎不变 —— 它不受算力限制'), 3000)],
  [1.4, () => { CFG.peak = 989; syncControls(); }], [0.2, ramp('bw', 8, 1.4)], [1.6, () => toast(B('Bandwidth 3.35 → 8 TB/s: time falls to ~40%', '带宽 3.35 → 8 TB/s：时间直接降到 ~40%'), 3000)],
  [1.5, () => { CFG.bw = 3.35; CFG.prec = 'INT4'; syncControls(); toast(B('INT4 weights: fewer bytes → ~4× faster, and now they fit', 'INT4 权重：主要省的是字节 → 快 ~4×，而且装得下了'), 3000); }],
  [1.9, ramp('batch', 7, 1.8)], [2.0, () => toast(B('Batch 128: each weight read serves 128 users, dramatically raising throughput', 'batch 128：每读一次权重服务 128 个用户，总吞吐暴涨'), 3000)],
  [1.6, () => { SCOPE = 'hbm'; syncControls(); }], [0.2, ramp('ctx', 7, 1.6)], [1.8, () => toast(B('Long context × large batch: KV far exceeds weights and overflows HBM', '长上下文 × 大 batch：KV 远超权重，HBM 装不下'), 3000)],
  [1.8, () => goStep(8)], [0.7, () => { startOp('TP'); syncControls(); }], [0.2, idle],
  [0.4, () => { CFG.tp = 8; syncControls(); }], [1.4, () => { CFG.model = 0; CFG.tp = 1; CFG.graphs = false; syncControls(); toast(B('1B model + eager launches: the GPU computes faster than the CPU can launch kernels', '1B 模型 + eager 启动：GPU 算得太快，CPU 发 kernel 跟不上'), 3200); }],
  [2.4, () => { CFG.graphs = true; syncControls(); toast(B('Enable CUDA Graphs: replay a token in one launch; CPU overhead nearly disappears', '打开 CUDA Graphs：整段 token 一次重放，CPU 开销几乎消失'), 3000); }],
  [2.0, () => { WHYTAB = 'src'; renderWhy(); }],
  [1.6, () => { userTook(); toast(B('Autoplay complete. Explore freely: select steps, adjust sliders and click any structure.', '自动演示结束 —— 现在可以自由操作：点步骤、拖动滑块、点任意结构。'), 6000); }],
];
function tickAuto(dt) {
  LT += dt;
  if (RAMP) { const k = smooth((LT - RAMP.t0) / RAMP.dur); const v = lerp(RAMP.from, RAMP.to, k); CFG[RAMP.key] = (RAMP.key === 'batch' || RAMP.key === 'ctx') ? Math.round(v) : RAMP.key === 'peak' ? Math.round(v / 10) * 10 : Math.round(v * 20) / 20; syncControls(); if (k >= 1) RAMP = null; }
  while (EVI < TL.length && LT - EVLAST >= TL[EVI][0]) { const r = TL[EVI][1](); if (r === false) break; EVLAST = LT; EVI++; }
}
function restartAutoplay() {
  abortOp(); Object.assign(CFG, BASE70, { simd: 'AVX512', mp: true });
  AUTOPLAY = true; OPSCALE = .65; LT = 0; EVI = 0; EVLAST = 0; RAMP = null; user.daz = user.del = 0; user.zoom = 1;
  $('btnAuto').classList.add('on'); setBtn($('btnAuto'), tr(B('<span class="live"></span>Playing', '<span class="live"></span>演示中')));
}
// ---------- per-frame scene updates ----------
const revCurve = c => ({ getPointAt: (u, v) => c.getPointAt(1 - u, v) });
PCIE.rev = PCIE.curves.map(revCurve);
const KVSR = [60, 150, 230, 330].map(i => { const a = kvCellPos(i); return path([[a.x, a.y, a.z + .05], [a.x, a.y, a.z + .6], [GPU.X + 6.2, 1.0, -4.4 + .6], [GPU.X + 6.2, 1.0, -4.4 + .5]]); });
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
const SMCOL = { idle: new THREE.Color('#4d505a'), off: new THREE.Color('#1c1d21'), tc: new THREE.Color('#4a8ad6'), wait: new THREE.Color('#6d5a33') };
function occUpdate() {
  const s = OPR.running ? OPR.step : stepModel('decode'), u = s.tComp / s.t, mode = ACT.smMode, act = ACT.sm;
  for (let i = 0; i < 144; i++) {
    if (!smEnabled(i)) { OCC.on[i] = 0; OCC.tc[i] = 0; continue; }
    const h = fract(Math.sin(i * 12.7) * 437.5);
    if (mode === 'wave') { const k = clamp(((ACT.waveU || 0) - h * .25) * 4); OCC.on[i] = 1; OCC.tc[i] = .78 * k * (1 - clamp(((ACT.waveU || 0) - .85) * 6) * .5); }
    else if (mode === 'full') { OCC.on[i] = act; OCC.tc[i] = .78 * act; }
    else if (mode === 'decode') { OCC.on[i] = act; OCC.tc[i] = Math.min(.78, u) * act; }
    else if (!OPR.running && (STEPS[CUR].id === 'gpu' || STEPS[CUR].id === 'sim')) { OCC.on[i] = .5; OCC.tc[i] = Math.min(.78, u); }
    else { OCC.on[i] = 0; OCC.tc[i] = 0; }
  }
}
function paintSMs(inst) {
  for (let i = 0; i < 144; i++) {
    if (!smEnabled(i)) { inst.setColorAt(i, SMCOL.off); continue; }
    _c1.copy(SMCOL.idle).lerp(SMCOL.wait, OCC.on[i] * (1 - OCC.tc[i]) * .8 * (ACT.smMode === 'decode' ? 1 : 0)).lerp(SMCOL.tc, clamp(OCC.tc[i] * 1.25 + (ACT.smMode === 'decode' ? .08 * OCC.on[i] * (.5 + .5 * Math.sin(SIM.t * 9 + i)) : 0)));
    inst.setColorAt(i, _c1);
  }
  inst.instanceColor.needsUpdate = true;
}
const KVOWN = new Int16Array(KVM.n);
function setLab(L, html) { L.set(html); }
function sceneUpdate(dt) {
  const s = STEPS[CUR], g = GPUS[CFG.gpu], streams = [];
  occUpdate();
  // host side
  BD.cores.forEach((c, i) => glow(c.m, ACT.cpu * (.35 + .2 * Math.sin(SIM.t * 7 + i * 1.3)), '#4a8ad6'));
  if (ACT.pcie > .05) (ACT.pcieDir > 0 ? PCIE.curves : PCIE.rev).forEach((c, k) => streams.push({ curve: c, n: 6, period: 1.1, col: ACT.pcieDir > 0 ? '#bdbdc0' : '#5fc39c', size: .05, rate: ACT.pcie, seed: k }));
  // GPU package
  GPU.stacks.forEach((st, si) => { const on = si < g.stacks || g.stacks >= 6; st.mats.forEach((m, k) => glow(m, on ? ACT.hbm * (.18 + .12 * Math.sin(SIM.t * 6 + k * .7 + si)) : 0, '#4a8ad6')); });
  if (ACT.hbm > .05 && BD.g.visible && (VIEW === 'system' || VIEW === 'gpu' || VIEW === 'llm' || VIEW === 'sim')) GPU.hbmCurves.forEach((c, k) => streams.push({ curve: c, n: 10, period: .9, col: '#7fb0ff', size: .045, rate: ACT.hbm, seed: k + 10, jit: .5 }));
  glow(GPU.l2m, ACT.l2 * .35, '#4a8ad6');
  paintSMs(GPU.smInst);
  BD.lab.sm.set(() => 'SM ×' + g.sms + (g.sms < g.smsFull ? tr(B(' <span class="s">(full die: ', ' <span class="s">(满配 ')) + g.smsFull + ')</span>' : ''));
  BD.lab.hbm.set(() => tr(B(`HBM stacks <span class="v">${(CFG.bw).toFixed(2)} TB/s</span>`, `HBM 堆栈 <span class="v">${(CFG.bw).toFixed(2)} TB/s</span>`)));
  // label visibility per view
  const sysL = VIEW === 'system', gpuL = VIEW === 'gpu';
  for (const k in BD.lab) BD.lab[k].show = sysL ? 1 : gpuL ? (['gpu', 'hbm', 'l2', 'sm', 'inter', 'nvl'].includes(k) ? 1 : 0) : 0;
  if (sysL) { BD.lab.l3.show = 0; BD.lab.core.show = 0; BD.lab.inter.show = 0; BD.lab.l2.show = 0; }
  // multi-GPU
  if (MULTI.g.visible) {
    const n = CFG.tp; MULTI.gpus.forEach((G, i) => { G.g.visible = i + 1 < Math.min(4, n); if (G.g.visible) { paintSMs(G.smInst); G.stacks.forEach(st => st.mats.forEach(m => glow(m, ACT.hbm * .25, '#4a8ad6'))); } });
    MULTI.labs.forEach((L, i) => { L.show = i < Math.min(4, n) ? 1 : 0; L.set(() => tr(B(`GPU ${i}${n > 4 && i === 3 ? '…' + (n - 1) : ''} <span class="v">1/${n} of weights</span>`, `GPU ${i}${n > 4 && i === 3 ? '…' + (n - 1) : ''} <span class="v">1/${n} 权重</span>`))); });
    MULTI.lab.show = n > 1 ? 1 : 0;
    if (ACT.nvl > .05) MULTI.curves.slice(0, Math.min(4, n)).forEach((c, k) => streams.push({ curve: c, n: 12, period: .8, col: COL.kv, size: .09, rate: ACT.nvl, seed: k + 30 }));
    glow(MULTI.sw.material, ACT.nvl * .45, COL.kv);
  }
  // tower
  if (TOWER.g.visible) {
    const a = ACT.tower, u = ACT.towerU || 0, sweepRow = [1, 2, 4][Math.min(2, Math.floor(u * 3))];
    let cy = -1;
    for (const b of TOWER.blocks) {
      const r = TOWER.rows[b.row], j = r.blocks.indexOf(b);
      const lit = ACT.towerAll > .5 || (a === 0 && b.row === 0) || (a >= 100 && a < 200 && b.row === 1 && j === a - 100) || (a === 200 && b.row === sweepRow) || (a >= 300 && b.row === 5 && j === a - 300);
      glow(b.mat, lit ? .55 + .15 * Math.sin(SIM.t * 8) : .04); if (lit) cy = r.y;
    }
    TOWER.cursor.material.opacity = damp(TOWER.cursor.material.opacity, cy > 0 && ACT.towerAll < .5 ? .22 : 0, 10, dt); if (cy > 0) TOWER.cursor.position.y = damp(TOWER.cursor.position.y, cy - .17, 14, dt);
    for (const r of TOWER.rows) if (r.lab) r.lab.show = 1;
    const kt = () => OPR.toks.length ? tr(B('Output: ', '输出：')) + OPR.toks.map(tr).join('') : OPR.kHi ? kernelText(OPR.kHi) + ' <span class="v">' + (tr(OPR.dev) || '') + '</span>' : '';
    TOWER.klab.set(kt); TOWER.klab.show = kt() ? 1 : 0;
  }
  // KV memory map
  if (KVM.g.visible && KVS.cell) {
    KVOWN.fill(-1); KVS.seqs.forEach((q, qi) => q.cells.forEach(c => KVOWN[c] = qi));
    for (let i = 0; i < KVM.n; i++) { if (i < KVS.wCells) _c1.set('#2f4a72'); else if (KVOWN[i] >= 0) _c1.set(KVS.seqs[KVOWN[i]].col); else _c1.set('#26272b'); KVM.inst.setColorAt(i, _c1); }
    KVM.inst.instanceColor.needsUpdate = true;
    if (ACT.kv > .05) KVSR.forEach((c, k) => streams.push({ curve: c, n: 8, period: 1.0, col: '#c77dba', size: .06, rate: ACT.kv, seed: k + 50 }));
    glow(KVM.sram.material, ACT.sram * .4, '#5fc39c'); KVM.lab.show = 1; KVM.slab.show = 1;
  }
  // CPU core close-up
  if (CORE.g.visible) { coreTick(dt); for (const k in CORE.lab) CORE.lab[k].show = 1; }
  // SM close-up
  if (SMV.g.visible) {
    smTick(dt, ACT.tc > .5 ? true : ACT.smMode === 'path2' ? 'alu' : false);
    if ((ACT.smMode === 'path' || ACT.smMode === 'path2') && ACT.hbm + ACT.sram > .05) streams.push({ curve: SMV.path, n: 22, period: 1.6, col: '#7fb0ff', size: .07, rate: Math.max(ACT.hbm, ACT.sram), seed: 70 });
    for (const k in SMV.lab) SMV.lab[k].show = 1; SMV.lab.k.show = OPR.kind === 'MMA' && OPR.running && ACT.smMode === 'mma' ? 1 : 0;
  }
  detailTick(dt); updateParticles(streams, SIM.t);
  // ticker
  const tk = OPR.phase ? `${OPR.dev ? `<b>${tr(OPR.dev)}</b> · ` : ''}${tr(OPR.phase)}` : tr(B('<b>Ready</b> · Click Run to start, or adjust the controls', '<b>就绪</b> · 点「运行」开始，或拖动左侧参数'));
  if (tk !== sceneUpdate.tk) { $('tkphase').innerHTML = tk; sceneUpdate.tk = tk; }
}
// ---------- simulation step ----------
function simStep(dt) {
  SIM.t += dt;
  if (AUTOPLAY) tickAuto(dt);
  tickOp(dt); dampAct(dt); tickExplode(); updateExplode(dt); updateRig();
  if (HIDEAT > 0 && SIM.t >= HIDEAT) { showGroups(VIEW, true); HIDEAT = -1; }
  sceneUpdate(dt); tickToast();
}
let FR = 0;
function render() {
  placeCamera(); camera.updateMatrixWorld(); updateLabels(); renderer.render(scene, camera);
  if (CAPTURE || FR % 2 === 0) drawScope(); if (CAPTURE || FR % 6 === 0) updateReadouts(); updateTip(); FR++;
}
// ---------- input ----------
const ray = new THREE.Raycaster(); let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; if (drag.moved > 4) { userTook(); user.daz -= dx * 0.006; user.del = clamp(user.del + dy * 0.004, -0.6, 0.9); } });
canvas.addEventListener('pointerup', e => { const d = drag; drag = null; if (!d || d.moved > 4) return; pickAt(e.clientX, e.clientY); });
canvas.addEventListener('wheel', e => { e.preventDefault(); userTook(); user.zoom = clamp(user.zoom * Math.exp(e.deltaY * 0.0012), 0.35, 2.5); }, { passive: false });
function pickAt(cx, cy) {
  ray.setFromCamera(new THREE.Vector2(cx / VW * 2 - 1, -(cy / VH) * 2 + 1), camera);
  const hits = ray.intersectObjects(PICK.filter(visibleUp), false);
  if (!hits.length) { hideTip(); return; }
  userTook(); const x = (cx - stageOX) / stageScale, y = (cy - stageOY) / stageScale; showTip(hits[0].object.userData.info, x, y);
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowRight') { userTook(); goStep(CUR + 1); } else if (e.key === 'ArrowLeft') { userTook(); goStep(CUR - 1); } else if (e.key === 'Escape') hideTip(); });
addEventListener('resize', () => { layout(); sizeScope(); });
new ResizeObserver(() => { sizeScope(); drawScope(); }).observe(sc);
function renderStepTitle() { const s = STEPS[CUR]; $('steptitle').innerHTML = `<span class="ix">${String(CUR + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}</span>${tr(s.title)}<small>${tr(s.sub)}</small>`; }
function renderPhase() { const tk = OPR.phase ? `${OPR.dev ? `<b>${tr(OPR.dev)}</b> · ` : ''}${tr(OPR.phase)}` : tr(B('<b>Ready</b> · Click Run to start, or adjust the controls', '<b>就绪</b> · 点「运行」开始，或拖动左侧参数')); $('tkphase').innerHTML = tk; sceneUpdate.tk = tk; }
$('lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.v); });
LANGHOOKS.push(() => {
  document.title = t('title');
  document.querySelectorAll('#lang button').forEach(b => { b.classList.toggle('on', b.dataset.v === LANG); b.setAttribute('aria-pressed', b.dataset.v === LANG); });
  $('btnRun')._h = $('btnAuto')._h = null;
  renderTrail(); renderStepTitle(); renderWhy(); renderChips(); syncControls(); updateReadouts(); updateTip(); renderPhase();
  if (toast.msg) { const until = toast.until; toast(toast.msg); toast.until = until; if (!until) { $('toast').style.opacity = 0; TOASTRECT = null; } }
  setBtn($('btnAuto'), AUTOPLAY ? tr(B('<span class="live"></span>Playing', '<span class="live"></span>演示中')) : ICON.play + t('autoplay'));
  drawScope(); updateLabels();
});
// ---------- boot ----------
if (CAPTURE) document.body.classList.add('capture');
layout(); sizeScope();
for (const g of ALLG) g.visible = false;
if (AUTOPLAY) restartAutoplay();
goStep(0, 0); showGroups(VIEW, true); applyLang();
if (!AUTOPLAY) setBtn($('btnAuto'), ICON.play + tr(B('Autoplay', '自动演示')));
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (CAPTURE) return;
  const el = Math.min(0.1, (now - last) / 1000); last = now;
  if (!SIM.paused) { acc += el * SIM.speed; let n = 0; while (acc >= SIM.dt && n < 8) { simStep(SIM.dt); acc -= SIM.dt; n++; } if (n === 8) acc = 0; }
  render();
}
requestAnimationFrame(frame);
window.__setTime = t => { let n = 0; while (SIM.t + SIM.dt / 2 < t && n < 200000) { simStep(SIM.dt); n++; } render(); return SIM.t; };
window.__state = () => ({ t: SIM.t, step: CUR, lang: LANG, view: VIEW, op: OPR.kind, running: OPR.running, phase: tr(OPR.phase), auto: AUTOPLAY, ev: EVI, nEv: TL.length, LT, cfg: Object.assign({}, CFG) });
window.__goStep = i => goStep(i);
window.__model = (kind, over) => { const s = stepModel(kind || 'decode', over); return { t: s.t, tMem: s.tMem, tComp: s.tComp, tGPU: s.tGPU, tCPU: s.tCPU, tAR: s.tAR, wBytes: s.wBytes, kvBytes: s.kvBytes, allBytes: s.allBytes, flops: s.flops, ai: s.ai, tokps: s.tokps, fits: s.fits, need: s.need, nK: s.nK, cpuBound: s.cpuBound, kvTok: kvPerTok(s.m, s.p), tIdeal: s.tIdeal }; };
window.__scopeInfo = () => ({ scope: SCOPE, win: SCOPEINFO.win, op: SCOPEINFO.op, running: OPR.running });
window.__layout = () => { const r = []; for (const L of LABELS) if (L.el.style.visibility === 'visible' && +L.el.style.opacity > .05) { const b = L.el.getBoundingClientRect(); r.push({ t: L.el.textContent.slice(0, 30), x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); } const t = $('toast'), tb = t.getBoundingClientRect(); return { labels: r, toast: +getComputedStyle(t).opacity > .05 ? { x0: tb.left, y0: tb.top, x1: tb.right, y1: tb.bottom, text: t.textContent } : null, stage: (() => { const s = $('stage').getBoundingClientRect(); return { x0: s.left + STAGE.x * stageScale, y0: s.top + STAGE.y * stageScale, x1: s.left + (STAGE.x + STAGE.w) * stageScale, y1: s.top + (STAGE.y + STAGE.h) * stageScale }; })() }; };
// perf: collapse per-face material arrays (skin() gives boxes 6 groups -> 6 draws) into one group per unique material
{ let gb = 0, ga = 0; scene.traverse(m => { if (!m.isMesh || m.isInstancedMesh || !Array.isArray(m.material)) return; const g0 = m.geometry; if (!g0.index || g0.groups.length < 2) return;
  const uniq = [], map = m.material.map(x => { let k = uniq.indexOf(x); if (k < 0) { uniq.push(x); k = uniq.length - 1; } return k; });
  const src = g0.index.array, out = [], groups = []; gb += g0.groups.length;
  uniq.forEach((_, u) => { const s = out.length; g0.groups.forEach(gr => { if (map[gr.materialIndex] !== u) return; for (let j = gr.start; j < gr.start + gr.count; j++) out.push(src[j]); }); if (out.length > s) groups.push({ start: s, count: out.length - s, materialIndex: u }); });
  const g = g0.clone(); g.setIndex(out); g.clearGroups(); groups.forEach(gr => g.addGroup(gr.start, gr.count, gr.materialIndex)); ga += groups.length;
  m.geometry = g; m.material = uniq.length === 1 ? uniq[0] : uniq; if (uniq.length === 1) g.clearGroups(); });
  DPERF.groups = { before: gb, after: ga }; }
window.__dbg = { SCENE: scene, R: renderer, BD, GPU, TOWER, KVM, MULTI, CORE, SMV, LABELS, STAGE, OPR, ACT, KVS, OCC, CFG };
window.__setLang = l => setLang(l);
{ const m = QS.match(/[?&]step=(\d+)/); if (m) goStep(Math.min(STEPS.length - 1, +m[1]), 0); }
window.__ready = true;
