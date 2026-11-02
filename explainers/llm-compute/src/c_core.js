// ================= CORE: one out-of-order CPU core pipeline (toy model driven by OOO) =================
const CORE = { g: new THREE.Group(), Z: 40, tiles: [], ports: [], lab: {}, cyc: .42 };
CORE.g.position.set(0, 0, CORE.Z); scene.add(CORE.g);
boxR(-7.6, 7.6, -.25, 0, -4.1, 3.3, MAT.pcb2, CORE.g);
function stage(nm, x0, x1, z0, z1, col, info, h = .22) { const m = gmat(col); const b = boxR(x0, x1, 0, h, z0, z1, m, CORE.g); if (info) pickable(b, Object.assign({ name: nm }, info)); return { m, b, c: V3((x0 + x1) / 2, h, (z0 + z1) / 2) }; }
CORE.st = {
  bp: stage(B('Branch predictor (BPU)', '分支预测器 BPU'), -7.2, -5.4, -2.6, -.8, '#3f4450', { fn: B('Predicts the next instruction address (whether a branch/loop is taken). Modern predictors exceed 95% accuracy; a miss flushes the pipeline, costing ~15–20 cycles.', '猜下一条要取的指令地址 (if/循环跳不跳)。现代预测器准确率 >95%；猜错就要冲刷流水线，浪费 ~15–20 个周期。'), v: () => tr(B('Mispredictions: ', '误预测 ')) + OOO.flushes + tr(B('', ' 次')) }, .36),
  l1i: stage(B('L1 instruction cache', 'L1 指令缓存'), -7.2, -5.4, -.5, 1.6, '#3d4250', { fn: B('~32 KB; supplies instruction fetch within 1 cycle.', '~32 KB，1 个周期内供给取指单元。'), v: () => tr(B('32 KB (typical)', '32 KB (典型)')) }, .36),
  fe: stage(B('Fetch', '取指 Fetch'), -5.0, -3.9, -2.6, 2.4, '#40444e', { fn: B('Fetches 4–8 instructions per cycle (4 here).', '每周期取 4–8 条指令 (这里 4)。'), v: () => tr(B('Width: 4', '宽度 4')) }),
  de: stage(B('Decode → μops', '译码 Decode → μops'), -3.6, -2.5, -2.6, 2.4, '#40444e', { fn: B('Splits x86 instructions into internal micro-operations (μops).', 'x86 指令拆成内部微操作 (μop)。'), v: () => '4-wide' }),
  rn: stage(B('Rename / allocate', '重命名 Rename / 分配'), -2.2, -1.2, -2.6, 2.4, '#454a58', { fn: B('Maps architectural registers (such as ymm0) to hundreds of physical registers, removing false dependencies so later instructions can execute early.', '把架构寄存器 (如 ymm0) 映射到上百个物理寄存器，消除假依赖，这样后面的指令可以提前执行。'), v: () => tr(B('~200+ physical registers', '物理寄存器 ~200+')) }),
  rs: stage(B('Scheduler / reservation station (RS)', '调度器 / 保留站 RS'), -.9, 1.3, -2.6, 2.4, '#3a3f4c', { fn: B('The heart of out-of-order execution: instructions wait for their operands, then issue as soon as ready, regardless of program order.', '乱序的核心：指令在这里等待操作数就绪，谁先就绪谁先发射，不按程序顺序。'), v: () => tr(B('Window: 24 (illustrative; ~100–500 in real cores)', '窗口 24 (示意；真实 ~100–500)')) }),
  rob: stage(B('Reorder buffer (ROB) → In-order retirement', '重排序缓冲 ROB → 按序提交'), -2.2, 5.3, -3.9, -3.05, '#353945', { fn: B('Tracks program order for all in-flight instructions. Execution may be out of order, but retirement remains in order, preserving sequential behavior and precise rollback on faults.', '记录所有在飞指令的程序顺序。执行可以乱序，但提交 (retire) 必须按序 → 对外看起来像顺序执行，出错可以精确回滚。'), v: () => tr(B('Retired: ', '已提交 ')) + OOO.retired + '/' + OOO.prog.length }, .12),
  l1d: stage(B('L1 data cache', 'L1 数据缓存'), 4.6, 6.0, .3, 2.4, '#3d4250', { fn: B('~48 KB, ~4–5 cycle latency. Two load ports can each read 64 B per cycle (one AVX-512 vector).', '~48 KB，延迟 ~4–5 周期。两个 load 端口每周期可各读 64 B (一个 AVX-512 向量)。'), v: () => '48 KB · ~5 cyc' }, .36),
  l2: stage(B('L2 (private)', 'L2 (私有)'), 6.2, 7.3, -2.6, 2.4, '#363a46', { fn: B('~1–2 MB, ~14 cycle latency. Beyond it lie shared L3 (~40–70 cyc) and DRAM (~200+ cyc).', '~1–2 MB，延迟 ~14 周期。再往外是共享 L3 (~40–70 cyc) 和 DRAM (~200+ cyc)。'), v: () => '2 MB · ~14 cyc' }, .36),
};
const PORTN = [['Load 0', 'ld'], ['Load 1', 'ld'], ['FMA 0 · AVX-512', 'fma'], ['FMA 1 · AVX-512', 'fma'], ['ALU 0', 'alu'], ['ALU/Branch', 'br']];
PORTN.forEach(([nm, k], i) => {
  const z0 = -2.6 + i * .84, m = gmat(k === 'fma' ? '#33435c' : k === 'ld' ? '#4a4334' : '#3c3f47');
  const b = boxR(1.7, 4.2, 0, .2, z0, z0 + .7, m, CORE.g);
  pickable(b, { name: B('Execution port ' + nm, '执行端口 ' + nm), fn: B(k === 'fma' ? 'SIMD unit: one vfmadd operates on 16 FP32 values (512 bit) simultaneously. This and multiple cores provide most CPU parallelism.' : k === 'ld' ? 'Load port: reads L1D with ~4–5 cycle latency.' : 'Integer ALU / branch unit.', k === 'fma' ? 'SIMD 单元：一条 vfmadd 同时对 16 个 FP32 (512 bit) 做乘加。CPU 的"并行"主要靠它 + 多核。' : k === 'ld' ? 'Load 端口：从 L1D 读数据，延迟 ~4–5 周期。' : '整数 ALU / 分支单元。'), v: () => k === 'fma' ? '16 lanes × FP32' : '1 op/cyc' });
  const P = { m, b, k, z: z0 + .35, lanes: [] };
  if (k === 'fma') for (let l = 0; l < 16; l++) { const lm = gmat('#4a8ad6'); lm.color.set('#2a3446'); P.lanes.push({ m: lm, b: boxR(2.0 + l * .13, 2.1 + l * .13, .2, .3, z0 + .12, z0 + .58, lm, CORE.g, { edge: false }) }); }
  CORE.ports.push(P);
});
const TILEG = rbox(.34, .14, .26, .03);
const KC = { ld: '#d9a441', fma: '#4a8ad6', alu: '#8a8c92', br: '#44a282' };
function coreBuild() {
  CORE.tiles.forEach(t => CORE.g.remove(t.mesh)); CORE.tiles = [];
  OOO.prog.forEach(p => { const m = M(KC[p.k], { emissive: new THREE.Color('#000'), transparent: true }); const mesh_ = mesh(TILEG, m, { parent: CORE.g, edge: false }); mesh_.visible = false; CORE.tiles.push({ p, mesh: mesh_, m, pos: V3(-6.3, .4, .5), op: 0 }); });
}
const LAT = { ld: 4, fma: 4, alu: 1, br: 1 };
function coreTarget(t, out) {
  const p = t.p, P = OOO.prog;
  if (p.st === 'fe') { const j = p.i % 4; return out.set(lerp(-4.45, -3.05, clamp((CORE.sub || 0) * 1.4)), .32, -2.0 + j * 1.2); }
  if (p.st === 'rs') { const rs = P.filter(q => q.st === 'rs'); const s = rs.indexOf(p); return out.set(-.6 + (s % 4) * .52, .32, -2.25 + Math.floor(s / 4) * .42); }
  if (p.st === 'exec') { const same = P.filter(q => q.st === 'exec' && (q.k === p.k || (p.k !== 'fma' && p.k !== 'ld' && q.k !== 'fma' && q.k !== 'ld'))); let pi = PORTN.findIndex(x => x[1] === p.k || (p.k === 'alu' && x[1] === 'alu')); const s = same.indexOf(p); if (p.k === 'br') pi = 5; else if (p.k === 'alu') pi = 4; else pi += Math.min(1, s); const prog = clamp((OOO.cyc - p.tI + (CORE.sub || 0)) / p.lat); return out.set(lerp(1.9, 4.0, prog), .34, CORE.ports[pi].z); }
  if (p.st === 'done') { const slot = p.i - OOO.retired; return out.set(-2.0 + clamp(slot, 0, 23) * .3, .26, -3.48); }
  if (p.st === 'ret') return out.set(6.0, .26, -3.48);
  return out.set(-6.3, .32, .5);
}
const _ct = new THREE.Vector3();
function coreTick(dt) {
  for (const t of CORE.tiles) {
    const p = t.p, show = p.st !== 'wait' && !(p.st === 'ret' && OOO.cyc - p.tR > 3);
    coreTarget(t, _ct); if (!t.mesh.visible && show) t.pos.copy(_ct).add(V3(-.6, 0, 0));
    t.pos.x = damp(t.pos.x, _ct.x, 10, dt); t.pos.y = damp(t.pos.y, _ct.y, 10, dt); t.pos.z = damp(t.pos.z, _ct.z, 10, dt);
    t.mesh.position.copy(t.pos);
    const fl = p.flushed && OOO.cyc - p.flushed < 3;
    t.op = damp(t.op, show || fl ? 1 : 0, 8, dt); t.m.opacity = t.op; t.mesh.visible = t.op > .02;
    if (fl) { t.m.color.set(COL.bad); if (!show) t.mesh.position.y += .3; } else t.m.color.set(KC[p.k]);
    t.m.emissive.set(p.st === 'exec' ? KC[p.k] : '#000').multiplyScalar(p.st === 'exec' ? .5 : 0);
  }
  CORE.ports.forEach((P, i) => {
    const busy = OOO.prog.some(p => p.st === 'exec' && (i === 5 ? p.k === 'br' : i === 4 ? p.k === 'alu' : p.k === P.k));
    glow(P.m, busy ? .35 : 0);
    P.lanes.forEach((l, j) => { l.m.color.set(busy ? '#4a8ad6' : '#2a3446'); glow(l.m, busy ? .5 + .3 * Math.sin(SIM.t * 9 + j) : 0); });
  });
  glow(CORE.st.bp.m, OOO.stall && OOO.cyc < OOO.stall ? .5 : 0, COL.bad);
}
const cl = (k, html, x, z, o = {}) => CORE.lab[k] = label(html, () => V3(x, .45, CORE.Z + z), Object.assign({ group: CORE.g }, o));
cl('bp', B('Branch prediction', '分支预测'), -6.3, -2.9, { pri: 3 }); cl('fe', B('Fetch → Decode', '取指 → 译码'), -3.8, -2.95, { pri: 4 }); cl('rn', B('Rename', '重命名'), -1.7, 2.75, { pri: 3 });
cl('rs', B('Schedule (out of order)', '调度 (乱序发射)'), .2, 2.75, { pri: 5 }); cl('ports', B('Execution ports ×6', '执行端口 ×6'), 2.9, 2.75, { pri: 4 }); cl('simd', 'AVX-512: 16×FP32', 3.6, -.25, { pri: 2, side: 'r' });
cl('rob', B('ROB → In-order retirement', 'ROB → 按序提交'), 1.6, -4.2, { pri: 5 }); cl('l1d', 'L1D 48 KB', 5.3, 2.75, { pri: 2 }); cl('l2', 'L2 2 MB', 6.75, -2.95, { pri: 2 });
CORE.g.visible = false;
