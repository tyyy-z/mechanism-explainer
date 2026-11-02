import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let LANG = (() => { const m = location.search.match(/[?&]lang=(en|zh)/); if (m) return m[1]; try { const s = localStorage.getItem('lang'); if (s === 'en' || s === 'zh') return s; } catch (e) { } return 'en'; })();
document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
const I18N = { en: {}, zh: {} }; window.I18N = I18N;
function t(k) { const v = I18N[LANG][k]; return v == null ? (I18N.en[k] == null ? k : I18N.en[k]) : v; }
const tr = o => (o && typeof o === 'object' && ('en' in o || 'zh' in o)) ? (o[LANG] != null ? o[LANG] : o.en) : o;
const B = (en, zh) => ({ en, zh });
const trFor = (o, l) => o && typeof o === 'object' ? (o[l] != null ? o[l] : o.en) : o;
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
window.__setLang = l => setLang(l);

Object.assign(I18N.en, {"brand": "Inside 3D NAND <span class=\"op\">READ · PROGRAM · ERASE</span>", "intro": "Controller command → CMOS periphery → word / bit lines → charge-trap layer", "level": "Advanced · semiconductors", "duration": "15–20 min", "autoplay": "Autoplay", "scene": "3D NAND structural view", "theme": "Toggle light / dark", "trailLabel": "Lesson steps", "trail": "Lesson <span>8 steps</span>", "keyboard": "Use <kbd>←</kbd><kbd>→</kbd> for steps · drag to rotate · scroll to zoom · click parts for details.<br>Public sources: textbooks / IEEE / ONFI. Values are <b>typical ranges</b>, independent of vendor designs.", "electrons": "<i style=\"background:#60a5fa\"></i>e⁻ electrons", "holes": "<i style=\"background:#fb7185\"></i>h⁺ holes", "explode": "<svg class=\"i\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" viewBox=\"0 0 16 16\"><path d=\"M3 4.5h10M3 8h10M3 11.5h10\" stroke-dasharray=\"0\"></path><path d=\"M8 1v2M8 13v2\"></path></svg>Explode", "explodeTitle": "Explode", "resetView": "<svg class=\"i\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" viewBox=\"0 0 16 16\"><path d=\"M3 8a5 5 0 1 0 1.5-3.6\"></path><path d=\"M3 2.5V5h2.5\"></path></svg>Reset view", "resetViewTitle": "Reset view", "tabwhy": "Why", "tabmath": "Math", "tabex": "Try", "tabquiz": "Quiz", "tabsrc": "Sources", "controls": "Controls", "scope": "Scope", "pause": "Pause / resume", "speed": "Playback speed", "controlop": "Operation", "controlmode": "Bits / cell", "controlpage": "Logical page", "controlwl": "Selected WL", "controlbl": "BL targets", "controlstep": "ISPP step ΔV", "controlvpass": "V<sub>pass</sub> (prog)", "controlvread": "V<sub>pass</sub> (read)", "controlshift": "Read offset", "controlvers": "Start V<sub>erase</sub>", "controlvg": "Gate V<sub>g</sub>", "controlret": "Retention", "controlpe": "P/E cycles", "selectedWL": "Selected word line", "isppStep": "ISPP step", "yearsZero": "0 yr", "runRead": "Run READ", "nextPhase": "Next phase", "scopebus": "Bus", "scopebias": "Bias", "scopefield": "Field", "scopevt": "Vt dist.", "scopebl": "BL sense", "scopeispp": "ISPP", "scopeerase": "Erase", "documentTitle": "3D NAND · READ / PROGRAM / ERASE — Inside the device", "portrait": "In portrait, the lesson scales to fit. Use <b>landscape</b> or a desktop for the full experience. Pinch to zoom.<br><span>Rotate to landscape for the full lesson.</span>", "currentValue": "Current value", "step": "Step", "correct": "Correct", "incorrect": "Incorrect"});
Object.assign(I18N.zh, {"brand": "3D NAND 内部机制 <span class=\"op\">READ · PROGRAM · ERASE</span>", "intro": "从控制器的一条命令出发 → CMOS 外围 → word line / bit line → 电荷陷阱层，一个结构一个结构地走完整条信号链", "level": "中高级 · 半导体背景", "duration": "约 15–20 分钟", "autoplay": "自动演示", "scene": "3D NAND 结构三维视图", "theme": "切换明暗", "trailLabel": "课程步骤", "trail": "课程 <span>8 步</span>", "keyboard": "键盘 <kbd>←</kbd><kbd>→</kbd> 切换步骤 · 拖动 3D 旋转 · 滚轮缩放 · 点击任意结构看名称、功能和典型电压。<br/>只用公开资料（教科书 / IEEE 论文 / ONFI），数值均为<b>典型范围</b>，非任何厂商的具体设计。", "electrons": "<i style=\"background:#60a5fa\"></i>e⁻ 电子", "holes": "<i style=\"background:#fb7185\"></i>h⁺ 空穴", "explode": "<svg class=\"i\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" viewBox=\"0 0 16 16\"><path d=\"M3 4.5h10M3 8h10M3 11.5h10\" stroke-dasharray=\"0\"></path><path d=\"M8 1v2M8 13v2\"></path></svg>爆炸视图", "explodeTitle": "爆炸视图", "resetView": "<svg class=\"i\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" viewBox=\"0 0 16 16\"><path d=\"M3 8a5 5 0 1 0 1.5-3.6\"></path><path d=\"M3 2.5V5h2.5\"></path></svg>重置视角", "resetViewTitle": "重置视角", "tabwhy": "原理", "tabmath": "数学", "tabex": "试试看", "tabquiz": "小测", "tabsrc": "来源", "controls": "控制", "scope": "示波器", "pause": "暂停/继续", "speed": "播放速度", "controlop": "操作", "controlmode": "每单元位数", "controlpage": "读哪一页", "controlwl": "选中 WL", "controlbl": "每条 BL 数据", "controlstep": "ISPP 步长 ΔV", "controlvpass": "V<sub>pass</sub> (编程)", "controlvread": "V<sub>pass</sub> (读)", "controlshift": "读参考偏移", "controlvers": "V<sub>erase</sub> 起始", "controlvg": "栅压 V<sub>g</sub>", "controlret": "保持时间", "controlpe": "P/E 次数", "selectedWL": "选中 word line", "isppStep": "ISPP 步长", "yearsZero": "0 年", "runRead": "运行 READ", "nextPhase": "单步", "scopebus": "接口", "scopebias": "偏压", "scopefield": "电场", "scopevt": "Vt 分布", "scopebl": "BL 感测", "scopeispp": "ISPP", "scopeerase": "擦除", "documentTitle": "3D NAND · READ / PROGRAM / ERASE 结构级讲解", "portrait": "竖屏时整页按比例缩小；<b>横屏</b>或用电脑打开可获得完整体验。双指可放大。<br><span>Rotate to landscape for the full lesson.</span>", "currentValue": "当前值", "step": "步骤", "correct": "正确", "incorrect": "不对"});
LANGHOOKS.push(() => { document.title = t('documentTitle'); document.querySelectorAll('#lang button').forEach(b => b.classList.toggle('on', b.dataset.v === LANG)); });
document.getElementById('lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.v); });

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

// ---------- renderer ----------
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
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
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 });
key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
scene.add(key); scene.add(key.target);
const rim = new THREE.DirectionalLight(0x88ccff, .55); scene.add(rim);

// ---------- camera rig (spherical, tweened shots) ----------
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 500);
const STAGE = { x: 278, y: 66, w: 758, h: 536 };      // design px region of the 3D stage
const rig = { tx: 0, ty: 1.5, tz: 0, az: 0.6, el: 0.5, size: 15 };
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
  let h = document.getElementById('rothint'); if (!h) { h = document.createElement('div'); h.id = 'rothint'; h.dataset.i18n = 'portrait'; h.innerHTML = t('portrait'); document.body.appendChild(h); }
  h.style.display = VH - 810 * stageScale > 120 ? 'block' : 'none'; h.style.top = (stageOY + 810 * stageScale + 18) + 'px';
}

// ---------- voltage colormap ----------
const VSTOPS = [[0, '#3b4a63'], [2.5, '#2dd4bf'], [6, '#facc15'], [10, '#fb923c'], [15, '#f43f5e'], [22, '#d946ef']].map(([v, c]) => [v, new THREE.Color(c)]);
const NEG = new THREE.Color('#1e3a8a');
function vColor(v, out = new THREE.Color()) {
  if (v < 0) return out.copy(VSTOPS[0][1]).lerp(NEG, clamp(-v / 3));
  for (let i = 1; i < VSTOPS.length; i++) if (v <= VSTOPS[i][0]) { const [a, ca] = VSTOPS[i - 1], [b, cb] = VSTOPS[i]; return out.copy(ca).lerp(cb, (v - a) / (b - a)); }
  return out.copy(VSTOPS[VSTOPS.length - 1][1]);
}
const vCss = v => '#' + vColor(v).getHexString();
$('legbar').style.background = `linear-gradient(90deg,${VSTOPS.map(([v, c]) => '#' + c.getHexString() + ' ' + (v / 22 * 100).toFixed(0) + '%').join(',')})`;

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
function pickable(obj, info) { for (const k of ['name', 'fn']) if (typeof info[k] === 'string') info[k] = B(info[k], info[k]); obj.userData.info = info; PICK.push(obj); return obj; }
const LABELS = [];
const labelsEl = $('labels');
function label(html, pos, { cls = '', group = null, side = '' } = {}) {
  if (typeof html === 'string') html = B(html, html);
  const el = document.createElement('div'); el.className = 'lb ' + cls + ' ' + side; el.innerHTML = tr(html); labelsEl.appendChild(el);
  const L = { el, pos: typeof pos === 'function' ? pos : () => pos, show: 0, op: 0, group, html, rendered: tr(html), set(h) { this.html = typeof h === 'string' ? B(h, h) : h; const text = tr(this.html); if (text !== this.rendered) { this.rendered = text; el.innerHTML = text; this.w = 0; } }, w: 0, side };
  LABELS.push(L); return L;
}
LANGHOOKS.push(() => { for (const L of LABELS) { L.rendered = tr(L.html); L.el.innerHTML = L.rendered; L.w = 0; } });
const _lv = new THREE.Vector3();
function updateLabels() {
  for (const L of LABELS) {
    const vis = L.show && (!L.group || L.group.visible);
    if (!vis) { if (L.op) { L.el.style.opacity = 0; L.op = 0; } continue; }
    _lv.copy(L.pos()); _lv.project(camera);
    // window px -> design px
    const wx = (_lv.x * .5 + .5) * VW, wy = (-_lv.y * .5 + .5) * VH;
    const x = (wx - stageOX) / stageScale, y = (wy - stageOY) / stageScale;
    const w = L.w || (L.w = L.el.offsetWidth || 80), xl = L.side === 'l' ? x - w : L.side === 'r' ? x : x - w / 2, xr = xl + w;
    const inside = _lv.z < 1 && xl > STAGE.x + 2 && xr < STAGE.x + STAGE.w - 2 && y > STAGE.y + 34 && y < STAGE.y + STAGE.h - 6 && !(y > STAGE.y + STAGE.h - 48 && xl < STAGE.x + 360);
    const o = inside ? (typeof L.show === 'number' ? L.show : 1) : 0;
    L.el.style.left = x.toFixed(1) + 'px'; L.el.style.top = y.toFixed(1) + 'px';
    if (o !== L.op) { L.el.style.opacity = o; L.op = o; }
  }
}

// ---------- explode registry ----------
const EXP = []; // {obj, p0, r0, dir, tilt, delay, ch}
const EXV = { die: 0, tier: 0, cell: 0 }; const EXT = { die: 0, tier: 0, cell: 0 };
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
