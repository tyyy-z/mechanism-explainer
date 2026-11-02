// ================= STATE, NODES, OPERATION SEQUENCER =================
const SEL = { op: 'READ', mode: 'TLC', page: 'LP', wl: 2, data: [0, 4, 7, 1], slc: [1, 0, 0, 1], ispp: 0.3, vpass: 9.5, vread: 6, rshift: 0, vers: 17, ret: 0, pe: 0 };
const mkNodes = () => ({ WL: [0, 0, 0, 0, 0, 0, 0, 0], SGD: 0, SGS: 0, SL: 0, BL: [0, 0, 0, 0], Vch: [0, 0, 0, 0], DWL: 0, WLmax: 0, op: '', unselWL: 0 });
const NODES = mkNodes(), NT = mkNodes();
let CELLS = [], POPS = [], WRITTEN = [];
let BLOCKMODE = 'TLC';
function resetBlock(mode) {
  BLOCKMODE = mode; _sseed = 987654321;
  CELLS = []; POPS = []; WRITTEN = [];
  for (let w = 0; w < 8; w++) {
    CELLS[w] = []; for (let k = 0; k < 4; k++) CELLS[w][k] = newCell();
    POPS[w] = makePop(); WRITTEN[w] = false;
  }
  // WL0-3 pre-programmed with random data (so READ has something to read)
  const n = LEVELS[mode].n;
  for (let w = 0; w < 4; w++) {
    const tg = CELLS[w].map((c, k) => mode === 'TLC' ? [3, 6, 1, 5][(k + w) % 4] : (k + w) % 2);
    CELLS[w].forEach((c, k) => { c.tgt = tg[k]; c.lock = false; });
    const pop = POPS[w]; pop.forEach(c => { c.tgt = Math.floor(srnd() * n); c.lock = false; });
    const st = isppInit(pop, mode, mode === 'SLC' ? 15.0 : 14.6, mode === 'SLC' ? 0.5 : 0.3, 9.5);
    while (!st.done) isppPulse(st, CELLS[w]);
    WRITTEN[w] = true;
  }
}
// ---------- the sequencer ----------
const OPR = { q: [], cur: null, t: 0, kind: '', chips: [], chip: -1, phase: '', dev: '', running: false, result: null, log: [] };
const TR = { bl: [], ispp: [], erase: [], eraseLoops: [], bus: [], busIdx: 0, refs: [], lastRead: null };
let OPCLK = 0; // operation clock (lesson seconds x speed)
function setChips(list) { OPR.chips = list; OPR.chip = -1; renderChips(); }
function seg(o) { return Object.assign({ dur: 1, enter() { }, tick() { }, exit() { } }, o); }
function startOp(kind) {
  if (OPR.running) return false;
  OPR.q = []; OPR.cur = null; OPR.kind = kind; OPR.result = null; OPR.running = true; OPR.log = [];
  if (kind === 'READ') buildRead(); else if (kind === 'PROGRAM') { if (!buildProgram()) { OPR.running = false; return false; } } else if (kind === 'ERASE') buildErase();
  nextSeg(); return true;
}
function nextSeg() {
  if (OPR.cur) OPR.cur.exit();
  OPR.cur = OPR.q.shift() || null; OPR.t = 0;
  if (!OPR.cur) { OPR.running = false; OPR.phase = B("Complete · R/B# = 1 (Ready)", '完成 · R/B# = 1 (Ready)'); OPR.dev = ''; idleBias(); onOpDone && onOpDone(); return; }
  if (OPR.cur.chip !== undefined) { OPR.chip = OPR.cur.chip; renderChips(); }
  OPR.phase = OPR.cur.label || ''; OPR.dev = OPR.cur.dev || '';
  OPR.cur.enter();
}
function tickOp(dt) {
  OPCLK += dt;
  if (!OPR.cur) return;
  OPR.t += dt; const u = clamp(OPR.t / OPR.cur.dur);
  OPR.cur.tick(u);
  if (u >= 1) nextSeg();
}
function abortOp() { OPR.q = []; OPR.cur = null; OPR.running = false; idleBias(); }
function idleBias() { NT.WL.fill(0); NT.SGD = NT.SGS = NT.SL = NT.DWL = 0; NT.BL.fill(0); NT.Vch.fill(0); NT.unselWL = 0; NT.op = ''; }
function busCycles(list) { TR.bus = list; TR.busIdx = 0; }
// command-phase segment: walks through bus cycles, sends packets on the die bus
function cmdSeg(chipStart, cycles, label, chipsSpan) {
  return seg({ dur: 0.22 * cycles.length + 0.3, label, chip: chipStart, dev: 'tWC ≈ 10–25 ns / cycle', enter() { busCycles(cycles); dieGlow('fsm', .2); },
    tick(u) { const i = Math.min(cycles.length - 1, Math.floor(u * cycles.length)); TR.busIdx = i; const c = cycles[i]; let ch = chipStart; for (let j = 0; j < chipsSpan.length; j++) if (i >= chipsSpan[j]) ch = chipStart + j; if (ch !== OPR.chip) { OPR.chip = ch; renderChips(); } PKT.active = true; PKT.u = fract(u * cycles.length); PKT.txt = c.v; PKT.col = c.t === 'cmd' ? '#22d3ee' : c.t === 'addr' ? '#fbbf24' : '#a78bfa'; dieGlow('fsm', .5); },
    exit() { PKT.active = false; } });
}
const PKT = { active: false, u: 0, txt: '', col: '#22d3ee', dir: 1 };
const addrCycles = (n) => Array.from({ length: n }, (_, i) => ({ t: 'addr', v: (i < 2 && n === 5) ? 'C' + (i + 1) : 'R' + (i + 1 - (n === 5 ? 2 : 0)) }));
function refsFor() { return BLOCKMODE === 'SLC' ? PAGE_REFS.SLC : PAGE_REFS[SEL.page]; }
function bitFromCount(cnt) { return cnt % 2 === 0 ? 1 : 0; }
function trueBit(state) { return BLOCKMODE === 'SLC' ? (state === 0 ? 1 : 0) : TLC_BITS[state][{ LP: 0, MP: 1, UP: 2 }[SEL.page]]; }
// ---------- READ ----------
function buildRead() {
  const w = SEL.wl, refs = refsFor(), R = LEVELS[BLOCKMODE].R;
  setChips(['00h', 'ADDR×5', '30h', 'tR', 'DOUT']);
  const res = { above: [0, 0, 0, 0], bits: null, refs: refs.map(i => R[i] + SEL.rshift) };
  TR.bl = []; TR.refs = res.refs; TR.lastRead = res;
  const cyc = [{ t: 'cmd', v: '00h' }, ...addrCycles(5), { t: 'cmd', v: '30h' }];
  OPR.q.push(cmdSeg(0, cyc, B("Command/address cycles: CLE=1 latches 00h → ALE=1 latches 5 address cycles → 30h starts READ", '命令/地址周期：CLE=1 锁存 00h → ALE=1 锁存 5 个地址周期 → 30h 启动'), [0, 1, 6]));
  OPR.q.push(seg({ dur: 0.9, chip: 3, label: B("R/B#=0 · FSM starts: pumps ramp up; row decoder enables this block’s pass transistors", 'R/B#=0 · FSM 启动：泵升压，行译码器打开本 block 的 pass Tr'), dev: 't ≈ 0–5 µs', enter() { NT.op = 'READ'; NT.WL.fill(SEL.vread); NT.WL[w] = 0; NT.DWL = SEL.vread; NT.SGD = NT.SGS = 4.5; NT.SL = 0; NT.Vch.fill(0); TR.bl = []; }, tick() { dieGlow('pump', .9); dieGlow('reg', .6); dieGlow('rowdec', .8); SL.pump.glow = .9; SL.rowdec.glow = .8; } }));
  refs.forEach((ri, n) => {
    const Vr = R[ri] + SEL.rshift, nm = BLOCKMODE === 'SLC' ? 'Vref' : 'R' + (ri + 1);
    OPR.q.push(seg({ dur: 0.55, chip: 3, label: B(`Selected WL${w} ← ${nm} = ${Vr.toFixed(2)} V; other WLs ← Vread_pass = ${SEL.vread} V (forced on)`, `选中 WL${w} ← ${nm} = ${Vr.toFixed(2)} V；其余 WL ← Vread_pass = ${SEL.vread} V (强制导通)`), dev: B("~µs WL settling (RC)", '~µs WL 建立 (RC)'), enter() { NT.WL[w] = Vr; }, tick() { SL.rowdec.glow = .7; dieGlow('rowdec', .7); } }));
    OPR.q.push(seg({ dur: 0.6, chip: 3, label: B(`BL precharge: S/A charges 4 BLs to Vpre ≈ ${PHY.Vpre} V (SGD/SGS on)`, `BL 预充：S/A 把 4 条 BL 充到 Vpre ≈ ${PHY.Vpre} V (SGD/SGS 已开)`), dev: B("Precharge ~1–3 µs", '预充 ~1–3 µs'), enter() { NT.BL.fill(PHY.Vpre); }, tick() { SL.pb.forEach(p => p.glow = .6); dieGlow('pbN', .6); dieGlow('pbS', .6); } }));
    OPR.q.push(seg({ dur: 1.35, chip: 3, label: B(`BL discharge (develop): cells with Vt < ${nm} conduct → string current pulls BL low`, `BL 放电 (develop)：Vt < ${nm} 的单元导通 → string 电流把 BL 拉低`), dev: 't = 0 → ' + (PHY.tStrobe * 1e6).toFixed(1) + ' µs', enter() { this.I = CELLS[w].map((c, k) => stringCurrent(Vr, c.vt, CELLS.filter((_, j) => j !== w).map(r => r[k].vt), SEL.vread)); TR.bl.push({ ref: nm, I: this.I, pts: [[], [], [], []] }); },
      tick(u) { const td = u * PHY.tStrobe * 1.25; const tr = TR.bl[TR.bl.length - 1]; for (let k = 0; k < 4; k++) { const v = blV(this.I[k], td); NODES.BL[k] = NT.BL[k] = v; tr.pts[k].push([td, v]); } } }));
    OPR.q.push(seg({ dur: 0.5, chip: 3, label: B(`Strobe @ ${(PHY.tStrobe * 1e6).toFixed(1)} µs: BL < trip ${PHY.trip} V → conducting (Vt < ${nm}); page buffer latches result`, `Strobe @ ${(PHY.tStrobe * 1e6).toFixed(1)} µs：BL < trip ${PHY.trip} V → 判为 "导通" (Vt < ${nm})，结果锁存到 page buffer`), dev: 'latch', enter() { for (let k = 0; k < 4; k++) { const v = blV(stringCurrent(Vr, CELLS[w][k].vt, CELLS.filter((_, j) => j !== w).map(r => r[k].vt), SEL.vread), PHY.tStrobe); if (v >= PHY.trip) res.above[k]++; } SL.pb.forEach(p => p.glow = 1); }, tick() { } }));
  });
  OPR.q.push(seg({ dur: 1.4, chip: 4, label: B("tR ends · R/B#=1 → controller toggles RE#; page-buffer data passes through column decoder to DQ[7:0]", 'tR 结束 · R/B#=1 → 控制器翻转 RE#，page buffer 数据经列译码器从 DQ[7:0] 输出'), dev: 'tR ≈ 25–80 µs (TLC, typical)',
    enter() { res.bits = res.above.map(bitFromCount); idleBias(); busCycles(res.bits.map((b, k) => ({ t: 'dout', v: 'BL' + k + '=' + b }))); OPR.result = res; },
    tick(u) { dieGlow('coldec', .8); PKT.active = true; PKT.dir = -1; PKT.u = fract(u * 4); TR.busIdx = Math.min(3, Math.floor(u * 4)); PKT.txt = 'DOUT'; PKT.col = '#34d399'; }, exit() { PKT.active = false; PKT.dir = 1; } }));
}
// ---------- PROGRAM ----------
let ISPP = null;
function buildProgram() {
  const w = SEL.wl;
  if (WRITTEN[w]) { toast(() => (B(`WL${w} is already programmed. NAND can only raise Vt in place → ERASE the entire block first, or select another WL.`, `WL${w} 这一页已经写过。NAND 只能把 Vt 往上推，不能原地改写 → 先擦除整个 block (ERASE)，或换一条 WL。`))); return false; }
  setChips(['80h', 'ADDR×5', 'DATA', '10h', 'tPROG', '70h']);
  const tg = BLOCKMODE === 'TLC' ? SEL.data.slice() : SEL.slc.map(b => b ? 0 : 1);
  CELLS[w].forEach((c, k) => { c.tgt = tg[k]; c.lock = false; });
  const n = LEVELS[BLOCKMODE].n; _sseed = 4242 + w; POPS[w].forEach(c => { c.tgt = Math.floor(srnd() * n); c.lock = false; });
  const step = SEL.ispp, Vs = BLOCKMODE === 'SLC' ? 15.0 : 14.6;
  ISPP = isppInit(POPS[w], BLOCKMODE, Vs, step, SEL.vpass); TR.ispp = ISPP.history; ISPP.lockedVis = [false, false, false, false];
  const cyc = [{ t: 'cmd', v: '80h' }, ...addrCycles(5), { t: 'din', v: 'DATA…' }, { t: 'din', v: '16 KiB' }, { t: 'cmd', v: '10h' }];
  OPR.q.push(cmdSeg(0, cyc, B("80h + 5 address cycles + a full page of data via DQ into page buffer; 10h confirms start", '80h + 5 个地址周期 + 一整页数据经 DQ 写入 page buffer，10h 确认启动'), [0, 1, 6, 8]));
  OPR.q.push(seg({ dur: 0.9, chip: 4, label: B("Data → latches: BL ← 0 V for “0/high state”; BL ← Vcc to retain erased state (inhibit). SGD ≈ Vcc, SGS = 0 V", '数据→锁存器：要写 "0/高态" 的 BL ← 0 V；保持擦除态的 BL ← Vcc (禁止编程)。SGD ≈ Vcc，SGS = 0 V'), dev: 'BL setup ~µs',
    enter() { NT.op = 'PROGRAM'; for (let k = 0; k < 4; k++) { const inh = CELLS[w][k].tgt === 0; NT.BL[k] = inh ? PHY.Vcc : 0; NT.Vch[k] = inh ? PHY.Vcc - PHY.VthSG : 0; } NT.SGD = PHY.Vcc; NT.SGS = 0; NT.SL = 1.5; }, tick() { SL.pb.forEach(p => p.glow = .7); dieGlow('pbN', .7); } }));
  pushLoop(w); return true;
}
function pushLoop(w) {
  const st = ISPP, k = st.k, Vp = st.Vstart + k * st.step, slow = k < 2;
  OPR.q.push(seg({ dur: slow ? 1.1 : 0.32, chip: 4, label: B(`ISPP pulse ${k + 1}: WL${w} ← Vpgm = ${Vp.toFixed(2)} V, other WLs ← Vpass = ${SEL.vpass} V; BL=0 cells receive electrons by FN tunneling`, `ISPP 第 ${k + 1} 次脉冲：WL${w} ← Vpgm = ${Vp.toFixed(2)} V，其余 WL ← Vpass = ${SEL.vpass} V；BL=0 的单元 FN 隧穿注入电子`), dev: `t_pulse ≈ ${(PHY.tp * 1e6).toFixed(0)} µs`,
    enter() { NT.WL.fill(SEL.vpass); NT.DWL = SEL.vpass; NT.WL[w] = Vp; NT.SGD = PHY.Vcc; NT.SGS = 0; NT.SL = 1.5; for (let j = 0; j < 4; j++) { const c = CELLS[w][j]; const inh = c.tgt === 0 || c.lock; NT.BL[j] = inh ? PHY.Vcc : 0; NT.Vch[j] = inh ? boostV(SEL.vpass, Vp) : 0; } this.v0 = CELLS[w].map(c => c.vt); },
    tick() { SL.pump.glow = 1; SL.rowdec.glow = .8; dieGlow('pump', 1); dieGlow('rowdec', .8); },
    exit() { isppPulse(st, CELLS[w]); // disturb on unselected WLs: Vpass stress on cells of programmed strings
      for (let j = 0; j < 4; j++) { const inh = CELLS[w][j].tgt === 0; for (let ww = 0; ww < 8; ww++) if (ww !== w) { const c = CELLS[ww][j]; c.vt = pgmPulse(c.vt, SEL.vpass, inh ? boostV(SEL.vpass, Vp) : 0, c.eotf); } }
      this.dv = CELLS[w].map((c, j) => c.vt - this.v0[j]); LASTDV = this.dv; } }));
  const L = LEVELS[BLOCKMODE];
  OPR.q.push(seg({ dur: slow ? 0.8 : 0.22, chip: 4, label: BLOCKMODE === 'TLC' ? B(`Program-verify: WL${w} steps through PV_A…PV_G (${L.PV[1]}…${L.PV[7]} V); cells at target → BL switches to Vcc (locked)`, `Program-verify：WL${w} 依次加 PV_A…PV_G (${L.PV[1]}…${L.PV[7]} V)，达到目标的单元 → BL 改为 Vcc (锁定)`) : B(`Program-verify: WL${w} ← PV = ${L.PV[1]} V; passing cells lock`, `Program-verify：WL${w} ← PV = ${L.PV[1]} V；通过的单元锁定`), dev: 'verify ~µs / level',
    enter() { NT.WL.fill(SEL.vread); NT.DWL = SEL.vread; NT.WL[w] = L.PV[1]; NT.SGD = NT.SGS = 4.5; NT.SL = 0; NT.Vch.fill(0); for (let j = 0; j < 4; j++) NT.BL[j] = (CELLS[w][j].tgt === 0) ? 0 : PHY.Vpre; },
    tick(u) { if (BLOCKMODE === 'TLC') NT.WL[w] = L.PV[1 + Math.min(6, Math.floor(u * 7))]; SL.pb.forEach(p => p.glow = .5); },
    exit() { if (!st.done) pushLoop(w); else OPR.q.push(statusSeg(B(`PASS · ${st.k} ISPP loops; SR[0]=0`, `PASS · ${st.k} 个 ISPP loop；SR[0]=0`), () => { WRITTEN[w] = true; })); } }));
}
let LASTDV = [0, 0, 0, 0];
function statusSeg(msg, fn) {
  return seg({ dur: 1.2, chip: OPR.chips.length - 1, label: B('70h reads status register: ' + trFor(msg, 'en'), '70h 读状态寄存器：' + trFor(msg, 'zh')), dev: 'SR[6]=1 Ready',
    enter() { idleBias(); fn && fn(); busCycles([{ t: 'cmd', v: '70h' }, { t: 'dout', v: 'SR=E0h' }]); OPR.result = { msg }; }, tick(u) { PKT.active = u < .9; PKT.u = fract(u * 2); PKT.txt = u < .5 ? '70h' : 'SR'; PKT.dir = u < .5 ? 1 : -1; PKT.col = '#22d3ee'; }, exit() { PKT.active = false; PKT.dir = 1; } });
}
// ---------- ERASE ----------
const ERS = { loop: 0, V: 17, tau: 40e-6, pass: false };
function buildErase() {
  setChips(['60h', 'ADDR×3', 'D0h', 'tBERS', '70h']);
  ERS.loop = 0; ERS.V = SEL.vers; TR.erase = []; TR.eraseLoops = [];
  const cyc = [{ t: 'cmd', v: '60h' }, ...addrCycles(3), { t: 'cmd', v: 'D0h' }];
  OPR.q.push(cmdSeg(0, cyc, B("60h + 3 row-address cycles (block address only) + D0h confirmation", '60h + 3 个行地址周期 (只需 block 地址) + D0h 确认'), [0, 1, 4]));
  pushErase();
}
function blockStats() { let mx = -9, sum = 0, n = 0, fail = 0; for (const p of POPS) for (const c of p) { if (c.vt > mx) mx = c.vt; sum += c.vt; n++; if (c.vt > EV) fail++; } for (const r of CELLS) for (const c of r) { if (c.vt > mx) mx = c.vt; } return { mx, mean: sum / n, fail, n }; }
function pushErase() {
  const V = ERS.V, j = ERS.loop, slow = j === 0;
  OPR.q.push(seg({ dur: slow ? 2.4 : 1.5, chip: 3, label: B(`Erase pulse ${j + 1}: BL and SL ← Verase = ${V.toFixed(1)} V; SGD/SGS ≈ V−7 V → band-to-band tunneling (GIDL) generates holes at select-gate edges; all block WLs = 0 V`, `擦除脉冲 ${j + 1}：BL 与 SL ← Verase = ${V.toFixed(1)} V；SGD/SGS ≈ V−7 V → 选择栅边缘带间隧穿 (GIDL) 产生空穴；整块 WL = 0 V`), dev: `t_ers ≈ ${(PHY.tpe * 1e3).toFixed(1)} ms`,
    enter() { NT.op = 'ERASE'; NT.WL.fill(0); NT.DWL = 0; NT.BL.fill(V); NT.SL = V; NT.SGD = NT.SGS = V - 7; NT.unselWL = V * 0.85; TR.erase.push({ V, pts: [] }); this.tr = TR.erase[TR.erase.length - 1]; },
    tick(u) { const td = u * PHY.tpe; const vch = vchErase(td, V, ERS.tau); for (let k = 0; k < 4; k++) NODES.Vch[k] = NT.Vch[k] = vch; this.tr.pts.push([td, vch]); SL.pump.glow = 1; dieGlow('pump', 1); },
    exit() { for (const r of CELLS) for (const c of r) c.vt = erasePulse(c.vt, V, c.eotf, ERS.tau) + 0.04 * gauss(); for (const p of POPS) for (const c of p) c.vt = erasePulse(c.vt, V, c.eotf, ERS.tau) + 0.04 * gauss(); } }));
  OPR.q.push(seg({ dur: slow ? 1.0 : 0.6, chip: 3, label: B(`Erase-verify: all block WLs receive EV together (≈ ${EV} V equivalent, negative level implemented by source bias); every string must conduct`, `Erase-verify：整块所有 WL 同时加 EV (≈ ${EV} V 等效，用 source 偏置实现负电平)，每条 string 都必须导通`), dev: 'verify ~10 µs',
    enter() { NT.WL.fill(0); NT.DWL = 0; NT.SL = 1.0; NT.BL.fill(PHY.Vpre + 1.0); NT.SGD = NT.SGS = 4.5; NT.Vch.fill(1.0); NT.unselWL = 0; const s = blockStats(); TR.eraseLoops.push({ V, ...s }); this.s = s; },
    exit() { const ok = this.s.fail / this.s.n < 5e-4 && this.s.mx < EV + 0.6; if (!ok && ERS.loop < 6) { ERS.loop++; ERS.V += 1.0; pushErase(); } else OPR.q.push(statusSeg(ok ? B(`PASS · ${ERS.loop + 1} erase loops (ISPE)`, `PASS · ${ERS.loop + 1} 个擦除 loop (ISPE)`) : B("FAIL (maximum loops exceeded)", 'FAIL (超出最大 loop)'), () => { for (let w = 0; w < 8; w++) { WRITTEN[w] = false; CELLS[w].forEach(c => { c.tgt = 0; c.lock = false; }); POPS[w].forEach(c => { c.tgt = 0; c.lock = false; }); } })); } }));
}
// ---------- node damping ----------
function dampNodes(dt) {
  const L = 14;
  for (let i = 0; i < 8; i++) NODES.WL[i] = damp(NODES.WL[i], NT.WL[i], L, dt);
  for (let k = 0; k < 4; k++) { NODES.BL[k] = damp(NODES.BL[k], NT.BL[k], L, dt); NODES.Vch[k] = damp(NODES.Vch[k], NT.Vch[k], L, dt); }
  for (const p of ['SGD', 'SGS', 'SL', 'DWL', 'unselWL']) NODES[p] = damp(NODES[p], NT[p], L, dt);
  NODES.op = NT.op; NODES.WLmax = Math.max(...NODES.WL, NODES.SL, NODES.BL[0]);
}
// ---------- page statistics (population) ----------
function popReadStats(w, shift, transform) {
  const refs = refsFor(), R = LEVELS[BLOCKMODE].R; let err = 0; const pop = POPS[w];
  for (let i = 0; i < pop.length; i++) { const c = pop[i]; const vt = transform ? transform(c, i) : c.vt; let cnt = 0; for (const ri of refs) if (vt > R[ri] + shift) cnt++; if (bitFromCount(cnt) !== trueBit(c.tgt)) err++; }
  return err / pop.length;
}
// reliability: illustrative retention + P/E model (NOT a fitted model)
function hash01(i) { return fract(Math.sin(i * 127.1 + 311.7) * 43758.5453); }
function relTransform(c, i) {
  const yrs = SEL.ret, pe = SEL.pe; const wear = 1 + pe / 3000;
  const loss = 0.0025 * (c.vt + 1.6) * Math.log(1 + yrs * 8760) * wear;
  const g = (hash01(i) + hash01(i + 7) + hash01(i + 13) - 1.5) * 2; // ~N(0, 1)
  const sig = 0.008 * Math.sqrt(Math.log(1 + yrs * 8760)) * wear + 0.02 * pe / 1000;
  return c.vt - loss + g * sig;
}
