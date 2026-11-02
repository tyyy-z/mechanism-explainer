// ================= UI: trail, controls, why box, scope, readouts, tooltip =================
let CUR = 0, SCOPE = 'bus', WHYTAB = 'why';
const QUIZANS = {};
const ICON = {
  play: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8-5z"/></svg>',
  pause: '<svg class="i" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx=".6"/><rect x="9.4" y="3" width="2.6" height="10" rx=".6"/></svg>',
  check: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 6.2l2.3 2.3 4.7-5"/></svg>',
  pulse: '<svg class="i" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1.5 11h3V4.5h7V11h3"/></svg>',
};
function setBtn(el, html) { if (el._h !== html) { el.innerHTML = html; el._h = html; } }
function scopePal() {
  return document.body.classList.contains('light')
    ? { fg: '#111113', tx2: '#3e3f44', mu: '#66686e', dim: '#b4b4ba', grid: 'rgba(17,17,19,.07)', base: '#c8c8cd', tr: '#111113', tr2: '#55565c', acc: '#2f6fbd', cur: 'rgba(47,111,189,.10)', fill: 'rgba(17,17,19,.09)', warn: '#9a6a10', warnDim: 'rgba(154,106,16,.3)', ok: '#22704f', bad: '#b02a43', ver: '#b4b4ba' }
    : { fg: '#f2f2f3', tx2: '#bdbdc0', mu: '#8a8c92', dim: '#55555b', grid: 'rgba(255,255,255,.055)', base: '#3a3a3e', tr: '#f2f2f3', tr2: '#a9a9ad', acc: '#4a8ad6', cur: 'rgba(74,138,214,.13)', fill: 'rgba(242,242,243,.13)', warn: '#d9a441', warnDim: 'rgba(217,164,65,.3)', ok: '#5fc39c', bad: '#e5566f', ver: '#55555b' };
}
let SC = scopePal();
const STATE_COL = ['#94a3b8', '#60a5fa', '#22d3ee', '#34d399', '#a3e635', '#facc15', '#fb923c', '#f43f5e'];
const BLCOL = ['#38bdf8', '#f472b6', '#a3e635', '#fbbf24'];
function toast(msg, ms = 3800) { toast.msg = msg; const t = $('toast'); t.textContent = tr(typeof msg === 'function' ? msg() : msg); t.style.opacity = 1; toast.until = SIM.t + ms / 1000 * Math.max(1, SIM.speed); }
function tickToast() { if (toast.until && SIM.t > toast.until) { $('toast').style.opacity = 0; toast.until = 0; } }
function renderTrail() {
  $('steps').innerHTML = STEPS.map((s, i) => { const title = tr(s.title), parts = title.split(/[:：]/); return `<div class="st ${i === CUR ? 'cur' : i < CUR ? 'done' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="${t('step')} ${i + 1}: ${title}"><div class="nd">${i < CUR ? ICON.check : String(i + 1).padStart(2, '0')}</div><div><div class="tt">${parts[0]}</div><div class="sb">${(LANG === 'en' && s.id === 'rel') ? 'Retention · wear · read-retry' : (parts.slice(1).join(':').trim() || tr(s.sub))}</div></div></div>`; }).join('');
}
function renderStepTitle() { const s = STEPS[CUR]; $('steptitle').innerHTML = `<span class="ix">${String(CUR + 1).padStart(2, '0')} / 08</span>${tr(s.title)}<small>${tr(s.sub)}</small>`; }
$('steps').addEventListener('click', e => { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } });
$('steps').addEventListener('keydown', e => { if (e.key === 'Enter') { const el = e.target.closest('.st'); if (el) { userTook(); goStep(+el.dataset.i); } } });
function renderChips() { $('cmdseq').innerHTML = OPR.chips.map((c, i) => `<span class="${i === OPR.chip ? 'on' : i < OPR.chip ? 'done' : ''}">${c}</span>`).join(''); }
// ---------- why box ----------
function renderWhy() {
  const s = STEPS[CUR]; const b = $('whybody');
  document.querySelectorAll('#whytabs button').forEach(x => x.classList.toggle('on', x.dataset.t === WHYTAB));
  if (WHYTAB === 'why') b.innerHTML = tr(s.why);
  else if (WHYTAB === 'math') b.innerHTML = tr(s.math);
  else if (WHYTAB === 'ex') b.innerHTML = tr(s.try);
  else if (WHYTAB === 'quiz') { const q = s.quiz; b.innerHTML = `<div class="quiz"><div class="q">${tr(q.q)}</div><div class="opts">${q.opts.map((o, i) => `<button data-i="${i}">${String.fromCharCode(65 + i)}. ${tr(o)}</button>`).join('')}</div><div class="fb" id="qfb"></div></div>`; }
  else if (WHYTAB === 'src') b.innerHTML = tr(B(`<p class="note">Sources for this step (public references; numerical values are typical):</p><ol style="margin:0;padding-left:18px;font-size:12px;line-height:1.55">${s.src.map(k => `<li>${tr(SRC[k])}</li>`).join('')}</ol>`, `<p class="note">本步引用 (全部为公开文献；数值标注为典型值)：</p><ol style="margin:0;padding-left:18px;font-size:12px;line-height:1.55">${s.src.map(k => `<li>${tr(SRC[k])}</li>`).join('')}</ol>`)) + (CUR === STEPS.length - 1 ? tr(B(`<p class="note" style="margin-top:6px"><b>Simplifications and variations:</b> geometry is scaled down and uses far fewer layers than real devices (100–300+); FN/GIDL use compact analytical models; sensing uses ideal RC discharge; TLC uses a single full-sequence program pass (real devices often use multiple passes); retention/wear is illustrative. Vendors differ in FG vs CT, CuA/PUC/COP/Xtacking, coding, and voltage. This lesson does not represent a specific product.</p>`, `<p class="note" style="margin-top:6px"><b>简化与差异说明：</b>几何按比例缩小、层数远少于真实器件 (真实 100–300+ 层)；FN/GIDL 为紧凑解析模型；感测用理想 RC 放电；TLC 采用单遍全序列编程 (真实器件常用多遍)；保持/磨损模型为示意。各厂商在 FG vs CT、CuA/PUC/COP/Xtacking、编码、电压上各不相同——本课不代表任何具体产品。</p>`)) : '');
  if (WHYTAB === 'quiz' && QUIZANS[CUR] != null) renderQuizFeedback();
  if (window.renderMathInElement) try { renderMathInElement(b, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (e) { }
}
$('whytabs').addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; userTook(); WHYTAB = t.dataset.t; renderWhy(); });
function renderQuizFeedback() {
  const q = STEPS[CUR].quiz, i = QUIZANS[CUR];
  document.querySelectorAll('.quiz button').forEach((x, j) => { x.classList.toggle('right', j === q.a && i === q.a); x.classList.toggle('wrong', j === i && i !== q.a); });
  $('qfb').innerHTML = i === q.a ? `<span class="ok">${t('correct')}</span> ${tr(q.fb)}` : tr(B('<span class="no">Incorrect</span> Try again. Hint: see the “Why” tab.', '<span class="no">不对</span>　再想想。提示：看「原理」标签页。'));
}
$('whybody').addEventListener('click', e => { const b = e.target.closest('.quiz button'); if (!b) return; userTook(); QUIZANS[CUR] = +b.dataset.i; renderQuizFeedback(); });
// ---------- controls ----------
function segBind(id, key, after) {
  $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); SEL[key] = b.dataset.v; syncControls(); after && after(b.dataset.v); });
}
segBind('op', 'op', () => { });
segBind('mode', 'mode', v => { if (OPR.running) abortOp(); resetBlock(v); toast(() => (tr(B(`Switched to ${v}: block reset (WL0–3 preprogrammed with random data; WL4–7 erased)`, `切换为 ${v}：block 已重置 (WL0–3 预写入随机数据，WL4–7 为擦除态)`)))); });
segBind('page', 'page');
const rng = (id, key, f, after) => $(id).addEventListener('input', e => { userTook(); SEL[key] = +e.target.value; syncControls(); after && after(); });
rng('wl', 'wl'); rng('ispp', 'ispp', null, () => calcDisturb()); rng('vpass', 'vpass', null, () => calcDisturb()); rng('vread', 'vread'); rng('rshift', 'rshift'); rng('vers', 'vers'); rng('ret', 'ret'); rng('pe', 'pe');
$('vg').addEventListener('input', e => { userTook(); CELLSTEP.vg = +e.target.value; syncControls(); });
$('bls').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; userTook(); const k = +b.dataset.k; if (BLOCKMODE === 'TLC') SEL.data[k] = (SEL.data[k] + 1) % 8; else SEL.slc[k] ^= 1; syncControls(); });
$('btnRun').addEventListener('click', () => { userTook(); runCurrent(); });
$('btnStepOp').addEventListener('click', () => { userTook(); if (STEPS[CUR].id === 'cell') { CELLSTEP.vt = -1.6; CELLSTEP.pulses = 0; } else if (OPR.running) nextSeg(); });
$('btnPause').addEventListener('click', () => { userTook(); SIM.paused = !SIM.paused; setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause); });
$('speed').addEventListener('change', e => { userTook(); SIM.speed = +e.target.value; });
$('btnExplode').addEventListener('click', () => { userTook(); toggleExplode(); });
$('btnReset').addEventListener('click', () => { userTook(); user.daz = user.del = 0; user.zoom = 1; });
$('btnTheme').addEventListener('click', () => { document.body.classList.toggle('light'); });
$('btnAuto').addEventListener('click', () => { restartAutoplay(); });
document.querySelectorAll('#scopetabs button').forEach(b => b.addEventListener('click', () => { userTook(); SCOPE = b.dataset.s; syncControls(); }));
function runCurrent() {
  const s = STEPS[CUR];
  if (s.id === 'cell') { applyCellPulse(); return; }
  const op = s.op || SEL.op; SEL.op = op;
  if (startOp(op)) { if (op === 'READ' && SCOPE !== 'vt' && (s.id === 'read')) SCOPE = 'bl'; if (op === 'PROGRAM' && s.id === 'pgm' && SCOPE !== 'vt') SCOPE = 'ispp'; if (op === 'ERASE' && s.id === 'ers' && SCOPE !== 'vt') SCOPE = 'erase'; }
  syncControls();
}
function applyCellPulse() {
  const c = { vt: CELLSTEP.vt }; const E0 = fieldAt(1, CR.tun[0]); // V/cm per volt
  // integrate FN using the cylinder tunnel field
  let vt = CELLSTEP.vt, t = 0; const tp = PHY.tp;
  while (t < tp) { const E = (CELLSTEP.vg - (vt + 1.6)) * E0; const r = fnJ(E) / PHY.Cb; if (r < 1e-3) break; let dv = r * (tp - t); if (dv > 0.03) { dv = 0.03; t += dv / r; } else t = tp; vt += dv; }
  CELLSTEP.vt = vt; CELLSTEP.pulses++; CELLSTEP.flash = SIM.t;
}
function rangeFill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%'); }
$('ctl').addEventListener('input', e => { if (e.target.type === 'range') rangeFill(e.target); });
function syncControls() {
  const s = STEPS[CUR];
  ['r-op', 'r-mode', 'r-page', 'r-wl', 'r-bl', 'r-step', 'r-vpass', 'r-vread', 'r-shift', 'r-vers', 'r-vg', 'r-ret', 'r-pe'].forEach(id => $(id).style.display = s.rows.includes(id) ? '' : 'none');
  if (s.id === 'read' && BLOCKMODE === 'SLC') $('r-page').style.display = 'none';
  const on = (id, v) => document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  on('op', s.op || SEL.op); on('mode', BLOCKMODE); on('page', SEL.page);
  $('wl').value = SEL.wl; $('wlv').textContent = 'WL' + SEL.wl + (WRITTEN[SEL.wl] ? tr(B(" Pgm", ' 已写')) : tr(B(" Er", ' 空')));
  $('ispp').value = SEL.ispp; $('isppv').textContent = SEL.ispp.toFixed(2) + ' V';
  $('vpass').value = SEL.vpass; $('vpassv').textContent = SEL.vpass.toFixed(1) + ' V';
  $('vread').value = SEL.vread; $('vreadv').textContent = SEL.vread.toFixed(1) + ' V';
  $('rshift').value = SEL.rshift; $('rshiftv').textContent = (SEL.rshift >= 0 ? '+' : '−') + Math.abs(SEL.rshift).toFixed(2) + ' V';
  $('vers').value = SEL.vers; $('versv').textContent = SEL.vers.toFixed(1) + ' V';
  $('vg').value = CELLSTEP.vg; $('vgv').textContent = CELLSTEP.vg.toFixed(1) + ' V';
  $('ret').value = SEL.ret; $('retv').textContent = SEL.ret + tr(B(" yr", ' 年'));
  $('pe').value = SEL.pe; $('pev').textContent = SEL.pe;
  $('bls').innerHTML = [0, 1, 2, 3].map(k => { if (BLOCKMODE === 'TLC') { const st = SEL.data[k]; return tr(B(`<button data-k="${k}" title="BL${k}: click to change target state"><span><i class="sw" style="--c:${STATE_COL[st]}"></i>${STATES[st]}</span><small>BL${k}·${TLC_BITS[st].join('')}</small></button>`, `<button data-k="${k}" title="BL${k}：点击切换目标态"><span><i class="sw" style="--c:${STATE_COL[st]}"></i>${STATES[st]}</span><small>BL${k}·${TLC_BITS[st].join('')}</small></button>`)); } const b = SEL.slc[k]; return tr(B(`<button data-k="${k}" title="BL${k}: click to toggle"><span><i class="sw" style="--c:${b ? '#94a3b8' : '#f472b6'}"></i>${b ? 'Er' : 'P'}</span><small>BL${k}·${b}</small></button>`, `<button data-k="${k}" title="BL${k}：点击切换"><span><i class="sw" style="--c:${b ? '#94a3b8' : '#f472b6'}"></i>${b ? 'Er' : 'P'}</span><small>BL${k}·${b}</small></button>`)); }).join('');
  const op = s.op || SEL.op;
  setBtn($('btnRun'), s.id === 'cell' ? ICON.pulse + tr(B("Apply 15 µs gate pulse", '施加 15 µs 栅脉冲')) : OPR.running ? tr(B("<span class=\"spin\"></span>Running…", '<span class="spin"></span>运行中…')) : ICON.play + tr(B(`Run ${op}`, `运行 ${op}`)));
  setBtn($('btnPause'), SIM.paused ? ICON.play : ICON.pause);
  document.querySelectorAll('#ctl input[type=range]').forEach(rangeFill);
  $('btnRun').disabled = s.id !== 'cell' && OPR.running; $('btnRun').parentElement.style.display = s.run ? '' : 'none';
  $('btnStepOp').title = s.id === 'cell' ? tr(B("Reset cell", '重置单元')) : tr(B("Skip to next phase", '跳到下一阶段'));
  $('btnStepOp').setAttribute('aria-label', $('btnStepOp').title);
  document.querySelectorAll('#scopetabs button').forEach(b => b.classList.toggle('on', b.dataset.s === SCOPE));
}
// ---------- disturb estimates ----------
const DIST = { inh: 0, pass: 0, loops: 0, rd: 0 };
function calcDisturb() {
  const Vs = BLOCKMODE === 'SLC' ? 15.0 : 14.6, top = Vs + (BLOCKMODE === 'SLC' ? 2.0 : 5.4); let inh = -1.6, ps = -1.6, n = 0;
  for (let V = Vs; V <= top + 1e-6; V += SEL.ispp) { inh = pgmPulse(inh, V, boostV(SEL.vpass, V), 1); ps = pgmPulse(ps, SEL.vpass, 0, 1); n++; }
  DIST.inh = inh + 1.6; DIST.pass = ps + 1.6; DIST.loops = n;
}
function readDisturb(vp, nreads = 1e5) { const E = (vp + 1.6) / PHY.EOT; return fnJ(E) / PHY.Cb * 20e-6 * nreads; }
// ---------- readouts ----------
const roW = (t, a) => [...String(t).replace(/<[^>]+>/g, '')].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 12 : a), 0);
function ro(pairs) { const h = pairs.map(([k, v]) => `<div${roW(k, 6.4) + roW(v, 7.3) > 142 ? ' class="w"' : ''}><span>${k}</span><b>${v}</b></div>`).join(''); if (h !== ro.last) { $('readouts').innerHTML = h; ro.last = h; } }
function sci(x) { if (x <= 0) return '0'; const e = Math.floor(Math.log10(x)); return (x / 10 ** e).toFixed(1) + 'e' + e; }
let RBERC = { key: '', v: 0 };
function cachedRber(w, shift, tr) { const k = [w, shift, tr ? SEL.ret + ':' + SEL.pe : '', BLOCKMODE, SEL.page, WRITTEN[w], OPR.running ? OPCLK.toFixed(0) : 'idle'].join('|'); if (k !== RBERC.key) { RBERC.key = k; RBERC.v = popReadStats(w, shift, tr ? relTransform : null); } return RBERC.v; }
function updateReadouts() {
  const s = STEPS[CUR].id, w = SEL.wl, cells = CELLS[w];
  if (s === 'sys') ro([['Page size (typ.)', '16 KiB + spare'], [tr(B("Interface (typ.)", '接口 (typ.)')), '1600 MT/s ×8'], [tr(B("t_xfer / page", 't_xfer 一页')), '≈ 10 µs'], ['tR / tPROG / tBERS', '50µs / 0.5ms / 3ms'], [tr(B("Command", '当前命令')), OPR.kind || '—'], ['R/B#', OPR.running && OPR.chip >= 3 ? '0 (Busy)' : '1 (Ready)']]);
  else if (s === 'cua') ro([[tr(B("Peak WL voltage", 'WL 最高电压')), fmt(NODES.WLmax) + ' V'], [tr(B("BLKSEL gate", 'BLKSEL 栅压')), fmt(Math.max(NODES.WLmax + 3, 0)) + ' V'], ['SGD / SGS', fmt(NODES.SGD) + ' / ' + fmt(NODES.SGS) + ' V'], ['SL', fmt(NODES.SL) + ' V'], [tr(B("Pump stages (example)", '泵级数 (Dickson 示意)')), '~10–14'], [tr(B("Operation", '操作')), OPR.kind || '—']]);
  else if (s === 'arr') ro([[tr(B("Model layers", '本模型层数')), '12 (SGS+DWL+8WL+DWL+SGD)'], [tr(B("Real devices (public)", '真实器件 (公开)')), tr(B("100 – 300+ layers", '100 – 300+ 层'))], [tr(B("Hole diameter (typ.)", '孔径 (typ.)')), '~100 nm'], [tr(B("WL thickness (typ.)", 'WL 层厚 (typ.)')), '~20–35 nm'], [tr(B("Selected page", '选中 page')), `Block1 · WL${w}`], ['block = ', tr(B("all strings between slits", 'slit 之间所有 string'))]]);
  else if (s === 'cell') { const Et = fieldAt(CELLSTEP.vg - (CELLSTEP.vt + 1.6), CR.tun[0]), Eb = fieldAt(CELLSTEP.vg - (CELLSTEP.vt + 1.6), CR.blk[1]); ro([[tr(B("E_tunnel (inner)", 'E_tunnel (内)')), (Et / 1e6).toFixed(2) + ' MV/cm'], [tr(B("E_blocking (outer)", 'E_blocking (外)')), (Eb / 1e6).toFixed(2) + ' MV/cm'], [tr(B("Ratio (GAA)", '比值 (GAA)')), (Et / Math.max(Eb, 1)).toFixed(2) + '×'], ['J_FN', sci(fnJ(Et)) + ' A/cm²'], ['Vt', fmt(CELLSTEP.vt, 2) + ' V'], [tr(B("Pulses", '脉冲数')), CELLSTEP.pulses]]); }
  else if (s === 'read') { const r = TR.lastRead; const bits = r && r.bits ? r.bits.join(' ') : '— — — —'; ro([[tr(B("Page / references", '页 / 参考电平')), (BLOCKMODE === 'SLC' ? 'SLC' : SEL.page) + ' · ' + refsFor().map(i => (BLOCKMODE === 'SLC' ? 'Vref' : 'R' + (i + 1))).join(',')], [tr(B("BL0..3 output", 'BL0..3 读出')), bits], [tr(B("Target bits", '真值 (目标)')), cells.map(c => trueBit(c.tgt)).join(' ')], [tr(B("WL state", 'WL 状态')), WRITTEN[w] ? tr(B("Programmed", '已编程')) : tr(B("Erased (all 1)", '擦除态 (全 1)'))], [tr(B("Page RBER (3072 cells)", '页 RBER (3072 cell)')), sci(cachedRber(w, SEL.rshift))], [tr(B("Read disturb /1e5 reads", 'Read disturb /1e5 次')), fmt(readDisturb(SEL.vread) * 1000, 2) + ' mV']]); }
  else if (s === 'pgm') { const st = ISPP && OPR.kind === 'PROGRAM' ? ISPP : null; const h = st && st.history.length ? st.history[st.history.length - 1] : null; ro([['ISPP loop', h ? h.k + 1 : '—'], ['Vpgm', h ? h.Vpgm.toFixed(2) + ' V' : '—'], [tr(B("Verify pending", '未通过 verify')), h ? h.remaining + ' / ' + POPS[w].filter(c => c.tgt > 0).length : '—'], [tr(B("Inhibit V_boost", '禁止沟道 V_boost')), fmt(boostV(SEL.vpass, h ? h.Vpgm : 18)) + ' V'], ['Program disturb ΔVt', fmt(DIST.inh * 1000, 0) + ' mV'], ['Pass disturb ΔVt', fmt(DIST.pass * 1000, 0) + ' mV'], [tr(B("Page RBER", '页 RBER')), WRITTEN[w] || (st && st.done) ? sci(cachedRber(w, 0)) : '—'], [tr(B("tPROG estimate", 'tPROG 估计')), ((h ? h.k + 1 : DIST.loops) * (15 + (BLOCKMODE === 'TLC' ? 7 : 1) * 4) / 1000).toFixed(2) + ' ms']]); }
  else if (s === 'ers') { const L = TR.eraseLoops[TR.eraseLoops.length - 1]; ro([['ISPE loop', OPR.kind === 'ERASE' ? ERS.loop + 1 : '—'], ['Verase', OPR.kind === 'ERASE' ? ERS.V.toFixed(1) + ' V' : '—'], [tr(B("Channel Vch", '沟道电位 Vch')), fmt(NODES.Vch[0]) + ' V'], [tr(B("Block peak Vt", 'block 最高 Vt')), L ? fmt(L.mx, 2) + ' V' : '—'], [tr(B("EV failures", 'EV 未通过')), L ? L.fail + ' cells' : '—'], [tr(B("Result", '结果')), OPR.result && OPR.kind === 'ERASE' ? tr(OPR.result.msg) || '' : '—']]); }
  else if (s === 'rel') { const rb = cachedRber(w, SEL.rshift, true); ro([[tr(B("RBER (illustrative)", 'RBER (示意)')), sci(rb)], [tr(B("LDPC range (typ.)", 'LDPC 可纠 (typ.)')), '~1e-3 – 1e-2'], [tr(B("Status", '状态')), rb < 3e-3 ? tr(B("<span class=\"pos\">ECC correctable</span>", '<span class="pos">ECC 可纠</span>')) : tr(B("<span class=\"neg\">Exceeded → read-retry</span>", '<span class="neg">超出 → read-retry</span>'))], [tr(B("Retention / P/E", '保持 / P/E')), SEL.ret + tr(B(" yr / ", ' 年 / ')) + SEL.pe], ['Read disturb /1e5', fmt(readDisturb(SEL.vread) * 1000, 2) + ' mV'], [tr(B("Read offset", '读参考偏移')), fmt(SEL.rshift, 2) + ' V']]); }
}
// ---------- scope ----------
const sc = $('scope'); let sg = sc.getContext('2d'), SW = 0, SH = 0;
function sizeScope() { const r = sc.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); SW = sc.clientWidth; SH = sc.clientHeight; sc.width = Math.round(r.width * dpr); sc.height = Math.round(r.height * dpr); sg.setTransform(sc.width / SW, 0, 0, sc.height / SH, 0, 0); }
const CAP = {
  bus: B("ONFI timing (illustrative): CLE/ALE select command/address latching on WE# rising edges; R/B# low = die busy (tR/tPROG/tBERS).", 'ONFI 时序 (示意)：CLE/ALE 决定 WE# 上升沿锁存的是命令还是地址；R/B# 低 = die 内部忙 (tR/tPROG/tBERS)。'),
  bias: B("Live node voltages (color = voltage scale). PROGRAM boosts inhibited-string Vch; ERASE raises the channel with GIDL holes.", '各节点实时电压 (颜色 = 电压色标)。注意 PROGRAM 时禁止 string 的沟道 Vch 被升压，ERASE 时沟道被 GIDL 空穴抬高。'),
  field: B("Radial E(r) in the cylindrical GAA stack: highest at inner tunnel oxide, lowest at outer blocking oxide. Dashed: planar field for the same stack (illustrative).", '圆柱 GAA 叠层中的径向场 E(r)：tunnel 内侧最高、blocking 外侧最低；虚线 = 同叠层平板结构的场 (示意)。'),
  vt: B("Vt distribution of 3072 cells on the selected WL (log count). Solid: verify levels PV; dashed: read references R_k; dots: the 4 visible cross-section cells.", '选中 WL 上 3072 个单元的 Vt 分布 (对数计数)。实线 = verify 电平 PV，虚线 = 读参考 R_k；圆点 = 剖面中 4 个可见单元。'),
  bl: B("BL voltage vs device time: a conducting cell discharges BL below trip → sensed as “Vt < R_k”.", 'BL 电压 vs 时间 (device time)：导通单元的 BL 放电越过 trip 点 → 读为 "Vt < R_k"。'),
  ispp: B("ISPP staircase: each Vpgm pulse (bar) is followed by verify; curve = cells still below verify (log count).", 'ISPP 阶梯：每个 Vpgm 脉冲 (柱) 后接 verify；曲线 = 尚未通过 verify 的单元数 (对数)。'),
  erase: B("Erase: GIDL raises channel potential Vch(t), one trace per ISPE loop. Diamonds: block peak Vt after verify; dashed: EV.", '擦除：沟道电位 Vch(t) 被 GIDL 抬升 (每个 ISPE loop 一条)；菱形 = 每次 verify 后的 block 最高 Vt，虚线 = EV。'),
};
function axes(g, x0, y0, x1, y1) { g.strokeStyle = SC.base; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, Math.round(y1) + .5); g.lineTo(x1, Math.round(y1) + .5); g.stroke(); }
function ytk(g, s, y, x0, x1) { g.strokeStyle = SC.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, Math.round(y) + .5); g.lineTo(x1, Math.round(y) + .5); g.stroke(); txt(g, s, x0 - 6, y + 4, SC.mu, 'right'); }
function swatch(g, items, x, y) { g.font = '12px "Public Sans","Noto Sans SC",sans-serif'; g.textAlign = 'left'; let w = 0; items.forEach(([c, t, kind]) => w += 14 + g.measureText(t).width + 12); let cx = x - w; items.forEach(([c, t, kind]) => { g.fillStyle = c; g.strokeStyle = c; if (kind === 'line') { g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, y - 4); g.lineTo(cx + 10, y - 4); g.stroke(); } else g.fillRect(cx + 2, y - 8, 6, 8); g.fillStyle = SC.mu; g.fillText(t, cx + 14, y); cx += 14 + g.measureText(t).width + 12; }); }
function txt(g, s, x, y, col = SC.mu, al = 'left', f = '11px "JetBrains Mono","Noto Sans SC",monospace') { g.fillStyle = col; g.font = f; g.textAlign = al; g.fillText(s, x, y); }
function drawScope() {
  const g = sg, W = SW, H = SH; g.clearRect(0, 0, W, H);
  SC = scopePal(); const fg = SC.fg;
  $('scopecap').textContent = tr(CAP[SCOPE]);
  const L = 36, Rm = 4, T = 16, bottom = H - 22;
  if (SCOPE === 'bus') {
    const rows = ['CLE', 'ALE', 'WE#', 'RE#', 'DQ', 'R/B#'], cyc = TR.bus.length ? TR.bus : [{ t: 'cmd', v: '—' }]; const n = cyc.length + 2, cw = (W - L - Rm) / n, rh = (bottom - T) / rows.length;
    rows.forEach((r, i) => txt(g, r, 0, T + rh * (i + .62), SC.tx2));
    const busy = OPR.running && /^t/.test(OPR.chips[OPR.chip] || '');
    for (let i = 0; i < rows.length; i++) {
      const y0 = T + rh * i + rh * .2, y1 = T + rh * i + rh * .8; g.strokeStyle = i === 4 ? SC.tr2 : SC.tr; g.lineWidth = 1.25; g.beginPath();
      for (let j = 0; j < n; j++) {
        const c = cyc[j - 1], x = L + j * cw, act = c && j - 1 <= TR.busIdx; let hi = 0;
        if (!c) hi = i === 2 || i === 3 || i === 5 ? 1 : 0;
        else if (i === 0) hi = c.t === 'cmd' ? 1 : 0; else if (i === 1) hi = c.t === 'addr' ? 1 : 0; else if (i === 2) hi = c.t === 'dout' ? 1 : 0.5; else if (i === 3) hi = c.t === 'dout' ? 0.5 : 1; else if (i === 5) hi = busy ? 0 : 1;
        if (i === 4) { if (c) { g.moveTo(x + 3, (y0 + y1) / 2); g.lineTo(x + 7, y0); g.lineTo(x + cw - 7, y0); g.lineTo(x + cw - 3, (y0 + y1) / 2); g.lineTo(x + cw - 7, y1); g.lineTo(x + 7, y1); g.closePath(); } continue; }
        if (hi === 0.5) { const xm = x + cw * .5; g.lineTo(x, y0); g.lineTo(x + cw * .2, y0); g.lineTo(x + cw * .2, y1); g.lineTo(xm, y1); g.lineTo(xm, y0); g.lineTo(x + cw, y0); }
        else { const y = hi ? y0 : y1; if (j === 0) g.moveTo(x, y); else g.lineTo(x, y); g.lineTo(x + cw, y); }
      }
      g.globalAlpha = 1; g.stroke();
    }
    cyc.forEach((c, j) => { const x = L + (j + 1) * cw; txt(g, c.v, x + cw / 2, T + rh * 4.6, j <= TR.busIdx ? fg : SC.dim, 'center', `500 ${Math.max(9, Math.min(11, cw / 4))}px "JetBrains Mono"`); });
    if (TR.bus.length) { const x = L + (TR.busIdx + 1.5) * cw; g.fillStyle = SC.cur; g.fillRect(x - cw / 2, T, cw, bottom - T); g.fillStyle = SC.acc; g.fillRect(x - cw / 2, T - 3, cw, 1); }
    txt(g, OPR.kind ? OPR.kind + ' · ' + (OPR.chips[OPR.chip] || '') : tr(B("Press Run for bus timing", '点「运行」生成时序')), W - 4, H - 4, SC.mu, 'right');
  } else if (SCOPE === 'bias') {
    const w = SEL.wl, items = [['WL' + w + ' sel', NODES.WL[w]], ['WL unsel', NODES.WL[(w + 1) % 8]], ['SGD', NODES.SGD], ['SGS', NODES.SGS], ['SL', NODES.SL], ...[0, 1, 2, 3].map(k => ['BL' + k, NODES.BL[k]]), ...[0, 1, 2, 3].map(k => ['Vch' + k, NODES.Vch[k]])];
    const bh = (bottom - T) / items.length, x0 = 62, x1 = W - 44;
    for (let v = 0; v <= 20; v += 5) { const x = x0 + (x1 - x0) * v / 22; g.strokeStyle = SC.grid; g.beginPath(); g.moveTo(Math.round(x) + .5, T); g.lineTo(Math.round(x) + .5, bottom); g.stroke(); txt(g, v + ' V', x, H - 6, SC.mu, 'center'); }
    items.forEach(([n, v], i) => { const y = T + i * bh; txt(g, n, 0, y + bh * .7, SC.tx2); g.fillStyle = vCss(v); g.fillRect(x0, y + bh * .18, Math.max(1, (x1 - x0) * clamp(v / 22)), bh * .64); txt(g, fmt(v, 1), x0 + (x1 - x0) * clamp(v / 22) + 4, y + bh * .7, fg); });
  } else if (SCOPE === 'field') {
    const V = CELLSTEP.vg - (CELLSTEP.vt + 1.6), r0 = CR.tun[0], r1 = CR.blk[1], Emax = 14e6;
    const X = r => L + (W - L - Rm) * (r - r0 + 2) / (r1 - r0 + 4), Y = E => bottom - (bottom - T) * clamp(E / Emax);
    [['tun', SC.tx2], ['sin', '#3fbf8f'], ['blk', SC.mu]].forEach(([id, c]) => { g.fillStyle = c; g.globalAlpha = .07; g.fillRect(X(CR[id][0]), T, X(CR[id][1]) - X(CR[id][0]), bottom - T); g.globalAlpha = 1; txt(g, id === 'tun' ? 'tunnel' : id === 'sin' ? 'SiN' : 'block', (X(CR[id][0]) + X(CR[id][1])) / 2, T + 10, id === 'sin' ? '#3fbf8f' : SC.mu, 'center'); });
    axes(g, L, T, W - Rm, bottom);
    for (let e = 0; e <= 12; e += 4) { ytk(g, e, Y(e * 1e6), L, W - Rm); }
    txt(g, 'MV/cm', 0, T - 4, SC.mu); txt(g, 'r (nm)', W - Rm, H - 2, SC.mu, 'right');
    g.strokeStyle = SC.tr; g.lineWidth = 1.6; g.beginPath(); for (let r = r0; r <= r1; r += .25) { const E = fieldAt(V, r); r === r0 ? g.moveTo(X(r), Y(E)) : g.lineTo(X(r), Y(E)); } g.stroke();
    // planar comparison
    g.setLineDash([4, 4]); g.strokeStyle = SC.warn; g.lineWidth = 1.2; g.beginPath();
    const Ep = V / (PLANAR_EOT * 1e-7); for (let r = r0; r <= r1; r += .25) { const E = r < CR.tun[1] || r >= CR.blk[0] ? Ep : Ep * 3.9 / 7.5; r === r0 ? g.moveTo(X(r), Y(E)) : g.lineTo(X(r), Y(E)); } g.stroke(); g.setLineDash([]);
    [r0, CR.tun[1], CR.sin[1], r1].forEach(r => txt(g, r, X(r), bottom + 13, SC.mu, 'center'));
    txt(g, `E_tun=${(fieldAt(V, r0) / 1e6).toFixed(1)}  E_blk=${(fieldAt(V, r1) / 1e6).toFixed(1)} MV/cm`, W - Rm, T + 26, fg, 'right'); swatch(g, [[SC.tr, tr(B("GAA cylinder", 'GAA 圆柱')), 'line'], [SC.warn, tr(B("Planar (dashed)", '平板 (虚线)')), 'line']], W - Rm, T + 42);
  } else if (SCOPE === 'vt') {
    const w = SEL.wl, rel = STEPS[CUR].id === 'rel', pop = POPS[w], vmin = -3.5, vmax = 6, NB = 120; const hist = new Float32Array(NB);
    for (let i = 0; i < pop.length; i++) { const v = rel ? relTransform(pop[i], i) : pop[i].vt; const b = Math.floor((v - vmin) / (vmax - vmin) * NB); if (b >= 0 && b < NB) hist[b]++; }
    const X = v => L + (W - L - Rm) * (v - vmin) / (vmax - vmin), Y = c => bottom - (bottom - T) * clamp(Math.log10(1 + c) / Math.log10(1 + pop.length / 6));
    axes(g, L, T, W - Rm, bottom);
    for (let v = -3; v <= 6; v++) txt(g, v, X(v), bottom + 13, SC.mu, 'center'); txt(g, 'Vt (V)', W - Rm, H - 0, SC.mu, 'right'); txt(g, 'log N', 0, T - 4, SC.mu);
    const Lv = LEVELS[BLOCKMODE];
    g.fillStyle = SC.fill; g.strokeStyle = SC.tr; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(vmin), bottom); for (let i = 0; i < NB; i++) { const v = vmin + (i + .5) * (vmax - vmin) / NB; g.lineTo(X(v), Y(hist[i])); } g.lineTo(X(vmax), bottom); g.closePath(); g.fill(); g.stroke();
    Lv.PV.forEach((p, i) => { if (p == null) return; g.strokeStyle = STATE_COL[i]; g.globalAlpha = .7; g.lineWidth = 1; g.beginPath(); g.moveTo(X(p), T); g.lineTo(X(p), bottom); g.stroke(); g.globalAlpha = 1; txt(g, BLOCKMODE === 'TLC' ? STATES[i] : 'P', X(p) + 2, T + 8, STATE_COL[i]); });
    const refs = refsFor(); Lv.R.forEach((r, i) => { const used = refs.includes(i); g.setLineDash([3, 3]); g.strokeStyle = used ? SC.warn : SC.warnDim; g.lineWidth = used ? 1.4 : 1; g.beginPath(); g.moveTo(X(r + SEL.rshift), T + 12); g.lineTo(X(r + SEL.rshift), bottom); g.stroke(); g.setLineDash([]); });
    g.strokeStyle = SC.mu; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(X(EV), T); g.lineTo(X(EV), bottom); g.stroke(); g.setLineDash([]); txt(g, 'EV', X(EV) - 3, T + 8, SC.mu, 'right');
    CELLS[w].forEach((c, k) => { g.fillStyle = BLCOL[k]; g.beginPath(); g.arc(X(c.vt), bottom - 6 - k * 6, 3, 0, 7); g.fill(); g.strokeStyle = SC.bg || 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.stroke(); });
    if (rel || STEPS[CUR].id === 'read') { const rb = cachedRber(w, SEL.rshift, rel); txt(g, 'RBER ' + sci(rb), W - Rm, T + 22, rb > 3e-3 ? SC.bad : SC.ok, 'right', '500 12px "JetBrains Mono"'); }
    if (!WRITTEN[w] && !OPR.running) txt(g, tr(B(`WL${w}: erased`, `WL${w}: 擦除态`)), W - Rm, T + 38, SC.mu, 'right');
  } else if (SCOPE === 'bl') {
    const tmax = PHY.tStrobe * 1.25, X = t => L + (W - L - Rm) * t / tmax, Y = v => bottom - (bottom - T) * clamp(v / 0.8);
    axes(g, L, T, W - Rm, bottom); for (let v = 0; v <= .8; v += .2) ytk(g, v.toFixed(1), Y(v), L, W - Rm); txt(g, 'V_BL', 0, T - 4, SC.mu); txt(g, 't (µs)', W - Rm, H - 0, SC.mu, 'right');
    for (let t = 0; t <= 3; t += 1) txt(g, t, X(t * 1e-6), bottom + 13, SC.mu, 'center');
    g.strokeStyle = SC.mu; g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(L, Y(PHY.trip)); g.lineTo(W - Rm, Y(PHY.trip)); g.stroke(); g.beginPath(); g.moveTo(X(PHY.tStrobe), T); g.lineTo(X(PHY.tStrobe), bottom); g.stroke(); g.setLineDash([]); txt(g, 'trip', W - Rm, Y(PHY.trip) - 4, SC.mu, 'right'); txt(g, 'strobe', X(PHY.tStrobe) + 4, bottom - 6, SC.mu);
    TR.bl.forEach((trace, n) => { const last = n === TR.bl.length - 1; trace.pts.forEach((pts, k) => { g.strokeStyle = BLCOL[k]; g.globalAlpha = last ? 1 : .25; g.lineWidth = last ? 1.6 : 1; g.beginPath(); pts.forEach(([t, v], i) => i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v))); g.stroke(); }); g.globalAlpha = 1; if (last) txt(g, tr(B("Reference ", '参考 ')) + trace.ref, L + 6, T + 8, fg); });
    [0, 1, 2, 3].forEach(k => txt(g, 'BL' + k, W - Rm - (3 - k) * 30, T + 24, BLCOL[k], 'right'));
    if (!TR.bl.length) txt(g, tr(B("Press Run for BL discharge", '点「运行」查看 BL 放电曲线')), (L + W) / 2, (T + bottom) / 2, SC.mu, 'center', '12px "Public Sans","Noto Sans SC"');
  } else if (SCOPE === 'ispp') {
    const h = TR.ispp || [], n = Math.max(12, h.length + 1), Vlo = 13, Vhi = 22, X = i => L + (W - L - Rm) * i / n, Y = v => bottom - (bottom - T) * clamp((v - Vlo) / (Vhi - Vlo));
    axes(g, L, T, W - Rm, bottom); for (let v = 14; v <= 22; v += 2) ytk(g, v, Y(v), L, W - Rm); txt(g, 'Vpgm', 0, T - 4, SC.mu); txt(g, 'loop', W - Rm, H - 0, SC.mu, 'right');
    h.forEach((p, i) => { const x = X(i), w = (W - L - Rm) / n; g.fillStyle = vCss(p.Vpgm); g.fillRect(x + w * .1, Y(p.Vpgm), w * .45, bottom - Y(p.Vpgm)); g.fillStyle = SC.ver; g.fillRect(x + w * .6, Y(Vlo + 1.6), w * .25, bottom - Y(Vlo + 1.6)); });
    const tot = POPS[SEL.wl].length; const Yc = c => bottom - (bottom - T) * clamp(Math.log10(1 + c) / Math.log10(1 + tot));
    g.strokeStyle = SC.tr; g.lineWidth = 1.5; g.beginPath(); h.forEach((p, i) => { const x = X(i + .8); i ? g.lineTo(x, Yc(p.remaining)) : g.moveTo(x, Yc(p.remaining)); }); g.stroke();
    if (h.length) { const p = h[h.length - 1]; txt(g, tr(B(`loop ${p.k + 1} · Vpgm ${p.Vpgm.toFixed(2)} V · pending ${p.remaining}`, `loop ${p.k + 1} · Vpgm ${p.Vpgm.toFixed(2)} V · 未过 ${p.remaining}`)), W - Rm, T + 8, fg, 'right'); }
    swatch(g, [[vCss(18), 'Vpgm'], [SC.ver, 'verify'], [SC.tr, tr(B("Pending", '未通过数')), 'line']], W - Rm, T + 24);
    if (!h.length) txt(g, tr(B("Press Run for ISPP staircase", '点「运行」生成 ISPP 阶梯')), (L + W) / 2, (T + bottom) / 2, SC.mu, 'center', '12px "Public Sans","Noto Sans SC"');
  } else if (SCOPE === 'erase') {
    const tmax = PHY.tpe, X = t => L + (W - L - Rm) * t / tmax, Y = v => bottom - (bottom - T) * clamp((v + 4) / 26);
    axes(g, L, T, W - Rm, bottom); for (let v = 0; v <= 20; v += 5) ytk(g, v, Y(v), L, W - Rm); txt(g, 'V', 0, T - 4, SC.mu); txt(g, 't (ms)', W - Rm, H - 0, SC.mu, 'right');
    TR.erase.forEach((tr, n) => { g.strokeStyle = vCss(tr.V); g.lineWidth = 1.5; g.beginPath(); tr.pts.forEach(([t, v], i) => i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v))); g.stroke(); txt(g, 'Vers ' + tr.V.toFixed(0) + ' V', X(tmax) - 4, Y(tr.V - 1) - 4, vCss(tr.V), 'right'); });
    g.strokeStyle = SC.mu; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(L, Y(EV)); g.lineTo(W - Rm, Y(EV)); g.stroke(); g.setLineDash([]); txt(g, 'EV ' + EV + ' V', L + 4, Y(EV) - 4, SC.mu);
    TR.eraseLoops.forEach((l, i) => { const x = L + 30 + i * 26, y = Y(l.mx); g.fillStyle = l.mx < EV + 0.6 && l.fail / l.n < 5e-4 ? SC.ok : SC.bad; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.fill(); txt(g, 'L' + (i + 1), x, y + 15, fg, 'center'); });
    if (!TR.erase.length) txt(g, tr(B("Press Run to erase", '点「运行」开始擦除')), (L + W) / 2, (T + bottom) / 2, SC.mu, 'center', '12px "Public Sans","Noto Sans SC"');
  }
}
// ---------- tooltip ----------
let TIP = null;
function showTip(info, x, y) { TIP = { info, x, y }; const t = $('tip'); t.style.left = clamp(x + 14, 0, 1440 - 300) + 'px'; t.style.top = clamp(y + 10, 60, 810 - 160) + 'px'; t.style.opacity = 1; updateTip(); }
function updateTip() { if (!TIP) return; const i = TIP.info; const v = i.v ? tr(i.v()) : ''; const h = tr(B(`<h5>${tr(i.name)}</h5><div class="tf">${tr(i.fn)}</div>${v ? `<div class="tv"><span>Current value</span>${v}</div>` : ''}`, `<h5>${tr(i.name)}</h5><div class="tf">${tr(i.fn)}</div>${v ? `<div class="tv"><span>当前值</span>${v}</div>` : ''}`)); if (h !== updateTip.last) { $('tip').innerHTML = h; updateTip.last = h; } }
function hideTip() { TIP = null; $('tip').style.opacity = 0; }
