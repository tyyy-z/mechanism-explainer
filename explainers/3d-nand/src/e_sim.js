// ================= PHYSICS: compact public-textbook models =================
// FN: J = A E^2 exp(-B/E)  (Lenzlinger & Snow 1969; Si/SiO2, phiB~3.2 eV, m*~0.42 m0)
const PHY = {
  A: 1.15e-6, B: 2.53e8, Bh: 3.05e8,
  EOT: 13.5e-7,      // cm, tunnel-field equivalent thickness derived from the GAA geometry (cell step)
  Cb: 4.3e-7,        // F/cm^2, trapped-charge -> gate coupling
  tp: 15e-6,         // program pulse (typical 10-20 us)
  tpe: 0.6e-3,       // erase pulse (typical ~0.5-1 ms)
  Cr: 0.88,           // boosting ratio C_ins/(C_ins+C_ch)
  Vcc: 2.5, VthSG: 1.2,
  Ion: 80e-9, Cbl: 0.35e-12, Vpre: 0.7, trip: 0.4, tStrobe: 2.5e-6,
};
const STATES = ['Er', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
const TLC_BITS = [[1,1,1],[1,1,0],[1,0,0],[0,0,0],[0,1,0],[0,1,1],[0,0,1],[1,0,1]]; // [LP,MP,UP] 2-3-2 Gray code
const LEVELS = {
  SLC: { n: 2, PV: [null, 1.2], R: [0.5], names: ['1 (Er)', '0 (P)'] },
  TLC: { n: 8, PV: [null, 0.4, 1.1, 1.8, 2.5, 3.2, 3.9, 4.6], R: [0.1, 0.8, 1.5, 2.2, 2.9, 3.6, 4.3], names: STATES },
};
const PAGE_REFS = { SLC: [0], LP: [2, 6], MP: [1, 3, 5], UP: [0, 4] }; // indices into R
const EV = -1.0;   // erase-verify level (effective; negative sensing via source bias)
const fnJ = (E, B = PHY.B) => E <= 2e6 ? 0 : PHY.A * E * E * Math.exp(-B / E);
// prng (separate from geometry prng)
let _sseed = 987654321;
const srnd = () => { _sseed = (_sseed * 1664525 + 1013904223) >>> 0; return _sseed / 4294967296; };
const gauss = () => { let u = 0, v = 0; while (u === 0) u = srnd(); v = srnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

function pgmPulse(vt, Vg, Vch, eotf, tp = PHY.tp) {
  let t = 0, it = 0;
  while (t < tp && it++ < 500) {
    const E = (Vg - Vch - (vt - 0)) / (PHY.EOT * eotf);
    const r = fnJ(E) / PHY.Cb; if (r <= 1e-3) break;
    let dv = r * (tp - t); if (dv > 0.03) { dv = 0.03; t += dv / r; } else t = tp;
    vt += dv;
  }
  return vt;
}
const vchErase = (t, Vers, tau) => (Vers - 1.0) * (1 - Math.exp(-t / tau));
function erasePulse(vt, Vers, eotf, tau, tp = PHY.tpe) {
  let t = 0, it = 0;
  while (t < tp && it++ < 800) {
    const Vch = vchErase(t, Vers, tau);
    const E = (Vch - 0 + vt) / (PHY.EOT * eotf);
    const r = fnJ(E, PHY.Bh) / PHY.Cb;
    let dt = tp / 60; if (r * dt > 0.03) dt = 0.03 / r;
    if (t + dt > tp) dt = tp - t;
    vt -= r * dt; t += dt;
  }
  return vt;
}
const boostV = (Vpass, Vpgm, nWL = 8) => (PHY.Vcc - PHY.VthSG) + PHY.Cr * ((Vpass * (nWL - 1) + Vpgm) / nWL - (PHY.Vcc - PHY.VthSG));
const sig = x => 1 / (1 + Math.exp(-x));
function stringCurrent(VrefSel, vtSel, others, Vpass) {
  let I = PHY.Ion * sig((VrefSel - vtSel) / 0.1);
  for (const v of others) I *= sig((Vpass - v) / 0.15);
  return I;
}
const blV = (I, t) => Math.max(0, PHY.Vpre - I * t / PHY.Cbl);
function decodeState(vt, mode, shift = 0) { const R = LEVELS[mode].R; let s = 0; for (let i = 0; i < R.length; i++) if (vt > R[i] + shift) s = i + 1; return s; }
function pageBit(state, mode, page) { if (mode === 'SLC') return state === 0 ? 1 : 0; return TLC_BITS[state][{ LP: 0, MP: 1, UP: 2 }[page]]; }

// ---- populations ----
const NPOP = 3072;
function newCell() { return { vt: -1.6 + 0.3 * gauss(), eotf: 1 + 0.012 * gauss(), tgt: 0, lock: false }; }
function makePop() { const p = []; for (let i = 0; i < NPOP; i++) p.push(newCell()); return p; }
// ISPP engine: one call = one program pulse + verify, returns stats
function isppInit(pop, mode, Vstart, step, Vpass) { return { pop, mode, k: 0, Vstart, step, Vpass, Vpgm: Vstart, history: [], done: false, maxLoops: 40 }; }
function isppPulse(st, extra = []) {
  const L = LEVELS[st.mode]; st.Vpgm = st.Vstart + st.k * st.step;
  const Vb = boostV(st.Vpass, st.Vpgm);
  const all = st.pop.concat(extra);
  for (const c of all) {
    if (c.tgt === 0 || c.lock) c.vt = pgmPulse(c.vt, st.Vpgm, Vb, c.eotf);       // inhibited: boosted channel (program disturb)
    else { const v0 = c.vt; c.vt = pgmPulse(c.vt, st.Vpgm, 0, c.eotf); if (c.vt - v0 > 0.04) c.vt += 0.045 * gauss(); }
  }
  // verify (PV of each target state)
  let remaining = 0;
  for (const c of all) { if (c.tgt > 0 && !c.lock) { if (c.vt >= L.PV[c.tgt]) c.lock = true; else remaining++; } }
  st.history.push({ k: st.k, Vpgm: st.Vpgm, remaining, Vb });
  st.k++; if (remaining === 0 || st.k >= st.maxLoops) st.done = true;
  return remaining;
}
function programPopulation(pop, mode, step = 0.3, Vpass = 9, targets) {
  const n = LEVELS[mode].n; pop.forEach((c, i) => { c.tgt = targets ? targets[i] : Math.floor(srnd() * n); c.lock = false; });
  const st = isppInit(pop, mode, mode === 'SLC' ? 15.0 : 14.6, step, Vpass); while (!st.done) isppPulse(st); return st;
}
function stats(pop, mode) {
  const L = LEVELS[mode]; const per = []; for (let s = 0; s < L.n; s++) per.push({ n: 0, m: 0, m2: 0, lo: 99, hi: -99 });
  let err = 0; for (const c of pop) { const p = per[c.tgt]; p.n++; p.m += c.vt; p.m2 += c.vt * c.vt; p.lo = Math.min(p.lo, c.vt); p.hi = Math.max(p.hi, c.vt); if (decodeState(c.vt, mode) !== c.tgt) err++; }
  per.forEach(p => { if (p.n) { p.m /= p.n; p.sd = Math.sqrt(Math.max(0, p.m2 / p.n - p.m * p.m)); } });
  return { per, err, rber: err / pop.length };
}
if (typeof module !== 'undefined') module.exports = { PHY, LEVELS, pgmPulse, erasePulse, boostV, makePop, programPopulation, stats, isppInit, isppPulse, stringCurrent, blV, fnJ };
