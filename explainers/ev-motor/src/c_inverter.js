// ================= c_inverter: SiC traction inverter on top of the drive unit (24 modules = 3 phases × 2 switch positions × 4 parallel) =================
const INV = new THREE.Group(); ROOT.add(INV); GRP.inv = INV;
const XC = 2.2, YP = 14.6;       // inverter centre x, cold-plate top y
const PHZ = [-5.3, 0, 5.3];     // phase U V W rows along z (match motor terminals)
{
  const alu = M('#aab1b9', { metalness: .8, roughness: .38 });
  mesh(rbox(13.4, .8, 17.2, .12), alu, { parent: INV, x: XC, y: YP - .4, part: 'pin-fin cold plate' });
  const fin = new THREE.CylinderGeometry(.13, .16, 1.1, 8); const fins = new THREE.InstancedMesh(fin, alu, 26 * 32); const o = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < 26; i++) for (let j = 0; j < 32; j++) { o.position.set(XC - 6.2 + i * .5 + (j % 2) * .25, YP - 1.3, -7.9 + j * .51); o.updateMatrix(); fins.setMatrixAt(k++, o.matrix); }
  fins.userData.part = 'cooling pin fins'; INV.add(fins);
  // SiC power modules (custom package, epoxy body, laser-marked top, three copper tabs)
  TX.mod = canvasTex(256, 200, (g, w, h) => { g.fillStyle = '#17191c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.09)'; g.lineWidth = 2; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = 'rgba(220,225,230,.55)'; g.font = '600 30px "JetBrains Mono", monospace'; g.fillText('SiC MOSFET', 30, 80); g.font = '500 22px "JetBrains Mono", monospace'; g.fillText('650V  GK026', 30, 118); g.fillText('2PH8 · MAR', 30, 150);
    g.beginPath(); g.arc(214, 52, 9, 0, TAU); g.fill(); });
  const body = M('#202327', { roughness: .62 }); const top = M('#ffffff', { map: TX.mod, roughness: .55 });
  const mg = rbox(2.3, .42, 1.8, .07); const mods = new THREE.InstancedMesh(mg, body, 24); mods.userData.part = 'SiC MOSFET modules';
  const pg = new THREE.PlaneGeometry(2.1, 1.6); pg.rotateX(-Math.PI / 2); const tops = new THREE.InstancedMesh(pg, top, 24); tops.userData.part = 'module marking';
  const tab = rbox(.34, .12, .9, .03); const tabs = new THREE.InstancedMesh(tab, copperBare, 72); tabs.userData.part = 'module terminals';
  const base = rbox(2.5, .12, 2.0, .03); const bases = new THREE.InstancedMesh(base, copperBare, 24); bases.userData.part = 'module copper baseplates';
  k = 0; let kt = 0;
  for (let p = 0; p < 3; p++) for (const side of [-1, 1]) for (let c = 0; c < 4; c++) {
    const x = XC - 4.2 + c * 2.55, z = PHZ[p] + side * 1.1;
    o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    o.position.set(x, YP + .27, z); o.updateMatrix(); mods.setMatrixAt(k, o.matrix);
    o.position.set(x, YP + .065, z); o.updateMatrix(); bases.setMatrixAt(k, o.matrix);
    o.position.set(x, YP + .485, z); o.updateMatrix(); tops.setMatrixAt(k, o.matrix); k++;
    for (let t = 0; t < 3; t++) { o.position.set(x - .7 + t * .7, YP + .52, z - side * 1.12); o.rotation.set(side * .35, 0, 0); o.updateMatrix(); tabs.setMatrixAt(kt++, o.matrix); }
  }
  for (const m of [mods, tops, tabs, bases]) { m.castShadow = m.receiveShadow = true; INV.add(m); }
  GRP.mods = mods;
  // laminated DC busbar per phase (DC+ over insulation over DC−), feeding all 8 modules between the rows
  const film = new THREE.MeshPhysicalMaterial({ color: '#d99a2b', roughness: .35, transmission: .0, transparent: true, opacity: .72, clearcoat: .6 });
  for (let p = 0; p < 3; p++) {
    mesh(rbox(11.4, .14, .62, .03), copperBare, { parent: INV, x: XC + .6, y: YP + .75, z: PHZ[p], part: 'DC− busbar' });
    mesh(rbox(11.6, .06, .8, .02), film, { parent: INV, x: XC + .6, y: YP + .86, z: PHZ[p], part: 'busbar insulation' });
    mesh(rbox(11.4, .14, .62, .03), copperBare, { parent: INV, x: XC + .6, y: YP + .97, z: PHZ[p], part: 'DC+ busbar' });
  }
  mesh(rbox(.7, .5, 13.6, .06), copperBare, { parent: INV, x: XC + 6.25, y: YP + .86, part: 'DC busbar spine' });
  // AC phase busbars down to the motor terminals, each through a gapped ferrite core (current sensor)
  const ferr = M('#3a3d42', { roughness: .7, metalness: .2 }); const TZ = [-4.15, 0, 4.15];
  for (let p = 0; p < 3; p++) {
    const pts = [[XC - 5.4, YP + .6, PHZ[p]], [XC - 6.6, YP + .6, PHZ[p]], [-7.6, YP - .2, (PHZ[p] + TZ[p]) / 2], [-8.9, YP - 1.0, TZ[p]], [-8.9, 13.2, TZ[p]]];
    const c = new THREE.CatmullRomCurve3(pts.map(q => V3(...q)), false, 'centripetal', .2);
    const g = new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-.12, -.42); s.lineTo(.12, -.42); s.lineTo(.12, .42); s.lineTo(-.12, .42); s.closePath(); return s; })(), { steps: 40, extrudePath: c, bevelEnabled: false });
    mesh(g, copperBare, { parent: INV, part: 'AC busbar ' + 'UVW'[p] });
    const cs = new THREE.Shape(); cs.moveTo(-.95, -.7); cs.lineTo(.95, -.7); cs.lineTo(.95, .7); cs.lineTo(.08, .7); cs.lineTo(.08, .45); cs.lineTo(.7, .45); cs.lineTo(.7, -.45); cs.lineTo(-.7, -.45); cs.lineTo(-.7, .45); cs.lineTo(-.08, .45); cs.lineTo(-.08, .7); cs.lineTo(-.95, .7); cs.closePath();
    const cg = new THREE.ExtrudeGeometry(cs, { depth: .55, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1 }); cg.rotateY(Math.PI / 2);
    mesh(cg, ferr, { parent: INV, x: XC - 6.2, y: YP + .6, z: PHZ[p], part: 'current sensor core' });
  }
  // DC-link film capacitor: potted case + (visible in cutaway) wound film elements with sprayed (schoopage) ends
  const CAP = new THREE.Group(); CAP.position.set(XC + 8.6, YP + 1.4, 0); INV.add(CAP); GRP.cap = CAP;
  TX.capLbl = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#2b2e33'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(230,232,235,.7)'; g.font = '600 34px Inter, sans-serif'; g.fillText('DC-LINK  FILM CAP', 24, 62); g.font = '500 24px "JetBrains Mono", monospace'; g.fillText('~ 900 µF   500 VDC   (illustrative)', 24, 110); });
  const capCase = new THREE.MeshPhysicalMaterial({ color: '#33363b', roughness: .6, metalness: .05, transparent: true, opacity: 1 }); GRP.capCaseMat = capCase;
  const cc = mesh(rbox(3.4, 3.0, 16.2, .2), capCase, { parent: CAP, part: 'DC-link capacitor case' }); GRP.capCase = cc;
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.4), M('#ffffff', { map: TX.capLbl, roughness: .6, transparent: true })); lb.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); lb.position.y = 1.51; CAP.add(lb); lb.userData.part = 'capacitor label'; GRP.capLbl = lb;
  TX.film = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#a7a9ad'; g.fillRect(0, 0, w, h); for (let r = 8; r < 128; r += 2.2) { g.strokeStyle = `rgba(${200 + (r % 5) * 8},${195 + (r % 3) * 10},${180},.55)`; g.beginPath(); g.ellipse(128, 128, r, r * .62, 0, 0, TAU); g.stroke(); } });
  const elemSide = M('#a99d78', { roughness: .45, metalness: .25 }), elemEnd = M('#b9bcc0', { map: TX.film, metalness: .8, roughness: .55 });
  const eg = new THREE.CylinderGeometry(1.15, 1.15, 2.7, 32); eg.scale(1, 1, .62);
  for (let i = 0; i < 6; i++) { const m = mesh(eg, [elemSide, elemEnd, elemEnd], { parent: CAP, z: -6.6 + i * 2.64, part: 'film winding element' }); m.rotation.z = Math.PI / 2; m.rotation.y = 0; m.visible = false; (GRP.capElems = GRP.capElems || []).push(m); }
  const hv = M('#f07c1e', { roughness: .45 });
  for (const z of [-1.4, 1.4]) { const g = new THREE.CylinderGeometry(.6, .6, 1.8, 32); const m = mesh(g, hv, { parent: CAP, x: 1.9, z, part: 'HV DC connector' }); m.rotation.z = Math.PI / 2; const r = mesh(new THREE.TorusGeometry(.62, .1, 8, 32), M('#1b1c1f'), { parent: CAP, x: 2.6, z }); r.rotation.y = Math.PI / 2; }
  // gate-driver / control PCB (FR-4 with traces), lifted above the modules
  TX.pcb = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#123a2a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(190,160,80,.55)'; g.lineWidth = 3;
    for (let i = 0; i < 160; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { Math.random() < .5 ? x += (Math.random() - .5) * 200 : y += (Math.random() - .5) * 200; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(210,200,170,.8)'; for (let i = 0; i < 300; i++) g.fillRect(Math.random() * w, Math.random() * h, 6, 6);
    g.fillStyle = 'rgba(240,240,240,.75)'; g.font = '600 26px "JetBrains Mono", monospace'; g.fillText('GATE DRIVE · 6× ISOLATED', 40, 50); g.fillText('DSP  F2837x', 640, 520); });
  const PCB = new THREE.Group(); PCB.position.set(XC, YP + 2.4, 0); INV.add(PCB); GRP.pcb = PCB;
  mesh(rbox(12.6, .16, 16.4, .05), [M('#123a2a', { roughness: .5 }), M('#123a2a', { roughness: .5 }), M('#ffffff', { map: TX.pcb, roughness: .45 }), M('#0f2c20'), M('#123a2a'), M('#123a2a')], { parent: PCB, part: 'gate-driver PCB' });
  const ic = M('#141518', { roughness: .5 });
  for (let p = 0; p < 3; p++) for (const s of [-1, 1]) mesh(rbox(.9, .14, .7, .03), ic, { parent: PCB, x: -3.6, y: .15, z: PHZ[p] + s * 1.1, part: 'gate driver IC' });
  mesh(rbox(1.7, .14, 1.7, .04), ic, { parent: PCB, x: 3.2, y: .15, z: .2, part: 'DSP / MCU' });
  for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(.18, .18, 2.3, 12), stainless, { parent: INV, x: XC + (i % 2 ? 5.9 : -5.9), y: YP + 1.2, z: i < 2 ? -7.8 : 7.8, part: 'PCB standoff' });
}
