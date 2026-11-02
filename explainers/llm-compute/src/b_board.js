// ================= BOARD: host CPU package + DIMMs + PCIe + GPU package (interposer, HBM, GPCs/SMs) =================
const BD = { g: new THREE.Group(), lab: {}, mats: {}, stacks: [], smPos: [], cores: [], links: [] };
scene.add(BD.g);
const MAT = {
  pcb: M('#1a1f1d', { roughness: .8 }), pcb2: M('#161a19', { roughness: .85 }),
  sub: M('#25262b', { roughness: .7 }), si: M('#34363d', { roughness: .32, metalness: .35 }), si2: M('#2b2d33', { roughness: .4, metalness: .3 }),
  inter: M('#3e434b', { roughness: .3, metalness: .45 }), gold: M('#b08a4a', { roughness: .35, metalness: .85 }), copper: M('#8a6a45', { roughness: .4, metalness: .8 }),
  dram: M('#2e3036', { roughness: .45, metalness: .25 }), base: M('#3a3d45', { roughness: .4, metalness: .3 }), dimm: M('#20252a', { roughness: .7 }),
  chip: M('#121316', { roughness: .5 }), l2: M('#3d4250', { roughness: .35, metalness: .3 }), phy: M('#454045', { roughness: .4, metalness: .4 }),
};
const glowMats = [];
function gmat(col, o = {}) { const m = M(col, Object.assign({ emissive: new THREE.Color('#000') }, o)); m.userData.col = new THREE.Color(col); glowMats.push(m); return m; }
function glow(m, k, col) { m.emissive.copy(col ? _gc.set(col) : m.userData.col).multiplyScalar(k); }
const _gc = new THREE.Color();
// ---- PCB ----
boxR(-16, 13, -.22, 0, -7, 7, MAT.pcb, BD.g);
for (let i = 0; i < 26; i++) { const z = -6.5 + i * .52; if (Math.abs(z) < 4.2) continue; boxR(-15.5, 12.5, 0, .006, z, z + .03, MAT.pcb2, BD.g, { shadow: false, edge: false }); }
// ---- CPU package ----
const CPU = { g: new THREE.Group(), X: -8 }; CPU.g.position.set(CPU.X, 0, 0); BD.g.add(CPU.g);
boxR(-2.6, 2.6, 0, .2, -2.6, 2.6, MAT.sub, CPU.g);
const cpuDie = boxR(-1.6, 1.6, .2, .3, -1.3, 1.3, MAT.si, CPU.g);
pickable(cpuDie, { name: B('CPU die · Host processor', 'CPU die · 主机处理器'), fn: B('A few large, complex cores (8 illustrated here; 32–128 in servers): deep pipelines, out-of-order execution, large caches and branch prediction. Optimized for single-thread latency. Handles tokenization, scheduling, GPU kernel launches and sampling.', '少量 (这里 8 个示意；服务器 32–128 个) 大而复杂的核心：深流水线、乱序执行、大缓存、分支预测。为"单线程延迟"而优化。负责分词、调度、启动 GPU kernel、采样。'), v: () => tr(B('Peak ≈ ', '峰值 ≈ ')) + (CPUSPEC.peak / 1e12).toFixed(0) + tr(B(' TFLOP/s FP32 (illustrative)', ' TFLOP/s FP32 (示意)')) });
const L3 = boxR(-1.5, 1.5, .3, .335, -.2, .2, gmat('#46495a'), CPU.g);
pickable(L3, { name: B('L3 cache (shared)', 'L3 cache (共享)'), fn: B('The last-level cache shared by all cores: tens to hundreds of MB in servers. Latency ~10–20 ns, far below DRAM (~80–100 ns).', '所有核心共享的末级缓存，几十到几百 MB (服务器)。延迟 ~10–20 ns，远低于 DRAM (~80–100 ns)。'), v: () => tr(B('Typical: 32–384 MB', '典型 32–384 MB')) });
for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
  const x = -1.12 + c * .747, z = r ? .72 : -.72, m = gmat('#4b4e58');
  const core = boxR(x - .33, x + .33, .3, .36, z - .45, z + .45, m, CPU.g);
  const l2 = boxR(x - .33, x + .33, .36, .372, r ? z - .45 : z + .2, r ? z - .2 : z + .45, MAT.l2, CPU.g, { edge: false });
  BD.cores.push({ m, mesh: core, x, z });
  pickable(core, { name: B(`CPU core ${r * 4 + c}`, `CPU 核心 ${r * 4 + c}`), fn: B('A complete out-of-order core: fetch/decode/rename/schedule/execution ports/retirement, plus private L1 (~48 KB) and L2 (~1–2 MB). Step 2 zooms inside.', '一个完整的乱序核心：取指/译码/重命名/调度/执行端口/提交，外加私有 L1 (~48 KB) 与 L2 (~1–2 MB)。第 2 步放大看内部。'), v: () => '~' + CPUSPEC.ghz + tr(B(' GHz · 2×AVX-512 FMA (illustrative)', ' GHz · 2×AVX-512 FMA (示意)')) });
}
boxR(-1.58, -1.4, .3, .34, -1.1, 1.1, MAT.phy, CPU.g); boxR(1.4, 1.58, .3, .34, -1.1, 1.1, MAT.phy, CPU.g);
// DIMMs
const DIMM = new THREE.Group(); DIMM.position.set(-13.4, 0, 0); BD.g.add(DIMM);
for (let i = 0; i < 4; i++) {
  const x = i * .55; const s = boxR(x - .06, x + .06, .25, 1.6, -3.2, 3.2, MAT.dimm, DIMM); boxR(x - .1, x + .1, 0, .3, -3.35, 3.35, MAT.chip, DIMM);
  for (let k = 0; k < 8; k++) boxR(x + .06, x + .1, .55, 1.2, -2.9 + k * .74, -2.4 + k * .74, MAT.chip, DIMM, { edge: false });
  if (!i) pickable(s, { name: B('DDR5 memory module (DIMM)', 'DDR5 内存条 (DIMM)'), fn: B('CPU main memory offers large capacity (TB scale), but only ~0.3 TB/s bandwidth (8–12 channels). An order of magnitude below GPU HBM.', 'CPU 的主存：容量大 (TB 级)，但带宽只有 ~0.3 TB/s 量级 (8–12 通道)。比 GPU 的 HBM 慢一个数量级。'), v: () => '~' + (CPUSPEC.bw / 1e12).toFixed(1) + tr(B(' TB/s (illustrative)', ' TB/s (示意)')) });
}
for (let k = 0; k < 6; k++) { const z = -1.6 + k * .64; wire([[-12.9, .02, z * 1.4], [-11.2, .02, z * 1.4], [-10.4, .02, z], [-9.6, .02, z]], .025, MAT.copper, BD.g); }
// PCIe lanes
const PCIE = { curves: [] };
for (let k = 0; k < 8; k++) { const z = -.7 + k * .2; const pts = [[-5.4, .03, z], [-3, .03, z], [-1.6, .03, z * 1.7], [.6, .03, z * 1.7]]; wire(pts, .022, MAT.gold, BD.g); PCIE.curves.push(path(pts.map(p => [p[0], .1, p[2]]))); }
PCIE.lane = boxR(-3.5, -2.3, 0, .01, -.85, .85, MAT.pcb2, BD.g, { edge: false });
pickable(PCIE.lane, { name: B('PCIe Gen5 ×16 link', 'PCIe Gen5 ×16 链路'), fn: B('The CPU ↔ GPU host link carries token IDs, kernel launch commands and logits/results. ~64 GB/s per direction (public specification), ~50× below HBM, so weights must remain on the GPU.', 'CPU ↔ GPU 的主机链路：传 token id、kernel 启动命令、logits/结果。每方向 ~64 GB/s (公开规格)，比 HBM 慢 ~50×，所以权重必须常驻在 GPU 上。'), v: () => tr(B('~64 GB/s per direction', '~64 GB/s 每方向')) });
// ---- GPU package ----
function makeGPU(full = true) {
  const G = { g: new THREE.Group(), stacks: [], smInst: null, smPos: [], phys: [] };
  boxR(-4.6, 4.6, 0, .25, -3.6, 3.6, MAT.sub, G.g);
  G.inter = boxR(-3.2, 3.2, .25, .34, -2.6, 2.6, MAT.inter, G.g);
  G.die = new THREE.Group(); G.g.add(G.die);
  G.dieM = boxR(-2.35, 2.35, .34, .46, -1.35, 1.35, MAT.si, G.die);
  G.l2m = gmat('#454a5a'); G.l2 = [boxR(-2.2, -.05, .46, .49, -.17, .17, G.l2m, G.die), boxR(.05, 2.2, .46, .49, -.17, .17, G.l2m, G.die)];
  G.phym = gmat('#4a444a'); boxR(-2.32, -2.2, .46, .48, -1.2, 1.2, G.phym, G.die); boxR(2.2, 2.32, .46, .48, -1.2, 1.2, G.phym, G.die);
  boxR(-2.2, 2.2, .46, .475, -1.32, -1.24, G.phym, G.die, { edge: false }); boxR(-2.2, 2.2, .46, .475, 1.24, 1.32, G.phym, G.die, { edge: false });
  // 8 GPCs × 18 SMs = 144 SM tiles (full die); enabled count depends on SKU
  const geo = new THREE.BoxGeometry(.19, .05, .25);
  G.smInst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .35, metalness: .2 }), 144);
  G.smInst.castShadow = true; G.smInst.receiveShadow = true; G.die.add(G.smInst);
  const o = new THREE.Object3D(); let n = 0;
  G.gpcBox = [];
  for (let gr = 0; gr < 2; gr++) for (let gc = 0; gc < 4; gc++) {
    const x0 = -2.12 + gc * 1.07, z0 = gr ? .26 : -1.18;
    G.gpcBox.push(boxR(x0 - .03, x0 + 1.0, .46, .468, z0 - .03, z0 + .95, MAT.si2, G.die, { edge: false, shadow: false }));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { o.position.set(x0 + .1 + c * .163, .49, z0 + .14 + r * .3); o.updateMatrix(); G.smInst.setMatrixAt(n, o.matrix); G.smPos.push(o.position.clone()); n++; }
  }
  G.smInst.instanceMatrix.needsUpdate = true; for (let i = 0; i < 144; i++) G.smInst.setColorAt(i, _gc.set('#4d505a'));
  // HBM stacks: 3 per long side
  for (let s = 0; s < 6; s++) {
    const x = -1.9 + (s % 3) * 1.9, z = s < 3 ? -1.98 : 1.98, st = { g: new THREE.Group(), layers: [], x, z, mats: [] };
    st.g.position.set(x, .34, z); G.g.add(st.g);
    const bm = gmat('#3a3d45'); st.base = boxR(-.75, .75, 0, .07, -.48, .48, bm, st.g); st.mats.push(bm);
    for (let k = 0; k < 8; k++) { const m = gmat('#2e3036'); const L = boxR(-.72, .72, .08 + k * .06, .13 + k * .06, -.45, .45, m, st.g, { edge: k === 7 }); st.layers.push(L); st.mats.push(m); if (full) explodable(L, 'gpu', [0, .14 * (k + 1), 0], [0, 0, 0], k / 10); }
    if (full) explodable(st.base, 'gpu', [0, .02, 0], [0, 0, 0], 0);
    G.stacks.push(st);
  }
  G.nvl = boxR(4.0, 4.5, .25, .32, -2.8, 2.8, MAT.gold, G.g);
  if (full) { explodable(G.die, 'gpu', [0, 1.2, 0], [0, 0, 0], .1); }
  return G;
}
const GPU = makeGPU(true); GPU.X = 5; GPU.g.position.set(GPU.X, 0, 0); BD.g.add(GPU.g);
pickable(GPU.dieM, { name: B('GPU die (GH100 illustration)', 'GPU die (GH100 示意)'), fn: B('Transistors mainly support many simple parallel compute units and wide memory interfaces: 8 GPCs × 18 SMs (144 on the full die, 132 enabled on H100 SXM). Optimized for throughput.', '把晶体管几乎都花在"很多简单的并行计算单元 + 宽内存接口"上：8 个 GPC × 18 个 SM (满配 144，H100 SXM 启用 132)。为"吞吐量"而优化。'), v: () => GPUS[CFG.gpu].sms + tr(B(' SMs enabled (', ' SMs 启用 (')) + GPUS[CFG.gpu].name + ')' });
pickable(GPU.smInst, { name: 'SM (Streaming Multiprocessor)', fn: B('The GPU compute building block: 4 subpartitions, each with a warp scheduler, register file, FP32/INT32 units and 1 Tensor Core; shared L1/shared memory. Step 4 zooms in.', 'GPU 的基本计算单元：4 个子分区，每个有 warp 调度器、寄存器堆、FP32/INT32 单元和 1 个 Tensor Core；共享 L1/shared memory。第 4 步放大。'), v: () => GPUS[CFG.gpu].sms + tr(B(' enabled', ' 个启用')) });
GPU.l2.forEach(m => pickable(m, { name: 'L2 cache', fn: B('The chip-wide shared L2 cache (H100: 50 MB), between all SMs and HBM. Two halves connected through a crossbar.', '全芯片共享的二级缓存 (H100 50 MB)，所有 SM 与 HBM 之间的中转站。分两半，中间有交叉互联。'), v: () => GPUS[CFG.gpu].l2 + ' MB' }));
GPU.stacks.forEach((st, i) => pickable(st.layers[7], { name: B(`HBM stack ${i}`, `HBM 堆栈 ${i}`), fn: B('8–12 DRAM dies stacked vertically using TSVs (through-silicon vias) on a base logic die. A 1024-bit interface connects directly to the GPU through a silicon interposer. Wide + short = high bandwidth.', '8–12 层 DRAM die 用 TSV (硅通孔) 垂直堆叠在一个 base logic die 上，1024-bit 宽接口通过硅中介层 (interposer) 直连 GPU。宽 + 短 = 高带宽。'), v: () => fB(GPUS[CFG.gpu].hbm / GPUS[CFG.gpu].stacks) + tr(B('/stack · Total ', '/stack · 总 ')) + (GPUS[CFG.gpu].bw / 1e12).toFixed(2) + ' TB/s' }));
pickable(GPU.inter, { name: B('Silicon interposer (CoWoS type)', '硅中介层 Interposer (CoWoS 类)'), fn: B('A silicon substrate with thousands of fine wires connects GPU and HBM side by side: 1024 data lines per stack, much denser than PCB routing allows.', '一块带上千条细线的硅片，把 GPU die 和 HBM 堆栈并排连起来：每个堆栈 1024 根数据线，PCB 上做不到这么密。'), v: () => tr(B('2.5D packaging', '2.5D 封装')) });
pickable(GPU.nvl, { name: 'NVLink', fn: B('High-speed GPU ↔ GPU interconnect (H100: 900 GB/s aggregate, public specification). Tensor parallelism performs all-reduce each layer.', 'GPU ↔ GPU 高速互联 (H100: 900 GB/s 总带宽，公开规格)。多卡张量并行时，每层要做 all-reduce。'), v: () => (GPUS[CFG.gpu].nvl / 1e9).toFixed(0) + ' GB/s' });
// streams: HBM -> die (per stack), die-> L2
GPU.hbmCurves = GPU.stacks.map(st => { const a = [GPU.X + st.x, .75, st.z], b = [GPU.X + st.x * .7, .62, st.z * .35]; return path([a, [a[0], .9, (a[2] + b[2]) / 2], b]); });
// ---- labels ----
const lab = (k, html, pos, o = {}) => BD.lab[k] = label(html, pos, Object.assign({ group: BD.g }, o));
lab('cpu', B('<b>CPU</b> <span class="s">Low latency · Few large cores</span>', '<b>CPU</b> <span class="s">延迟优化 · 少量大核</span>'), V3(CPU.X, .5, -2.9), { pri: 5 });
lab('dimm', 'DDR5 <span class="v">~0.3 TB/s</span>', V3(-13.0, 1.9, -2.2), { pri: 2 });
lab('pcie', 'PCIe Gen5 ×16 <span class="v">~64 GB/s</span>', V3(-2.4, .2, 1.6), { pri: 4 });
lab('gpu', B('<b>GPU</b> <span class="s">High throughput · Hundreds of SMs</span>', '<b>GPU</b> <span class="s">吞吐优化 · 上百个 SM</span>'), V3(GPU.X, .6, -3.9), { pri: 5 });
lab('hbm', B('HBM3 stacks <span class="v">3.35 TB/s</span>', 'HBM3 堆栈 <span class="v">3.35 TB/s</span>'), () => V3(GPU.X + 1.9, .95 + EXV.gpu * 1.3, -2.6), { pri: 4 });
lab('l2', 'L2 cache', () => V3(GPU.X + 1.1, .55 + EXV.gpu * 1.2, 0), { pri: 3, side: 'r' });
lab('sm', 'SM ×132', () => V3(GPU.X - 1.6, .55 + EXV.gpu * 1.2, -.7), { pri: 3 });
lab('inter', B('Silicon interposer', '硅中介层'), () => V3(GPU.X - 3.1, .3, 2.2), { pri: 1, side: 'l' });
lab('nvl', 'NVLink', V3(GPU.X + 4.3, .35, 3.1), { pri: 1 });
lab('l3', B('L3 (shared)', 'L3 (共享)'), V3(CPU.X + 1.5, .36, 0), { pri: 2, side: 'r' });
lab('core', B('Core + L2', '核心 + L2'), V3(CPU.X - .4, .4, -1.2), { pri: 2 });
// ---- multi-GPU (step 9) ----
const MULTI = { g: new THREE.Group(), gpus: [], curves: [] }; BD.g.add(MULTI.g);
boxR(-4, 26, -.22, 0, -16.5, -7, MAT.pcb, MULTI.g); boxR(13, 26, -.22, 0, -7, 7, MAT.pcb, MULTI.g);
[[18.5, 0], [5, -11.5], [18.5, -11.5]].forEach(([x, z]) => { const G = makeGPU(false); G.g.position.set(x, 0, z); MULTI.g.add(G.g); MULTI.gpus.push(G); });
MULTI.sw = boxR(10.8, 12.8, 0, .35, -6.7, -4.7, gmat('#3b3f4a'), MULTI.g);
pickable(MULTI.sw, { name: B('NVSwitch (illustrative)', 'NVSwitch (示意)'), fn: B('A switch connecting 8 GPUs: any pair can communicate at full NVLink bandwidth. Tensor-parallel all-reduce passes through it.', '把 8 张 GPU 全互联起来的交换芯片：任意两卡之间都能跑满 NVLink 带宽。张量并行的 all-reduce 走这里。'), v: () => 'TP = ' + CFG.tp });
[[GPU.X + 4.3, 0], [18.5 - 4.3, 0], [5 + 4.3, -11.5], [18.5 - 4.3, -11.5]].forEach(([x, z], i) => { const pts = [[x, .3, z], [x, .3, z * .6 - 2.3], [11.8, .3, -5.7]]; wire(pts, .05, MAT.gold, MULTI.g); MULTI.curves.push(path(pts.map(p => [p[0], .42, p[2]]))); });
MULTI.lab = label('NVSwitch <span class="v">all-reduce</span>', V3(11.8, .6, -5.7), { group: MULTI.g, pri: 6 });
MULTI.labs = ['GPU 0', 'GPU 1', 'GPU 2', 'GPU 3'].map((t, i) => label(B(t + ' <span class="v">¼ of weights</span>', t + ' <span class="v">¼ 权重</span>'), V3([GPU.X, 18.5, 5, 18.5][i], .7, [0, 0, -11.5, -11.5][i] - 3.9), { group: MULTI.g, pri: 5 }));
MULTI.g.visible = false;
// ---- model tower: the transformer as a stack of kernels ----
const TOWER = { g: new THREE.Group(), slabs: [], blocks: [], X: -1.4 }; TOWER.g.position.set(TOWER.X, 0, 0); scene.add(TOWER.g);
TOWER.rows = [
  { name: 'Embedding', ks: [['Embedding gather', 'mem', 1]] },
  { name: 'Layer 1', layer: 0 }, { name: 'Layer 2', layer: 1 }, { name: '⋯', dots: true }, { name: 'Layer L', layer: 9 },
  { name: 'LM head', ks: [['Final norm', 'mem', .5], ['LM head GEMM', 'gemm', 3], ['Softmax/sampling (top-p)', 'mem', 1]] },
];
const LAYK = [['RMSNorm', 'mem', .35], ['QKV GEMM', 'gemm', 1.6], ['RoPE + write KV', 'mem', .4], ['Attention', 'attn', 1.1], ['O-proj GEMM', 'gemm', 1.1], ['Add + RMSNorm', 'mem', .35], ['Gate/Up GEMM', 'gemm', 3.4], ['SiLU × mul', 'mem', .45], ['Down GEMM', 'gemm', 2.0], ['Residual add', 'mem', .3]];
TOWER.rows.forEach((r, i) => {
  const y = 1.1 + i * .62; r.y = y; r.blocks = [];
  if (r.dots) { for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(.06, 12, 8), MAT.l2, { x: 0, y, z: -.5 + k * .5, parent: TOWER.g, edge: false }); return; }
  const ks = r.ks || LAYK, W = 4.2, tot = ks.reduce((s, k) => s + k[2], 0), gap = .04; let x = -W / 2;
  ks.forEach(([nm, type, w]) => {
    const bw = W * w / tot - gap, m = gmat(KCOL[type === 'attn' ? 'attn' : type], { roughness: .45, metalness: .1 });
    m.color.lerp(_gc.set('#2a2b30'), .55); m.userData.col = new THREE.Color(KCOL[type]);
    const b = mesh(rbox(bw, .3, 1.3, .03), m, { x: x + bw / 2 + gap / 2, y, z: 0, parent: TOWER.g, edge: false });
    const info = { nm, type, row: i, mat: m, mesh: b }; r.blocks.push(info); TOWER.blocks.push(info);
    pickable(b, { name: B((KERNEL_TEXT[nm] ? KERNEL_TEXT[nm].en : nm) + (type === 'gemm' ? ' · GEMM' : type === 'attn' ? ' · Attention' : ' · Elementwise/memory-bound'), (KERNEL_TEXT[nm] ? KERNEL_TEXT[nm].zh : nm) + (type === 'gemm' ? ' · GEMM' : type === 'attn' ? ' · Attention' : ' · 逐元素/访存型')), fn: B(type === 'gemm' ? 'Matrix multiplication: weights W (d×N) multiply activations. With a small decode batch this is effectively GEMV; each weight is reused only B times, making it memory-bound.' : type === 'attn' ? 'Attention reads all K/V for this sequence (KV cache), doing only ~2 multiply-adds per byte (more with GQA). KV cannot be shared across the batch.' : 'Elementwise operations / normalization: ~1 operation per byte read, so memory-bound. Fusion reduces round trips to memory.', type === 'gemm' ? '矩阵乘：权重 W (d×N) 乘激活。decode 时 batch 很小 → 其实是 GEMV，每个权重只用 B 次 → 访存受限。' : type === 'attn' ? 'Attention：读本序列全部 K/V (KV cache)，每个字节只做 ~2 次乘加 (GQA 时更多)；batch 不能共享 KV。' : '逐元素 / 归一化：每读一个字节只算 ~1 次 → 永远访存受限，只能靠融合 (fusion) 减少往返。'), v: () => { const s = stepModel('decode'); const k = s.lay.find(q => q.name.startsWith(nm.split(' ')[0])) || s.tail.find(q => q.name === nm) || s.head[0]; return k ? fB(k.bytes) + ' · ' + fF(k.flops) + 'FLOP · ' + fT(k.t) : ''; } });
    x += bw + gap;
  });
  r.lab = label(r.name, V3(TOWER.X - 2.25, y, .65), { side: 'l', group: TOWER.g, pri: i === 1 || i === 5 ? 4 : 2 });
});
TOWER.cursor = mesh(new THREE.BoxGeometry(4.5, .02, 1.6), new THREE.MeshBasicMaterial({ color: '#4a8ad6', transparent: true, opacity: .0, toneMapped: false }), { parent: TOWER.g, edge: false, shadow: false });
TOWER.klab = label('', V3(0, 0, 0), { group: TOWER.g, pri: 9, cls: 'big' });
TOWER.g.visible = false;
// ---- KV/HBM memory map (step 7) ----
const KVST = { X: [-3.9, -1.3, 1.3, 3.9], L: 12, y0: .62, dy: .33 };
const KVM = { g: new THREE.Group(), cols: 32, rows: 12, n: 384 }; KVM.g.position.set(GPU.X, 0, -4.4); scene.add(KVM.g);
boxR(-5.2, 5.2, .12, .3, -1.05, 1.05, MAT.chip, KVM.g); // silicon interposer under the four HBM stacks
KVM.inst = new THREE.InstancedMesh(rbox(.44, .14, .56, .03), new THREE.MeshStandardMaterial({ roughness: .5, metalness: .1, emissive: '#000' }), KVM.n); KVM.g.add(KVM.inst);
{ const o = new THREE.Object3D(); for (let i = 0; i < KVM.n; i++) { const c = i % KVM.cols, r = Math.floor(i / KVM.cols); kvLocal(i, o.position); o.updateMatrix(); KVM.inst.setMatrixAt(i, o.matrix); KVM.inst.setColorAt(i, _gc.set('#26272b')); } }
pickable(KVM.inst, { name: B('HBM capacity map', 'HBM 容量示意图'), fn: B('Each cell represents a small HBM region. Blue = resident model weights; colors = each request\'s KV cache blocks (PagedAttention allocates noncontiguous blocks of 16 tokens); dark = free.', '每一格 = HBM 的一小块。蓝 = 模型权重 (常驻)，彩色 = 各请求的 KV cache block (PagedAttention：按 16 token 一块分配，不必连续)，暗 = 空闲。'), v: () => { const s = stepModel('decode'); return tr(B('Weights ', '权重 ')) + fB(s.wBytes) + ' · KV ' + fB(s.kvBytes) + ' / ' + fB(s.H.hbm); } });
KVM.sram = boxR(5.4, 7.0, .3, 1.5, -.5, .5, gmat('#3d4250'), KVM.g);
pickable(KVM.sram, { name: B('SM on-chip SRAM (shared memory)', 'SM 片上 SRAM (shared memory)'), fn: B('FlashAttention tiles Q/K/V into each SM\'s shared memory (up to 228 KB per SM on H100) and computes softmax without writing the N×N attention matrix to HBM.', 'FlashAttention 把 Q/K/V 切成小块 (tile) 装进每个 SM 的 shared memory (H100 每 SM 最多 228 KB) 里算完 softmax，不把 N×N 注意力矩阵写回 HBM。'), v: () => '228 KB / SM (H100)' });
KVM.lab = label(B('HBM contents <span class="v">Weights + KV cache</span>', 'HBM 内容 <span class="v">权重 + KV cache</span>'), V3(GPU.X - 4.9, 4.9, -4.4), { group: KVM.g, side: 'r', pri: 6 });
KVM.slab = label('SRAM tile <span class="v">FlashAttention</span>', V3(GPU.X + 6.2, 1.85, -4.4), { group: KVM.g, pri: 5 });
KVM.g.visible = false;
// KV pages as physical blocks on the DRAM dies of 4 HBM stacks: addresses interleave across stacks (i % 4),
// each stack = base logic die + 12 DRAM dies, 8 page blocks per die (4 x 2). Weights fill the lower dies first.
function kvLocal(i, out) { const s = i % 4, j = Math.floor(i / 4), L = Math.floor(j / 8), p = j % 8; return out.set(KVST.X[s] - .78 + (p % 4) * .52, KVST.y0 + L * KVST.dy + .1, -.33 + Math.floor(p / 4) * .66); }
function kvCellPos(i, out = new THREE.Vector3()) { kvLocal(i, out); return out.set(out.x + GPU.X, out.y, out.z - 4.4); }
