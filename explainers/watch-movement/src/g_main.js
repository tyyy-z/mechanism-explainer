// ================= g_main: step logic, autoplay, scene update, loop, hooks =================
let AUTOPLAY = !INTERACTIVE_START, LT = 0, EVI = 0, EVLAST = 0, VIEW = '';
const DISP = { rotor: 1, bridges: 1 }, DISPT = { rotor: 1, bridges: 1, dial: 0 };
function userTook() { if (AUTOPLAY) { AUTOPLAY = false; OPSCALE = 1; $('btnAuto').classList.remove('on'); syncControls(); } }
const PRM0 = Object.assign({}, PRM);
function applyCfg(c) { if (!c) return; Object.assign(PRM, c); if (c.wind != null) { W.wind = c.wind; W.A = ampTarget(W.wind); W.run = true; } TG.reset(); }
function syncViewBtns() { $('btnRotor').classList.toggle('on', DISPT.rotor > .5); $('btnBridges').classList.toggle('on', DISPT.bridges > .5); $('btnDial').classList.toggle('on', VIEW === 'dial'); }
function goStep(i, dur = 1.7) {
  i = clamp(i, 0, STEPS.length - 1); if (OPR.running) abortOp();
  CUR = i; const s = STEPS[i]; RAMPS = [];
  SCOPE = s.scope; WHYTAB = 'why'; hideTip(); applyCfg(s.cfg); if (toast.until) { $('toast').style.opacity = 0; toast.until = 0; TOASTRECT = null; }
  if (EXT.mv) setExplode('mv', 0, .9); $('btnExplode').classList.remove('on');
  DISPT.rotor = s.vis.rotor; DISPT.bridges = s.vis.bridges;
  VIEW = s.view; shot(SHOTS[s.view], dur); syncViewBtns();
  OPR.chipsSrc = []; renderChips(); OPR.phase = ''; OPR.dev = ''; OPR.kind = '';
  renderStepTitle(); renderTrail(); renderWhy(); syncControls(); updateReadouts(); sizeScope();
}
function renderStepTitle() { const s = STEPS[CUR]; $('steptitle').innerHTML = `<span class="ix">${String(CUR + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}</span>${tr(s.title)}<small>${tr(s.sub)}</small>`; }
LANGHOOKS.push(() => { renderStepTitle(); renderTrail(); renderWhy(); renderChips(); ro.last = ''; updateReadouts(); syncControls(); layout(); updateTip.last = ''; updateTip(); });
function toggleExplode() { const on = !EXT.mv; setExplode('mv', on ? 1 : 0, on ? 2 : 1.3); shot(on ? SHOTS.expl : SHOTS[VIEW], on ? 2 : 1.4); $('btnExplode').classList.toggle('on', on); }
$('btnExplode').addEventListener('click', () => { userTook(); toggleExplode(); });
$('btnRotor').addEventListener('click', () => { userTook(); DISPT.rotor = DISPT.rotor > .5 ? 0 : 1; syncViewBtns(); });
$('btnBridges').addEventListener('click', () => { userTook(); DISPT.bridges = DISPT.bridges > .5 ? .15 : 1; syncViewBtns(); });
$('btnDial').addEventListener('click', () => { userTook(); VIEW = VIEW === 'dial' ? STEPS[CUR].view : 'dial'; shot(SHOTS[VIEW], 1.6); syncViewBtns(); });
$('btnReset').addEventListener('click', () => { userTook(); user.daz = user.del = 0; user.zoom = 1; shot(SHOTS[VIEW], 1.2); });
function onOpDone() {
  syncControls(); updateReadouts(); const r = W.R;
  const msg = {
    TOUR: () => B('Spring → train → escapement → balance: every mechanical watch has these four', '发条 → 轮系 → 擒纵 → 摆轮：每块机械表都有这四部分'),
    WIND: () => B(`Fully wound: ${fmt(r.T, 1)} N·mm at the barrel, about ${r.resMax} h of reserve`, `已上满：条盒扭矩 ${fmt(r.T, 1)} N·mm，约 ${r.resMax} 小时动储`),
    TRAIN: () => B('Barrel to escape wheel ×5,040 in speed, ÷5,040 in torque', '条盒到擒纵轮：转速 ×5040，扭矩 ÷5040'),
    ESCAPE: () => B(`Impulse only within ±${LIFT / 2}° of centre — the balance is free ~95 % of each swing`, `只在中心 ±${LIFT / 2}° 内冲击——每次摆动约 95% 的时间摆轮是自由的`),
    BEAT: () => B('Beat rate is set by inertia and hairspring; the regulator trims a few s/day', '振频由惯量和游丝决定；快慢针微调每天几秒'),
    AUTO: () => B('An hour of walking adds several hours of reserve', '走一小时路能补几个小时的动储'),
    RESERVE: () => B('Run-down: amplitude fell, rate drifted, then it stopped — and restarted on winding', '放条过程：振幅下降、日差漂移、最后停走——上弦后重新起摆'),
  }[OPR.kind];
  if (msg && r) toast(tr(msg()));
}
// ---------- autoplay timeline ----------
const idle = () => !OPR.running;
const run = k => () => { startOp(k); syncControls(); };
const TL = [[0.0, () => goStep(0, 0)], [0.8, run('TOUR')], [0.2, idle]];
for (let i = 1; i < 7; i++) TL.push([1.0, () => goStep(i)], [0.8, run(['TOUR', 'WIND', 'TRAIN', 'ESCAPE', 'BEAT', 'AUTO', 'RESERVE'][i])], [0.2, idle]);
TL.push([1.4, () => { WHYTAB = 'src'; renderWhy(); }], [1.6, () => { userTook(); toast(LANG === 'zh' ? '自动演示结束——现在可以自由操作：点步骤、拖动滑块、点任意部件。' : 'Tour finished — explore freely: click steps, drag sliders, click any part.', 6000); }]);
function tickAuto(dt) { LT += dt; while (EVI < TL.length && LT - EVLAST >= TL[EVI][0]) { const r = TL[EVI][1](); if (r === false) break; EVLAST = LT; EVI++; } }
function restartAutoplay() { abortOp(); Object.assign(PRM, PRM0); W.wind = .95; AUTOPLAY = true; OPSCALE = .75; LT = 0; EVI = 0; EVLAST = 0; user.daz = user.del = 0; user.zoom = 1; $('btnAuto').classList.add('on'); syncControls(); }
// ---------- labels ----------
const LBL = [
  ['barrel', [POS.B[0] - 3.4, 3.4, POS.B[1] + 3.4], 'barrel', ['back', 'back2', 'train']], ['mains', [POS.B[0] + 2.6, 2.2, POS.B[1] + 2.6], 'mains', ['barrel']], ['ratchet', [POS.B[0], 4.0, POS.B[1] - 2.2], 'ratchet', ['barrel']],
  ['crownw', [POS.crw[0], 3.6, POS.crw[1]], 'crownw', ['barrel']], ['center', [0, 2.8, 0], 'center', ['train']], ['third', [POS.T[0] + 2.4, 1.7, POS.T[1] + 2.4], 'third', ['train']],
  ['fourth', [-2.6, 2.2, -2.6], 'fourth', ['train']], ['esc', [POS.E[0], 1.3, POS.E[1]], 'esc', ['escape', 'train']], ['pallet', [POS.P[0], 1.9, POS.P[1]], 'pallet', ['escape']],
  ['balance', [POS.Bl[0] + 4.1, 3.0, POS.Bl[1]], 'balance', ['balance', 'escape', 'back', 'back2']], ['hair', [POS.Bl[0] - 1.9, 3.4, POS.Bl[1] + 1.2], 'hair', ['balance']], ['cock', [POS.Bl[0] - 3.4, 4.2, POS.Bl[1] + 3.6], 'cock', ['balance']],
  ['rotor', [6, 6.2, 6], 'rotor', ['rotor', 'back']], ['auto', [RV.rd[0], 5.0, RV.rd[1]], 'auto', ['rotor']], ['bridges', [-6.5, 3.4, 5.4], 'bridges', ['back2']],
  ['stem', [-13, -2.15, 0], 'stem', ['keyless', 'dial']], ['keyless', [-7, -2.0, 2.2], 'keyless', ['keyless', 'dial']], ['motion', [0, -1.7, 3.2], 'motion', ['dial']],
].map(([id, p, sec, views]) => ({ id, sec, views, L: label(INFO[id] ? INFO[id].name : id, V3(...p), { pri: 2 }) }));
// ---------- display state: ghosting bridges, rotor, barrel lid ----------
const GHM = new Set(), GHO = []; for (const g of [GRP.bridges, GRP.auto]) g.traverse(o => { if (o.isMesh) { GHO.push(o); GHM.add(o.material); } });
function setOp(m, op) { const tr = op < .99; if (m.transparent !== tr) { m.transparent = tr; m.depthWrite = !tr; m.needsUpdate = true; } m.opacity = op; }
let GHOST = 1, LID = 1, ROTV = 1, TRA = 0;
const HICOL = new THREE.Color('#4a8ad6');
const SR = { bal: 0 };
function sceneUpdate(dt) {
  const r = W.R;
  // display
  GHOST = damp(GHOST, ACT.ghost >= 0 ? ACT.ghost : DISPT.bridges, 6, dt); LID = damp(LID, ACT.lid >= 0 ? ACT.lid : 1, 6, dt); ROTV = damp(ROTV, EXV.mv > .05 ? 1 : DISPT.rotor, 6, dt);
  for (const m of GHM) setOp(m, GHOST); for (const o of GHO) o.castShadow = GHOST > .6;
  setOp(BAR.lidM, LID); BAR.lid.castShadow = LID > .6;
  GRP.rotor.visible = ROTV > .04; GRP.rotor.position.y = (1 - ROTV) * 9 + (GRP.rotor.userData.exOff || 0);
  // kinematics (deg)
  TRA += dt * W.lapse * r.escRpm * 6;
  const E = -(W.escA + TRA), D = DEG;
  ROT.esc.rotation.y = E * D; ROT.fourth.rotation.y = -E / 12 * D; ROT.third.rotation.y = E / 90 * D; ROT.center.rotation.y = -E / 720 * D; ROT.barrel.rotation.y = E / 5040 * D;
  ROT.bal.rotation.y = W.theta * D; HAIR.tw.value = W.theta * D; ROT.pallet.rotation.y = -W.lever * D;
  const arb = -W.wind * 5.4 * TAU; ROT.arbor.rotation.y = arb; ROT.crownw.rotation.y = -arb * 60 / 26;
  ROT.stem.rotation.x = W.crown; ROT.spin.rotation.x = W.crown; ROT.wpin.rotation.y = W.crown * 16 / 18; ROT.setw.rotation.y = 0;
  ROT.rotor.rotation.y = W.rotor; ROT.rv1.rotation.y = -W.rotor * 16 / 24; ROT.rv2.rotation.y = -W.rotor * 16 / 24; ROT.rd.rotation.y = Math.abs(W.rotor) * .3;
  ROT.cannon.rotation.y = ROT.center.rotation.y; ROT.minw.rotation.y = -ROT.center.rotation.y * 3; ROT.hourw.rotation.y = ROT.center.rotation.y / 12;
  ROT.index.rotation.y = PRM.reg / 60 * 9 * D;
  updateMainspring();
  // highlight
  const hs = (ACT.hi || '').split(',').filter(Boolean);
  for (const sec in SECM) { const on = hs.includes(sec); for (const m of SECM[sec]) { m.emissive.copy(m.userData.e0); if (on) m.emissive.lerp(HICOL, .3 + .1 * Math.sin(SIM.t * 5)); } }
  // labels
  for (const l of LBL) l.L.show = l.views.includes(VIEW) && EXV.mv < .1 && !(l.sec === 'rotor' && ROTV < .5) ? (hs.includes(l.sec) ? 1 : .85) : 0;
  const tk = OPR.phase ? `${OPR.dev ? `<b>${tr(OPR.dev)}</b> · ` : ''}${OPR.phase}` : `<b>${t('ready')}</b>`;
  if (tk !== sceneUpdate.tk) { $('tkphase').innerHTML = tk; sceneUpdate.tk = tk; }
}
function simStep(dt) {
  SIM.t += dt;
  if (AUTOPLAY) tickAuto(dt);
  tickOp(dt); tickRamps(); dampAct(dt);
  W.lapse = ACT.lapse; watchStep(dt); W.R = R(); tickTG(dt);
  tickExplode(); updateExplode(dt); updateRig(); sceneUpdate(dt); tickToast();
  if (RAMPS.length || W.crownV || PRM.wrist !== 'off' || W.lapse) syncControls.dirty = true;
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
  const hits = ray.intersectObjects(PICK.filter(visibleUp), false).filter(h => !(GHM.has(h.object.material) && GHOST < .5) && !(h.object === BAR.lid && LID < .5));
  if (!hits.length) { hideTip(); return; }
  userTook(); showTip(hits[0].object.userData.info, (cx - stageOX) / stageScale, (cy - stageOY) / stageScale);
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowRight') { userTook(); goStep(CUR + 1); } else if (e.key === 'ArrowLeft') { userTook(); goStep(CUR - 1); } else if (e.key === 'Escape') hideTip(); });
addEventListener('resize', () => { layout(); sizeScope(); });
new ResizeObserver(() => { sizeScope(); drawScope(); }).observe(sc);
// ---------- boot ----------
if (CAPTURE) document.body.classList.add('capture');
PART.mesh.visible = false;
applyLang(); layout(); sizeScope();
for (let i = 0; i < 60; i++) watchStep(.02); W.R = R();
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
window.__state = () => ({ t: SIM.t, step: CUR, view: VIEW, op: OPR.kind, running: OPR.running, phase: OPR.phase, auto: AUTOPLAY, ev: EVI, nEv: TL.length, LT, lang: LANG, prm: Object.assign({}, PRM), w: { wind: W.wind, A: W.A, rate: W.rate, run: W.run, ph: W.phaseState } });
window.__goStep = i => goStep(i);
window.__setLang = l => { setLang(l); render(); return LANG; };
window.__scopeInfo = () => ({ scope: SCOPE, running: OPR.running });
window.__perf = () => { render(); const i = renderer.info; return { calls: i.render.calls, tris: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, texMB: +(Object.values(TX || {}).reduce((a, tx) => a + (tx && tx.image ? (tx.image.width * tx.image.height * 4 * 1.33) : 0), 0) / 1048576).toFixed(1) }; };
window.__audit = () => {
  // per-mesh: raw primitive w/o bevel/map, metal w/o env, and screen-coverage estimate via bbox projection
  const out = { primitives: [], metalNoEnv: [], hue: null }; const env = !!scene.environment;
  scene.traverse(o => { if (!o.isMesh || !visibleUp(o)) return; const g = o.geometry, m = o.material; const raw = /^(Box|Sphere|Cylinder|Plane)Geometry$/.test(g.type) && !(m.map || m.normalMap || m.bumpMap); if (raw && !o.isInstancedMesh && o !== PART.mesh && !(m.isShadowMaterial)) { const b = new THREE.Box3().setFromObject(o), c = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) c.push(new THREE.Vector3(x, y, z).project(camera)); const xs = c.map(v => v.x), ys = c.map(v => v.y); const a = (clamp(Math.max(...xs), -1, 1) - clamp(Math.min(...xs), -1, 1)) * (clamp(Math.max(...ys), -1, 1) - clamp(Math.min(...ys), -1, 1)) / 4; if (a > .02) out.primitives.push({ type: g.type, area: +a.toFixed(3), name: o.userData.part || o.name }); } if (m.metalness > .5 && !m.envMap && !env) out.metalNoEnv.push(o.userData.part || g.type); });
  // dominant hue over the 3D canvas
  const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight; render(); const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const bins = new Array(12).fill(0); let n = 0; for (let i = 0; i < px.length; i += 4 * 37) { if (px[i + 3] < 10) continue; const r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); n++; if (mx - mn < .08) continue; let hh = mx === r ? (gg - b) / (mx - mn) : mx === gg ? 2 + (b - r) / (mx - mn) : 4 + (r - gg) / (mx - mn); hh = ((hh * 60) + 360) % 360; bins[Math.floor(hh / 30)]++; }
  out.hue = { maxShare: n ? +(Math.max(...bins) / n).toFixed(3) : 0, n };
  out.pass = !out.primitives.length && !out.metalNoEnv.length && out.hue.maxShare <= .6; return out;
};
window.__layout = () => { const r = []; for (const L of LABELS) if (L.el.style.visibility === 'visible' && +L.el.style.opacity > .05) { const b = L.el.getBoundingClientRect(); r.push({ t: L.el.textContent.slice(0, 30), x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); } const tt = $('toast'), tb = tt.getBoundingClientRect(); return { labels: r, toast: +getComputedStyle(tt).opacity > .05 ? { x0: tb.left, y0: tb.top, x1: tb.right, y1: tb.bottom, text: tt.textContent } : null, stage: (() => { const s = $('stage').getBoundingClientRect(); return { x0: s.left + STAGE.x * stageScale, y0: s.top + STAGE.y * stageScale, x1: s.left + (STAGE.x + STAGE.w) * stageScale, y1: s.top + (STAGE.y + STAGE.h) * stageScale }; })() }; };
window.I18N = I18N;
window.__fid = (o = {}) => { if (OPR.running) abortOp(); AUTOPLAY = false; DISPT.rotor = o.rotor ?? 1; DISPT.bridges = o.bridges ?? 1; setExplode('mv', o.expl ? 1 : 0, 0.01); VIEW = o.shot || 'back'; const sh = Object.assign({}, SHOTS[o.shot || 'back'], o.cam || {}); shot(sh, 0); labelsEl.style.display = o.labels ? '' : 'none'; document.body.classList.toggle('fid', !o.labels); $('toast').style.opacity = 0; ACT.hi = ''; if (typeof ACTT !== 'undefined') { ACTT.hi = ''; ACTT.ghost = -1; ACTT.lid = -1; ACT.ghost = -1; ACT.lid = -1; } window.__setTime(SIM.t + 2.5); return __layout().stage; };
window.__dbg = { W, PRM, OPR, ACT, GRP, ROT, LABELS, STAGE, DISPT, TG };
{ const m = QS.match(/[?&]step=(\d+)/); if (m) goStep(Math.min(STEPS.length - 1, +m[1]), 0); }
window.__ready = true;
