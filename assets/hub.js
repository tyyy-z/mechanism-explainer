(function () {
  'use strict';
  var D = window.HUB, doc = document.documentElement;
  doc.classList.add('js');
  var SLUG = { engine: 'turbofan', nand: '3d-nand', compute: 'llm-compute' };
  var M = [
    { k: 'engine', slug: 'turbofan', disc: 'var(--field-1)', poster: 'assets/posters/turbofan.webp', video: 'assets/previews/turbofan-loop.mp4', full: 'assets/previews/turbofan.mp4',
      fact: { en: 'CFM56-7 class · bypass ratio 5.1 · 24 fan blades · 8 steps', zh: 'CFM56-7 级别 · 涵道比 5.1 · 24 片风扇叶片 · 8 步' },
      alt: { en: 'Turbofan lesson: cutaway with air, compressed air and hot gas flowing', zh: '涡扇课：剖面中的冷空气、压缩空气和高温燃气' },
      name: { en: 'turbofan engine', zh: '涡扇发动机' }, level: { en: 'intermediate · 15 min', zh: '中级 · 15 分钟' },
      photo: 'assets/photos/honeywell-htf7000-turbofan-engine-ebace-2023.webp', photoAlt: { en: 'Photo: a sectioned Honeywell HTF7000 turbofan on display', zh: '照片：展出的 Honeywell HTF7000 涡扇剖切模型' } },
    { k: 'nand', slug: '3d-nand', disc: 'var(--field-3)', poster: 'assets/posters/nand.webp', video: 'assets/previews/nand-loop.mp4', full: 'assets/previews/nand.mp4',
      fact: { en: '12 modelled word-line tiers · real parts run 100–300+ · 8 steps', zh: '建模 12 层字线 · 实际器件 100–300+ 层 · 8 步' },
      alt: { en: '3D NAND lesson: word-line stack, bit lines and staircase contacts', zh: '3D NAND 课：字线堆叠、位线和台阶接触' },
      name: { en: '3D NAND flash', zh: '3D NAND 闪存' }, level: { en: 'advanced · 15–20 min', zh: '高级 · 15–20 分钟' },
      photo: 'assets/photos/mf30011r-1702-2-die.webp', photoAlt: { en: 'Photo: a bare memory die under a microscope', zh: '照片：显微镜下的存储器裸片' } },
    { k: 'compute', slug: 'llm-compute', disc: 'var(--field-2)', poster: 'assets/posters/compute.webp', video: 'assets/previews/compute-loop.mp4', full: 'assets/previews/compute.mp4',
      fact: { en: 'one token: CPU core → PCIe → GPU SMs → 4 HBM stacks · 9 steps', zh: '一个 token：CPU 核 → PCIe → GPU SM → 4 个 HBM 堆栈 · 9 步' },
      alt: { en: 'LLM lesson: GPU package with HBM stacks holding weights and KV-cache pages', zh: 'LLM 课：GPU 封装与存放权重和 KV 缓存页的 HBM 堆栈' },
      name: { en: 'LLM on CPU + GPU', zh: 'CPU + GPU 上的 LLM' }, level: { en: 'advanced · 20 min', zh: '高级 · 20 分钟' },
      photo: 'assets/photos/intel-sb80486dx2-50.webp', photoAlt: { en: 'Photo: an opened processor package showing the die', zh: '照片：打开封装后露出裸片的处理器' } }
  ];
  var lang = 'en';
  try {
    var q = location.search.match(/[?&]lang=(en|zh)/);
    lang = q ? q[1] : (localStorage.getItem('mx-lang') || 'en');
    if (lang !== 'zh') lang = 'en';
  } catch (e) { lang = 'en'; }
  var t = function (o) { return o[lang] || o.en; };
  var withLang = function (u) { return lang === 'zh' ? u + (u.indexOf('?') < 0 ? '?' : '&') + 'lang=zh' : u; };
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* scrubber */
  var cur = 'engine', idx = 0, range = $('#scrubRange'), img = $('#scrubImg');
  function drawScrub(fade) {
    var st = D.steps[cur], s = st[idx], m = M.filter(function (x) { return x.k === cur; })[0];
    range.max = st.length - 1; range.value = idx;
    $('#scrubPos').textContent = (idx + 1) + ' / ' + st.length;
    $('#scrubTitle').textContent = lang === 'zh' ? s.zh : s.en;
    $('#scrubSub').textContent = lang === 'zh' ? s.szh : s.sen;
    $('#scrubOpen').href = withLang('explainers/' + m.slug + '/?step=' + idx);
    var src = 'assets/steps/' + cur + '-' + idx + '.webp';
    img.alt = t(m.name) + ', ' + (lang === 'zh' ? '第 ' + (idx + 1) + ' 步：' + s.zh : 'step ' + (idx + 1) + ': ' + s.en);
    if (fade) { img.style.opacity = '0.2'; var n = new Image(); n.onload = function () { img.src = src; img.style.opacity = '1'; }; n.src = src; }
    else img.src = src;
  }
  range.addEventListener('input', function () { idx = +range.value; drawScrub(true); });
  $$('.scrub-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      cur = b.dataset.m; idx = 0;
      $$('.scrub-tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      drawScrub(true);
    });
  });
  // preload thumbs
  Object.keys(D.steps).forEach(function (k) { D.steps[k].forEach(function (_, i) { var p = new Image(); p.src = 'assets/steps/' + k + '-' + i + '.webp'; }); });

  /* showcase */
  var si = 0, vid = $('#showVid'), simg = $('#showImg'), obj = document.querySelector('.obj');
  function drawShow(anim) {
    var m = M[si];
    $$('.show-list button').forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.s === si)); });
    var apply = function () {
      $('#disc').style.background = m.disc;
      $('#showFact').textContent = t(m.fact);
      $('#showOpen').href = withLang('explainers/' + m.slug + '/');
      $('#showWatch').href = m.full;
      vid.poster = m.poster; vid.setAttribute('aria-label', t(m.alt));
      if (vid.dataset.src !== m.video) {
        vid.dataset.src = m.video; vid.querySelector('source').src = m.video; vid.load();
        if (!reduce) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
      }
      obj.classList.remove('swap');
    };
    if (anim) { obj.classList.add('swap'); setTimeout(apply, 300); } else apply();
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('.show-list button').forEach(function (b) {
    b.addEventListener('click', function () { if (+b.dataset.s !== si) { si = +b.dataset.s; drawShow(true); } });
  });
  vid.dataset.src = M[0].video;
  if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); }

  /* menu */
  function drawMenu() {
    var root = $('#menuCats'); root.innerHTML = '';
    M.forEach(function (m) {
      var st = D.steps[m.k], sec = document.createElement('div');
      sec.className = 'cat'; sec.id = 'cat-' + m.k;
      var h = '<div class="cat-head"><div class="cat-pic"><img src="' + m.photo + '" alt="' + t(m.photoAlt) + '" loading="lazy" width="1200" height="1200"></div><div>' +
        '<div class="cat-name"><h3>' + t(m.name) + '</h3><span>' + st.length + (lang === 'zh' ? ' 步' : ' steps') + '</span></div>' +
        '<p class="cat-cap">' + t(m.level) + '</p>' +
        '<div class="cat-acts"><a href="' + withLang('explainers/' + m.slug + '/') + '">' + (lang === 'zh' ? '打开课程' : 'open lesson') + '</a><a href="' + m.full + '">' + (lang === 'zh' ? '看 60 秒' : 'watch 60 s') + '</a></div></div></div><ul class="items">';
      st.forEach(function (s, i) {
        h += '<li class="item rise"><a href="' + withLang('explainers/' + m.slug + '/?step=' + i) + '"><img src="assets/steps/' + m.k + '-' + i + '-sq.webp" alt="" width="128" height="128" loading="lazy"><div><b>' + (lang === 'zh' ? s.zh : s.en) + '</b><span>' + (lang === 'zh' ? s.szh : s.sen) + '</span></div></a></li>';
      });
      sec.innerHTML = h + '</ul>';
      root.appendChild(sec);
    });
    observe();
  }

  /* footer blocks + credits */
  var word = 'mechanism', hs = [100, 74, 88, 62, 96, 70, 84, 58, 92], bl = $('#blocks');
  word.split('').forEach(function (ch, i) { var s = document.createElement('span'); s.textContent = ch; s.style.height = hs[i] + '%'; bl.appendChild(s); });
  function drawCredits() {
    $('#credits').innerHTML = (lang === 'zh' ? '照片：' : 'Photos: ') + D.credits.map(function (c) {
      return '“<a href="' + c.page + '">' + c.title + '</a>” ' + (lang === 'zh' ? '作者 ' : 'by ') + c.creator + ', <a href="' + c.licenseUrl + '">' + c.license + '</a>, via Wikimedia Commons';
    }).join(' · ') + (lang === 'zh' ? '。课程画面为本项目的 3D 渲染。' : '. Lesson images are 3D renders from this project.');
  }

  /* language */
  function setLang(l, save) {
    lang = l; doc.lang = l === 'zh' ? 'zh-CN' : 'en';
    if (save) { try { localStorage.setItem('mx-lang', l); } catch (e) {} }
    $$('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + l) || el.getAttribute('data-en'); });
    $$('[data-lang-link]').forEach(function (a) { var b = a.getAttribute('href').split('?')[0]; a.setAttribute('href', withLang(b)); });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    document.title = l === 'zh' ? '机器原理讲解：在 3D 中把机器拆开看' : 'Mechanism explainers: machines, taken apart in 3D';
    drawScrub(false); drawShow(false); drawMenu(); drawCredits();
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang, true); }); });

  /* entrances */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function observe() { $$('.rise:not(.in)').forEach(function (el) { if (io && !reduce) io.observe(el); else el.classList.add('in'); }); }
  $$('.show-list, .clause, .cta-text, .menu>h2').forEach(function (el) { el.classList.add('rise'); });

  setLang(lang, false);
  requestAnimationFrame(function () { setTimeout(function () { $('#shut').classList.add('open'); }, 120); });
  window.__hubReady = true;
})();
