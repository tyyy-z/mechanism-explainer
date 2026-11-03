// ===================== b_watch: ETA 2824-2 / NH35-class automatic movement, real sub-parts =====================
// 1 unit = 1 mm. Movement plane = XZ, +Y = caseback side (what you see through a display back). Crown at −X.
// Ø 25.6 mm (11½'''), see refs/REFS.md. Gear teeth: barrel 84 → centre pinion 12, centre 80 → 3rd pinion 10,
// 3rd 75 → 4th pinion 10, 4th 84 → escape pinion 7, escape wheel 20 club teeth (barrel→escape 5040:1).
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const SEG = QUALITY.hi ? 1 : .6;
const MV = new THREE.Group(); scene.add(MV);
const GRP = {}; for (const k of ['plate', 'barrel', 'train', 'esc', 'balance', 'bridges', 'auto', 'rotor', 'dial', 'keyless']) { GRP[k] = new THREE.Group(); GRP[k].name = k; MV.add(GRP[k]); }
const ROT = {}; // rotating sub-groups
// ---------- layout (mm) ----------
const RPL = 12.8;
const POS = { C: [0, 0], B: [-5.9, 0], T: [3.55, 4.33], Bl: [2.4, -6.6], crw: [-10.2, 0] };
{ // escape wheel: |E| = 4th wheel + escape pinion pitch radii, |E−Bl| = lever 3.2 + pallet 2.8
  const d1 = 4.095, d2 = 6.0, [bx, bz] = POS.Bl; let best = null;
  for (let i = 0; i < 3600; i++) { const a = i / 3600 * TAU, x = d1 * Math.cos(a), z = d1 * Math.sin(a), e = Math.abs(Math.hypot(x - bx, z - bz) - d2); if (x > 0 && (!best || e < best.e)) best = { e, x, z }; }
  POS.E = [best.x, best.z];
  const u = [(POS.E[0] - bx) / d2, (POS.E[1] - bz) / d2]; POS.u = u;
  POS.P = [bx + u[0] * 3.2, bz + u[1] * 3.2];
}
const RV = { r1: [1.45, -1.52], r2: [-1.62, -1.32], rd: [-3.9, -3.2] };
// ---------- procedural finishes (tiny canvases) ----------
const TX = {};
TX.perlage = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, W, H); const s = 32; for (let y = -1; y < 9; y++) for (let x = -1; x < 9; x++) { const cx = x * s + (y % 2) * s / 2, cy = y * s * .87; const gr = g.createRadialGradient(cx, cy, 2, cx, cy, s * .62); gr.addColorStop(0, '#d6d6d6'); gr.addColorStop(.55, '#8a8a8a'); gr.addColorStop(.85, '#b8b8b8'); gr.addColorStop(1, '#7a7a7a'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, s * .62, 0, TAU); g.fill(); for (let k = 0; k < 18; k++) { g.strokeStyle = `rgba(255,255,255,${.05 + .05 * (k % 2)})`; g.beginPath(); g.arc(cx, cy, k * s * .034, 0, TAU); g.stroke(); } } });
TX.perlage.wrapS = TX.perlage.wrapT = THREE.RepeatWrapping; TX.perlage.repeat.set(1 / 2.2, 1 / 2.2);
TX.cotes = canvasTex(64, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#8c8c8c'); gr.addColorStop(.35, '#e8e8e8'); gr.addColorStop(.6, '#c4c4c4'); gr.addColorStop(1, '#8c8c8c'); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(0,0,0,${rr(.01, .035)})`; const x = rr(0, W); g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + rr(-6, 6), H / 2, x, H); g.stroke(); } });
TX.cotes.wrapS = TX.cotes.wrapT = THREE.RepeatWrapping; TX.cotes.repeat.set(1 / 2.4, 1 / 9); TX.cotes.rotation = .5;
TX.sun = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#a0a0a0'; g.fillRect(0, 0, W, H); g.translate(W / 2, H / 2); for (let i = 0; i < 900; i++) { const a = rr(0, TAU), v = 120 + rr(0, 110) | 0; g.strokeStyle = `rgba(${v},${v},${v},.35)`; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * W, Math.sin(a) * W); g.stroke(); } });
TX.rotor = canvasTex(1024, 1024, (g, W, H) => {
  g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { const v = 150 + rr(0, 90) | 0; g.strokeStyle = `rgba(${v},${v},${v},.3)`; const y = rr(0, H); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + rr(-1, 1)); g.stroke(); }
  g.save(); g.translate(W / 2, H / 2); g.fillStyle = '#4a4d52'; g.font = '600 34px Inter, sans-serif'; g.textAlign = 'center';
  const arcT = (s, r, a0) => { let a = a0; for (const ch of s) { g.save(); g.rotate(a); g.fillText(ch, 0, -r); g.restore(); a += .075; } };
  arcT('AUTOMATIC · TWENTY-FIVE 25 JEWELS', 300, -1.05 - Math.PI / 2 + Math.PI);
  g.font = '500 26px "JetBrains Mono", monospace'; arcT('28 800 A/h · 2824-CLASS', 250, -.75 - Math.PI / 2 + Math.PI);
  g.restore();
});
TX.date = canvasTex(1024, 1024, (g, W, H) => { g.fillStyle = '#f1efe9'; g.fillRect(0, 0, W, H); g.translate(W / 2, H / 2); g.fillStyle = '#16181c'; g.font = '700 30px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < 31; i++) { g.save(); g.rotate(i / 31 * TAU); g.fillText(String(i + 1), 0, -470); g.restore(); } });
for (const k of ['sun', 'rotor', 'date']) { TX[k].repeat.set(1 / 25.6, 1 / 25.6); TX[k].offset.set(.5, .5); }
TX.rotor.repeat.x = -1 / 25.6;
TX.sun.repeat.set(1 / 8, 1 / 8);
for (const k of ['perlage', 'cotes', 'sun']) TX[k].colorSpace = THREE.NoColorSpace;
// ---------- materials (PBR + RoomEnvironment; per-part clones so a part can be highlighted) ----------
function PM(color, o = {}) { return new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: .32, metalness: .95, envMapIntensity: 1.15 }, o)); }
const BASE = {
  plate: () => PM('#8a8f96', { roughness: .42, metalness: 1, envMapIntensity: .82, roughnessMap: TX.perlage, bumpMap: TX.perlage, bumpScale: .2 }),
  bridge: () => PM('#9da2a9', { roughness: .27, metalness: 1, envMapIntensity: .9, roughnessMap: TX.cotes, bumpMap: TX.cotes, bumpScale: .12 }),
  gold: () => PM('#d8b25e', { roughness: .3, roughnessMap: TX.sun, metalness: 1 }),
  steel: () => PM('#cfd3d8', { roughness: .14, metalness: 1 }),
  steelS: () => PM('#a7abb1', { roughness: .26, roughnessMap: TX.sun, metalness: 1 }),
  blue: () => PM('#33417e', { roughness: .22, metalness: .85, clearcoat: .6 }),
  glucy: () => PM('#c99a5f', { roughness: .24, metalness: 1 }),
  spring: () => PM('#d9dde3', { roughness: .18, metalness: 1 }),
  mains: () => PM('#7d8794', { roughness: .3, metalness: .95 }),
  ruby: () => new THREE.MeshPhysicalMaterial({ color: '#c2124a', roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, sheen: .4, sheenColor: new THREE.Color('#ff6a9a'), emissive: '#3a0010', envMapIntensity: 1.6 }),
  rotor: () => PM('#a9adb4', { roughness: .3, envMapIntensity: 1.0, map: TX.rotor, roughnessMap: TX.sun, metalness: .95 }),
  heavy: () => PM('#b6b0a4', { roughness: .36, metalness: 1 }),
  date: () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .6, metalness: 0, map: TX.date }),
  dark: () => new THREE.MeshStandardMaterial({ color: '#101114', roughness: .7, metalness: .2 }),
  crown: () => PM('#d6d9de', { roughness: .18, metalness: 1 }),
};
const SECM = {}; const MATC = {};
function MA(base, part) { const k = base + '|' + part; if (!MATC[k]) { const m = BASE[base](); m.userData.e0 = m.emissive.clone(); m.side = THREE.FrontSide; MATC[k] = m; (SECM[part] = SECM[part] || []).push(m); } return MATC[k]; }
// ---------- geometry helpers ----------
const V2 = (x, y) => new THREE.Vector2(x, y);
function lathe(prof, seg = 64) { return new THREE.LatheGeometry(prof.map(([r, y]) => V2(r, y)), Math.max(12, Math.round(seg * SEG))); }
function ringProf(r0, r1, y0, y1, ch = .04) { return [[r0, y0 + ch], [r0 + ch, y0], [r1 - ch, y0], [r1, y0 + ch], [r1, y1 - ch], [r1 - ch, y1], [r0 + ch, y1], [r0, y1 - ch], [r0, y0 + ch]]; }
function extrY(shape, y0, y1, bev = .03, cs = 12) {
  const b = Math.min(bev, (y1 - y0) * .3);
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.001, y1 - y0 - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: cs });
  g.rotateX(Math.PI / 2); g.computeBoundingBox(); g.translate(0, y1 - g.boundingBox.max.y, 0); return g;
}
function circPath(cx, cz, r, n = 40, P = new THREE.Path(), cw = false) { for (let i = 0; i <= n; i++) { const a = (cw ? -1 : 1) * i / n * TAU; i ? P.lineTo(cx + r * Math.cos(a), cz + r * Math.sin(a)) : P.moveTo(cx + r, cz); } return P; }
function hull(circles, n = 28, clipR = 12.45) {
  const pts = []; for (const [x, z, r] of circles) for (let i = 0; i < n; i++) { const a = i / n * TAU; let px = x + r * Math.cos(a), pz = z + r * Math.sin(a); const d = Math.hypot(px, pz); if (d > clipR) { px *= clipR / d; pz *= clipR / d; } pts.push([px, pz]); }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1)); const s = new THREE.Shape(); h.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath(); return s;
}
function withHoles(s, holes) { for (const [x, z, r] of holes) s.holes.push(circPath(x, z, r, 24, new THREE.Path(), true)); return s; }
// spur gear / pinion outline; optional spoke windows
function gearShape(N, rp, m, o = {}) {
  const ra = rp + m * (o.add || .95), rf = rp - m * 1.25, s = new THREE.Shape(), p = TAU / N;
  for (let i = 0; i < N; i++) {
    const a = i * p; const pts = [[rf, a], [rf, a + p * .12], [rp, a + p * .2], [ra, a + p * .27], [ra, a + p * .33], [ra, a + p * .39], [rp, a + p * .46], [rf, a + p * .54]];
    pts.forEach(([r, aa], j) => { const x = r * Math.cos(aa), z = r * Math.sin(aa); (i === 0 && j === 0) ? s.moveTo(x, z) : s.lineTo(x, z); });
  }
  s.closePath();
  if (o.spokes) { const n = o.spokes, ri = o.hub || rp * .22, ro = rf - (o.rim || rp * .14), w = (o.sw || rp * .07); for (let k = 0; k < n; k++) { const a0 = k / n * TAU + w / ri * .7 + (o.rot || 0), a1 = (k + 1) / n * TAU - w / ri * .7 + (o.rot || 0), b0 = k / n * TAU + w / ro + (o.rot || 0), b1 = (k + 1) / n * TAU - w / ro + (o.rot || 0); const h = new THREE.Path(); const M = 14; for (let j = 0; j <= M; j++) { const a = lerp(b0, b1, j / M); j ? h.lineTo(ro * Math.cos(a), ro * Math.sin(a)) : h.moveTo(ro * Math.cos(a), ro * Math.sin(a)); } for (let j = M; j >= 0; j--) { const a = lerp(a0, a1, j / M); h.lineTo(ri * Math.cos(a), ri * Math.sin(a)); } h.closePath(); s.holes.push(h); } }
  if (o.bore) s.holes.push(circPath(0, 0, o.bore, 24, new THREE.Path(), true));
  return s;
}
function escShape(r = 2.1, N = ESC_T) {
  const s = new THREE.Shape(), p = TAU / N, rf = r - .5;
  for (let i = 0; i < N; i++) { const a = i * p; const pts = [[rf, a], [r - .12, a + p * .36], [r, a + p * .44], [r - .02, a + p * .58], [r - .2, a + p * .62], [rf + .05, a + p * .9]]; pts.forEach(([rr_, aa], j) => { const x = rr_ * Math.cos(aa), z = rr_ * Math.sin(aa); (i === 0 && j === 0) ? s.moveTo(x, z) : s.lineTo(x, z); }); }
  s.closePath();
  const n = 4, ri = .42, ro = rf - .22; for (let k = 0; k < n; k++) { const h = new THREE.Path(); const a0 = k / n * TAU + .32, a1 = (k + 1) / n * TAU - .32, b0 = k / n * TAU + .1, b1 = (k + 1) / n * TAU - .1; for (let j = 0; j <= 10; j++) { const a = lerp(b0, b1, j / 10); j ? h.lineTo(ro * Math.cos(a), ro * Math.sin(a)) : h.moveTo(ro * Math.cos(a), ro * Math.sin(a)); } for (let j = 10; j >= 0; j--) { const a = lerp(a0, a1, j / 10); h.lineTo(ri * Math.cos(a), ri * Math.sin(a)); } h.closePath(); s.holes.push(h); }
  return s;
}
const nonIdx = g => (g.index ? g.toNonIndexed() : g);
function merge(list) { const g = mergeGeometries(list.map(x => { const n = nonIdx(x); n.clearGroups(); for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; }), false); return g; }
function part(geo, base, id, parent, o = {}) { const m = new THREE.Mesh(geo, MA(base, id)); m.castShadow = o.shadow !== false; m.receiveShadow = true; m.userData.part = id; if (o.pos) m.position.set(...o.pos); parent.add(m); if (INFO[id] && o.pick !== false) pickable(m, INFO[id]); return m; }
function arbor(y0, y1, r = .16, pivot = .07) { return lathe([[0, y0 - .25], [pivot, y0 - .25], [pivot, y0], [r, y0 + .1], [r, y1 - .1], [pivot, y1], [pivot, y1 + .25], [0, y1 + .25]], 18); }
function jewelGeo() { return lathe([[0, .1], [.22, .1], [.36, .04], [.42, -.02], [.42, -.1], [0, -.1]], 24); }
// ---------- part info (click a part) ----------
const INFO = {};
const inf = (id, en, zh, fen, fzh, v) => (INFO[id] = { name: B(en, zh), fn: B(fen, fzh), v });
inf('plate', 'Main plate', '主夹板', 'The movement’s chassis (pillar plate). Brass, rhodium-plated, circular-grained (perlage). Every pivot hole is jewelled.', '机芯的底座（主夹板）。黄铜镀铑，打珍珠纹。各轴孔都装有宝石轴承。');
inf('bridges', 'Bridges', '夹板', 'Barrel bridge, train bridge and pallet bridge hold the top pivots. Côtes de Genève stripes are decoration.', '条盒夹板、轮系夹板和擒纵叉夹板固定上轴尖。日内瓦波纹只是装饰。');
inf('barrel', 'Mainspring barrel', '发条盒', 'Drum holding the coiled mainspring; its 84 teeth drive the centre pinion. One turn ≈ 7 h of running.', '内装卷紧的发条；84 齿驱动中心轮齿轴。转一圈约等于走时 7 小时。', () => fmt(R().T, 1) + ' N·mm');
inf('mains', 'Mainspring', '发条', 'Hardened alloy strip coiled around the barrel arbor. Winding coils it tight; it unwinds into the barrel wall over ~38 h.', '绕在条轴上的高弹性合金带。上弦时卷紧，约 38 小时内放松贴向条盒壁。', () => fmt(R().wind * 100, 0) + ' %');
inf('ratchet', 'Ratchet wheel + click', '棘轮 + 止逆爪', 'Sits on the barrel arbor. The click lets it turn only in the winding direction, so the spring cannot unwind backwards.', '装在条轴上。止逆爪只允许它朝上弦方向转，发条无法倒退。');
inf('crownw', 'Crown wheel', '小钢轮', 'Transfers winding from the stem’s winding pinion to the ratchet wheel.', '把柄轴立轮的上弦动作传给棘轮。');
inf('center', 'Centre wheel', '二轮（中心轮）', '1 revolution per hour; carries the minute hand (cannon pinion) on the dial side. 80 teeth.', '每小时 1 转，带动表盘侧的分针（跨轮）。80 齿。', () => '1 rev/h');
inf('third', 'Third wheel', '三轮', 'Intermediate wheel: 75 teeth, 10-leaf pinion. Steps the speed up between centre and fourth wheels.', '中间轮：75 齿、10 叶齿轴。在中心轮与四轮之间增速。', () => fmt(60 * 80 / 10 / 60, 0) + ' rev/h');
inf('fourth', 'Fourth (seconds) wheel', '四轮（秒轮）', '1 revolution per minute: its arbor runs up the hollow centre arbor to carry the central seconds hand.', '每分钟 1 转：轴穿过空心中心轴，带动中心秒针。', () => '1 rpm');
inf('esc', 'Escape wheel', '擒纵轮', 'Swiss-lever escape wheel, 20 club teeth. Advances half a tooth (9°) per beat.', '瑞士杠杆式擒纵轮，20 个棒槌齿。每摆一次前进半齿 (9°)。', () => fmt(R().escRpm, 0) + ' rpm');
inf('pallet', 'Pallet fork (lever)', '擒纵叉', 'Two synthetic-ruby pallet stones lock and release the escape wheel; the fork end receives and gives impulse to the balance’s impulse pin.', '两颗人造红宝石叉瓦锁住和释放擒纵轮；叉头与摆轮的圆盘钉交换冲量。', () => fmt(W.lever, 1) + '°');
inf('balance', 'Balance wheel', '摆轮', 'The time base. Glucydur rim, oscillates ±' + 'A at 4 Hz (28 800 vph) on its hairspring.', '计时基准。铍青铜摆轮，在游丝作用下以 4 Hz（每小时 28 800 次）往复摆动。', () => fmt(R().A, 0) + '° · ' + fmt(R().f, 0) + ' Hz');
inf('hair', 'Hairspring', '游丝', 'Flat Nivarox-type spiral: its stiffness k and the balance inertia I set the frequency f = (1/2π)√(k/I).', '平游丝（Nivarox 类合金）：刚度 k 与摆轮惯量 I 决定频率 f = (1/2π)√(k/I)。', () => fmt(R().k, 2) + ' µN·m/rad');
inf('cock', 'Balance cock + regulator', '摆夹板 + 快慢针', 'Holds the balance’s top pivot in a shock-protected jewel. The index arm moves the curb pins along the hairspring to fine-tune rate.', '在防震宝石轴承中固定摆轮上轴尖。快慢针沿游丝移动夹针，微调走时。', () => fmt(PRM.reg, 0) + ' s/d');
inf('shock', 'Shock protection', '防震器', 'Lyre-shaped spring holds the cap jewel so a knock lets the pivot move and return instead of breaking.', '琴形弹簧压住盖石：受到撞击时轴尖可以移动并复位，而不会折断。');
inf('jewel', 'Jewel bearings', '宝石轴承', 'Synthetic ruby bearings (25 in a 2824-2): low, stable friction at every fast pivot.', '人造红宝石轴承（2824-2 共 25 颗）：在各高速轴尖处提供低而稳定的摩擦。');
inf('rotor', 'Winding rotor', '自动陀', 'Half-disc oscillating weight on a ball bearing. Any wrist motion swings it; reverser wheels wind the barrel in both directions.', '装在滚珠轴承上的半圆摆陀。手腕一动它就摆；换向轮让双向转动都能上弦。', () => fmt(W.rotorV * 9.55, 0) + ' rpm');
inf('auto', 'Automatic module', '自动上弦机构', 'Bridge with reverser wheels and a reduction wheel that gear the rotor down to the ratchet wheel.', '装有换向轮和减速轮的夹板，把自动陀减速后传给棘轮。');
inf('stem', 'Stem + crown', '柄轴 + 表冠', 'Position 1 winds through the winding pinion; pulled out, the sliding pinion engages the setting wheels to set the hands.', '位置 1 通过立轮上弦；拔出时离合轮与拨针轮啮合，用来调时。');
inf('keyless', 'Keyless works', '上条拨针机构', 'Setting lever, yoke and sliding (clutch) pinion on the dial side: choose winding or hand-setting.', '表盘侧的拉档、离合杆与离合轮：选择上弦还是拨针。');
inf('motion', 'Motion works + date', '跨轮 + 日历', 'Cannon pinion (minutes), minute wheel and hour wheel make the 12:1 reduction for the hour hand; date ring with 31 teeth.', '跨轮（分）、跨轮片和时轮组成 12:1 减速带动时针；日历圈 31 齿。');
// ---------- main plate (with pockets) ----------
{
  const [bx, bz] = POS.Bl, [ex, ez] = POS.E, [px, pz] = POS.P;
  const base = withHoles(circPath(0, 0, RPL, 96, new THREE.Shape()), [[0, 0, .5]]);
  const g1 = extrY(base, -1.2, -.45, .05, 48);
  const top = circPath(0, 0, RPL - .02, 96, new THREE.Shape());
  top.holes.push(hull([[bx, bz, 4.75], [px, pz, 1.1]], 32).extractPoints(1).shape.reverse().reduce((p, v, i) => (i ? p.lineTo(v.x, v.y) : p.moveTo(v.x, v.y), p), new THREE.Path()));
  for (const [x, z, r] of [[POS.B[0], POS.B[1], 5.3], [ex, ez, 2.45], [0, 0, 1.2]]) top.holes.push(circPath(x, z, r, 40, new THREE.Path(), true));
  const g2 = extrY(top, -.45, 0, .05, 48);
  // dial-side recesses for keyless: a shallow step ring
  const pl = part(merge([g1, g2]), 'plate', 'plate', GRP.plate); pl.castShadow = false;
}
// ---------- barrel, mainspring, ratchet ----------
ROT.barrel = new THREE.Group(); ROT.barrel.position.set(POS.B[0], 0, POS.B[1]); GRP.barrel.add(ROT.barrel);
ROT.arbor = new THREE.Group(); ROT.arbor.position.copy(ROT.barrel.position); GRP.barrel.add(ROT.arbor);
const BAR = {};
{
  const drum = lathe([[.95, -.2], [4.98, -.2], [5.0, -.1], [5.0, 2.05], [4.92, 2.12], [4.6, 2.12], [4.6, .02], [.95, .02]], 96);
  const teeth = extrY(gearShape(84, 5.16, .1229, { bore: 4.7 }), -.2, .16, .02, 2);
  part(merge([drum, teeth]), 'gold', 'barrel', ROT.barrel);
  BAR.lidM = MA('gold', 'barrelLid'); SECM.barrel.push(BAR.lidM);
  const lid = new THREE.Mesh(lathe([[.7, 2.0], [4.62, 2.0], [4.62, 2.14], [4.4, 2.2], [.7, 2.2]], 96), BAR.lidM); lid.castShadow = true; ROT.barrel.add(lid); pickable(lid, INFO.barrel); BAR.lid = lid;
  part(lathe([[0, -.5], [.4, -.5], [.4, -.15], [.82, -.1], [.82, 2.3], [.45, 2.35], [.45, 3.3], [0, 3.3]], 24), 'steel', 'barrel', ROT.arbor);
  // ratchet wheel (sawtooth, sunburst steel) on top of barrel bridge
  const rs = new THREE.Shape(); const N = 60, ro = 3.0, rf = 2.82; for (let i = 0; i < N; i++) { const a = i / N * TAU, b = (i + .78) / N * TAU; const p1 = [rf * Math.cos(a), rf * Math.sin(a)], p2 = [ro * Math.cos(b), ro * Math.sin(b)]; i ? rs.lineTo(...p1) : rs.moveTo(...p1); rs.lineTo(...p2); } rs.closePath();
  const rw = part(extrY(rs, 3.32, 3.62, .03, 2), 'steelS', 'ratchet', ROT.arbor); rw.material.roughnessMap = TX.sun;
  const sc = part(lathe([[0, 3.95], [.55, 3.92], [.85, 3.8], [.9, 3.62], [0, 3.62]], 32), 'steel', 'ratchet', ROT.arbor);
  part(merge([new THREE.BoxGeometry(1.6, .14, .2).translate(0, 3.92, 0), new THREE.BoxGeometry(.2, .14, 1.6).translate(0, 3.92, 0)]), 'dark', 'ratchet', ROT.arbor, { pick: false });
  // mainspring (rebuilt when the wind state changes)
  BAR.spring = new THREE.Mesh(new THREE.BufferGeometry(), MA('mains', 'mains')); BAR.spring.castShadow = true; BAR.spring.position.copy(ROT.barrel.position); GRP.barrel.add(BAR.spring); pickable(BAR.spring, INFO.mains); BAR.w = -1;
}
function mainspringGeo(w) {
  const turns = 11 + 5 * w, n = Math.round(turns * 40 * SEG), t = .085, o = [], i_ = [];
  for (let k = 0; k <= n; k++) { const s = k / n, phi = s * turns * TAU; const rw_ = .9 + s * 1.9 * (1 + .15 * (1 - w)), ru = 4.5 - (1 - s) * 2.1; const r = lerp(ru, rw_, smooth(w)); o.push([(r + t / 2) * Math.cos(phi), (r + t / 2) * Math.sin(phi)]); i_.push([(r - t / 2) * Math.cos(phi), (r - t / 2) * Math.sin(phi)]); }
  const s = new THREE.Shape(); o.forEach((p, k) => k ? s.lineTo(...p) : s.moveTo(...p)); for (let k = i_.length - 1; k >= 0; k--) s.lineTo(...i_[k]); s.closePath();
  return extrY(s, .1, 1.95, 0, 1);
}
function updateMainspring() { const w = Math.round(W.wind * 40) / 40; if (w === BAR.w) return; BAR.w = w; BAR.spring.geometry.dispose(); BAR.spring.geometry = mainspringGeo(w); }
// ---------- going train ----------
function wheel(id, [x, z], { N, rp, m, y, th = .16, spokes = 4, base = 'gold', pin, arb, hub, rim, sw }) {
  const g = new THREE.Group(); g.position.set(x, 0, z); GRP.train.add(g);
  const parts = [extrY(gearShape(N, rp, m, { spokes, hub: hub || rp * .2, rim: rim || rp * .1, sw: sw || Math.max(.1, rp * .05) }), y - th / 2, y + th / 2, .015, 2)];
  parts.push(lathe([[0, y - th / 2 - .08], [rp * .2 + .1, y - th / 2 - .08], [rp * .2 + .1, y + th / 2 + .06], [0, y + th / 2 + .06]], 24));
  part(merge(parts), base, id, g);
  const st = []; if (pin) st.push(extrY(gearShape(pin.N, pin.rp, pin.m, { add: .8 }), pin.y0, pin.y1, .01, 2)); if (arb) st.push(arbor(arb[0], arb[1], arb[2] || .16));
  if (st.length) part(merge(st), 'steel', id, g);
  return g;
}
ROT.center = wheel('center', POS.C, { N: 80, rp: 4.98, m: .1244, y: .9, spokes: 4, pin: { N: 12, rp: .74, m: .1229, y0: -.2, y1: .16 }, arb: [-1.6, 2.45, .3] });
ROT.third = wheel('third', POS.T, { N: 75, rp: 4.94, m: .1318, y: 1.5, spokes: 4, pin: { N: 10, rp: .62, m: .1244, y0: .78, y1: 1.02 }, arb: [-.2, 2.6] });
ROT.fourth = wheel('fourth', POS.C, { N: 84, rp: 3.78, m: .09, y: 2.0, spokes: 4, pin: { N: 10, rp: .66, m: .1318, y0: 1.38, y1: 1.62 }, arb: [1.3, 2.7, .14] });
ROT.esc = new THREE.Group(); ROT.esc.position.set(POS.E[0], 0, POS.E[1]); GRP.esc.add(ROT.esc);
part(merge([extrY(escShape(), 1.04, 1.2, .01, 2), extrY(gearShape(7, .315, .09, { add: .8 }), 1.9, 2.1, .01, 2), arbor(-.1, 2.6, .11), lathe([[0, .98], [.34, .98], [.34, 1.26], [0, 1.26]], 20)]), 'steel', 'esc', ROT.esc);
// ---------- pallet fork (Swiss lever) ----------
ROT.pallet = new THREE.Group(); ROT.pallet.position.set(POS.P[0], 0, POS.P[1]); GRP.esc.add(ROT.pallet);
{
  const [ex, ez] = POS.E, [px, pz] = POS.P, ue = [(ex - px) / 2.8, (ez - pz) / 2.8];
  const base = Math.atan2(pz - ez, px - ex); // direction escape→pallet
  const st = [-1, 1].map(sg => { const a = base + sg * 27 * DEG; return [ex + 2.05 * Math.cos(a) - px, ez + 2.05 * Math.sin(a) - pz, a]; });
  const body = hull([[0, 0, .5], [st[0][0] * .82, st[0][1] * .82, .36], [st[1][0] * .82, st[1][1] * .82, .36]], 20, 99);
  body.holes.push(circPath(ue[0] * .9, ue[1] * .9, .32, 20, new THREE.Path(), true));
  const L = 3.2 - .62, nx = -ue[0], nz = -ue[1], ox = -nz, oz = nx, w = .2; // lever toward the balance
  const lv = new THREE.Shape(); const P_ = (a, b) => [nx * a + ox * b, nz * a + oz * b];
  [[0, w], [L - .2, w * .8], [L, .42], [L + .42, .38], [L + .48, .16], [L + .1, .14], [L + .1, -.14], [L + .48, -.16], [L + .42, -.38], [L, -.42], [L - .2, -w * .8], [0, -w]].forEach((q, i) => { const [a, b] = P_(...q); i ? lv.lineTo(a, b) : lv.moveTo(a, b); }); lv.closePath();
  const gp = lathe([[0, 1.0], [.05, 1.0], [.05, 1.42], [0, 1.42]], 10).translate(...P_(L - .05, 0).flatMap((v, i) => i ? [0, v] : [v]));
  part(merge([extrY(body, 1.04, 1.2, .01, 4), extrY(lv, 1.06, 1.18, .01, 2), arbor(-.1, 1.75, .1), gp]), 'steel', 'pallet', ROT.pallet);
  const stones = st.map(([x, z, a]) => { const g = new RoundedBoxGeometry(.58, .3, .22, 1, .03); g.rotateY(-a); g.translate(x * .93, 1.12, z * .93); return g; });
  part(merge(stones), 'ruby', 'pallet', ROT.pallet);
}
// ---------- balance, roller, hairspring, cock ----------
ROT.bal = new THREE.Group(); ROT.bal.position.set(POS.Bl[0], 0, POS.Bl[1]); GRP.balance.add(ROT.bal);
const HAIR = { tw: { value: 0 } };
{
  const u = POS.u, au = Math.atan2(u[1], u[0]);
  const rim = lathe(ringProf(3.86, 4.42, 2.58, 2.98, .05), 96);
  const arms = new THREE.Shape(); const aw = .28; [[-3.95, aw], [3.95, aw], [3.95, -aw], [-3.95, -aw]].forEach((p, i) => i ? arms.lineTo(...p) : arms.moveTo(...p)); arms.closePath();
  const ag = extrY(arms, 2.66, 2.86, .02, 2); ag.rotateY(-au + Math.PI / 2);
  const hubg = lathe(ringProf(.2, .62, 2.62, 2.9, .03), 32);
  part(merge([rim, ag, hubg]), 'glucy', 'balance', ROT.bal);
  const staff = lathe([[0, -.35], [.06, -.35], [.08, -.1], [.14, .1], [.14, .92], [.7, .92], [.72, .98], [.72, 1.08], [.3, 1.1], [.4, 1.3], [.4, 1.4], [.2, 1.45], [.2, 2.6], [.24, 3.25], [.08, 3.5], [.06, 4.2], [0, 4.2]], 32);
  const pin = new RoundedBoxGeometry(.16, .34, .1, 1, .02).translate(.55 * Math.cos(au), 1.2 - .2, .55 * Math.sin(au));
  part(staff, 'steel', 'balance', ROT.bal);
  part(pin, 'ruby', 'balance', ROT.bal);
  // hairspring: flat Archimedean spiral, inner end at the collet (twists with the balance), outer end at the stud
  const n = 14, pts = [], rin = .5, rout = 2.75, Np = Math.round(n * 64 * SEG);
  for (let k = 0; k <= Np; k++) { const s = k / Np, a = s * n * TAU, r = lerp(rin, rout, s); pts.push(new THREE.Vector3(r * Math.cos(a), 3.32, r * Math.sin(a))); }
  const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Np, .028, 4, false);
  const pp = tg.attributes.position, sp = new Float32Array(pp.count); for (let i = 0; i < pp.count; i++) sp[i] = clamp((Math.hypot(pp.getX(i), pp.getZ(i)) - rin) / (rout - rin)); tg.setAttribute('sp', new THREE.BufferAttribute(sp, 1));
  const hm = MA('spring', 'hair'); hm.onBeforeCompile = sh => { sh.uniforms.uTw = HAIR.tw; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float sp; uniform float uTw;').replace('#include <begin_vertex>', 'float tw_ = uTw * (1.0 - sp); float ca_ = cos(tw_), sa_ = sin(tw_); vec3 transformed = vec3(position.x * ca_ - position.z * sa_, position.y, position.x * sa_ + position.z * ca_) * vec3(1.0 + .03 * uTw * (1.0 - sp), 1.0, 1.0 + .03 * uTw * (1.0 - sp));'); };
  HAIR.mesh = new THREE.Mesh(tg, hm); HAIR.mesh.castShadow = false; HAIR.mesh.position.set(POS.Bl[0], 0, POS.Bl[1]); GRP.balance.add(HAIR.mesh); pickable(HAIR.mesh, INFO.hair);
  part(lathe(ringProf(.18, .52, 3.2, 3.44, .02), 24), 'steel', 'hair', ROT.bal); // collet
}
// balance cock (bridge with foot at the plate edge), regulator index, shock spring
const COCK = {};
{
  const [bx, bz] = POS.Bl, d = Math.hypot(bx, bz), fx = bx / d * 10.6, fz = bz / d * 10.6, au = Math.atan2(bz, bx);
  const arm = withHoles(hull([[bx, bz, 1.55], [fx, fz, 2.1]], 28), [[bx, bz, .45]]);
  const foot = hull([[fx, fz, 2.0], [bx / d * 11.6, bz / d * 11.6, 1.6]], 24);
  COCK.geo = merge([extrY(arm, 3.62, 4.14, .06, 24), extrY(foot, 0, 3.66, .05, 16)]);
  COCK.stud = new RoundedBoxGeometry(.5, .5, .5, 1, .06).translate(bx + Math.cos(au) * 2.75, 3.32, bz + Math.sin(au) * 2.75);
  // regulator index arm (rotates with PRM.reg)
  ROT.index = new THREE.Group(); ROT.index.position.set(bx, 0, bz); GRP.bridges.add(ROT.index);
  const ix = new THREE.Shape(); [[0, .62], [5.6, .14], [5.9, 0], [5.6, -.14], [0, -.62], [-.9, -.3], [-.9, .3]].forEach((p, i) => i ? ix.lineTo(...p) : ix.moveTo(...p)); ix.closePath(); ix.holes.push(circPath(0, 0, .55, 20, new THREE.Path(), true));
  const ixg = extrY(ix, 4.14, 4.26, .015, 3); ixg.rotateY(-au - .35);
  part(ixg, 'steel', 'cock', ROT.index);
  // Incabloc-style lyre spring
  const ly = []; for (let k = 0; k <= 40; k++) { const s = k / 40, a = lerp(-2.6, 2.6, s); ly.push(new THREE.Vector3(.75 * Math.sin(a) * (1 - .25 * Math.cos(a * 2)), 4.32, .6 * Math.cos(a) - .1)); }
  const lyre = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ly), 48, .055, 5, false); lyre.rotateY(-au); lyre.translate(bx, 0, bz);
  part(lyre, 'gold', 'shock', GRP.bridges);
}
// ---------- bridges (merged; one material) ----------
{
  const [bx, bz] = POS.B, [cx, cz] = POS.crw, [tx, tz] = POS.T, [ex, ez] = POS.E, [px, pz] = POS.P;
  const barrelB = withHoles(hull([[bx, bz, 5.35], [cx, cz, 1.7], [-7.5, 5.2, 1.4], [-7.5, -5.2, 1.4]], 30), [[bx, bz, .55], [cx, cz, .3]]);
  // ETA-style large train bridge: covers the right half of the plate, with the balance + lever pocket cut out
  const trainB = new THREE.Shape(); {
    const R = 12.05, x0 = -.7, a0 = Math.acos(x0 / R), seg = [];
    for (let i = 0; i <= 140; i++) { const a = -a0 + i / 140 * 2 * a0; seg.push([R * Math.cos(a), R * Math.sin(a)]); }
    const zt = R * Math.sin(a0); for (let i = 1; i < 80; i++) seg.push([x0, zt - i / 80 * 2 * zt]);
    const H = hull([[POS.Bl[0], POS.Bl[1], 4.85], [px, pz, 1.35], [ex, ez, 1.0]], 40, 11.6).extractPoints(1).shape.map(v => [v.x, v.y]);
    const inH = q => { for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) < 0) return false; } return true; };
    const flags = seg.map(inH); let i0 = flags.indexOf(true); let i1 = i0; while (i1 + 1 < seg.length && flags[i1 + 1]) i1++;
    const inside = H.filter(q => q[0] > x0 + .02 && Math.hypot(q[0], q[1]) < R - .02).reverse();
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    const ent = seg[i0 - 1], ext = seg[i1 + 1]; let k = 0; inside.forEach((q, i) => { if (d2(q, ent) < d2(inside[k], ent)) k = i; });
    const path = inside.slice(k).concat(inside.slice(0, k));
    const out = i0 < 0 ? seg : seg.slice(0, i0).concat(path, seg.slice(i1 + 1));
    out.forEach((q, i) => i ? trainB.lineTo(q[0], q[1]) : trainB.moveTo(q[0], q[1])); trainB.closePath();
  }
  for (const [x, z, r] of [[0, 0, .4], [tx, tz, .3],]) trainB.holes.push(circPath(x, z, r, 24, new THREE.Path(), true));
  const palB = hull([[px, pz, .9], [px + POS.u[1] * 2.2, pz - POS.u[0] * 2.2, .9]], 20);
  const feet = [[-7.5, 5.2], [-7.5, -5.2], [6.6, 3.8], [px + POS.u[1] * 2.2, pz - POS.u[0] * 2.2]].map(([x, z]) => extrY(circPath(x, z, .95, 24, new THREE.Shape()), 0, 2.6, .03, 2));
  const g = merge([extrY(barrelB, 2.5, 3.32, .06, 24), extrY(trainB, 2.62, 3.3, .06, 20), extrY(palB, 1.48, 1.82, .04, 16), ...feet, COCK.geo, COCK.stud]);
  BRIDGE = part(g, 'bridge', 'bridges', GRP.bridges);
  // crown wheel (on the barrel bridge, meshes the ratchet)
  ROT.crownw = new THREE.Group(); ROT.crownw.position.set(cx, 0, cz); GRP.bridges.add(ROT.crownw);
  part(merge([extrY(gearShape(26, 1.3, .1, { bore: .3 }), 3.32, 3.56, .02, 2)]), 'steelS', 'crownw', ROT.crownw);
  part(lathe([[0, 3.82], [.5, 3.8], [.62, 3.68], [.62, 3.56], [0, 3.56]], 24), 'steel', 'crownw', GRP.bridges, { pos: [cx, 0, cz] });
  // click (pawl) + spring
  const cl = new THREE.Shape(); [[0, 0], [1.6, .25], [2.3, .05], [1.7, -.3], [0, -.4]].forEach((p, i) => i ? cl.lineTo(...p) : cl.moveTo(...p)); cl.closePath();
  const clg = extrY(cl, 3.34, 3.5, .015, 2); clg.rotateY(.9); clg.translate(bx + 1.6, 0, bz + 3.6);
  part(clg, 'steel', 'ratchet', GRP.bridges);
}
var BRIDGE;
// ---------- jewels + screws (instanced) ----------
{
  const [bx, bz] = POS.Bl, [ex, ez] = POS.E, [px, pz] = POS.P, [tx, tz] = POS.T;
  const J = [[0, 3.34, 0], [tx, 3.34, tz], [ex, 3.34, ez], [px, 1.86, pz], [bx, 4.18, bz], [POS.B[0] + 2.2, 3.36, POS.B[1] + 2.2]];
  const jm = new THREE.InstancedMesh(jewelGeo(), MA('ruby', 'jewel'), J.length);
  const ch = new THREE.InstancedMesh(lathe(ringProf(.42, .7, -.06, .06, .02), 24), MA('steel', 'jewel'), J.length);
  const o = new THREE.Object3D(); J.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.scale.setScalar(i === 4 ? 1.2 : 1); o.updateMatrix(); jm.setMatrixAt(i, o.matrix); ch.setMatrixAt(i, o.matrix); });
  GRP.bridges.add(jm, ch); pickable(jm, INFO.jewel); jm.userData.part = 'jewel'; ch.userData.part = 'jewel';
  const S = [[-7.5, 3.32, 5.2, 1], [-7.5, 3.32, -5.2, 1], [-2.4, 3.32, 3.9, 1], [6.6, 3.3, 3.8, 1], [1.6, 3.3, 1.9, .9], [px + POS.u[1] * 2.2, 1.82, pz - POS.u[0] * 2.2, .75], [bx / Math.hypot(bx, bz) * 10.6, 4.14, bz / Math.hypot(bx, bz) * 10.6, 1]];
  const head = lathe([[0, .3], [.3, .28], [.52, .18], [.58, 0], [0, 0]], 24), slot = new THREE.BoxGeometry(1.25, .14, .16).translate(0, .26, 0);
  const sh = new THREE.InstancedMesh(head, MA('blue', 'bridges'), S.length), ss = new THREE.InstancedMesh(slot, MA('dark', 'bridges'), S.length);
  S.forEach(([x, y, z, s], i) => { o.position.set(x, y, z); o.scale.setScalar(s); o.rotation.y = i * 1.3; o.updateMatrix(); sh.setMatrixAt(i, o.matrix); ss.setMatrixAt(i, o.matrix); });
  sh.castShadow = true; GRP.bridges.add(sh, ss); pickable(sh, INFO.bridges);
}
// ---------- automatic module + rotor ----------
{
  const P = RV; const ab = withHoles(hull([[0, 0, 2.6], [P.r1[0], P.r1[1], 1.6], [P.r2[0], P.r2[1], 1.6], [P.rd[0], P.rd[1], 2.0], [3.6, 1.6, 1.6]], 28), [[0, 0, .9]]);
  const feet = [[-2.6, 2.4], [3.8, 1.2], [-4.4, -5.4]].map(([x, z]) => extrY(circPath(x, z, .7, 20, new THREE.Shape()), 3.3, 4.3, .03, 2));
  part(merge([extrY(ab, 4.3, 4.76, .05, 20), ...feet]), 'bridge', 'auto', GRP.auto);
  const mk = (k, [x, z], N, rp, y, pinN) => { const g = new THREE.Group(); g.position.set(x, 0, z); GRP.auto.add(g); ROT[k] = g; part(merge([extrY(gearShape(N, rp, .1, { spokes: rp > 1 ? 3 : 0, hub: .45, rim: .2, sw: .12 }), y, y + .18, .012, 2), lathe([[0, y - .3], [.42, y - .3], [.42, y + .3], [0, y + .3]], 20)]), 'gold', 'auto', g); if (pinN) part(extrY(gearShape(pinN, .45, .1, { add: .8 }), y + .18, y + .42, .01, 2), 'steel', 'auto', g); return g; };
  mk('rv1', P.r1, 24, 1.2, 4.82); mk('rv2', P.r2, 24, 1.2, 4.82); mk('rd', P.rd, 32, 1.6, 4.82, 9);
}
ROT.rotor = new THREE.Group(); GRP.rotor.add(ROT.rotor);
{
  const s = new THREE.Shape(); const R0 = 12.35, Ri = 2.05; s.moveTo(Ri, 0); s.lineTo(R0, 0); s.absarc(0, 0, R0, 0, Math.PI, false); s.lineTo(-Ri, 0); s.absarc(0, 0, Ri, Math.PI, 0, true);
  const disc = extrY(s, 5.35, 5.8, .06, 64); disc.rotateY(Math.PI / 2);
  const rimS = new THREE.Shape(); rimS.moveTo(10.7, 0); rimS.lineTo(R0, 0); rimS.absarc(0, 0, R0, 0, Math.PI, false); rimS.lineTo(-10.7, 0); rimS.absarc(0, 0, 10.7, Math.PI, 0, true);
  const rimG = extrY(rimS, 5.0, 6.15, .12, 64); rimG.rotateY(Math.PI / 2);
  part(disc, 'rotor', 'rotor', ROT.rotor); part(rimG, 'steelS', 'rotor', ROT.rotor);
  part(merge([lathe(ringProf(1.75, 2.15, 5.0, 6.0, .06), 48), extrY(gearShape(16, .9, .1, { add: .8, bore: .4 }), 4.86, 5.08, .01, 2)]), 'steel', 'rotor', ROT.rotor);
  part(merge([lathe(ringProf(.5, 1.05, 5.05, 5.95, .05), 40), lathe([[0, 6.25], [.7, 6.2], [1.0, 6.05], [1.0, 5.9], [0, 5.9]], 32), new THREE.BoxGeometry(1.7, .12, .22).translate(0, 6.24, 0)]), 'steel', 'rotor', GRP.rotor);
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(.34, 14, 10), MA('steel', 'rotor'), 9); const o = new THREE.Object3D();
  for (let i = 0; i < 9; i++) { o.position.set(1.4 * Math.cos(i / 9 * TAU), 5.5, 1.4 * Math.sin(i / 9 * TAU)); o.updateMatrix(); balls.setMatrixAt(i, o.matrix); } ROT.balls = balls; ROT.rotor.add(balls);
}
// ---------- dial side: motion works, date ring, keyless works, stem + crown ----------
{
  const D = GRP.dial;
  ROT.cannon = new THREE.Group(); D.add(ROT.cannon);
  part(merge([lathe([[.3, -1.25], [.62, -1.25], [.62, -3.2], [.45, -3.3], [.3, -3.3]], 28), extrY(gearShape(14, .78, .1, { add: .8, bore: .3 }), -1.6, -1.35, .01, 2)]), 'steel', 'motion', ROT.cannon);
  ROT.hourw = new THREE.Group(); D.add(ROT.hourw);
  part(merge([extrY(gearShape(48, 2.6, .1, { spokes: 0, bore: .64 }), -2.05, -1.85, .01, 2), lathe([[.64, -1.85], [.85, -1.85], [.85, -2.9], [.64, -2.9]], 28)]), 'gold', 'motion', ROT.hourw);
  ROT.minw = new THREE.Group(); ROT.minw.position.set(-1.3, 0, 3.05); D.add(ROT.minw);
  part(merge([extrY(gearShape(42, 2.2, .1, { spokes: 3, hub: .4, rim: .25, sw: .14 }), -1.62, -1.42, .01, 2)]), 'gold', 'motion', ROT.minw);
  part(extrY(gearShape(10, .55, .1, { add: .8 }), -2.05, -1.62, .01, 2), 'steel', 'motion', ROT.minw);
  // date ring with printed numerals (dial-facing side)
  const dr = new THREE.Shape(); circPath(0, 0, 12.3, 120, dr); const N = 31; const ih = new THREE.Path(); for (let i = 0; i < N; i++) { const a = i / N * TAU, b = (i + .5) / N * TAU; const p1 = [10.9 * Math.cos(a), 10.9 * Math.sin(a)], p2 = [10.55 * Math.cos(a + .03), 10.55 * Math.sin(a + .03)], p3 = [10.55 * Math.cos(b), 10.55 * Math.sin(b)], p4 = [10.9 * Math.cos(b + .03), 10.9 * Math.sin(b + .03)]; i ? ih.lineTo(...p1) : ih.moveTo(...p1); ih.lineTo(...p2); ih.lineTo(...p3); ih.lineTo(...p4); } ih.closePath(); dr.holes.push(ih);
  const dg = extrY(dr, -1.62, -1.48, .01, 2); ROT.date = new THREE.Group(); D.add(ROT.date); part(dg, 'date', 'motion', ROT.date);
  // keyless works
  const K = GRP.keyless, ys = -2.15;
  ROT.stem = new THREE.Group(); ROT.stem.position.set(0, ys, 0); K.add(ROT.stem);
  const stemG = lathe([[0, 4.0], [.32, 4.0], [.36, 6.0], [.36, 7.6], [.5, 7.7], [.5, 8.9], [.3, 9.0], [.3, 9.5], [.45, 9.6], [.45, 13.5], [.55, 13.6], [.55, 15.0], [0, 15.0]], 20); stemG.rotateZ(Math.PI / 2);
  part(stemG, 'steel', 'stem', ROT.stem);
  const crown = new THREE.LatheGeometry([[0, 0], [2.2, 0], [2.6, .25], [2.6, 2.3], [2.3, 2.6], [.7, 2.7], [0, 2.7]].map(([r, y]) => V2(r, y)), 72);
  { const p = crown.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z); if (r > 2.45 && y > .2 && y < 2.4) { const a = Math.atan2(z, x), k = 1 - .06 * (.5 + .5 * Math.cos(a * 36)); p.setX(i, x * k); p.setZ(i, z * k); } } crown.computeVertexNormals(); }
  crown.rotateZ(Math.PI / 2); crown.translate(-15.0, 0, 0);
  const tubeG = lathe([[.6, 0], [1.25, 0], [1.25, 1.6], [.6, 1.6]], 32).rotateZ(Math.PI / 2).translate(-13.2, 0, 0);
  part(crown, 'crown', 'stem', ROT.stem); part(tubeG, 'steel', 'stem', K, { pos: [0, ys, 0] });
  ROT.wpin = new THREE.Group(); ROT.wpin.position.set(-10.4, ys, 0); K.add(ROT.wpin);
  part(extrY(gearShape(16, .95, .1, { add: .9, bore: .3 }), -.55, .55, .02, 2).rotateZ(Math.PI / 2), 'steelS', 'keyless', ROT.wpin);
  ROT.spin = new THREE.Group(); ROT.spin.position.set(-8.4, ys, 0); K.add(ROT.spin);
  part(extrY(gearShape(12, .8, .1, { add: .9, bore: .3 }), -.5, .5, .02, 2).rotateZ(Math.PI / 2), 'steelS', 'keyless', ROT.spin);
  const flat = (pts, y0, y1) => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(...p) : s.moveTo(...p)); s.closePath(); return extrY(s, y0, y1, .02, 4); };
  const lever = flat([[-7.4, 3.6], [-6.4, 3.9], [-6.1, 2.7], [-9.6, .7], [-10.0, .35], [-10.4, .8], [-9.4, 1.6]], -1.62, -1.42);
  const yoke = flat([[-6.0, -3.9], [-5.2, -3.4], [-7.8, -.6], [-8.0, .35], [-8.8, .35], [-8.6, -.9]], -1.62, -1.42);
  const spr = flat([[-3.6, -6.4], [-3.0, -6.0], [-6.6, -4.1], [-7.0, -4.4]], -1.62, -1.48);
  part(merge([lever, yoke, spr, lathe([[0, -1.7], [.45, -1.7], [.45, -1.3], [0, -1.3]], 16).translate(-6.8, 0, 3.3), lathe([[0, -1.7], [.45, -1.7], [.45, -1.3], [0, -1.3]], 16).translate(-5.7, 0, -3.6)]), 'steelS', 'keyless', K);
  ROT.setw = new THREE.Group(); ROT.setw.position.set(-5.0, 0, 1.9); K.add(ROT.setw);
  part(extrY(gearShape(20, 1.2, .1, { spokes: 0, bore: .25 }), -1.62, -1.42, .01, 2), 'gold', 'keyless', ROT.setw);
}
// ---------- explode wiring (rotating groups live inside) ----------
explodable(GRP.rotor, 'mv', [0, 15, 0], [0, 0, 0], .0); explodable(GRP.auto, 'mv', [0, 11, 0], [0, 0, 0], .1);
explodable(GRP.bridges, 'mv', [0, 7.5, 0], [0, 0, 0], .2); explodable(GRP.balance, 'mv', [0, 4.8, 0], [0, 0, 0], .3);
explodable(GRP.train, 'mv', [0, 2.6, 0], [0, 0, 0], .35); explodable(GRP.esc, 'mv', [0, 3.4, 0], [0, 0, 0], .35);
explodable(GRP.barrel, 'mv', [0, 2.2, 0], [0, 0, 0], .35); explodable(GRP.dial, 'mv', [0, -4.5, 0], [0, 0, 0], .3); explodable(GRP.keyless, 'mv', [0, -7, 0], [0, 0, 0], .3);
EXV.mv = 0; EXT.mv = 0;
