// ================= SM: one Hopper-style streaming multiprocessor + a 16×16 tensor-core MMA =================
const SMV = { g: new THREE.Group(), Z: -40, parts: [], lab: {}, warps: [] };
SMV.g.position.set(0, 0, SMV.Z); scene.add(SMV.g);
boxR(-4.2, 9.4, -.25, 0, -3.3, 3.0, MAT.pcb2, SMV.g);
boxR(-4.0, 4.0, 0, .12, -3.1, 2.8, MAT.si2, SMV.g);
const sb = (x0, x1, z0, z1, col, info, h = .26, par = SMV.g) => { const m = gmat(col); const b = boxR(x0, x1, .12, h, z0, z1, m, par); if (info) pickable(b, info); return { m, b }; };
SMV.icache = sb(-3.9, 3.9, -3.0, -2.7, '#3d4250', { name: B('L1 instruction cache', 'L1 指令缓存'), fn: B('Instruction cache shared across the SM.', '整个 SM 共享的指令缓存。'), v: () => '' });
for (let p = 0; p < 4; p++) {
  const x0 = -3.9 + p * 1.97, x1 = x0 + 1.85, P = { x0, x1, warps: [] };
  P.sched = sb(x0, x1, -2.6, -2.15, '#454a58', { name: B(`Subpartition ${p} · Warp scheduler`, `子分区 ${p} · Warp 调度器`), fn: B('Each cycle, issues an instruction from a resident warp with ready operands. A warp has 32 threads executing one instruction (SIMT). While one waits for memory, another runs: parallelism hides latency rather than CPU-style large caches/out-of-order execution.', '每周期从驻留的 warp 里挑一个"操作数已就绪"的发射一条指令。一个 warp = 32 个线程同步执行同一条指令 (SIMT)。等内存的 warp 先挂起，切到别的 warp —— 用并行度掩盖延迟，而不是靠 CPU 那样的大缓存/乱序。'), v: () => tr(B('Up to 16 warps/subpartition (H100: 64/SM)', '最多 16 warps/子分区 (H100: 64/SM)')) });
  P.rf = sb(x0, x1, -2.05, -1.15, '#3a3f4c', { name: B(`64 KB register file (subpartition ${p})`, `寄存器堆 64 KB (子分区 ${p})`), fn: B('256 KB of registers per SM, larger than L1. Switching threads costs nothing because every resident warp\'s registers remain allocated here.', '每个 SM 共 256 KB 寄存器 —— 比 L1 还大。线程切换零开销，因为每个驻留 warp 的寄存器都一直在这里。'), v: () => '16,384 × 32-bit' });
  for (let b = 0; b < 4; b++) boxR(x0 + .05 + b * .45, x0 + .45 + b * .45, .26, .29, -2.0, -1.2, MAT.l2, SMV.g, { edge: false });
  P.alu = sb(x0, x1, -1.05, -.3, '#363a44', { name: 'FP32 ×32 · INT32 ×16 · FP64 ×16', fn: B('Standard CUDA cores: one FMA per lane per cycle. H100 delivers ≈ 67 TFLOP/s FP32, only 1/15 of its Tensor Core throughput.', '普通 CUDA core：每周期每 lane 一个 FMA。整颗 H100 ≈ 67 TFLOP/s FP32 —— 只有 Tensor Core 的 1/15。'), v: () => '' });
  P.lanes = []; for (let l = 0; l < 32; l++) { const m = gmat('#2e3444'); P.lanes.push(m); const lx = x0 + .07 + (l % 16) * .107, lz = -.98 + Math.floor(l / 16) * .33; boxR(lx, lx + .08, .26, .32, lz, lz + .26, m, SMV.g, { edge: false }); }
  P.tc = sb(x0, x1, -.2, .7, '#2f4266', { name: B(`Tensor Core (4th generation) · Subpartition ${p}`, `Tensor Core (第 4 代) · 子分区 ${p}`), fn: B('Hardware for small matrix multiply-adds D = A·B + C (e.g. 16×16×16 FP16 tiles with FP32 accumulation). One MMA instruction ≈ 4096 multiply-adds. More than 95% of LLM FLOPs execute here.', '专做小矩阵乘加 D = A·B + C 的硬件 (如 16×16×16 的 FP16 块，FP32 累加)。一条 MMA 指令 ≈ 4096 次乘加。LLM 里 >95% 的 FLOP 都跑在这里。'), v: () => tr(B('Full GPU: ', '整卡 ')) + (GPUS[CFG.gpu].peak / 1e12).toFixed(0) + ' TFLOP/s FP16 dense' }, .42);
  P.ldst = sb(x0, x1 - .8, .8, 1.15, '#4a4334', { name: B('LD/ST units', 'LD/ST 单元'), fn: B('Memory instructions read/write shared memory, L1 and global memory.', '访存指令：从 shared memory / L1 / 全局内存读写。'), v: () => '' });
  P.sfu = sb(x1 - .7, x1, .8, 1.15, '#3c3f47', { name: 'SFU', fn: B('Special function units: exp, rsqrt, sin… (including softmax\'s exp).', '特殊函数单元：exp、rsqrt、sin… (softmax 里的 exp 在这里)。'), v: () => '' });
  for (let w = 0; w < 16; w++) { const m = gmat('#555a66'); const b = boxR(x0 + .06 + w * .111, x0 + .14 + w * .111, .26, .34, -2.52, -2.24, m, SMV.g, { edge: false }); P.warps.push({ m, b, st: 0 }); }
  SMV.parts.push(P);
}
SMV.smem = sb(-3.9, 3.0, 1.35, 2.65, '#3d4250', { name: 'L1 / Shared Memory 256 KB', fn: B('Programmable on-chip SRAM (up to 228 KB as shared memory). GEMM and FlashAttention tile HBM data into it for reuse, raising arithmetic intensity.', '可编程的片上 SRAM (最多 228 KB 作 shared memory)。GEMM 和 FlashAttention 把 HBM 数据切块搬进来反复使用 —— 这就是"提高算术强度"。'), v: () => tr(B('~33 TB/s aggregate across GPU (illustrative)', '~33 TB/s 级 (整卡聚合, 示意)')) });
SMV.tma = sb(3.1, 3.9, 1.35, 2.65, '#4a444a', { name: B('TMA (Tensor Memory Accelerator)', 'TMA (张量内存加速器)'), fn: B('Introduced with Hopper: asynchronously transfers an entire tensor tile from global to shared memory with one instruction, without occupying worker threads.', 'Hopper 新增：一条指令就把一整块张量 tile 从全局内存异步搬进 shared memory，不占线程。'), v: () => '' });
// outside the SM: L2 slice and an HBM stack
SMV.l2 = sb(5.0, 6.4, -2.4, 2.4, '#454a5a', { name: B('L2 cache (chip-wide shared)', 'L2 cache (全芯片共享)'), fn: B('Shared by all SMs: 50 MB (H100).', '所有 SM 共享，50 MB (H100)。'), v: () => GPUS[CFG.gpu].l2 + ' MB' }, .5);
SMV.hbm = new THREE.Group(); SMV.hbm.position.set(8.0, .12, 0); SMV.g.add(SMV.hbm);
boxR(-.85, .85, 0, .1, -1.1, 1.1, MAT.base, SMV.hbm); for (let k = 0; k < 8; k++) boxR(-.8, .8, .12 + k * .12, .22 + k * .12, -1.05, 1.05, MAT.dram, SMV.hbm, { edge: k === 7 });
pickable(SMV.hbm.children[8], { name: B('HBM (off-chip DRAM stacks)', 'HBM (片外 DRAM 堆栈)'), fn: B('Holds weights and KV cache. The longest, slowest path to the SM: 3.35 TB/s versus 989 TFLOP/s requires ~295 operations per byte to saturate Tensor Cores.', '所有权重和 KV cache 住在这里。到 SM 的路径最长、最慢：带宽 3.35 TB/s 对比 989 TFLOP/s → 每字节要做 ~295 次运算才能喂饱 Tensor Core。'), v: () => (GPUS[CFG.gpu].bw / 1e12).toFixed(2) + ' TB/s' });
// data path HBM → L2 → SMEM → RF → TC (sub-partition 0)
const Zs = SMV.Z;
SMV.path = path([[8.0, 1.25, Zs], [8.0, 1.35, Zs + 1.6], [5.7, .75, Zs + 1.6], [5.7, .75, Zs + 2.0], [2.0, .5, Zs + 2.0], [-2.95, .5, Zs + 2.0], [-2.95, .5, Zs + 1.25], [-2.95, .45, Zs - 1.6], [-2.95, .6, Zs + .25]]);
// MMA visual: A(16×16) · B(16×16) → C, floating above
SMV.mma = new THREE.Group(); SMV.mma.position.set(0, 2.1, SMV.Z - .2); scene.add(SMV.mma);
SMV.cell = new THREE.InstancedMesh(new THREE.BoxGeometry(.1, .1, .03), new THREE.MeshBasicMaterial({ toneMapped: false }), 768); SMV.mma.add(SMV.cell);
SMV.mmaX = [-3.4, -.8, 2.0];
{ const o = new THREE.Object3D(); let n = 0; for (let g = 0; g < 3; g++) for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) { o.position.set(SMV.mmaX[g] + c * .12, 1.8 - r * .12, 0); o.updateMatrix(); SMV.cell.setMatrixAt(n, o.matrix); SMV.cell.setColorAt(n++, _gc.set('#2a2b30')); } }
SMV.mmaK = -1; SMV.mmaAcc = 0;
function smMMA(k, acc) {
  let n = 0; const A = _gc;
  for (let g = 0; g < 3; g++) for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
    let col = '#2a2b30', kk = 0;
    if (g === 0) { col = '#33435c'; if (c === k) { col = '#7fb0ff'; } }
    else if (g === 1) { col = '#33435c'; if (r === k) col = '#7fb0ff'; }
    else { kk = clamp(acc); A.set('#2a2b30').lerp(_pc.set('#5fc39c'), kk * (.55 + .45 * fract(Math.sin((r * 16 + c) * 3.1) * 99))); SMV.cell.setColorAt(n++, A); continue; }
    SMV.cell.setColorAt(n++, A.set(col));
  }
  SMV.cell.instanceColor.needsUpdate = true;
}
smMMA(-1, 0);
const sl = (k, html, pos, o = {}) => SMV.lab[k] = label(html, pos, Object.assign({ group: SMV.g }, o));
sl('sched', B('Warp scheduler', 'Warp 调度器'), V3(-2.95, .4, Zs - 2.4), { pri: 4, side: 'l' }); sl('rf', B('256 KB register file', '寄存器堆 256 KB'), V3(-1.0, .4, Zs - 1.6), { pri: 3 });
sl('alu', 'FP32 lanes', V3(1.0, .4, Zs - .65), { pri: 2 }); sl('tc', 'Tensor Core ×4', V3(2.9, .5, Zs + .25), { pri: 5 });
sl('smem', 'Shared Mem / L1 256 KB', V3(-.5, .4, Zs + 2.0), { pri: 4 }); sl('l2', 'L2', V3(5.7, .6, Zs - 2.7), { pri: 3 }); sl('hbm', 'HBM', V3(8.0, 1.4, Zs - 1.4), { pri: 4 });
SMV.lab.A = label('A 16×16', V3(-2.5, 4.15, Zs - .2), { group: SMV.mma, pri: 6 }); SMV.lab.B = label('B 16×16', V3(.1, 4.15, Zs - .2), { group: SMV.mma, pri: 6 });
SMV.lab.C = label('C += A·B', V3(2.9, 4.15, Zs - .2), { group: SMV.mma, pri: 6 }); SMV.lab.k = label('', V3(0, 1.85, Zs - .2), { group: SMV.mma, pri: 7, cls: 'big' });
SMV.warpSim = { t: 0 };
function smTick(dt, busy) {
  // warp scheduling: each sub-partition issues one ready warp per "cycle"; stalled warps wait on memory (amber)
  const W = SMV.warpSim; W.t += dt * 6; const cyc = Math.floor(W.t);
  SMV.parts.forEach((P, pi) => {
    P.warps.forEach((w, wi) => { const h = fract(Math.sin((wi + 1) * 17.3 + pi * 7.1 + Math.floor((cyc + wi * 3) / 7) * 1.7) * 9871); const stalled = busy && h < .55; const issue = busy && !stalled && ((cyc + pi) % 16) === wi; w.m.color.set(issue ? '#4a8ad6' : stalled ? '#6d5a33' : '#555a66'); glow(w.m, issue ? .9 : 0, '#4a8ad6'); });
    glow(P.tc.m, busy ? .25 + .15 * Math.sin(SIM.t * 8 + pi) : 0, '#4a8ad6');
    { const ph = W.t - cyc; P.lanes.forEach((m, l) => glow(m, busy === 'alu' ? .18 + .55 * Math.max(0, 1 - Math.abs(ph * P.lanes.length - l) / 2.5) : 0, '#4a8ad6')); }
  });
}
SMV.g.visible = false; SMV.mma.visible = false;
