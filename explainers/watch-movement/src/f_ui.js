// ===================== f_ui: trail, controls, why box, readouts, scope, tooltip (bilingual) =====================
let CUR = 0, SCOPE = 'tg', WHYTAB = 'why';
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
// ---------- controls ----------
function cfgChanged() { syncControls(); updateReadouts(); }
function segBind(id, key, num) { $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); PRM[key] = num ? +b.dataset.v : b.dataset.v; if (key === 'bph') TG.reset(); cfgChanged(); }); }
segBind('bph', 'bph', 1); segBind('slow', 'slow', 1); segBind('wrist', 'wrist');
$('wind').addEventListener('input', e => { userTook(); W.wind = +e.target.value; PRM.wind = W.wind; cfgChanged(); });
$('reg').addEventListener('input', e => { userTook(); PRM.reg = +e.target.value; TG.reset(); cfgChanged(); });
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
const ROWS = ['r-bph', 'r-wind', 'r-reg', 'r-slow', 'r-wrist'];
const RUNLAB = { TOUR: B('guided tour', '导览'), WIND: B('wind the crown', '转表冠上弦'), TRAIN: B('one hour ×600', '一小时 ×600'), ESCAPE: B('1/40 slow motion', '1/40 慢动作'), BEAT: B('beat-rate sweep', '振频扫描'), AUTO: B('wrist motion', '手腕运动'), RESERVE: B('38 h run-down', '38 小时放条') };
function syncControls() {
  const s = STEPS[CUR];
  ROWS.forEach(id => $(id).style.display = s.rows.includes(id) ? '' : 'none');
  const on = (id, v) => document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  on('bph', PRM.bph); on('slow', PRM.slow); on('wrist', PRM.wrist); on('lang', LANG);
  $('wind').value = W.wind; $('windv').textContent = Math.round(W.wind * 100) + ' %';
  $('reg').value = PRM.reg; $('regv').textContent = (PRM.reg > 0 ? '+' : '') + fmt(PRM.reg, 0) + ' s/d';
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
const sd = v => `<span class="${Math.abs(v) > 15 ? 'neg' : 'pos'}">${v > 0 ? '+' : ''}${fmt(v, 1)} s/d</span>`;
function phState() { return W.phaseState === 'stop' ? `<span class="neg">${t('ph_stop')}</span>` : t('ph_' + W.phaseState); }
function hhmm(s) { s = ((s % 43200) + 43200) % 43200; const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = Math.floor(s) % 60; return `${h || 12}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; }
function updateReadouts() {
  const r = W.R; if (!r) return; const id = STEPS[CUR].id;
  const bph = [`ro_bph`, `${fmt(r.bph / 1000, 1)}k · ${r.f} Hz`], amp = ['ro_amp', fmt(r.A, 0) + '°'], rate = ['ro_rate', sd(r.rate)], res = ['ro_res', fmt(r.res, 0) + ' / ' + r.resMax + ' h'];
  if (id === 'overview') ro([bph, amp, rate, res, ['ro_time', hhmm(W.tw + 10 * 3600 + 8 * 60)], ['ro_state', phState()]]);
  else if (id === 'wind') ro([['ro_wind', fmt(r.wind * 100, 0) + ' %'], ['ro_tq', fmt(r.T, 2) + ' N·mm'], res, amp, ['ro_state', phState()]]);
  else if (id === 'train') ro([['ro_tq', fmt(r.T, 2) + ' N·mm'], ['ro_te', fmt(r.Te, 2) + ' µN·m'], ['ro_esc', fmt(r.escRpm, 0) + ' rpm'], bph, ['ro_time', hhmm(W.tw + 10 * 3600 + 8 * 60)]]);
  else if (id === 'escape') ro([['ro_state', phState()], ['θ', fmt(W.theta, 0) + '°'], amp, ['ro_te', fmt(r.Te, 2) + ' µN·m'], bph]);
  else if (id === 'balance') ro([bph, rate, amp, ['ro_k', fmt(r.k, 2) + ' µN·m/rad'], ['ro_reg', (PRM.reg > 0 ? '+' : '') + fmt(PRM.reg, 0) + ' s/d']]);
  else if (id === 'auto') ro([['ro_rotor', fmt(Math.abs(W.rotorV) * 9.55, 0) + ' rpm'], ['ro_wind', fmt(r.wind * 100, 0) + ' %'], res, amp]);
  else ro([res, amp, rate, ['ro_tq', fmt(r.T, 2) + ' N·mm'], ['ro_state', phState()]]);
}
// ---------- timegrapher trace ----------
const TG = { pts: [], dev: 0, lastK: null, lastT: 0, reset() { this.pts = []; this.dev = 0; this.lastK = null; } };
function tickTG(dt) {
  if (!W.run) return; if (TG.lastK === null) { TG.lastK = W.beats; TG.lastT = SIM.t; return; }
  if (W.beats !== TG.lastK) {
    const n = W.beats - TG.lastK; TG.lastK = W.beats; const el = SIM.t - TG.lastT; TG.lastT = SIM.t;
    TG.dev += W.rate / 86.4 * el * (PRM.slow < 1 ? 1 : 1); // ms of drift per real second
    if (n > 0 && n < 50) { const be = (W.beats & 1 ? .15 : -.15), nz = (rnd() - .5) * .05; TG.pts.push({ t: SIM.t, y: TG.dev + be + nz, odd: W.beats & 1 }); }
    while (TG.pts.length && SIM.t - TG.pts[0].t > 15) TG.pts.shift();
  }
}
// ---------- scope ----------
const sc = $('scope'); let sg = sc.getContext('2d'), SW = 0, SH = 0;
function sizeScope() { const r = sc.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); SW = sc.clientWidth; SH = sc.clientHeight; sc.width = Math.round(Math.max(1, r.width) * dpr); sc.height = Math.round(Math.max(1, r.height) * dpr); sg.setTransform(sc.width / Math.max(1, SW), 0, 0, sc.height / Math.max(1, SH), 0, 0); }
function ytk(g, s, y, x0, x1) { g.strokeStyle = SC.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, Math.round(y) + .5); g.lineTo(x1, Math.round(y) + .5); g.stroke(); txt(g, s, x0 - 5, y + 4, SC.mu, 'right'); }
function txt(g, s, x, y, col = SC.mu, al = 'left', f = '11px "JetBrains Mono"') { g.fillStyle = col; g.font = f; g.textAlign = al; g.fillText(s, x, y); }
const SANS = '11px "Inter","Noto Sans SC",sans-serif';
const SCOPEINFO = { scope: '' };
function drawScope() {
  const g = sg, Wd = SW, H = SH, r = W.R; if (!Wd || !H || !r) return; g.clearRect(0, 0, Wd, H); SC = scopePal();
  const cap = t('c_' + SCOPE); if ($('scopecap').textContent !== cap) $('scopecap').textContent = cap;
  SCOPEINFO.scope = SCOPE;
  const L = 44, Rr = Wd - 14, T = 14, Bt = H - 24;
  if (SCOPE === 'tg') {
    // y range auto: ±4 ms window around the trace, x = last 15 s
    const span = 15, x = tt => Rr - (SIM.t - tt) / span * (Rr - L);
    let mid = TG.pts.length ? TG.pts[TG.pts.length - 1].y : 0; const yr = 3, y = v => (T + Bt) / 2 - (v - mid) / yr * (Bt - T) / 2;
    for (let k = -2; k <= 2; k++) ytk(g, (k > 0 ? '+' : '') + fmt(k * 1.5, 1), y(mid + k * 1.5), L, Rr);
    txt(g, 'ms', L - 34, T - 2);
    for (const p of TG.pts) { const xx = x(p.t); if (xx < L) continue; g.fillStyle = p.odd ? SC.acc : SC.ok; g.fillRect(xx - 1.2, y(p.y) - 1.2, 2.4, 2.4); }
    const rate = r.rate; txt(g, `${t('ro_rate')} ${rate > 0 ? '+' : ''}${fmt(rate, 1)} s/d   ${t('ro_amp')} ${fmt(r.A, 0)}°   ${t('sc_be')} 0.3 ms   ${r.bph}`, L, Bt + 16, SC.tx2, 'left', SANS);
    if (!r.run) txt(g, t('ph_stop'), (L + Rr) / 2, (T + Bt) / 2, SC.bad, 'center', '600 13px "Inter","Noto Sans SC",sans-serif');
  } else if (SCOPE === 'phase') {
    const A = Math.max(r.A, 1), half = LIFT / 2, cyc = 2.2, p1 = W.p, p0 = p1 - cyc * TAU, X = p => L + (p - p0) / (p1 - p0) * (Rr - L - 30), Y = v => (T + Bt) / 2 - v / 330 * (Bt - T) / 2;
    g.fillStyle = document.body.classList.contains('light') ? 'rgba(196,86,28,.12)' : 'rgba(255,138,61,.14)';
    for (let k = Math.floor(p0 / Math.PI) - 1; k <= Math.ceil(p1 / Math.PI); k++) { const a = Math.asin(Math.min(1, half / A)); const s0 = Math.max(p0, k * Math.PI - a), s1 = Math.min(p1, k * Math.PI + a); if (s1 > s0) g.fillRect(X(s0), T, X(s1) - X(s0), Bt - T); }
    for (const v of [-300, -150, 0, 150, 300]) ytk(g, String(v), Y(v), L, Rr - 30);
    txt(g, 'θ °', L - 34, T - 2);
    g.strokeStyle = SC.acc; g.lineWidth = 1.8; g.beginPath(); for (let i = 0; i <= 300; i++) { const p = p0 + (p1 - p0) * i / 300; const v = r.run || A > 2 ? A * Math.sin(p) : 0; i ? g.lineTo(X(p), Y(v)) : g.moveTo(X(p), Y(v)); } g.stroke();
    g.strokeStyle = SC.hot; g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= 300; i++) { const p = p0 + (p1 - p0) * i / 300; const v = LEVER * clamp(A * Math.sin(p) / half, -1, 1) * 10; i ? g.lineTo(X(p), Y(v)) : g.moveTo(X(p), Y(v)); } g.stroke();
    g.fillStyle = SC.fg; g.beginPath(); g.arc(X(p1), Y(W.theta), 3.5, 0, TAU); g.fill();
    txt(g, t('ph_' + W.phaseState), Rr, Y(W.theta) + 4, SC.fg, 'right', SANS);
    txt(g, `— θ   — ${tr(B('lever ×10', '擒纵叉 ×10'))}   ▮ ${t('lg_imp')} (±${half}°)`, L, Bt + 16, SC.tx2, 'left', SANS);
  } else if (SCOPE === 'amp') {
    const c = cfgB(), hx = h => L + h / (c.res + 2) * (Rr - L - 34), ya = a => Bt - clamp(a / 320) * (Bt - T), yr = v => (T + Bt) / 2 - clamp(v / 40, -1, 1) * (Bt - T) / 2;
    for (const a of [0, 100, 200, 300]) ytk(g, String(a), ya(a), L, Rr - 34);
    for (const v of [-40, 0, 40]) txt(g, (v > 0 ? '+' : '') + v, Rr - 30, yr(v) + 4, SC.hot);
    txt(g, '°', L - 34, T - 2); txt(g, 's/d', Rr - 30, T - 2, SC.hot);
    g.strokeStyle = SC.acc; g.lineWidth = 2; g.beginPath(); let stopH = c.res;
    for (let i = 0; i <= 160; i++) { const h = c.res * i / 160, w = 1 - h / c.res, a = w > .004 ? ampTarget(w) : 0; if (a < 110 && stopH === c.res) stopH = h; const aa = h > stopH ? 0 : a; i ? g.lineTo(hx(h), ya(aa)) : g.moveTo(hx(h), ya(aa)); } g.stroke();
    g.strokeStyle = SC.hot; g.lineWidth = 1.4; g.setLineDash([4, 3]); g.beginPath();
    for (let i = 0; i <= 160; i++) { const h = c.res * i / 160; if (h > stopH) break; const w = 1 - h / c.res, a = ampTarget(w); const v = rateOf(a); i ? g.lineTo(hx(h), yr(v)) : g.moveTo(hx(h), yr(v)); } g.stroke(); g.setLineDash([]);
    g.strokeStyle = SC.bad; g.beginPath(); g.moveTo(L, ya(110) + .5); g.lineTo(Rr - 34, ya(110) + .5); g.globalAlpha = .5; g.stroke(); g.globalAlpha = 1;
    const hn = (1 - r.wind) * c.res; g.fillStyle = SC.fg; g.beginPath(); g.arc(hx(hn), ya(r.A), 4, 0, TAU); g.fill();
    txt(g, t('sc_now'), hx(hn) + 7, ya(r.A) - 6, SC.fg, 'left', SANS);
    txt(g, t('sc_h'), Rr - 34, Bt + 16, SC.tx2, 'right', SANS); txt(g, `— ${t('sc_amp')}   ‒ ‒ ${t('sc_rate')}`, L, Bt + 16, SC.tx2, 'left', SANS);
  } else if (SCOPE === 'train') {
    const f = r.f, esc = 60 * r.escRpm, rows = [['barrel', esc / 5040, r.T], ['center', esc / 720, r.T / 7 * .95], ['third', esc / 90, r.T / 56 * .9], ['fourth', esc / 12, r.T / 420 * .86], ['esc', esc, r.T / 5040 * .72]];
    const nm = { barrel: B('Barrel', '条盒'), center: B('Centre', '中心轮'), third: B('Third', '三轮'), fourth: B('Fourth', '四轮'), esc: B('Escape', '擒纵轮') };
    const lx = v => clamp((Math.log10(v) + 1) / 5), x0 = L + 30, x1 = Rr - 40, bh = (Bt - T) / rows.length;
    for (const d of [-1, 0, 1, 2, 3, 4]) { const xx = x0 + lx(Math.pow(10, d)) * (x1 - x0); g.strokeStyle = SC.grid; g.beginPath(); g.moveTo(xx + .5, T); g.lineTo(xx + .5, Bt); g.stroke(); txt(g, d < 0 ? '0.1' : String(Math.pow(10, d)), xx, Bt + 13, SC.mu, 'center'); }
    rows.forEach(([k, v, tq], i) => { const yy = T + i * bh + 3, hi = (ACT.hi || '').split(',').includes(k); txt(g, tr(nm[k]), x0 - 6, yy + bh * .45, hi ? SC.fg : SC.tx2, 'right', SANS); g.fillStyle = hi ? SC.acc : SC.dim; g.fillRect(x0, yy, lx(v) * (x1 - x0), bh * .42); txt(g, fmt(v, v < 1 ? 2 : 0), x0 + lx(v) * (x1 - x0) + 4, yy + bh * .38, SC.fg); g.fillStyle = SC.hot; const tw = lx(tq * 1000) * (x1 - x0); g.fillRect(x0, yy + bh * .5, tw, bh * .2); txt(g, (tq >= .1 ? fmt(tq, 2) + ' N·mm' : fmt(tq * 1000, 1) + ' µN·m'), x0 + tw + 4, yy + bh * .72, SC.hot, 'left', '10px "JetBrains Mono"'); });
    txt(g, `■ ${t('sc_rph')}   ■ ${t('sc_tq')} (µN·m, log)`, L, Bt + 26 > H ? Bt + 13 : Bt + 13, SC.tx2, 'left', SANS);
  }
}
let TIPS = null;
function showTip(info, x, y) { TIPS = { info, x, y }; const el = $('tip'); el.style.left = clamp(x + 14, 0, 1440 - 300) + 'px'; el.style.top = clamp(y + 10, 60, 810 - 160) + 'px'; el.style.opacity = 1; updateTip.last = ''; updateTip(); }
function updateTip() { if (!TIPS) return; const i = TIPS.info; const v = i.v ? i.v() : ''; const h = `<h5>${tr(i.name)}</h5><div class="tf">${tr(i.fn)}</div>${v ? `<div class="tv"><span>${t('cur')}</span>${v}</div>` : ''}`; if (h !== updateTip.last) { $('tip').innerHTML = h; updateTip.last = h; } }
function hideTip() { TIPS = null; $('tip').style.opacity = 0; }
