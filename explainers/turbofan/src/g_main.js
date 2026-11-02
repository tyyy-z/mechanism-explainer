// ================= g_main: step logic, autoplay, scene update, loop, hooks =================
let AUTOPLAY = !INTERACTIVE_START, LT = 0, EVI = 0, EVLAST = 0, VIEW = '', NACON = false;
const CUTT = { to: 90 * DEG, from: 90 * DEG, t0: 0, dur: .01 };
function cutTo(deg, dur = 1.2) { Object.assign(CUTT, { from: CUT.th, to: deg * DEG, t0: SIM.t, dur }); }
function tickCut() { const k = smooth((SIM.t - CUTT.t0) / CUTT.dur); setCut(lerp(CUTT.from, CUTT.to, k)); }
function userTook() { if (AUTOPLAY) { AUTOPLAY = false; OPSCALE = 1; $('btnAuto').classList.remove('on'); syncControls(); } }
const PRM0 = Object.assign({}, PRM);
function applyCfg(c) { if (!c) return; Object.assign(PRM, c); }
function goStep(i, dur = 1.7) {
  i = clamp(i, 0, STEPS.length - 1); if (OPR.running) abortOp();
  CUR = i; const s = STEPS[i]; RAMPS = [];
  SCOPE = s.scope; WHYTAB = 'why'; hideTip(); applyCfg(s.cfg); if (toast.until) { $('toast').style.opacity = 0; toast.until = 0; TOASTRECT = null; }
  if (EXT.eng) setExplode('eng', 0, .9); $('btnExplode').classList.remove('on');
  VIEW = s.view; shot(SHOTS[s.view], dur);
  OPR.chipsSrc = []; renderChips(); OPR.phase = ''; OPR.dev = ''; OPR.kind = '';
  renderStepTitle(); renderTrail(); renderWhy(); syncControls(); updateReadouts(); sizeScope();
}
function renderStepTitle() { const s = STEPS[CUR]; $('steptitle').innerHTML = `<span class="ix">${String(CUR + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}</span>${tr(s.title)}<small>${tr(s.sub)}</small>`; }
LANGHOOKS.push(() => { renderStepTitle(); renderTrail(); renderWhy(); renderChips(); ro.last = ''; updateReadouts(); syncControls(); layout(); updateTip.last = ''; updateTip(); });
function toggleExplode() { const on = !EXT.eng; setExplode('eng', on ? 1 : 0, on ? 2 : 1.3); shot(on ? SHOTS.expl : SHOTS[VIEW], on ? 2 : 1.4); $('btnExplode').classList.toggle('on', on); }
$('btnExplode').addEventListener('click', () => { userTook(); toggleExplode(); });
$('btnCut').addEventListener('click', () => { userTook(); const on = CUTT.to < .1; cutTo(on ? 90 : 0); $('btnCut').classList.toggle('on', on); });
$('btnNac').addEventListener('click', () => { userTook(); NACON = !NACON; $('btnNac').classList.toggle('on', NACON); });
$('btnReset').addEventListener('click', () => { userTook(); user.daz = user.del = 0; user.zoom = 1; shot(SHOTS[VIEW], 1.2); });
function onOpDone() {
  syncControls(); updateReadouts(); const R = ENG.R;
  const msg = {
    START: () => B(`Started: ground idle, N2 ${fmt(R.n2 * 100, 0)} %, EGT ${fmt(R.egt, 0)} °C`, `起动完成：地面慢车，N2 ${fmt(R.n2 * 100, 0)}%，EGT ${fmt(R.egt, 0)} °C`),
    SPLIT: () => B(`Bypass gives ${fmt(R.Fb / R.F * 100, 0)} % of thrust from ${fmt(R.alpha, 1)}× the core's air`, `外涵用核心 ${fmt(R.alpha, 1)} 倍的空气，贡献 ${fmt(R.Fb / R.F * 100, 0)}% 的推力`),
    PARCEL: () => B(`One parcel: ${fmt(R.opr, 0)}× pressure, ${fmt(R.ST[4].T, 0)} K before it ever meets fuel`, `一团空气：遇到燃油前已被压到 ${fmt(R.opr, 0)} 倍、${fmt(R.ST[4].T, 0)} K`),
    IGNITE: () => B(`Fuel-air ratio ${fmt(R.f, 3)}: only ~1/40 of the air burns directly`, `油气比 ${fmt(R.f, 3)}：只有约 1/40 的空气直接参与燃烧`),
    WORK: () => B(`HPT ${fmt(R.PW.hpt, 1)} MW drives the HPC; LPT ${fmt(R.PW.lpt, 1)} MW drives the fan`, `高压涡轮 ${fmt(R.PW.hpt, 1)} MW 带压气机；低压涡轮 ${fmt(R.PW.lpt, 1)} MW 带风扇`),
    SPOOL: () => B('Idle → take-off in a few seconds: the heavy LP spool lags the HP spool', '慢车到起飞只需几秒：沉重的低压转子总是落后于高压转子'),
    CYCLE: () => B(`Higher BPR → better η_p; higher OPR → better η_th. LEAP-class η_o ≈ ${fmt(R.etaO * 100, 0)} %`, `涵道比越高 η_p 越好；压比越高 η_th 越好。LEAP 级 η_o ≈ ${fmt(R.etaO * 100, 0)}%`),
    SURGE: () => B('Recovered. FADEC schedules fuel and VSVs so the margin never hits zero in service', '已恢复。实际运行中 FADEC 调度供油和 VSV，保证裕度永不为零'),
  }[OPR.kind];
  if (msg && R) toast(tr(msg()));
}
// ---------- autoplay timeline ----------
const idle = () => !OPR.running;
const run = k => () => { startOp(k); syncControls(); };
const TL = [
  [0.0, () => goStep(0, 0)], [0.8, run('START')], [0.2, idle],
  [1.0, () => goStep(1)], [0.8, run('SPLIT')], [0.2, idle],
  [1.0, () => goStep(2)], [0.8, run('PARCEL')], [0.2, idle],
  [1.0, () => goStep(3)], [0.8, run('IGNITE')], [0.2, idle],
  [1.0, () => goStep(4)], [0.8, run('WORK')], [0.2, idle],
  [1.0, () => goStep(5)], [0.8, run('SPOOL')], [0.2, idle],
  [1.0, () => goStep(6)], [0.8, run('CYCLE')], [0.2, idle],
  [1.0, () => goStep(7)], [0.8, run('SURGE')], [0.2, idle],
  [1.4, () => { WHYTAB = 'src'; renderWhy(); }],
  [1.6, () => { userTook(); toast(LANG === 'zh' ? '自动演示结束——现在可以自由操作：点步骤、拖动滑块、点任意部件。' : 'Tour finished — explore freely: click steps, drag sliders, click any part.', 6000); }],
];
function tickAuto(dt) { LT += dt; while (EVI < TL.length && LT - EVLAST >= TL[EVI][0]) { const r = TL[EVI][1](); if (r === false) break; EVLAST = LT; EVI++; } }
function restartAutoplay() { abortOp(); Object.assign(PRM, PRM0); AUTOPLAY = true; OPSCALE = .75; LT = 0; EVI = 0; EVLAST = 0; user.daz = user.del = 0; user.zoom = 1; $('btnAuto').classList.add('on'); syncControls(); }
// ---------- flow paths in the cut sector (psi 15..75 deg -> visible half) ----------
const PSI = [25, 45, 65].map(d => d * DEG);
const pol = (x, r, psi) => [x, r * Math.cos(psi), r * Math.sin(psi)];
const BYP = PSI.flatMap((ps, k) => [.3, .7].map(f => { const r0 = lerp(4.3, 7.3, f); return path([pol(-9, lerp(2, 6.8, f), ps), pol(-3, lerp(3.6, 7.3, f), ps), pol(2.0, lerp(4.2, 7.4, f), ps), pol(7, lerp(4.8, 7.3, f), ps), pol(14, lerp(5.6, 7.2, f), ps), pol(26, lerp(6.0, 7.4, f), ps)]); }));
const coreLine = (f, ps) => { const pts = [pol(-9, 1.2 + f * .6, ps), pol(-3, 1.7 + f * .6, ps)]; for (let x = 2.3; x <= 21.01; x += .9) pts.push(pol(x, lerp(hubR(x), tipR(x), .25 + f * .5), ps)); pts.push(pol(24, 2.6 + f * .8, ps), pol(32, 2.5 + f * 1.1, ps)); return path(pts); };
const CORE = PSI.flatMap(ps => [.15, .5, .85].map(f => coreLine(f, ps)));
const FUELP = Array.from({ length: 6 }, (_, i) => { const ps = (15 + i * 12) * DEG; return path([pol(13.0, 3.15, ps), pol(13.3, 2.6, ps), pol(13.9, 2.5, ps)]); });
const CORESPAN = [-9, 32];
const _ct = new THREE.Color(), _tc = new THREE.Color();
const tempCol = (T, c) => { const k = clamp((T - 260) / 1500); if (k < .2) c.set(COL.cold).lerp(_tc.set(COL.warm), k / .2); else if (k < .55) c.set(COL.warm).lerp(_tc.set(COL.hot), (k - .2) / .35); else c.set(COL.hot).lerp(_tc.set(COL.flame), (k - .55) / .45); return c; };
const STX = { '0': -9, '2': 2.3, '13': 7, '25': 7.0, '3': 12.6, '4': 14.6, '45': 16.0, '5': 21, '9': 26 };
function coreT(x) { const S = ENG.R.ST; const seq = ['0', '2', '25', '3', '4', '45', '5', '9'].map(k => [STX[k], S.find(z => z.k === k).T]); if (x <= seq[0][0]) return seq[0][1]; for (let i = 0; i < seq.length - 1; i++) if (x <= seq[i + 1][0]) return lerp(seq[i][1], seq[i + 1][1], (x - seq[i][0]) / (seq[i + 1][0] - seq[i][0])); return seq[seq.length - 1][1]; }
// parcel marker
const PARCEL = new THREE.Mesh(new THREE.SphereGeometry(.32, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })); scene.add(PARCEL);
const PARCELP = coreLine(.5, 45 * DEG);
const PARLAB = label(() => '', PARCEL.position, { cls: 'hot', pri: 9, side: 'r' });
// labels for the main parts (bilingual)
const LBL = [
  ['fan', [1.2, 6.6, 3.2], 'fan', ['side', 'fan', 'ext']], ['booster', [4.4, 3.5, 1.9], 'lpc', ['fan', 'hpc']], ['hpc', [9.6, 2.5, 1.3], 'hpc', ['hpc', 'side']],
  ['comb', [13.6, 2.9, 1.3], 'comb', ['comb', 'side']], ['hpt', [15.2, 2.9, 1.2], 'hpt', ['turb', 'comb']], ['lpt', [18.5, 3.6, 1.6], 'lpt', ['turb', 'side']],
  ['nozzle', [23.5, 3.4, 2.2], 'noz', ['side', 'ext']], ['shaft', [10, .55, .3], 'shaft', ['turb', 'hpc']], ['ogv', [6.4, 6.4, 2.6], 'fan', ['fan']], ['vsv', [8.7, 3.0, 1.7], 'hpc', ['hpc']],
  ['agb', [6.5, -8.6, 1.2], 'acc', ['fan']], ['fuel', [13.0, 3.4, 1.5], 'comb', ['comb']],
].map(([id, p, sec, views]) => ({ id, sec, views, L: label(INFO[id].name, V3(...p), { pri: 2 }) }));
// ---------- per-frame scene ----------
const HICOL = new THREE.Color('#4a8ad6'), HISEC = { fan: 'fan', ogv: 'fan', lpc: 'lpc', hpc: 'hpc', vsv: 'hpc', comb: 'comb', fuel: 'comb', hpt: 'hpt', lpt: 'lpt', noz: 'noz', shaft: 'shaft', agb: 'acc' };
const HOTC = new THREE.Color('#ff5a1a');
let SHAKE = 0;
function sceneUpdate(dt) {
  const R = ENG.R, s = STEPS[CUR];
  // spools
  SPOOL.a1 += dt * ENG.n1 * 7.5; SPOOL.a2 += dt * ENG.n2 * 7.5 * 2.6;
  for (const g of SPOOL.lp) g.rotation.x = SPOOL.a1; for (const g of SPOOL.hp) g.rotation.x = SPOOL.a2;
  // nacelle (hidden by default in the cutaway so the parts read)
  MOD.nac.visible = NACON || EXV.eng > .02 ? NACON && EXV.eng < .02 : false; for (const id of ['agb', 'acc']) if (PARTS[id] && PARTS[id].mesh) PARTS[id].mesh.visible = !MOD.nac.visible; // accessories sit inside the fan cowl
  // explode: fan module forward, LPT module aft
  // highlight + heat
  const hs = HISEC[ACT.hi] || '';
  for (const sec in SECM) for (const m of SECM[sec]) {
    m.emissive.copy(m.userData.e0);
    if (sec === hs) m.emissive.lerp(HICOL, .28 + .1 * Math.sin(SIM.t * 5));
    if ((sec === 'hpt' || sec === 'lpt' || sec === 'noz') && m.userData.e0) { const k = clamp((R.egt - 300) / 700) * (sec === 'hpt' ? .55 : sec === 'lpt' ? .32 : .18); m.emissive.lerp(HOTC, k * (m.metalness > .5 ? 1 : .6)); }
  }
  // flame
  const fl = (ENG.lit && ENG.fuel) ? clamp((R.Tt4 - 900) / 900) : 0;
  FLAME.mat.opacity = damp(FLAME.mat.opacity, fl * (.35 + .08 * Math.sin(SIM.t * 31)) * (CUT.th > .2 ? 1 : 0), 8, dt);
  FLAME.cones.material.opacity = FLAME.mat.opacity * 1.4;
  // flow particles
  const streams = []; const thrK = .25 + .75 * clamp(R.n1);
  const per = 2.4 / Math.max(.25, R.n1);
  if (ACT.byp * thrK > .03) BYP.forEach((c, k) => streams.push({ curve: c, n: 26, period: per, col: COL.bypass, size: .085, rate: ACT.byp * thrK, seed: k }));
  if (ACT.core * thrK > .03) CORE.forEach((c, k) => streams.push({ curve: c, n: 46, period: per * 1.5, colf: (u, cc) => tempCol(coreT(lerp(CORESPAN[0], CORESPAN[1], u)), cc), size: .07, rate: ACT.core * thrK, seed: 20 + k }));
  if (ACT.fuelvis > .05 && ENG.fuel) FUELP.forEach((c, k) => streams.push({ curve: c, n: 8, period: .7, col: COL.fuel, size: .05, rate: ACT.fuelvis, seed: 40 + k }));
  if (ACT.surge > .05) CORE.slice(0, 4).forEach((c, k) => streams.push({ curve: { getPointAt: (u, v) => c.getPointAt(clamp(.42 - u * .42), v) }, n: 30, period: .8, col: COL.bad, size: .1, rate: ACT.surge, seed: 60 + k }));
  updateParticles(streams, SIM.t);
  // parcel
  const pOn = ACT.parcel >= 0 && OPR.kind === 'PARCEL'; PARCEL.visible = pOn;
  if (pOn) { const xw = lerp(-3.5, 13.6, ACT.parcel), u = (xw - CORESPAN[0]) / (CORESPAN[1] - CORESPAN[0]); PARCELP.getPointAt(clamp(u), PARCEL.position); tempCol(coreT(xw), PARCEL.material.color); const sc = 1 - .45 * clamp((xw + 3.5) / 17); PARCEL.scale.setScalar(sc); PARLAB.set(OPR.phase); }
  PARLAB.show = pOn ? 1 : 0;
  // labels: show the ones relevant to the current view (skip during explode)
  for (const l of LBL) l.L.show = l.views.includes(VIEW) && !pOn && EXV.eng < .1 ? (l.sec === hs ? 1 : .85) : 0;
  // surge shake
  SHAKE = damp(SHAKE, ACT.surge, 10, dt); ENGINE.position.y = SHAKE * .08 * Math.sin(SIM.t * 63); ENGINE.position.z = SHAKE * .05 * Math.sin(SIM.t * 47);
  // ticker
  const tk = OPR.phase ? `${OPR.dev ? `<b>${OPR.dev}</b> · ` : ''}${OPR.phase}` : `<b>${t('ready')}</b>`;
  if (tk !== sceneUpdate.tk) { $('tkphase').innerHTML = tk; sceneUpdate.tk = tk; }
}
// explode wiring
explodable(MOD.fan, 'eng', [-7, 0, 0], [0, 0, 0], 0); explodable(MOD.lpt, 'eng', [7, 0, 0], [0, 0, 0], .2);
function simStep(dt) {
  SIM.t += dt;
  if (AUTOPLAY) tickAuto(dt);
  tickOp(dt); tickRamps(); dampAct(dt);
  ENG.thr = OPR.thrOv != null ? OPR.thrOv : PRM.thr; engineStep(dt);
  if (ENG.surge && !OPR.running) ENG.surge = 0;
  tickExplode(); updateExplode(dt); tickCut(); updateRig(); sceneUpdate(dt); tickToast();
  if (RAMPS.length || OPR.thrOv != null) syncControls.dirty = true;
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
canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; if (drag.moved > 4) { userTook(); user.daz -= dx * .006; user.del = clamp(user.del + dy * .004, -.6, .9); } });
canvas.addEventListener('pointerup', e => { const d = drag; drag = null; if (!d || d.moved > 4) return; pickAt(e.clientX, e.clientY); });
canvas.addEventListener('wheel', e => { e.preventDefault(); userTook(); user.zoom = clamp(user.zoom * Math.exp(e.deltaY * .0012), .35, 2.5); }, { passive: false });
function pickAt(cx, cy) {
  ray.setFromCamera(new THREE.Vector2(cx / VW * 2 - 1, -(cy / VH) * 2 + 1), camera);
  const hits = ray.intersectObjects(PICK.filter(visibleUp), false).filter(h => { const p = h.point; if (CUT.th < .05) return true; const ang = Math.atan2(p.z, p.y); return !(ang > 0 && ang < CUT.th && Math.hypot(p.y, p.z) > .1); });
  if (!hits.length) { hideTip(); return; }
  userTook(); showTip(hits[0].object.userData.info, (cx - stageOX) / stageScale, (cy - stageOY) / stageScale);
}
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowRight') { userTook(); goStep(CUR + 1); } else if (e.key === 'ArrowLeft') { userTook(); goStep(CUR - 1); } else if (e.key === 'Escape') hideTip(); });
addEventListener('resize', () => { layout(); sizeScope(); });
new ResizeObserver(() => { sizeScope(); drawScope(); }).observe(sc);
// ---------- boot ----------
if (CAPTURE) document.body.classList.add('capture');
applyLang(); layout(); sizeScope(); cutTo(90, .01);
$('btnCut').classList.add('on');
ENG.thr = PRM.thr; for (let i = 0; i < 400; i++) engineStep(.02);
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
window.__state = () => ({ t: SIM.t, step: CUR, view: VIEW, op: OPR.kind, running: OPR.running, phase: OPR.phase, auto: AUTOPLAY, ev: EVI, nEv: TL.length, LT, lang: LANG, prm: Object.assign({}, PRM), eng: { n1: ENG.n1, n2: ENG.n2, lit: ENG.lit, F: ENG.R.F, sm: ENG.R.map.sm, egt: ENG.R.egt } });
window.__goStep = i => goStep(i);
window.__setLang = l => { setLang(l); render(); return LANG; };
window.__scopeInfo = () => ({ scope: SCOPE, running: OPR.running });
window.__perf = () => { render(); const i = renderer.info; return { calls: i.render.calls, tris: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, texMB: +(Object.values(TX || {}).reduce((a, tx) => a + (tx && tx.image ? (tx.image.width * tx.image.height * 4 * 1.33) : 0), 0) / 1048576).toFixed(1) }; };
window.__audit = () => {
  // per-mesh: raw primitive w/o bevel/map, metal w/o env, and screen-coverage estimate via bbox projection
  const out = { primitives: [], metalNoEnv: [], hue: null }; const env = !!scene.environment;
  scene.traverse(o => { if (!o.isMesh || !visibleUp(o)) return; const g = o.geometry, m = o.material; const raw = /^(Box|Sphere|Cylinder|Plane)Geometry$/.test(g.type) && !(m.map || m.normalMap || m.bumpMap); if (raw && !o.isInstancedMesh && o !== PARCEL && !(m.isShadowMaterial)) { const b = new THREE.Box3().setFromObject(o), c = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) c.push(new THREE.Vector3(x, y, z).project(camera)); const xs = c.map(v => v.x), ys = c.map(v => v.y); const a = (clamp(Math.max(...xs), -1, 1) - clamp(Math.min(...xs), -1, 1)) * (clamp(Math.max(...ys), -1, 1) - clamp(Math.min(...ys), -1, 1)) / 4; if (a > .02) out.primitives.push({ type: g.type, area: +a.toFixed(3), name: o.userData.part || o.name }); } if (m.metalness > .5 && !m.envMap && !env) out.metalNoEnv.push(o.userData.part || g.type); });
  // dominant hue over the 3D canvas
  const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight; render(); const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const bins = new Array(12).fill(0); let n = 0; for (let i = 0; i < px.length; i += 4 * 37) { if (px[i + 3] < 10) continue; const r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); n++; if (mx - mn < .08) continue; let hh = mx === r ? (gg - b) / (mx - mn) : mx === gg ? 2 + (b - r) / (mx - mn) : 4 + (r - gg) / (mx - mn); hh = ((hh * 60) + 360) % 360; bins[Math.floor(hh / 30)]++; }
  out.hue = { maxShare: n ? +(Math.max(...bins) / n).toFixed(3) : 0, n };
  out.pass = !out.primitives.length && !out.metalNoEnv.length && out.hue.maxShare <= .6; return out;
};
window.__layout = () => { const r = []; for (const L of LABELS) if (L.el.style.visibility === 'visible' && +L.el.style.opacity > .05) { const b = L.el.getBoundingClientRect(); r.push({ t: L.el.textContent.slice(0, 30), x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }); } const tt = $('toast'), tb = tt.getBoundingClientRect(); return { labels: r, toast: +getComputedStyle(tt).opacity > .05 ? { x0: tb.left, y0: tb.top, x1: tb.right, y1: tb.bottom, text: tt.textContent } : null, stage: (() => { const s = $('stage').getBoundingClientRect(); return { x0: s.left + STAGE.x * stageScale, y0: s.top + STAGE.y * stageScale, x1: s.left + (STAGE.x + STAGE.w) * stageScale, y1: s.top + (STAGE.y + STAGE.h) * stageScale }; })() }; };
window.I18N = I18N;
window.__fid = (o = {}) => { if (OPR.running) abortOp(); AUTOPLAY = false; NACON = !!o.nac; setExplode('eng', o.expl ? 1 : 0, 0.01); cutTo(o.cut ?? 90, 0.01); const sh = Object.assign({}, SHOTS[o.shot || 'side'], o.cam || {}); shot(sh, 0); labelsEl.style.display = o.labels ? '' : 'none'; document.body.classList.toggle('fid', !o.labels); PART.mesh.visible = !!o.labels; $('toast').style.opacity = 0; ACT.hi = ''; if (typeof ACTT !== 'undefined') ACTT.hi = ''; window.__setTime(SIM.t + 2.5); return __layout().stage; };
window.__dbg = { ENG, PRM, OPR, ACT, PARTS, MOD, CUT, LABELS, STAGE, SPOOL };
{ const m = QS.match(/[?&]step=(\d+)/); if (m) goStep(Math.min(STEPS.length - 1, +m[1]), 0); }
window.__ready = true;
