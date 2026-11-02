// ===================== e_sim: two-spool separate-flow turbofan cycle (Brayton) =====================
// Textbook 1-D cycle (Mattingly "Elements of Propulsion" ch.7 style, with component efficiencies).
// Calibrated to public CFM56-7B numbers: ~340 kg/s, BPR 5.3, OPR ~32, ~118 kN SLS take-off, TSFC ~10.5 g/(kN·s).
// Operating schedule (idle→take-off) is illustrative, not the FADEC schedule.
const GAS = { cpc: 1004.5, gc: 1.4, cph: 1156, gh: 1.33, R: 287.05, LHV: 43.1e6 };
const FLIGHT = {
  sls: { M: 0, h: 0 }, climb: { M: 0.5, h: 3000 }, cruise: { M: 0.78, h: 10668 }
};
function isa(h) { const T = h < 11000 ? 288.15 - 0.0065 * h : 216.65; const P = h < 11000 ? 101325 * Math.pow(T / 288.15, 5.2559) : 22632 * Math.exp(-(h - 11000) / 6341.6); return { T, P }; }
const PRM = { thr: 1, flight: 'sls', bpr: 5.3, opr: 32, t4: 1600, eff: 'real', bleed: 0 };
const N100 = { n1: 5175, n2: 14460 };
const fprFor = bpr => Math.min(3.4, 1 + 4.7 / (bpr + 0.9));
function nozzle(Pt, Tt, P0, g, cp) {
  // convergent nozzle; returns exit velocity, pressure thrust per unit mass flow, choked flag
  const crit = Math.pow((g + 1) / 2, g / (g - 1)); const R = GAS.R;
  const pr = Math.max(1.0001, Pt / P0);
  if (pr >= crit) { const Te = Tt * 2 / (g + 1), Pe = Pt / crit, V = Math.sqrt(g * R * Te), rho = Pe / (R * Te); return { V, Fp: (Pe - P0) / (rho * V), choked: true, M: 1, Pe, Te }; }
  const Te = Tt / Math.pow(pr, (g - 1) / g); const V = Math.sqrt(Math.max(0, 2 * cp * (Tt - Te))); return { V, Fp: 0, choked: false, M: V / Math.sqrt(g * R * Te), Pe: P0, Te };
}
function cycle(p = PRM, over = {}) {
  p = Object.assign({}, p, over);
  const { cpc, gc, cph, gh, LHV } = GAS; const ideal = p.eff === 'ideal';
  const E = ideal ? { d: 1, f: 1, c: 1, b: 1, pb: 1, t: 1, m: 1, n: 1 } : { d: .995, f: .905, c: .875, b: .998, pb: .955, t: .915, m: .995, n: .985 };
  const fl = FLIGHT[p.flight] || FLIGHT.sls; const A = isa(fl.h);
  const T0 = A.T, P0 = A.P, a0 = Math.sqrt(gc * GAS.R * T0), V0 = fl.M * a0;
  const x = clamp(p.thr, 0, 1.05);
  // spool schedule (illustrative operating line)
  const n1 = 0.21 + 0.79 * Math.pow(x, 0.75), n2 = 0.60 + 0.40 * Math.pow(x, 0.55);
  const fprD = fprFor(p.bpr), lpD = 2.6, hpD = Math.max(1.5, p.opr / lpD);
  const pif = 1 + (fprD - 1) * n1 * n1, pil = 1 + (lpD - 1) * Math.pow(n1, 1.6), pih = 1 + (hpD - 1) * Math.pow((n2 - 0.42) / 0.58, 2.1) * (1 + 0.06 * (p.surgeKick || 0));
  const Tt4 = 950 + (p.t4 - 950) * Math.pow(x, 1.15);
  const Tt0 = T0 * (1 + (gc - 1) / 2 * fl.M * fl.M), Pt0 = P0 * Math.pow(Tt0 / T0, gc / (gc - 1));
  const tauC = (pi, eta) => 1 + (Math.pow(pi, (gc - 1) / gc) - 1) / eta;
  const Tt2 = Tt0, Pt2 = Pt0 * E.d;
  const Tt13 = Tt2 * tauC(pif, E.f), Pt13 = Pt2 * pif;
  const Tt25 = Tt2 * tauC(pil, E.f), Pt25 = Pt2 * pil;   // fan root + 3-stage booster on core stream
  const Tt3 = Tt25 * tauC(pih, E.c), Pt3 = Pt25 * pih;
  const Pt4 = Pt3 * E.pb;
  const f = Math.max(0.004, (cph * Tt4 - cpc * Tt3) / (E.b * LHV - cph * Tt4));
  const bl = p.bleed || 0;  // customer bleed fraction of core flow
  const alpha = p.bpr;
  // HP spool work balance: HPT drives HPC
  const wHPC = cpc * (Tt3 - Tt25);
  const Tt45 = Tt4 - wHPC / (E.m * (1 + f - bl) * cph);
  const eT = (tin, tout) => Math.pow(1 - (1 - tout / tin) / E.t, gh / (gh - 1));
  const Pt45 = Pt4 * eT(Tt4, Tt45);
  // LP spool: LPT drives fan (bypass) + fan root/booster (core)
  const wLP = cpc * (alpha * (Tt13 - Tt2) + (Tt25 - Tt2));
  const Tt5 = Tt45 - wLP / (E.m * (1 + f - bl) * cph);
  const Pt5 = Pt45 * eT(Tt45, Math.max(Tt5, 1));
  const nc = nozzle(Pt5 * E.n, Tt5, P0, gh, cph), nb = nozzle(Pt13 * E.n, Tt13, P0, gc, cpc);
  // mass flow
  const thetaR = Tt0 / 288.15, deltaR = Pt0 / 101325;
  const mcoreD = 340 / (1 + 5.3);
  const mc = mcoreD * Math.pow(n1, 1.25) * deltaR / Math.sqrt(thetaR) * (1 + 0.012 * (p.opr - 32)), mb = mc * alpha, m0 = mc + mb;
  const mf = f * mc;
  const Fc = mc * ((1 + f - bl) * nc.V - V0 + (1 + f) * nc.Fp), Fb = mb * (nb.V - V0 + nb.Fp);
  const F = Math.max(0, Fc + Fb);
  const tsfc = F > 1 ? mf / (F / 1000) * 1000 : 0; // g/(kN s)
  const Vec = (1 + f - bl) * nc.V + (1 + f) * nc.Fp, Veb = nb.V + nb.Fp;  // effective jet velocities (momentum + pressure thrust)
  const KE = 0.5 * (mc * (Vec * Vec / (1 + f) - V0 * V0) + mb * (Veb * Veb - V0 * V0));
  const etaTh = clamp(KE / (mf * LHV), 0, 1), etaP = V0 > 1 ? clamp(F * V0 / KE, 0, 1) : 0;
  // T-s (entropy relative to ambient)
  const sC = (T, P) => cpc * Math.log(T / T0) - GAS.R * Math.log(P / P0), sH = (T, P) => cph * Math.log(T / T0) - GAS.R * Math.log(P / P0);
  const ST = [
    { k: '0', T: T0, P: P0, s: 0 }, { k: '2', T: Tt2, P: Pt2, s: sC(Tt2, Pt2) }, { k: '13', T: Tt13, P: Pt13, s: sC(Tt13, Pt13) },
    { k: '25', T: Tt25, P: Pt25, s: sC(Tt25, Pt25) }, { k: '3', T: Tt3, P: Pt3, s: sC(Tt3, Pt3) }, { k: '4', T: Tt4, P: Pt4, s: sH(Tt4, Pt4) },
    { k: '45', T: Tt45, P: Pt45, s: sH(Tt45, Pt45) }, { k: '5', T: Tt5, P: Pt5, s: sH(Tt5, Pt5) }, { k: '9', T: nc.Te, P: nc.Pe, s: sH(nc.Te, nc.Pe) }];
  // HPC map position: corrected flow fraction vs pressure ratio, simple surge line
  const wc = n2 * n2 * 0.98 + 0.02; const surgePR = 1 + (hpD - 1) * 1.22 * Math.pow(wc, 1.9);
  const sm = (surgePR - pih) / pih * 100;
  return {
    x, n1, n2, N1: n1 * N100.n1, N2: n2 * N100.n2, pif, pil, pih, opr: Pt3 / Pt2, Tt4, f, mf, mc, mb, m0, alpha, V0, V9: nc.V, V19: nb.V, c9: nc.choked, c19: nb.choked,
    F, Fc, Fb, tsfc, etaTh, etaP, etaO: etaTh * etaP, egt: Tt45 - 273.15, t5: Tt5, T0, P0, ST,
    PW: { hpt: mc * (1 + f) * cph * (Tt4 - Tt45) / 1e6, lpt: mc * (1 + f) * cph * (Tt45 - Tt5) / 1e6, fan: mb * cpc * (Tt13 - Tt2) / 1e6, hpc: mc * wHPC / 1e6 },
    map: { wc, pr: pih, surgePR, sm, hpD }, tip: { fan: n1 * N100.n1 * 2 * Math.PI / 60 * 0.775 }
  };
}
// live engine state (spools lag the throttle like a real engine; acceleration limited)
const ENG = { thr: 0.45, n1: 0.6, n2: 0.85, lit: 1, fuel: 1, surge: 0, surgeKick: 0, R: null };
function engineStep(dt) {
  const tgt = cycle(PRM, { thr: ENG.thr, surgeKick: ENG.surgeKick });
  const tau1 = 2.2, tau2 = 1.4;
  if (ENG.lit && ENG.fuel) { ENG.n1 = damp(ENG.n1, tgt.n1, 1 / tau1, dt); ENG.n2 = damp(ENG.n2, tgt.n2, 1 / tau2, dt); }
  else { ENG.n1 = damp(ENG.n1, ENG.motor1 || 0, 0.35, dt); ENG.n2 = damp(ENG.n2, ENG.motor2 || 0, 0.6, dt); }
  // thermodynamic state follows spool speed (inverse schedule)
  const xe = Math.pow(clamp((ENG.n1 - 0.21) / 0.79, 0, 1.05), 1 / 0.75);
  ENG.R = (ENG.lit && ENG.fuel) ? cycle(PRM, { thr: xe, surgeKick: ENG.surgeKick }) : coldState();
  return ENG.R;
}
function coldState() {
  const R = cycle(PRM, { thr: 0 }); const k = clamp(ENG.n2 / 0.6);
  return Object.assign({}, R, { n1: ENG.n1, n2: ENG.n2, N1: ENG.n1 * N100.n1, N2: ENG.n2 * N100.n2, F: R.F * k * k * 0.05, mf: 0, tsfc: 0, Tt4: R.T0 + 20 * k, egt: R.T0 - 273.15 + 15 * k, etaTh: 0, etaP: 0, m0: R.m0 * k, mc: R.mc * k, mb: R.mb * k, f: 0 });
}
