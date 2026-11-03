/* Mechanism Explainers hub: single page, lessons switch in place inside a glass frame. */
(() => {
  const CASES = [
    { id: 'turbofan', path: 'explainers/turbofan/', poster: 'assets/posters/turbofan.webp', thumb: 'assets/steps/engine-1-sq.webp', steps: 8, min: 15, ready: true,
      en: { t: 'Turbofan engine', s: 'CFM56-7B class · two-spool Brayton cycle', h: 'Follow one parcel of air through fan, compressor, combustor and turbines, then throttle it into surge.' },
      zh: { t: '涡扇发动机', s: 'CFM56-7B 级 · 双转子 Brayton 循环', h: '跟着一团空气穿过风扇、压气机、燃烧室和涡轮，再把油门推到喘振。' } },
    { id: 'llm-compute', path: 'explainers/llm-compute/', poster: 'assets/posters/compute.webp', thumb: 'assets/steps/compute-0-sq.webp', steps: 9, min: 20, ready: true,
      en: { t: 'An LLM token on CPU + GPU', s: 'HBM · SM · Tensor Core · KV cache', h: 'Why decode is memory-bound: weights stream from HBM to the multipliers for every single token.' },
      zh: { t: 'LLM token 在 CPU + GPU 上', s: 'HBM · SM · Tensor Core · KV cache', h: '为什么 decode 受访存限制：每生成一个 token，权重都要从 HBM 流到乘法器。' } },
    { id: 'watch', path: 'explainers/watch-movement/', poster: 'assets/posters/watch.webp', thumb: 'assets/steps/watch-1-sq.webp', steps: 7, min: 15, ready: false,
      en: { t: 'Mechanical watch movement', s: 'ETA 2824 / NH35 class · 28,800 vph', h: 'Barrel, gear train, escapement and balance: how a spring becomes 8 ticks a second for 40 hours.' },
      zh: { t: '机械表机芯', s: 'ETA 2824 / NH35 级 · 每小时 28,800 次', h: '发条盒、轮系、擒纵和摆轮：一根发条怎样变成每秒 8 下、走 40 小时。' } },
    { id: 'ev-motor', path: 'explainers/ev-motor/', poster: 'assets/posters/ev.webp', thumb: 'assets/steps/ev-1-sq.webp', steps: 7, min: 18, ready: false,
      en: { t: 'EV motor + inverter', s: 'IPMSM · hairpin stator · SiC bridge · FOC', h: 'From battery DC to a rotating field: PWM, field-oriented control, torque–speed limits and regen.' },
      zh: { t: '电动车电机 + 逆变器', s: 'IPMSM · 发卡绕组 · SiC 桥 · FOC', h: '从电池直流到旋转磁场：PWM、磁场定向控制、转矩-转速极限和能量回收。' } },
  ];
  const STR = {
    en: { skip: 'Skip to content', brandsub: 'explainers', gh: 'Source & skill', overview: 'Overview', eyebrow: 'Interactive 3D lessons · public sources · EN / 中文',
      h1: 'Take the machine apart. Then run it.', lead: 'Each lesson is a real-device 3D model wired to a simulator. Move a control and the parts, the scope and the numbers change together.',
      m1h: 'Public sources only', m1p: 'Datasheets, papers, textbooks and teardown photos, cited inside every step.',
      m2h: 'Built like the real part', m2p: 'Profiles traced from references, PBR metals, real counts where they are countable.',
      m3h: 'One clock, one state', m3p: 'The 3D scene, the scope and the readouts all read the same simulator.',
      skh: 'Make your own', skp: 'Every lesson here was built with one reusable agent skill. Drop it into Codex or Claude Code and ask “explain how X works”.',
      foot: 'MIT licence · photos credited in the README · no proprietary data', credits: 'Sources & credits', open: 'Full page', loading: 'Loading the 3D scene…',
      steps: 'steps', min: 'min', soon: 'In build', start: 'Open lesson' },
    zh: { skip: '跳到正文', brandsub: '机制讲解', gh: '源码与 skill', overview: '总览', eyebrow: '交互式 3D 课 · 只用公开资料 · EN / 中文',
      h1: '把机器拆开，再让它转起来。', lead: '每一课都是按真实器件做的 3D 模型，接着一个模拟器。动一个控件，零件、示波器和读数一起变。',
      m1h: '只用公开资料', m1p: '数据手册、论文、教科书和拆解照片，每一步里都标了出处。',
      m2h: '照真实零件来做', m2p: '轮廓按参考图描出，PBR 金属材质，能数清的数量就按真实数量。',
      m3h: '一个时钟，一个状态', m3p: '3D 场景、示波器和读数都读同一个模拟器。',
      skh: '自己做一个', skp: '这里每一课都是用同一个可复用的 agent skill 做出来的。放进 Codex 或 Claude Code，然后问“讲讲 X 是怎么工作的”。',
      foot: 'MIT 许可 · 照片出处见 README · 不含任何专有资料', credits: '来源与致谢', open: '整页打开', loading: '正在加载 3D 场景…',
      steps: '步', min: '分钟', soon: '制作中', start: '打开这一课' },
  };
  const $ = s => document.querySelector(s);
  const Q = new URLSearchParams(location.search);
  let LANG = Q.get('lang') === 'zh' || Q.get('lang') === 'en' ? Q.get('lang') : (() => { try { const s = localStorage.getItem('lang'); return s === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; } })();
  let CUR = 'home';
  const FRAMES = new Map(); // id -> iframe (LRU, max 2 alive)
  const byId = id => CASES.find(c => c.id === id);
  const T = k => STR[LANG][k] ?? STR.en[k];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const caseUrl = c => `${c.path}?lang=${LANG}`;

  function renderNav() {
    const item = (c, i) => {
      const L = c[LANG];
      return `<a class="ci${c.id === CUR ? ' on' : ''}${c.ready ? '' : ' off'}" href="?case=${c.id}" data-case="${c.id}" ${c.ready ? '' : 'aria-disabled="true"'} ${c.id === CUR ? 'aria-current="page"' : ''}>
        <span class="th"><img src="${c.thumb}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></span>
        <span class="tx"><b>${esc(L.t)}</b><em>${c.ready ? `${c.steps} ${T('steps')} · ${c.min} ${T('min')}` : T('soon')}</em></span>
        <span class="ix">${String(i + 1).padStart(2, '0')}</span></a>`;
    };
    $('#nav').innerHTML = `<a class="ci ov${CUR === 'home' ? ' on' : ''}" href="./" data-case="home"><span class="tx"><b>${T('overview')}</b></span></a>` + CASES.map(item).join('');
    $('#tabbar').innerHTML = `<a class="tb${CUR === 'home' ? ' on' : ''}" href="./" data-case="home">${T('overview')}</a>` + CASES.map(c => `<a class="tb${c.id === CUR ? ' on' : ''}${c.ready ? '' : ' off'}" href="?case=${c.id}" data-case="${c.id}">${esc(c[LANG].t.replace(/ \+.*| on .*/, ''))}</a>`).join('');
    $('#tiles').innerHTML = CASES.map((c, i) => {
      const L = c[LANG];
      return `<a class="tile glass${c.ready ? '' : ' off'}" href="?case=${c.id}" data-case="${c.id}" ${c.ready ? '' : 'aria-disabled="true"'}>
        <span class="pic"><img src="${c.poster}" alt="${esc(L.t)}" loading="${i < 2 ? 'eager' : 'lazy'}" width="960" height="540" onerror="this.style.visibility='hidden'"></span>
        <span class="body"><span class="row"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="m">${c.ready ? `${c.steps} ${T('steps')} · ${c.min} ${T('min')}` : T('soon')}</span></span>
        <b>${esc(L.t)}</b><em>${esc(L.s)}</em><span class="h">${esc(L.h)}</span>
        ${c.ready ? `<span class="go">${T('start')}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M7 3l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></span>` : ''}</span></a>`;
    }).join('');
  }
  function renderText() {
    document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i]').forEach(e => { e.textContent = T(e.dataset.i); });
    document.querySelectorAll('#lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === LANG));
    renderNav(); renderBar();
  }
  function renderBar() {
    const c = byId(CUR); if (!c) return; const L = c[LANG];
    $('#vt').textContent = L.t; $('#vs').textContent = L.s; $('#vm').textContent = `${c.steps} ${T('steps')} · ${c.min} ${T('min')}`;
    $('#vopen').href = caseUrl(c);
  }
  function setGround(c) {
    const src = c ? c.poster : CASES[0].poster;
    const a = $('.g0'), b = $('.g1'); const [on, off] = a.classList.contains('on') ? [b, a] : [a, b];
    if ((on.dataset.src || '') === src || (off.dataset.src || '') === src && off.classList.contains('on')) return;
    on.dataset.src = src; on.style.backgroundImage = `url("${src}")`; on.classList.add('on'); off.classList.remove('on');
    document.body.dataset.case = c ? c.id : 'home';
  }
  function pushFrameLang(f) {
    try { const d = f.contentDocument; if (!d) return; const b = d.querySelector(`#lang [data-v="${LANG}"], #lang [data-lang="${LANG}"]`); if (b && !b.classList.contains('on') && b.getAttribute('aria-pressed') !== 'true') b.click(); } catch (e) { }
  }
  function frameFor(c) {
    let f = FRAMES.get(c.id);
    if (!f) {
      f = document.createElement('iframe'); f.title = c.en.t; f.src = caseUrl(c); f.dataset.case = c.id; f.setAttribute('allow', 'fullscreen');
      f.addEventListener('load', () => { f.classList.add('ready'); if (CUR === c.id) $('#load').classList.add('gone'); pushFrameLang(f); });
      $('#frame').appendChild(f); FRAMES.set(c.id, f);
      while (FRAMES.size > 2) { const [k, old] = FRAMES.entries().next().value; if (k === c.id) break; old.remove(); FRAMES.delete(k); }
    } else { FRAMES.delete(c.id); FRAMES.set(c.id, f); pushFrameLang(f); }
    return f;
  }
  function go(id, push = true) {
    const c = byId(id); if (id !== 'home' && (!c || !c.ready)) id = 'home';
    CUR = id;
    const u = new URL(location.href); if (id === 'home') u.searchParams.delete('case'); else u.searchParams.set('case', id); u.hash = '';
    if (push) history.pushState({ id }, '', u); else history.replaceState({ id }, '', u);
    $('#home').hidden = id !== 'home'; $('#viewer').hidden = id === 'home';
    document.body.classList.toggle('viewing', id !== 'home');
    if (id !== 'home') {
      const f = frameFor(c);
      FRAMES.forEach((x, k) => x.classList.toggle('cur', k === id));
      $('#load').classList.toggle('gone', f.classList.contains('ready'));
      renderBar(); document.title = `${c[LANG].t} · Mechanism Explainers`;
    } else { document.title = 'Mechanism Explainers · machines you can run'; $('#main').scrollTop = 0; }
    setGround(c); renderNav();
  }
  function setLang(l) {
    if (l === LANG) return; LANG = l; try { localStorage.setItem('lang', l); } catch (e) { }
    const u = new URL(location.href); u.searchParams.set('lang', l); history.replaceState(history.state, '', u);
    renderText(); FRAMES.forEach(pushFrameLang);
    FRAMES.forEach((f, k) => { /* keep the full-page link in step */ });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-case]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); if (a.getAttribute('aria-disabled') === 'true') return; go(a.dataset.case);
  });
  $('#lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.v); });
  // a lesson's own EN/中文 toggle writes localStorage; follow it here (storage event fires across same-origin documents)
  window.addEventListener('storage', e => { if (e.key === 'lang' && (e.newValue === 'en' || e.newValue === 'zh') && e.newValue !== LANG) setLang(e.newValue); });
  window.addEventListener('popstate', () => { const p = new URLSearchParams(location.search); go(p.get('case') || 'home', false); });
  // soft specular highlight that follows the pointer across glass
  document.addEventListener('pointermove', e => { document.documentElement.style.setProperty('--mx', e.clientX + 'px'); document.documentElement.style.setProperty('--my', e.clientY + 'px'); }, { passive: true });
  try { localStorage.setItem('lang', LANG); } catch (e) { }
  const start = Q.get('case') || (location.hash.match(/^#(?:case=)?([\w-]+)$/) || [])[1] || 'home';
  renderText(); go(start, false);
  window.__hub = { cases: CASES.map(c => ({ id: c.id, ready: c.ready })), state: () => ({ cur: CUR, lang: LANG, frames: [...FRAMES.keys()] }), go, setLang };
})();
