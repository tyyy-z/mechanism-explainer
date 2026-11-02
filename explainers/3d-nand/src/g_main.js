// ================= DIRECTOR, AUTOPLAY, LOOP =================
let AUTOPLAY = !INTERACTIVE_START, LT = 0, EVI = 0, EVLAST = 0, VIEW = '', HIDEAT = -1;
const GROUPS = { die: DIE.g, cua: DIE.g, array: DIE.g, slice: SL.g, cell: CELL.g };
let DIEFADE = 1;
function userTook() { if (AUTOPLAY) { AUTOPLAY = false; $('btnAuto').classList.remove('on'); setBtn($('btnAuto'), ICON.play + tr(B("Autoplay", '自动演示'))); } }
// selected-WL highlight (UI layer): array view = bbox outline, slice view = solid accent frame on the cut face
const SELBOX = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x4a8ad6, transparent: true, opacity: .95 }));
SELBOX.visible = false; SELBOX.renderOrder = 5; scene.add(SELBOX);
const SELFRAME = new THREE.Group(); SELFRAME.visible = false; scene.add(SELFRAME);
const _sfm = new THREE.MeshBasicMaterial({ color: 0x4a8ad6, transparent: true, opacity: 1, depthTest: false });
SELFRAME.renderOrder = 6;
for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), _sfm); m.renderOrder = 6; SELFRAME.add(m); }
const _sb = new THREE.Box3(), _sv = new THREE.Vector3(), _sc = new THREE.Vector3(), _selLift = new THREE.Color();
function selColor() { return document.body.classList.contains('light') ? '#2f6fbd' : '#5b9cf0'; }
function placeSelBox(mesh) {
  mesh.updateWorldMatrix(true, false); _sb.setFromObject(mesh); _sb.getCenter(SELBOX.position); _sb.getSize(_sv);
  SELBOX.scale.set(_sv.x + .08, _sv.y + .08, _sv.z + .08); SELBOX.visible = true;
  SELBOX.material.color.set(selColor()); SELBOX.material.opacity = .8 + .2 * Math.sin(SIM.t * 3);
}
function placeSelFrame(mesh) {
  mesh.updateWorldMatrix(true, false); _sb.setFromObject(mesh); _sb.getCenter(_sc); _sb.getSize(_sv);
  const t = .06, z = _sb.max.z + .02, [top, bot, lft, rgt] = SELFRAME.children;
  top.position.set(_sc.x, _sb.max.y + t / 2, z); top.scale.set(_sv.x + 2 * t, t, t);
  bot.position.set(_sc.x, _sb.min.y - t / 2, z); bot.scale.set(_sv.x + 2 * t, t, t);
  lft.position.set(_sb.min.x - t / 2, _sc.y, z); lft.scale.set(t, _sv.y, t);
  rgt.position.set(_sb.max.x + t / 2, _sc.y, z); rgt.scale.set(t, _sv.y, t);
  _sfm.color.set(selColor()); _sfm.opacity = .9 + .1 * Math.sin(SIM.t * 3); SELFRAME.visible = true;
}
function goStep(i, dur = 1.7) {
  i = clamp(i, 0, STEPS.length - 1); if (OPR.running && i !== CUR) abortOp();
  CUR = i; const s = STEPS[i];
  SCOPE = s.scope; WHYTAB = 'why'; hideTip();
  if (s.op) SEL.op = s.op;
  if (s.id === 'pgm' && WRITTEN[SEL.wl]) { const f = WRITTEN.indexOf(false); if (f >= 0) SEL.wl = f; }
  if (s.id === 'rel' && !WRITTEN.some(x => x)) { resetBlock(BLOCKMODE); calcDisturb(); toast(() => (tr(B("The reliability lesson needs programmed data: WL0–3 have been reprogrammed instantly.", '可靠性演示需要已写入的数据：已瞬时重新写入 WL0–3。'))), 4000); }
  if ((s.id === 'read' || s.id === 'rel') && !WRITTEN[SEL.wl]) { const f = WRITTEN.indexOf(true); if (f >= 0) SEL.wl = f; }
  for (const ch in EXV) if (EXT[ch]) setExplode(ch, 0, 0.9);
  const v = s.view; const g = GROUPS[v]; g.visible = true;
  if (VIEW && GROUPS[VIEW] !== g) HIDEAT = SIM.t + dur + 0.05;
  VIEW = v; shot(SHOTS[v], dur);
  DIEFADE = v === 'cua' ? 0.0 : 1;
  renderStepTitle();
  renderTrail(); renderWhy(); syncControls(); updateReadouts(); sizeScope();
  if (!OPR.running) { OPR.chips = []; renderChips(); OPR.phase = ''; OPR.dev = ''; }
  if (s.id === 'cell') { CELLSTEP.vt = -1.6; CELLSTEP.pulses = 0; }
}
function toggleExplode() {
  const ch = VIEW === 'cell' ? 'cell' : VIEW === 'array' ? 'tier' : (VIEW === 'die' || VIEW === 'cua') ? 'die' : null;
  if (!ch) { toast(() => (tr(B("This cross-section is already cut open. Use steps 1, 3, or 4 for an exploded view.", '剖面视图本身已经是"切开"的结构；去第 1、3、4 步看爆炸视图。')))); return; }
  const on = !EXT[ch]; setExplode(ch, on ? 1 : 0, on ? 2.0 : 1.2);
  const xs = { die: 'dieX', cua: 'dieX', array: 'arrayX', cell: 'cellX' }[VIEW];
  shot(SHOTS[on ? xs : VIEW], on ? 2.0 : 1.4); $('btnExplode').classList.toggle('on', on);
}
function onOpDone() {
  const r = OPR.result; syncControls();
  if (OPR.kind === 'READ' && r && r.bits) { const tb = CELLS[SEL.wl].map(c => trueBit(c.tgt)); const ok = r.bits.every((b, k) => b === tb[k]); toast(() => (tr(B(`READ complete: BL0..3 = ${r.bits.join(' ')} ${ok ? '✓ matches written data' : '✗ bit errors (try read-reference offset / Vpass)'}`, `READ 完成：BL0..3 = ${r.bits.join(' ')} ${ok ? '✓ 与写入数据一致' : '✗ 有位错误 (试试读参考偏移/Vpass)'}`)))); }
  else if (OPR.kind === 'PROGRAM' && ISPP) toast(() => (tr(B(`PROGRAM complete: ${ISPP.k} ISPP loops, final Vpgm ${ISPP.Vpgm.toFixed(2)} V; WL${SEL.wl} programmed`, `PROGRAM 完成：${ISPP.k} 个 ISPP loop，最终 Vpgm ${ISPP.Vpgm.toFixed(2)} V，WL${SEL.wl} 已写入`))));
  else if (OPR.kind === 'ERASE') toast(() => (tr(B("ERASE complete: ", 'ERASE 完成：')) + (r ? tr(r.msg) : '') + tr(B(" — entire block erased; any WL can be programmed again", ' — 整个 block 回到擦除态，可以重新编程任何 WL'))));
}
// ---------- autoplay timeline: [delay after previous event (s), fn]; fn may return false to wait ----------
const idle = () => !OPR.running;
const TL = [
  [0.0, () => goStep(0, 0)],
  [0.8, () => { SEL.op = 'READ'; startOp('READ'); syncControls(); }],
  [2.4, () => { setExplode('die', 1, 2.2); shot(SHOTS.dieX, 2.2); }],
  [3.4, () => { setExplode('die', 0, 1.4); shot(SHOTS.die, 1.6); }],
  [0.2, idle], [0.6, () => goStep(1)],
  [1.0, () => startOp('READ')], [0.2, idle],
  [0.6, () => goStep(2)], [1.2, () => { setExplode('tier', 1, 2.0); shot(SHOTS.arrayX, 2.0); }],
  [2.0, () => { SEL.wl = 4; syncControls(); }], [1.4, () => { SEL.wl = 2; syncControls(); }],
  [0.6, () => { setExplode('tier', 0, 1.2); shot(SHOTS.array, 1.4); }],
  [1.8, () => goStep(3)], [1.6, () => { setExplode('cell', 1, 2.0); shot(SHOTS.cellX, 2.0); }],
  [2.8, () => { setExplode('cell', 0, 1.2); shot(SHOTS.cell, 1.4); }],
  [1.6, () => { WHYTAB = 'math'; renderWhy(); applyCellPulse(); }], [0.7, applyCellPulse], [0.7, applyCellPulse], [0.7, applyCellPulse],
  [1.2, () => goStep(4)], [1.0, () => startOp('READ')], [0.2, idle],
  [0.8, () => { SCOPE = 'vt'; syncControls(); }],
  [1.4, () => goStep(5)], [0.9, () => startOp('PROGRAM')], [5.0, () => { SCOPE = 'ispp'; syncControls(); }], [0.2, idle],
  [0.6, () => { SCOPE = 'vt'; syncControls(); }],
  [1.6, () => goStep(6)], [0.9, () => startOp('ERASE')], [0.2, idle],
  [0.6, () => { SCOPE = 'vt'; syncControls(); }],
  [1.4, () => { goStep(7); }],
  [0.6, () => { RAMP = { key: 'ret', from: 0, to: 10, t0: LT, dur: 3 }; }],
  [3.4, () => { RAMP = { key: 'pe', from: 0, to: 3000, t0: LT, dur: 2.5 }; }],
  [3.0, () => { RAMP = { key: 'rshift', from: 0, to: -0.25, t0: LT, dur: 1.5 }; }],
  [2.6, () => { WHYTAB = 'src'; renderWhy(); }],
  [3.0, () => { userTook(); toast(() => (tr(B("Autoplay complete — explore freely: choose steps, adjust sliders, or click any structure.", '自动演示结束 —— 现在可以自由操作：点步骤、拖动滑块、点任意结构。'))), 6000); }],
];
let RAMP = null;
function tickAuto(dt) {
  LT += dt;
  if (RAMP) { const k = smooth((LT - RAMP.t0) / RAMP.dur); SEL[RAMP.key] = RAMP.key === 'pe' ? Math.round(lerp(RAMP.from, RAMP.to, k) / 100) * 100 : RAMP.key === 'ret' ? Math.round(lerp(RAMP.from, RAMP.to, k) * 2) / 2 : Math.round(lerp(RAMP.from, RAMP.to, k) * 20) / 20; syncControls(); if (k >= 1) RAMP = null; }
  while (EVI < TL.length && LT - EVLAST >= TL[EVI][0]) { const r = TL[EVI][1](); if (r === false) break; EVLAST = LT; EVI++; }
}
function restartAutoplay() {
  abortOp(); resetBlock('TLC'); Object.assign(SEL, { op: 'READ', mode: 'TLC', page: 'LP', wl: 2, data: [0, 4, 7, 1], ispp: 0.3, vpass: 9.5, vread: 6, rshift: 0, vers: 17, ret: 0, pe: 0 });
  TR.bl = []; TR.ispp = []; TR.erase = []; TR.eraseLoops = []; TR.bus = []; calcDisturb();
  AUTOPLAY = true; LT = 0; EVI = 0; EVLAST = 0; RAMP = null; user.daz = user.del = 0; user.zoom = 1;
  $('btnAuto').classList.add('on'); setBtn($('btnAuto'), tr(B("<span class=\"live\"></span>Playing", '<span class="live"></span>演示中')));
}
// ---------- per-frame scene updates ----------
const DIELAB = { die: ['ctrl', 'pads', 'stack', 'stair', 'bl', 'cua'], cua: ['ctrl', 'rowdec', 'pb', 'cold', 'pump', 'reg', 'fsm', 'sp'], array: ['stack', 'stair', 'bl', 'sp'] };
function setLab(L, html, c) { L.set(html); if (c) L.el.style.setProperty('--c', c); }
function sceneUpdate(dt) {
  const s = STEPS[CUR]; SELBOX.visible = false; SELFRAME.visible = false;
  // die
  if (DIE.g.visible) {
    updateDie(dt, NODES);
    for (const m of DIE.arrayMats) { if (!m.transparent) { m.transparent = true; m.needsUpdate = true; } m.opacity = damp(m.opacity, DIEFADE, 5, dt); m.depthWrite = m.opacity > .6; m.visible = m.opacity > .03; }
    const fadeOn = DIE.arrayMats[0].opacity > .5; if (DIE.pil) DIE.pil.visible = fadeOn; if (DIE.metal) DIE.metal.visible = fadeOn;
    let selMesh = null, selOn = false;
    if (VIEW === 'array') { const T = DIE.tiers[DIE.selBlock][SEL.wl + 2]; T.mat.emissive.set('#7fb6f0').multiplyScalar(.7 + .2 * Math.sin(SIM.t * 4)); selMesh = T.m; selOn = fadeOn; }
    if (selOn) placeSelBox(selMesh);
    const show = DIELAB[VIEW] || [];
    for (const k in DIE.lab) DIE.lab[k].show = show.includes(k) && EXV.die < .05 ? 1 : 0;
    // bus packets
    const act = PKT.active && (VIEW === 'die' || VIEW === 'cua');
    DIE.packets.forEach((p, i) => { p.visible = act && i < 8; if (!p.visible) return; const u = PKT.dir > 0 ? PKT.u : 1 - PKT.u; const c = DIE.busCurves[i === 0 ? (PKT.col === '#22d3ee' ? 1 : PKT.col === '#fbbf24' ? 2 : 6) : 6 + (i % 8)]; c.getPointAt(clamp(u), p.position); p.position.add(DIE.ctrl.position); p.material.color.set(PKT.col); });
    DIE.pkLabel.show = act ? 1 : 0; DIE.pkLabel.set(`<span style="color:${PKT.col}">${PKT.txt}</span>`);
  }
  // slice
  if (SL.g.visible) {
    updateSliceStatic();
    { const T = SL.tiers[SEL.wl + 1]; T.mat.emissive.add(_selLift.set('#4a8ad6').multiplyScalar(.18)); if (VIEW === 'slice') placeSelFrame(T.m); }
    const w = SEL.wl, ph = OPR.running && OPR.cur ? (OPR.cur.label.zh || OPR.cur.label) : '';
    for (let i = 0; i < 10; i++) { const v = tierV(i); setLab(SL.wlLab[i], `${tierName(i)} <span class="v">${fmt(v)} V</span>`, vCss(v)); SL.wlLab[i].show = (i === w + 1 || i === 0 || i === 9 || NODES.op || s.id === 'read') ? 1 : 0.55; SL.wlLab[i].el.classList.toggle('sel', i === w + 1); }
    for (let k = 0; k < 4; k++) {
      setLab(SL.blLab[k], `BL${k} <span class="v">${fmt(NODES.BL[k], NODES.BL[k] >= 10 ? 1 : 2)} V</span>`, vCss(NODES.BL[k])); SL.blLab[k].show = 1;
      setLab(SL.vchLab[k], `V<sub>ch</sub> ${fmt(NODES.Vch[k])} V`); SL.vchLab[k].show = (NODES.op === 'PROGRAM' || NODES.op === 'ERASE') && Math.abs(NODES.Vch[k]) > 0.3 ? 1 : 0;
      const c = CELLS[w][k], st = decodeState(c.vt, BLOCKMODE);
      setLab(SL.vtLab[k], B(`V<sub>t</sub> ${fmt(c.vt, 2)} · <b style="color:${STATE_COL[BLOCKMODE === 'TLC' ? st : st * 3]}">${LEVELS[BLOCKMODE].names[st].split(' ')[0]}</b>${c.lock && s.id === 'pgm' ? ' <span class="s">· locked</span>' : ''}`, `V<sub>t</sub> ${fmt(c.vt, 2)} · <b style="color:${STATE_COL[BLOCKMODE === 'TLC' ? st : st * 3]}">${LEVELS[BLOCKMODE].names[st].split(' ')[0]}</b>${c.lock && s.id === 'pgm' ? ' <span class="s">· 锁定</span>' : ''}`)); SL.vtLab[k].show = (s.id === 'read' || s.id === 'pgm' || s.id === 'rel') ? 1 : 0;
      let pbt = '';
      if (OPR.kind === 'READ' && TR.lastRead) { const r = TR.lastRead; pbt = r.bits ? `bit=${r.bits[k]}` : `>${r.above[k]}`; }
      else if (OPR.kind === 'PROGRAM' && ISPP) pbt = c.tgt === 0 ? B("Inhibit Vcc", '禁止 Vcc') : c.lock ? B("Locked", '已锁定') : B("Program 0 V", '编程 0 V');
      setLab(SL.pbLab[k], pbt); SL.pbLab[k].show = pbt && (s.id === 'read' || s.id === 'pgm') ? 1 : 0;
    }
    setLab(SL.slLab, `SL <span class="v">${fmt(NODES.SL)} V</span>`, vCss(NODES.SL)); SL.slLab.show = 1;
    SL.lab.rowdec.show = 1; SL.lab.pump.show = 1; SL.lab.cua.show = 1; SL.lab.pb.show = 0;
    // particles
    const em = []; const cx = [-0.17, 0.17], sx = [-0.285, 0.285];
    if (ph.startsWith('BL 放电') && OPR.cur.I) OPR.cur.I.forEach((I, k) => { const n = Math.round(26 * I / PHY.Ion); if (n > 0) cx.forEach((d, j) => em.push({ n, a: [SL.PX[k] + d, -0.25, 0.06], b: [SL.PX[k] + d, 6.55, 0.06], period: 1.4, col: '#60a5fa', jy: 0.2, seed: k * 2 + j })); });
    if (ph.startsWith('ISPP')) for (let k = 0; k < 4; k++) { const c = CELLS[w][k]; if (c.tgt === 0 || c.lock) continue; cx.forEach((d, j) => { em.push({ n: 14, a: [SL.PX[k] + d, yc(w + 1), 0.07], b: [SL.PX[k] + sx[j], yc(w + 1), 0.07], period: 0.55, col: '#60a5fa', jy: 0.26, seed: 10 + k * 2 + j, size: 1.1 }); em.push({ n: 6, a: [SL.PX[k] + d, 6.4, 0.06], b: [SL.PX[k] + d, yc(w + 1), 0.06], period: 1.5, col: '#60a5fa', jy: 0.05, seed: 30 + k * 2 + j }); }); }
    if (ph.startsWith('擦除脉冲')) for (let k = 0; k < 4; k++) cx.forEach((d, j) => {
      em.push({ n: 14, a: [SL.PX[k] + d, yc(0) + 0.12, 0.07], b: [SL.PX[k] + d, yc(5), 0.07], period: 1.3, col: '#fb7185', jy: 0.1, seed: 50 + k * 2 + j });
      em.push({ n: 14, a: [SL.PX[k] + d, yc(9) - 0.12, 0.07], b: [SL.PX[k] + d, yc(4), 0.07], period: 1.3, col: '#fb7185', jy: 0.1, seed: 70 + k * 2 + j });
      em.push({ n: 4, a: [SL.PX[k] + d, yc(9) - 0.1, 0.07], b: [SL.PX[k] + d, 6.6, 0.07], period: 0.9, col: '#60a5fa', jy: 0.05, seed: 90 + k * 2 + j });
      em.push({ n: 4, a: [SL.PX[k] + d, yc(0) + 0.1, 0.07], b: [SL.PX[k] + d, -0.3, 0.07], period: 0.9, col: '#60a5fa', jy: 0.05, seed: 110 + k * 2 + j });
      for (let i = 1; i <= 8; i++) em.push({ n: 3, a: [SL.PX[k] + d, yc(i), 0.08], b: [SL.PX[k] + sx[j], yc(i), 0.08], period: 0.8, col: '#fb7185', jy: 0.24, seed: 130 + i * 9 + k * 2 + j });
    });
    updateParticles(em, SIM.t);
  }
  // cell
  if (CELL.g.visible) {
    updateCell(SIM.t);
    const lab = EXV.cell < .05 || EXV.cell > .95; for (const k in CELL.lab) CELL.lab[k].show = lab ? 1 : 0;
    const E = fieldAt(CELLSTEP.vg - (CELLSTEP.vt + 1.6), CR.tun[0]);
    CELL.fieldLab.set(`V<sub>g</sub> ${fmt(CELLSTEP.vg)} V · E<sub>tun</sub> ${(E / 1e6).toFixed(1)} MV/cm · J<sub>FN</sub> ${sci(fnJ(E))} A/cm² · V<sub>t</sub> ${fmt(CELLSTEP.vt, 2)} V`); CELL.fieldLab.show = 1;
  }
  renderTicker();
}
function renderTicker() {
  const s = STEPS[CUR];
  const tk = OPR.phase ? `${OPR.dev ? `<b>${tr(OPR.dev)}</b> · ` : ''}${tr(OPR.phase)}` : (s.id === 'cell' ? tr(B("<b>Cell experiment</b> · adjust Vg, apply a pulse", '<b>单元实验</b> · 调 Vg，施加脉冲')) : tr(B("<b>Ready</b> · press Run to start", '<b>就绪</b> · 点「运行」开始')));
  if (tk !== sceneUpdate.tk) { $('tkphase').innerHTML = tk; sceneUpdate.tk = tk; }
}
// ---------- simulation step ----------
function simStep(dt) {
  SIM.t += dt;
  if (AUTOPLAY) tickAuto(dt);
  tickOp(dt); dampNodes(dt); tickExplode(); updateExplode(dt); updateRig();
  if (HIDEAT > 0 && SIM.t >= HIDEAT) { for (const k in GROUPS) GROUPS[k].visible = GROUPS[k] === GROUPS[VIEW]; HIDEAT = -1; }
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
function visibleObj(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
function pickAt(cx, cy) {
  ray.setFromCamera(new THREE.Vector2(cx / VW * 2 - 1, -(cy / VH) * 2 + 1), camera);
  const hits = ray.intersectObjects(PICK.filter(visibleObj), false).filter(h => !(h.object.material && h.object.material.opacity < 0.3));
  if (!hits.length) { hideTip(); return; }
  userTook(); const x = (cx - stageOX) / stageScale, y = (cy - stageOY) / stageScale; showTip(hits[0].object.userData.info, x, y);
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowRight') { userTook(); goStep(CUR + 1); } else if (e.key === 'ArrowLeft') { userTook(); goStep(CUR - 1); } else if (e.key === 'Escape') hideTip(); });
addEventListener('resize', () => { layout(); sizeScope(); });
new ResizeObserver(() => { sizeScope(); drawScope(); }).observe(sc);
LANGHOOKS.push(() => {
  renderTrail(); renderStepTitle(); renderWhy(); syncControls(); updateReadouts(); renderChips(); updateTip();
  if (toast.until) $('toast').textContent = tr(typeof toast.msg === 'function' ? toast.msg() : toast.msg);
  setBtn($('btnAuto'), AUTOPLAY ? tr(B('<span class="live"></span>Playing', '<span class="live"></span>演示中')) : ICON.play + t('autoplay'));
  renderTicker(); updateLabels(); drawScope();
});
// ---------- boot ----------
if (CAPTURE) document.body.classList.add('capture');
layout(); sizeScope(); resetBlock('TLC'); calcDisturb();
for (const k in GROUPS) GROUPS[k].visible = false;
goStep(0, 0); for (const k in GROUPS) GROUPS[k].visible = GROUPS[k] === GROUPS[VIEW];
if (AUTOPLAY) { $('btnAuto').classList.add('on'); setBtn($('btnAuto'), tr(B("<span class=\"live\"></span>Playing", '<span class="live"></span>演示中'))); } else setBtn($('btnAuto'), ICON.play + tr(B("Autoplay", '自动演示')));
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (CAPTURE) return;
  const el = Math.min(0.1, (now - last) / 1000); last = now;
  if (!SIM.paused) { acc += el * SIM.speed; let n = 0; while (acc >= SIM.dt && n < 8) { simStep(SIM.dt); acc -= SIM.dt; n++; } if (n === 8) acc = 0; }
  render();
}
requestAnimationFrame(frame);
window.__setTime = t => { let n = 0; while (SIM.t + SIM.dt / 2 < t && n < 100000) { simStep(SIM.dt); n++; } render(); return SIM.t; };

window.__state = () => ({ lang: LANG, step: CUR, view: VIEW, op: OPR.kind, running: OPR.running, phase: tr(OPR.phase), auto: AUTOPLAY, ev: EVI, LT, wl: SEL.wl, written: WRITTEN.slice() });
window.__goStep = i => goStep(i);
window.__dbg = { DIE, SL, CELL, LABELS, STAGE, get CELLS() { return CELLS; }, get TR() { return TR; } };
applyLang();
{ const m = QS.match(/[?&]step=(\d+)/); if (m) goStep(Math.min(STEPS.length - 1, +m[1]), 0); }
window.__ready = true;
