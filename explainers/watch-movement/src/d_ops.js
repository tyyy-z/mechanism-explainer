// ===================== d_ops: Run-button sequences (chips + phases) for each lesson step =====================
const mkAct = () => ({ hi: '', ghost: -1, lid: -1, lapse: 0 });
const ACT = mkAct(), ACTT = mkAct();
const OPR = { q: [], cur: null, t: 0, kind: '', chips: [], chip: -1, phase: '', dev: '', running: false, result: null };
let OPSCALE = 1;
function seg(o) { const r = Object.assign({ dur: 1, enter() { }, tick() { }, exit() { } }, o); if (!r.done) r.dur *= OPSCALE; return r; }
function act(o) { Object.assign(ACTT, mkAct(), o); }
function setChips(list) { OPR.chips = list.map(tr); OPR.chipsSrc = list; OPR.chip = -1; renderChips(); }
const L2 = (en, zh) => B(en, zh);
const OPS = {};
const camTo = (k, d = 1.4) => shot(SHOTS[k], d);
OPS.TOUR = () => {
  setChips([L2('Mainspring', '发条'), L2('Gear train', '轮系'), L2('Escapement', '擒纵'), L2('Balance', '摆轮'), L2('Rotor', '自动陀')]);
  OPR.q.push(
    seg({ dur: 3.2, chip: 0, label: L2('Energy is stored in the coiled mainspring inside the barrel', '能量储存在条盒里卷紧的发条中'), dev: L2('BARREL', '条盒'), enter() { DISPT.rotor = 0; camTo('barrel'); act({ hi: 'barrel,mains,ratchet', lid: .2, ghost: .15 }); } }),
    seg({ dur: 3.4, chip: 1, label: L2('The gear train speeds it up 5,040× toward the escapement', '轮系把转速放大 5040 倍传到擒纵机构'), dev: '×5040', enter() { DISPT.bridges = .18; camTo('train'); act({ hi: 'center,third,fourth' }); } }),
    seg({ dur: 3.4, chip: 2, label: L2('The pallet fork releases the escape wheel one half-tooth per beat', '擒纵叉每拍放过擒纵轮半个齿'), dev: L2('LEVER', '擒纵叉'), enter() { camTo('escape'); act({ hi: 'esc,pallet' }); } }),
    seg({ dur: 3.4, chip: 3, label: L2('The balance and hairspring swing 4 times a second: the time base', '摆轮和游丝每秒摆 4 个来回：计时基准'), dev: '4 Hz', enter() { DISPT.bridges = 1; camTo('balance'); act({ hi: 'balance,hair' }); } }),
    seg({ dur: 3.4, chip: 4, label: L2('The rotor winds the spring from your wrist movements', '自动陀靠手腕动作给发条上弦'), dev: L2('AUTO', '自动'), enter() { DISPT.rotor = 1; camTo('back'); PRM.wrist = 'desk'; act({ hi: 'rotor' }); }, exit() { PRM.wrist = 'off'; } }),
  );
};
OPS.WIND = () => {
  setChips([L2('Crown', '表冠'), L2('Keyless works', '上条机构'), L2('Ratchet + click', '棘轮 + 止逆爪'), L2('Mainspring', '发条')]);
  OPR.q.push(
    seg({ dur: 2.4, chip: 0, label: L2('Crown pushed in: the sliding pinion meshes with the winding pinion', '表冠推入：离合轮与立轮啮合'), dev: L2('STEM', '柄轴'), enter() { W.wind = Math.min(W.wind, .15); W.crownV = TAU * 1.2; DISPT.dial = 1; camTo('keyless'); act({ hi: 'stem,keyless' }); } }),
    seg({ dur: 2.6, chip: 1, label: L2('Winding pinion → crown wheel on the barrel bridge', '立轮 → 条盒夹板上的小钢轮'), dev: L2('CROWN WHEEL', '小钢轮'), enter() { W.crownV = TAU * 1.8; DISPT.dial = 0; camTo('barrel', 1.6); act({ hi: 'crownw' }); } }),
    seg({ dur: 2.6, chip: 2, label: L2('Crown wheel turns the ratchet; the click stops it running back', '小钢轮带动棘轮；止逆爪防止倒转'), dev: L2('CLICK', '止逆爪'), enter() { W.crownV = TAU * 2.2; act({ hi: 'ratchet' }); } }),
    seg({ dur: 5, chip: 3, label: () => tr(L2('Mainspring coils tighten around the arbor', '发条圈在条轴周围收紧')) + ` · ${fmt(W.wind * 100, 0)} %`, dev: L2('BARREL', '条盒'), enter() { W.crownV = TAU * 3.2; act({ hi: 'mains', lid: .12, ghost: .12 }); }, done: () => W.wind > .985, exit() { W.crownV = 0; } }),
    seg({ dur: 1.2, chip: 3, label: L2('Fully wound', '已上满'), dev: '100 %', enter() { W.crownV = 0; act({ hi: 'mains', lid: .12, ghost: .12 }); } }),
  );
};
OPS.TRAIN = () => {
  setChips([L2('Barrel', '条盒'), L2('Centre 1/h', '中心轮 1/h'), L2('Third', '三轮'), L2('Fourth 1/min', '四轮 1/min'), L2('Escape 12/min', '擒纵轮 12/min')]);
  const L = 600;
  OPR.q.push(
    seg({ dur: 2.4, chip: 0, label: L2('Time-lapse ×600: the barrel turns once in about 7 h', '延时 ×600：条盒约 7 小时转一圈'), dev: '0.14 rev/h', enter() { act({ hi: 'barrel', lapse: L }); } }),
    seg({ dur: 2.4, chip: 1, label: L2('84 → 12 leaves: centre wheel, 1 rev per hour (minute hand)', '84 → 12 叶：中心轮每小时 1 圈（分针）'), dev: '×7', enter() { act({ hi: 'center', lapse: L }); } }),
    seg({ dur: 2.4, chip: 2, label: L2('80 → 10: third wheel, 8 rev per hour', '80 → 10：三轮每小时 8 圈'), dev: '×8', enter() { act({ hi: 'third', lapse: L }); } }),
    seg({ dur: 2.4, chip: 3, label: L2('75 → 10: fourth wheel, 1 rev per minute (seconds hand)', '75 → 10：四轮每分钟 1 圈（秒针）'), dev: '×7.5', enter() { act({ hi: 'fourth', lapse: L }); } }),
    seg({ dur: 3.0, chip: 4, label: L2('84 → 7: escape wheel, 12 rpm — back to real time', '84 → 7：擒纵轮每分钟 12 转——回到实时'), dev: '×12', enter() { act({ hi: 'esc', lapse: 0 }); } }),
  );
};
const PHCH = { lock: 0, turn: 0, unlock: 1, impulse: 2, drop: 3, stop: 0 };
OPS.ESCAPE = () => {
  setChips([L2('Lock', '锁接'), L2('Unlock', '解锁'), L2('Impulse', '冲击'), L2('Drop', '落下')]);
  OPR.q.push(
    seg({ dur: 18, chip: 0, label: () => tr({ lock: L2('Lock: a pallet stone holds an escape tooth; the balance swings free', '锁接：叉瓦挡住擒纵轮齿，摆轮自由摆动'), turn: L2('Turning point: the hairspring reverses the balance', '折返点：游丝让摆轮反向'), unlock: L2('Unlock: the impulse pin flicks the fork; the stone slides off the tooth', '解锁：圆盘钉拨动叉口，叉瓦滑离齿面'), impulse: L2('Impulse: the tooth pushes the stone, the fork pushes the pin', '冲击：齿推叉瓦，叉口推圆盘钉'), drop: L2('Drop: the wheel jumps until the other stone catches it', '落下：擒纵轮跳动，直到被另一颗叉瓦挡住'), stop: L2('Stopped', '已停') }[W.phaseState]), dev: '1/40×',
      enter() { PRM.slow = .025; camTo('escape'); act({ hi: 'esc,pallet', ghost: .12 }); }, tick() { const c = PHCH[W.phaseState] ?? 0; if (c !== OPR.chip) { OPR.chip = c; renderChips(); } OPR.dev = `${fmt(W.theta, 0)}°`; } }),
    seg({ dur: 3.5, chip: 3, label: L2('Real speed: 8 beats per second — the tick-tock you hear', '实时速度：每秒 8 拍——就是你听到的嘀嗒声'), dev: '1×', enter() { PRM.slow = 1; act({ hi: 'esc,pallet', ghost: .12 }); } }),
  );
};
OPS.BEAT = () => {
  setChips([L2('3 Hz', '3 Hz'), L2('4 Hz', '4 Hz'), L2('5 Hz', '5 Hz'), L2('Regulator +', '快慢针 +'), L2('Regulator −', '快慢针 −')]);
  const bph = v => () => { PRM.bph = v; TG.reset(); syncControls.dirty = true; };
  OPR.q.push(
    seg({ dur: 3.4, chip: 0, label: L2('21,600 vph (3 Hz): Seiko NH35-class, 6 beats per second', '21 600 次/时 (3 Hz)：精工 NH35 级，每秒 6 拍'), dev: '21 600', enter: bph(21600) }),
    seg({ dur: 3.4, chip: 1, label: L2('28,800 vph (4 Hz): ETA 2824-2, 8 beats per second', '28 800 次/时 (4 Hz)：ETA 2824-2，每秒 8 拍'), dev: '28 800', enter: bph(28800) }),
    seg({ dur: 3.4, chip: 2, label: L2('36,000 vph (5 Hz): high-beat — smoother seconds, more energy', '36 000 次/时 (5 Hz)：高振频——秒针更顺，更耗能'), dev: '36 000', enter: bph(36000) }),
    seg({ dur: 3.6, chip: 3, label: () => tr(L2('Index toward +: shorter active hairspring → faster', '快慢针拨向 +：游丝有效长度变短 → 走快')) + ` · ${fmt(PRM.reg, 0)} s/d`, dev: L2('INDEX', '快慢针'), enter() { bph(28800)(); rampP('reg', 0, 30, 1.6); act({ hi: 'cock,hair' }); } }),
    seg({ dur: 3.6, chip: 4, label: () => tr(L2('Index toward −: longer active spring → slower; back to zero', '快慢针拨向 −：游丝变长 → 走慢；再回零')) + ` · ${fmt(PRM.reg, 0)} s/d`, dev: L2('INDEX', '快慢针'), enter() { TG.reset(); rampP('reg', 30, -20, 1.4); setTimeout(() => { }, 0); act({ hi: 'cock,hair' }); }, exit() { rampP('reg', PRM.reg, 0, 1.0); } }),
  );
};
OPS.AUTO = () => {
  setChips([L2('Still', '静止'), L2('Desk', '办公'), L2('Walking', '走路'), L2('Bridle slips', '打滑')]);
  OPR.q.push(
    seg({ dur: 2.2, chip: 0, label: L2('Wrist still: the rotor hangs at the bottom, no winding', '手腕静止：摆陀垂在下方，不上弦'), dev: 'g', enter() { PRM.wrist = 'off'; W.autoGain = 6; camTo('rotor'); act({ hi: 'rotor' }); } }),
    seg({ dur: 4, chip: 1, label: L2('Desk work: small tilts, small rotor swings', '办公：手腕轻微倾斜，摆陀小幅摆动'), dev: L2('DESK', '静置'), enter() { PRM.wrist = 'desk'; act({ hi: 'rotor,auto' }); } }),
    seg({ dur: 8, chip: 2, label: () => tr(L2('Walking: big swings; reverser wheels wind both ways', '走路：大幅摆动；换向轮让双向都能上弦')) + ` · ${fmt(W.wind * 100, 0)} %`, dev: L2('WALK', '步行'), enter() { PRM.wrist = 'walk'; act({ hi: 'auto,rotor' }); } }),
    seg({ dur: 2.6, chip: 3, label: L2('At full wind the slipping bridle lets the spring slide — nothing breaks', '上满后打滑附件让发条打滑——不会断'), dev: L2('FULL', '上满'), enter() { W.wind = Math.max(W.wind, .995); act({ hi: 'mains' }); }, exit() { PRM.wrist = 'off'; W.autoGain = 1; } }),
  );
};
OPS.RESERVE = () => {
  setChips([L2('Full', '满弦'), L2('24 h', '24 小时'), L2('Run-down', '放完'), L2('Stopped', '停走'), L2('Rewind', '重新上弦')]);
  const L = 38 * 3600 / 14;
  OPR.q.push(
    seg({ dur: 1.6, chip: 0, label: () => tr(L2('Fully wound: amplitude ~300°', '满弦：振幅约 300°')), dev: '0 h', enter() { W.wind = 1; W.A = ampTarget(1); TG.reset(); act({ lapse: 0 }); } }),
    seg({ dur: 20, chip: 1, label: () => tr(L2('Time-lapse: amplitude falls with mainspring torque', '延时：振幅随发条扭矩下降')) + ` · ${fmt((1 - W.wind) * cfgB().res, 0)} h · ${fmt(W.A, 0)}°`, dev: '×9800', enter() { act({ lapse: L }); }, tick() { const c = W.wind < .25 ? 2 : W.wind < .38 ? 1 : 1; if (c !== OPR.chip) { OPR.chip = c; renderChips(); } }, done: () => !W.run }),
    seg({ dur: 2.4, chip: 3, label: L2('Below ~120° the impulse cannot cross the lift angle: stopped', '低于约 120° 冲击过不了举升角：停走'), dev: L2('STOP', '停摆'), enter() { act({ lapse: 0 }); } }),
    seg({ dur: 3, chip: 4, label: () => tr(L2('Rewind at the crown — the balance restarts by itself', '转表冠重新上弦——摆轮自动起摆')) + ` · ${fmt(W.wind * 100, 0)} %`, dev: L2('CROWN', '表冠'), enter() { W.crownV = TAU * 18; act({ hi: 'mains' }); }, done: () => W.wind > .97, exit() { W.crownV = 0; } }),
  );
};
let RAMPS = [];
const rampP = (key, from, to, dur) => { RAMPS = RAMPS.filter(r => r.key !== key); RAMPS.push({ key, from, to, t0: SIM.t, dur }); };
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
  OPR.q = []; OPR.cur = null; OPR.running = false; RAMPS = [];
  W.crownV = 0; W.autoGain = 1; W.lapse = 0; PRM.wrist = 'off'; if (PRM.slow < 1 && STEPS[CUR].id !== 'escape') PRM.slow = 1; act({});
}
function tickRamps() { RAMPS = RAMPS.filter(r => { const k = smooth((SIM.t - r.t0) / r.dur); PRM[r.key] = lerp(r.from, r.to, k); return k < 1; }); }
function dampAct(dt) { for (const k in ACT) { if (k === 'ghost' || k === 'lid') ACT[k] = ACTT[k]; else if (typeof ACT[k] === 'number') ACT[k] = ACTT[k]; else ACT[k] = ACTT[k]; } }
