// ===================== d_ops: activity state + operation sequencer (one op per lesson step) =====================
const mkAct = () => ({ byp: .55, core: .55, parcel: -1, hi: '', starter: 0, fuelvis: 0, dil: 0, surge: 0, pw: '' });
const ACT = mkAct(), ACTT = mkAct();
const OPR = { q: [], cur: null, t: 0, kind: '', chips: [], chip: -1, phase: '', dev: '', running: false, result: null, thrOv: null };
let OPSCALE = 1;
function seg(o) { const r = Object.assign({ dur: 1, enter() { }, tick() { }, exit() { } }, o); if (!r.done) r.dur *= OPSCALE; return r; }
function act(o) { Object.assign(ACTT, mkAct(), o); }
function setChips(list) { OPR.chips = list.map(tr); OPR.chipsSrc = list; OPR.chip = -1; renderChips(); }
const L2 = (en, zh) => B(en, zh);
const OPS = {};
OPS.START = () => {
  setChips([L2('Off', '停车'), L2('Starter', '起动机'), L2('Light-off', '点火'), L2('Idle', '慢车')]);
  OPR.q.push(
    seg({ dur: 1.0, chip: 0, label: L2('Engine off: no flow, no fire', '发动机停车：无气流、无火焰'), dev: 'AGB', enter() { ENG.lit = 0; ENG.fuel = 0; ENG.motor1 = 0; ENG.motor2 = 0; ENG.n1 = 0; ENG.n2 = 0; act({ byp: 0, core: 0 }); } }),
    seg({ dur: 3.4, chip: 1, label: L2('Air starter drives the HP spool through the gearbox', '空气起动机经齿轮箱带转高压转子'), dev: 'N2 ↑', enter() { ENG.motor2 = .27; ENG.motor1 = .07; act({ byp: .08, core: .25, starter: 1, hi: 'agb' }); } }),
    seg({ dur: 1.6, chip: 2, label: L2('~25 % N2: fuel on, igniters fire — light-off', 'N2 约 25%：开油、点火嘴打火——点燃'), dev: 'FADEC', enter() { ENG.fuel = 1; ENG.lit = 1; OPR.thrOv = 0; act({ byp: .2, core: .5, starter: 1, hi: 'comb' }); } }),
    seg({ dur: 6, chip: 3, label: L2('Starter cuts out ~55 % N2; engine settles at ground idle', '约 55% N2 起动机脱开；稳定在地面慢车'), dev: 'IDLE', enter() { act({ byp: .35, core: .6 }); }, done: () => ENG.n2 > .585 && OPR.t > 1.5, exit() { OPR.thrOv = null; } }),
  );
};
OPS.SPLIT = () => {
  setChips([L2('Fan', '风扇'), L2('Bypass', '外涵'), L2('Core', '内涵'), L2('Both', '合计')]);
  OPR.q.push(
    seg({ dur: 2.2, chip: 0, label: L2('24 fan blades accelerate all the incoming air', '24 片风扇叶片给全部进气加速'), dev: 'FAN', enter() { act({ byp: 1, core: 1, hi: 'fan' }); } }),
    seg({ dur: 2.8, chip: 1, label: () => tr(L2('Bypass: ', '外涵：')) + `${fmt(ENG.R.mb, 0)} kg/s → ${fmt(ENG.R.Fb / 1000, 0)} kN`, dev: 'BPR', enter() { act({ byp: 1, core: .12, hi: 'ogv' }); } }),
    seg({ dur: 2.8, chip: 2, label: () => tr(L2('Core: ', '内涵：')) + `${fmt(ENG.R.mc, 0)} kg/s → ${fmt(ENG.R.Fc / 1000, 0)} kN`, dev: 'CORE', enter() { act({ byp: .12, core: 1, hi: 'hpc' }); } }),
    seg({ dur: 2.0, chip: 3, label: () => tr(L2('Total thrust ', '总推力 ')) + fmt(ENG.R.F / 1000, 1) + ' kN', dev: 'F', enter() { act({ byp: 1, core: 1 }); } }),
  );
};
// parcel path stations (x along the core flow path) -> section highlight + label
const PSTA = [[-3.5, '0', 'fan'], [1.0, '2', 'fan'], [4.3, '25', 'lpc'], [9.8, '3', 'hpc'], [13.6, '4', 'comb'], [15.2, '45', 'hpt'], [18.2, '5', 'lpt'], [23.0, '9', 'noz']];
OPS.PARCEL = () => {
  setChips([L2('Fan root', '风扇根部'), L2('Booster', '增压级'), L2('HPC', '高压压气机'), L2('Combustor', '燃烧室')]);
  const sec = [[0, .18, 0, 'lpc'], [.18, .38, 1, 'lpc'], [.38, .72, 2, 'hpc'], [.72, 1, 3, 'comb']];
  OPR.q.push(seg({ dur: 9, label: () => { const u = ACT.parcel, i = PSTA.findIndex(p => p[0] > lerp(-3.5, 13.6, u)); const s = ENG.R.ST.find(z => z.k === (PSTA[Math.max(0, i - 1)] || PSTA[0])[1]) || ENG.R.ST[0]; return tr(L2('Station ', '截面 ')) + s.k + ` · ${fmt(s.P / 1e5, 1)} bar · ${fmt(s.T, 0)} K`; }, dev: 'PARCEL',
    enter() { act({ byp: .2, core: .45 }); ACTT.parcel = 0; ACT.parcel = 0; },
    tick(u) { ACT.parcel = ACTT.parcel = u; const s = sec.find(z => u >= z[0] && u <= z[1]) || sec[3]; ACTT.hi = s[3]; if (OPR.chip !== s[2]) { OPR.chip = s[2]; renderChips(); } } }),
    seg({ dur: 1.4, label: L2('Ready to burn: ~32× pressure, ~850 K', '准备燃烧：约 32 倍压力，约 850 K'), dev: '3', enter() { act({ byp: .3, core: .6, parcel: 1, hi: 'comb' }); } }));
};
OPS.IGNITE = () => {
  setChips([L2('Manifold', '总管'), L2('Swirl', '旋流'), L2('Dilution', '掺混')]);
  OPR.q.push(
    seg({ dur: 2.6, chip: 0, label: () => tr(L2('Ring manifold feeds 20 nozzles: ', '环形总管给 20 个喷嘴供油：')) + fmt(ENG.R.mf, 2) + ' kg/s', dev: 'FUEL', enter() { act({ core: .5, byp: .2, fuelvis: 1, hi: 'fuel' }); } }),
    seg({ dur: 2.6, chip: 1, label: L2('Swirlers trap a recirculating flame in the dome', '旋流器在头部形成回流区，稳住火焰'), dev: 'DOME', enter() { act({ core: .7, byp: .2, fuelvis: 1, hi: 'comb' }); } }),
    seg({ dur: 2.8, chip: 2, label: () => tr(L2('Dilution holes cool the gas to T4 = ', '掺混孔把燃气降到 T4 = ')) + fmt(ENG.R.Tt4, 0) + ' K', dev: 'T4', enter() { act({ core: 1, byp: .2, dil: 1, hi: 'comb' }); } }),
  );
};
OPS.WORK = () => {
  setChips([L2('HPT → HPC', '高压涡轮 → 高压压气机'), L2('LPT → fan', '低压涡轮 → 风扇'), L2('Shafts', '双轴')]);
  OPR.q.push(
    seg({ dur: 3, chip: 0, label: () => `HPT ${fmt(ENG.R.PW.hpt, 1)} MW = HPC ${fmt(ENG.R.PW.hpc, 1)} MW`, dev: 'N2', enter() { act({ core: 1, byp: .3, hi: 'hpt', pw: 'hp' }); } }),
    seg({ dur: 3, chip: 1, label: () => `LPT ${fmt(ENG.R.PW.lpt, 1)} MW → ${tr(L2('fan + booster', '风扇 + 增压级'))}`, dev: 'N1', enter() { act({ core: 1, byp: 1, hi: 'lpt', pw: 'lp' }); } }),
    seg({ dur: 3.6, chip: 2, label: L2('Inner LP shaft runs inside the HP drum at a different speed', '内侧低压轴在高压转子鼓筒内以不同转速旋转'), dev: 'SHAFT', enter() { act({ core: .6, byp: .6, hi: 'shaft' }); setExplode('eng', 1, 1.8); shot(SHOTS.expl, 1.8); }, exit() { setExplode('eng', 0, 1.4); shot(SHOTS[STEPS[CUR].view], 1.4); } }),
  );
};
OPS.SPOOL = () => {
  setChips([L2('Idle', '慢车'), L2('Burst', '猛推'), L2('Take-off', '起飞')]);
  OPR.q.push(
    seg({ dur: 2.5, chip: 0, label: L2('Ground idle: ~20 % N1, ~60 % N2', '地面慢车：约 20% N1、60% N2'), dev: 'IDLE', enter() { OPR.thrOv = 0; act({}); }, done: () => OPR.t > 2.5 && ENG.n1 < .3 }),
    seg({ dur: 8, chip: 1, label: () => `N2 ${fmt(ENG.n2 * 100, 0)} % · N1 ${fmt(ENG.n1 * 100, 0)} %`, dev: 'TLA ↑', enter() { OPR.thrOv = 1; act({ byp: 1, core: 1 }); }, done: () => ENG.n1 > .97 * cycle(PRM, { thr: 1 }).n1 }),
    seg({ dur: 2, chip: 2, label: () => tr(L2('Take-off thrust ', '起飞推力 ')) + fmt(ENG.R.F / 1000, 0) + ' kN', dev: 'TO', exit() { OPR.thrOv = null; PRM.thr = 1; } }),
  );
};
let RAMPS = [];
const rampP = (key, from, to, dur) => RAMPS.push({ key, from, to, t0: SIM.t, dur });
OPS.CYCLE = () => {
  setChips([L2('BPR 1→11', '涵道比 1→11'), L2('OPR 20→45', '总压比 20→45'), L2('Result', '结果')]);
  OPR.q.push(
    seg({ dur: 6, chip: 0, label: () => `BPR ${fmt(PRM.bpr, 1)} · η_p ${fmt(ENG.R.etaP * 100, 0)} %`, dev: 'FAN', enter() { act({ byp: 1, core: 1 }); PRM.bpr = 1; rampP('bpr', 1, 11, 5.5); } }),
    seg({ dur: 4.5, chip: 1, label: () => `OPR ${fmt(PRM.opr, 0)} · η_th ${fmt(ENG.R.etaTh * 100, 0)} %`, dev: 'CORE', enter() { PRM.opr = 20; rampP('opr', 20, 45, 4); } }),
    seg({ dur: 2.4, chip: 2, label: () => `η_o ${fmt(ENG.R.etaO * 100, 1)} % · TSFC ${fmt(ENG.R.tsfc, 1)} g/kN·s`, dev: 'LEAP', exit() { } }),
  );
};
OPS.SURGE = () => {
  setChips([L2('Steady', '稳态'), L2('Fuel spike', '突增供油'), L2('Surge', '喘振'), L2('Recover', '恢复')]);
  OPR.q.push(
    seg({ dur: 1.6, chip: 0, label: () => tr(L2('Surge margin ', '喘振裕度 ')) + fmt(ENG.R.map.sm, 0) + ' %', dev: 'HPC', enter() { act({ hi: 'hpc' }); } }),
    seg({ dur: 4, chip: 1, label: () => tr(L2('Too much fuel too fast: PR rises, margin shrinks → ', '加油过快：压比上升，裕度缩小 → ')) + fmt(ENG.R.map.sm, 0) + ' %', dev: 'FUEL ↑', enter() { act({ hi: 'hpc' }); },
      tick(u, dt) { ENG.surgeKick = Math.min(5, ENG.surgeKick + dt * 2.2); }, done: () => ENG.R.map.sm < -1 }),
    seg({ dur: 1.8, chip: 2, label: L2('Blades stall — high-pressure air blows forward (bang!)', '叶片失速——高压空气向前倒灌 (砰！)'), dev: 'SURGE', enter() { act({ hi: 'hpc', surge: 1, core: 1 }); ENG.surge = 1; } }),
    seg({ dur: 3, chip: 3, label: L2('FADEC cuts fuel, opens bleed, closes VSVs — flow re-establishes', 'FADEC 减油、打开放气、关小可调静子——气流恢复'), dev: 'VSV', enter() { act({ hi: 'vsv' }); ENG.surge = 0; },
      tick(u, dt) { ENG.surgeKick = Math.max(0, ENG.surgeKick - dt * 3); } , exit() { ENG.surgeKick = 0; } }),
  );
};
function startOp(kind) {
  if (OPR.running || !OPS[kind]) return false;
  OPR.q = []; OPR.cur = null; OPR.kind = kind; OPR.result = null; OPR.running = true; OPS[kind](); nextSeg(); return true;
}
function nextSeg() {
  if (OPR.cur) OPR.cur.exit();
  OPR.cur = OPR.q.shift() || null; OPR.t = 0;
  if (!OPR.cur) { OPR.running = false; OPR.phase = ''; OPR.dev = ''; act({}); onOpDone(); return; }
  if (OPR.cur.chip !== undefined) { OPR.chip = OPR.cur.chip; renderChips(); }
  OPR.phaseSrc = OPR.cur.label || ''; OPR.dev = OPR.cur.dev || '';
  OPR.cur.enter();
}
function tickOp(dt) {
  if (!OPR.cur) return;
  OPR.t += dt; const u = clamp(OPR.t / OPR.cur.dur);
  OPR.cur.tick(u, dt);
  OPR.phase = typeof OPR.phaseSrc === 'function' ? OPR.phaseSrc() : tr(OPR.phaseSrc);
  if (u >= 1 || (OPR.cur.done && OPR.cur.done())) nextSeg();
}
function abortOp() {
  if (OPR.cur) try { OPR.cur.exit(); } catch (e) { }
  OPR.q = []; OPR.cur = null; OPR.running = false; OPR.thrOv = null; RAMPS = []; ENG.surgeKick = 0; ENG.surge = 0; ENG.lit = 1; ENG.fuel = 1; act({});
}
function tickRamps() { RAMPS = RAMPS.filter(r => { const k = smooth((SIM.t - r.t0) / r.dur); PRM[r.key] = lerp(r.from, r.to, k); return k < 1; }); }
function dampAct(dt) { for (const k in ACT) { if (typeof ACT[k] === 'number' && k !== 'parcel') ACT[k] = damp(ACT[k], ACTT[k], 5, dt); else ACT[k] = ACTT[k]; } }
