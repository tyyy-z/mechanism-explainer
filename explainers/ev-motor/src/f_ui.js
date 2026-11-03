// ===================== f_ui: drive state, operating point, trail, controls, why box, readouts, scopes, tooltip =====================
let CUR = 0, SCOPE = 'pwr', WHYTAB = 'why';
const ICON = {
  play: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8-5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx=".6"/><rect x="9.4" y="3" width="2.6" height="10" rx=".6"/></svg>',
  check: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg>',
};
function setBtn(el, html) { if (el._h !== html) { el.innerHTML = html; el._h = html; } }
function scopePal() {
  return document.body.classList.contains('light')
    ? { fg: '#111113', tx2: '#3e3f44', mu: '#66686e', dim: '#b4b4ba', grid: 'rgba(17,17,19,.07)', acc: '#2f6fbd', ok: '#22704f', bad: '#b02a43', warn: '#9a6a10', hot: '#c4561c', u: '#b02a43', v: '#22704f', w: '#2f6fbd' }
    : { fg: '#f2f2f3', tx2: '#bdbdc0', mu: '#8a8c92', dim: '#55555b', grid: 'rgba(255,255,255,.055)', acc: '#4a8ad6', ok: '#5fc39c', bad: '#e5566f', warn: '#d9a441', hot: '#ff8a3d', u: '#e5566f', v: '#5fc39c', w: '#4a8ad6' };
}
let SC = scopePal();
// ---------- drive state + operating point (from e_sim EV model) ----------
const DRV = { rpm: 3000, ped: .6, vdc: 350, mode: 'mtpa', th: 0 };
const OP = { T: 0, I: 0, beta: 0, id: 0, iq: 0, vd: 0, vq: 0, m: 0, fw: false, Tmax: 0, P: 0 };
const ENV = {}; function envFor(v) { return ENV[v] || (ENV[v] = EV.envelope(v, 18000, 60)); }
let _opk = '';
function solveOP() {
  const k = [DRV.rpm, DRV.ped, DRV.vdc, DRV.mode].join(); if (k === _opk) return; _opk = k;
  const we = DRV.rpm * TAU / 60 * EV.p, Vmax = DRV.vdc / Math.sqrt(3) * .95, wm = DRV.rpm * TAU / 60, sg = DRV.ped < 0 ? -1 : 1;
  const pick = (I) => { if (DRV.mode === 'id0') { const iq = sg * I, vd = -we * EV.Lq * iq, vq = EV.Rs * iq + we * EV.lam; if (Math.hypot(vd, vq) <= Vmax) return { T: EV.torque(0, iq), beta: 0, ok: true }; } return EV.best(I, we, Vmax, sg); };
  let Tmax = 0; for (let I = EV.Imax; I > 0; I -= EV.Imax / 40) { const r = pick(I); if (r.ok) { Tmax = Math.abs(r.T); break; } }
  if (wm > 0 && Tmax * wm > EV.Pcap) Tmax = EV.Pcap / wm;
  const Td = Math.abs(DRV.ped) * Tmax; let lo = 0, hi = EV.Imax, r = { T: 0, beta: 0 };
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2, q = pick(mid); if (q.ok && Math.abs(q.T) >= Td) { hi = mid; r = q; } else lo = mid; }
  const I = Td < 1 ? 0 : hi, b = r.beta * Math.PI / 180, id = -I * Math.sin(b), iq = sg * I * Math.cos(b);
  const vd = EV.Rs * id - we * EV.Lq * iq, vq = EV.Rs * iq + we * (EV.Ld * id + EV.lam);
  const mtpa = EV.best(I, 0, 1e9, sg).beta;
  Object.assign(OP, { T: EV.torque(id, iq), I, beta: r.beta, id, iq, vd, vq, m: Math.hypot(vd, vq) / (DRV.vdc / Math.sqrt(3)), fw: I > 1 && r.beta > mtpa + 3 && DRV.mode === 'mtpa', Tmax, mtpa });
  OP.P = OP.T * wm; const f = DRV.rpm * EV.p / 60;
  OP.Pcu = 1.5 * EV.Rs * I * I; OP.Pfe = 350 * Math.pow(f / 300, 1.5); OP.Pinv = .012 * Math.abs(OP.P) + 180 + .0009 * I * I; OP.Pgear = .025 * Math.abs(OP.P);
  OP.Pb = OP.P + OP.Pcu + OP.Pfe + OP.Pinv; OP.Pw = OP.P - Math.sign(OP.P || 1) * OP.Pgear;
  OP.eff = OP.P > 0 ? OP.Pw / OP.Pb : OP.P < 0 ? OP.Pb / OP.Pw : 0; OP.f = f;
}
const kmh = rpm => rpm / 9.036 * 2.2 * 60 / 1000;
// ---------- toast ----------
function toast(msg, ms = 3800) {
  const el = $('toast'); el.textContent = msg; el.style.opacity = 1; toast.until = SIM.t + ms / 1000 * Math.max(1, SIM.speed);
  const r = el.getBoundingClientRect(), s = $('stage').getBoundingClientRect();
  TOASTRECT = { x0: (r.left - s.left) / stageScale - 6, y0: (r.top - s.top) / stageScale - 6, x1: (r.right - s.left) / stageScale + 6, y1: (r.bottom - s.top) / stageScale + 6 };
}
function tickToast() { if (toast.until && SIM.t > toast.until) { $('toast').style.opacity = 0; toast.until = 0; TOASTRECT = null; } }
// ---------- trail + why ----------
function renderTrail() {
  $('steps').innerHTML = STEPS.map((s, i) => `<div class="st ${i === CUR ? 'cur' : i < CUR ? 'done' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="${t('steplab')} ${i + 1}: ${tr(s.title)}"><div class="nd">${i < CUR ? ICON.check : String(i + 1).padStart(2, '0')}</div><div class="tx"><div class="tt">${tr(s.title)}</div><div class="sb">${tr(s.sub)}</div></div></div>`).join('');
}
$('steps').addEventListener('click', e => { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } });
$('steps').addEventListener('keydown', e => { if (e.key === 'Enter') { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } } });
function renderWhy() {
  const s = STEPS[CUR], b = $('whybody');
  document.querySelectorAll('#whytabs button').forEach(x => x.classList.toggle('on', x.dataset.t === WHYTAB));
  if (WHYTAB === 'why') b.innerHTML = tr(s.why);
  else if (WHYTAB === 'math') b.innerHTML = tr(s.math);
  else if (WHYTAB === 'ex') b.innerHTML = tr(s.try);
  else if (WHYTAB === 'quiz') { const q = s.quiz; b.innerHTML = `<div class="quiz"><div class="q">${tr(q.q)}</div><div class="opts">${q.opts.map((o, i) => `<button data-i="${i}">${String.fromCharCode(65 + i)}. ${tr(o)}</button>`).join('')}</div><div class="fb" id="qfb"></div></div>`; }
  else if (WHYTAB === 'src') b.innerHTML = `<p class="note">${t('srcnote')}</p><ol style="margin:0;padding-left:18px;font-size:12px;line-height:1.55">${s.src.map(k => `<li>${SRC[k]}</li>`).join('')}</ol>`;
  if (window.renderMathInElement) try { renderMathInElement(b, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (e) { }
}
$('whytabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); WHYTAB = b.dataset.t; renderWhy(); });
$('whybody').addEventListener('click', e => { const b = e.target.closest('.quiz button'); if (!b) return; userTook(); const q = STEPS[CUR].quiz, i = +b.dataset.i; document.querySelectorAll('.quiz button').forEach((x, j) => { x.classList.remove('right', 'wrong'); if (j === i) x.classList.add(i === q.a ? 'right' : 'wrong'); }); $('qfb').innerHTML = i === q.a ? tr(q.fb) : (LANG === 'zh' ? '再想想。' : 'Not quite — try again.'); });
// ---------- controls ----------
function cfgChanged() { solveOP(); syncControls(); updateReadouts(); }
$('vdc').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); DRV.vdc = +b.dataset.v; cfgChanged(); });
$('mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); DRV.mode = b.dataset.v; cfgChanged(); });
$('ped').addEventListener('input', e => { userTook(); DRV.ped = +e.target.value; cfgChanged(); });
$('rpm').addEventListener('input', e => { userTook(); DRV.rpm = +e.target.value; cfgChanged(); });
$('lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.v !== LANG) setLang(b.dataset.v); });
$('btnRun').addEventListener('click', () => { userTook(); if (OPR.running) abortOp(); else startOp(STEPS[CUR].op); syncControls(); });
$('btnStepOp').addEventListener('click', () => { userTook(); if (OPR.running) { OPR.t0 = SIM.t - OPR.dur; } });
$('btnPause').addEventListener('click', () => { userTook(); SIM.paused = !SIM.paused; setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause); });
$('speed').addEventListener('change', e => { userTook(); SIM.speed = +e.target.value; });
$('btnTheme').addEventListener('click', () => { document.body.classList.toggle('light'); });
$('btnAuto').addEventListener('click', () => { restartAutoplay(); });
document.querySelectorAll('#scopetabs button').forEach(b => b.addEventListener('click', () => { userTook(); SCOPE = b.dataset.s; syncControls(); }));
function rangeFill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%'); }
const ROWS = ['r-vdc', 'r-ped', 'r-rpm', 'r-mode'];
const RUNLAB = { LAUNCH: B('full-pedal launch', '全踏板起步'), PWM: B('speed ramp', '转速爬升'), FIELD: B('slow rotating field', '慢速旋转磁场'), ANGLE: B('MTPA vs i_d = 0', 'MTPA 对比 i_d = 0'), STEP: B('pedal step', '踏板阶跃'), SWEEP: B('0 → 18,000 rpm', '0 → 18000 rpm'), REGEN: B('lift-off regen', '松踏板回馈') };
function syncControls() {
  const s = STEPS[CUR];
  ROWS.forEach(id => $(id).style.display = s.rows.includes(id) ? '' : 'none');
  document.querySelectorAll('#vdc button').forEach(b => b.classList.toggle('on', +b.dataset.v === DRV.vdc));
  document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.v === DRV.mode));
  const pe = $('ped'), rp = $('rpm'); if (document.activeElement !== pe) pe.value = DRV.ped; if (document.activeElement !== rp) rp.value = DRV.rpm; rangeFill(pe); rangeFill(rp);
  $('pedv').textContent = (DRV.ped > 0 ? '+' : '') + fmt(DRV.ped * 100, 0) + ' %'; $('rpmv').textContent = fmt(DRV.rpm / 1000, 1) + 'k';
  setBtn($('btnRun'), OPR.running ? `<span class="spin"></span>${t('running')}` : `${ICON.play}${t('run')} ${tr(RUNLAB[s.op])}`); $('btnRun').classList.toggle('busy', OPR.running);
  setBtn($('btnAuto'), AUTOPLAY ? `<span class="dot"></span>${t('autoOn')}` : `${ICON.play}${t('auto')}`); $('btnAuto').classList.toggle('on', AUTOPLAY);
  setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause);
  document.querySelectorAll('#scopetabs button').forEach(b => b.classList.toggle('on', b.dataset.s === SCOPE));
  document.querySelectorAll('#lang button').forEach(b => b.classList.toggle('on', b.dataset.v === LANG));
}
// ---------- readouts ----------
function ro(rows) { const h = rows.map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join(''); if (h !== ro.last) { $('readouts').innerHTML = h; ro.last = h; } }
const kW = w => fmt(w / 1000, 1) + ' kW';
function updateReadouts() {
  solveOP(); const id = STEPS[CUR].id, T = ['ro_T', fmt(OP.T, 0) + ' N·m'], P = ['ro_P', kW(OP.P)], n = ['ro_rpm', fmt(DRV.rpm, 0) + ' rpm'], I = ['ro_I', fmt(OP.I / Math.SQRT2, 0) + ' A rms'];
  const be = ['ro_beta', fmt(OP.beta, 1) + '°'], fw = ['ro_fw', OP.fw ? `<span class="neg">${t('yes')}</span>` : t('no')], f = ['ro_f', fmt(OP.f, 0) + ' Hz'], m = ['ro_m', fmt(OP.m * 100, 0) + ' %'];
  if (id === 'system') ro([T, P, n, ['ro_kmh', fmt(kmh(DRV.rpm), 0) + ' km/h'], ['ro_eff', fmt(OP.eff * 100, 1) + ' %'], I]);
  else if (id === 'inverter') ro([I, f, m, ['ro_T', fmt(OP.T, 0) + ' N·m'], ['ro_P', kW(OP.Pb)]]);
  else if (id === 'stator') ro([I, f, n, ['ro_P', fmt(OP.Pcu / 1000, 2) + ' kW Cu']]);
  else if (id === 'rotor' || id === 'foc') ro([T, ['ro_id', fmt(OP.id / Math.SQRT2, 0) + ' A'], ['ro_iq', fmt(OP.iq / Math.SQRT2, 0) + ' A'], be, I, n]);
  else if (id === 'fw') ro([T, P, n, be, fw, m]);
  else ro([T, P, ['ro_regen', OP.P < 0 ? kW(-OP.Pb) : '—'], ['ro_eff', fmt(OP.eff * 100, 1) + ' %'], n]);
}
// ---------- scope ----------
const sc = $('scope'); let sg = sc.getContext('2d'), SW = 0, SH = 0;
function sizeScope() { const r = sc.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); SW = sc.clientWidth; SH = sc.clientHeight; sc.width = Math.round(Math.max(1, r.width) * dpr); sc.height = Math.round(Math.max(1, r.height) * dpr); sg.setTransform(sc.width / Math.max(1, SW), 0, 0, sc.height / Math.max(1, SH), 0, 0); }
function ytk(g, s, y, x0, x1) { g.strokeStyle = SC.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, Math.round(y) + .5); g.lineTo(x1, Math.round(y) + .5); g.stroke(); txt(g, s, x0 - 5, y + 4, SC.mu, 'right'); }
function txt(g, s, x, y, col = SC.mu, al = 'left', f = '11px "JetBrains Mono"') { g.fillStyle = col; g.font = f; g.textAlign = al; g.fillText(s, x, y); }
const SANS = '11px "Inter","Noto Sans SC",sans-serif';
function line(g, n, fx, fy, col, w = 1.6, dash) { g.strokeStyle = col; g.lineWidth = w; if (dash) g.setLineDash(dash); g.beginPath(); let st = false; for (let i = 0; i <= n; i++) { const x = fx(i), y = fy(i); if (!isFinite(y)) { st = false; continue; } st ? g.lineTo(x, y) : g.moveTo(x, y); st = true; } g.stroke(); g.setLineDash([]); }
function drawScope() {
  const g = sg, Wd = SW, H = SH; if (!Wd || !H) return; g.clearRect(0, 0, Wd, H); SC = scopePal(); solveOP();
  const cap = t('c_' + SCOPE); if ($('scopecap').textContent !== cap) $('scopecap').textContent = cap;
  const L = 44, Rr = Wd - 14, T = 14, Bt = H - 24;
  if (SCOPE === 'iabc') {
    const Ip = Math.max(EV.Imax, 1), cyc = 2, th1 = DRV.th, g0 = Math.atan2(OP.iq, OP.id) - Math.PI / 2;
    const yc = (T + Bt) / 2 - 8, hA = (Bt - T) * .36, X = i => L + i / 300 * (Rr - L), Y = v => yc - v / Ip * hA;
    for (const v of [-900, 0, 900]) ytk(g, String(v), Y(v), L, Rr); txt(g, 'A', L - 34, T - 2);
    [SC.u, SC.v, SC.w].forEach((c, k) => line(g, 300, X, i => Y(OP.I * Math.cos(th1 - cyc * TAU * (1 - i / 300) + g0 + Math.PI / 2 - k * TAU / 3)), c, 1.7));
    // PWM strip for phase U
    const y0 = Bt - 4, ph = 18; g.strokeStyle = SC.dim; g.lineWidth = 1; g.beginPath();
    const Vb = DRV.vdc, vm = Math.hypot(OP.vd, OP.vq), gv = Math.atan2(OP.vq, OP.vd) - Math.PI / 2; let prev = null;
    for (let i = 0; i <= 600; i++) { const th = th1 - cyc * TAU * (1 - i / 600) + gv + Math.PI / 2, va = vm * Math.cos(th), vb = vm * Math.sin(th); const d = EV.svpwm(va, vb, Vb)[0]; const car = Math.abs(((i / 600 * 36) % 2) - 1); const on = d > car ? 1 : 0; const x = L + i / 600 * (Rr - L), y = y0 - on * ph; if (prev === null) g.moveTo(x, y); else { if (prev !== on) g.lineTo(x, y0 - prev * ph); g.lineTo(x, y); } prev = on; }
    g.strokeStyle = SC.warn; g.stroke();
    txt(g, `— U  — V  — W   ▮ PWM U (${tr(B('carrier slowed', '载波已放慢'))})   ${fmt(OP.f, 0)} Hz`, L, Bt + 16, SC.tx2, 'left', SANS);
  } else if (SCOPE === 'dq') {
    const S = EV.Imax * 1.2, ng = DRV.ped < 0, cx = Rr - 46, cy = ng ? T + 14 : Bt - 6, k = Math.min(cx - L + 20, Bt - T - 26) / S, X = id => cx + id * k, Y = iq => cy - iq * k;
    g.strokeStyle = SC.grid; g.beginPath(); g.moveTo(L, cy + .5); g.lineTo(Rr, cy + .5); g.moveTo(cx + .5, T); g.lineTo(cx + .5, Bt); g.stroke();
    txt(g, 'i_d', Rr, cy - 4, SC.mu, 'right'); txt(g, 'i_q', cx + 4, ng ? Bt - 4 : T + 8, SC.mu);
    const sg2 = DRV.ped < 0 ? -1 : 1;
    line(g, 90, i => X(-EV.Imax * Math.sin(i / 90 * Math.PI / 2)), i => Y(sg2 * EV.Imax * Math.cos(i / 90 * Math.PI / 2)), SC.dim, 1.2, [3, 3]);
    const we = DRV.rpm * TAU / 60 * EV.p, Vm = DRV.vdc / Math.sqrt(3) * .95;
    if (we > 1) { const a = Vm / (we * EV.Ld), b = Vm / (we * EV.Lq), c0 = -EV.lam / EV.Ld; g.save(); g.beginPath(); g.rect(L, T, Rr - L, Bt - T); g.clip(); line(g, 180, i => X(c0 + a * Math.cos(i / 180 * TAU)), i => Y(b * Math.sin(i / 180 * TAU)), SC.hot, 1.4); g.restore(); }
    if (Math.abs(OP.T) > 1) line(g, 100, i => X(-EV.Imax * 1.1 * i / 100), i => { const id = -EV.Imax * 1.1 * i / 100, iq = OP.T / (1.5 * EV.p * (EV.lam + (EV.Ld - EV.Lq) * id)); return Math.abs(iq) > S ? NaN : Y(iq); }, SC.ok, 1.2, [5, 3]);
    line(g, 40, i => { const I = EV.Imax * i / 40, b = EV.best(I, 0, 1e9, sg2).beta * Math.PI / 180; return X(-I * Math.sin(b)); }, i => { const I = EV.Imax * i / 40, b = EV.best(I, 0, 1e9, sg2).beta * Math.PI / 180; return Y(sg2 * I * Math.cos(b)); }, SC.mu, 1, [2, 2]);
    g.strokeStyle = SC.acc; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(X(OP.id), Y(OP.iq)); g.stroke(); g.fillStyle = SC.fg; g.beginPath(); g.arc(X(OP.id), Y(OP.iq), 4, 0, TAU); g.fill();
    txt(g, `β ${fmt(OP.beta, 1)}°`, X(OP.id) - 6, Y(OP.iq) - 8, SC.fg, 'right', SANS);
    txt(g, `‒ ‒ ${t('sc_ilim')}   — ${t('sc_vlim')}   ‒ ‒ ${t('sc_tc')}   ·· ${t('sc_mtpa')}`, L - 30, Bt + 16, SC.tx2, 'left', SANS);
  } else if (SCOPE === 'ts') {
    const env = envFor(DRV.vdc), Tm = 500, X = r => L + r / 18000 * (Rr - L - 34), Y = v => (T + Bt) * .5 - v / Tm * (Bt - T) * .5, YP = p => (T + Bt) * .5 - p / 250e3 * (Bt - T) * .5;
    for (const v of [-400, -200, 0, 200, 400]) ytk(g, String(v), Y(v), L, Rr - 34); for (const p of [0, 100, 200]) txt(g, String(p), Rr - 30, YP(p * 1000) + 4, SC.hot);
    txt(g, 'N·m', L - 34, T - 2); txt(g, 'kW', Rr - 30, T - 2, SC.hot);
    for (const r of [0, 6000, 12000, 18000]) txt(g, (r / 1000) + 'k', X(r), Bt + 2, SC.mu, 'center', '10px "JetBrains Mono"');
    line(g, env.length - 1, i => X(env[i].rpm), i => Y(env[i].T), SC.acc, 2); line(g, env.length - 1, i => X(env[i].rpm), i => Y(-env[i].T * .7), SC.acc, 1.2, [4, 3]);
    line(g, env.length - 1, i => X(env[i].rpm), i => YP(env[i].P), SC.hot, 1.4, [4, 3]);
    g.fillStyle = SC.fg; g.beginPath(); g.arc(X(DRV.rpm), Y(OP.T), 4.5, 0, TAU); g.fill(); txt(g, t('sc_now'), X(DRV.rpm) + 7, Y(OP.T) - 6, SC.fg, 'left', SANS);
    txt(g, `— ${t('sc_env')}   ‒ ‒ ${t('sc_pow')}   ${DRV.vdc} V`, L, Bt + 16, SC.tx2, 'left', SANS);
  } else if (SCOPE === 'pwr') {
    const rg = OP.P < 0, nodes = [[B('Battery', '电池'), Math.abs(OP.Pb)], [B('Inverter', '逆变器'), Math.abs(OP.P + OP.Pcu + OP.Pfe)], [B('Motor shaft', '电机轴'), Math.abs(OP.P)], [B('Wheels', '车轮'), Math.abs(OP.Pw)]];
    const loss = [OP.Pinv, OP.Pcu + OP.Pfe, OP.Pgear], mx = 230e3, bw = (Rr - L + 30) / 4 - 14, yc = (T + Bt) / 2 - 6;
    nodes.forEach(([nm, p], i) => { const x = L - 30 + i * (bw + 14), h = Math.max(3, p / mx * (Bt - T - 30)); g.fillStyle = i === 0 ? SC.ok : i === 3 ? SC.warn : SC.acc; g.globalAlpha = .85; g.fillRect(x, yc - h / 2, bw, h); g.globalAlpha = 1; txt(g, tr(nm), x + bw / 2, T + 6, SC.tx2, 'center', SANS); txt(g, fmt(p / 1000, 1) + ' kW', x + bw / 2, yc + Math.max(h / 2, 8) + 14, SC.fg, 'center'); if (i < 3) { txt(g, rg ? '◀' : '▶', x + bw + 7, yc + 4, SC.fg, 'center'); txt(g, '−' + fmt(loss[i] / 1000, 2), x + bw + 7, Bt + 2, SC.bad, 'center', '10px "JetBrains Mono"'); } });
    txt(g, `${rg ? tr(B('Regen: power flows back to the battery', '回馈：功率流回电池')) : tr(B('Drive: battery → wheels', '驱动：电池 → 车轮'))}   η ≈ ${fmt(OP.eff * 100, 1)} %  (${tr(B('losses kW, illustrative', '损耗 kW，示意'))})`, L - 30, Bt + 16, SC.tx2, 'left', SANS);
  }
}
let TIPS = null;
function showTip(info, x, y) { TIPS = { info, x, y }; const el = $('tip'); el.style.left = clamp(x + 14, 0, 1440 - 300) + 'px'; el.style.top = clamp(y + 10, 60, 810 - 160) + 'px'; el.style.opacity = 1; updateTip.last = ''; updateTip(); }
function updateTip() { if (!TIPS) return; const i = TIPS.info; const v = i.v ? i.v() : ''; const h = `<h5>${tr(i.name)}</h5><div class="tf">${tr(i.fn)}</div>${v ? `<div class="tv"><span>${t('cur')}</span>${v}</div>` : ''}`; if (h !== updateTip.last) { $('tip').innerHTML = h; updateTip.last = h; } }
function hideTip() { TIPS = null; $('tip').style.opacity = 0; }
