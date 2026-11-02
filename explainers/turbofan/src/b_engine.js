// ===================== b_engine: CFM56-7B-class two-spool turbofan, real geometry =====================
// 1 unit = 10 cm. Axis = +X (intake at -X). Fan blade LE hub at x = 0. Dimensions per refs/REFS.md.
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const SEG = QUALITY.hi ? 120 : 72;
const ENGINE = new THREE.Group(); scene.add(ENGINE);
const MOD = { fan: new THREE.Group(), core: new THREE.Group(), lpt: new THREE.Group(), nac: new THREE.Group() };
for (const k in MOD) { MOD[k].name = k; ENGINE.add(MOD[k]); }
const SPOOL = { lp: [], hp: [], a1: 0, a2: 0 };
function spoolGroup(kind, parent) { const g = new THREE.Group(); parent.add(g); SPOOL[kind].push(g); return g; }

// ---------- cutaway (quarter section, animatable) ----------
const CUT = { th: 0, planes: [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)], caps: [] };
function setCut(th) {
  CUT.th = th; CUT.planes[1].normal.set(0, -Math.sin(th), Math.cos(th));
  for (const c of CUT.caps) { c.g1.rotation.x = th; c.g0.visible = c.g1.visible = th > 0.02; }
}
// ---------- materials (PBR; per-section clones so a section can be highlighted) ----------
const MAT = {}; const SECM = {};
function PM(color, o = {}) { const m = new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: .45, metalness: .8, envMapIntensity: 1.0, side: THREE.DoubleSide }, o)); return m; }
function cutM(m) { m.clippingPlanes = CUT.planes; m.clipIntersection = true; return m; }
function texNoise(w, h, f) { return canvasTex(w, h, f); }
// brushed-metal roughness map + cooling-hole map (procedural, tiny)
const TX = {};
TX.brush = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); for (let i = 0; i < 1400; i++) { const v = 100 + rr(0, 80) | 0; g.strokeStyle = `rgb(${v},${v},${v})`; g.globalAlpha = .35; const y = rr(0, H); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + rr(-2, 2)); g.stroke(); } });
TX.brush.wrapS = TX.brush.wrapT = THREE.RepeatWrapping; TX.brush.colorSpace = THREE.NoColorSpace;
TX.holes = canvasTex(512, 128, (g, W, H) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a2a2a'; for (let row = 0; row < 6; row++) for (let i = 0; i < 64; i++) { g.beginPath(); g.arc((i + (row % 2) * .5) * W / 64, 10 + row * 21, 2.2, 0, TAU); g.fill(); } g.fillStyle = '#9a9a9a'; for (let k = 0; k < 3; k++) g.fillRect(0, 36 + k * 42, W, 3); });
TX.holes.wrapS = TX.holes.wrapT = THREE.RepeatWrapping;
TX.braid = canvasTex(64, 64, (g, W, H) => { g.fillStyle = '#9da2a8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#5f646b'; g.lineWidth = 2; for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 8, 0); g.lineTo(i * 8 + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i * 8 + 64, 0); g.lineTo(i * 8, 64); g.stroke(); } });
TX.braid.wrapS = TX.braid.wrapT = THREE.RepeatWrapping; TX.braid.repeat.set(40, 1);
TX.spin = canvasTex(512, 256, (g, W, H) => { g.fillStyle = '#1f2125'; g.fillRect(0, 0, W, H); g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, W, H * .05); g.beginPath(); g.moveTo(0, H * .05); g.bezierCurveTo(W * .12, H * .35, W * .22, H * .7, W * .26, H); g.lineTo(W * .29, H); g.bezierCurveTo(W * .25, H * .7, W * .15, H * .35, W * .035, H * .05); g.fill(); });
TX.paint = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, W, H); for (let i = 0; i < 3000; i++) { const v = 110 + rr(0, 40) | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rr(0, W), rr(0, H), 2, 2); } });
TX.paint.wrapS = TX.paint.wrapT = THREE.RepeatWrapping; TX.paint.colorSpace = THREE.NoColorSpace;
TX.paint.repeat.set(8, 2);
const BASE = {
  ti: () => PM('#b9bdc3', { roughness: .28, metalness: .9, roughnessMap: TX.brush }),
  fanblade: () => PM('#c9ccd1', { roughness: .22, metalness: .92, roughnessMap: TX.brush, clearcoat: .3, clearcoatRoughness: .3 }),
  steel: () => PM('#8b8f96', { roughness: .4, metalness: .85, roughnessMap: TX.brush }),
  ni: () => PM('#8e877d', { roughness: .5, metalness: .8 }),
  hpt: () => PM('#b49b6e', { roughness: .38, metalness: .85, emissive: '#000000' }),
  lpt: () => PM('#9b8f7e', { roughness: .45, metalness: .82, emissive: '#000000' }),
  liner: () => PM('#a8957a', { roughness: .55, metalness: .7, map: TX.holes, bumpMap: TX.holes, bumpScale: .6 }),
  corecase: () => PM('#55534f', { roughness: .62, metalness: .55, roughnessMap: TX.paint }),
  hotcase: () => PM('#6b625a', { roughness: .58, metalness: .6, roughnessMap: TX.paint }),
  fancase: () => PM('#5d6232', { roughness: .66, metalness: .1, roughnessMap: TX.paint, clearcoat: .15 }),
  flange: () => PM('#a7abb1', { roughness: .32, metalness: .9 }),
  spinner: () => PM('#ffffff', { map: TX.spin, roughness: .28, metalness: .35, clearcoat: .6, clearcoatRoughness: .2 }),
  pipe: () => PM('#c1c5cb', { roughness: .25, metalness: .95 }),
  hose: () => PM('#a1a6ad', { roughness: .55, metalness: .6, map: TX.braid }),
  cast: () => PM('#8d968c', { roughness: .66, metalness: .3, roughnessMap: TX.paint }),
  eec: () => PM('#6f747a', { roughness: .5, metalness: .55 }),
  plug: () => PM('#7a746d', { roughness: .85, metalness: .35, roughnessMap: TX.paint }),
  shaft: () => PM('#9aa0a7', { roughness: .3, metalness: .9 }),
  nacelle: () => PM('#eef1f4', { roughness: .32, metalness: 0, clearcoat: .8, clearcoatRoughness: .15 }),
  lip: () => PM('#cfd3d8', { roughness: .18, metalness: 1 }),
  liner2: () => PM('#3a3d42', { roughness: .8, metalness: .1 }),
  stripe: () => PM('#1d3f8a', { roughness: .35, metalness: 0, clearcoat: .7 }),
  stripe2: () => PM('#f2c230', { roughness: .35, metalness: 0, clearcoat: .7 }),
};
function sm(sec, key, cut = true) {
  const k = sec + ':' + key + (cut ? ':c' : '');
  if (!MAT[k]) { const m = BASE[key](); if (cut) cutM(m); MAT[k] = m; (SECM[sec] = SECM[sec] || []).push(m); m.userData.sec = sec; m.userData.e0 = m.emissive.clone(); }
  return MAT[k];
}
TX.hatch = canvasTex(64, 64, (g, W, H) => { g.fillStyle = '#c98378'; g.fillRect(0, 0, W, H); g.strokeStyle = '#b0574c'; g.lineWidth = 6; for (let i = -1; i < 3; i++) { g.beginPath(); g.moveTo(i * 32 - 4, H + 4); g.lineTo(i * 32 + W + 4, -4); g.stroke(); } });
TX.hatch.wrapS = TX.hatch.wrapT = THREE.RepeatWrapping; TX.hatch.repeat.set(2.2, 2.2);
const CAPMAT = new THREE.MeshStandardMaterial({ color: '#ffffff', map: TX.hatch, roughness: .6, metalness: .05, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
// ---------- geometry helpers ----------
function latheGeo(prof, seg = SEG, phi0 = 0, phiL = TAU) {
  const pts = prof.map(([x, r]) => new THREE.Vector2(Math.max(0.0001, r), x));
  const g = new THREE.LatheGeometry(pts, seg, phi0, phiL); g.rotateZ(-Math.PI / 2); return g;
}
const closeP = p => p.concat([p[0]]);
// solid of revolution from closed (x,r) profile; optional section cap on the cut planes
function solid(prof, mat, parent, { cap = true, seg = SEG, info = null, mod = 'core', shadow = true } = {}) {
  const m = new THREE.Mesh(latheGeo(closeP(prof), seg), mat); m.castShadow = shadow; m.receiveShadow = true; parent.add(m);
  if (cap && mat.clippingPlanes) addCap(prof, mod);
  if (info) pickable(m, info);
  return m;
}
const CAPG = {};
function addCap(prof, mod) {
  let c = CAPG[mod]; if (!c) { c = CAPG[mod] = { g0: new THREE.Group(), g1: new THREE.Group(), geos: [] }; MOD[mod].add(c.g0, c.g1); CUT.caps.push(c); c.g0.visible = c.g1.visible = false; }
  const sh = new THREE.Shape(prof.map(([x, r]) => new THREE.Vector2(x, r))); c.geos.push(new THREE.ShapeGeometry(sh));
}
function finalizeCaps() { for (const k in CAPG) { const c = CAPG[k]; const g = mergeGeometries(c.geos); c.g0.add(new THREE.Mesh(g, CAPMAT)); c.g1.add(new THREE.Mesh(g, CAPMAT)); } }
// closed profile from an inner polyline and wall thickness (offset outward in r)
const wall = (line, t) => line.concat(line.slice().reverse().map(([x, r]) => [x, r + t]));
const ringP = (x0, x1, r0, r1, ch = 0.03) => [[x0, r0 + ch], [x0 + ch, r0], [x1 - ch, r0], [x1, r0 + ch], [x1, r1 - ch], [x1 - ch, r1], [x0 + ch, r1], [x0, r1 - ch]];
// "can": chamfered cylinder of revolution along local axis (for accessories) — not a raw primitive
function canGeo(len, r, ch = .06, nose = 0) { const p = [[0, 0.001], [0, r - ch], [ch, r], [len - ch - nose, r], [len - nose, r - ch], [len, (r - ch) * .55], [len, 0.001]]; return latheGeo(p, 40); }
// placement on the engine: azimuth psi measured from +Y toward +Z
const polar = (x, r, psi) => new THREE.Vector3(x, r * Math.cos(psi), r * Math.sin(psi));
// ---------- airfoil loft (twisted, cambered, swept) ----------
function bladeGeo({ r0, r1, xc0, xc1, c0, c1, b0, b1, th0 = .09, th1 = .035, cam0 = .07, cam1 = .025, sweep = 0, ns = 6, np = 9, bend = 0 }) {
  const per = 2 * np, pos = [], idx = [];
  for (let i = 0; i <= ns; i++) {
    const s = i / ns, r = lerp(r0, r1, s), c = lerp(c0, c1, s), b = lerp(b0, b1, Math.pow(s, .85)), th = lerp(th0, th1, s), cam = lerp(cam0, cam1, s);
    const xc = lerp(xc0, xc1, s) + sweep * s * s;
    for (let k = 0; k < per; k++) {
      const up = k < np, kk = up ? k : per - 1 - k, u = .5 * (1 - Math.cos(Math.PI * kk / (np - 1)));
      const yt = 5 * th * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
      const yc = cam * 4 * u * (1 - u);
      const a = (u - .5) * c, n = (yc + (up ? yt : -yt)) * c;
      const ax = xc + a * Math.cos(b) - n * Math.sin(b), tg = a * Math.sin(b) + n * Math.cos(b) + bend * s * s;
      const ang = tg / r; pos.push(ax, r * Math.cos(ang), r * Math.sin(ang));
    }
  }
  for (let i = 0; i < ns; i++) for (let k = 0; k < per; k++) {
    const a = i * per + k, b2 = i * per + (k + 1) % per, c2 = (i + 1) * per + (k + 1) % per, d = (i + 1) * per + k; idx.push(a, b2, c2, a, c2, d);
  }
  // tip cap
  const ci = pos.length / 3, last = ns * per; let cx = 0, cy = 0, cz = 0; for (let k = 0; k < per; k++) { cx += pos[(last + k) * 3]; cy += pos[(last + k) * 3 + 1]; cz += pos[(last + k) * 3 + 2]; }
  pos.push(cx / per, cy / per, cz / per); for (let k = 0; k < per; k++) idx.push(last + k, last + (k + 1) % per, ci);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function rowGeo(geo, n, phase = 0) { const arr = []; for (let i = 0; i < n; i++) arr.push(geo.clone().rotateX(phase + TAU * i / n)); return arr; }
function rowMesh(geos, mat, parent, info) { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); if (info) pickable(m, info); return m; }
function tubeGeo(pts, r, seg = 48, rs = 8) { const c = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p)), false, 'catmullrom', .3); return new THREE.TubeGeometry(c, seg, r, rs, false); }
function torusAt(x, R, r, mat, parent, seg = SEG) { const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 8, seg), mat); m.rotation.y = Math.PI / 2; m.position.x = x; m.castShadow = true; parent.add(m); return m; }
// bolts: instanced hex heads per module
const BOLTS = { fan: [], core: [], lpt: [] };
function boltRing(mod, x, r, n, face = 1, s = .07) { for (let i = 0; i < n; i++) BOLTS[mod].push({ x, r, psi: TAU * i / n + .5 / n, face, s }); }
function finalizeBolts() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 6); g.rotateZ(Math.PI / 2);
  for (const mod in BOLTS) {
    const L = BOLTS[mod]; if (!L.length) continue; const im = new THREE.InstancedMesh(g, sm('bolt', 'flange'), L.length); const o = new THREE.Object3D();
    L.forEach((b, i) => { o.position.copy(polar(b.x + b.face * b.s * .35, b.r, b.psi)); o.rotation.set(b.psi, 0, 0); o.scale.set(b.s * .7, b.s, b.s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = true; MOD[mod].add(im);
  }
}
const I = (en, zh, fen, fzh, v) => ({ name: B(en, zh), fn: B(fen, fzh), v });
// ---------- part buckets (one merged mesh per part => low draw calls) ----------
const PARTS = {}; // id -> {mod, spool, mat, geos:[], caps:bool, info, mesh}
function part(id, mod, spool, mat, info) { PARTS[id] = { id, mod, spool, mat, geos: [], info, mesh: null }; return PARTS[id]; }
function P(id) { return PARTS[id]; }
function addG(id, geo) { PARTS[id].geos.push(geo); return geo; }
function addSolid(id, prof, { cap = true, seg = SEG } = {}) { const p = PARTS[id]; addG(id, latheGeo(closeP(prof), seg)); if (cap && p.mat.clippingPlanes) addCap(prof, p.mod); }
function addPlaced(id, geo, pos, rot = [0, 0, 0], scl = [1, 1, 1]) { const o = new THREE.Object3D(); o.position.copy(pos); o.rotation.set(...rot); o.scale.set(...scl); o.updateMatrix(); geo.applyMatrix4(o.matrix); return addG(id, geo); }
const SPG = {};
function spoolParent(mod, spool) { if (!spool) return MOD[mod]; const k = mod + spool; return SPG[k] || (SPG[k] = spoolGroup(spool, MOD[mod])); }
function finalizeParts() {
  for (const id in PARTS) {
    const p = PARTS[id]; if (!p.geos.length) continue;
    const geos = p.geos.map(g => { const n = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(a)) n.deleteAttribute(a); if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); if (!n.attributes.normal) n.computeVertexNormals(); return n; });
    const m = new THREE.Mesh(mergeGeometries(geos), p.mat); m.castShadow = true; m.receiveShadow = true; m.name = id;
    spoolParent(p.mod, p.spool).add(m); p.mesh = m; if (p.info) pickable(m, p.info); m.userData.part = id;
  }
}
// ---------- flow path (core annulus) ----------
function tab(T, x) { if (x <= T[0][0]) return T[0][1]; for (let i = 0; i < T.length - 1; i++) if (x <= T[i + 1][0]) { const k = (x - T[i][0]) / (T[i + 1][0] - T[i][0]); return lerp(T[i][1], T[i + 1][1], smooth(k)); } return T[T.length - 1][1]; }
const HUB = [[2.3, 2.6], [3, 2.66], [5.2, 2.78], [5.9, 2.55], [6.5, 2.12], [7.0, 1.98], [12.3, 2.08], [12.8, 2.0], [14.5, 2.3], [15.5, 2.3], [16.0, 2.36], [20.0, 2.66], [21.0, 2.62]];
const TIP = [[2.3, 3.95], [3, 3.86], [5.2, 3.56], [5.9, 3.4], [6.5, 3.08], [7.0, 2.96], [12.3, 2.36], [12.8, 2.95], [14.5, 2.88], [15.5, 2.92], [16.0, 3.22], [20.0, 4.0], [21.0, 4.02]];
const hubR = x => tab(HUB, x), tipR = x => tab(TIP, x);
const lineF = (f, x0, x1, n = 16, dr = 0) => Array.from({ length: n + 1 }, (_, i) => { const x = lerp(x0, x1, i / n); return [x, f(x) + dr]; });

const INFO = {
  spinner: I('Spinner', '整流锥', 'Smooths air into the fan hub; the painted spiral lets ground crew see rotation.', '把空气平顺地引入风扇根部；涂装的白色螺旋让地勤一眼看出是否在转。', () => `N1 ${fmt(ENG.R ? ENG.R.N1 : 0, 0)} rpm`),
  fan: I('Fan · 24 wide-chord Ti blades', '风扇 · 24 片宽弦钛合金叶片', 'Ø155 cm. Moves ~85 % of the air around the core; makes ~75 % of take-off thrust.', '直径 155 cm。把约 85% 的空气从核心机外侧推过去，起飞推力约 75% 来自它。', () => `${t('tipspeed')} ${fmt(ENG.R ? ENG.R.tip.fan : 0, 0)} m/s`),
  fancase: I('Fan case', '风扇机匣', 'Containment ring: must hold a released blade. Ribs stiffen it; inner rub strip keeps tip gap small.', '包容环：必须兜住断裂飞出的叶片。外侧加强筋提高刚度，内侧可磨涂层让叶尖间隙尽量小。', () => 'Ø ~170 cm'),
  ogv: I('Outlet guide vanes', '出口导流叶片 (OGV)', 'Remove the swirl the fan adds, turning it into straight, thrust-producing flow.', '把风扇加给气流的旋转"掰直"，变成产生推力的轴向气流。', () => `FPR ${fmt(ENG.R ? ENG.R.pif : 1, 2)}`),
  struts: I('Fan frame struts', '风扇框架支板', 'Carry the fan and front bearing loads out to the case and the forward engine mount.', '把风扇和前轴承的载荷传到机匣，再传给前安装节。', () => ''),
  booster: I('Booster (LPC) · 3 stages', '增压级 (低压压气机) · 3 级', 'On the LP shaft with the fan; pre-compresses the core air before the HPC.', '和风扇同在低压轴上，先把进入核心的空气压一道再交给高压压气机。', () => `π ${fmt(ENG.R ? ENG.R.pil : 1, 2)}`),
  hpc: I('High-pressure compressor · 9 stages', '高压压气机 · 9 级', 'Each stage adds ~25–30 % pressure; blades shrink as the air gets denser.', '每一级把压力提高约 25–30%；越往后空气越密，叶片越短小。', () => `OPR ${fmt(ENG.R ? ENG.R.opr : 1, 1)} · T3 ${fmt(ENG.R ? ENG.R.ST[4].T - 273.15 : 0, 0)} °C`),
  vsv: I('Variable stator vanes', '可调静子叶片 (VSV)', 'Front HPC vanes twist via levers and a unison ring to keep the blades from stalling at low speed.', '高压压气机前几级静子通过摇臂和联动环一起转动，低转速时防止叶片失速。', () => ''),
  comb: I('Annular combustor', '环形燃烧室', 'One ring-shaped liner; 20 swirl nozzles spray fuel. Gas reaches ~1,600 K, hotter than the metal can melt.', '单个环形火焰筒，20 个旋流喷嘴喷油。燃气约 1600 K，比金属熔点还高。', () => `T4 ${fmt(ENG.R ? ENG.R.Tt4 : 0, 0)} K · ${fmt(ENG.R ? ENG.R.mf : 0, 2)} kg/s`),
  fuel: I('Fuel manifold & nozzles', '燃油总管和喷嘴', 'Ring manifold feeds 20 nozzles through pigtail tubes.', '环形总管通过"猪尾"小管给 20 个喷嘴供油。', () => `${fmt(ENG.R ? ENG.R.mf * 3600 : 0, 0)} kg/h`),
  hpt: I('HP turbine · 1 stage', '高压涡轮 · 1 级', 'Single-crystal, air-cooled blades. One stage drives all 9 HPC stages (~25 MW).', '单晶、内部气冷叶片。仅 1 级就带动整个 9 级高压压气机 (约 25 MW)。', () => `N2 ${fmt(ENG.R ? ENG.R.N2 : 0, 0)} rpm · ${fmt(ENG.R ? ENG.R.PW.hpt : 0, 1)} MW`),
  lpt: I('LP turbine · 4 stages', '低压涡轮 · 4 级', 'Drives the fan and booster through the inner LP shaft.', '通过内侧低压轴带动风扇和增压级。', () => `EGT ${fmt(ENG.R ? ENG.R.egt : 0, 0)} °C · ${fmt(ENG.R ? ENG.R.PW.lpt : 0, 1)} MW`),
  acc: I('Active clearance control tubes', '主动间隙控制管', 'Blow fan air onto the turbine case so it shrinks and keeps blade-tip gaps tight in cruise.', '把风扇冷气吹到涡轮机匣上让它收缩，巡航时保持叶尖间隙很小。', () => ''),
  trf: I('Turbine rear frame', '涡轮后框架', 'Holds the rear bearing and the aft engine mount lugs.', '支撑后轴承，顶部是后安装节吊耳。', () => ''),
  nozzle: I('Core nozzle & plug', '核心喷管和中心锥', 'Hot jet exits here; the plug (plasma-sprayed coating) shapes the exit.', '热燃气从这里喷出；中心锥 (等离子喷涂层) 决定出口形状。', () => `V9 ${fmt(ENG.R ? ENG.R.V9 : 0, 0)} m/s`),
  shaft: I('Concentric LP / HP shafts', '同心的低压 / 高压轴', 'Inner LP shaft: fan+booster ↔ LPT. Outer HP spool: HPC ↔ HPT. They spin at different speeds.', '内轴：风扇+增压级 ↔ 低压涡轮；外层高压转子：高压压气机 ↔ 高压涡轮。两者转速不同。', () => `N1 ${fmt(ENG.R ? ENG.R.n1 * 100 : 0, 0)} % · N2 ${fmt(ENG.R ? ENG.R.n2 * 100 : 0, 0)} %`),
  agb: I('Accessory gearbox', '附件齿轮箱', 'Driven off the HP spool by a radial shaft; turns fuel & oil pumps, generator, hydraulic pump, starter.', '由高压转子经径向轴驱动；带动燃油/滑油泵、发电机、液压泵，起动机也装在这里。', () => ''),
  eec: I('FADEC / EEC', '全权限数字电子控制 (FADEC/EEC)', 'Dual-channel computer that meters fuel and schedules the variable vanes.', '双通道计算机，负责计量燃油、调度可调叶片。', () => ''),
  plumb: I('Core plumbing', '核心机外部管路', 'Bleed-air ducts, fuel and oil lines, sensor harnesses.', '引气管、燃油和滑油管、传感器线束。', () => ''),
  nacelle: I('Nacelle (737-style)', '短舱 (737 式)', 'Inlet, fan cowl and thrust-reverser sleeve; flattened bottom gives ground clearance under a 737 wing.', '进气道、风扇罩和反推套筒；底部压扁是为了在 737 机翼下留出离地间隙。', () => ''),
};
// ===================== build =====================
function buildEngine() {
  // ---- FAN MODULE ----
  part('spinner', 'fan', 'lp', sm('fan', 'spinner'), INFO.spinner);
  { const p = []; for (let i = 0; i <= 18; i++) { const s = i / 18; p.push([-2.6 + 2.9 * s, 2.18 * Math.pow(s, .82) * (1 - .06 * s * (1 - s))]); } p.push([0.3, 2.18], [0.3, 0.001]); addG('spinner', latheGeo(p, SEG)); }
  part('fanhub', 'fan', 'lp', sm('fan', 'ti'), INFO.fan);
  addSolid('fanhub', [[0.3, 2.05], [0.3, 2.26], [1.0, 2.31], [2.1, 2.42], [2.35, 2.55], [2.35, 1.2], [1.6, 1.0], [1.0, 1.0], [0.9, 2.05]]);
  part('fan', 'fan', 'lp', sm('fan', 'fanblade'), INFO.fan);
  { const g = bladeGeo({ r0: 2.28, r1: 7.72, xc0: .72, xc1: 1.05, c0: 1.55, c1: 2.25, b0: 24 * DEG, b1: 61 * DEG, th0: .1, th1: .028, cam0: .09, cam1: .03, sweep: -.15, ns: QUALITY.hi ? 12 : 7, np: QUALITY.hi ? 11 : 8, bend: .35 }); for (const r of rowGeo(g, 24)) addG('fan', r); }
  // fan case: inner flow wall + outer skin + stiffening ribs, abradable rub strip, acoustic liner
  part('fancase', 'fan', null, sm('fan', 'fancase'), INFO.fancase);
  addSolid('fancase', [[-1.4, 7.98], [-0.4, 7.86], [2.7, 7.84], [3.6, 7.8], [5.4, 7.66], [6.6, 7.6], [6.6, 7.95], [5.6, 8.05], [3.5, 8.22], [1.8, 8.3], [-0.2, 8.3], [-1.4, 8.28]]);
  part('fanliner', 'fan', null, sm('fan', 'liner2'), INFO.fancase);
  addSolid('fanliner', [[-1.38, 7.975], [-0.42, 7.855], [-0.42, 7.84], [-1.38, 7.96]], { cap: false });
  addSolid('fanliner', [[2.75, 7.835], [3.55, 7.80], [3.55, 7.79], [2.75, 7.825]], { cap: false });
  part('fanrub', 'fan', null, sm('fan', 'steel'), INFO.fancase);
  addSolid('fanrub', [[-.4, 7.852], [2.7, 7.832], [2.7, 7.82], [-.4, 7.84]], { cap: false });
  part('fanflange', 'fan', null, sm('fan', 'flange'), INFO.fancase);
  for (const [x0, x1, ro] of [[-1.45, -1.25, 8.62], [0.55, 0.72, 8.48], [1.25, 1.42, 8.5], [1.95, 2.12, 8.48], [3.3, 3.45, 8.4], [6.45, 6.65, 8.32]]) addSolid('fanflange', ringP(x0, x1, 8.2, ro));
  boltRing('fan', -1.35, 8.48, 72, -1); boltRing('fan', 6.55, 8.18, 60, 1);
  // OGVs + splitter + fan frame
  part('ogv', 'fan', null, sm('fan', 'ti'), INFO.ogv);
  { const g = bladeGeo({ r0: 4.28, r1: 7.76, xc0: 4.25, xc1: 4.45, c0: .95, c1: 1.1, b0: -28 * DEG, b1: -14 * DEG, th0: .07, th1: .05, cam0: -.08, cam1: -.05, ns: 5, np: 7 }); for (const r of rowGeo(g, QUALITY.hi ? 64 : 44)) addG('ogv', r); }
  part('splitter', 'fan', null, sm('fan', 'ti'), INFO.booster);
  addSolid('splitter', [[2.3, 4.0], [2.38, 3.94], [2.55, 3.92], [3.2, 3.86], [5.2, 3.6], [5.9, 3.45], [6.5, 3.16], [7.0, 3.04], [7.0, 4.55], [6.3, 4.62], [5.0, 4.4], [3.6, 4.26], [2.6, 4.1], [2.4, 4.06]]);
  part('struts', 'fan', null, sm('fan', 'cast'), INFO.struts);
  { const g = bladeGeo({ r0: 4.5, r1: 7.62, xc0: 5.85, xc1: 5.95, c0: 1.15, c1: 1.05, b0: 0, b1: 0, th0: .16, th1: .13, cam0: 0, cam1: 0, ns: 3, np: 8 }); for (const r of rowGeo(g, 12, TAU / 24)) addG('struts', r); }
  // booster: 3 rotor rows on LP drum + IGV + 3 stator rows
  part('boostR', 'fan', 'lp', sm('lpc', 'ti'), INFO.booster); part('boostS', 'fan', null, sm('lpc', 'steel'), INFO.booster); part('boostD', 'fan', 'lp', sm('lpc', 'ti'), INFO.booster);
  const BR = [[2.95, 46], [3.85, 50], [4.75, 54]], BS = [[2.55, 40], [3.4, 56], [4.3, 60], [5.2, 64]];
  for (const [x, n] of BR) { const g = bladeGeo({ r0: hubR(x) - .02, r1: tipR(x) - .03, xc0: x, xc1: x + .04, c0: .5, c1: .55, b0: 32 * DEG, b1: 52 * DEG, th0: .08, th1: .04, ns: 4, np: 7 }); for (const r of rowGeo(g, n)) addG('boostR', r); }
  for (const [x, n] of BS) { const g = bladeGeo({ r0: hubR(x) + .02, r1: tipR(x) + .02, xc0: x, xc1: x, c0: .42, c1: .44, b0: -22 * DEG, b1: -26 * DEG, th0: .07, th1: .05, cam0: -.06, cam1: -.05, ns: 3, np: 7 }); for (const r of rowGeo(g, n)) addG('boostS', r); }
  addSolid('boostD', wall(lineF(hubR, 2.35, 5.45, 10, -.14), .14).map(([x, r]) => [x, r]));
  for (const [x] of BR) addSolid('boostD', [[x - .12, 1.25], [x + .12, 1.25], [x + .06, hubR(x) - .14], [x - .06, hubR(x) - .14]]);
  // fan frame hub / transition cone to HPC case (static)
  part('framehub', 'fan', null, sm('fan', 'cast'), INFO.struts);
  addSolid('framehub', [[5.9, 4.55], [7.0, 4.55], [7.7, 3.7], [7.7, 3.45], [7.0, 3.3], [6.5, 3.28], [5.9, 3.55]]);
  // radial drive shaft housing (through bottom strut) to the gearbox
  const PSI_AGB = 150 * DEG, PSI_EEC = 104 * DEG;
  part('agb', 'fan', null, sm('acc', 'cast'), INFO.agb); part('acc', 'fan', null, sm('acc', 'steel'), INFO.agb);
  addG('agb', tubeGeo([polar(6.0, 4.6, PSI_AGB), polar(6.0, 6.5, PSI_AGB), polar(5.6, 8.4, PSI_AGB)], .2, 12, 10));
  { // gearbox housing: curved casting following the fan case (sector of revolution, bevelled)
    const pr = [[3.0, 8.42], [6.3, 8.42], [6.5, 8.6], [6.5, 9.05], [6.2, 9.32], [3.4, 9.32], [3.0, 9.0]];
    addG('agb', latheGeo(closeP(pr), 28, PSI_AGB - 90 * DEG - 20 * DEG, 40 * DEG));
    // accessory pads: starter, IDG, fuel pump/HMU, oil pump, hydraulic pump
    const pads = [[-1, 162, .55, 1.5, 'starter'], [1, 160, .72, 1.7, 'IDG'], [-1, 140, .38, 1.1, 'hmu'], [1, 141, .33, 1.0, 'oil'], [-1, 151, .3, .9, 'hyd'], [1, 152, .26, .8, 'pmp']];
    for (const [dir, deg, r, len] of pads) { const g = canGeo(len, r, .07, .12); if (dir < 0) g.rotateY(Math.PI); addPlaced('acc', g, polar(dir < 0 ? 3.0 : 6.5, 9.0 + r * .35, deg * DEG)); }
    // ribs on the housing
    for (let k = 0; k < 5; k++) addG('agb', latheGeo(closeP(ringP(3.4 + k * .65, 3.5 + k * .65, 9.3, 9.42)), 20, PSI_AGB - 110 * DEG, 40 * DEG));
  }
  { // EEC box on fan case with connectors + cooling fins
    part('eec', 'fan', null, sm('acc', 'eec'), INFO.eec);
    const c = polar(2.6, 8.82, PSI_EEC); const g = new RoundedBoxGeometry(2.4, .7, 1.6, 3, .1); addPlaced('eec', g, c, [PSI_EEC, 0, 0]);
    for (let k = 0; k < 7; k++) addPlaced('eec', new RoundedBoxGeometry(.06, .18, 1.4, 1, .02), polar(1.65 + k * .32, 9.22, PSI_EEC), [PSI_EEC, 0, 0]);
    for (let k = 0; k < 4; k++) { const g2 = canGeo(.35, .12, .03); addPlaced('acc', g2, polar(3.8, 8.75 + (k - 1.5) * .0, PSI_EEC + (k - 1.5) * 2.2 * DEG)); }
  }
  // fan-case harnesses (to EEC) and an oil tank lump
  part('fanpipe', 'fan', null, sm('acc', 'hose'), INFO.plumb);
  for (let k = 0; k < 4; k++) addG('fanpipe', tubeGeo([polar(3.9, 8.8, PSI_EEC + (k - 1.5) * 2.2 * DEG), polar(4.6, 8.6, PSI_EEC + 10 * DEG + k * 4 * DEG), polar(5.4, 8.45, PSI_AGB - 18 * DEG + k * 2 * DEG), polar(6.0, 8.6, PSI_AGB - 8 * DEG)], .055, 32, 6));
  addPlaced('acc', canGeo(1.6, .5, .12, .2), polar(3.6, 8.8, 128 * DEG));
  for (let k = 0; k < 7; k++) { // fan-case harness bundles and tubes running round the case (illustrative routing)
    const x = .6 + k * .62, rr = 8.62 + (k % 2) * .06, a0 = (20 + k * 9) * DEG, a1 = (150 + k * 6) * DEG, pts = [];
    for (let j = 0; j <= 10; j++) pts.push(polar(x + .15 * Math.sin(j * 1.3 + k), rr, a0 + (a1 - a0) * j / 10));
    addG('fanpipe', tubeGeo(pts, k % 3 ? .045 : .075, 80, 6));
    for (let j = 1; j < 10; j += 2) addPlaced('acc', canGeo(.1, .1, .02), pts[j], [0, 0, 0]);
  }

  // ---- CORE MODULE (HP spool + combustor) ----
  part('hpcR', 'core', 'hp', sm('hpc', 'ti'), INFO.hpc); part('hpcS', 'core', null, sm('hpc', 'steel'), INFO.hpc); part('hpcD', 'core', 'hp', sm('hpc', 'ti'), INFO.hpc);
  const NHPC = QUALITY.hi ? [38, 42, 46, 50, 54, 58, 62, 66, 70] : [26, 28, 30, 32, 34, 36, 38, 40, 42];
  const HPCX = []; for (let i = 0; i < 9; i++) HPCX.push(7.25 + i * 0.57);
  part('hpcIGV', 'core', null, sm('hpc', 'steel'), INFO.vsv);
  { const x = 6.95; const g = bladeGeo({ r0: hubR(x) + .02, r1: tipR(x) + .02, xc0: x, xc1: x, c0: .3, c1: .3, b0: -8 * DEG, b1: -10 * DEG, th0: .08, th1: .06, cam0: 0, cam1: 0, ns: 2, np: 6 }); for (const r of rowGeo(g, 56)) addG('hpcIGV', r); }
  HPCX.forEach((x, i) => {
    const c = lerp(.32, .2, i / 8);
    const g = bladeGeo({ r0: hubR(x) - .02, r1: tipR(x) - .02, xc0: x, xc1: x + .02, c0: c, c1: c * 1.05, b0: 34 * DEG, b1: 55 * DEG, th0: .08, th1: .04, ns: 3, np: 6 });
    for (const r of rowGeo(g, NHPC[i], i * .1)) addG('hpcR', r);
    const xs = x + .29; const g2 = bladeGeo({ r0: hubR(xs) + .02, r1: tipR(xs) + .02, xc0: xs, xc1: xs, c0: c * .85, c1: c * .85, b0: -24 * DEG, b1: -28 * DEG, th0: .07, th1: .05, cam0: -.06, cam1: -.05, ns: 2, np: 6 });
    for (const r of rowGeo(g2, NHPC[i] + 8)) addG('hpcS', r);
    addSolid('hpcD', [[x - .1, 1.15], [x + .1, 1.15], [x + .05, hubR(x) - .16], [x - .05, hubR(x) - .16]]);
  });
  addSolid('hpcD', wall(lineF(hubR, 6.9, 12.5, 12, -.16), .16));
  // HP spool cone to HPT disk
  addSolid('hpcD', [[12.5, 1.92], [12.5, 2.06], [14.9, 1.55], [15.0, 1.4], [14.9, 1.3], [12.6, 1.8]]);
  // HPC case with stage flanges + VSV unison rings & levers
  part('hpcCase', 'core', null, sm('hpc', 'corecase'), INFO.hpc);
  addSolid('hpcCase', wall(lineF(tipR, 6.9, 12.4, 12, .0), .32));
  part('coreFl', 'core', null, sm('hpc', 'flange'), INFO.hpc);
  for (const x of [7.7, 9.6, 12.2]) { addSolid('coreFl', ringP(x - .07, x + .07, tipR(x) + .28, tipR(x) + .55)); boltRing('core', x + .07, tipR(x) + .45, 48, 1, .05); }
  part('vsv', 'core', null, sm('hpc', 'steel'), INFO.vsv);
  for (let k = 0; k < 4; k++) {
    const x = 6.95 + k * .57 + (k ? .29 : 0), R = tipR(x) + .62; addG('vsv', (() => { const g = new THREE.TorusGeometry(R, .05, 6, SEG); g.rotateY(Math.PI / 2); g.translate(x + .12, 0, 0); return g; })());
    const n = 36; for (let i = 0; i < n; i++) { const psi = TAU * i / n; addPlaced('vsv', new RoundedBoxGeometry(.05, .32, .09, 1, .02), polar(x + .06, tipR(x) + .45, psi), [psi, 0, 0]); }
  }
  { // VSV actuator (hydraulic) + bellcrank rod
    const psi = 132 * DEG; addPlaced('vsv', canGeo(2.1, .17, .05, .1), polar(7.0, 3.95, psi)); addG('vsv', tubeGeo([polar(9.1, 3.95, psi), polar(9.0, 3.7, psi + .06), polar(7.3, 3.62, psi + .12)], .045, 16, 6));
  }
  // combustor: outer/inner liners with cooling holes, dome, 20 swirlers; outer & inner pressure cases
  part('liner', 'core', null, sm('comb', 'liner'), INFO.comb);
  addSolid('liner', wall([[12.95, 2.9], [13.6, 2.96], [14.3, 2.92], [14.6, 2.87]], .05));
  addSolid('liner', wall([[12.95, 1.98], [13.6, 2.0], [14.3, 2.18], [14.6, 2.3]], -.05).map(([x, r]) => [x, r]));
  part('dome', 'core', null, sm('comb', 'ni'), INFO.comb);
  addSolid('dome', [[12.78, 2.0], [12.95, 1.93], [12.95, 2.0], [12.86, 2.47], [12.95, 2.95], [12.95, 3.0], [12.78, 2.93], [12.7, 2.47]]);
  { const g = canGeo(.28, .17, .04, .05); g.rotateY(Math.PI); const sw = []; for (let i = 0; i < 20; i++) { const gg = g.clone(); gg.translate(12.98, 0, 0); const o = polar(0, 2.47, TAU * i / 20); gg.translate(0, o.y, o.z); sw.push(gg); } sw.forEach(gg => addG('dome', gg)); }
  part('combCase', 'core', null, sm('comb', 'hotcase'), INFO.comb);
  addSolid('combCase', [[12.2, 2.75], [12.4, 3.3], [14.9, 3.3], [15.0, 3.05], [15.0, 3.4], [14.8, 3.58], [12.5, 3.58], [12.2, 3.05]]);
  addSolid('combCase', [[12.5, 1.9], [12.7, 1.7], [14.6, 1.95], [14.6, 2.05], [12.7, 1.8]]);
  boltRing('core', 14.95, 3.48, 56, 1, .05);
  part('fuel', 'core', null, sm('comb', 'pipe'), INFO.fuel);
  addG('fuel', (() => { const g = new THREE.TorusGeometry(3.95, .07, 8, SEG); g.rotateY(Math.PI / 2); g.translate(12.75, 0, 0); return g; })());
  for (let i = 0; i < 20; i++) {
    const psi = TAU * i / 20 + .02; const n = canGeo(.32, .13, .03); n.rotateZ(-Math.PI / 2); // nozzle body radial
    addPlaced('fuel', n, polar(13.05, 3.55, psi), [psi, 0, 0]);
    addG('fuel', tubeGeo([polar(12.75, 3.95, psi - .05), polar(12.85, 3.98, psi), polar(13.05, 3.9, psi + .01)], .025, 10, 5));
  }
  // HP turbine: NGV ring + cooled blades + disk
  part('hptN', 'core', null, sm('hpt', 'ni'), INFO.hpt); part('hptR', 'core', 'hp', sm('hpt', 'hpt'), INFO.hpt); part('hptD', 'core', 'hp', sm('hpt', 'ni'), INFO.hpt);
  { const g = bladeGeo({ r0: 2.28, r1: 2.9, xc0: 14.78, xc1: 14.78, c0: .42, c1: .42, b0: -50 * DEG, b1: -52 * DEG, th0: .18, th1: .16, cam0: -.14, cam1: -.12, ns: 2, np: 8 }); for (const r of rowGeo(g, 42)) addG('hptN', r); }
  { const g = bladeGeo({ r0: 2.32, r1: 2.88, xc0: 15.22, xc1: 15.24, c0: .34, c1: .32, b0: 45 * DEG, b1: 55 * DEG, th0: .2, th1: .14, cam0: .16, cam1: .12, ns: 3, np: 8 }); for (const r of rowGeo(g, QUALITY.hi ? 80 : 56)) addG('hptR', r); }
  addSolid('hptD', [[15.0, 0.85], [15.42, 0.85], [15.38, 1.4], [15.42, 2.32], [15.0, 2.32], [15.06, 1.4]]);
  addSolid('hptN', [[14.6, 2.86], [15.5, 2.9], [15.5, 3.04], [14.6, 3.0]]); addSolid('hptN', [[14.6, 2.18], [14.98, 2.26], [14.98, 2.3], [14.6, 2.3]]);
  part('hptCase', 'core', null, sm('hpt', 'hotcase'), INFO.hpt);
  addSolid('hptCase', [[15.0, 3.05], [15.95, 3.25], [15.95, 3.48], [15.0, 3.4]]);
  // core plumbing: bleed ducts, fuel/oil lines, harness (clipped by the cutaway too)
  part('pipes', 'core', null, sm('pipe', 'pipe'), INFO.plumb); part('hose', 'core', null, sm('pipe', 'hose'), INFO.plumb);
  addG('pipes', tubeGeo([polar(9.9, 3.25, 112 * DEG), polar(10.3, 3.9, 118 * DEG), polar(11.6, 4.1, 132 * DEG), polar(13.6, 4.15, 150 * DEG), polar(15.4, 4.2, 168 * DEG), polar(16.2, 4.15, 182 * DEG)], .26, 64, 14));
  addG('pipes', tubeGeo([polar(11.0, 3.0, 250 * DEG), polar(11.4, 3.85, 245 * DEG), polar(13.0, 4.25, 230 * DEG), polar(15.5, 4.3, 214 * DEG), polar(16.4, 4.2, 200 * DEG)], .22, 64, 14));
  for (let k = 0; k < 9; k++) {
    const a = (100 + k * 23) * DEG, rr0 = 3.45 + (k % 3) * .14;
    addG(k % 2 ? 'hose' : 'pipes', tubeGeo([polar(7.6, 3.6 + (k % 2) * .1, a), polar(9.5, rr0 + .05, a + .05), polar(11.8, rr0 - .1, a + .02), polar(13.4, 3.85 + (k % 3) * .07, a - .04), polar(14.6, 3.82, a)], k % 2 ? .07 : .05, 48, 6));
  }
  for (let k = 0; k < 16; k++) { // secondary tubes: fuel, oil, sense lines and harness runs (illustrative routing)
    const a = (40 + k * 19.5) * DEG, r0 = 3.35 + (k % 4) * .1, w = k % 3 === 0 ? .09 : .045;
    addG(k % 3 === 1 ? 'hose' : 'pipes', tubeGeo([polar(6.9, 3.95, a - .06), polar(8.2, r0 + .25, a), polar(10.2, r0 + .05, a + .07 * Math.sin(k)), polar(12.2, r0 + .2, a - .05), polar(14.2, 3.72 + (k % 2) * .1, a + .03)], w, 48, 6));
    for (const x of [8.6, 11.2]) addPlaced('pipes', canGeo(.12, w + .04, .02), polar(x, r0 + .14, a), [0, 0, 0]);
  }
  for (const a of [70, 205, 290]) addG('pipes', tubeGeo([polar(8.3, 3.2, a * DEG), polar(8.4, 4.4, (a + 4) * DEG), polar(8.0, 5.6, (a + 8) * DEG), polar(7.2, 6.4, (a + 10) * DEG)], .2, 32, 12)); // bleed ducts to fan frame
  for (const x of [9.5, 11.8]) addG('pipes', (() => { const g = new THREE.TorusGeometry(tipR(x) + .7, .035, 5, SEG); g.rotateY(Math.PI / 2); g.translate(x, 0, 0); return g; })());

  // ---- LPT MODULE ----
  part('lptN', 'lpt', null, sm('lpt', 'ni'), INFO.lpt); part('lptR', 'lpt', 'lp', sm('lpt', 'lpt'), INFO.lpt); part('lptD', 'lpt', 'lp', sm('lpt', 'ni'), INFO.lpt);
  const LPTX = [16.25, 17.2, 18.15, 19.1], NLR = QUALITY.hi ? [110, 116, 122, 126] : [72, 76, 80, 84];
  LPTX.forEach((x, i) => {
    const gN = bladeGeo({ r0: hubR(x) + .02, r1: tipR(x) + .02, xc0: x, xc1: x, c0: .42, c1: .46, b0: -40 * DEG, b1: -44 * DEG, th0: .14, th1: .1, cam0: -.12, cam1: -.1, ns: 3, np: 7 });
    for (const r of rowGeo(gN, 60 + i * 6)) addG('lptN', r);
    const xr = x + .5; const gR = bladeGeo({ r0: hubR(xr) - .01, r1: tipR(xr) - .03, xc0: xr, xc1: xr + .03, c0: .4, c1: .4, b0: 40 * DEG, b1: 52 * DEG, th0: .12, th1: .07, cam0: .12, cam1: .08, ns: 4, np: 7 });
    for (const r of rowGeo(gR, NLR[i])) addG('lptR', r);
    // tip shroud band (LPT blades are tip-shrouded)
    addSolid('lptR', ringP(xr - .2, xr + .2, tipR(xr) - .05, tipR(xr) + .02, .01), { cap: true });
    addSolid('lptD', [[xr - .16, .75], [xr + .16, .75], [xr + .07, hubR(xr) - .12], [xr - .07, hubR(xr) - .12]]);
  });
  addSolid('lptD', wall(lineF(hubR, 15.9, 20.0, 10, -.14), .14));
  part('lptCase', 'lpt', null, sm('lpt', 'hotcase'), INFO.lpt);
  addSolid('lptCase', wall(lineF(tipR, 15.95, 20.2, 10, .05), .18));
  part('lptFl', 'lpt', null, sm('lpt', 'flange'), INFO.lpt);
  for (const x of [16.0, 20.15]) { addSolid('lptFl', ringP(x - .07, x + .07, tipR(x) + .18, tipR(x) + .5)); boltRing('lpt', x + (x < 17 ? -.07 : .07), tipR(x) + .38, 60, x < 17 ? -1 : 1, .05); }
  // active clearance control: rings of tubes around the LPT case + feed manifolds
  part('accT', 'lpt', null, sm('acc2', 'steel'), INFO.acc);
  for (let k = 0; k < 11; k++) { const x = 16.35 + k * .36; const R = tipR(x) + .38; addG('accT', (() => { const g = new THREE.TorusGeometry(R, .085, 8, SEG); g.rotateY(Math.PI / 2); g.translate(x, 0, 0); return g; })()); }
  for (const a of [118, 242]) addG('accT', tubeGeo([polar(16.2, tipR(16.2) + .62, a * DEG), polar(18, tipR(18) + .7, a * DEG), polar(20, tipR(20) + .66, a * DEG)], .14, 24, 10));
  for (const a of [118, 242]) addG('accT', tubeGeo([polar(16.2, tipR(16.2) + .62, a * DEG), polar(15.2, 4.3, (a + 20) * DEG), polar(12.5, 4.6, (a + 30) * DEG), polar(9.5, 4.2, (a + 32) * DEG), polar(8.2, 4.4, (a + 30) * DEG)], .16, 48, 10));
  // HPT shroud ACC ring
  for (const x of [15.25, 15.6]) addG('accT', (() => { const g = new THREE.TorusGeometry(3.55, .09, 8, SEG); g.rotateY(Math.PI / 2); g.translate(x, 0, 0); return g; })());
  // turbine rear frame: struts, hub, outer ring, aft mount lugs
  part('trf', 'lpt', null, sm('trf', 'ni'), INFO.trf);
  { const g = bladeGeo({ r0: 2.55, r1: 4.08, xc0: 20.62, xc1: 20.62, c0: .85, c1: .8, b0: -6 * DEG, b1: -6 * DEG, th0: .14, th1: .12, cam0: 0, cam1: 0, ns: 2, np: 7 }); for (const r of rowGeo(g, 16, TAU / 32)) addG('trf', r); }
  addSolid('trf', [[20.15, 4.02], [21.2, 4.06], [21.2, 4.38], [20.15, 4.36]]); addSolid('trf', [[20.1, 2.45], [21.2, 2.5], [21.2, 2.62], [20.1, 2.6]]);
  for (const dz of [-.55, .55]) addPlaced('trf', new RoundedBoxGeometry(.7, .9, .22, 2, .06), new THREE.Vector3(20.7, 4.75, dz));
  part('nozzle', 'lpt', null, sm('noz', 'plug'), INFO.nozzle); part('plug', 'lpt', null, sm('noz', 'plug'), INFO.nozzle);
  addSolid('nozzle', [[21.2, 4.02], [22.6, 3.86], [24.0, 3.5], [24.05, 3.6], [22.6, 4.0], [21.2, 4.18]]);
  { const p = [[20.1, 0.001], [20.1, 2.48]]; for (let i = 0; i <= 14; i++) { const s = i / 14; p.push([21.2 + 5.2 * s, 2.5 * (1 - Math.pow(s, 1.6)) + .18 * s]); } p.push([26.55, 0.001]); addG('plug', latheGeo(p, SEG)); }
  // LP shaft (inner) + bearing housings
  part('lpShaft', 'lpt', 'lp', sm('shaft', 'shaft'), INFO.shaft);
  addSolid('lpShaft', [[1.0, .42], [20.4, .42], [20.4, .6], [1.0, .6]]);
  addSolid('lpShaft', [[19.0, .6], [19.1, .78], [20.4, .78], [20.4, .6]]);
  // ---- NACELLE (737-style, flattened bottom) ----
  part('inlet', 'nac', null, sm('nac', 'nacelle', false), INFO.nacelle); part('lip', 'nac', null, sm('nac', 'lip', false), INFO.nacelle);
  part('cowl', 'nac', null, sm('nac', 'nacelle', false), INFO.nacelle); part('corecowl', 'nac', null, sm('nac', 'nacelle', false), INFO.nacelle);
  { const p = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; p.push([-8.6 + .55 * (1 - Math.sin(a)), 8.35 - .48 * Math.cos(a)]); } addG('lip', latheGeo(p, SEG)); }
  addG('inlet', latheGeo([[-8.6, 8.83], [-6.5, 9.35], [-3.5, 9.62], [-1.4, 9.7], [-1.4, 8.3], [-3.5, 8.05], [-6.5, 7.92], [-8.05, 7.87]], SEG));
  addG('cowl', latheGeo([[-1.4, 9.7], [3.0, 9.72], [6.6, 9.66], [9.5, 9.3], [12.5, 8.6], [14.0, 8.1], [14.0, 7.65], [12.0, 7.75], [9.0, 7.8], [6.6, 7.62]], SEG));
  addG('corecowl', latheGeo([[6.6, 4.62], [8.5, 5.25], [11.5, 5.3], [14.0, 5.12], [17.5, 4.92], [20.4, 4.72], [20.85, 4.62], [20.85, 4.56], [17.5, 4.62], [14.0, 4.62], [6.6, 4.4]], SEG)); // core cowl + primary nozzle covers the LPT/ACC
  // flatten the lower nacelle skin (737 NG "hamster pouch") — outer skin only
  for (const id of ['inlet', 'cowl', 'lip']) for (const g of P(id).geos) { const a = g.attributes.position; for (let i = 0; i < a.count; i++) { const y = a.getY(i), z = a.getZ(i), r = Math.hypot(y, z); if (r > 8.5 && y < -6.2) { const k = smooth((-y - 6.2) / 3.5) * .42 * smooth((r - 8.5) / 1.0); a.setY(i, y + k * (-y - 6.2) * .55); } } a.needsUpdate = true; g.computeVertexNormals(); }
  finalizeParts(); finalizeCaps(); finalizeBolts();
  // flame + combustor glow (additive, inside the liner)
  FLAME.mat = new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  FLAME.mesh = new THREE.Mesh(latheGeo(closeP([[13.0, 2.1], [13.5, 2.15], [14.5, 2.4], [14.5, 2.8], [13.5, 2.88], [13.0, 2.85]]), SEG), FLAME.mat); MOD.core.add(FLAME.mesh);
  FLAME.cones = new THREE.Mesh(mergeGeometries(Array.from({ length: 20 }, (_, i) => { const g = new THREE.ConeGeometry(.16, .9, 10, 1, true); g.rotateZ(Math.PI / 2); g.translate(13.5, 0, 0); const o = polar(0, 2.47, TAU * i / 20); g.translate(0, o.y, o.z); return g; })), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  MOD.core.add(FLAME.cones);
  // ground shadow catcher
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.ShadowMaterial({ opacity: .28 })); gnd.rotation.x = -Math.PI / 2; gnd.position.set(10, -10.2, 0); gnd.receiveShadow = true; scene.add(gnd); ENGINE.userData.gnd = gnd;
}
const FLAME = { mat: null, mesh: null, cones: null };
buildEngine(); setCut(0);
