import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- deterministic helpers ----------
let _seed = 1234567;
const rnd = () => { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; };
const rr = (a, b) => a + (b - a) * rnd();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const spring = t => { t = clamp(t); return 1 - Math.exp(-6 * t) * Math.cos(9 * t) * (1 - t) - (t >= 1 ? 0 : 0) ; };
const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
const fract = x => x - Math.floor(x);
const $ = id => document.getElementById(id);
const fmt = (v, d = 1) => (v >= 0 ? '' : '−') + Math.abs(v).toFixed(d);

const SIM = { t: 0, dt: 1 / 60, speed: 1, paused: false };
const QS = location.search;
const CAPTURE = /capture/.test(QS);
const INTERACTIVE_START = /interactive|[?&]step=/.test(QS);
if (CAPTURE) document.body.classList.add('capture');
const QUALITY = { hi: !/quality=low/.test(QS) };

// ---------- i18n (skill §11) ----------
let LANG = (() => { const m = QS.match(/[?&]lang=(en|zh)/); if (m) return m[1]; try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'zh') return s; } catch (e) { } return 'en'; })();
document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
const I18N = { en: {}, zh: {} };
function t(k) { const v = I18N[LANG][k]; return v == null ? (I18N.en[k] == null ? k : I18N.en[k]) : v; }
const tr = o => (o && typeof o === 'object' && ('en' in o || 'zh' in o)) ? (o[LANG] != null ? o[LANG] : o.en) : o;
const B = (en, zh) => ({ en, zh });
const LANGHOOKS = [];
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(e => { e.innerHTML = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = t(e.dataset.i18nTitle); e.setAttribute('aria-label', t(e.dataset.i18nTitle)); });
  for (const f of LANGHOOKS) f();
}
function setLang(l) {
  LANG = l; try { localStorage.setItem('lang', l); } catch (e) { }
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
  const u = new URL(location.href); u.searchParams.set('lang', l); try { history.replaceState(null, '', u); } catch (e) { }
  applyLang();
}

// ---------- renderer ----------
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(Math.min(QUALITY.hi ? 2 : 1, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();

// ---------- lights ----------
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x1a2233, .7); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.castShadow = true; key.shadow.mapSize.set(QUALITY.hi ? 2048 : 1024, QUALITY.hi ? 2048 : 1024);
Object.assign(key.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 });
key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
scene.add(key); scene.add(key.target);
const rim = new THREE.DirectionalLight(0x88ccff, .55); scene.add(rim);

// ---------- camera rig (spherical, tweened shots) ----------
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 500);
const STAGE = { x: 278, y: 66, w: 758, h: 536 };      // design px region of the 3D stage
const rig = { tx: 10, ty: 0, tz: 0, az: -0.9, el: 0.25, size: 26 };
const rigFrom = { ...rig }, rigTo = { ...rig }; let rigT0 = -1, rigDur = 1;
const user = { daz: 0, del: 0, zoom: 1 };
function shot(s, dur = 1.6) {
  Object.assign(rigFrom, rig); Object.assign(rigTo, rig, s);
  // shortest azimuth
  rigT0 = SIM.t; rigDur = dur;
  if (dur <= 0) { Object.assign(rig, rigTo); rigT0 = -1; }
}
function updateRig() {
  if (rigT0 >= 0) {
    const k = ease((SIM.t - rigT0) / rigDur);
    for (const p in rigTo) rig[p] = lerp(rigFrom[p], rigTo[p], k);
    if (k >= 1) rigT0 = -1;
  }
}
let stageScale = 1, stageOX = 0, stageOY = 0, VW = 1, VH = 1;
function placeCamera() {
  const t = SIM.t;
  const az = rig.az + user.daz + 0.012 * Math.sin(t * .31) , el = clamp(rig.el + user.del + 0.008 * Math.sin(t * .23 + 1), -0.2, 1.45);
  const sh = STAGE.h * stageScale; // stage px height on window
  const d = rig.size * user.zoom * VH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * sh);
  const tgt = new THREE.Vector3(rig.tx, rig.ty, rig.tz);
  camera.position.set(tgt.x + d * Math.cos(el) * Math.sin(az), tgt.y + d * Math.sin(el), tgt.z + d * Math.cos(el) * Math.cos(az));
  camera.up.set(0, 1, 0); camera.lookAt(tgt);
  camera.near = Math.max(0.1, d * 0.05); camera.far = d * 6;
  const px = stageOX + (STAGE.x + STAGE.w / 2) * stageScale, py = stageOY + (STAGE.y + STAGE.h / 2) * stageScale;
  camera.aspect = VW / VH;
  camera.setViewOffset(VW, VH, VW / 2 - px, VH / 2 - py, VW, VH);
  camera.updateProjectionMatrix();
  // light follows the view
  const kd = new THREE.Vector3(-0.45, 1, 0.55).normalize();
  key.position.copy(tgt).addScaledVector(kd, 40); key.target.position.copy(tgt);
  const sc = rig.size * 0.9; Object.assign(key.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc }); key.shadow.camera.updateProjectionMatrix();
  rim.position.copy(tgt).add(new THREE.Vector3(10, 4, -12));
}
function layout() {
  VW = window.innerWidth; VH = window.innerHeight;
  stageScale = Math.min(VW / 1440, VH / 810);
  stageOX = (VW - 1440 * stageScale) / 2; stageOY = Math.max(0, (VH - 810 * stageScale) / 2);
  $('stage').style.transform = `translate(${stageOX}px,${stageOY}px) scale(${stageScale})`;
  renderer.setSize(VW, VH, false);
  let h = document.getElementById('rothint'); if (!h) { h = document.createElement('div'); h.id = 'rothint'; document.body.appendChild(h); }
  h.innerHTML = t('rothint');
  h.style.display = (VH > VW && VH - 810 * stageScale > 120) ? 'block' : 'none'; h.style.top = (stageOY + 810 * stageScale + 18) + 'px';
}

// ---------- palette (data-terminal UI; physical PBR colours for hardware) ----------
const COL = { cold: '#8fc4ff', bypass: '#a9d8ff', warm: '#ffd37a', hot: '#ff8a3d', flame: '#ff5a1f', fuel: '#ffe9a8', ac: '#4a8ad6', ok: '#44a282', bad: '#e5566f', warn: '#d9a441', cut: '#c8372d' };
// ---------- material helpers ----------
function M(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .55, metalness: 0.05, envMapIntensity: .7 }, o)); }
const EDGE = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .28 });
function mesh(geo, mat, { x = 0, y = 0, z = 0, parent, shadow = true, edge = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), EDGE); e.raycast = () => { }; m.add(e); }
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const rbox = (w, h, d, r = .04) => new RoundedBoxGeometry(w, h, d, 2, r);
// box defined by ranges
function boxR(x0, x1, y0, y1, z0, z1, mat, parent, o = {}) {
  return mesh(box(x1 - x0, y1 - y0, z1 - z0), mat, Object.assign({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, parent }, o));
}
function tube(points, r, mat, parent, seg = 24) {
  const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.0001);
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, seg, r, 6, false), mat); m.castShadow = true;
  if (parent) parent.add(m); return m;
}
// polyline tube with sharp corners (manhattan routing)
function wire(points, r, mat, parent) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) {
    const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]);
    const L = a.distanceTo(b); if (L < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L + r * 1.6, 6), mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true; g.add(m);
  }
  if (parent) parent.add(g); return g;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// text plate lying on a top face
function topText(text, w, d, { color = '#e6edf7', bg = null, size = 64, sub = '' } = {}) {
  const tex = canvasTex(512, Math.round(512 * d / w), (g, W, H) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, W, H); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${size}px Inter, "Noto Sans SC", sans-serif`; g.fillText(text, W / 2, H / 2 - (sub ? size * .35 : 0));
    if (sub) { g.globalAlpha = .75; g.font = `500 ${size * .55}px "JetBrains Mono", monospace`; g.fillText(sub, W / 2, H / 2 + size * .55); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.raycast = () => { }; return m;
}

// ---------- pick registry & labels ----------
const PICK = []; // {obj, info:{name, fn, v: () => string}}
function pickable(obj, info) { obj.userData.info = info; PICK.push(obj); return obj; }
const LABELS = [];
const labelsEl = $('labels');
function label(html0, pos, { cls = '', group = null, side = '', pri = 0 } = {}) {
  const src0 = html0; const html = typeof html0 === 'function' ? html0() : tr(html0);
  const el = document.createElement('div'); el.className = 'lb ' + cls + ' ' + side; el.innerHTML = html; labelsEl.appendChild(el);
  const L = { el, pos: typeof pos === 'function' ? pos : () => pos, show: 0, op: 0, group, pri, html, set(h) { if (h !== this.html) { this.html = h; el.innerHTML = h; this.w = 0; this.h = 0; } }, w: 0, h: 0, side };
  L.src = src0; LABELS.push(L); return L;
}
function relabel() { for (const L of LABELS) if (L.src != null) L.set(typeof L.src === 'function' ? L.src() : tr(L.src)); }
LANGHOOKS.push(relabel);
const _lv = new THREE.Vector3();
// stage zones where 3D labels may never appear (design px, relative to STAGE): title band, bottom band, toast slot
const NOLAB = { top: 104, bottom: 64 };
let TOASTRECT = null; // set by toast(): {x0,y0,x1,y1} in design px
function updateLabels() {
  const placed = [];
  const cand = [];
  for (const L of LABELS) {
    const vis = L.show && (!L.group || visibleUp(L.group));
    if (!vis) { if (L.op) { L.el.style.opacity = 0; L.op = 0; } L.el.style.visibility = 'hidden'; continue; }
    cand.push(L);
  }
  cand.sort((a, b) => (b.pri || 0) - (a.pri || 0));
  for (const L of cand) {
    _lv.copy(L.pos()); _lv.project(camera);
    const wx = (_lv.x * .5 + .5) * VW, wy = (-_lv.y * .5 + .5) * VH;
    const x = (wx - stageOX) / stageScale, y = (wy - stageOY) / stageScale;
    const w = L.w || (L.w = L.el.offsetWidth || 80), h = L.h || (L.h = L.el.offsetHeight || 20);
    const xl = L.side === 'l' ? x - w : L.side === 'r' ? x : x - w / 2, xr = xl + w, yt = y - h / 2, yb = y + h / 2;
    let inside = _lv.z < 1 && xl > STAGE.x + 4 && xr < STAGE.x + STAGE.w - 4 && yt > STAGE.y + NOLAB.top && yb < STAGE.y + STAGE.h - NOLAB.bottom;
    const R = { x0: xl - 3, y0: yt - 2, x1: xr + 3, y1: yb + 2 };
    if (inside && TOASTRECT && !(R.x1 < TOASTRECT.x0 || R.x0 > TOASTRECT.x1 || R.y1 < TOASTRECT.y0 || R.y0 > TOASTRECT.y1)) inside = false;
    if (inside) for (const P of placed) if (!(R.x1 < P.x0 || R.x0 > P.x1 || R.y1 < P.y0 || R.y0 > P.y1)) { inside = false; break; }
    if (inside) placed.push(R);
    const o = inside ? (typeof L.show === 'number' ? L.show : 1) : 0;
    L.el.style.left = x.toFixed(1) + 'px'; L.el.style.top = y.toFixed(1) + 'px';
    L.el.style.visibility = o > 0 ? 'visible' : 'hidden';
    if (o !== L.op) { L.el.style.opacity = o; L.op = o; }
  }
}
function visibleUp(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

// ---------- generic particle stream (instanced) ----------
const PART = { N: QUALITY.hi ? 1400 : 700 };
PART.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), PART.N);
PART.mesh.frustumCulled = false; PART.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(PART.mesh);
const _pm = new THREE.Object3D(), _pc = new THREE.Color(), _pv = new THREE.Vector3();
for (let i = 0; i < PART.N; i++) PART.mesh.setColorAt(i, _pc.set('#fff'));
// streams: [{curve: THREE.Curve (world), n, period, col, size, rate(0..1)}]
function updateParticles(streams, t) {
  let i = 0;
  for (const s of streams) {
    if (!s || !s.curve) continue; if (!s.colf) _pc.set(s.col); const n = Math.round(s.n * clamp(s.rate == null ? 1 : s.rate));
    for (let j = 0; j < n && i < PART.N; j++, i++) {
      const h = fract(Math.sin((j + 1) * 12.9898 + (s.seed || 0) * 78.233) * 43758.5453);
      const u = fract(t / s.period + j / Math.max(1, s.n) + h * .21);
      s.curve.getPointAt(u, _pv); if (s.jit) { _pv.x += (fract(h * 91.7) - .5) * s.jit; _pv.z += (fract(h * 53.3) - .5) * s.jit; }
      if (s.colf) s.colf(u, _pc); if (s.rev) { }
      _pm.position.copy(_pv); const fade = Math.min(1, u * 8, (1 - u) * 8); _pm.scale.setScalar((s.size || .05) * fade); _pm.updateMatrix();
      PART.mesh.setMatrixAt(i, _pm.matrix); PART.mesh.setColorAt(i, _pc);
    }
  }
  for (; i < PART.N; i++) { _pm.position.set(0, -99, 0); _pm.scale.setScalar(0); _pm.updateMatrix(); PART.mesh.setMatrixAt(i, _pm.matrix); }
  PART.mesh.instanceMatrix.needsUpdate = true; PART.mesh.instanceColor.needsUpdate = true;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function path(pts) { const c = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) c.add(new THREE.LineCurve3(V3(...pts[i]), V3(...pts[i + 1]))); return c; }

// ---------- explode registry ----------
const EXP = []; // {obj, p0, r0, dir, tilt, delay, ch}
const EXV = { eng: 0 }; const EXT = { eng: 0 };
function explodable(obj, ch, dir, tilt = [0, 0, 0], delay = rnd()) {
  EXP.push({ obj, ch, p0: obj.position.clone(), r0: obj.rotation.clone(), dir: new THREE.Vector3(...dir), tilt: new THREE.Vector3(...tilt), delay }); return obj;
}
const springBack = t => { t = clamp(t); return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); };
function updateExplode(dt) {
  for (const e of EXP) { e.obj.position.copy(e.p0); e.obj.rotation.copy(e.r0); }
  for (const e of EXP) {
    const ex = EXV[e.ch]; if (!ex) continue; const k = clamp(ex * 1.45 - e.delay * .45);
    const s = springBack(k);
    e.obj.position.addScaledVector(e.dir, s);
    e.obj.rotation.x += e.tilt.x * s; e.obj.rotation.y += e.tilt.y * s; e.obj.rotation.z += e.tilt.z * s;
  }
}
// explode channel tweens driven by lesson time
const EXA = {}; // ch -> {from,to,t0,dur}
function setExplode(ch, to, dur = 1.8) { EXA[ch] = { from: EXV[ch], to, t0: SIM.t, dur }; EXT[ch] = to; }
function tickExplode() { for (const ch in EXA) { const a = EXA[ch]; const k = clamp((SIM.t - a.t0) / a.dur); EXV[ch] = lerp(a.from, a.to, k); if (k >= 1) delete EXA[ch]; } }

// opacity tween for material sets
const FADES = [];
function fadeable(mat) { mat.transparent = true; mat.userData.base = mat.opacity; return mat; }
