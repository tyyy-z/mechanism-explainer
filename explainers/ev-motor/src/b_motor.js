// ================= b_motor: Model 3-class rear drive unit (1 unit = 10 mm). Motor axis = group Z, group rotated so axis = world X =================
const L = 13.4, RSO = 11.25, RSI = 7.565, NS = 54, PITCH = TAU / NS, RRO = 7.495, RRI = 3.5, POLES = 6;
const GRP = {}; const ROOT = new THREE.Group(); scene.add(ROOT);
const MOTOR = new THREE.Group(); MOTOR.rotation.y = Math.PI / 2; ROOT.add(MOTOR); GRP.motor = MOTOR;
// ---------- materials ----------
TX.lam = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = (y / 4) % 2 ? '#6a6a6a' : '#9a9a9a'; g.fillRect(0, y, w, 1.4); } }, false);
TX.lam.repeat.set(1, 1.6);
TX.lamC = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#7c828a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(${150 + 60 * Math.sin(y * .7) | 0},${140 + 50 * Math.sin(y * .7 + 1) | 0},${150 + 70 * Math.sin(y * .7 + 2) | 0},.22)`; g.fillRect(0, y, w, 2); } });
TX.lamC.repeat.set(1, 1.6);
const lamSide = M('#a3aab3', { map: TX.lamC, bumpMap: TX.lam, bumpScale: 1.2, metalness: .55, roughness: .42 });
const lamCap = M('#8d939b', { metalness: .7, roughness: .3, envMapIntensity: 1 });
const copper = M('#c46e3e', { metalness: .85, roughness: .32, envMapIntensity: 1.1 });     // enamelled pin, slightly red-brown
const copperBare = M('#d88a5a', { metalness: .9, roughness: .26, envMapIntensity: 1.1 });  // stripped/welded tips, busbars
const weldMat = M('#9a5a36', { metalness: .75, roughness: .55 });                         // fused bead, oxidised
const liner = M('#a8955f', { roughness: .85 });                                             // Nomex-type slot liner
TX.ndfeb = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); } });
const magnetMat = M('#8f9cab', { map: TX.ndfeb, metalness: .75, roughness: .34 });           // Ni-plated NdFeB
const steel = M('#9aa1a9', { metalness: .9, roughness: .28, envMapIntensity: 1.1 });
const stainless = M('#b8bec5', { metalness: .85, roughness: .22 });
const alCast = new THREE.MeshPhysicalMaterial({ color: '#c9ced4', metalness: .6, roughness: .55, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: .8 });
// ---------- helpers ----------
const cyl = (r, a) => V3(r * Math.cos(a), r * Math.sin(a), 0);
const tp = (r, a, y) => { const c = Math.cos(a), s = Math.sin(a); return [r * c - y * s, r * s + y * c]; };   // radial r + tangential offset y at angle a
// sweep a rounded-rectangle wire along a curve given in cylindrical coords [theta, r, z]; frame from radial direction (keeps pins flat like real hairpins)
function sweepCyl(ctrl, wR, wT, n = 40) {
  const c = new THREE.CatmullRomCurve3(ctrl.map(q => V3(q[0], q[1], q[2])), false, 'centripetal');
  const P = [], pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const q = c.getPoint(i / n); P.push({ p: V3(q.y * Math.cos(q.x), q.y * Math.sin(q.x), q.z), rad: V3(Math.cos(q.x), Math.sin(q.x), 0) }); }
  const K = [[1, 1], [-1, 1], [-1, -1], [1, -1]], S = 8; // 8-vertex rounded rect
  const prof = []; for (let k = 0; k < S; k++) { const a = (k + .5) / S * TAU; const cx = Math.cos(a), sy = Math.sin(a); const sq = v => Math.sign(v) * Math.pow(Math.abs(v), .45); prof.push([sq(cx) * wR / 2, sq(sy) * wT / 2]); }
  for (let i = 0; i <= n; i++) {
    const a = P[Math.max(0, i - 1)].p, b = P[Math.min(n, i + 1)].p, T = b.clone().sub(a).normalize();
    const R = P[i].rad.clone().addScaledVector(T, -P[i].rad.dot(T)).normalize(), Bn = T.clone().cross(R);
    for (const [u, v] of prof) { const q = P[i].p.clone().addScaledVector(R, u).addScaledVector(Bn, v); pos.push(q.x, q.y, q.z); }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < S; k++) { const a = i * S + k, b = i * S + (k + 1) % S, c2 = a + S, d = b + S; idx.push(a, c2, b, b, c2, d); }
  // end caps
  const cap = (i0, flip) => { const base = pos.length / 3; const p0 = P[i0].p; pos.push(p0.x, p0.y, p0.z); for (let k = 0; k < S; k++) flip ? idx.push(base, i0 * S + (k + 1) % S, i0 * S + k) : idx.push(base, i0 * S + k, i0 * S + (k + 1) % S); };
  cap(0, true); cap(n, false);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function instRing(geo, mat, n, step, parent, part, a0 = 0) {
  const im = new THREE.InstancedMesh(geo, mat, n); const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { o.rotation.set(0, 0, a0 + i * step); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = im.receiveShadow = true; im.userData.part = part; parent.add(im); return im;
}
// ---------- stator lamination stack ----------
const STATOR = new THREE.Group(); MOTOR.add(STATOR); GRP.stator = STATOR;
const LAYR = [8.05, 8.5, 8.95, 9.4], SLOTD = 9.72, WS = .205, WO = .13;
{
  const sh = new THREE.Shape(); const NO = 360;
  for (let i = 0; i <= NO; i++) { const a = i / NO * TAU; let r = RSO; const k = (a / (TAU / 12)) % 1; if (Math.abs(k - .5) < .012) r -= .12; // 12 weld seams along the stack
    i ? sh.lineTo(r * Math.cos(a), r * Math.sin(a)) : sh.moveTo(r * Math.cos(a), r * Math.sin(a)); }
  const hole = new THREE.Path(); let first = true;
  for (let s = 0; s < NS; s++) {
    const a = s * PITCH;
    // tooth tip arc from previous slot opening to this one
    for (let j = 1; j < 6; j++) { const aa = a - PITCH + (j / 6) * PITCH; const [x, y] = tp(RSI, aa, 0); first ? (hole.moveTo(x, y), first = false) : hole.lineTo(x, y); }
    const pts = [[RSI, -WO], [RSI + .09, -WO], [RSI + .16, -WS], [SLOTD - .06, -WS], [SLOTD, -WS + .06], [SLOTD, WS - .06], [SLOTD - .06, WS], [RSI + .16, WS], [RSI + .09, WO], [RSI, WO]];
    for (const [r, y] of pts) { const [x, yy] = tp(r, a, y); hole.lineTo(x, yy); }
  }
  sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -L / 2);
  mesh(g, [lamCap, lamSide], { parent: STATOR, part: 'stator core' });
  // slot liners peeking out both ends
  const lg = new THREE.ExtrudeGeometry((() => { const p = new THREE.Shape(); const q = [[RSI + .17, -WS + .02], [SLOTD - .03, -WS + .02], [SLOTD - .03, WS - .02], [RSI + .17, WS - .02], [RSI + .17, WS - .06], [SLOTD - .07, WS - .06], [SLOTD - .07, -WS + .06], [RSI + .17, -WS + .06]]; p.moveTo(...tp(q[0][0], 0, q[0][1])); for (const [r, y] of q.slice(1)) p.lineTo(...tp(r, 0, y)); return p; })(), { depth: L + .5, bevelEnabled: false }); lg.translate(0, 0, -L / 2 - .25);
  instRing(lg, liner, NS, PITCH, STATOR, 'slot liners');
}
// ---------- hairpin winding: crown end (+z) and twisted/welded end (−z) ----------
const SPAN = 9; // full pitch (54 slots / 6 poles)
const WINDING = new THREE.Group(); STATOR.add(WINDING); GRP.winding = WINDING;
{
  const wR = .4, wT = .33, z0 = L / 2;
  for (const [la, lb] of [[0, 1], [2, 3]]) {
    const rA = LAYR[la], rB = LAYR[lb], h = 3.05 + (la ? .55 : 0); // outer pair crowns stand taller (nested)
    const ctrl = [[0, rA, z0 - .4], [0, rA, z0 + .5], [.004 * PITCH, rA, z0 + .9], [SPAN * PITCH * .5, (rA + rB) / 2, z0 + h], [SPAN * PITCH - .004 * PITCH, rB, z0 + .9], [SPAN * PITCH, rB, z0 + .5], [SPAN * PITCH, rB, z0 - .4]];
    const g = sweepCyl(ctrl, wR, wT, 48);
    instRing(g, copper, NS, PITCH, WINDING, 'hairpin crowns');
    // stripped leg at in-slot portion is hidden; weld end: two legs bend opposite ways and meet at half span
    for (const [lay, dir] of [[la, 1], [lb, -1]]) {
      const r = LAYR[lay], zz = -z0, half = SPAN / 2 * PITCH * dir;
      const c = [[0, r, zz + .4], [0, r, zz - .6], [half * .15, r, zz - 1.0], [half * .85, r, zz - 2.3], [half, r, zz - 2.75], [half, r, zz - 3.4]];
      instRing(sweepCyl(c, wR, wT, 36), copper, NS, PITCH, WINDING, 'hairpin weld legs', dir < 0 ? SPAN * PITCH : 0);
    }
  }
  // laser-weld beads: one per radial pair of tips (2 per slot position)
  const bead = new THREE.IcosahedronGeometry(1, 2); const im = new THREE.InstancedMesh(bead, weldMat, NS * 2); const o = new THREE.Object3D(); let k = 0;
  for (let s = 0; s < NS; s++) for (const la of [0, 2]) { const a = (s + SPAN / 2) * PITCH, r = (LAYR[la] + LAYR[la + 1]) / 2; o.position.set(r * Math.cos(a), r * Math.sin(a), -z0 - 3.42); o.rotation.set(0, 0, a); o.scale.set(.47, .2, .17); o.updateMatrix(); im.setMatrixAt(k++, o.matrix); }
  im.castShadow = true; im.userData.part = 'laser welds'; WINDING.add(im);
  // phase leads + neutral ring on the weld end (outer radius), and terminal tabs up to the inverter
  const lead = (a0, a1, r, z, w = .3, t = .9) => { const c = []; for (let i = 0; i <= 8; i++) c.push([lerp(a0, a1, i / 8), r, z]); return sweepCyl(c, t, w, 40); };
  const PH = [Math.PI / 2 - .32, Math.PI / 2, Math.PI / 2 + .32];
  for (let p = 0; p < 3; p++) {
    mesh(lead(PH[p] - 1.4 - p * .5, PH[p], 10.15 + p * .02, -z0 - 1.7 - p * .62, .28, .5), copperBare, { parent: WINDING, part: 'phase lead ' + 'UVW'[p] });
    const up = sweepCyl([[PH[p], 10.15, -z0 - 1.7 - p * .62], [PH[p], 10.6, -z0 - 1.9 - p * .62], [PH[p], 11.9, -z0 - 2.1 - p * .3], [PH[p], 13.2, -z0 - 2.2]], .62, .24, 24);
    mesh(up, copperBare, { parent: WINDING, part: 'phase terminal ' + 'UVW'[p] });
  }
  mesh(lead(Math.PI * 1.1, Math.PI * 1.9, 10.2, -z0 - 2.0, .26, .44), copperBare, { parent: WINDING, part: 'neutral ring' });
}
// ---------- rotor: V-pocket IPM lamination, 4 skewed segments, NdFeB magnets ----------
const ROTOR = new THREE.Group(); MOTOR.add(ROTOR); GRP.rotor = ROTOR;
const ARM = [[5.12, .3], [6.36, 2.12]];  // pole-local (radial, tangential) ends of one V arm
{
  const sh = new THREE.Shape(); sh.absarc(0, 0, RRO, 0, TAU, false);
  const kh = new THREE.Path(); { const N = 72; for (let i = 0; i <= N; i++) { const a = i / N * TAU; const r = (Math.abs(((a + TAU / 4) % TAU) - Math.PI) < .09) ? RRI + .25 : RRI; i ? kh.lineTo(r * Math.cos(a), r * Math.sin(a)) : kh.moveTo(r * Math.cos(a), r * Math.sin(a)); } } sh.holes.push(kh);
  const armPoly = (p, side) => { const [a, b] = ARM; const d = V3(b[0] - a[0], side * (b[1] - a[1]), 0).normalize(), nrm = V3(-d.y, d.x, 0), A = V3(a[0], side * a[1], 0).addScaledVector(d, -.22), Bp = V3(b[0], side * b[1], 0).addScaledVector(d, .3);
    const q = [A.clone().addScaledVector(nrm, -.33), Bp.clone().addScaledVector(nrm, -.33), Bp.clone().addScaledVector(nrm, .45), A.clone().addScaledVector(nrm, .33)];
    const ph = p * TAU / POLES; const c = Math.cos(ph), s = Math.sin(ph); const P = new THREE.Path(); q.forEach((v, i) => { const x = v.x * c - v.y * s, y = v.x * s + v.y * c; i ? P.lineTo(x, y) : P.moveTo(x, y); }); P.closePath(); return P; };
  for (let p = 0; p < POLES; p++) { sh.holes.push(armPoly(p, 1)); sh.holes.push(armPoly(p, -1)); const a = (p + .5) * TAU / POLES; const hp = new THREE.Path(); hp.absarc(4.75 * Math.cos(a), 4.75 * Math.sin(a), .5, 0, TAU, true); sh.holes.push(hp); }
  const SEG = 4, segL = L / SEG - .03;
  const g = new THREE.ExtrudeGeometry(sh, { depth: segL, bevelEnabled: false, curveSegments: 24 });
  const mg = rbox(2.15, .6, segL - .1, .05);
  const mags = new THREE.InstancedMesh(mg, magnetMat, POLES * 2 * SEG); mags.userData.part = 'NdFeB magnets'; mags.castShadow = true; let k = 0; const o = new THREE.Object3D();
  const SKEW = [-1.5, -.5, .5, 1.5].map(v => v * 2.2 * Math.PI / 180); // illustrative step skew
  for (let si = 0; si < SEG; si++) {
    const z = -L / 2 + si * (L / SEG) + .015;
    const m = mesh(g, [lamCap, lamSide], { parent: ROTOR, z, part: 'rotor lamination' }); m.rotation.z = SKEW[si];
    for (let p = 0; p < POLES; p++) for (const side of [1, -1]) {
      const [a, b] = ARM; const cx = (a[0] + b[0]) / 2, cy = side * (a[1] + b[1]) / 2, ang = Math.atan2(side * (b[1] - a[1]), b[0] - a[0]);
      const ph = p * TAU / POLES + SKEW[si]; o.position.set(cx * Math.cos(ph) - cy * Math.sin(ph), cx * Math.sin(ph) + cy * Math.cos(ph), z + segL / 2); o.rotation.set(0, 0, ph + ang); o.updateMatrix(); mags.setMatrixAt(k++, o.matrix);
    }
  }
  ROTOR.add(mags);
  // end plates (stainless) with balance drillings
  const ep = new THREE.Shape(); ep.absarc(0, 0, RRO - .15, 0, TAU, false); const eh = new THREE.Path(); eh.absarc(0, 0, RRI + .05, 0, TAU, true); ep.holes.push(eh);
  for (let i = 0; i < 5; i++) { const a = i * 1.1 + .3; const h = new THREE.Path(); h.absarc(6.3 * Math.cos(a), 6.3 * Math.sin(a), .16, 0, TAU, true); ep.holes.push(h); }
  const eg = new THREE.ExtrudeGeometry(ep, { depth: .35, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 2, curveSegments: 48 });
  GRP.ends = [mesh(eg, stainless, { parent: ROTOR, z: L / 2 + .02, part: 'rotor end plate' }), mesh(eg, stainless, { parent: ROTOR, z: -L / 2 - .39, part: 'rotor end plate' })];
  // hollow shaft with bearing seats + drive spline (lathe profile in r,z)
  const prof = [[2.2, -12], [3.0, -12], [3.0, -10.2], [3.35, -10.2], [3.35, -8.6], [3.5, -8.6], [3.5, 8.6], [3.35, 8.6], [3.35, 10.6], [3.0, 10.6], [3.0, 15.5], [2.2, 15.5]].map(([r, z]) => new THREE.Vector2(r, z));
  const sg = new THREE.LatheGeometry(prof, 64); sg.rotateX(Math.PI / 2); mesh(sg, steel, { parent: ROTOR, part: 'rotor shaft' });
  const spl = rbox(.16, .22, 3.2, .04); const sp = new THREE.InstancedMesh(spl, steel, 28); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; o.position.set(3.04 * Math.cos(a), 3.04 * Math.sin(a), 13.7); o.rotation.set(0, 0, a); o.updateMatrix(); sp.setMatrixAt(i, o.matrix); } sp.userData.part = 'drive spline'; ROTOR.add(sp);
}
// ---------- bearings (deep-groove ball bearings, both ends) ----------
function bearing(z, parent, rIn = 3.35, rOut = 5.2, w = 1.5) {
  const g = new THREE.Group(); g.position.z = z; parent.add(g);
  const race = (r0, r1) => { const p = [[r0, -w / 2], [r1, -w / 2], [r1, w / 2], [r0, w / 2]].map(([r, zz]) => new THREE.Vector2(r, zz)); const lg = new THREE.LatheGeometry([p[0], p[1], p[2], p[3], p[0]], 64); lg.rotateX(Math.PI / 2); return lg; };
  mesh(race(rIn, rIn + .42), steel, { parent: g, part: 'bearing inner race' }); mesh(race(rOut - .45, rOut), steel, { parent: g, part: 'bearing outer race' });
  const sealG = new THREE.RingGeometry(rIn + .45, rOut - .48, 64); const seal = M('#1d1f23', { roughness: .7 });
  for (const s of [-1, 1]) { const m = mesh(sealG, seal, { parent: g, z: s * (w / 2 - .08), part: 'bearing seal' }); if (s < 0) m.rotation.y = Math.PI; }
  return g;
}
const BRGG = new THREE.Group(); MOTOR.add(BRGG); GRP.brg = BRGG; bearing(-9.4, BRGG); bearing(9.6, BRGG);
// ---------- resolver (variable-reluctance, 3-lobe rotor = 3 pole pairs) at the non-drive end ----------
const RESOLVER = new THREE.Group(); RESOLVER.position.z = -11.4; MOTOR.add(RESOLVER); GRP.resolver = RESOLVER;
{
  const NT = 16, sh = new THREE.Shape(); sh.absarc(0, 0, 5.4, 0, TAU, false); const h = new THREE.Path(); let f = true;
  for (let i = 0; i < NT; i++) { const a = i / NT * TAU, pw = TAU / NT; const pts = [[4.25, -.42 * pw], [4.25, -.2 * pw], [3.72, -.2 * pw], [3.72, .2 * pw], [4.25, .2 * pw], [4.25, .42 * pw]];
    for (const [r, da] of pts) { const x = r * Math.cos(a + da), y = r * Math.sin(a + da); f ? (h.moveTo(x, y), f = false) : h.lineTo(x, y); } }
  sh.holes.push(h);
  mesh(new THREE.ExtrudeGeometry(sh, { depth: .7, bevelEnabled: false }), [lamCap, lamSide], { parent: RESOLVER, z: -.35, part: 'resolver stator' });
  TX.coil = canvasTex(64, 128, (g, w, hh) => { g.fillStyle = '#7a3b1c'; g.fillRect(0, 0, w, hh); for (let y = 0; y < hh; y += 3) { g.fillStyle = '#c07440'; g.fillRect(0, y, w, 1.6); } });
  const coilM = M('#c9814e', { map: TX.coil, metalness: .6, roughness: .4 });
  const cg = rbox(.62, .55, 1.15, .14); cg.translate(4.0, 0, 0); instRing(cg, coilM, NT, TAU / NT, RESOLVER, 'resolver coils');
  const rs = new THREE.Shape(); { const N = 120; for (let i = 0; i <= N; i++) { const a = i / N * TAU, r = 3.42 + .2 * Math.cos(3 * a); i ? rs.lineTo(r * Math.cos(a), r * Math.sin(a)) : rs.moveTo(r * Math.cos(a), r * Math.sin(a)); } }
  const rh = new THREE.Path(); rh.absarc(0, 0, 2.25, 0, TAU, true); rs.holes.push(rh);
  const rr = mesh(new THREE.ExtrudeGeometry(rs, { depth: .6, bevelEnabled: false }), [lamCap, lamSide], { parent: RESOLVER, z: -.3, part: 'resolver rotor' }); GRP.resRotor = rr;
  const plug = rbox(1.6, .8, .9, .12); mesh(plug, M('#2a2c30', { roughness: .6 }), { parent: RESOLVER, x: 0, y: 5.9, z: 0, part: 'resolver connector' });
}
// ---------- housing (cast aluminium, ghosted) ----------
const HOUSING = new THREE.Group(); MOTOR.add(HOUSING); GRP.housing = HOUSING;
{
  const prof = [[3.3, -13.2], [6.2, -13.2], [6.6, -12.4], [11.6, -11.6], [12.0, -10.8], [12.0, 9.8], [11.6, 10.6], [6.6, 11.6], [5.3, 12.2], [5.3, 13.0]].map(([r, z]) => new THREE.Vector2(r, z));
  const g = new THREE.LatheGeometry(prof, 96); g.rotateX(Math.PI / 2); const hm = mesh(g, alCast, { parent: HOUSING, shadow: false, part: 'motor housing' }); hm.renderOrder = 5;
  const rib = rbox(.35, .5, 21, .1); const ri = new THREE.InstancedMesh(rib, alCast, 18); const o = new THREE.Object3D();
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; o.position.set(12.2 * Math.cos(a), 12.2 * Math.sin(a), -.5); o.rotation.set(0, 0, a); o.updateMatrix(); ri.setMatrixAt(i, o.matrix); } ri.renderOrder = 5; ri.userData.part = 'housing ribs'; HOUSING.add(ri);
}
