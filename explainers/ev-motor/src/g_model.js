// ================= g_model: preview harness for the model build (views for fidelity sheets, perf/audit hooks) =================
const VIEWS = {
  overview: { pos: [40, 30, 46], tgt: [0, 5, 0] },
  weld: { pos: [-36, 16, 24], tgt: [-9, 0, 0], hide: ['housing', 'inv', 'resolver', 'rotor', 'brg'] },
  crown: { pos: [34, 16, 24], tgt: [6, 0, 0], hide: ['housing', 'inv', 'rotor', 'brg'] },
  rotor: { pos: [30, 20, 38], tgt: [0, 0, 0], hide: ['housing', 'inv', 'stator', 'resolver'] },
  lam: { pos: [36, 3, 0.01], tgt: [0, 0, 0], hide: ['housing', 'inv', 'resolver', 'winding', 'brg', 'ends'] },
  resolver: { pos: [-24, 8, 14], tgt: [-11.4, 0, 0], hide: ['housing', 'inv', 'stator', 'rotor', 'brg'] },
  modules: { pos: [14, 30, 18], tgt: [2, 14.6, 0], hide: ['pcb', 'housing'] },
  cap: { pos: [28, 26, 20], tgt: [10.8, 16, 0], hide: ['pcb'], capCut: 1 },
};
const CLIP = new THREE.Plane(V3(1, 0, 0), 0);
function setView(name) {
  const v = VIEWS[name] || VIEWS.overview;
  for (const k of ['housing', 'inv', 'resolver', 'stator', 'rotor', 'pcb', 'winding', 'brg']) GRP[k].visible = !(v.hide || []).includes(k); for (const e of GRP.ends) e.visible = !(v.hide || []).includes('ends');
  GRP.capCase.visible = GRP.capLbl.visible = !v.capCut; for (const e of GRP.capElems) e.visible = !!v.capCut;
    camera.position.set(...v.pos); controls.target.set(...v.tgt); controls.update(); return name;
}
let T = 0;
function render() { renderer.render(scene, camera); }
function loop() { requestAnimationFrame(loop); T += 1 / 60; if (!/still/.test(QS)) { GRP.rotor.rotation.z = T * .6; GRP.resRotor.rotation.z = T * .6; } controls.update(); render(); }
setView((QS.match(/view=(\w+)/) || [])[1] || 'overview'); loop();
window.__view = n => { const r = setView(n); render(); return r; };
window.__perf = () => { render(); const i = renderer.info; return { calls: i.render.calls, tris: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, texMB: +(Object.values(TX).reduce((a, t) => a + (t.image ? t.image.width * t.image.height * 4 * 1.33 : 0), 0) / 1048576).toFixed(1) }; };
window.__audit = () => { const out = { primitives: [], metalNoEnv: [] }; scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; const m = [].concat(o.material)[0]; if (/^(Box|Sphere|Cylinder|Plane)Geometry$/.test(o.geometry.type) && !(m.map || m.bumpMap || m.normalMap)) out.primitives.push(o.userData.part || o.geometry.type); if (m.metalness > .5 && !scene.environment && !m.envMap) out.metalNoEnv.push(o.userData.part); }); out.pass = !out.metalNoEnv.length; return out; };
window.__ready = true;
