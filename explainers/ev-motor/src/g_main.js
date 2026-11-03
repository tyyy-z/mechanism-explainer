// ================= g_main: step logic, demo ops, autoplay, scene update, loop, hooks =================
let AUTOPLAY = !INTERACTIVE_START, LT = 0, EVI = 0, EVLAST = 0, VIEW = 'sys';
const VIS = { housing: 1, inv: 1, rotorOut: 0 }; let RO = 0;
function userTook() { if (AUTOPLAY) { AUTOPLAY = false; syncControls(); } }
// ---------- demo ops ----------
const OPR = { running: false, kind: '', t0: 0, dur: 1 };
const OPS = {
  LAUNCH: { dur: 9, f: k => { DRV.ped = 1; DRV.rpm = Math.round(18000 * smooth(k) / 100) * 100; } },
  PWM: { dur: 6, f: k => { DRV.rpm = Math.round(lerp(300, 7000, k) / 100) * 100; } },
  FIELD: { dur: 6, f: k => { DRV.rpm = Math.round(lerp(60, 1200, k) / 10) * 10; } },
  ANGLE: { dur: 7.5, f: k => { DRV.ped = 1; DRV.mode = k < .33 || k > .66 ? 'mtpa' : 'id0'; } },
  STEP: { dur: 5, f: k => { DRV.ped = k < .25 ? .2 : 1; } },
  SWEEP: { dur: 10, f: k => { DRV.ped = 1; DRV.rpm = Math.round(18000 * k / 100) * 100; } },
  REGEN: { dur: 7, f: k => { DRV.ped = k < .2 ? .6 : lerp(.6, -.6, clamp((k - .2) / .2)); DRV.rpm = Math.round(lerp(9000, 2500, smooth(clamp((k - .3) / .7))) / 100) * 100; } },
};
function startOp(kind) { OPR.running = true; OPR.kind = kind; OPR.t0 = SIM.t; OPR.dur = OPS[kind].dur; }
function abortOp() { OPR.running = false; }
function tickOp() { if (!OPR.running) return; const k = clamp((SIM.t - OPR.t0) / OPR.dur); OPS[OPR.kind].f(k); solveOP(); syncControls.dirty = true; if (k >= 1) { OPR.running = false; onOpDone(); syncControls(); } }
function onOpDone() {
  const m = {
    LAUNCH: B(`Top speed ${fmt(kmh(18000), 0)} km/h at 18,000 rpm; power capped at 200 kW`, `18000 rpm 对应 ${fmt(kmh(18000), 0)} km/h；功率封顶 200 kW`),
    PWM: B('Higher speed → higher back-EMF → wider PWM duty swing', '转速越高 → 反电动势越大 → PWM 占空比摆幅越大'),
    FIELD: B('Three currents, 120° apart, always summing to zero', '三相电流互差 120°，总和恒为零'),
    ANGLE: B('MTPA adds reluctance torque: more N·m from the same amps', 'MTPA 加入磁阻扭矩：同样电流得到更多扭矩'),
    STEP: B('The dq vector jumped to the new torque curve', 'dq 矢量跳到了新的恒扭矩曲线'),
    SWEEP: B('Past base speed the current angle advances: field weakening', '超过基速后电流角超前：弱磁'),
    REGEN: B(`Regen: ${kW(-OP.Pb)} back into the battery`, `回馈：${kW(-OP.Pb)} 回到电池`),
  }[OPR.kind]; if (m) toast(tr(m));
}
// ---------- steps ----------
function applyVis(v) {
  const g = k => v[k] == null ? 1 : v[k];
  GRP.housing.visible = g('housing') > 0 && VIS.housing; GRP.inv.visible = g('inv') > 0 && VIS.inv; GRP.stator.visible = g('stator') > 0; GRP.rotor.visible = g('rotor') > 0;
  GRP.resolver.visible = g('resolver') > 0; GRP.brg.visible = g('brg') > 0; GRP.pcb.visible = g('pcb') > 0;
  const cut = !!v.capCut; GRP.capCase.visible = GRP.capLbl.visible = !cut; for (const e of GRP.capElems) e.visible = cut;
}
function goStep(i, dur = 1.7) {
  i = clamp(i, 0, STEPS.length - 1); if (OPR.running) abortOp();
  CUR = i; const s = STEPS[i]; SCOPE = s.scope; WHYTAB = 'why'; hideTip();
  if (toast.until) { $('toast').style.opacity = 0; toast.until = 0; TOASTRECT = null; }
  Object.assign(DRV, { mode: 'mtpa' }, s.cfg); VIS.housing = 1; VIS.inv = 1; VIS.rotorOut = 0; applyVis(s.vis); syncViewBtns();
  VIEW = s.view; shot(SHOTS[s.view], dur); solveOP();
  renderStepTitle(); renderTrail(); renderWhy(); syncControls(); updateReadouts(); sizeScope();
}
function renderStepTitle() { const s = STEPS[CUR]; $('steptitle').innerHTML = `<span class="ix">${String(CUR + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}</span>${tr(s.title)}<small>${tr(s.sub)}</small>`; }
LANGHOOKS.push(() => { renderStepTitle(); renderTrail(); renderWhy(); ro.last = ''; updateReadouts(); syncControls(); layout(); updateTip.last = ''; updateTip(); });
function syncViewBtns() { $('btnHousing').classList.toggle('on', !!VIS.housing && GRP.housing.visible); $('btnInv').classList.toggle('on', !!VIS.inv && GRP.inv.visible); $('btnRotorOut').classList.toggle('on', !!VIS.rotorOut); }
$('btnHousing').addEventListener('click', () => { userTook(); VIS.housing = GRP.housing.visible ? 0 : 1; GRP.housing.visible = !!VIS.housing; syncViewBtns(); });
$('btnInv').addEventListener('click', () => { userTook(); VIS.inv = GRP.inv.visible ? 0 : 1; GRP.inv.visible = !!VIS.inv; syncViewBtns(); });
$('btnRotorOut').addEventListener('click', () => { userTook(); VIS.rotorOut = VIS.rotorOut ? 0 : 1; if (VIS.rotorOut) { GRP.rotor.visible = true; GRP.housing.visible = false; } syncViewBtns(); });
$('btnReset').addEventListener('click', () => { userTook(); user.daz = user.del = 0; user.zoom = 1; shot(SHOTS[VIEW], 1.2); });
// ---------- autoplay ----------
const idle = () => !OPR.running;
const TL = [[0.0, () => goStep(0, 0)], [0.8, () => startOp(STEPS[0].op)], [0.2, idle]];
for (let i = 1; i < STEPS.length; i++) TL.push([1.6, () => goStep(i)], [1.0, () => startOp(STEPS[i].op)], [0.2, idle]);
TL.push([1.4, () => { WHYTAB = 'src'; renderWhy(); }], [1.6, () => { userTook(); toast(LANG === 'zh' ? '自动演示结束——现在可以自由操作：点步骤、拖动滑块、点任意部件。' : 'Tour finished — explore freely: click steps, drag sliders, click any part.', 6000); }]);
function tickAuto(dt) { LT += dt; while (EVI < TL.length && LT - EVLAST >= TL[EVI][0]) { const r = TL[EVI][1](); if (r === false) break; EVLAST = LT; EVI++; } }
function restartAutoplay() { abortOp(); AUTOPLAY = true; LT = 0; EVI = 0; EVLAST = 0; user.daz = user.del = 0; user.zoom = 1; syncControls(); }
// ---------- labels ----------
const LBL = [
  ['stator', [-1, 10.6, 7.2], ['sys', 'stator']], ['winding', [-9.6, 6.5, 5.5], ['stator']], ['rotor', [7.4, 4.2, 4.2], ['rotor', 'lam']], ['resolver', [-11.6, 4.4, 1.5], ['res']],
  ['inv', [-1.2, 15.4, -6.6], ['inv', 'sys']], ['cap', [10.8, 18.6, 1.6], ['cap', 'inv']], ['housing', [0, -11.8, 8], ['sys']], ['brg', [-9.4, 5.6, 0], ['rotor']],
].map(([id, p, views]) => ({ id, views, L: label(INFO[id].name, V3(...p), { pri: 2 }) }));
// pickables
for (const k of Object.keys(INFO)) { const g = GRP[k]; if (!g) continue; (g.traverse ? g : null)?.traverse(o => { if (o.isMesh) pickable(o, INFO[k]); }); }
// ---------- scene update ----------
const VISR = 1 / 150; // display: 18,000 rpm → 2 rev/s
function sceneUpdate(dt) {
  const w = DRV.rpm / 60 * TAU; DRV.th += w * EV.p * dt * (OPR.kind === 'FIELD' || DRV.rpm < 1500 ? .05 : .004);
  GRP.rotor.rotation.z += w * VISR * dt; GRP.resRotor.rotation.z = GRP.rotor.rotation.z;
  RO = damp(RO, VIS.rotorOut, 4, dt); GRP.rotor.position.z = RO * 24; if (RO > .02) GRP.rotor.visible = true;
  for (const l of LBL) l.L.show = l.views.includes(VIEW) && visibleUp(GRP[l.id]) ? .9 : 0;
  const tk = OPR.running ? `<b>${tr(RUNLAB[OPR.kind])}</b> · ${fmt(OP.T, 0)} N·m · ${fmt(DRV.rpm, 0)} rpm` : `<b>${t('ready')}</b>`;
  if (tk !== sceneUpdate.tk) { $('tkphase').innerHTML = tk; sceneUpdate.tk = tk; }
}
function simStep(dt) {
  SIM.t += dt; if (AUTOPLAY) tickAuto(dt); tickOp(dt);
  tickExplode(); updateRig(); sceneUpdate(dt); tickToast();
}
let FR = 0;
function render() {
  placeCamera(); camera.updateMatrixWorld(); updateLabels();
  renderer.setScissorTest(false); renderer.clear(); const sx = stageOX + STAGE.x * stageScale, sy = VH - (stageOY + (STAGE.y + STAGE.h) * stageScale); renderer.setScissor(sx + 1, sy + 1, STAGE.w * stageScale - 2, STAGE.h * stageScale - 2); renderer.setScissorTest(true);
  renderer.render(scene, camera);
  if (CAPTURE || FR % 2 === 0) drawScope(); if (CAPTURE || FR % 6 === 0) { updateReadouts(); if (syncControls.dirty) { syncControls(); syncControls.dirty = false; } } updateTip(); FR++;
}
// ---------- input ----------
const ray = new THREE.Raycaster(); let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; if (drag.moved > 4) { userTook(); user.daz -= dx * .006; user.del = clamp(user.del + dy * .004, -1.2, 1.2); } });
canvas.addEventListener('pointerup', e => { const d = drag; drag = null; if (!d || d.moved > 4) return; pickAt(e.clientX, e.clientY); });
canvas.addEventListener('wheel', e => { e.preventDefault(); userTook(); user.zoom = clamp(user.zoom * Math.exp(e.deltaY * .0012), .3, 2.5); }, { passive: false });
function pickAt(cx, cy) {
  ray.setFromCamera(new THREE.Vector2(cx / VW * 2 - 1, -(cy / VH) * 2 + 1), camera);
  const hits = ray.intersectObjects(PICK.filter(visibleUp), false).filter(h => !(h.object.material === alCast));
  if (!hits.length) { hideTip(); return; }
  userTook(); showTip(hits[0].object.userData.info, (cx - stageOX) / stageScale, (cy - stageOY) / stageScale);
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowRight') { userTook(); goStep(CUR + 1); } else if (e.key === 'ArrowLeft') { userTook(); goStep(CUR - 1); } else if (e.key === 'Escape') hideTip(); });
addEventListener('resize', () => { layout(); sizeScope(); });
new ResizeObserver(() => { sizeScope(); drawScope(); }).observe(sc);
// ---------- boot ----------
PART.mesh.visible = false;
applyLang(); layout(); sizeScope(); envFor(350);
if (AUTOPLAY) restartAutoplay();
goStep(0, 0);
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame); if (CAPTURE) return;
  const el = Math.min(.1, (now - last) / 1000); last = now;
  if (!SIM.paused) { acc += el * SIM.speed; let n = 0; while (acc >= SIM.dt && n < 8) { simStep(SIM.dt); acc -= SIM.dt; n++; } if (n === 8) acc = 0; }
  render();
}
requestAnimationFrame(frame);
// ---------- test hooks ----------
window.__setTime = t => { let n = 0; while (SIM.t + SIM.dt / 2 < t && n < 200000) { simStep(SIM.dt); n++; } render(); return SIM.t; };
window.__state = () => ({ t: SIM.t, step: CUR, view: VIEW, op: OPR.kind, running: OPR.running, auto: AUTOPLAY, ev: EVI, nEv: TL.length, lang: LANG, drv: Object.assign({}, DRV), op_: { T: OP.T, P: OP.P, I: OP.I, beta: OP.beta, fw: OP.fw, Pb: OP.Pb } });
window.__goStep = i => goStep(i);
window.__setLang = l => { setLang(l); render(); return LANG; };
window.__scopeInfo = () => ({ scope: SCOPE, running: OPR.running });
window.__perf = () => { render(); const i = renderer.info; return { calls: i.render.calls, tris: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, texMB: +(Object.values(TX).reduce((a, tx) => a + (tx && tx.image ? (tx.image.width * tx.image.height * 4 * 1.33) : 0), 0) / 1048576).toFixed(1) }; };
window.__layout = () => { const r = []; for (const L of LABELS) if (L.el.style.visibility === 'visible' && +L.el.style.opacity > .05) { const b = L.el.getBoundingClientRect(); r.push({ t: L.el.textContent.slice(0, 30), x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); } return { labels: r }; };
window.I18N = I18N;
window.__dbg = { DRV, OP, GRP, OPR };
{ const m = QS.match(/[?&]step=(\d+)/); if (m) goStep(Math.min(STEPS.length - 1, +m[1]), 0); }
window.__ready = true;
