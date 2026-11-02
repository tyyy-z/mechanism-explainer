// ================= SLICE MODEL: 4 strings x (SGS, WL0-7, SGD), cut through the pillars =================
const SL = { g: new THREE.Group(), X: 30, PX: [-2.4, -0.8, 0.8, 2.4], NTI: 10, tiers: [], ch: [], lab: {}, pb: [], wlLab: [], blLab: [], vchLab: [], vtLab: [], pbLab: [] };
SL.g.position.x = SL.X; scene.add(SL.g);
const yc = i => 0.25 + i * 0.62;     // tier i centre (0=SGS, 1..8 = WL0..7, 9 = SGD)
const xl = i => -3.4 - (9 - i) * 0.42;
const tierName = i => i === 0 ? 'SGS' : i === 9 ? 'SGD' : 'WL' + (i - 1);
{
  const g = SL.g, PX = SL.PX, GT = 0.34;
  // substrate + CuA
  boxR(-8.8, 6.8, -1.75, -1.5, -3.7, 0.3, M('#2a3140', { roughness: .85 }), g);
  const cuaBlk = (x0, x1, z0, z1, col, name, fn, v, tag) => { const mat = M(col, { emissive: new THREE.Color(col), emissiveIntensity: .1, roughness: .45 }); const m = boxR(x0, x1, -1.5, -0.72, z0, z1, mat, g); pickable(m, { name, fn, v }); if (tag) { const t = topText(tag, x1 - x0, z1 - z0, { size: Math.min(64, 700 / tag.length), color: '#ffffffdd' }); t.position.y = 0.395; m.add(t); } return { m, mat, glow: 0, col: new THREE.Color(col) }; };
  SL.rowdec = cuaBlk(-8.6, -3.6, -1.6, 0, '#7c3aed', B("Row decoder + HV pass transistors", '行译码器 + HV pass transistors'), B("After block selection, BLKSEL rises to ~Vpgm+Vth. The 10 HV pass transistors connect global WLs (from the pumps/regulators) to this block’s local WLs. Unselected blocks have their pass transistors off and WLs floating.", '块地址选中后，BLKSEL 栅被抬到 ~Vpgm+Vth，10 个高压 pass transistor 导通，把 global WL (来自泵/稳压器) 接到本 block 的 local WL。未选 block 的 pass Tr 关断，其 WL 浮空。'), () => 'BLKSEL ≈ ' + fmt(Math.max(NODES.WLmax + 3, 5)) + ' V (typical: Vpgm + Vth)', 'ROW DEC · HV SWITCH');
  SL.pump = cuaBlk(3.9, 6.6, -1.6, 0, '#be123c', B("Charge pump + regulator", '电荷泵 + 稳压器'), B("The Dickson pump raises Vcc to Vpass / Vpgm / Verase; the regulator sets Vpgm(k) precisely for each FSM-controlled ISPP step.", 'Dickson 泵把 Vcc 抬升到 Vpass / Vpgm / Verase；稳压器按 FSM 的 ISPP 步进精确设定 Vpgm(k)。'), () => tr(B("Peak output now ≈ ", '当前最高输出 ≈ ')) + fmt(NODES.WLmax) + ' V', 'PUMP · REG');
  SL.fsm = cuaBlk(3.9, 6.6, -3.5, -1.8, '#15803d', B("Control logic / FSM", '控制逻辑 / 状态机'), B("Runs the internal READ/PROGRAM/ERASE algorithms: sets biases, times pulses, triggers S/A strobes, counts ISPP loops, checks verify results, and updates the status register.", '执行 READ/PROGRAM/ERASE 内部算法：设偏压、计时、触发 S/A strobe、ISPP 计数、verify 判断、更新状态寄存器。'), () => B("Logic levels", '逻辑电平'), 'FSM');
  PX.forEach((x, k) => { SL.pb[k] = cuaBlk(x - 0.62, x + 0.62, -3.5, -2.0, '#0e7490', `Page buffer / S/A · BL${k}`, B("Sense amplifier + data latches (SDL/DL). READ: precharge BL → develop discharge → strobe → latch. PROGRAM: hold target data and set BL=0 V (continue programming) or Vcc (inhibit / verify passed).", '感测放大器 + 数据锁存器 (SDL/DL)。READ：预充 BL → 等待放电 → strobe 判定 → 锁存结果。PROGRAM：存目标数据，决定 BL=0 V (继续编程) 或 Vcc (禁止/已 verify 通过)。'), () => `BL${k} = ${fmt(NODES.BL[k], 2)} V`, 'S/A ' + k); });
  // HV pass transistors on rowdec top + GWL bus
  const hvMat = M('#c4b5fd', { roughness: .4 });
  SL.route = [];
  const cMat = M('#c9a227', { metalness: .9, roughness: .3 });
  for (let i = 0; i < 10; i++) {
    const zi = -1.3 + i * 0.12, xd = -7.7 - i * 0.07, xc = i === 9 ? -3.1 : xl(i) + 0.21;
    boxR(xd - 0.05, xd + 0.05, -0.72, -0.64, zi - 0.045, zi + 0.045, hvMat, g, { edge: false });
    const w = wire([[xc, yc(i) + GT / 2, zi], [xc, 6.45 + 0.02 * i, zi], [xd, 6.45 + 0.02 * i, zi], [xd, -0.66, zi]], 0.028, cMat.clone(), g);
    SL.route[i] = w;
    w.children.forEach(c => pickable(c, { name: B(`${tierName(i)} contact + metal routing`, `${tierName(i)} 接触 + 金属走线`), fn: B("Each staircase landing receives a contact via. Upper metal routes it around the array and down to the corresponding CuA HV pass transistor: the physical path from CMOS to each WL.", 'Staircase 每一级上落一个接触孔，经上层金属绕到阵列外侧，再下行到 CuA 中对应的 HV pass transistor。这就是 "CMOS 控制哪一个结构" 的物理路径。'), v: () => `${tierName(i)} = ${fmt(tierV(i))} V` }));
  }
  wire([[5.0, -0.66, -0.05], [-8.4, -0.66, -0.05]], 0.05, M('#f43f5e', { emissive: new THREE.Color('#f43f5e'), emissiveIntensity: .25 }), g).children.forEach(c => pickable(c, { name: B("Global WL bus (GWL)", 'Global WL 总线 (GWL)'), fn: B("Global word-line bus from pumps/regulators to row decoders, shared by all blocks. Only the selected block’s enabled pass transistors connect it to local WLs.", '泵/稳压器 → 行译码器的全局字线总线，所有 block 共享；只有被选中 block 的 pass Tr 打开时才传到 local WL。'), v: () => 'Vpgm / Vpass / Vread' }));
  // source plate
  SL.spMat = M('#5b6b8a', { roughness: .55 });
  SL.sp = boxR(-7.45, 3.75, -0.6, -0.3, -1.6, 0, SL.spMat, g);
  pickable(SL.sp, { name: B("Source plate · common SL (n+ poly)", 'Source plate · 公共源 SL (n+ poly)'), fn: B("Common source at the bottom of all strings. READ: 0 V. PROGRAM: slightly raised (~1–2 V) to keep SGS off. ERASE: raised with BL to ~18–20 V to generate GIDL holes at the SGS edge.", '所有 string 底部的公共源。READ 时接 0 V；PROGRAM 时略抬高 (~1–2 V) 以关紧 SGS；ERASE 时与 BL 一起升到 ~18–20 V，在 SGS 边缘制造 GIDL 空穴。'), v: () => 'SL = ' + fmt(NODES.SL) + ' V' });
  // slit / common source wall (behind)
  const slit = boxR(-7.45, 3.75, -0.3, 6.15, -1.58, -1.48, M('#4b5568', { metalness: .4 }), g, { edge: false });
  pickable(slit, { name: B("Slit + common-source contact wall (CSL)", 'Slit + 公共源接触墙 (CSL)'), fn: B("Deep trench separating adjacent blocks. In replacement-gate processing, sacrificial SiN is removed and W is filled through it; its conductor connects top metal to the source plate.", '分隔相邻 block 的深槽；replacement-gate 工艺经此去除 SiN 牺牲层并回填 W；槽中导体把顶部金属接到 source plate。'), v: () => 'SL = ' + fmt(NODES.SL) + ' V' });
  // gate plates (W) + oxide
  const oxMat = new THREE.MeshStandardMaterial({ color: '#9fb5d6', transparent: true, opacity: .28, roughness: .3, depthWrite: false });
  for (let i = 0; i < 10; i++) {
    const mat = M('#a7b1c2', { metalness: .55, roughness: .35 });
    const m = boxR(xl(i), 3.4, yc(i) - GT / 2, yc(i) + GT / 2, -1.4, 0, mat, g);
    pickable(m, { name: B(tierName(i) + (i === 0 || i === 9 ? ' · select gate' : ' · W word-line plate'), tierName(i) + (i === 0 || i === 9 ? ' · 选择栅 (select gate)' : ' · W word line 平板')), fn: i === 0 ? B("SGS: source-select transistor gate. On during READ (~4–5 V), off during PROGRAM (0 V), and ~6–8 V below SL during ERASE to generate GIDL at its edge.", 'SGS：源端选择晶体管的栅。READ 时开 (~4–5 V)，PROGRAM 时关 (0 V)，ERASE 时保持比 SL 低 ~6–8 V 以在边缘产生 GIDL。') : i === 9 ? B("SGD: drain-select transistor gate. At ~Vcc during PROGRAM: a BL=0 V string conducts (channel discharges to 0 V); a BL=Vcc string cuts off, leaving a floating channel that WL coupling boosts.", 'SGD：漏端选择晶体管的栅。PROGRAM 时设 ~Vcc：BL=0 V 的 string 导通 (沟道放电到 0 V)，BL=Vcc 的 string 截止 → 沟道浮空并被 WL 耦合升压。') : B("Control gate shared by all cells on this layer. Selected WL: Vread/Vverify/Vpgm. Other WLs: Vread_pass / Vpass. ERASE: all WLs in the block at 0 V.", '该层所有单元共享的控制栅。选中 WL 加 Vread/Vverify/Vpgm，未选 WL 加 Vread_pass / Vpass，擦除时整个 block 的 WL 都接 0 V。'), v: () => `${tierName(i)} = ${fmt(tierV(i), 2)} V` });
    SL.tiers[i] = { m, mat, base: mat.color.clone() };
    if (i < 9) boxR(xl(i + 1), 3.4, yc(i) + GT / 2, yc(i + 1) - GT / 2, -1.4, -0.005, oxMat, g, { edge: false, shadow: false });
  }
  boxR(xl(0), 3.4, -0.3, yc(0) - GT / 2, -1.4, -0.005, oxMat, g, { edge: false, shadow: false });
  boxR(-3.4, 3.4, yc(9) + GT / 2, 6.3, -1.4, -0.005, oxMat, g, { edge: false, shadow: false });
  // pillar cross-section strips
  const LAY = [[0, .13, '#cfd8e3', 'core'], [.13, .21, '#c9a86b', 'ch'], [.21, .25, '#e7f0ff', 'tun'], [.25, .32, '#3fbf8f', 'sin'], [.32, .40, '#9fb5d6', 'blk']];
  const LAYINFO = {
    core: [B("Core SiO₂ (macaroni fill)", 'Core SiO₂ (macaroni 填充)'), B("Oxide filling the hollow channel core. A thin channel (~7 nm) has fewer grain-boundary traps, better subthreshold swing, and less cell variability than a solid poly-Si pillar.", '中空沟道中心填充的氧化物。薄沟道 (~7 nm) 比实心多晶硅柱的晶界陷阱更少、亚阈值摆幅更好、单元间差异更小。'), () => '—'],
    ch: [B("Poly-Si channel", 'Poly-Si 沟道'), B("Each pillar’s thin poly-Si channel forms the series conduction path through the NAND string.", '每根 pillar 的薄多晶硅沟道，是整条 NAND string 的串联导电通路。'), null],
    tun: [B("Tunnel oxide (~5–7 nm)", 'Tunnel oxide 隧穿氧化层 (~5–7 nm)'), B("During programming, electrons cross it from the channel into SiN by FN tunneling; during erase, holes tunnel into SiN in the reverse field. Many CT devices use an ONO engineered tunnel stack.", '编程时电子从沟道 FN 隧穿穿过它进入 SiN；擦除时空穴反向隧穿进入 SiN。许多 CT 器件用 ONO 能带工程的复合隧穿层。'), () => B("E_tun ≈ 10–12 MV/cm (during program pulse)", 'E_tun ≈ 10–12 MV/cm (编程脉冲期间)')],
    sin: [B("SiN charge-trap layer", 'SiN 电荷陷阱层 (charge trap)'), B("Insulating layer that traps electrons locally, changing cell Vt. Unlike a floating gate, it does not conduct, so one defect need not drain the entire cell.", '绝缘的陷阱层，电子被局域地俘获在 SiN 陷阱中 → 改变该单元 Vt。与浮栅不同它不导电，所以一个缺陷不会让整个单元漏光。'), () => B("Trapped charge ↔ ΔVt ≈ −ΔQ/C", '俘获电荷 ↔ ΔVt ≈ −ΔQ/C')],
    blk: [B("Blocking oxide (SiO₂ / Al₂O₃)", 'Blocking oxide 阻挡层 (SiO₂ / Al₂O₃)'), B("Blocks electrons from escaping SiN toward the gate and suppresses reverse electron injection from the gate (erase saturation).", '阻止电子从 SiN 继续跑到栅极、也阻止栅极电子反向注入 (擦除饱和)。'), () => '—'],
  };
  for (let k = 0; k < 4; k++) {
    const x0 = PX[k];
    for (const [a, b, col, id] of LAY) for (const s of [-1, 1]) {
      if (id === 'core' && s === 1) continue;
      const w = id === 'core' ? 2 * b : (b - a), cx = id === 'core' ? x0 : x0 + s * (a + b) / 2;
      const mat = id === 'ch' ? M(col, { roughness: .5, emissive: new THREE.Color('#000'), toneMapped: true }) : M(col, { roughness: .5 });
      const m = mesh(box(w, 6.65, 0.03), mat, { x: cx, y: 2.975, z: 0.016, parent: g, edge: false, shadow: false });
      const [nm, fn, v] = LAYINFO[id];
      pickable(m, { name: B(nm.en + ` · string ${k} (BL${k})`, nm.zh + ` · string ${k} (BL${k})`), fn, v: v || (() => `Vch ≈ ${fmt(NODES.Vch[k], 1)} V`) });
      if (id === 'ch') { SL.ch[k] = SL.ch[k] || []; SL.ch[k].push({ m, mat, base: mat.color.clone() }); }
    }
    // BL plug + bit line + via to page buffer
    const blMat = M('#e0b54d', { metalness: .9, roughness: .28, emissive: new THREE.Color('#000') });
    boxR(x0 - .12, x0 + .12, 6.3, 6.78, -0.24, 0.0, blMat, g, { edge: false });
    const bl = boxR(x0 - .1, x0 + .1, 6.78, 6.94, -2.85, 0.35, blMat, g);
    const via = wire([[x0, 6.8, -2.72], [x0, -0.72, -2.72]], 0.06, blMat, g);
    const info = { name: `Bit line BL${k}`, fn: B("Top-metal bit line connecting the string top (through SGD) to the CuA page buffer. READ: precharge, then discharge; the S/A detects conduction. PROGRAM: 0 V = program, Vcc = inhibit.", '顶层金属 bit line，连接 string 顶端 (经 SGD) 与 CuA 中的 page buffer。READ 时它的电压被预充再放电，S/A 据此判断单元开/关；PROGRAM 时 0 V = 编程，Vcc = 禁止。'), v: () => `BL${k} = ${fmt(NODES.BL[k], 2)} V` };
    pickable(bl, info); via.children.forEach(c => pickable(c, info));
    SL.blMat = SL.blMat || []; SL.blMat[k] = blMat;
  }
  // trapped charge dots (instanced)
  SL.NDOT = 9;
  SL.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.026, 8, 6), new THREE.MeshBasicMaterial({ color: '#93c5fd', toneMapped: false }), 8 * 4 * 2 * SL.NDOT);
  SL.dots.raycast = () => { }; g.add(SL.dots);
  // moving particles (electrons/holes)
  SL.NP = 900;
  SL.parts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.042, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), SL.NP);
  SL.parts.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(SL.NP * 3), 3);
  SL.parts.raycast = () => { }; SL.parts.frustumCulled = false; g.add(SL.parts);
  // labels
  const V = (x, y, z) => () => new THREE.Vector3(SL.X + x, y, z);
  for (let i = 0; i < 10; i++) SL.wlLab[i] = label('', V(xl(i) - 0.12, yc(i), 0), { group: SL.g, side: 'l', cls: 'dot' });
  for (let k = 0; k < 4; k++) {
    SL.blLab[k] = label('', V(PX[k], k % 2 ? 8.0 : 7.25, 0.2), { group: SL.g, cls: 'dot' });
    SL.vchLab[k] = label('', V(PX[k] + 0.3, yc(9) - 0.31, 0.05), { group: SL.g, side: 'r' });
    SL.vtLab[k] = label('', () => new THREE.Vector3(SL.X + SL.PX[k] + 0.45, yc(SEL.wl + 1), 0.05), { group: SL.g, side: 'r' });
    SL.pbLab[k] = label('', V(PX[k], -0.5, -2.75), { group: SL.g });
  }
  SL.slLab = label('', V(-7.5, -0.45, 0), { group: SL.g, side: 'l', cls: 'dot' });
  SL.lab.rowdec = label('Row decoder · HV pass Tr', V(-6.1, -1.1, 0.05), { group: SL.g });
  SL.lab.pump = label('Charge pump · Reg', V(5.25, -1.1, 0.05), { group: SL.g });
  SL.lab.pb = label('Page buffers (CuA)', V(6.3, -0.7, -2.7), { group: SL.g, side: 'r' });
  SL.lab.cua = label('CMOS under Array', V(-8.7, -1.3, 0), { group: SL.g, side: 'l' });
}
function tierV(i) { return i === 0 ? NODES.SGS : i === 9 ? NODES.SGD : NODES.WL[i - 1]; }
const _dm = new THREE.Object3D(), _c = new THREE.Color();
function updateSliceStatic() {
  // colours from voltages
  for (let i = 0; i < 10; i++) { const T = SL.tiers[i], v = tierV(i); T.mat.color.copy(T.base).lerp(vColor(v), clamp(Math.abs(v) / 3) * .88); T.mat.emissive.copy(vColor(v)).multiplyScalar(clamp(v / 22) * .45); }
  for (let k = 0; k < 4; k++) {
    const v = NODES.Vch[k];
    for (const c of SL.ch[k]) { c.mat.color.copy(c.base).lerp(vColor(v), clamp(Math.abs(v) / 3) * .85); c.mat.emissive.copy(vColor(v)).multiplyScalar(clamp(v / 22) * .5); }
    SL.blMat[k].emissive.copy(vColor(NODES.BL[k])).multiplyScalar(clamp(NODES.BL[k] / 3) * .55);
    const pb = SL.pb[k]; pb.mat.emissiveIntensity = .1 + pb.glow; pb.glow = Math.max(0, pb.glow - .03);
  }
  SL.spMat.color.set('#5b6b8a').lerp(vColor(NODES.SL), clamp(NODES.SL / 3) * .85);
  for (const b of [SL.rowdec, SL.pump, SL.fsm]) { b.mat.emissiveIntensity = .1 + b.glow; b.glow = Math.max(0, b.glow - .03); }
  // trapped charge dots from Vt
  let n = 0;
  for (let w = 0; w < 8; w++) for (let k = 0; k < 4; k++) {
    const vt = CELLS[w][k].vt; const cnt = clamp(Math.round((vt + 2.8) * 2.2), 0, 18);
    for (let s = 0; s < 2; s++) for (let j = 0; j < SL.NDOT; j++) {
      const on = (j * 2 + s) < cnt;
      _dm.position.set(SL.PX[k] + (s ? 1 : -1) * 0.285, yc(w + 1) - 0.14 + j * 0.035, 0.045);
      _dm.scale.setScalar(on ? 1 : 0); _dm.updateMatrix(); SL.dots.setMatrixAt(n++, _dm.matrix);
    }
  }
  SL.dots.instanceMatrix.needsUpdate = true;
}
// particle emitters: list of {n, a:[x,y,z], b:[x,y,z], period, col, jit, spread}
function updateParticles(emitters, t) {
  let i = 0;
  for (const e of emitters) {
    const col = _c.set(e.col);
    for (let j = 0; j < e.n && i < SL.NP; j++, i++) {
      const h = fract(Math.sin((j + 1) * 12.9898 + e.seed * 78.233) * 43758.5453);
      const u = fract(t / e.period + j / e.n + h * 0.37);
      const jy = (fract(h * 91.7) - .5) * (e.jy || 0), jx = (fract(h * 53.3) - .5) * (e.jx || 0);
      _dm.position.set(lerp(e.a[0], e.b[0], u) + jx, lerp(e.a[1], e.b[1], u) + jy, lerp(e.a[2], e.b[2], u));
      const fade = Math.min(1, u * 6, (1 - u) * 6);
      _dm.scale.setScalar(fade * (e.size || 1)); _dm.updateMatrix(); SL.parts.setMatrixAt(i, _dm.matrix); SL.parts.setColorAt(i, col);
    }
  }
  for (; i < SL.NP; i++) { _dm.scale.setScalar(0); _dm.position.set(0, -50, 0); _dm.updateMatrix(); SL.parts.setMatrixAt(i, _dm.matrix); }
  SL.parts.instanceMatrix.needsUpdate = true; if (SL.parts.instanceColor) SL.parts.instanceColor.needsUpdate = true;
}

// ================= CELL MODEL: one GAA charge-trap cell, real proportions =================
const CELL = { g: new THREE.Group(), X: 60, shells: [], lab: {}, A0: -0.085 * Math.PI, SW: 1.55 * Math.PI };
CELL.g.position.x = CELL.X; scene.add(CELL.g);
// radii in nm (typical public values), 1 unit = 20 nm
const CR = { core: [0, 25], ch: [25, 32], tun: [32, 38], sin: [38, 45], blk: [45, 53], gate: [53, 80] };
const NM = 1 / 20;
{
  const g = CELL.g, SW = CELL.SW, A0 = CELL.A0;
  const sector = (r0, r1, h) => {
    const s = new THREE.Shape(); const a1 = A0 + SW;
    if (r0 <= 0) { s.moveTo(0, 0); s.absarc(0, 0, r1, A0, a1, false); s.lineTo(0, 0); }
    else { s.absarc(0, 0, r1, A0, a1, false); s.absarc(0, 0, r0, a1, A0, true); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 48 });
    geo.rotateX(-Math.PI / 2); geo.translate(0, -h / 2, 0); return geo;
  };
  const H = 4.4, HG = 1.5;
  const defs = [
    ['core', CR.core, H, '#cfd8e3', 'Core SiO₂ (macaroni)', B("Central oxide fill, radius ~25 nm (typical).", '中心氧化物填充，半径 ~25 nm (typical)。'), 2.4, [0.15, 0, 0.1]],
    ['ch', CR.ch, H, '#c9a86b', B("Poly-Si channel ~7 nm", 'Poly-Si 沟道 ~7 nm'), B("Electrons conduct here. It supplies electrons during programming; GIDL holes raise its potential during erase.", '电子在这里导电；编程时它是电子源，擦除时被 GIDL 空穴抬高电位。'), 1.5, [0.1, 0, -0.08]],
    ['tun', CR.tun, H, '#e7f0ff', 'Tunnel oxide ~6 nm', B("Layer where FN tunneling occurs. Its small inner radius gives the highest electric field.", 'FN 隧穿发生的地方。场强最高的一层 (内半径最小)。'), 0.6, [-0.06, 0, 0.08]],
    ['sin', CR.sin, H, '#3fbf8f', 'SiN charge-trap ~7 nm', B("Charge-storage layer, continuous between adjacent cells. Lateral charge migration is therefore one retention concern in 3D CT NAND.", '电荷存储层。注意它在相邻单元间是连续的 → 横向电荷迁移是 3D CT 的保持问题之一。'), -0.4, [0.08, 0, 0.05]],
    ['blk', CR.blk, H, '#9fb5d6', 'Blocking oxide ~8 nm', B("Largest radius → lowest field, suppressing gate injection.", '半径最大 → 场强最低，抑制栅极注入。'), -1.4, [-0.1, 0, -0.06]],
    ['gate', CR.gate, HG, '#a7b1c2', B("W / TiN gate (word line)", 'W / TiN 栅 (word line)'), B("A ring within the W word-line plate; its voltage surrounds the channel (gate-all-around).", '整层 W 平板中的一圈；栅压从外向内包围 (gate-all-around)。'), -2.6, [0.12, 0, -0.1]],
  ];
  for (const [id, [r0, r1], h, col, name, fn, dy, tilt] of defs) {
    const mat = id === 'gate' ? M(col, { metalness: .6, roughness: .3 }) : M(col, { roughness: .45, transparent: id === 'tun', opacity: id === 'tun' ? .85 : 1 });
    const m = mesh(sector(r0 * NM, r1 * NM, h), mat, { parent: g, edge: false });
    pickable(m, { name, fn, v: () => id === 'gate' ? `Vg = ${fmt(CELLSTEP.vg)} V` : id === 'tun' ? `E_tun = ${(fieldAt(CELLSTEP.vg, CR.tun[0]) / 1e6).toFixed(1)} MV/cm` : id === 'blk' ? B(`E_blk(outer) = ${(fieldAt(CELLSTEP.vg, CR.blk[1]) / 1e6).toFixed(1)} MV/cm`, `E_blk(外) = ${(fieldAt(CELLSTEP.vg, CR.blk[1]) / 1e6).toFixed(1)} MV/cm`) : id === 'sin' ? `ΔVt = ${fmt(CELLSTEP.vt + 1.6, 2)} V` : '' });
    explodable(m, 'cell', [0, dy, 0], tilt, Math.abs(dy) / 3);
    CELL.shells.push({ id, m, mat });
    if (id === 'gate') CELL.gateMat = mat;
  }
  const oxMat = new THREE.MeshStandardMaterial({ color: '#9fb5d6', transparent: true, opacity: .35, depthWrite: false });
  for (const s of [1, -1]) { const m = mesh(sector(CR.gate[0] * NM, CR.gate[1] * NM, (H - HG) / 2), oxMat, { y: s * (HG / 2 + (H - HG) / 4), parent: g, edge: false }); pickable(m, { name: B("Inter-gate SiO₂", '层间 SiO₂ (inter-gate oxide)'), fn: B("Oxide separating adjacent WLs. Its thickness sets WL-to-WL capacitive coupling (cell-to-cell interference).", '把上下相邻 WL 隔开的氧化层，厚度决定 WL 间电容耦合 (cell-to-cell interference)。'), v: () => '' }); explodable(m, 'cell', [0, s * 3.2, 0], [s * .08, 0, .05], .8); }
  CELL.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#93c5fd', toneMapped: false }), 60); CELL.dots.raycast = () => { }; g.add(CELL.dots);
  CELL.parts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#60a5fa', toneMapped: false }), 80); CELL.parts.raycast = () => { }; CELL.parts.frustumCulled = false; g.add(CELL.parts);
  const P = (x, y, z) => () => { const v = new THREE.Vector3(x, y, z); return v.add(CELL.g.position); };
  const LAB = (id, txt, ang, y, side) => { const sh = CELL.shells.find(s => s.id === id); const r = (CR[id][0] + CR[id][1]) / 2 * NM; CELL.lab[id] = label(txt, () => { const p = new THREE.Vector3(Math.cos(ang) * r, y, -Math.sin(ang) * r).applyMatrix4(sh.m.matrixWorld); return p; }, { group: CELL.g, side, cls: 'dot' }); };
  LAB('core', 'Core SiO₂', 2.2, 0.5, 'l');
  LAB('ch', B("Poly-Si channel · 7 nm", 'Poly-Si 沟道 · 7 nm'), 2.6, 1.8, 'l');
  LAB('tun', 'Tunnel SiO₂ · 6 nm', 0.25, 1.6, 'r');
  LAB('sin', B("SiN trap layer · 7 nm", 'SiN 陷阱层 · 7 nm'), 0.15, 0.9, 'r');
  LAB('blk', 'Blocking SiO₂ · 8 nm', 0.05, 0.2, 'r');
  LAB('gate', B("W gate (WL) · GAA", 'W 栅 (WL) · GAA'), 3.6, 0.0, 'l');
  CELL.fieldLab = label('', P(0, 2.9, 0), { group: CELL.g, cls: 'big' });
}
// cylindrical field (V/cm) at radius r(nm) for gate voltage V (channel 0, no stored charge)
const EPS = { tun: 3.9, sin: 7.5, blk: 3.9 };
const SIGMA = Math.log(CR.tun[1] / CR.tun[0]) / EPS.tun + Math.log(CR.sin[1] / CR.sin[0]) / EPS.sin + Math.log(CR.blk[1] / CR.blk[0]) / EPS.blk;
function fieldAt(V, rnm) { const eps = rnm < CR.tun[1] ? EPS.tun : rnm < CR.sin[1] ? EPS.sin : EPS.blk; return V / (eps * rnm * 1e-7 * SIGMA); }
const PLANAR_EOT = (CR.tun[1] - CR.tun[0]) + (CR.sin[1] - CR.sin[0]) * 3.9 / 7.5 + (CR.blk[1] - CR.blk[0]); // nm
const CELLSTEP = { vg: 17, vt: -1.6, pulses: 0 };
function updateCell(t) {
  // dots
  const cnt = clamp(Math.round((CELLSTEP.vt + 2.8) * 4), 0, 60);
  for (let i = 0; i < 60; i++) { const a = CELL.A0 + 0.05 + (i * 2.399) % (CELL.SW - 0.1), r = (CR.sin[0] + 1.5 + (i % 3) * 2) * NM, y = -0.6 + ((i * 0.618) % 1) * 1.2; _dm.position.set(Math.cos(a) * r, y, -Math.sin(a) * r); _dm.scale.setScalar(i < cnt ? 1 : 0); _dm.updateMatrix(); CELL.dots.setMatrixAt(i, _dm.matrix); }
  CELL.dots.instanceMatrix.needsUpdate = true;
  const sin = CELL.shells.find(s => s.id === 'sin'); CELL.dots.position.copy(sin.m.position); CELL.dots.rotation.copy(sin.m.rotation);
  // tunnelling electrons: rate ~ FN J
  const E = fieldAt(CELLSTEP.vg - (CELLSTEP.vt + 1.6), CR.tun[0]); const J = fnJ(E);
  const n = clamp(Math.round(Math.log10(J / 1e-9 + 1) * 14), 0, 80);
  const ch = CELL.shells.find(s => s.id === 'ch');
  for (let i = 0; i < 80; i++) {
    const h = fract(Math.sin(i * 12.9898) * 43758.5); const u = fract(t * 0.9 + h);
    const a = CELL.A0 + 0.05 + h * (CELL.SW - 0.1), r = lerp(CR.ch[0] + 3, CR.sin[0] + 2, u) * NM, y = (fract(h * 7.1) - .5) * 1.2;
    _dm.position.set(Math.cos(a) * r, y, -Math.sin(a) * r).add(ch.m.position); _dm.scale.setScalar(i < n ? Math.min(1, u * 5, (1 - u) * 5) : 0); _dm.updateMatrix(); CELL.parts.setMatrixAt(i, _dm.matrix);
  }
  CELL.parts.instanceMatrix.needsUpdate = true;
  CELL.gateMat.color.set('#a7b1c2').lerp(vColor(CELLSTEP.vg), clamp(CELLSTEP.vg / 3) * .85); CELL.gateMat.emissive.copy(vColor(CELLSTEP.vg)).multiplyScalar(clamp(CELLSTEP.vg / 22) * .4);
}
