// ================= DETAIL PASS: procedural surface detail (canvas textures + instanced micro-geometry) =================
// Layout proportions follow public die shots / board photos (illustrative only, not to scale, no vendor data).
const DQ = (() => { let s = 20260502; const f = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; f.get = () => s; f.set = v => { s = v; }; return f; })();
const dr = (a, b) => a + (b - a) * DQ();
const DTX = {}, DPERF = { inst: 0 };
function ctex(key, w, h, draw, rep) { if (DTX[key]) return DTX[key]; const seed = DQ.get(), t = canvasTex(w, h, draw); if (key === 'card') LANGHOOKS.push(() => { const saved = DQ.get(); DQ.set(seed); const g = t.image.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h); DQ.set(saved); t.needsUpdate = true; }); if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return DTX[key] = t; }
function texRep(t, rx, ry, flipY) { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, flipY ? -ry : ry); if (flipY) c.offset.y = 1; c.needsUpdate = true; return c; }
// put a texture on one or more faces of a box mesh (face 2 = +y top, 4 = +z front). Shares color/emissive with the base material so glow logic keeps working.
function skin(m, map, { faces = [2], own = false, rough, metal } = {}) {
  const base = Array.isArray(m.material) ? m.material[0] : m.material;
  const top = base.clone(); top.emissive = base.emissive; top.color = own ? new THREE.Color('#ffffff') : base.color;
  top.map = map; if (rough != null) top.roughness = rough; if (metal != null) top.metalness = metal;
  const arr = Array.isArray(m.material) ? m.material.slice() : [base, base, base, base, base, base];
  faces.forEach(f => arr[f] = top); m.material = arr; return top;
}
function decal(parent, x0, x1, z0, z1, y, map, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial(Object.assign({ map, transparent: true, depthWrite: false, roughness: .6, polygonOffset: true, polygonOffsetFactor: -2 }, o)));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.raycast = () => { }; m.receiveShadow = true; parent.add(m); return m;
}
// instanced pools: collect transforms, build one InstancedMesh per pool
function pool(geo, mat, parent, shadow = true) { return { geo, mat, parent, it: [], shadow }; }
const _po = new THREE.Object3D(), _pc2 = new THREE.Color();
function padd(p, x, y, z, { ry = 0, rx = 0, rz = 0, s = null, col = null } = {}) { p.it.push([x, y, z, rx, ry, rz, s, col]); }
function pbuild(p) {
  if (!p.it.length) return null;
  const im = new THREE.InstancedMesh(p.geo, p.mat, p.it.length);
  p.it.forEach(([x, y, z, rx, ry, rz, s, col], i) => { _po.position.set(x, y, z); _po.rotation.set(rx, ry, rz); if (s) _po.scale.set(s[0], s[1], s[2]); else _po.scale.set(1, 1, 1); _po.updateMatrix(); im.setMatrixAt(i, _po.matrix); if (col != null || p.tint) im.setColorAt(i, _pc2.set(col || '#ffffff').offsetHSL(0, 0, p.tint ? dr(-p.tint, p.tint) : 0)); });
  im.castShadow = p.shadow; im.receiveShadow = true; im.raycast = () => { }; p.parent.add(im); DPERF.inst += p.it.length; p.mesh = im; return im;
}
// ---------- canvas painting helpers ----------
const SILK = '#d8ddd6';
function speck(g, W, H, n, cols, s = 1.5) { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(DQ() * W, DQ() * H, s, s); } }
function bevel(g, W, H, k = 3, hi = 'rgba(255,255,255,.22)', lo = 'rgba(0,0,0,.35)') { g.fillStyle = hi; g.fillRect(0, 0, W, k); g.fillRect(0, 0, k, H); g.fillStyle = lo; g.fillRect(0, H - k, W, k); g.fillRect(W - k, 0, k, H); }
function sram(g, x, y, w, h, { cell = '#8f939c', line = 'rgba(0,0,0,.28)', dec = '#c4c7cd', pitch = 2, vert = false } = {}) {
  g.fillStyle = cell; g.fillRect(x, y, w, h); g.fillStyle = line;
  if (!vert) for (let yy = y + 1; yy < y + h; yy += pitch) g.fillRect(x, yy, w, 1); else for (let xx = x + 1; xx < x + w; xx += pitch) g.fillRect(xx, y, 1, h);
  g.fillStyle = dec; if (!vert) { g.fillRect(x + w / 2 - Math.max(1, w * .03), y, Math.max(2, w * .06), h); } else g.fillRect(x, y + h / 2 - Math.max(1, h * .03), w, Math.max(2, h * .06));
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
}
function cells(g, x, y, w, h, base, n, v = 18) { g.fillStyle = base; g.fillRect(x, y, w, h); const rowH = Math.max(2, h / Math.max(4, Math.round(h / 4))); for (let yy = y; yy < y + h; yy += rowH) { let xx = x; while (xx < x + w) { const cw = dr(2, 7); const l = dr(-v, v); g.fillStyle = `rgba(${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${Math.abs(l) / 100})`; g.fillRect(xx, yy, Math.min(cw, x + w - xx) - .5, rowH - .6); xx += cw; } } }
function txt2(g, s, x, y, size, col = SILK, al = 'left', w = 600, font = 'Public Sans, Noto Sans SC, sans-serif') { g.fillStyle = col; g.font = `${w} ${size}px ${font}`; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function via(g, x, y, r = 2.2) { g.fillStyle = '#4e5d52'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#0c100e'; g.beginPath(); g.arc(x, y, r * .45, 0, 7); g.fill(); }
function hole(g, x, y, r) { g.fillStyle = '#a7854f'; g.beginPath(); g.arc(x, y, r * 1.6, 0, 7); g.fill(); g.fillStyle = '#c79f63'; g.beginPath(); g.arc(x, y, r * 1.25, 0, 7); g.fill(); g.fillStyle = '#060707'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function fid(g, x, y, r) { g.fillStyle = '#0f1412'; g.beginPath(); g.arc(x, y, r * 2.2, 0, 7); g.fill(); g.fillStyle = '#c9a466'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function traces(g, n, W, H, { col = '#26332c', w = 2, seg = [3, 6], len = [20, 160], bundle = [2, 7], gap = 5, box = null } = {}) {
  g.strokeStyle = col; g.lineCap = 'square'; g.lineJoin = 'miter';
  for (let i = 0; i < n; i++) {
    const b = Math.round(dr(bundle[0], bundle[1])); let x = box ? dr(box[0], box[1]) : DQ() * W, y = box ? dr(box[2], box[3]) : DQ() * H; const pts = [[x, y]]; let dir = DQ() < .5 ? 0 : 2;
    const ns = Math.round(dr(seg[0], seg[1])); for (let s = 0; s < ns; s++) { const L = dr(len[0], len[1]); const d = [[1, 0], [.7071, .7071], [0, 1], [.7071, -.7071]][dir % 4]; const sg = DQ() < .5 ? 1 : -1; x += d[0] * L * sg; y += d[1] * L * sg; pts.push([x, y]); dir = (dir + (DQ() < .5 ? 1 : 3)) % 4; if (DQ() < .5) dir = (dir + 1) % 4; }
    g.lineWidth = w; for (let k = 0; k < b; k++) { g.beginPath(); pts.forEach(([px, py], j) => (j ? g.lineTo : g.moveTo).call(g, px + k * gap, py + k * gap)); g.stroke(); }
    if (DQ() < .5) via(g, pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
}
// ---------- textures ----------
// main board: world x -16..13, z -7..7
const PCBW = 2048, PCBH = 990, bx = x => (x + 16) / 29 * PCBW, bz = z => (z + 7) / 14 * PCBH;
const T = {};
T.pcb = ctex('pcb', PCBW, PCBH, (g, W, H) => {
  g.fillStyle = '#18211d'; g.fillRect(0, 0, W, H); speck(g, W, H, 9000, ['#1d2722', '#151c19'], 2);
  // ground pour hatch zones
  g.fillStyle = '#1b2520'; [[-15.6, -14.6, -6.6, 6.6], [9.9, 12.6, -6.6, 6.6], [-6, 0, -6.6, -3.2]].forEach(([a, b, c, d]) => g.fillRect(bx(a), bz(c), bx(b) - bx(a), bz(d) - bz(c)));
  traces(g, 260, W, H, { col: '#23302a', w: 2 }); traces(g, 120, W, H, { col: '#283a31', w: 3, bundle: [4, 10], gap: 6, len: [40, 240] });
  // DDR fan-out bundles CPU <-> DIMMs, PCIe to slot
  g.strokeStyle = '#2a3c33'; g.lineWidth = 2.5; for (let k = 0; k < 40; k++) { const z = -3.1 + k * .155, y0 = bz(z); g.beginPath(); g.moveTo(bx(-11.6), y0); g.lineTo(bx(-11.0), y0); g.lineTo(bx(-10.7), bz(z * .78)); g.lineTo(bx(-10.2), bz(z * .78)); g.stroke(); }
  for (let k = 0; k < 16; k++) { const x0 = bx(-6.3 + k * .07); g.beginPath(); g.moveTo(x0, bz(2.9)); g.lineTo(x0, bz(3.4 + k * .03)); g.lineTo(bx(-4.4 + k * .2), bz(4.9)); g.lineTo(bx(-4.4 + k * .2), bz(5.4)); g.stroke(); }
  // via fields around packages
  for (let i = 0; i < 26; i++) for (let j = 0; j < 4; j++) { via(g, bx(-10.9 + i * .2), bz(-3.15 - j * .14), 1.8); via(g, bx(-0.2 + i * .37), bz(3.72 + j * .0) , 1.8); }
  for (let i = 0; i < 700; i++) via(g, DQ() * W, DQ() * H, dr(1.4, 2.4));
  // silkscreen: outlines, refdes, notes
  g.strokeStyle = SILK; g.lineWidth = 2.5;
  const corner = (x0, z0, x1, z1, L = 14) => { [[x0, z0, 1, 1], [x1, z0, -1, 1], [x0, z1, 1, -1], [x1, z1, -1, -1]].forEach(([x, z, sx, sz]) => { g.beginPath(); g.moveTo(bx(x) + sx * L, bz(z)); g.lineTo(bx(x), bz(z)); g.lineTo(bx(x), bz(z) + sz * L); g.stroke(); }); };
  corner(-11.05, -3.1, -4.95, 3.1, 22); corner(-.3, -3.85, 10.3, 3.85, 22);
  g.strokeRect(bx(-13.65), bz(-3.5), bx(-11.55) - bx(-13.65), bz(3.5) - bz(-3.5));
  txt2(g, 'CPU0  LGA', bx(-11.0), bz(3.35), 17); txt2(g, 'U1', bx(-5.3), bz(-3.3), 15); txt2(g, 'GPU0', bx(-.25), bz(-4.05), 18); txt2(g, 'U2', bx(9.5), bz(-4.05), 15);
  ['A1', 'A2', 'A3', 'A4'].forEach((s, i) => txt2(g, 'DIMM_' + s, bx(-13.4 + i * .55), bz(3.85), 12, SILK, 'center'));
  txt2(g, 'PCIE1  X16  GEN5', bx(-4.6), bz(6.15), 17); txt2(g, 'VRM_GPU  12φ', bx(9.1), bz(4.4), 15); txt2(g, 'VRM_CPU', bx(-10.4), bz(-4.75), 15);
  for (let i = 0; i < 12; i++) txt2(g, 'L' + (101 + i), bx(1.52 + i * .633), bz(5.12), 11, SILK, 'center');
  for (let i = 0; i < 90; i++) { const x = DQ() * W, y = DQ() * H; txt2(g, ['C', 'R', 'C', 'R', 'Q', 'U', 'FB', 'TP'][i % 8] + Math.floor(dr(10, 999)), x, y, 10, 'rgba(216,221,214,.55)'); }
  txt2(g, 'AI-NODE MAINBOARD · ILLUSTRATIVE MODEL · REV 1.0', bx(12.6), bz(6.55), 15, 'rgba(216,221,214,.75)', 'right');
  txt2(g, '▲ HOT SURFACE', bx(9.1), bz(-4.75), 12, 'rgba(216,221,214,.6)');
  [[-15.35, -6.35], [12.35, -6.35], [-15.35, 6.35], [12.35, 6.35], [-1.5, -6.4], [-1.5, 6.4]].forEach(([x, z]) => hole(g, bx(x), bz(z), 9));
  [[-15.6, 0], [12.7, -2.8], [-6, 6.7], [9.5, 6.75]].forEach(([x, z]) => fid(g, bx(x), bz(z), 4));
});
T.pcbGen = ctex('pcbGen', 1024, 1024, (g, W, H) => {
  g.fillStyle = '#18211d'; g.fillRect(0, 0, W, H); speck(g, W, H, 5000, ['#1d2722', '#151c19'], 2);
  traces(g, 150, W, H, { col: '#23302a', w: 2 }); traces(g, 50, W, H, { col: '#283a31', w: 3, bundle: [4, 9], gap: 6, len: [40, 220] });
  for (let i = 0; i < 400; i++) via(g, DQ() * W, DQ() * H, dr(1.4, 2.4));
  for (let i = 0; i < 40; i++) txt2(g, ['C', 'R', 'U', 'L'][i % 4] + Math.floor(dr(100, 999)), DQ() * W, DQ() * H, 11, 'rgba(216,221,214,.5)');
  hole(g, 60, 60, 9);
});
// organic package substrate (green-brown), with cap land pads
const subTex = (key, W, H, mark) => ctex(key, W, H, (g) => {
  g.fillStyle = '#2b3129'; g.fillRect(0, 0, W, H); speck(g, W, H, 3000, ['#30372e', '#262b24'], 2);
  traces(g, 70, W, H, { col: '#323a30', w: 1.5, len: [10, 60], bundle: [3, 8], gap: 3 });
  g.strokeStyle = 'rgba(200,170,100,.35)'; g.lineWidth = 2; g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = '#c9a15c'; g.beginPath(); g.moveTo(10, 10); g.lineTo(34, 10); g.lineTo(10, 34); g.fill(); // pin-1
  fid(g, W - 22, H - 22, 4); fid(g, 22, H - 22, 4);
  txt2(g, mark, W - 18, 22, 13, 'rgba(230,226,210,.7)', 'right', 600, 'JetBrains Mono, monospace');
});
T.gsub = subTex('gsub', 736, 576, 'PKG-A · 2.5D');
T.csub = subTex('csub', 512, 512, 'PKG-H · LGA');
T.inter = ctex('inter', 640, 520, (g, W, H) => {
  g.fillStyle = '#596170'; g.fillRect(0, 0, W, H); speck(g, W, H, 4000, ['#606878', '#525a68'], 1.5);
  // reticle stitch lines + fine RDL routing from die edge to HBM sites
  g.fillStyle = 'rgba(30,34,40,.35)'; g.fillRect(W / 2 - 1, 0, 2, H); g.fillRect(0, H / 2 - 1, W, 2);
  g.strokeStyle = 'rgba(205,170,110,.35)'; g.lineWidth = 1; for (let i = 0; i < 140; i++) { const x = 40 + i * 4; g.beginPath(); g.moveTo(x, H * .32); g.lineTo(x, H * .22); g.moveTo(x, H * .68); g.lineTo(x, H * .78); g.stroke(); }
  for (let y = 18; y < H - 18; y += 6) for (let x = 18; x < W - 18; x += 6) if (Math.abs(y - H / 2) > H * .33 || Math.abs(x - W / 2) > W * .40) { g.fillStyle = 'rgba(210,214,220,.5)'; g.fillRect(x, y, 2, 2); }
  g.strokeStyle = 'rgba(20,22,26,.7)'; g.lineWidth = 3; g.strokeRect(3, 3, W - 6, H - 6);
});
T.gdie = ctex('gdie', 1024, 588, (g, W, H) => {
  g.fillStyle = '#2f3239'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#2f3239', 0, 10);
  g.fillStyle = 'rgba(120,128,145,.10)'; for (let x = 0; x < W; x += 14) g.fillRect(x, 0, 1.5, H); for (let y = 0; y < H; y += 14) g.fillRect(0, y, W, 1.5);
  g.strokeStyle = '#5a5e69'; g.lineWidth = 3; g.strokeRect(5, 5, W - 10, H - 10); g.lineWidth = 1.5; g.strokeRect(12, 12, W - 24, H - 24); // seal ring
  g.fillStyle = '#3a3e48'; g.fillRect(W * .47, 0, W * .06, H); // crossbar / hub spine
  for (let i = 0; i < 18; i++) sram(g, W * .475, 30 + i * 30, W * .05, 22, { cell: '#4a4f5c', dec: '#62677a' });
});
T.gpc = ctex('gpc', 256, 244, (g, W, H) => {
  g.fillStyle = '#2c2f36'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#2c2f36', 0, 12);
  for (let r = 0; r < 3; r++) { const y = (r * .3 + .27) / .98 * H; g.fillStyle = '#363a44'; g.fillRect(0, y, W, 6); }
  g.fillStyle = '#3c404b'; g.fillRect(4, H * .9, W - 8, H * .08); for (let i = 0; i < 10; i++) sram(g, 8 + i * 24, H * .905, 18, H * .07, { cell: '#4c5160', dec: '#646a7c' });
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeRect(1, 1, W - 2, H - 2);
});
// SM tile (multiplied by per-instance colour): 4 sub-partitions + L1/smem band + tex units
T.sm = ctex('sm', 128, 168, (g, W, H) => {
  g.fillStyle = '#d6d6d6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#efefef'; g.fillRect(4, 4, W - 8, 16); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#c8c8c8' : '#dedede'; g.fillRect(6 + i * 9.6, 6, 8, 12); } // L1 I$ / L0
  for (let p = 0; p < 4; p++) {
    const x0 = 4 + (p % 2) * 61, y0 = 24 + Math.floor(p / 2) * 56, w = 58, h = 53;
    g.fillStyle = '#c2c2c2'; g.fillRect(x0, y0, w, h);
    g.fillStyle = '#e8e8e8'; g.fillRect(x0 + 2, y0 + 2, w - 4, 7); // scheduler + dispatch
    for (let b = 0; b < 4; b++) { g.fillStyle = '#9d9d9d'; g.fillRect(x0 + 2 + b * 14, y0 + 11, 12, 11); g.fillStyle = 'rgba(0,0,0,.2)'; for (let yy = y0 + 12; yy < y0 + 22; yy += 2) g.fillRect(x0 + 2 + b * 14, yy, 12, 1); } // RF banks
    for (let l = 0; l < 16; l++) { g.fillStyle = '#e2e2e2'; g.fillRect(x0 + 2 + (l % 8) * 4.2, y0 + 25 + Math.floor(l / 8) * 6, 3.4, 5); } // lanes
    g.fillStyle = '#ffffff'; g.fillRect(x0 + 37, y0 + 25, 19, 19); g.fillStyle = 'rgba(0,0,0,.16)'; for (let k = 0; k < 4; k++) { g.fillRect(x0 + 37 + k * 4.75, y0 + 25, 1, 19); g.fillRect(x0 + 37, y0 + 25 + k * 4.75, 19, 1); } // tensor core
    g.fillStyle = '#b4b4b4'; g.fillRect(x0 + 2, y0 + 38, 32, 6); g.fillStyle = '#cfcfcf'; g.fillRect(x0 + 2, y0 + 46, 22, 5); g.fillStyle = '#a9a9a9'; g.fillRect(x0 + 26, y0 + 46, 30, 5); // LD/ST, SFU
  }
  sram(g, 4, 138, 92, 26, { cell: '#b9b9b9', dec: '#e6e6e6', line: 'rgba(0,0,0,.18)', vert: true, pitch: 3 }); // L1 / shared memory
  for (let i = 0; i < 4; i++) { g.fillStyle = '#e9e9e9'; g.fillRect(99 + (i % 2) * 13, 138 + Math.floor(i / 2) * 13, 11, 11); } // tex units
  bevel(g, W, H, 3, 'rgba(255,255,255,.5)', 'rgba(0,0,0,.35)');
});
T.l2 = ctex('l2', 1024, 162, (g, W, H) => { g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, W, H); for (let i = 0; i < 24; i++) for (let j = 0; j < 2; j++) sram(g, 6 + i * 42.4, 8 + j * 76, 38, 70, { cell: '#cfcfcf', dec: '#f2f2f2', line: 'rgba(0,0,0,.22)' }); bevel(g, W, H, 3); });
T.phyU = ctex('phyU', 256, 32, (g, W, H) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#a8a8a8' : '#e6e6e6'; g.fillRect(i * 16 + 1, 2, 14, H - 4); g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 4; y < H - 4; y += 4) g.fillRect(i * 16 + 3, y, 10, 1); } });
T.phyV = ctex('phyV', 32, 256, (g, W, H) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#a8a8a8' : '#e6e6e6'; g.fillRect(2, i * 16 + 1, W - 4, 14); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 4; x < W - 4; x += 4) g.fillRect(x, i * 16 + 3, 1, 10); } });
// HBM DRAM die: bank arrays + central TSV / periphery stripe
T.hbm = ctex('hbm', 384, 240, (g, W, H) => {
  g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, W, H);
  for (let q = 0; q < 2; q++) for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) sram(g, 8 + i * 46.5, 10 + q * 122 + j * 50, 42, 46, { cell: '#bdbdbd', dec: '#dedede', line: 'rgba(0,0,0,.14)' });
  g.fillStyle = '#e8e8e8'; g.fillRect(0, H / 2 - 9, W, 18); g.fillStyle = '#8c8c8c'; for (let x = 8; x < W - 8; x += 7) { g.fillRect(x, H / 2 - 6, 3, 3); g.fillRect(x, H / 2 + 3, 3, 3); } // TSV rows
  bevel(g, W, H, 3, 'rgba(255,255,255,.4)', 'rgba(0,0,0,.3)');
});
T.hbmBase = ctex('hbmBase', 384, 256, (g, W, H) => { g.fillStyle = '#cdcdcd'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#cdcdcd', 0, 14); g.fillStyle = '#9a9a9a'; for (let x = 8; x < W - 8; x += 7) g.fillRect(x, H / 2 - 2, 3, 4); for (let i = 0; i < 8; i++) { g.fillStyle = '#e5e5e5'; g.fillRect(10 + i * 46, H - 34, 40, 26); } bevel(g, W, H); });
T.cap = ctex('cap', 64, 32, (g, W, H) => { g.fillStyle = '#9a8460'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8c9cc'; g.fillRect(0, 0, 14, H); g.fillRect(W - 14, 0, 14, H); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, W, 3); });
T.nvl = ctex('nvl', 64, 512, (g, W, H) => { g.fillStyle = '#17181b'; g.fillRect(0, 0, W, H); for (let y = 6; y < H - 6; y += 8) { g.fillStyle = '#c9a15c'; g.fillRect(10, y, 18, 4); g.fillRect(36, y + 4, 18, 4); } g.strokeStyle = '#3a3c42'; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4); });
T.ind = ctex('ind', 96, 96, (g, W, H) => { g.fillStyle = '#4b4e55'; g.fillRect(0, 0, W, H); speck(g, W, H, 400, ['#55585f', '#41444a'], 2); bevel(g, W, H, 5, 'rgba(255,255,255,.18)', 'rgba(0,0,0,.4)'); txt2(g, 'R15', W / 2, H / 2 - 8, 22, '#d9d9d9', 'center', 700); txt2(g, '• 2K', W / 2, H / 2 + 16, 14, '#b9b9b9', 'center', 500); });
T.qfn = ctex('qfn', 64, 64, (g, W, H) => { g.fillStyle = '#16171a'; g.fillRect(0, 0, W, H); g.fillStyle = '#b9bcc1'; for (let i = 0; i < 6; i++) { g.fillRect(4 + i * 10, 0, 5, 4); g.fillRect(4 + i * 10, H - 4, 5, 4); } g.fillStyle = '#c8c8c8'; g.beginPath(); g.arc(12, 14, 3, 0, 7); g.fill(); txt2(g, 'PS60', W / 2, H / 2 + 6, 13, '#9a9a9a', 'center', 600, 'JetBrains Mono, monospace'); });
T.pcap = ctex('pcap', 64, 64, (g, W, H) => { g.fillStyle = '#2a2a33'; g.fillRect(0, 0, W, H); g.fillStyle = '#8c8f96'; g.beginPath(); g.arc(W / 2, H / 2, W * .42, 0, 7); g.fill(); g.strokeStyle = '#5f6168'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * .3, H / 2); g.lineTo(W * .7, H / 2); g.moveTo(W / 2, H * .3); g.lineTo(W / 2, H * .7); g.stroke(); });
T.dram = ctex('dram', 64, 96, (g, W, H) => { g.fillStyle = '#1b1c20'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8c8c8'; g.beginPath(); g.arc(10, 10, 3, 0, 7); g.fill(); txt2(g, 'D5', W / 2, H / 2 - 10, 16, '#a8a8ad', 'center', 700); txt2(g, '16Gb', W / 2, H / 2 + 10, 11, '#8a8a90', 'center', 500, 'JetBrains Mono, monospace'); bevel(g, W, H, 2, 'rgba(255,255,255,.12)', 'rgba(0,0,0,.4)'); });
T.dimmPcb = ctex('dimmPcb', 512, 128, (g, W, H) => { g.fillStyle = '#173226'; g.fillRect(0, 0, W, H); traces(g, 60, W, H, { col: '#1f4031', w: 1.5, len: [8, 40], bundle: [2, 6], gap: 3 }); for (let i = 0; i < 150; i++) via(g, DQ() * W, DQ() * H, 1.3); g.fillStyle = '#c9a15c'; for (let x = 4; x < W - 4; x += 4.2) g.fillRect(x, H - 10, 2.6, 10); g.fillStyle = '#e6e6e6'; g.fillRect(W * .62, 8, 70, 18); txt2(g, '64GB 2Rx4', W * .62 + 35, 17, 11, '#222', 'center', 700); });
T.slot = ctex('slot', 32, 512, (g, W, H) => { g.fillStyle = '#121315'; g.fillRect(0, 0, W, H); g.fillStyle = '#050506'; g.fillRect(W / 2 - 4, 8, 8, H - 16); g.fillStyle = '#b99556'; for (let y = 10; y < H - 10; y += 4) g.fillRect(W / 2 - 3, y, 2, 2), g.fillRect(W / 2 + 1, y + 2, 2, 2); g.fillStyle = '#121315'; g.fillRect(W / 2 - 4, H * .45, 8, 6); });
T.pcieSlot = ctex('pcieSlot', 768, 72, (g, W, H) => { g.fillStyle = '#131416'; g.fillRect(0, 0, W, H); g.fillStyle = '#060607'; g.fillRect(8, H / 2 - 9, W - 16, 18); g.fillStyle = '#b99556'; for (let x = 10; x < W - 10; x += 4.2) { g.fillRect(x, H / 2 - 7, 2, 4); g.fillRect(x + 2, H / 2 + 3, 2, 4); } g.fillStyle = '#131416'; g.fillRect(8 + (W - 16) * .13, H / 2 - 10, 8, 20); bevel(g, W, H, 2, 'rgba(255,255,255,.12)', 'rgba(0,0,0,.4)'); });
T.card = ctex('card', 640, 192, (g, W, H) => { g.fillStyle = '#16302a'; g.fillRect(0, 0, W, H); traces(g, 70, W, H, { col: '#1e3f36', w: 2, len: [10, 60], bundle: [2, 6], gap: 4 }); for (let i = 0; i < 160; i++) via(g, DQ() * W, DQ() * H, 1.6); txt2(g, tr(B('NIC0  2×200G  (illustrative)', 'NIC0  2×200G  (示意)')), 16, 22, 16); for (let i = 0; i < 30; i++) txt2(g, ['C', 'R', 'U'][i % 3] + Math.floor(dr(10, 99)), DQ() * W, 30 + DQ() * (H - 50), 10, 'rgba(216,221,214,.6)'); g.fillStyle = '#c9a15c'; for (let x = 6; x < W - 6; x += 6) g.fillRect(x, H - 18, 4, 18); g.fillStyle = '#16302a'; g.fillRect(W * .1, H - 18, 8, 18); });
T.ihs = ctex('ihs', 512, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#c4c8ce'); gr.addColorStop(1, '#9fa4ab'); g.fillStyle = gr; g.fillRect(0, 0, W, H); speck(g, W, H, 3000, ['rgba(255,255,255,.12)', 'rgba(0,0,0,.08)'], 1.5); txt2(g, 'HOST CPU', 40, 70, 34, '#6c7078', 'left', 700); txt2(g, 'ILLUSTRATIVE · NOT A REAL SKU', 40, 112, 18, '#767a82', 'left', 500, 'JetBrains Mono, monospace'); txt2(g, 'IHS — removed to show the die', 40, 140, 18, '#767a82', 'left', 500, 'JetBrains Mono, monospace'); for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (DQ() < .5) { g.fillStyle = '#6a6e76'; g.fillRect(380 + i * 8, 380 + j * 8, 8, 8); } g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); });
// CPU die / core floorplan (multiplied by core colour). L2 region at the bottom of the tile.
T.cdie = ctex('cdie', 640, 520, (g, W, H) => { g.fillStyle = '#353841'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#353841', 0, 12); g.strokeStyle = '#5c606b'; g.lineWidth = 3; g.strokeRect(4, 4, W - 8, H - 8); g.fillStyle = '#8f8a70'; for (let x = 14; x < W - 14; x += 9) { g.fillRect(x, 9, 5, 4); g.fillRect(x, H - 13, 5, 4); } for (let y = 14; y < H - 14; y += 9) { g.fillRect(9, y, 4, 5); g.fillRect(W - 13, y, 4, 5); } });
T.core = ctex('core', 192, 264, (g, W, H) => {
  g.fillStyle = '#d2d2d2'; g.fillRect(0, 0, W, H);
  sram(g, 6, 6, 54, 40, { cell: '#b0b0b0', dec: '#e8e8e8', line: 'rgba(0,0,0,.2)' }); // L1I
  g.fillStyle = '#e4e4e4'; g.fillRect(64, 6, 122, 40); for (let i = 0; i < 5; i++) sram(g, 68 + i * 23.5, 10, 20, 16, { cell: '#c2c2c2', dec: '#efefef', line: 'rgba(0,0,0,.16)' }); // BPU tables
  g.fillStyle = '#c6c6c6'; g.fillRect(6, 50, 180, 26); for (let i = 0; i < 4; i++) { g.fillStyle = '#ececec'; g.fillRect(10 + i * 44, 54, 38, 18); } // decoders / uop cache
  g.fillStyle = '#bcbcbc'; g.fillRect(6, 80, 88, 40); for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#cdcdcd' : '#a9a9a9'; g.fillRect(8 + i * 8.4, 84, 7, 32); } // rename / ROB
  g.fillStyle = '#e0e0e0'; g.fillRect(98, 80, 88, 40); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { g.fillStyle = '#c5c5c5'; g.fillRect(102 + i * 14, 84 + j * 12, 11, 9); } // schedulers
  g.fillStyle = '#f2f2f2'; g.fillRect(6, 124, 180, 44); for (let i = 0; i < 16; i++) { g.fillStyle = i % 4 === 3 ? '#c9c9c9' : '#e2e2e2'; g.fillRect(10 + i * 10.9, 128, 9, 36); } // AVX / FPU lanes
  g.fillStyle = '#c0c0c0'; g.fillRect(6, 172, 70, 20); g.fillStyle = '#d8d8d8'; g.fillRect(80, 172, 106, 20); // LSU, int ALUs
  sram(g, 6, 194, 180, 70, { cell: '#a6a6a6', dec: '#dadada', line: 'rgba(0,0,0,.18)' }); // (under L2 strip)
  bevel(g, W, H, 3, 'rgba(255,255,255,.45)', 'rgba(0,0,0,.35)');
});
T.sramM = ctex('sramM', 512, 160, (g, W, H) => { g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) sram(g, 4 + i * 63.5, 4 + j * 78, 60, 74, { cell: '#cdcdcd', dec: '#f0f0f0', line: 'rgba(0,0,0,.2)' }); bevel(g, W, H); });
T.sramSq = ctex('sramSq', 256, 256, (g, W, H) => { g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) sram(g, 4 + i * 63, 4 + j * 63, 59, 59, { cell: '#cdcdcd', dec: '#f0f0f0', line: 'rgba(0,0,0,.2)' }); bevel(g, W, H); });
T.l3 = ctex('l3', 1024, 136, (g, W, H) => { g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, W, H); for (let s = 0; s < 8; s++) { const x0 = 4 + s * 127; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) sram(g, x0 + i * 30, 6 + j * 64, 27, 60, { cell: '#d0d0d0', dec: '#f2f2f2', line: 'rgba(0,0,0,.2)' }); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 + 122, 0, 3, H); } bevel(g, W, H); });
// KV block: header + 16 token rows, bevelled
T.kv = ctex('kv', 64, 64, (g, W, H) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.fillRect(4, 4, W - 8, 8); g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 16; i++) g.fillRect(6, 15 + i * 2.8, W - 12, 1.2); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(W / 2 - .5, 14, 1, H - 18); bevel(g, W, H, 3, 'rgba(255,255,255,.7)', 'rgba(0,0,0,.45)'); });
T.kvPlate = ctex('kvPlate', 1024, 448, (g, W, H) => { g.fillStyle = '#121316'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(120,128,145,.25)'; g.lineWidth = 1; for (let c = 0; c <= 32; c++) { const x = (c * .3 + .1) / 9.8 * W; g.beginPath(); g.moveTo(x, 20); g.lineTo(x, H - 8); g.stroke(); } g.strokeStyle = 'rgba(120,128,145,.55)'; g.lineWidth = 2; for (let s = 0; s <= 4; s++) { const x = (s * 8 * .3 + .1) / 9.8 * W; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, H - 4); g.stroke(); } ['CH 0–7', 'CH 8–15', 'CH 16–23', 'CH 24–31'].forEach((s, i) => txt2(g, s, ((i * 8 + 4) * .3 + .1) / 9.8 * W, 12, 11, '#6d7382', 'center', 600, 'JetBrains Mono, monospace')); });
// core-view stage textures
T.bp = ctex('bp', 192, 192, (g, W, H) => { g.fillStyle = '#d6d6d6'; g.fillRect(0, 0, W, H); for (let t = 0; t < 5; t++) sram(g, 8, 8 + t * 30, 120 - t * 12, 24, { cell: '#bdbdbd', dec: '#ececec', line: 'rgba(0,0,0,.18)' }); sram(g, 136, 8, 48, 148, { cell: '#b2b2b2', dec: '#e4e4e4', line: 'rgba(0,0,0,.2)', vert: true }); txt2(g, 'TAGE ×5   BTB', 10, 172, 14, '#7a7a7a'); bevel(g, W, H); });
T.fe = ctex('fe', 96, 448, (g, W, H) => { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, W, H); for (let j = 0; j < 4; j++) { const y = (0.6 + j * 1.2 - 0.3) / 5 * H; g.fillStyle = '#ececec'; g.fillRect(8, y, W - 16, .6 / 5 * H); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 12; x < W - 12; x += 8) g.fillRect(x, y + 4, 1, .6 / 5 * H - 8); } bevel(g, W, H); });
T.de = ctex('de', 96, 448, (g, W, H) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, W, H); for (let j = 0; j < 4; j++) { const y = (0.6 + j * 1.2 - 0.35) / 5 * H; g.fillStyle = '#f0f0f0'; g.fillRect(8, y, W - 16, .7 / 5 * H); cells(g, 12, y + 6, W - 24, .7 / 5 * H - 12, '#e0e0e0', 0, 16); } bevel(g, W, H); });
T.rn = ctex('rn', 96, 448, (g, W, H) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H); for (let r = 0; r < 32; r++) for (let c = 0; c < 2; c++) { g.fillStyle = (r + c) % 3 ? '#e6e6e6' : '#bababa'; g.fillRect(8 + c * 42, 8 + r * 13, 38, 10); } bevel(g, W, H); });
T.rs = ctex('rs', 220, 500, (g, W, H) => { g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, W, H); for (let s = 0; s < 24; s++) { const x = -.6 + (s % 4) * .52, z = -2.25 + Math.floor(s / 4) * .42; const u = (x + .9) / 2.2 * W, v = (z + 2.6) / 5 * H; g.fillStyle = '#e8e8e8'; g.fillRect(u - 22, v - 16, 44, 32); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(u - 22, v + 6, 44, 2); } cells(g, 8, H * .55, W - 16, H * .4, '#c4c4c4', 0, 14); bevel(g, W, H); });
T.rob = ctex('rob', 1024, 116, (g, W, H) => { g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, W, H); for (let s = 0; s < 25; s++) { const x = -2.0 + s * .3; const u = (x + 2.2) / 7.5 * W; g.fillStyle = s % 8 === 0 ? '#ffffff' : '#e2e2e2'; g.fillRect(u - 18, 18, 36, H - 36); } bevel(g, W, H); });
T.port = ctex('port', 340, 96, (g, W, H) => { g.fillStyle = '#d4d4d4'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#e8e8e8' : '#c2c2c2'; g.fillRect(4 + i * 83, 6, 80, H - 12); } txt2(g, 'P1   P2   P3   WB', 12, H / 2, 16, '#888', 'left', 700, 'JetBrains Mono, monospace'); bevel(g, W, H); });
T.lsq = ctex('lsq', 192, 360, (g, W, H) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H); for (let r = 0; r < 18; r++) for (let c = 0; c < 2; c++) { g.fillStyle = r % 6 === 0 ? '#ffffff' : '#e0e0e0'; g.fillRect(10 + c * 88, 10 + r * 19, 82, 15); } bevel(g, W, H); });
// SM-view block textures
T.smSched = ctex('smSched', 256, 64, (g, W, H) => { g.fillStyle = '#cdcdcd'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#cdcdcd', 0, 14); bevel(g, W, H); });
T.smAlu = ctex('smAlu', 256, 104, (g, W, H) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, W, H); for (let l = 0; l < 32; l++) { g.fillStyle = '#e4e4e4'; g.fillRect(4 + (l % 16) * 15.6, 4 + Math.floor(l / 16) * 32, 13, 28); } for (let l = 0; l < 32; l++) { g.fillStyle = l < 16 ? '#b8b8b8' : '#d8d8d8'; g.fillRect(4 + (l % 16) * 15.6, 72 + (l >= 16 ? 14 : 0), 13, 12); } bevel(g, W, H); });
T.smTc = ctex('smTc', 256, 124, (g, W, H) => { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#f2f2f2' : '#e0e0e0'; g.fillRect(6 + i * 13, 6 + j * 11, 12, 10); } g.fillStyle = '#ffffff'; g.fillRect(6, 98, 208, 18); g.fillStyle = '#bdbdbd'; g.fillRect(220, 6, 30, 110); txt2(g, 'ACC', 115, 107, 12, '#8a8a8a', 'center', 700); bevel(g, W, H); });
T.smLd = ctex('smLd', 160, 48, (g, W, H) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { g.fillStyle = '#ececec'; g.fillRect(4 + i * 19.5, 6, 16, H - 12); } bevel(g, W, H); });
T.smSfu = ctex('smSfu', 96, 48, (g, W, H) => { g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { g.fillStyle = '#e8e8e8'; g.fillRect(4 + i * 23, 6, 19, H - 12); } bevel(g, W, H); });
T.smem = ctex('smem', 1024, 192, (g, W, H) => { g.fillStyle = '#c2c2c2'; g.fillRect(0, 0, W, H); for (let b = 0; b < 32; b++) { sram(g, 4 + b * 31.8, 8, 28, H - 30, { cell: b % 2 ? '#cbcbcb' : '#d6d6d6', dec: '#f0f0f0', line: 'rgba(0,0,0,.18)' }); } g.fillStyle = '#ececec'; g.fillRect(4, H - 18, W - 8, 12); txt2(g, '32 banks × 4 B', 10, H - 12, 10, '#8a8a8a', 'left', 700); bevel(g, W, H); });
T.smDie = ctex('smDie', 1024, 752, (g, W, H) => { g.fillStyle = '#2b2e35'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#2b2e35', 0, 10); g.fillStyle = 'rgba(120,128,145,.10)'; for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 1.5, H); for (let y = 0; y < H; y += 16) g.fillRect(0, y, W, 1.5); g.strokeStyle = '#555963'; g.lineWidth = 3; g.strokeRect(4, 4, W - 8, H - 8); });
T.dieDark = ctex('dieDark', 1024, 512, (g, W, H) => { g.fillStyle = '#25282e'; g.fillRect(0, 0, W, H); cells(g, 0, 0, W, H, '#25282e', 0, 9); g.fillStyle = 'rgba(120,128,145,.08)'; for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 1.5, H); for (let y = 0; y < H; y += 16) g.fillRect(0, y, W, 1.5); g.strokeStyle = '#4c5059'; g.lineWidth = 3; g.strokeRect(4, 4, W - 8, H - 8); });
T.kern = { gemm: ctex('kg', 128, 64, (g, W, H) => { g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#ffffff' : '#d4d4d4'; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); } }), attn: ctex('ka', 128, 64, (g, W, H) => { g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) for (let j = 0; j <= i && j < 4; j++) { g.fillStyle = '#ffffff'; g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12); } }), mem: ctex('km', 64, 64, (g, W, H) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, W, H); for (let x = 2; x < W; x += 6) { g.fillStyle = '#d0d0d0'; g.fillRect(x, 0, 3, H); } }) };

// ---------- shared micro-geometry materials ----------
const MD = {
  cap: M('#ffffff', { map: T.cap, roughness: .5, metalness: .2 }),
  ball: M('#b9bcc2', { roughness: .32, metalness: .85 }),
  frame: M('#8a8f96', { roughness: .38, metalness: .8 }),
  alu: M('#a2a7ae', { roughness: .42, metalness: .7 }),
  ind: M('#ffffff', { map: T.ind, roughness: .6, metalness: .25 }),
  qfn: M('#ffffff', { map: T.qfn, roughness: .5 }),
  pcap: [M('#2c2c35', { roughness: .45, metalness: .4 }), M('#ffffff', { map: T.pcap, roughness: .35, metalness: .6 }), M('#2c2c35', { roughness: .45, metalness: .4 })],
  dram: M('#ffffff', { map: T.dram, roughness: .5 }),
  plastic: M('#141416', { roughness: .65 }), latch: M('#c9ccd1', { roughness: .55 }),
  gpc: M('#ffffff', { map: T.gpc, roughness: .4, metalness: .3 }),
  gold: M('#c39a55', { roughness: .3, metalness: .9 }),
  flex: M('#7a4f22', { roughness: .55, metalness: .1 }),
  kern: {},
};
const GEO = { cap: new THREE.BoxGeometry(.13, .06, .075), ball: new THREE.SphereGeometry(.065, 8, 6), ind: new THREE.BoxGeometry(.42, .32, .42), qfn: new THREE.BoxGeometry(.3, .06, .3), pcap: new THREE.CylinderGeometry(.095, .095, .26, 14), fin: new THREE.BoxGeometry(1, 1, 1), chipD: new THREE.BoxGeometry(.04, .65, .5) };

// ---------- GPU package ----------
function detailGPU(G, full) {
  G.g.position.y = .1;
  const sub = G.g.children[0];
  skin(sub, T.gsub, { own: true, rough: .7 });
  skin(G.inter, T.inter, { own: true, rough: .32, metal: .45 });
  skin(G.dieM, T.gdie, { own: true, rough: .34, metal: .35 });
  G.gpcBox.forEach(b => b.material = MD.gpc);
  G.smInst.material.map = T.sm; G.smInst.material.roughness = .45; G.smInst.material.metalness = .15; G.smInst.material.needsUpdate = true;
  G.l2m.color.set('#737a8e'); G.l2.forEach(b => skin(b, T.l2));
  G.phym.color.set('#6e6670'); G.die.children.filter(c => c.material === G.phym).forEach((c, i) => skin(c, i < 2 ? T.phyV : texRep(T.phyU, 14, 1)));
  G.stacks.forEach(st => {
    st.mats.forEach((m, k) => { m.color.set(k ? '#4c4f58' : '#5a5e68'); });
    skin(st.base, T.hbmBase); st.layers.forEach(L => skin(L, T.hbm));
    if (full) { [st.base, ...st.layers.slice(0, 7)].forEach((L, k) => { const s = boxR(-.69, .69, 0, .011, -.425, .425, MAT.chip, L, { edge: false, shadow: false }); s.position.y = k ? .03 : .04; }); }
    else boxR(-.69, .69, .07, .55, -.425, .425, MAT.chip, st.g, { edge: false, shadow: false });
  });
  // NVLink connector: dark housing with gold contacts
  G.nvl.material = M('#ffffff', { map: T.nvl, roughness: .45, metalness: .35 }); G.nvl.scale.y = 1.6; G.nvl.position.y += .03;
  // die-side capacitors (MLCC) around the interposer, stiffener frame, BGA balls
  const P = pool(GEO.cap, MD.cap, G.g); P.tint = .05;
  for (const x of [-3.45, -3.72, -3.99, 3.45, 3.72]) for (let z = -2.4; z <= 2.41; z += .3) padd(P, x, .28, z, { ry: Math.PI / 2 });
  for (const z of [-2.8, -3.05, 2.8, 3.05]) for (let x = -2.9; x <= 2.91; x += .29) if (Math.abs(x) > .2) padd(P, x, .28, z);
  pbuild(P);
  [[-4.5, -4.28, -3.5, 3.5], [-4.5, 3.9, -3.52, -3.32], [-4.5, 3.9, 3.32, 3.52]].forEach(([a, b, c, d]) => boxR(a, b, .25, .3, c, d, MD.frame, G.g, { edge: false }));
  const B = pool(GEO.ball, MD.ball, G.g, false);
  for (let i = 0; i < 37; i++) for (let j = 0; j < 29; j++) { const x = -4.5 + i * .25, z = -3.5 + j * .25; if (i < 3 || i > 33 || j < 3 || j > 25) padd(B, x, -.045, z); }
  pbuild(B);
}
detailGPU(GPU, true); MULTI.gpus.forEach(G => detailGPU(G, false));

// ---------- main PCB + multi boards ----------
BD.g.children.filter(c => c.geometry && c.geometry.parameters && Math.abs(c.geometry.parameters.height - .006) < 1e-4).forEach(c => BD.g.remove(c));
skin(BD.g.children[0], T.pcb, { own: true, rough: .82 });
skin(MULTI.g.children[0], texRep(T.pcbGen, 3.75, 1.2), { own: true, rough: .82 }); skin(MULTI.g.children[1], texRep(T.pcbGen, 1.6, 1.75), { own: true, rough: .82 });

// ---------- CPU package: socket, load plate, die floorplan, ring, IMC/IO, removed IHS ----------
CPU.g.position.y = .08;
boxR(-2.95, 2.95, -.08, 0, -2.95, 2.95, MD.plastic, CPU.g, { edge: false });
[[-3.05, -2.75, -3.05, 3.05], [2.75, 3.05, -3.05, 3.05], [-2.75, 2.75, -3.05, -2.75], [-2.75, 2.75, 2.75, 3.05]].forEach(([a, b, c, d]) => boxR(a, b, -.08, .14, c, d, MD.frame, CPU.g, { edge: true }));
wire([[-3.3, .02, 2.9], [-3.3, .02, -2.6], [-3.3, .45, -3.0]], .045, MD.frame, CPU.g); // retention lever
{ const sub = CPU.g.children[0]; skin(sub, T.csub, { own: true, rough: .7 }); skin(cpuDie, T.cdie, { own: true, rough: .34, metal: .35 }); }
{ const CP = pool(GEO.cap, MD.cap, CPU.g); CP.tint = .05; for (let i = 0; i < 16; i++) { padd(CP, -1.5 + i * .2, .23, -1.75); padd(CP, -1.5 + i * .2, .23, 1.75); } for (let i = 0; i < 12; i++) { padd(CP, -2.05, .23, -1.1 + i * .2, { ry: Math.PI / 2 }); padd(CP, 2.05, .23, -1.1 + i * .2, { ry: Math.PI / 2 }); } pbuild(CP); }
BD.cores.forEach((c, i) => { c.m.color.set('#6e7280'); skin(c.mesh, i >= 4 ? texRep(T.core, 1, 1, true) : T.core); });
{ const l2m = M('#5b6172', { roughness: .35, metalness: .3, map: T.sramM }); CPU.g.children.filter(c => c.material === MAT.l2).forEach(c => c.material = l2m); }
L3.material.color.set('#6a6e84'); skin(L3, T.l3);
// ring interconnect: two rails + one stop per core column
{ const rm = M('#9a7a4c', { roughness: .4, metalness: .7 }); boxR(-1.5, 1.5, .3, .318, -.245, -.225, rm, CPU.g, { edge: false }); boxR(-1.5, 1.5, .3, .318, .225, .245, rm, CPU.g, { edge: false }); for (let c = 0; c < 4; c++) { const x = -1.12 + c * .747; boxR(x - .05, x + .05, .3, .325, -.26, -.21, rm, CPU.g, { edge: false }); boxR(x - .05, x + .05, .3, .325, .21, .26, rm, CPU.g, { edge: false }); } }
{ const ph = CPU.g.children.filter(c => c.material === MAT.phy); const pm = M('#6e6670', { roughness: .4, metalness: .4, map: T.phyV }); ph.forEach(c => c.material = pm);
  if (ph[0]) pickable(ph[0], { name: B('DDR5 memory controller + PHY', 'DDR5 内存控制器 + PHY'), fn: B('The integrated memory controller (IMC) at the CPU die edge manages 8–12 DDR5 channels connected to the DIMMs on the left.', '集成在 CPU die 边上的内存控制器 (IMC)：管理 8–12 个 DDR5 通道，对着左边的 DIMM。'), v: () => '~' + (CPUSPEC.bw / 1e12).toFixed(1) + tr(B(' TB/s (illustrative)', ' TB/s (示意)')) });
  if (ph[1]) pickable(ph[1], { name: B('PCIe / IO controller', 'PCIe / IO 控制器'), fn: B('CPU IO region: PCIe Gen5 root ports connect to the GPU and network card on the right.', 'CPU 的 IO 区：PCIe Gen5 根端口，连向右边的 GPU 和网卡。'), v: () => tr(B('~64 GB/s per direction (×16)', '~64 GB/s 每方向 (×16)')) }); }
// removed heat spreader lying next to the socket
{ const ihs = new THREE.Group(); ihs.position.set(-9.9, 0, 5.15); ihs.rotation.y = .18; CPU.g.parent.add(ihs);
  boxR(-1.55, 1.55, 0, .05, -1.45, 1.45, MD.frame, ihs, { edge: true }); const top = boxR(-1.35, 1.35, .05, .2, -1.25, 1.25, M('#b9bdc3', { roughness: .32, metalness: .85 }), ihs);
  skin(top, T.ihs, { own: true, rough: .3, metal: .85 }); pickable(top, { name: B('Integrated heat spreader (IHS, removed)', 'IHS 集成散热盖 (已取下)'), fn: B('The metal lid normally covers the CPU die and transfers heat to the cooler. Removed here to expose the die beneath.', '平时盖在 CPU die 上的金属盖，把热量传给散热器。这里取下来，好看到下面的 die。'), v: () => '' }); }

// ---------- DIMMs: chips both sides, RCD, PCB texture, slot pins, latches ----------
{ const dm = M('#ffffff', { map: T.dimmPcb, roughness: .7 }), sm = M('#ffffff', { map: T.slot, roughness: .6 });
  const kids = DIMM.children.slice(); const CH = pool(GEO.chipD, MD.dram, DIMM);
  kids.forEach(c => { const p = c.geometry.parameters; if (!p) return; if (Math.abs(p.width - .12) < 1e-3) skin(c, T.dimmPcb, { faces: [0, 1], own: true }); else if (Math.abs(p.width - .2) < 1e-3) skin(c, T.slot, { own: true }); else if (Math.abs(p.width - .04) < 1e-3) c.material = MD.dram; });
  for (let i = 0; i < 4; i++) { const x = i * .55; for (let k = 0; k < 8; k++) padd(CH, x - .08, .875, -2.65 + k * .74); boxR(x + .06, x + .1, .68, .98, -.16, .06, MAT.chip, DIMM, { edge: false }); [-3.45, 3.45].forEach(z => boxR(x - .09, x + .09, 0, .5, z - .1, z + .1, MD.latch, DIMM)); }
  pbuild(CH); }

// ---------- PCIe: AC-coupling caps, length-matched lane pad, x16 slot with a card's edge connector ----------
{ const PC = pool(GEO.cap, MD.cap, BD.g); PC.tint = .05; for (let k = 0; k < 8; k++) { const z = -.7 + k * .2; padd(PC, -4.45, .04, z); padd(PC, -4.15, .04, z); } pbuild(PC);
  skin(PCIE.lane, ctex('serp', 256, 360, (g, W, H) => { g.fillStyle = '#18211d'; g.fillRect(0, 0, W, H); g.strokeStyle = '#3a4c40'; g.lineWidth = 3; for (let k = 0; k < 8; k++) { const y = 20 + k * 42; g.beginPath(); g.moveTo(0, y); for (let x = 20; x < W - 20; x += 16) { g.lineTo(x, y); g.lineTo(x, y + 12); g.lineTo(x + 8, y + 12); g.lineTo(x + 8, y); } g.lineTo(W, y); g.stroke(); } }), { own: true });
  const slot = boxR(-4.6, -.8, 0, .3, 5.4, 5.75, MD.plastic, BD.g); skin(slot, T.pcieSlot, { own: true }); boxR(-.8, -.55, 0, .36, 5.38, 5.77, MD.latch, BD.g);
  pickable(slot, { name: B('PCIe ×16 slot', 'PCIe ×16 插槽'), fn: B('Standard expansion slot for a card\'s gold edge connector. Each lane uses differential signaling. Server GPUs often use SXM/OAM modules; this slot holds a network card.', '标准扩展插槽：板卡的金手指 (edge connector) 插进来，每条 lane 是一对差分线。GPU 在服务器里常用 SXM/OAM 模组而不是插卡，这里插的是网卡。'), v: () => tr(B('~64 GB/s per direction (Gen5 ×16)', '~64 GB/s 每方向 (Gen5 ×16)')) });
  const card = boxR(-4.45, -1.3, .32, 1.25, 5.545, 5.605, M('#ffffff', { roughness: .7 }), BD.g); skin(card, T.card, { faces: [4, 5], own: true });
  boxR(-4.4, -1.35, .26, .4, 5.54, 5.61, MD.gold, BD.g, { edge: false });
  boxR(-3.3, -2.3, .55, 1.05, 5.605, 5.64, MAT.chip, BD.g, { edge: false });
  const F = pool(GEO.fin, MD.alu, BD.g); for (let i = 0; i < 9; i++) padd(F, -3.28 + i * .12, .8, 5.78, { s: [.03, .52, .28] }); padd(F, -2.8, .8, 5.655, { s: [1.04, .54, .03] }); pbuild(F);
  pickable(card, { name: B('Network card (illustrative)', '网卡 (示意)'), fn: B('A PCIe expansion card with a gold edge connector along its bottom. Distributed inference uses such cards for communication between nodes.', '插在 PCIe 插槽里的扩展卡：底边的金手指就是 edge connector。多机推理时，节点之间的通信走这类网卡。'), v: () => '' }); }

// ---------- VRMs: inductors, power stages, polymer caps (+ a finned heatsink on the CPU side) ----------
const VP = { ind: pool(GEO.ind, MD.ind, BD.g), qfn: pool(GEO.qfn, MD.qfn, BD.g), pcap: pool(GEO.pcap, MD.pcap, BD.g), cap: pool(GEO.cap, MD.cap, BD.g) };
const VM = { ind: pool(GEO.ind, MD.ind, MULTI.g), qfn: pool(GEO.qfn, MD.qfn, MULTI.g), pcap: pool(GEO.pcap, MD.pcap, MULTI.g), cap: pool(GEO.cap, MD.cap, MULTI.g) };
[VP, VM].forEach(p => { p.ind.tint = .03; p.cap.tint = .05; });
function vrmRow(P, x0, x1, zi, n, dir) {
  for (let i = 0; i < n; i++) { const x = x0 + (i + .5) * (x1 - x0) / n; padd(P.ind, x, .16, zi); padd(P.qfn, x, .03, zi - dir * .4); padd(P.cap, x - .23, .03, zi - dir * .4, { ry: Math.PI / 2 }); padd(P.cap, x + .23, .03, zi - dir * .4, { ry: Math.PI / 2 }); if (i % 2 === 0) padd(P.pcap, x + (x1 - x0) / n * .5, .13, zi + dir * .44); }
}
vrmRow(VP, 1.2, 8.8, 4.25, 12, 1); vrmRow(VP, -10.3, -5.7, -3.85, 8, -1);
vrmRow(VM, 14.7, 22.3, 4.25, 12, 1); vrmRow(VM, 1.2, 8.8, -11.5 + 4.25, 12, 1); vrmRow(VM, 14.7, 22.3, -11.5 + 4.25, 12, 1);
[VP, VM].forEach(p => Object.values(p).forEach(pbuild));
{ boxR(-10.45, -5.55, .33, .4, -4.12, -3.58, MD.alu, BD.g); const F = pool(GEO.fin, MD.alu, BD.g); for (let i = 0; i < 25; i++) padd(F, -10.4 + i * .2, .66, -3.85, { s: [.045, .52, .54] }); pbuild(F);
  delete VP.ind.mesh.raycast; pickable(VP.ind.mesh, { name: B('VRM (inductors + power stages)', '供电 VRM (电感 + 功率级)'), fn: B('Steps 12 V/54 V down to the chip\'s ~0.8 V. A GPU at ~700 W draws hundreds of amperes, requiring multiple parallel phases, each with an inductor (gray block) and power-stage chip.', '把 12 V/54 V 降到芯片要的 ~0.8 V。GPU 满载 ~700 W → 上百安培电流，所以要十几相并联：每相一个电感 (灰方块) + 一个功率级芯片。'), v: () => tr(B('GPU: 12 phases · CPU: 8 phases (illustrative)', 'GPU 12 相 · CPU 8 相 (示意)')) }); }

// ---------- multi-GPU: NVSwitch board (4 switch chips with heatsinks) + NVLink flex bridges ----------
{ MULTI.sw.position.y += .1; boxR(10.5, 13.1, 0, .1, -7.0, -4.4, MAT.sub, MULTI.g);
  const finM = M('#9aa0a8', { roughness: .4, metalness: .7, emissive: new THREE.Color('#000') }); MULTI.finM = finM;
  const F = pool(GEO.fin, finM, MULTI.g);
  const sink = (x0, x1, z0, z1, y0) => { boxR(x0, x1, y0, y0 + .06, z0, z1, finM, MULTI.g, { edge: false }); const n = Math.round((x1 - x0) / .16); for (let i = 0; i < n; i++) padd(F, x0 + .08 + i * (x1 - x0 - .16) / (n - 1), y0 + .3, (z0 + z1) / 2, { s: [.04, .5, z1 - z0] }); };
  sink(10.85, 12.75, -6.65, -4.75, .45);
  [-9.9, -12.6, -15.3].forEach(z0 => { boxR(10.6, 13.0, 0, .1, z0 - .15, z0 + 1.75, MAT.sub, MULTI.g); const c = boxR(10.9, 12.7, .1, .4, z0, z0 + 1.6, M('#3b3f4a', { roughness: .45, metalness: .3 }), MULTI.g); sink(10.95, 12.65, z0 + .05, z0 + 1.55, .4); pickable(c, { name: B('NVSwitch (3 additional chips)', 'NVSwitch (另外 3 颗)'), fn: B('HGX 8-GPU boards typically contain multiple NVSwitch chips; each GPU\'s 18 NVLinks are distributed across them.', 'HGX 8-GPU 板上通常有多颗 NVSwitch，每张 GPU 的 18 条 NVLink 分到各颗交换芯片上。'), v: () => '' }); });
  pbuild(F);
  const fm = M('#ffffff', { map: ctex('flex', 256, 32, (g, W, H) => { g.fillStyle = '#6e4a20'; g.fillRect(0, 0, W, H); g.fillStyle = '#c7a05a'; for (let k = 0; k < 6; k++) g.fillRect(0, 4 + k * 4.6, W, 1.6); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2); }), roughness: .5, metalness: .2 });
  [[GPU.X + 4.3, 0], [18.5 - 4.3, 0], [5 + 4.3, -11.5], [18.5 - 4.3, -11.5]].forEach(([x, z]) => { const pts = [[x, .37, z], [x, .37, z * .6 - 2.3], [11.8, .37, -5.7]];
    for (let i = 0; i < 2; i++) { const a = V3(...pts[i]), b = V3(...pts[i + 1]), L = a.distanceTo(b); if (L < .01) continue; const m = mesh(new THREE.BoxGeometry(L + .3, .035, .36), fm, { parent: MULTI.g, edge: false }); m.position.copy(a).add(b).multiplyScalar(.5); m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); m.raycast = () => { }; }
    boxR(x - .28, x + .28, .25, .5, z - .3, z + .3, MD.plastic, MULTI.g); });
}

// ---------- KV memory map: bevelled KV blocks, channel-ruled backplate, frame ----------
KVM.inst.material.map = T.kv; KVM.inst.material.needsUpdate = true; KVM.inst.castShadow = true;
{ const plate = KVM.g.children[0]; skin(plate, T.kvPlate, { faces: [2], own: true, rough: .35, metal: .3 });
  // HBM stacks: base logic die + 12 thinned DRAM dies (instanced), TSV columns, micro-bump gaps, mould frame posts
  const die = new THREE.InstancedMesh(rbox(2.3, .06, 1.62, .02), M('#4a4d56', { map: T.hbm, roughness: .4, metalness: .35 }), 4 * KVST.L);
  const base = new THREE.InstancedMesh(rbox(2.4, .2, 1.72, .03), M('#30333a', { map: T.hbmBase, roughness: .45, metalness: .3 }), 4);
  const tsv = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .025, KVST.L * KVST.dy, 6), M('#b08a4e', { roughness: .35, metalness: .9 }), 4 * 10);
  const bump = new THREE.InstancedMesh(rbox(2.2, .03, 1.5, .01), M('#8d9097', { roughness: .4, metalness: .8 }), 4 * KVST.L);
  const o = new THREE.Object3D(); let n = 0, nb = 0;
  KVST.X.forEach((x, s) => {
    o.position.set(x, .4, 0); o.rotation.set(0, 0, 0); o.updateMatrix(); base.setMatrixAt(s, o.matrix);
    for (let L = 0; L < KVST.L; L++) { o.position.set(x, KVST.y0 + L * KVST.dy - .01, 0); o.updateMatrix(); die.setMatrixAt(n++, o.matrix); o.position.y -= .05; o.updateMatrix(); bump.setMatrixAt(nb++, o.matrix); }
    for (let k = 0; k < 10; k++) { o.position.set(x + ((k % 5) - 2) * .09, KVST.y0 + KVST.L * KVST.dy / 2 - .15, -.04 + Math.floor(k / 5) * .08); o.updateMatrix(); tsv.setMatrixAt(s * 10 + k, o.matrix); }
  });
  [die, base, tsv, bump].forEach(m => { m.castShadow = true; m.receiveShadow = true; KVM.g.add(m); });
  pickable(die, { name: B('HBM3 stack: 12 stacked DRAM dies', 'HBM3 堆栈：12 层 DRAM 裸片'), fn: B('Each HBM stack is a base logic die plus thinned DRAM dies joined by through-silicon vias (TSVs). Coloured blocks on each die = KV-cache pages (PagedAttention blocks); blue = resident weights. Addresses interleave across stacks.', '每个 HBM 堆栈 = 1 个底部逻辑裸片 + 多层减薄 DRAM 裸片，用硅通孔 (TSV) 连接。每层上的彩色块 = KV cache 页 (PagedAttention block)；蓝色 = 常驻权重。地址在各堆栈之间交错。'), v: () => tr(B('4 stacks shown (illustrative; H100 has 5 active)', '示意 4 个堆栈 (H100 实际 5 个可用)')) });
  decal(KVM.g, 5.42, 6.98, -.48, .48, 1.506, ctex('sramDecal', 256, 160, (g, W, H) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(6 + i * 62, 6 + j * 76, 56, 70); g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 8 + j * 76; y < 74 + j * 76; y += 3) g.fillRect(8 + i * 62, y, 52, 1); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(32 + i * 62, 6 + j * 76, 4, 70); } }), { roughness: .4 }); }

// ---------- CPU core close-up: die base + stage floorplans + LSQ / uop cache ----------
{ const base = CORE.g.children[0]; skin(base, T.dieDark, { own: true, rough: .4, metal: .3 });
  // flip-chip package under the die: organic substrate, C4 bump array, decoupling caps; seal ring; BEOL metal stack shown on the front edge
  boxR(-8.6, 8.6, -.85, -.55, -5.0, 4.2, M('#3b4a3a', { roughness: .7 }), CORE.g);
  { const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(.1, 8, 6), M('#b9bcc2', { roughness: .3, metalness: .9 }), 36 * 17), o = new THREE.Object3D(); let n = 0;
    for (let i = 0; i < 36; i++) for (let j = 0; j < 17; j++) { o.position.set(-7.35 + i * .42, -.42, -3.9 + j * .42); o.updateMatrix(); bm.setMatrixAt(n++, o.matrix); } bm.castShadow = true; CORE.g.add(bm);
    pickable(bm, { name: B('C4 solder bumps (flip-chip)', 'C4 焊球 (倒装)'), fn: B('The die is mounted face-down; thousands of solder bumps carry power, ground and I/O into the package substrate.', '裸片正面朝下倒装；成千上万个焊球把电源、地和 I/O 接到封装基板。'), v: () => '' });
    const cp = new THREE.InstancedMesh(rbox(.3, .14, .16, .03), M('#8a6a45', { roughness: .5 }), 40); n = 0;
    for (let i = 0; i < 20; i++) for (const z of [-4.6, 3.85]) { o.position.set(-7.6 + i * .8, -.48, z); o.updateMatrix(); cp.setMatrixAt(n++, o.matrix); } cp.castShadow = true; CORE.g.add(cp); }
  const seal = M('#9a9ea6', { roughness: .3, metalness: .85 });
  [[-7.6, 7.6, -4.1, -3.98], [-7.6, 7.6, 3.18, 3.3]].forEach(([a, b, c, d]) => boxR(a, b, 0, .06, c, d, seal, CORE.g, { edge: false }));
  [[-7.6, -7.48], [7.48, 7.6]].forEach(([a, b]) => boxR(a, b, 0, .06, -4.1, 3.3, seal, CORE.g, { edge: false }));
  ['#7a5a3a', '#2c3038', '#9a7048', '#2c3038', '#b88a58', '#2c3038', '#d0a46c'].forEach((c, k) => boxR(-7.6, 7.6, -.25 + k * .035, -.25 + (k + 1) * .035, 3.3, 3.42, M(c, { roughness: .4, metalness: c === '#2c3038' ? .1 : .8 }), CORE.g, { edge: false }));
  const S = CORE.st, up = m => m.color.multiplyScalar(1.45);
  [['bp', T.bp], ['l1i', T.sramSq], ['fe', T.fe], ['de', T.de], ['rn', T.rn], ['rs', T.rs], ['rob', T.rob], ['l1d', T.sramSq], ['l2', texRep(T.sramM, 1, 3)]].forEach(([k, t]) => { up(S[k].m); skin(S[k].b, t); });
  CORE.ports.forEach(P => { up(P.m); skin(P.b, T.port); });
  const lsq = boxR(4.6, 6.0, 0, .2, -2.6, .05, M('#6a6350', { roughness: .5 }), CORE.g); skin(lsq, T.lsq);
  pickable(lsq, { name: B('Load/store queue (LSQ)', 'Load/Store 队列 (LSQ)'), fn: B('Tracks in-flight memory operations, preserving the values required by program order during out-of-order execution (store-to-load forwarding and memory dependency checks).', '记录在飞的读写内存指令：保证乱序执行时，读到的仍是程序顺序下"该读到"的值 (store→load 转发、内存依赖检查)。'), v: () => tr(B('~100+ entries (typical)', '~100+ 项 (典型)')) });
  const uc = boxR(-7.2, -5.4, 0, .18, 1.8, 2.4, M('#5c6070', { roughness: .45 }), CORE.g); skin(uc, texRep(T.sramM, 1, 1));
  pickable(uc, { name: B('μop cache', 'μop 缓存'), fn: B('Caches decoded micro-operations so hot loops bypass the decoders, saving power and increasing delivery bandwidth.', '缓存已经译码好的微操作：热循环可以绕过译码器直接供给，省功耗、提高带宽。'), v: () => tr(B('~4K μops (typical)', '~4K μops (典型)')) }); }

// ---------- SM close-up ----------
{ const SBase = SMV.g.children[0], SDie = SMV.g.children[1]; skin(SBase, T.gsub, { own: true, rough: .7 }); skin(SDie, T.smDie, { own: true, rough: .35, metal: .3 });
  const up = o => { o.m.color.multiplyScalar(1.5); };
  up(SMV.icache); skin(SMV.icache.b, texRep(T.sramM, 6, 1));
  SMV.parts.forEach(P => {
    up(P.sched); skin(P.sched.b, T.smSched); up(P.rf); skin(P.rf.b, T.smSched); up(P.alu); skin(P.alu.b, T.smAlu); up(P.tc); skin(P.tc.b, T.smTc); up(P.ldst); skin(P.ldst.b, T.smLd); up(P.sfu); skin(P.sfu.b, T.smSfu);
    boxR(P.x0 + .05, P.x1 - .05, .12, .2, -2.13, -2.07, MD.gold, SMV.g, { edge: false }); // dispatch bus
  });
  { const rfm = M('#6f7585', { map: texRep(T.sramM, 1, 1), roughness: .35, metalness: .3 }); SMV.g.children.filter(c => c.material === MAT.l2).forEach(c => c.material = rfm); }
  up(SMV.smem); skin(SMV.smem.b, T.smem); up(SMV.tma); skin(SMV.tma.b, T.smLd); up(SMV.l2); skin(SMV.l2.b, texRep(T.sramM, 1, 4));
  const tex = M('#6c6a78', { roughness: .45, map: T.smSfu }); for (let i = 0; i < 4; i++) { const x0 = 2.38 + (i % 2) * .32, z0 = 1.45 + Math.floor(i / 2) * .6; const b = boxR(x0, x0 + .26, .26, .33, z0, z0 + .5, tex, SMV.g); if (!i) pickable(b, { name: B('Texture units ×4', '纹理单元 ×4'), fn: B('Texture sampling/filtering hardware for graphics: 4 per SM. Largely unused in LLM inference.', '图形用的纹理采样/过滤硬件，每个 SM 4 个。LLM 推理基本用不到。'), v: () => '' }); }
  // HBM stack in the SM view: textured layers + seams
  SMV.hbm.children.forEach((c, i) => { if (i === 0) skin(c, T.hbmBase, { own: true }); else { c.material = M('#4a4d56', { roughness: .45, metalness: .25 }); skin(c, T.hbm); } });
  boxR(-.78, .78, .1, 1.07, -1.03, 1.03, MAT.chip, SMV.hbm, { edge: false, shadow: false });
  // MMA: frames behind each 16x16 grid and travelling A/B fragments
  const fr = M('#1d1f24', { roughness: .6 }); SMV.mmaX.forEach(x => { const b = boxR(x - .1, x + 1.9, -.12, 1.9, -.05, -.02, fr, SMV.mma, { edge: true }); b.castShadow = false; });
  SMV.fragA = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.92, .05), new THREE.MeshBasicMaterial({ color: '#7fb0ff', transparent: true, opacity: 0, toneMapped: false })); SMV.mma.add(SMV.fragA);
  SMV.fragB = new THREE.Mesh(new THREE.BoxGeometry(1.92, .12, .05), new THREE.MeshBasicMaterial({ color: '#7fb0ff', transparent: true, opacity: 0, toneMapped: false })); SMV.mma.add(SMV.fragB);
  SMV.accF = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, .02), new THREE.MeshBasicMaterial({ color: '#5fc39c', transparent: true, opacity: 0, toneMapped: false })); SMV.accF.position.set(2.0 + .9, .9, -.06); SMV.mma.add(SMV.accF);
  const _smMMA = smMMA; smMMA = function (k, acc) { if (k !== SMV._k) { SMV._k = k; SMV._kT = SIM.t; } SMV._acc = acc; return _smMMA(k, acc); };
}

// ---------- tower: kernel tiles on blocks, plinth + rails, lifted clear of the board ----------
{ TOWER.DY = 1.5; TOWER.g.position.y = TOWER.DY;
  TOWER.blocks.forEach(b => { b.mesh.material = b.mat; b.mat.map = T.kern[b.type === 'attn' ? 'attn' : b.type === 'gemm' ? 'gemm' : 'mem']; b.mat.color.multiplyScalar(1.25); b.mat.needsUpdate = true; });
  TOWER.rows.forEach(r => { if (r.lab) { const v = V3(TOWER.X - 2.25, r.y + TOWER.DY, .65); r.lab.pos = () => v; } });
  boxR(-2.5, 2.5, .55, .8, -.95, .95, M('#2a2c32', { roughness: .6 }), TOWER.g); boxR(-2.55, 2.55, .5, .56, -1.0, 1.0, MD.frame, TOWER.g, { edge: false });
  [-2.35, 2.35].forEach(x => boxR(x - .04, x + .04, .8, 4.45, -.78, -.7, MD.frame, TOWER.g, { edge: false }));
  boxR(-2.39, 2.39, 4.45, 4.5, -.8, -.68, MD.frame, TOWER.g, { edge: false });
}

// ---------- per-frame detail tick (glow sync, MMA fragments) ----------
function detailTick(dt) {
  if (MULTI.g.visible && MULTI.finM) MULTI.finM.emissive.copy(MULTI.sw.material.emissive).multiplyScalar(.7);
  if (SMV.mma.visible && SMV.fragA) {
    const k = SMV._k, on = k >= 0 && OPR.running && ACT.smMode === 'mma'; const u = on ? clamp((SIM.t - (SMV._kT || 0)) / .35) : 0, e = u * u * (3 - 2 * u);
    SMV.fragA.material.opacity = on ? .85 * (1 - u * .6) : 0; SMV.fragB.material.opacity = SMV.fragA.material.opacity;
    if (on) { const ax = SMV.mmaX[0] + k * .12, cx = SMV.mmaX[2] + .9; SMV.fragA.position.set(lerp(ax, cx, e), .9, .06 + .3 * Math.sin(e * Math.PI)); const by = 1.8 - k * .12; SMV.fragB.position.set(lerp(SMV.mmaX[1] + .9, cx, e), lerp(by, .9, e), .06 + .3 * Math.sin(e * Math.PI)); }
    SMV.accF.material.opacity = on ? .12 + .25 * clamp(SMV._acc || 0) : 0;
  }
}
// frame-time probe (rolling avg over last 120 rAFs) + renderer stats
const DPROBE = { t: [], last: 0 };
(function probe(now) { requestAnimationFrame(probe); if (DPROBE.last) { DPROBE.t.push(now - DPROBE.last); if (DPROBE.t.length > 120) DPROBE.t.shift(); } DPROBE.last = now; })(performance.now());
window.__perf = () => { const a = DPROBE.t.slice().sort((x, y) => x - y); const avg = a.reduce((s, x) => s + x, 0) / Math.max(1, a.length); return { avgMs: +avg.toFixed(2), p95Ms: +(a[Math.floor(a.length * .95)] || 0).toFixed(2), n: a.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, inst: DPERF.inst }; };

// ---------- perf: tiny parts don't cast shadows (they still receive) ----------
{ const bb = new THREE.Box3(), sz = new THREE.Vector3(); let n = 0;
  [BD.g, MULTI.g, CORE.g, SMV.g, KVM.g].forEach(g => g.traverse(o => { if (!o.isMesh || !o.castShadow || o.isInstancedMesh) return; o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).getSize(sz); sz.multiply(o.scale); if (Math.max(sz.x, sz.z) < .35 || sz.y < .02) { o.castShadow = false; n++; } }));
  DPERF.noShadow = n; }

// ---------- perf: merge static sibling meshes that share a material (skill §10 perf budget) ----------
{ const keep = new Set(PICK); EXP.forEach(e => keep.add(e.obj));
  const seen = new Set();
  const scan = (v, d) => { if (!v || typeof v !== 'object' || d > 4 || seen.has(v)) return; seen.add(v);
    if (v.isObject3D) { if (v.isMesh) keep.add(v); return; }
    if (Array.isArray(v)) { v.forEach(x => scan(x, d + 1)); return; }
    if (v.isMaterial || v.isBufferGeometry || v.isTexture) return;
    for (const k in v) scan(v[k], d + 1); };
  [()=>BD,()=>GPU,()=>TOWER,()=>KVM,()=>MULTI,()=>CORE,()=>SMV,()=>STAGE].map(f=>{try{return f()}catch(e){return null}}).forEach(o => { if (o && typeof o === 'object') for (const k in o) { const x = o[k]; if (x && x.isObject3D && !x.isMesh) continue; scan(x, 1); } });
  if (typeof LABELS !== 'undefined') LABELS.forEach(L => { if (L.obj) keep.add(L.obj); if (L.anchor) keep.add(L.anchor); });
  const sig = g => Object.keys(g.attributes).filter(a => ['position', 'normal', 'uv'].includes(a)).sort().join(',');
  let before = 0, after = 0;
  const parents = new Set();
  [()=>BD.g,()=>MULTI.g,()=>CORE.g,()=>SMV.g,()=>KVM.g,()=>GPU.g,()=>TOWER.g].map(f=>{try{return f()}catch(e){return null}}).forEach(g => g && g.traverse(o => parents.add(o)));
  for (const P of parents) {
    const buckets = new Map();
    for (const m of P.children) {
      if (!m.isMesh || m.isInstancedMesh || keep.has(m) || Array.isArray(m.material) || m.morphTargetInfluences) continue;
      if (m.children.some(c => !(c.isLineSegments && c.material === EDGE))) continue;
      if (Object.keys(m.userData).length || m.name || !m.visible) continue;
      const k = m.material.uuid + '|' + m.castShadow + '|' + m.receiveShadow + '|' + sig(m.geometry) + '|' + m.renderOrder;
      (buckets.get(k) || buckets.set(k, []).get(k)).push(m);
    }
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const gs = [], es = [];
      for (const m of list) { m.updateMatrix(); const keepA = sig(m.geometry).split(',');
        let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const a of Object.keys(g.attributes)) if (!keepA.includes(a)) g.deleteAttribute(a);
        g.applyMatrix4(m.matrix); gs.push(g);
        for (const c of m.children) { c.updateMatrix(); const eg = c.geometry.clone(); eg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(m.matrix, c.matrix)); es.push(eg); } }
      const mg = mergeGeometries(gs, false); if (!mg) continue;
      const mm = new THREE.Mesh(mg, list[0].material); mm.castShadow = list[0].castShadow; mm.receiveShadow = list[0].receiveShadow; mm.renderOrder = list[0].renderOrder; mm.raycast = () => { };
      if (es.length) { const em = mergeGeometries(es.map(e => e.index ? e.toNonIndexed() : e), false); if (em) { const L = new THREE.LineSegments(em, EDGE); L.raycast = () => { }; mm.add(L); } }
      before += list.length; after++;
      for (const m of list) { P.remove(m); m.children.forEach(c => c.geometry.dispose()); }
      gs.forEach(g => g.dispose()); P.add(mm);
    }
  }
  // edge-only pass: fold per-mesh outline LineSegments of static (non-kept) siblings into one per parent
  let eb = 0, ea = 0;
  for (const P of [...parents]) {
    if (!P.parent) continue; const es = [], rm = [];
    for (const m of P.children) {
      if (!m.isMesh || m.isInstancedMesh || keep.has(m) || !m.visible || m.children.length !== 1) continue;
      const c = m.children[0]; if (!c.isLineSegments || c.material !== EDGE || !c.visible) continue;
      m.updateMatrix(); c.updateMatrix(); const eg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
      eg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(m.matrix, c.matrix)); es.push(eg); rm.push([m, c]);
    }
    if (es.length < 2) continue; const em = mergeGeometries(es, false); if (!em) continue;
    eb += es.length; ea++; rm.forEach(([m, c]) => { m.remove(c); c.geometry.dispose(); });
    const L = new THREE.LineSegments(em, EDGE); L.raycast = () => { }; P.add(L);
  }
  DPERF.merged = { before, after, edgesBefore: eb, edgesAfter: ea }; }
