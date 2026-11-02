// ===================== f_ui: trail, controls, why box, readouts, scope, tooltip (bilingual) =====================
let CUR = 0, SCOPE = 'st', WHYTAB = 'why';
const ICON = {
  play: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8-5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx=".6"/><rect x="9.4" y="3" width="2.6" height="10" rx=".6"/></svg>',
  check: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg>',
};
function setBtn(el, html) { if (el._h !== html) { el.innerHTML = html; el._h = html; } }
function scopePal() {
  return document.body.classList.contains('light')
    ? { fg: '#111113', tx2: '#3e3f44', mu: '#66686e', dim: '#b4b4ba', grid: 'rgba(17,17,19,.07)', acc: '#2f6fbd', ok: '#22704f', bad: '#b02a43', warn: '#9a6a10', cold: '#3d7fc4', hot: '#c4561c' }
    : { fg: '#f2f2f3', tx2: '#bdbdc0', mu: '#8a8c92', dim: '#55555b', grid: 'rgba(255,255,255,.055)', acc: '#4a8ad6', ok: '#5fc39c', bad: '#e5566f', warn: '#d9a441', cold: '#8fc4ff', hot: '#ff8a3d' };
}
let SC = scopePal();
function toast(msg, ms = 3800) {
  const el = $('toast'); el.textContent = msg; el.style.opacity = 1; toast.until = SIM.t + ms / 1000 * Math.max(1, SIM.speed);
  const r = el.getBoundingClientRect(), s = $('stage').getBoundingClientRect();
  TOASTRECT = { x0: (r.left - s.left) / stageScale - 6, y0: (r.top - s.top) / stageScale - 6, x1: (r.right - s.left) / stageScale + 6, y1: (r.bottom - s.top) / stageScale + 6 };
}
function tickToast() { if (toast.until && SIM.t > toast.until) { $('toast').style.opacity = 0; toast.until = 0; TOASTRECT = null; } }
function renderTrail() {
  $('steps').innerHTML = STEPS.map((s, i) => `<div class="st ${i === CUR ? 'cur' : i < CUR ? 'done' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="${t('steplab')} ${i + 1}: ${tr(s.title)}"><div class="nd">${i < CUR ? ICON.check : String(i + 1).padStart(2, '0')}</div><div class="tx"><div class="tt">${tr(s.title)}</div><div class="sb">${tr(s.sub)}</div></div></div>`).join('');
}
$('steps').addEventListener('click', e => { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } });
$('steps').addEventListener('keydown', e => { if (e.key === 'Enter') { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } } });
function renderChips() { OPR.chips = (OPR.chipsSrc || []).map(tr); const h = OPR.chips.map((c, i) => `<span class="${i === OPR.chip ? 'on' : i < OPR.chip ? 'done' : ''}">${c}</span>`).join(''); if (h !== renderChips.last) { $('cmdseq').innerHTML = h; renderChips.last = h; } }
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
function cfgChanged() { syncControls(); updateReadouts(); }
function segBind(id, key) { $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); PRM[key] = b.dataset.v; cfgChanged(); }); }
segBind('flight', 'flight'); segBind('eff', 'eff');
const rng = (id, key) => $(id).addEventListener('input', e => { userTook(); PRM[key] = +e.target.value; cfgChanged(); });
rng('thr', 'thr'); rng('bpr', 'bpr'); rng('opr', 'opr'); rng('t4', 't4');
$('lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.v !== LANG) setLang(b.dataset.v); });
$('btnRun').addEventListener('click', () => { userTook(); runCurrent(); });
$('btnStepOp').addEventListener('click', () => { userTook(); if (OPR.running) nextSeg(); });
$('btnPause').addEventListener('click', () => { userTook(); SIM.paused = !SIM.paused; setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause); });
$('speed').addEventListener('change', e => { userTook(); SIM.speed = +e.target.value; });
$('btnTheme').addEventListener('click', () => { document.body.classList.toggle('light'); });
$('btnAuto').addEventListener('click', () => { restartAutoplay(); });
document.querySelectorAll('#scopetabs button').forEach(b => b.addEventListener('click', () => { userTook(); SCOPE = b.dataset.s; syncControls(); }));
function runCurrent() { if (OPR.running) abortOp(); startOp(STEPS[CUR].op); syncControls(); }
function rangeFill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%'); }
const ROWS = ['r-thr', 'r-flight', 'r-bpr', 'r-opr', 'r-t4', 'r-eff'];
const RUNLAB = { START: B('start sequence', '起动程序'), SPLIT: B('flow split', '分流演示'), PARCEL: B('follow a parcel', '跟踪气团'), IGNITE: B('combustion', '燃烧过程'), WORK: B('power balance', '功率平衡'), SPOOL: B('throttle burst', '猛推油门'), CYCLE: B('BPR / OPR sweep', '涵道比 / 压比扫描'), SURGE: B('surge event', '喘振事件') };
function syncControls() {
  const s = STEPS[CUR];
  ROWS.forEach(id => $(id).style.display = s.rows.includes(id) ? '' : 'none');
  const on = (id, v) => document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  on('flight', PRM.flight); on('eff', PRM.eff); on('lang', LANG);
  const thr = OPR.thrOv != null ? OPR.thrOv : PRM.thr;
  $('thr').value = thr; $('thrv').textContent = Math.round(thr * 100) + ' %';
  $('bpr').value = PRM.bpr; $('bprv').textContent = PRM.bpr.toFixed(1);
  $('opr').value = PRM.opr; $('oprv').textContent = PRM.opr.toFixed(0);
  $('t4').value = PRM.t4; $('t4v').textContent = PRM.t4.toFixed(0) + ' K';
  setBtn($('btnRun'), OPR.running ? '<span class="spin"></span>' + t('running') : ICON.play + t('run') + ' ' + tr(RUNLAB[s.op]));
  setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause);
  document.querySelectorAll('#ctl input[type=range]').forEach(rangeFill);
  $('btnRun').disabled = OPR.running; $('btnRun').parentElement.style.display = s.run ? '' : 'none';
  document.querySelectorAll('#scopetabs button').forEach(b => b.classList.toggle('on', b.dataset.s === SCOPE));
  setBtn($('btnAuto'), AUTOPLAY ? '<span class="live"></span>' + t('autoOn') : ICON.play + t('auto'));
}
// ---------- readouts ----------
const roW = (s, a) => [...String(s).replace(/<[^>]+>/g, '')].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 12 : a), 0);
function ro(pairs) { const h = pairs.map(([k, v]) => `<div${roW(t(k), 6.4) + roW(v, 7.3) > 150 ? ' class="w"' : ''}><span>${t(k)}</span><b>${v}</b></div>`).join(''); if (h !== ro.last) { $('readouts').innerHTML = h; ro.last = h; } }
const kN = v => fmt(v / 1000, 1) + ' kN', pc = v => fmt(v * 100, 0) + ' %';
function engState() { if (ENG.surge) return `<span class="neg">${t('st_surge')}</span>`; if (!ENG.lit) return t(ENG.n2 > .03 ? 'st_crank' : 'st_off'); if (ENG.n2 < .58) return t('st_light'); return ENG.n1 < .3 ? t('st_idle') : t('st_run'); }
function updateReadouts() {
  const R = ENG.R; if (!R) return; const id = STEPS[CUR].id;
  const base = [['ro_thrust', kN(R.F)], ['ro_n1', pc(R.n1) + ' · ' + fmt(R.N1, 0) + ' rpm'], ['ro_n2', pc(R.n2) + ' · ' + fmt(R.N2, 0) + ' rpm']];
  if (id === 'start') ro([...base, ['ro_egt', fmt(R.egt, 0) + ' °C'], ['ro_fuel', fmt(R.mf, 2) + ' kg/s'], ['ro_state', engState()]]);
  else if (id === 'split') ro([['ro_thrust', kN(R.F)], ['ro_fb', pc(R.F > 1 ? R.Fb / R.F : 0)], ['ro_bpr', fmt(R.alpha, 1)], ['ro_m0', fmt(R.m0, 0) + ' kg/s'], ['ro_v19', fmt(R.V19, 0) + ' m/s'], ['ro_v9', fmt(R.V9, 0) + ' m/s'], ['ro_tsfc', fmt(R.tsfc, 1) + ' g/kN·s']]);
  else if (id === 'compress') { const s3 = R.ST.find(z => z.k === '3'); ro([['ro_opr', fmt(R.opr, 1)], ['Tt3', fmt(s3.T, 0) + ' K'], ['Pt3', fmt(s3.P / 1e5, 1) + ' bar'], ['ro_n2', pc(R.n2)], ['ro_hpc', fmt(R.PW.hpc, 1) + ' MW'], ['ro_m0', fmt(R.mc, 0) + ' kg/s']]); }
  else if (id === 'burn') ro([['ro_t4', fmt(R.Tt4, 0) + ' K'], ['f', fmt(R.f, 4)], ['ro_fuel', fmt(R.mf, 2) + ' kg/s'], ['ro_eth', pc(R.etaTh)], ['ro_egt', fmt(R.egt, 0) + ' °C'], ['ro_thrust', kN(R.F)]]);
  else if (id === 'turbine') ro([['ro_hpt', fmt(R.PW.hpt, 1) + ' MW'], ['ro_hpc', fmt(R.PW.hpc, 1) + ' MW'], ['ro_lpt', fmt(R.PW.lpt, 1) + ' MW'], ['ro_fan', fmt(R.PW.fan, 1) + ' MW'], ['ro_n1', fmt(R.N1, 0) + ' rpm'], ['ro_n2', fmt(R.N2, 0) + ' rpm']]);
  else if (id === 'spool') ro([...base, ['ro_egt', fmt(R.egt, 0) + ' °C'], ['ro_tsfc', fmt(R.tsfc, 1) + ' g/kN·s'], ['ro_state', engState()]]);
  else if (id === 'cycle') ro([['ro_bpr', fmt(PRM.bpr, 1)], ['ro_opr', fmt(R.opr, 1)], ['ro_eth', pc(R.etaTh)], ['ro_ep', pc(R.etaP)], ['ro_eo', fmt(R.etaO * 100, 1) + ' %'], ['ro_tsfc', fmt(R.tsfc, 1) + ' g/kN·s'], ['ro_thrust', kN(R.F)]]);
  else if (id === 'surge') ro([['ro_sm', `<span class="${R.map.sm < 5 ? 'neg' : 'pos'}">${fmt(R.map.sm, 1)} %</span>`], ['PR HPC', fmt(R.map.pr, 1)], ['ro_n2', pc(R.n2)], ['ro_state', engState()], ['ro_thrust', kN(R.F)]]);
}
// ---------- scope ----------
const sc = $('scope'); let sg = sc.getContext('2d'), SW = 0, SH = 0;
function sizeScope() { const r = sc.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); SW = sc.clientWidth; SH = sc.clientHeight; sc.width = Math.round(Math.max(1, r.width) * dpr); sc.height = Math.round(Math.max(1, r.height) * dpr); sg.setTransform(sc.width / Math.max(1, SW), 0, 0, sc.height / Math.max(1, SH), 0, 0); }
function ytk(g, s, y, x0, x1) { g.strokeStyle = SC.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, Math.round(y) + .5); g.lineTo(x1, Math.round(y) + .5); g.stroke(); txt(g, s, x0 - 5, y + 4, SC.mu, 'right'); }
function txt(g, s, x, y, col = SC.mu, al = 'left', f = '11px "JetBrains Mono"') { g.fillStyle = col; g.font = f; g.textAlign = al; g.fillText(s, x, y); }
const SANS = '11px "Inter","Noto Sans SC",sans-serif';
const SCOPEINFO = { scope: '' };
const ETAC = {}; // cached efficiency sweep per (flight, opr, t4, eff)
function drawScope() {
  const g = sg, W = SW, H = SH; if (!W || !H || !ENG.R) return; g.clearRect(0, 0, W, H); SC = scopePal();
  const cap = t('c_' + SCOPE); if ($('scopecap').textContent !== cap) $('scopecap').textContent = cap;
  const R = ENG.R; SCOPEINFO.scope = SCOPE;
  if (SCOPE === 'thrust') {
    const L = 40, Rr = W - 50, T = 14, Bt = H - 24, max = 140e3, y = v => Bt - clamp(v / max) * (Bt - T);
    for (let v = 0; v <= 140; v += 35) ytk(g, String(v), y(v * 1e3), L, Rr);
    txt(g, 'kN', L - 34, T - 2, SC.mu);
    const bars = [[t('sc_bypass'), R.Fb, SC.cold], [t('sc_core'), R.Fc, SC.hot]], bw = (Rr - L) / 5;
    bars.forEach(([n, v, c], i) => { const x = L + bw * (0.6 + i * 1.4); g.fillStyle = c; g.fillRect(x, y(Math.max(0, v)), bw, Bt - y(Math.max(0, v))); txt(g, n, x + bw / 2, Bt + 14, SC.tx2, 'center', SANS); txt(g, fmt(v / 1000, 1), x + bw / 2, y(Math.max(0, v)) - 5, SC.fg, 'center'); });
    const x3 = L + bw * 3.6; let yy = Bt; [[R.Fb, SC.cold], [R.Fc, SC.hot]].forEach(([v, c]) => { const h = Bt - y(Math.max(0, v)); g.fillStyle = c; g.fillRect(x3, yy - h, bw * .8, h); yy -= h; });
    txt(g, 'F ' + fmt(R.F / 1000, 1), x3 + bw * .4, yy - 5, SC.fg, 'center'); txt(g, '= F', x3 + bw * .4, Bt + 14, SC.tx2, 'center', SANS);
    txt(g, t('sc_tsfc'), Rr + 46, T + 8, SC.warn, 'right', SANS); txt(g, fmt(R.tsfc, 1), Rr + 46, T + 24, SC.warn, 'right'); txt(g, 'g/kN·s', Rr + 46, T + 38, SC.mu, 'right');
  } else if (SCOPE === 'st') {
    const L = 40, Rr = W - 40, T = 14, Bt = H - 24, st = R.ST.slice(1), n = st.length, bw = (Rr - L) / n;
    const pmax = Math.max(4, ...st.map(s => s.P / 1e5)) * 1.1, tmax = 1900, yP = p => Bt - p / pmax * (Bt - T), yT = v => Bt - v / tmax * (Bt - T);
    for (let k = 0; k <= 4; k++) ytk(g, fmt(pmax * k / 4, 0), yP(pmax * k / 4), L, Rr);
    txt(g, t('sc_p'), L - 34, T - 3, SC.acc, 'left', SANS); txt(g, t('sc_t'), Rr + 36, T - 3, SC.hot, 'right', SANS);
    st.forEach((s, i) => { const x = L + i * bw + bw * .2; g.fillStyle = SC.acc; g.globalAlpha = .75; g.fillRect(x, yP(s.P / 1e5), bw * .6, Bt - yP(s.P / 1e5)); g.globalAlpha = 1; txt(g, s.k, x + bw * .3, Bt + 14, SC.tx2, 'center'); });
    g.strokeStyle = SC.hot; g.lineWidth = 2; g.beginPath(); st.forEach((s, i) => { const x = L + i * bw + bw / 2; i ? g.lineTo(x, yT(s.T)) : g.moveTo(x, yT(s.T)); }); g.stroke();
    st.forEach((s, i) => { const x = L + i * bw + bw / 2; g.fillStyle = SC.hot; g.beginPath(); g.arc(x, yT(s.T), 3, 0, 7); g.fill(); if (i % 2 === 0 || i === 3) txt(g, fmt(s.T, 0), x, yT(s.T) - 7, SC.hot, 'center'); });
    for (let v = 0; v <= 1800; v += 600) txt(g, String(v), Rr + 4, yT(v) + 4, SC.mu, 'left');
    if (ACT.parcel >= 0 && OPR.kind === 'PARCEL' && OPR.running) { const xw = lerp(-3.5, 13.6, ACT.parcel); let i = PSTA.findIndex(p => p[0] > xw); i = i < 0 ? 4 : Math.max(0, i - 2); g.strokeStyle = SC.fg; g.lineWidth = 1.5; g.strokeRect(L + i * bw + 2, T, bw - 4, Bt - T); }
  } else if (SCOPE === 'ts') {
    const L = 44, Rr = W - 10, T = 12, Bt = H - 26; const ideal = cycle(PRM, { thr: ENG.R.x, eff: 'ideal' });
    const all = [...R.ST, ...ideal.ST], smin = Math.min(...all.map(s => s.s)) - 50, smax = Math.max(...all.map(s => s.s)) + 80;
    const x = s => L + (s.s - smin) / (smax - smin) * (Rr - L), y = s => Bt - (s.T - 200) / 1700 * (Bt - T);
    for (let v = 200; v <= 1900; v += 400) ytk(g, String(v), y({ T: v }), L, Rr);
    txt(g, 'T (K)', L - 40, T - 2, SC.mu); txt(g, t('sc_s'), Rr, Bt + 20, SC.mu, 'right', SANS);
    const order = ['0', '2', '25', '3', '4', '45', '5', '9'], pick = (S, k) => S.find(z => z.k === k);
    const loop = (S, col, dash) => { g.strokeStyle = col; g.lineWidth = dash ? 1.2 : 2; g.setLineDash(dash ? [4, 3] : []); g.beginPath(); order.forEach((k, i) => { const p = pick(S, k); i ? g.lineTo(x(p), y(p)) : g.moveTo(x(p), y(p)); }); g.lineTo(x(pick(S, '0')), y(pick(S, '0'))); g.stroke(); g.setLineDash([]); };
    loop(ideal.ST, SC.mu, true); loop(R.ST, SC.hot, false);
    order.forEach(k => { const p = pick(R.ST, k); g.fillStyle = SC.fg; g.beginPath(); g.arc(x(p), y(p), 2.6, 0, 7); g.fill(); txt(g, k, x(p) + 5, y(p) - 4, SC.tx2); });
    txt(g, '- - ' + t('sc_ideal'), L + 6, T + 10, SC.mu, 'left', SANS);
  } else if (SCOPE === 'pw') {
    const L = 50, Rr = W - 12, T = 22, Bt = H - 26, pmax = Math.max(30, R.PW.hpt, R.PW.lpt) * 1.15, x = v => L + v / pmax * (Rr - L);
    const rows = [[t('sc_hp'), [['HPT', R.PW.hpt, SC.hot], ['HPC', R.PW.hpc, SC.warn]]], [t('sc_lp'), [['LPT', R.PW.lpt, SC.hot], ['Fan+LPC', R.PW.lpt * .995, SC.cold]]]];
    const rh = (Bt - T) / 2;
    rows.forEach(([n, bars], i) => { const y0 = T + i * rh; txt(g, n, L - 44, y0 + 12, SC.tx2, 'left', SANS); bars.forEach(([bn, v, c], j) => { const yy = y0 + 18 + j * 22; g.fillStyle = c; g.fillRect(L, yy, Math.max(1, x(v) - L), 15); txt(g, bn + ' ' + fmt(v, 1) + ' MW', Math.min(x(v) + 5, Rr - 120), yy + 12, SC.fg, 'left'); }); });
    const hi = ACT.pw === 'hp' ? 0 : ACT.pw === 'lp' ? 1 : -1; if (hi >= 0) { g.strokeStyle = SC.fg; g.lineWidth = 1.2; g.strokeRect(L - 48, T + hi * rh + 1, Rr - L + 46, rh - 4); }
  } else if (SCOPE === 'eta') {
    const L = 40, Rr = W - 10, T = 12, Bt = H - 26, x = b => L + (b - .5) / 11.5 * (Rr - L), y = v => Bt - v * (Bt - T);
    const key = [PRM.flight, PRM.opr.toFixed(0), PRM.t4, PRM.eff].join('|');
    if (!ETAC[key]) { const pts = []; for (let b = .5; b <= 12.01; b += .5) { const c = cycle(PRM, { thr: 1, bpr: b }); pts.push([b, c.etaTh, c.etaP, c.etaO]); } ETAC[key] = pts; }
    for (let v = 0; v <= 1; v += .25) ytk(g, fmt(v * 100, 0) + '%', y(v), L, Rr);
    for (const b of [1, 3, 5, 7, 9, 11]) txt(g, String(b), x(b), Bt + 13, SC.mu, 'center');
    txt(g, t('sc_bpr'), Rr, Bt + 24, SC.mu, 'right', SANS);
    const pts = ETAC[key]; const ln = (k, col, nm) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(x(p[0]), y(p[k])) : g.moveTo(x(p[0]), y(p[k]))); g.stroke(); const lp = pts[pts.length - 1]; txt(g, nm, x(lp[0]) - 2, y(lp[k]) - 6, col, 'right', SANS); };
    ln(1, SC.hot, 'η_th'); ln(2, SC.cold, 'η_p'); ln(3, SC.fg, 'η_o');
    if (PRM.flight === 'sls') txt(g, LANG === 'zh' ? '静止时 V₀ = 0，推进效率无定义——切到巡航' : 'V₀ = 0 at take-off: η_p undefined — switch to cruise', L + 6, T + 12, SC.warn, 'left', SANS);
    const c = cycle(PRM, { thr: 1 }); [[c.etaTh, SC.hot], [c.etaP, SC.cold], [c.etaO, SC.fg]].forEach(([v, col]) => { g.fillStyle = col; g.beginPath(); g.arc(x(PRM.bpr), y(v), 4.5, 0, 7); g.fill(); });
  } else if (SCOPE === 'map') {
    const L = 40, Rr = W - 10, T = 12, Bt = H - 26, m = R.map, prmax = m.hpD * 1.45, x = w => L + w / 1.15 * (Rr - L), y = p => Bt - (p - 1) / (prmax - 1) * (Bt - T);
    for (let k = 0; k <= 4; k++) { const p = 1 + (prmax - 1) * k / 4; ytk(g, fmt(p, 0), y(p), L, Rr); }
    txt(g, t('sc_wc'), Rr, Bt + 20, SC.mu, 'right', SANS); txt(g, t('sc_pr'), L - 34, T - 2, SC.mu, 'left', SANS);
    for (const n of [.7, .8, .9, 1.0, 1.05]) { const wc0 = n * n * .98 + .02; g.strokeStyle = SC.dim; g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= 20; i++) { const w = wc0 * (.86 + .2 * i / 20), sPR = 1 + (m.hpD - 1) * 1.22 * Math.pow(wc0, 1.9); const p = sPR - (sPR - 1) * .9 * Math.pow(Math.max(0, (w - wc0 * .86) / (wc0 * .2)), 2.2) * .35; i ? g.lineTo(x(w), y(p)) : g.moveTo(x(w), y(p)); } g.stroke(); txt(g, (n * 100).toFixed(0) + '%', x(wc0 * .86) - 2, y(1 + (m.hpD - 1) * 1.22 * Math.pow(wc0, 1.9)) - 4, SC.mu, 'right'); }
    g.strokeStyle = SC.bad; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 30; i++) { const w = .3 + .8 * i / 30, p = 1 + (m.hpD - 1) * 1.22 * Math.pow(w, 1.9); i ? g.lineTo(x(w * .86 / .86), y(p)) : g.moveTo(x(w), y(p)); } g.stroke();
    txt(g, t('sc_surge'), x(.6), y(1 + (m.hpD - 1) * 1.22 * Math.pow(.6, 1.9)) - 8, SC.bad, 'right', SANS);
    g.strokeStyle = SC.acc; g.setLineDash([4, 3]); g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i <= 30; i++) { const n2 = .6 + .45 * i / 30, w = n2 * n2 * .98 + .02, p = 1 + (m.hpD - 1) * Math.pow(clamp((n2 - .42) / .58, 0, 2), 2.1); i ? g.lineTo(x(w), y(p)) : g.moveTo(x(w), y(p)); } g.stroke(); g.setLineDash([]);
    txt(g, t('sc_op'), x(1.0) + 4, y(1 + (m.hpD - 1) * 1.0) + 16, SC.acc, 'left', SANS);
    const px = x(m.wc), py = y(m.pr); g.fillStyle = m.sm < 0 ? SC.bad : SC.fg; g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill();
    txt(g, t('sc_now') + ' · SM ' + fmt(m.sm, 0) + '%', px + 9, py + 4, m.sm < 0 ? SC.bad : SC.fg, 'left', SANS);
  }
}
// ---------- tooltip ----------
let TIPS = null;
function showTip(info, x, y) { TIPS = { info, x, y }; const el = $('tip'); el.style.left = clamp(x + 14, 0, 1440 - 300) + 'px'; el.style.top = clamp(y + 10, 60, 810 - 160) + 'px'; el.style.opacity = 1; updateTip.last = ''; updateTip(); }
function updateTip() { if (!TIPS) return; const i = TIPS.info; const v = i.v ? i.v() : ''; const h = `<h5>${tr(i.name)}</h5><div class="tf">${tr(i.fn)}</div>${v ? `<div class="tv"><span>${t('cur')}</span>${v}</div>` : ''}`; if (h !== updateTip.last) { $('tip').innerHTML = h; updateTip.last = h; } }
function hideTip() { TIPS = null; $('tip').style.opacity = 0; }
