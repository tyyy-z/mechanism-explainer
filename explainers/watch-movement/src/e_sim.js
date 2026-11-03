// ===================== e_sim: mainspring → train → Swiss lever escapement → balance oscillator =====================
// Public-data model (refs/REFS.md): ETA 2824-2 = 28,800 vph (4 Hz), 38 h reserve, lift angle 50°; Seiko NH35 = 21,600 vph (3 Hz), 41 h.
// Amplitude ∝ √(mainspring torque) (impulse energy vs. ~quadratic losses); rate error from regulator + isochronism. Illustrative constants.
const PRM = { bph: 28800, wind: 1, reg: 0, slow: 1, wrist: 'off' };
const BPH = {
  21600: { f: 3, res: 41, A0: 295, name: 'NH35-class' },
  28800: { f: 4, res: 38, A0: 300, name: 'ETA 2824-2-class' },
  36000: { f: 5, res: 50, A0: 285, name: 'high-beat' },
};
const LIFT = 50, LEVER = 7.5, ESC_T = 20;      // lift angle (deg), lever half-swing (deg), escape teeth
const TRAIN = { barrel: 84, cp: 12, center: 80, tp: 10, third: 75, fp: 10, fourth: 84, ep: 7 }; // teeth (barrel→escape ratio 5040)
const W = {
  wind: 1, p: 0, A: 300, run: true, tw: 0, lapse: 0, crown: 0, crownV: 0, rotor: 0, rotorV: 0, wrist: 0, winding: 0,
  escA: 0, autoGain: 1, beats: 0, lever: 0, theta: 0, phaseState: 'lock', rate: 0, hist: [],
};
function cfgB() { return BPH[PRM.bph] || BPH[28800]; }
// mainspring torque fraction of full-wind torque (flat-ish slip-spring curve, collapses in the last ~10 %)
function tau(w) { w = clamp(w); return (0.6 + 0.4 * w) * Math.min(1, Math.sqrt(w / 0.1)); }
const T_FULL = 7.5;                       // N·mm at full wind (illustrative, order of a 2824 mainspring)
function ampTarget(w) { const c = cfgB(); return c.A0 * Math.sqrt(tau(w)); }
function rateOf(A) {                      // s/day: regulator + isochronism (amplitude) error
  let r = PRM.reg + 0.06 * (A - 275);
  if (A < 220) r -= 0.004 * (220 - A) * (220 - A);
  return r;
}
function escTorque(w) { return T_FULL * tau(w) / 5040 * 0.72 * 1000; } // µN·m at the escape wheel (≈72 % train efficiency)
function hairK() { const f = cfgB().f, I = 1.0e-9; return I * Math.pow(2 * Math.PI * f, 2) * 1e6; } // µN·m/rad for I = 10 mg·cm²
// wrist model for the automatic rotor (eccentric mass pendulum)
const WRIST = { off: { amp: 0, f: 0 }, desk: { amp: .25, f: .3 }, walk: { amp: 1.2, f: 1.0 } };
function watchStep(dt) {
  const c = cfgB(), f = c.f;
  // --- automatic winding: rotor is a damped pendulum driven by wrist tilt; both directions wind (reverser wheels)
  const wr = WRIST[PRM.wrist] || WRIST.off; W.wrist += dt * wr.f * 2 * Math.PI;
  const g = wr.amp * Math.sin(W.wrist) + .35 * wr.amp * Math.sin(W.wrist * 2.3 + 1);
  const acc = -9 * Math.sin(W.rotor - g) - 1.6 * W.rotorV;
  W.rotorV += acc * dt; W.rotor += W.rotorV * dt;
  const rw = Math.abs(W.rotorV) * 0.0011 * W.autoGain * (W.wind < 1 ? 1 : 0);   // per rad/s of rotor (time-lapsed for display)
  // --- crown winding (set by ops/UI)
  W.crown += W.crownV * dt;
  const cw = W.crownV > 0 ? W.crownV / (2 * Math.PI) * 0.028 * dt : 0; // ~36 crown turns from empty to full
  W.winding = damp(W.winding, (rw > 2e-4 || W.crownV > 0) ? 1 : 0, 6, dt);
  // --- unwinding (hours compressed by lapse factor)
  const hrs = dt * (1 + W.lapse) / 3600;
  W.wind = clamp(W.wind + rw * dt + cw - (W.run ? hrs / c.res : 0));
  PRM.wind = W.wind;
  // --- oscillator
  const At = W.wind > 0.004 ? ampTarget(W.wind) : 0;
  W.A = damp(W.A, At, W.A > At ? .9 : 1.8, dt);
  if (W.A < 110) { W.run = false; } else if (At > 140) W.run = true;
  if (!W.run) W.A = damp(W.A, 0, 3, dt);
  W.rate = rateOf(W.A);
  const fe = f * (1 + W.rate / 86400);
  const sl = PRM.slow;
  if (W.run || W.A > 2) W.p += 2 * Math.PI * fe * dt * sl * (W.run ? 1 : .6);
  W.tw += (W.run ? dt * sl : 0) + (W.run ? dt * W.lapse : 0);
  // kinematics from phase
  const A = Math.max(W.A, 1), th = A * Math.sin(W.p); W.theta = th;
  const half = LIFT / 2; const a = Math.asin(Math.min(1, half / A));
  const K = Math.floor((W.p + a) / Math.PI), loc = clamp((W.p - K * Math.PI + a) / (2 * a));
  // lever follows the impulse pin inside the lift angle, rests on a banking pin outside
  W.lever = LEVER * clamp(th / half, -1, 1);
  // escape wheel: one half-tooth (9°) per beat, released during the impulse
  const step = 360 / ESC_T / 2;
  W.beats = K; W.escA = (K - 1 + smooth(loc)) * step;
  const pin = Math.abs(th) < half;
  W.phaseState = !W.run ? 'stop' : pin ? (loc < .25 ? 'unlock' : loc < .85 ? 'impulse' : 'drop') : (Math.abs(th) > A * .97 ? 'turn' : 'lock');
  W.lapseHands = W.tw;
}
function R() {
  const c = cfgB(), f = c.f;
  return { f, bph: PRM.bph, A: W.A, rate: W.rate, res: W.wind * c.res, resMax: c.res, wind: W.wind, T: T_FULL * tau(W.wind), Te: escTorque(W.wind), k: hairK(), escRpm: 60 * 2 * f / ESC_T, run: W.run, state: W.phaseState };
}
