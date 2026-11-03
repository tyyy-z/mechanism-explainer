// EV IPMSM dq model (Model 3 class). Public: p=3, Rs=4.75 mOhm, ke=42 Vpk(LL)/krpm, Imax~1000 Arms.
// Ld/Lq ILLUSTRATIVE (chosen so MTPA angle at Imax ~ 53 deg, matching MotorXP's 53.5 deg).
const EV = (() => {
  const p = 3, Rs = 0.00475;
  const lam = 42 / Math.sqrt(3) / (1000 * 2 * Math.PI / 60 * p); // Wb: phase-peak V / we
  const Ld = 0.00010, Lq = 0.00020;                                // H, illustrative (fit, not measured)
  const Imax = 650 * Math.SQRT2;   // A peak; fitted so stall ~440 N·m with this lam (MotorXP quotes ~1000 Arms with its own flux model)
  const Pcap = 200e3;               // W, battery/inverter power limit (public rating 190–211 kW)
  const torque = (id, iq) => 1.5 * p * (lam * iq + (Ld - Lq) * id * iq);
  // best torque for current magnitude I under voltage limit Vmax at elec speed we (beta = advance angle from q axis)
  function best(I, we, Vmax, sign = 1) {
    let bt = 0, bb = 0, ok = false;
    for (let b = 0; b <= 89.5; b += .5) {
      const r = b * Math.PI / 180, id = -I * Math.sin(r), iq = sign * I * Math.cos(r);
      const vd = Rs * id - we * Lq * iq, vq = Rs * iq + we * (Ld * id + lam);
      if (Math.hypot(vd, vq) > Vmax) continue;
      const T = torque(id, iq);
      if (sign * T > sign * bt) { bt = T; bb = b; ok = true; }
    }
    return { T: bt, beta: bb, ok };
  }
  function envelope(Vdc = 350, rpmMax = 18000, n = 72) {
    const Vmax = Vdc / Math.sqrt(3) * .95, out = [];   // SVPWM linear limit, 5% margin
    for (let i = 0; i <= n; i++) {
      const rpm = rpmMax * i / n, we = rpm * 2 * Math.PI / 60 * p;
      let r = { T: 0, beta: 90 };
      for (let I = Imax; I > 0; I -= Imax / 40) { r = best(I, we, Vmax); if (r.ok) break; }
      const wm = rpm * 2 * Math.PI / 60; if (wm > 0 && r.T * wm > Pcap) r.T = Pcap / wm;
      out.push({ rpm, T: r.T, P: r.T * rpm * 2 * Math.PI / 60, beta: r.beta });
    }
    return out;
  }
  // SVPWM duty for (alpha,beta) voltage, min-max injection
  function svpwm(va, vb, Vdc) {
    const a = va, b = -va / 2 + vb * Math.sqrt(3) / 2, c = -va / 2 - vb * Math.sqrt(3) / 2;
    const off = -(Math.max(a, b, c) + Math.min(a, b, c)) / 2;
    return [a, b, c].map(v => Math.min(1, Math.max(0, .5 + (v + off) / Vdc)));
  }
  return { p, Rs, lam, Ld, Lq, Imax, Pcap, torque, best, envelope, svpwm };
})();
if (typeof module !== 'undefined') module.exports = EV;
