// ================= DIE MODEL (system view, CMOS-under-array) =================
const DIE = { g: new THREE.Group(), cua: {}, tiers: [], arrayMats: [], packets: [], labels: [] };
scene.add(DIE.g);
{
  const g = DIE.g;
  const NT = 12, PITCH = 0.2, Y0 = 1.15, AX0 = -4, AX1 = 5.5, STEPW = 0.18;
  DIE.NT = NT; DIE.Y0 = Y0; DIE.PITCH = PITCH;
  const BLKZ = [[-3.85, -1.38], [-1.18, 1.18], [1.38, 3.85]];
  DIE.BLKZ = BLKZ;
  // substrate
  const sub = boxR(-8, 8, 0, 0.6, -5, 5.6, M('#2a3140', { roughness: .8 }), g);
  pickable(sub, { name: B("p-Si substrate", 'p-Si 衬底 (substrate)'), fn: B("Single-crystal silicon supporting CMOS peripheral circuits. In CuA/PUC structures, the memory array is stacked above the periphery rather than formed in the silicon substrate.", '承载 CMOS 外围电路的单晶硅片。CuA/PUC 结构里存储阵列不再做在硅衬底上，而是叠在外围电路之上。'), v: () => '0 V (GND)' });
  explodable(sub, 'die', [0, -2.6, 0], [0.04, 0, -0.03], 0);
  // CuA blocks
  const cuaY0 = 0.6, cuaY1 = 0.98;
  const blocks = [
    ['rowdec', B("Row decoder (HV)", '行译码器 Row decoder (HV)'), [-6.8, -4.15, -3.9, 3.9], '#7c3aed', 'X-DEC', B("Decodes the block address, enables that block’s HV pass transistors, and transfers Vpgm/Vpass/Vread from global to local WLs. Located below the staircase; voltages can reach ~20 V+.", '把块地址译码成 block-select 信号，打开该 block 的高压 pass transistors，把 global WL 上的 Vpgm/Vpass/Vread 传到选中块的 local WL。位于 staircase 下方，电压最高可达 ~20 V+。'), () => B("Pass-transistor gate ≈ Vpgm + Vth ≈ 22–25 V (typical)", 'pass Tr 栅压 ≈ Vpgm + Vth ≈ 22–25 V (typical)')],
    ['pbN', B("Page buffer / sense amp (even)", 'Page buffer / Sense amp (偶)'), [-4, 5.5, 1.05, 4.4], '#0e7490', 'PAGE BUFFER · S/A', B("One sense amplifier and several data latches per BL. READ: precharge and detect BL discharge at strobe. PROGRAM: set BL to 0 V (program) or Vcc (inhibit) according to data.", '每条 BL 一个 sense amplifier + 若干数据锁存器 (latches)。READ 时预充 BL 并在 strobe 时刻判断 BL 是否放电；PROGRAM 时根据数据把 BL 设成 0 V (编程) 或 Vcc (禁止)。'), () => B("BL precharge ≈ 0.5–1.0 V; program-inhibit BL ≈ Vcc 2.5 V", 'BL 预充 ≈ 0.5–1.0 V；禁止编程 BL ≈ Vcc 2.5 V')],
    ['pbS', B("Page buffer / sense amp (odd)", 'Page buffer / Sense amp (奇)'), [-4, 5.5, -4.4, -1.05], '#0e7490', 'PAGE BUFFER · S/A', B("Page buffers for the other half of the BLs. CuA places these circuits beneath the array, saving silicon area outside it.", '另一半 BL 的 page buffer。阵列下方 CuA 让 page buffer 面积不再挤占阵列外的硅面积。'), () => B("Same as above", '同上')],
    ['coldec', B("Column decoder · data path", '列译码 / 数据通路 Column decoder · Data path'), [-4, 5.5, -0.85, 0.85], '#0369a1', 'Y-DEC · DATA PATH', B("Uses the column address to serialize page-buffer data to I/O (READ), or transfer incoming DQ data into the page buffer (PROGRAM).", '按列地址把 page buffer 中的数据串行化送到 I/O (READ)，或把 DQ 上收到的数据写入 page buffer (PROGRAM)。'), () => B("Vcc / VccQ logic levels", 'Vcc / VccQ 逻辑电平')],
    ['pump', B("Charge pumps", '电荷泵 Charge pumps'), [5.75, 7.6, -4.4, -1.2], '#be123c', 'CHARGE PUMPS', B("On-die Dickson charge pumps raise Vcc (~2.5–3.3 V) to Vpass (~8–10 V), Vpgm (~15–20 V+), and Verase (~18–20 V+).", '片内 Dickson 型电荷泵，把 Vcc (~2.5–3.3 V) 抬到 Vpass (~8–10 V)、Vpgm (~15–20 V+) 和 Verase (~18–20 V+)。'), () => B("Output 8 – 22 V (typical)", '输出 8 – 22 V (typical)')],
    ['reg', B("Regulators · bandgap reference", '稳压器 / 带隙 Regulators · Bandgap'), [5.75, 7.6, -1.0, 1.0], '#b45309', 'REG · BGR', B("A bandgap reference supplies a temperature-stable reference. Regulators set pump outputs precisely to FSM-requested Vpgm(k), Vread(Rk), and Verify(PVk) levels.", '带隙基准产生温度无关的参考电压，稳压器把泵输出精确调节到 FSM 要求的 Vpgm(k)、Vread(Rk)、Verify(PVk) 等电平。'), () => B("Precision ~ tens of mV", '精度 ~ tens of mV')],
    ['fsm', B("Control logic · FSM", '控制逻辑 / 状态机 Control logic · FSM'), [5.75, 7.6, 1.2, 4.4], '#15803d', 'FSM · µCODE', B("Parses commands/addresses, sequences pumps, regulators, decoders, and page buffers for READ, ISPP, erase loops and verify, and maintains the status register (70h).", '解析命令/地址，按内部算法 (READ 时序、ISPP 循环、擦除循环、verify) 依次给泵、稳压器、译码器、page buffer 下指令，并维护状态寄存器 (70h)。'), () => B("Logic levels", '逻辑电平')],
  ];
  for (const [id, name, [x0, x1, z0, z1], col, tag, fn, v] of blocks) {
    const mat = M(col, { roughness: .45, emissive: new THREE.Color(col), emissiveIntensity: 0.08 });
    const m = boxR(x0, x1, cuaY0, cuaY1, z0, z1, mat, g);
    const tt = topText(tag, x1 - x0, z1 - z0, { size: Math.min(70, 900 / tag.length) , color: '#ffffffdd' }); tt.position.y = (cuaY1 - cuaY0) / 2 + 0.005; m.add(tt);
    pickable(m, { name, fn, v });
    explodable(m, 'die', [((x0 + x1) / 2) * 0.12, -1.1 - rnd() * .5, ((z0 + z1) / 2) * 0.12], [rr(-.06, .06), rr(-.08, .08), rr(-.06, .06)]);
    DIE.cua[id] = { m, mat, col: new THREE.Color(col), glow: 0 };
  }
  // I/O pads along front edge
  const padMat = M('#d4b16a', { metalness: .9, roughness: .3 });
  const pads = new THREE.Group(); g.add(pads);
  const padNames = ['CE#', 'CLE', 'ALE', 'WE#', 'RE#', 'R/B#', 'DQ0', 'DQ1', 'DQ2', 'DQ3', 'DQ4', 'DQ5', 'DQ6', 'DQ7', 'DQS', 'VCC'];
  DIE.padX = [];
  padNames.forEach((n, i) => { const x = -6.2 + i * 0.83; DIE.padX.push(x); const p = boxR(x - .28, x + .28, 0.6, 0.66, 4.85, 5.4, padMat, pads); pickable(p, { name: 'I/O pad · ' + n, fn: B("ONFI/Toggle pins. CLE: command latch enable; ALE: address latch enable; WE# rising edge latches commands/addresses/data; RE#: data read; DQ[7:0]: 8-bit data bus; R/B#: ready/busy.", 'ONFI/Toggle 接口引脚。CLE=命令锁存使能，ALE=地址锁存使能，WE# 上升沿锁存命令/地址/数据，RE# 读数据，DQ[7:0] 8 位数据总线，R/B# 忙闲指示。'), v: () => 'VccQ 1.2 / 1.8 V (typical)' }); });
  explodable(pads, 'die', [0, -1.4, 1.2], [0.05, 0, 0]);
  // source plate (n+ poly)
  const spMat = M('#5b6b8a', { roughness: .6 });
  const sp = boxR(AX0 - 2.5, AX1, 0.98, Y0, -3.95, 3.95, spMat, g);
  pickable(sp, { name: B("Source plate (n+ poly SL)", 'Source plate / 公共源 (n+ poly SL)'), fn: B("An n+ poly-Si layer deposited above CuA forms the common source for all strings. CMOS, rather than a p-well, lies below it, preventing substrate hole injection during erase → GIDL is needed.", '在 CuA 上方沉积的 n+ 多晶硅层，作为所有 string 的公共 source line。因为它下面是 CMOS 而不是 p-阱，擦除时无法从衬底注入空穴 → 需要 GIDL 擦除。'), v: () => 'READ 0 V · PGM ~1–2 V · ERS ~18–20 V' });
  explodable(sp, 'die', [0, -0.35, 0], [0, 0, 0.02], .1);
  DIE.sp = sp; DIE.spMat = spMat;
  // tier stack per block, plates with holes for pillars
  const NX = 24, NZ = 3, PX = (AX1 - AX0 - 0.5) / (NX - 1);
  const pillarPos = [];
  BLKZ.forEach(([z0, z1], b) => { for (let iz = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++) { const zz = z0 + 0.42 + iz * ((z1 - z0 - 0.84) / (NZ - 1)); pillarPos.push([AX0 + 0.25 + ix * PX + (iz % 2) * PX * .5 - PX * .25, zz, b]); } });
  DIE.pillarPos = pillarPos;
  const tierNames = i => i === 0 ? 'SGS' : i === NT - 1 ? 'SGD' : (i === 1 || i === NT - 2) ? 'Dummy WL' : 'WL' + (i - 2);
  for (let b = 0; b < 3; b++) {
    const [z0, z1] = BLKZ[b]; DIE.tiers[b] = [];
    for (let i = 0; i < NT; i++) {
      const xl = AX0 - (NT - 1 - i) * STEPW;
      const sh = new THREE.Shape(); sh.moveTo(xl, -z0); sh.lineTo(AX1, -z0); sh.lineTo(AX1, -z1); sh.lineTo(xl, -z1); sh.closePath();
      for (const [px, pz, pb] of pillarPos) if (pb === b) { const h = new THREE.Path(); h.absarc(px, -pz, 0.1, 0, Math.PI * 2, false); sh.holes.push(h); }
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false, curveSegments: 3 });
      geo.rotateX(-Math.PI / 2);
      const mat = M(i === 0 || i === NT - 1 ? '#8e9bb0' : '#a7b1c2', { metalness: .55, roughness: .35, transparent: true, opacity: 1 });
      const m = new THREE.Mesh(geo, mat); m.position.y = Y0 + 0.08 + i * PITCH; m.castShadow = true; m.receiveShadow = true; g.add(m);
      const nm = tierNames(i);
      pickable(m, { name: B(`Block ${b} · ${nm} (W gate plate)`, `Block ${b} · ${nm} (W 栅极平板)`), fn: i === 0 ? B("Source-select gate SGS: connects or isolates the string and source plate.", '源端选择栅 SGS：把 string 与 source plate 连通/隔离。') : i === NT - 1 ? B("Drain-select gate SGD: connects or isolates the string and bit line; during programming, works with BL=Vcc to enable self-boosting.", '漏端选择栅 SGD：把 string 与 bit line 连通/隔离；编程时与 BL=Vcc 配合形成自升压 (self-boosting)。') : B("W word-line plate shared by all pillars in one layer of one block. It forms each memory cell’s control gate.", '钨 (W) word line 平板：同一层同一 block 内所有 pillar 共享。它就是每个存储单元的控制栅。'), v: () => DIE.tierV ? DIE.tierV(b, i) : '' });
      explodable(m, 'die', [rr(-.25, .25), 0.55 * i + 0.2, rr(-.25, .25) + (b - 1) * 0.9], [rr(-.05, .05), rr(-.04, .04), rr(-.05, .05)], i / NT * .7 + rnd() * .3);
      explodable(m, 'tier', [rr(-.08, .08) - 0.02 * i, 0.32 * i + 0.1, (b - 1) * 0.5], [rr(-.04, .04), 0, rr(-.03, .03)], i / NT * .6 + rnd() * .2);
      DIE.tiers[b][i] = { m, mat, base: mat.color.clone() }; DIE.arrayMats.push(mat);
    }
  }
  // pillars
  const pg = new THREE.CylinderGeometry(0.085, 0.085, NT * PITCH + 0.2, 10);
  const pmat = M('#d6b36a', { roughness: .5, transparent: true });
  const pil = new THREE.InstancedMesh(pg, pmat, pillarPos.length);
  const dm = new THREE.Object3D();
  pillarPos.forEach(([x, z], i) => { dm.position.set(x, Y0 + (NT * PITCH) / 2 + 0.02, z); dm.updateMatrix(); pil.setMatrixAt(i, dm.matrix); });
  pil.castShadow = true; g.add(pil); DIE.arrayMats.push(pmat);
  pickable(pil, { name: B("Vertical pillar (macaroni channel)", '垂直沟道 pillar (macaroni channel)'), fn: B("A high-aspect-ratio hole lined with blocking oxide / SiN charge trap / tunnel oxide / poly-Si channel, with oxide filling the core (macaroni). One pillar = one NAND string; each WL intersection forms a cell.", '刻蚀出的高深宽比孔，孔壁依次沉积 blocking oxide / SiN 电荷陷阱层 / tunnel oxide / 多晶硅沟道，中心填氧化物 (macaroni)。一根 pillar = 一个 NAND string，与每层 WL 相交处形成一个存储单元。'), v: () => B("Vch: READ 0 V conducting · PGM 0 V or boosted ~8 V · ERS ~18 V", 'Vch: READ 0 V 导通 · PGM 0 V 或升压 ~8 V · ERS ~18 V') });
  explodable(pil, 'die', [0, 3.4, 0], [0, 0, 0.02], .5);
  explodable(pil, 'tier', [0, 2.0, 0], [0, 0, 0], .4);
  DIE.pil = pil;
  // slits (common-source walls)
  const slitMat = M('#4b5568', { metalness: .4, roughness: .5, transparent: true });
  for (const z of [-1.28, 1.28, -3.92, 3.92]) { const s = boxR(AX0 - 2.5, AX1, Y0, Y0 + NT * PITCH + 0.05, z - 0.04, z + 0.04, slitMat, g, { edge: false }); pickable(s, { name: B("Slit (common-source contact)", 'Slit / 栅线缝 (common-source contact)'), fn: B("Deep trench dividing the array into blocks. Replacement-gate processing removes sacrificial SiN through it and fills W; insulation and a conductor then form the common-source contact.", '把阵列切成一个个 block 的深沟槽。工艺上用于 replacement-gate：经 slit 把 SiN 牺牲层湿法去除再填 W；随后在其中填绝缘+导体作为公共源接触。'), v: () => B("Same as SL", '同 SL') }); explodable(s, 'die', [0, 2.4 + rnd(), z * 0.35], [0, 0, rr(-.05, .05)]); explodable(s, 'tier', [0, 1.6, z * .25], [0, 0, 0]); DIE.arrayMats.push(slitMat); }
  // staircase contacts and routing to row decoder
  const cmat = M('#c9a227', { metalness: .9, roughness: .3, transparent: true });
  const metal = new THREE.Group(); g.add(metal);
  const YM = Y0 + NT * PITCH + 0.45;
  for (let b = 0; b < 3; b++) for (let i = 0; i < NT; i++) {
    const x = AX0 - (NT - 1 - i) * STEPW - STEPW * .5 + 0.02, z = (BLKZ[b][0] + BLKZ[b][1]) / 2 + (i % 3 - 1) * 0.35;
    const ytop = Y0 + 0.2 + i * PITCH; const xr = -6.55 - 0.012 * i;
    wire([[x, ytop, z], [x, YM + 0.02 * (i % 4), z], [xr, YM + 0.02 * (i % 4), z], [xr, 0.98, z]], 0.022, cmat, metal);
  }
  // bit lines along z on top + via fences to page buffers
  const blMat = M('#e0b54d', { metalness: .9, roughness: .28, transparent: true });
  const xs = []; for (let ix = 0; ix < NX; ix++) xs.push(AX0 + 0.25 + ix * PX);
  xs.forEach((x, k) => {
    const zEnd = k % 2 ? -4.25 : 4.25;
    const bl = wire([[x, Y0 + NT * PITCH + 0.3, -4.25], [x, Y0 + NT * PITCH + 0.3, 4.25]], 0.035, blMat, metal);
    wire([[x, Y0 + NT * PITCH + 0.3, zEnd], [x, 0.98, zEnd]], 0.026, blMat, metal);
    bl.children.forEach(c => pickable(c, { name: `Bit line BL${k}`, fn: B("Top-metal bit line running along z, linking pillar tops (through SGD) across blocks in the same column. A via connects it down to the CuA page buffer.", '顶层金属 bit line，沿 z 方向把同一列中各 block 的 pillar 顶端 (经 SGD) 连起来，下行 via 连接到 CuA 中的 page buffer。'), v: () => B("READ precharge ~0.7 V · PGM 0 V / Vcc · ERS ~18–20 V", 'READ 预充 ~0.7 V · PGM 0 V / Vcc · ERS ~18–20 V') }));
  });
  DIE.arrayMats.push(cmat, blMat);
  explodable(metal, 'die', [0, 6.2, 0], [0.03, 0, -0.04], .9);
  explodable(metal, 'tier', [0, 4.9, 0], [0, 0, 0], .8);
  DIE.metal = metal;
  // controller & bus
  const ctrl = new THREE.Group(); g.add(ctrl);
  const cbody = mesh(rbox(5.2, 0.5, 2.0, .12), M('#1f2937', { roughness: .4 }), { x: 0, y: 0.25, z: 9.0, parent: ctrl });
  const ct = topText('NAND CONTROLLER', 5.0, 1.8, { size: 52, color: '#93c5fd', sub: 'ECC (LDPC) · FTL · ONFI PHY' }); ct.position.y = 0.26; cbody.add(ct);
  pickable(cbody, { name: B("NAND controller (SSD / UFS / eMMC)", 'NAND 控制器 (SSD / UFS / eMMC 主控)'), fn: B("Off-die controller: FTL mapping, wear leveling, LDPC ECC, and read-retry. Sends commands to each NAND die via ONFI/Toggle. The die executes commands without knowing the file system.", '片外控制器：做 FTL 映射、磨损均衡、LDPC ECC、读重试 (read-retry)，并通过 ONFI/Toggle 接口给每颗 NAND die 发命令。NAND die 本身只执行命令，不知道文件系统。'), v: () => B("VccQ 1.2 V I/O · typical 800–3600 MT/s (ONFI 4.x–5.x)", 'VccQ 1.2 V I/O · 典型 800–3600 MT/s (ONFI 4.x–5.x)') });
  explodable(ctrl, 'die', [0, 0.6, 1.8], [0, 0.08, 0]);
  const busMat = M('#64748b', { metalness: .6, roughness: .4 });
  DIE.busCurves = [];
  for (let i = 0; i < 16; i++) {
    const x = DIE.padX[i]; const xc = -2.2 + i * 0.29;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(xc, 0.3, 8.0), new THREE.Vector3(xc * 0.9 + x * 0.1, 0.45, 7.0), new THREE.Vector3(x, 0.7, 5.9), new THREE.Vector3(x, 0.66, 5.25)]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.03, 5, false), busMat); ctrl.add(m); DIE.busCurves.push(c);
  }
  // packets traveling the bus
  const pkMat = new THREE.MeshBasicMaterial({ color: '#22d3ee', toneMapped: false });
  for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), pkMat.clone()); p.visible = false; g.add(p); DIE.packets.push(p); }
  DIE.pkLabel = label('', () => DIE.packets[0].position, { cls: 'big', group: DIE.g });
  DIE.ctrl = ctrl;
  // descriptive labels
  const L = (txt, p, side = '') => { const l = label(txt, new THREE.Vector3(...p), { group: DIE.g, side }); DIE.labels.push(l); return l; };
  DIE.lab = {
    ctrl: L(B("NAND controller · off-die", 'NAND 控制器 · 片外'), [0, 0.9, 9.2]),
    pads: L('I/O pads · ONFI', [4.5, 0.8, 5.3]),
    stack: L(B("W/SiO₂ stack (WL tiers)", 'W/SiO₂ 交替叠层 (WL tiers)'), [5.6, 2.6, 2.6], 'r'),
    stair: L(B("Staircase contacts", 'Staircase 阶梯接触'), [-6.0, 3.0, 3.0], 'l'),
    bl: L(B("Bit lines (top metal)", 'Bit lines (顶层金属)'), [3.5, 4.5, 3.6]),
    sp: L('n+ Source plate', [-5.6, 1.15, 3.95], 'l'),
    rowdec: L('Row decoder (HV)', [-5.5, 0.98, 0.4]),
    pb: L('Page buffer / S/A', [1, 0.98, 4.4]),
    cold: L('Column dec · data path', [3.5, 0.98, 0.85]),
    pump: L('Charge pumps', [6.7, 0.98, -1.4]),
    reg: L('Regulators · BGR', [6.7, 0.98, 1.0]),
    fsm: L(B("FSM", 'FSM 状态机'), [6.7, 0.98, 4.4]),
    cua: L('CMOS under Array (CuA/PUC)', [-7.8, 0.6, 5.0], 'l'),
  };
  // which tier is the "selected" WL in die view: block 1, WL index
  DIE.selBlock = 1;
}
// path of a command inside the die (for periphery step): list of CuA ids glowing in order
function dieGlow(id, v) { const c = DIE.cua[id]; if (c) c.glow = Math.max(c.glow, v); }
function updateDie(dt, nodes) {
  for (const id in DIE.cua) { const c = DIE.cua[id]; c.mat.emissiveIntensity = 0.08 + 0.9 * c.glow; c.glow = Math.max(0, c.glow - dt * 1.6); }
  // tier colouring of selected block from node voltages
  const b = DIE.selBlock;
  for (let bb = 0; bb < 3; bb++) for (let i = 0; i < DIE.NT; i++) {
    const T = DIE.tiers[bb][i]; let v = 0;
    if (bb === b && nodes) { if (i === 0) v = nodes.SGS; else if (i === DIE.NT - 1) v = nodes.SGD; else if (i === 1 || i === DIE.NT - 2) v = nodes.DWL; else v = nodes.WL[i - 2]; }
    else if (nodes && nodes.op === 'ERASE') v = nodes.unselWL || 0;
    const k = clamp(Math.abs(v) / 4); T.mat.color.copy(T.base).lerp(vColor(v), k * 0.85);
    T.mat.emissive = T.mat.emissive || new THREE.Color(); T.mat.emissive.copy(vColor(v)).multiplyScalar(clamp(v / 20) * 0.35);
  }
}
DIE.tierV = (b, i) => {
  const n = NODES; if (b !== DIE.selBlock) return B("Unselected block: WL floating / 0 V", '未选中 block：WL 浮空 / 0 V');
  if (i === 0) return 'SGS = ' + fmt(n.SGS) + ' V'; if (i === DIE.NT - 1) return 'SGD = ' + fmt(n.SGD) + ' V';
  if (i === 1 || i === DIE.NT - 2) return 'Dummy WL = ' + fmt(n.DWL) + ' V'; return `WL${i - 2} = ${fmt(n.WL[i - 2])} V`;
};
