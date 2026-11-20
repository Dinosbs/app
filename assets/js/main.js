/* =====================================================================
   app.vorteile.net – Interaktionen (Vanilla JS, keine Abhängigkeiten)
   Die Store-Weiche selbst steckt inline im <head> (window.VN).
   ===================================================================== */
(function () {
  'use strict';

  var VN = window.VN || { os: 'desktop', url: function (t) { return t === 'ios' ? 'https://apps.apple.com/de/app/vorteile-net/id6807748597' : 'https://play.google.com/store/apps/details?id=net.vorteile&hl=de'; } };
  var html = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = VN.os === 'ios' || VN.os === 'android';
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  // Position im Layout – unabhängig von Animationen/Transforms (getBoundingClientRect enthält diese)
  var offsetWithin = function (el, stop) {
    var x = 0, y = 0;
    while (el && el !== stop) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y };
  };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------------------------------------------------------------- Store-Links mit Tracking */
  $$('[data-store]').forEach(function (a) {
    var target = a.getAttribute('data-store');
    var medium = a.getAttribute('data-medium') || 'landingpage';
    if (target === 'auto') {
      if (isMobile) a.href = VN.url(VN.os, medium);
      else a.addEventListener('click', function (e) { e.preventDefault(); openApp(); });
    } else {
      a.href = VN.url(target, medium);
    }
  });

  /* ---------------------------------------------------------------- Weiterleitung: Fallback */
  // Die Weiche im <head> ruft das auf, sobald klar ist, dass man auf der Seite bleibt.
  VN.ready = true;
  VN.onRedirectEnd = function (animated) {
    if (animated && !reduce) {
      html.classList.add('is-redirect-leaving');
      setTimeout(function () { html.classList.remove('is-redirect-leaving'); }, 700);
    }
    html.classList.remove('is-redirecting');
    intro();
    onScroll();
  };
  var stayBtn = $('[data-stay]');
  if (stayBtn) stayBtn.addEventListener('click', function () { if (VN.cancelRedirect) VN.cancelRedirect(); });

  /* ---------------------------------------------------------------- Intro */
  var introDone = false;
  function intro() {
    if (introDone || html.classList.contains('is-redirecting')) return;
    introDone = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('is-ready'); }); });
  }
  intro();

  /* ---------------------------------------------------------------- Kopfzeile, Fortschritt, Sticky */
  var nav = $('[data-nav]');
  var bar = $('.progress');
  var sticky = $('[data-sticky]');
  var heroPanel = $('.hero__panel');
  var lastY = window.scrollY;
  var navLinks = $$('.nav__links a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });

  var barFill = bar ? bar.firstElementChild : null;
  var stickyBtn = sticky ? sticky.querySelector('a') : null;
  var stickyOn = null, lastBar = -1, current = -2;
  var qrFloat = $('[data-qr-float]'), qrOn = null, qrClosed = false;
  try { qrClosed = sessionStorage.getItem('vn-qr-closed') === '1'; } catch (e) {}
  if (qrFloat) {
    $('[data-qr-close]', qrFloat).addEventListener('click', function () {
      qrClosed = true; qrOn = false;
      qrFloat.classList.remove('is-on'); qrFloat.setAttribute('aria-hidden', 'true');
      try { sessionStorage.setItem('vn-qr-closed', '1'); } catch (e) {}
    });
  }
  // Seitengeometrie einmal messen und zwischenspeichern (bei Größenänderungen neu)
  var geo = { docH: 0, vh: 0, storyBottom: 0, dlTop: 0, dlBottom: 0, secTops: [] };
  var absTop = function (el) { return el ? el.getBoundingClientRect().top + window.scrollY : 0; };
  function measureUi() {
    geo.vh = window.innerHeight;
    geo.docH = document.documentElement.scrollHeight;
    var st = document.querySelector('[data-story]');
    geo.storyBottom = st ? absTop(st) + st.offsetHeight : absTop(heroPanel) + heroPanel.offsetHeight;
    var dl = document.getElementById('download');
    geo.dlTop = absTop(dl); geo.dlBottom = geo.dlTop + (dl ? dl.offsetHeight : 0);
    var wc = document.querySelector('.win__cta');
    geo.wcTop = absTop(wc); geo.wcBottom = geo.wcTop + (wc ? wc.offsetHeight : 0);
    geo.secTops = sections.map(function (s) { return s ? absTop(s) : Infinity; });
    var car = document.querySelector('[data-car]');
    geo.carBottom = car ? absTop(car) + car.offsetHeight : geo.storyBottom;
  }

  function ctaVisibleAll(y, vh) {
    return (geo.dlTop - y < vh && geo.dlBottom - y > 0) || (geo.wcTop - y < vh - 40 && geo.wcBottom - y > 60);
  }
  function onScrollUi() {
    var y = window.scrollY, vh = geo.vh;
    var h = geo.docH - vh;
    var pr = h > 0 ? Math.round((y / h) * 1000) / 1000 : 0;
    if (barFill && pr !== lastBar) { lastBar = pr; barFill.style.transform = 'scaleX(' + pr + ')'; }
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 600 && !document.querySelector('dialog[open]'));
    if (sticky) {
      var ctaVisible = ctaVisibleAll(y, vh);
      var on = geo.storyBottom - y < vh * 0.6 && !ctaVisible && (vh + y < geo.docH - 40) && !html.classList.contains('is-redirecting');
      if (on !== stickyOn) {
        stickyOn = on;
        sticky.classList.toggle('is-on', on);
        sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (stickyBtn) stickyBtn.tabIndex = on ? 0 : -1;
      }
    }
    if (qrFloat && !qrClosed) {
      // ab dem Gewinnspiel (nach dem Auto), nicht doppelt neben anderen QR-Codes und nicht über der Fußzeile
      var qo = geo.carBottom - y < vh * 0.55 && !ctaVisibleAll(y, vh) && (vh + y < geo.docH - 220);
      if (qo !== qrOn) {
        qrOn = qo;
        qrFloat.classList.toggle('is-on', qo);
        qrFloat.setAttribute('aria-hidden', qo ? 'false' : 'true');
        $('[data-qr-close]', qrFloat).tabIndex = qo ? 0 : -1;
      }
    }
    var mid = y + vh * 0.35, cur = -1;
    geo.secTops.forEach(function (t, i) { if (t < mid) cur = i; });
    if (cur !== current) { current = cur; navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === cur); }); }
    lastY = y;
  }

  /* ---------------------------------------------------------------- Einblenden beim Scrollen */
  var revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  // Geschwister bekommen automatisch eine kleine Verzögerung
  $$('[data-reveal]').forEach(function (el) {
    var sib = $$(':scope > [data-reveal]', el.parentElement);
    var i = sib.indexOf(el);
    if (i > 0 && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
    if (revealIO) revealIO.observe(el); else el.classList.add('is-in');
  });

  /* ---------------------------------------------------------------- Zahlen hochzählen */
  function countUp(els) {
    els.forEach(function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      var to = +el.dataset.count, suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = to + suffix; return; }
      var t0 = null, dur = 1600;
      (function step(t) {
        if (!t0) t0 = t;
        var p = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.round(easeOut(p) * to) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
      el.textContent = '0';
    });
  }
  if (revealIO) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp([en.target]); countIO.unobserve(en.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { if (!el.closest('[data-chapter-text]')) countIO.observe(el); });
  }

  /* ---------------------------------------------------------------- App-Story: das Smartphone wandert mit */
  // Jedes Kapitel hat einen Ankerpunkt (Kapitelmitte = Bildschirmmitte). Zwischen zwei Ankern fährt das Handy
  // mit einer Drehung auf die andere Seite und wechselt dabei den Screen. Im Kapitel scrollt der Screen mit.
  var story = $('[data-story]');
  var device = $('[data-device]');
  var stage = $('.story__stage');
  var chapters = $$('[data-chapter]', story);
  var texts = chapters.map(function (c) { return $('[data-chapter-text]', c); });
  var heroCopy = $('[data-hero-copy]');
  var statusbar = $('[data-statusbar]');
  var tabbar = $('[data-tabbar]');
  var tabs = $$('[data-tab]', tabbar);
  var screens = {};
  $$('[data-screen]').forEach(function (s) { screens[s.dataset.screen] = s; });
  // Zwei App-Kapitel mit je zwei Screens: 1 = Start -> Kategorien, 2 = Shop -> Sperrbildschirm (Push)
  function screenFor(c, y) {
    if (c === 0) return 'start';
    var q = chapterProgress(c, y);
    return q < PHASE_SPLIT[c] ? (c === 1 ? 'start' : 'shop') : (c === 1 ? 'cats' : 'lock');
  }
  var SCREEN_TAB = { start: 'start', cats: 'cats', shop: 'cats' };
  var hearts = $$('[data-hearts] .app-heart');
  var searchField = $('[data-search]'), searchTop = null;
  var stickySearch = $('[data-sticky-search]');
  var catTiles = $$('[data-cats] img');
  var detail = $('[data-detail]');
  var buyBtn = $('[data-buy]');
  var cartBadge = $('[data-cart]');
  var notes = $$('[data-notes] .note');
  var anchors = [], kf = [], tops = [], heights = [], scrollMax = {}, vh = 0, vw = 0, small = false, navH = 66, sMid = 0.7;
  var halo = $('.story__halo');
  var glare = $('.phone__glare');
  var scrollers = {};
  Object.keys(screens).forEach(function (k) { scrollers[k] = $('[data-scroll]', screens[k]); });
  var lastSet = new WeakMap();
  // Stil nur schreiben, wenn sich der Wert wirklich ändert
  var put = function (el, prop, val) {
    if (!el) return;
    var m = lastSet.get(el); if (!m) { m = {}; lastSet.set(el, m); }
    if (m[prop] === val) return;
    m[prop] = val; el.style[prop] = val;
  };
  var pops = $$('[data-pop]'), textBottoms = [], heroCopyBottom = 0;
  var currentScreen = 'splash', splashDone = false, counted = false;

  function measure() {
    vh = window.innerHeight; vw = window.innerWidth;
    small = vw < 820 && (vh >= 500 || vh >= vw);   // Hochformat; Handys quer bekommen das Desktop-Layout
    var sy = window.scrollY;
    tops = chapters.map(function (c) { return c.getBoundingClientRect().top + sy; });
    heights = chapters.map(function (c) { return c.offsetHeight; });
    anchors = chapters.map(function (c, i) { return i === 0 ? 0 : tops[i] + (heights[i] - vh) / 2; });

    var H = 620, W = 300;
    var rest = small ? Math.min(0.66, (vh * 0.5) / H, (vw * 0.62) / W) : Math.min(1.02, (vh - 150) / H);
    var restY = small ? vh / 2 - (H * rest) / 2 - 18 : 0;
    var X = small ? 0 : Math.min(vw * 0.23, 330);
    var ry = small ? 0 : 13;
    // Hero: groß, mittig, oben angeschnitten unter dem Text
    var heroScale = small ? Math.min(1, (vw * 0.8) / W) : Math.min(1.32, (vh * 0.95) / H);
    var copyBottom = heroCopy ? offsetWithin(heroCopy, null).y + heroCopy.offsetHeight : vh * 0.45;
    var phoneTop = copyBottom + (small ? 26 : 34);
    var heroY = phoneTop + (H * heroScale) / 2 - vh / 2;
    heroCopyBottom = copyBottom;
    kf = [
      { x: 0, y: heroY, s: heroScale, ry: 0 },
      { x: X, y: restY, s: rest, ry: -ry },
      { x: -X, y: restY, s: rest, ry: ry },
      { x: X, y: restY, s: rest, ry: -ry },
      { x: -X, y: restY, s: rest, ry: ry }
    ];
    if (small) {
      // Mobil: Text klebt oben, das Handy nutzt den Platz bis zum unteren Rand so gut wie möglich
      navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 66;
      // während des Wechsels (Text ausgeblendet) wird das Handy mittig größer gezeigt
      sMid = Math.min(0.78, (vh - navH - 48) / H, (vw * 0.7) / W);
      for (var k = 1; k < kf.length; k++) {
        var textBottom = navH + 4 + (texts[k] ? texts[k].offsetHeight : 200) - 14;
        textBottoms[k] = textBottom;
        var avail = vh - textBottom - 18;
        var sk = clamp(avail / H, 0.42, Math.min(0.82, (vw * 0.74) / W));
        kf[k].s = sk;
        kf[k].y = textBottom + 6 + (H * sk) / 2 - vh / 2;
      }
    }
    placePops();
    Object.keys(screens).forEach(function (k) {
      var sc = scrollers[k];
      scrollMax[k] = sc ? Math.max(0, sc.offsetHeight - screens[k].clientHeight) : 0;
    });
  }

  var smooth = function (t) { return t * t * (3 - 2 * t); };
  // Anteil eines Abschnitts zwischen zwei Ankern, in dem das Handy stillsteht (vorne und hinten)
  var holdFor = function (gap) { return clamp(0.5 - (vh * 0.36) / Math.max(gap, 1), 0.12, 0.4); };
  var PHASE_SPLIT = { 1: 0.5, 2: 0.6 };   // ab hier zeigt das Kapitel den zweiten Screen
  var inOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  function setScreen(name) {
    if (name === currentScreen) return;
    if (screens[currentScreen]) screens[currentScreen].classList.remove('is-active');
    screens[name].classList.add('is-active');
    currentScreen = name;
    statusbar.classList.toggle('is-light', name === 'lock' || name === 'splash');
    tabbar.classList.toggle('is-hidden', name === 'lock' || name === 'splash');
    tabs.forEach(function (t) { t.classList.toggle('on', t.dataset.tab === SCREEN_TAB[name]); });
  }

  // Fortschritt 0..1 innerhalb eines Kapitels (0 = Kapitelanfang in Bildschirmmitte, 1 = Kapitelende in Bildschirmmitte)
  function chapterProgress(i, y) {
    return clamp((y - (tops[i] - vh * 0.5)) / heights[i], 0, 1);
  }

  var storyIdle = false;
  function onScrollStory() {
    if (!device || !anchors.length) return;
    var y = window.scrollY;
    var n = anchors.length;
    var beyond = y > tops[n - 1] + heights[n - 1] + vh * 0.5;
    if (beyond && storyIdle) return;
    storyIdle = beyond;

    // Segment zwischen zwei Ankern
    var i = 0;
    while (i < n - 2 && y > anchors[i + 1]) i++;
    var u = clamp((y - anchors[i]) / (anchors[i + 1] - anchors[i]), 0, 1);
    var hold = holdFor(anchors[i + 1] - anchors[i]);
    var e = reduce ? (u > 0.5 ? 1 : 0) : inOut(clamp((u - hold) / (1 - 2 * hold), 0, 1));
    var a = kf[i], b = kf[i + 1];
    var x = lerp(a.x, b.x, e), yy = lerp(a.y, b.y, e), s = lerp(a.s, b.s, e), ry = lerp(a.ry, b.ry, e), rz = 0;
    if (!reduce) {
      var dir = (b.x - a.x) === 0 ? 1 : Math.sign(b.x - a.x);
      var spin = Math.sin(Math.PI * e);
      ry += dir * spin * (small ? 24 : 34);
      rz = -dir * spin * 4;
      if (small) {
        // mobil: beim Drehen in die freie Bildschirmmitte steigen und etwas größer werden
        yy = lerp(yy, navH / 2, spin);
        s = lerp(s, Math.max(s, sMid), spin);
      } else yy -= spin * 24;
    }
    put(device, 'transform', 'translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ') rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)');
    // während der Bewegung als eigene GPU-Ebene, in Ruhe wieder gestochen scharf
    device.classList.toggle('is-moving', !reduce && e > 0.002 && e < 0.998);
    put(glare, 'backgroundPosition', (50 + ry * 2.2).toFixed(0) + '% 0');
    put(halo, 'transform', 'translate3d(' + x.toFixed(0) + 'px,' + yy.toFixed(0) + 'px,0) scale(' + s.toFixed(3) + ')');
    put(halo, 'opacity', clamp((y - vh * 0.25) / (vh * 0.4), 0, 1).toFixed(2));

    // Screen wechseln, sobald die Drehung den halben Weg hat
    var idx = e > 0.5 ? i + 1 : i;
    if (y > anchors[n - 1]) idx = n - 1;
    if (splashDone || idx > 0) { splashDone = true; setScreen(screenFor(idx, y)); }

    // Hero-Text blendet aus
    if (heroCopy) {
      var ho = clamp(1 - y / (vh * 0.42), 0, 1);
      put(heroCopy, 'opacity', ho.toFixed(3));
      put(heroCopy, 'transform', 'translate3d(0,' + (-Math.min(y, vh) * 0.25).toFixed(1) + 'px,0)');
    }

    // Kapiteltexte ein-/ausblenden
    for (var c = 1; c < n; c++) {
      var q = chapterProgress(c, y);
      // mobil liegen Text und Handy übereinander: Text erst zeigen, wenn das Handy steht
      var o = small
        ? smooth(clamp((q - 0.2) / 0.12, 0, 1)) * (1 - smooth(clamp((q - 0.7) / 0.1, 0, 1)))
        : smooth(clamp((q - 0.1) / 0.16, 0, 1)) * (1 - smooth(clamp((q - 0.8) / 0.14, 0, 1)));
      var t = texts[c];
      put(t, 'opacity', o.toFixed(3));
      put(t, 'visibility', o > 0 ? 'visible' : 'hidden');
      if (!reduce) put(t, 'transform', 'translate3d(0,' + ((q < 0.5 ? 1 : -1) * (1 - o) * 40).toFixed(1) + 'px,0)');
      if (c === 1 && o > 0.6 && !counted) { counted = true; countUp($$('[data-count]', t)); }
    }

    // Inhalte im Handy folgen dem Scrollen
    var c1 = chapterProgress(1, y), c2 = chapterProgress(2, y);
    var q1 = clamp((c1 - 0.1) / 0.38, 0, 1);          // Start-Screen scrollt in der ersten Hälfte
    scrollScreen('start', q1);
    // Suchleiste dockt oben an, sobald sie unter die Statusleiste scrollen würde
    if (searchField && stickySearch) {
      if (searchTop == null) searchTop = searchField.offsetTop;
      stickySearch.classList.toggle('is-on', searchTop - scrollMax.start * (reduce ? 0 : q1) <= 54);
    }
    hearts.forEach(function (h, k) { if (k % 3 !== 1) h.classList.toggle('on', q1 > (k + 0.5) / (hearts.length + 1)); });

    var q2 = clamp((c1 - 0.52) / 0.36, 0, 1);         // dann die Kategorien
    scrollScreen('cats', q2);
    var hot = q2 > 0.04 && q2 < 0.98 ? Math.min(catTiles.length - 1, Math.floor(q2 * catTiles.length)) : -1;
    catTiles.forEach(function (img, k) { img.classList.toggle('is-hot', k === hot); });

    var q3 = clamp((c2 - 0.08) / 0.5, 0, 1);          // Shop: Liste, Produktdetail, in den Warenkorb
    scrollScreen('shop', clamp(q3 / 0.45, 0, 1));
    detail.classList.toggle('is-open', q3 > 0.5);
    var bought = q3 > 0.8;
    buyBtn.classList.toggle('is-pressed', q3 > 0.74 && q3 < 0.86);
    var count = bought ? '2' : '1';
    if (cartBadge.textContent !== count) {
      cartBadge.textContent = count;
      cartBadge.classList.remove('bump'); void cartBadge.offsetWidth; cartBadge.classList.add('bump');
    }

    updatePops(y);

    var q4 = clamp((c2 - 0.62) / 0.26, 0, 1);         // danach Push-Mitteilungen auf dem Sperrbildschirm
    notes.forEach(function (nt, k) {
      // die älteste Mitteilung kommt zuerst, neue schieben sich oben drüber
      var order = notes.length - 1 - k;
      nt.classList.toggle('is-in', q4 > 0.04 + order * (0.9 / notes.length));
    });
  }

  /* ---------------------------------------------------------------- Pop-outs */
  // Jedes Element startet im Screen des Handys und landet federnd daneben – auf der Seite des Textes (in)
  // oder außen (out). Positionen werden aus der Ruheposition des Handys im jeweiligen Kapitel berechnet.
  function placePops() {
    var perChapter = {};
    pops.forEach(function (el) {
      var c = +el.dataset.pop, k = kf[c];
      if (!k) return;
      // nur auf großen Bildschirmen (QR-Code, doppelte Mitteilung) – oder per CSS ausgeblendet (QR auf Handys)
      var deskOnly = small && el.hasAttribute('data-desk');
      el.classList.toggle('is-off', deskOnly);
      if (deskOnly || getComputedStyle(el).display === 'none') return;
      var key = c + (el.dataset.phase || '');
      var n = perChapter[key] = (perChapter[key] || 0) + 1;
      var ps = small ? clamp(vw / 560, 0.62, 0.74) : Math.min(1, Math.max(0.85, k.s));
      var w = el.offsetWidth, h = el.offsetHeight;
      var hw = 150 * k.s, hh = 310 * k.s;
      var side = el.dataset.side, sign;
      if (side === 'left') sign = -1;
      else if (side === 'right') sign = 1;
      else {
        var dir = k.x === 0 ? 1 : Math.sign(k.x);
        sign = side === 'in' ? -dir : dir;
        if (small) sign = side === 'in' ? -1 : 1;
      }
      var ov = (+el.dataset.ov || 0) * (small ? 1.3 : 0.75);
      // Hero am Desktop: bei wenig Platz neben dem Handy die Karten etwas verkleinern statt das Handy zu verdecken
      if (c === 0 && !small) ps = Math.min(ps, Math.max(0.72, (vw / 2 - hw + ov - 14) / w));
      var tx = k.x + sign * (hw + (w * ps) / 2 - ov);
      var dy = small && el.dataset.mdy ? +el.dataset.mdy : (+el.dataset.dy || 0);   // mobil eigene Höhe möglich
      var ty = (el.dataset.ay === 'top' ? k.y - hh : k.y) + dy * k.s * (small ? 1.15 : 1);
      var maxX = vw / 2 - (w * ps) / 2 - 10;
      tx = clamp(tx, -maxX, maxX);
      var minY = -vh / 2 + (h * ps) / 2 + (vh < 500 ? 58 : 10), maxY = vh / 2 - (h * ps) / 2 - 10;   // flach: unter der Kopfzeile bleiben
      if (small && c > 0 && textBottoms[c]) minY = Math.max(minY, textBottoms[c] - vh / 2 + (h * ps) / 2 + 4);
      ty = clamp(ty, minY, maxY);
      if (small && el.dataset.mpos === 'bottom') {
        ps = Math.min(1, (vw - 32) / w);
        tx = 0; ty = vh / 2 - (h * ps) / 2 - 22;
      }
      // mobil reichen zwei Elemente je Kapitel
      var off = small && n > 2;
      if (!small && c > 0 && texts[c]) {
        // nicht in den Text ragen
        var tr = texts[c].getBoundingClientRect();
        if (k.x > 0 && sign < 0) tx = Math.max(tx, tr.right - vw / 2 + 18 + (w * ps) / 2);
        if (k.x < 0 && sign > 0) tx = Math.min(tx, tr.left - vw / 2 - 18 - (w * ps) / 2);
        if (Math.abs(tx - k.x) < hw * 0.55) off = true;
      }
      // Hero: nie über Überschrift, Text oder Store-Buttons legen (z. B. Handy quer)
      if (c === 0 && vh / 2 + ty - (h * ps) / 2 < heroCopyBottom + 6) off = true;
      el.classList.toggle('is-off', off);
      el.style.setProperty('--tx', tx.toFixed(1) + 'px');
      el.style.setProperty('--ty', ty.toFixed(1) + 'px');
      el.style.setProperty('--ox', (k.x + sign * hw * 0.2).toFixed(1) + 'px');
      el.style.setProperty('--oy', clamp(ty, k.y - hh * 0.6, k.y + hh * 0.6).toFixed(1) + 'px');
      el.style.setProperty('--ps', ps.toFixed(3));
      el.style.setProperty('--r', (+el.dataset.r || 0) + 'deg');
      el.style.setProperty('--d', ((n - 1) * 0.14).toFixed(2) + 's');
      el.style.setProperty('--fd', (-n * 1.7).toFixed(1) + 's');
    });
  }

  // Welches Kapitel „steht“ gerade (Handy in Ruhe)? Dessen Elemente hüpfen heraus.
  function updatePops(y) {
    var n = anchors.length, rest = -1;
    for (var r = 0; r < n; r++) {
      var before = r > 0 ? anchors[r] - anchors[r - 1] : 0;
      var after = r < n - 1 ? anchors[r + 1] - anchors[r] : 0;
      if (y >= anchors[r] - before * holdFor(before || 1) && y <= anchors[r] + after * holdFor(after || 1)) rest = r;
    }
    var storyEnd = tops[n - 1] + heights[n - 1];
    if (y > anchors[n - 1]) rest = y < storyEnd - vh * 0.75 ? n - 1 : -1;
    var ready = html.classList.contains('is-ready');
    var phase = rest > 0 ? (chapterProgress(rest, y) < (PHASE_SPLIT[rest] || 1) ? 'a' : 'b') : '';
    pops.forEach(function (el) {
      var c = +el.dataset.pop;
      var out = c === rest && (!el.dataset.phase || el.dataset.phase === phase) &&
                (c !== 0 || splashDone || (ready && el.hasAttribute('data-early')));
      el.classList.toggle('is-out', out);
    });
  }

  function scrollScreen(name, q) {
    put(scrollers[name], 'transform', 'translate3d(0,' + (-scrollMax[name] * (reduce ? 0 : q)).toFixed(1) + 'px,0)');
  }

  // Startbildschirm: kurzes Logo-Intro, dann Start
  function endSplash() {
    if (splashDone) return;
    splashDone = true;
    onScrollStory();
  }
  if (story) {
    statusbar.classList.add('is-light');
    tabbar.classList.add('is-hidden');
    measure();
    // Bilder für Handy-Screens und Pop-outs erst nach dem Seitenaufbau laden (nicht im ersten Bild sichtbar)
    var loadDeferred = function () {
      $$('img[data-src]').forEach(function (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); });
    };
    window.addEventListener('load', function () {
      (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(loadDeferred, { timeout: 1200 });
    });
    var splashWait = function () {
      setTimeout(endSplash, reduce ? 0 : 2300);
      setTimeout(function () { updatePops(window.scrollY); }, reduce ? 0 : 900);
    };
    if (html.classList.contains('is-ready')) splashWait();
    else {
      var mo = new MutationObserver(function () { if (html.classList.contains('is-ready')) { mo.disconnect(); splashWait(); } });
      mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ---------------------------------------------------------------- Zeiger-Lichtschein auf Karten */
  if (finePointer) {
    var glowEv = null;
    document.addEventListener('pointermove', function (e) {
      if (!glowEv) requestAnimationFrame(function () {
        var ev = glowEv; glowEv = null;
        var g = ev.target.closest && ev.target.closest('.glow');
        if (!g) return;
        var r = g.getBoundingClientRect();
        g.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        g.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
      glowEv = e;
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- Gewinnspiel: Auto, Schriftzug, Schritte */
  var winPanel = $('[data-spot]');
  var car = $('[data-car]');
  var ghost = $('[data-ghost]');
  var steps = $('[data-steps]');
  var stepEls = $$('[data-step]');
  var done = $('[data-done]');
  var celebrated = false;

  if (winPanel && finePointer && !reduce) {
    winPanel.addEventListener('pointermove', function (e) {
      var r = winPanel.getBoundingClientRect();
      winPanel.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      winPanel.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  var wg = { carTop: 0, panelTop: 0, panelH: 0, stepsTop: 0, stepsH: 0 };
  var railFill = $('.steps__rail i');
  function measureWin() {
    if (!winPanel) return;
    wg.panelTop = winPanel.getBoundingClientRect().top + window.scrollY;
    wg.panelH = winPanel.offsetHeight;
    wg.carTop = car ? wg.panelTop + car.offsetTop : 0;
    wg.stepsTop = steps ? steps.getBoundingClientRect().top + window.scrollY : 0;
    wg.stepsH = steps ? steps.offsetHeight : 0;
  }
  function onScrollWin() {
    if (!winPanel) return;
    var vh = geo.vh || window.innerHeight, y = window.scrollY;
    // nur rechnen, wenn das Gewinnspiel in der Nähe ist
    if (y + vh < wg.panelTop - 100 || y > wg.panelTop + wg.panelH + 100) return;
    if (car && !reduce) {
      var p = clamp((vh - (wg.carTop - y)) / (vh * 0.85), 0, 1);
      var e = easeOut(p);
      put(car, 'transform', 'translate3d(' + ((1 - e) * 42).toFixed(2) + 'vw,0,0) scale(' + (0.86 + e * 0.14).toFixed(3) + ')');
      put(car, 'opacity', clamp(p * 1.6, 0, 1).toFixed(3));
    }
    if (ghost && !reduce) {
      var gp = clamp((vh - (wg.panelTop - y)) / (vh + wg.panelH), 0, 1);
      put(ghost, 'transform', 'translate3d(calc(-50% + ' + ((0.5 - gp) * 40).toFixed(2) + 'vw),0,0)');
    }
    if (steps) {
      var top = wg.stepsTop - y;
      var sp = clamp((vh * 0.82 - top) / (wg.stepsH * 0.85), 0, 1);
      if (reduce) sp = top < vh * 0.8 ? 1 : 0;
      var on0 = 0.35 / (stepEls.length + 0.6), onN = (stepEls.length - 1 + 0.35) / (stepEls.length + 0.6);
      var rp = clamp((sp - on0) / (onN - on0), 0, 1).toFixed(3);
      put(railFill, 'transform', (rail && rail.classList.contains('is-vertical') ? 'scaleY(' : 'scaleX(') + rp + ')');
      stepEls.forEach(function (s, i) { s.classList.toggle('is-on', sp > (i + 0.35) / (stepEls.length + 0.6)); });
      var fin = sp > 0.93;
      done.classList.toggle('is-on', fin);
      if (fin && !celebrated) { celebrated = true; confetti(done); }
    }
  }

  // Verbindungslinie exakt durch die Mittelpunkte der Symbole legen (waagrecht oder – mobil – senkrecht)
  var rail = $('.steps__rail');
  function placeRail() {
    if (!rail || !stepEls.length) return;
    var icons = $$('.step__icon', steps);
    var first = icons[0], last = icons[icons.length - 1];
    var a = offsetWithin(first, steps), b = offsetWithin(last, steps);
    var w = first.offsetWidth, h = first.offsetHeight;
    var vertical = Math.abs(a.x - b.x) < 10;
    rail.classList.toggle('is-vertical', vertical);
    if (vertical) {
      rail.style.cssText = 'left:' + (a.x + w / 2 - 1) + 'px;top:' + (a.y + h / 2) + 'px;width:2px;height:' + (b.y - a.y) + 'px';
    } else {
      rail.style.cssText = 'left:' + (a.x + w / 2) + 'px;top:' + (a.y + h / 2 - 1) + 'px;height:2px;width:' + (b.x - a.x) + 'px';
    }
  }
  placeRail();

  /* ---------------------------------------------------------------- Konfetti */
  var canvas = $('[data-confetti]');
  function confetti(origin) {
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.display = 'block';
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // immer die ganze Leinwand löschen (auch wenn sich die Fenstergröße inzwischen geändert hat)
    var wipe = function () { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore(); };
    var r = origin.getBoundingClientRect();
    var ox = r.left + 40, oy = r.top + r.height / 2;
    var colors = ['#009cb9', '#1c87b8', '#5fd3e4', '#b3e1ea', '#ffffff', '#7ff0c4'];
    var parts = [];
    for (var i = 0; i < 110; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      var v = 6 + Math.random() * 9;
      parts.push({ x: ox + Math.random() * (r.width - 80), y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length], life: 1 });
    }
    var t0 = performance.now();
    (function frame(t) {
      var el = (t - t0) / 1000;
      wipe();
      parts.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        p.life = clamp(1.9 - el, 0, 1);
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2))); ctx.restore();
      });
      if (el < 2) requestAnimationFrame(frame);
      else { wipe(); canvas.width = canvas.height = 0; canvas.style.display = 'none'; }   // Leinwand freigeben
    })(t0);
  }

  /* ---------------------------------------------------------------- Countdown (optional) */
  var win = $('#gewinnspiel');
  var endAttr = win && win.getAttribute('data-ende');
  var cd = $('[data-countdown]');
  if (endAttr && cd) {
    var end = new Date(endAttr).getTime();
    if (!isNaN(end) && end > Date.now()) {
      cd.hidden = false;
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var tick = function () {
        var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
        $('[data-cd="d"]', cd).textContent = pad(Math.floor(s / 86400));
        $('[data-cd="h"]', cd).textContent = pad(Math.floor(s % 86400 / 3600));
        $('[data-cd="m"]', cd).textContent = pad(Math.floor(s % 3600 / 60));
        $('[data-cd="s"]', cd).textContent = pad(s % 60);
        if (!s) clearInterval(iv);
      };
      var iv = setInterval(tick, 1000); tick();
    }
  }

  /* ---------------------------------------------------------------- Deals: Filter (FLIP) + mehr laden */
  var grid = $('[data-deals]');
  var dealEls = $$('.deal', grid);
  var filters = $$('[data-filter]');
  var moreBtn = $('[data-more]');
  var moreApp = $('[data-more-app]');
  var state = { filter: 'alle', limit: 9 };

  function matches(el) { return state.filter === 'alle' || (' ' + el.dataset.kat + ' ').indexOf(' ' + state.filter + ' ') > -1; }

  function renderDeals(animate) {
    var first = new Map();
    if (animate && !reduce) dealEls.forEach(function (el) { if (!el.hidden) first.set(el, el.getBoundingClientRect()); });
    var shown = 0, total = 0;
    dealEls.forEach(function (el) {
      var ok = matches(el);
      if (ok) total++;
      var vis = ok && shown < state.limit;
      if (vis) shown++;
      el.hidden = !vis;
    });
    var all = shown >= total;
    if (moreBtn) moreBtn.hidden = all;
    if (moreApp) moreApp.hidden = !all;
    if (!animate || reduce) return;
    var n = 0;
    dealEls.forEach(function (el) {
      if (el.hidden) { el.classList.remove('is-entering'); return; }
      var a = first.get(el);
      if (a) {
        var b = el.getBoundingClientRect();
        var dx = a.left - b.left, dy = a.top - b.top;
        if (dx || dy) {
          el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
      } else {
        el.classList.remove('is-entering'); void el.offsetWidth;
        el.style.setProperty('--d', (n++ * 0.06) + 's');
        el.classList.add('is-entering');
      }
    });
  }
  if (grid) {
    renderDeals(false);
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('is-active')) return;
        filters.forEach(function (f) { var on = f === b; f.classList.toggle('is-active', on); f.setAttribute('aria-selected', on); });
        state.filter = b.dataset.filter; state.limit = 9;
        renderDeals(true);
      });
    });
    if (moreBtn) moreBtn.addEventListener('click', function () { state.limit += 9; renderDeals(true); });
  }

  /* ---------------------------------------------------------------- Dialoge */
  var dlgApp = $('#dlg-app');
  var dlgCtx = $('[data-dlg-ctx]');
  var dlgTitle = $('[data-dlg-title]');
  var dlgText = $('[data-dlg-text]');
  var defaultTitle = dlgTitle ? dlgTitle.textContent : '';
  var defaultText = dlgText ? dlgText.textContent : '';

  function showDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function openApp(ctx) {
    if (isMobile) { window.location.href = VN.url(VN.os, ctx ? 'deal' : 'button'); return; }
    dlgCtx.innerHTML = ''; dlgCtx.hidden = true;
    dlgTitle.textContent = defaultTitle; dlgText.textContent = defaultText;
    if (ctx) {
      dlgCtx.hidden = false;
      if (ctx.logo) {
        var lg = document.createElement('span'); lg.className = 'flag-logo';
        var im = document.createElement('img'); im.src = 'assets/img/deals/' + ctx.logo; im.alt = ctx.title;
        lg.appendChild(im); dlgCtx.appendChild(lg);
      } else if (ctx.img) {
        var pim = document.createElement('img'); pim.className = 'dlg__ctx-img'; pim.src = ctx.img; pim.alt = '';
        dlgCtx.appendChild(pim);
      }
      if (ctx.value) {
        var off = document.createElement('span'); off.className = 'flag-off';
        if (ctx.pre === 'bis zu') off.innerHTML = '<small>bis<br>zu</small>';
        else if (ctx.pre) { var sm = document.createElement('small'); sm.textContent = ctx.pre; off.appendChild(sm); }
        off.appendChild(document.createTextNode(ctx.value));
        dlgCtx.appendChild(off);
      }
      dlgTitle.textContent = ctx.title;
      dlgText.textContent = 'Diesen Vorteil sicherst du dir in der vorteile.net App. Scanne den Code mit deinem Smartphone – wir leiten dich automatisch in den passenden Store.';
    }
    showDialog(dlgApp);
  }
  $$('[data-deal]').forEach(function (b) {
    b.addEventListener('click', function () {
      openApp({ title: b.dataset.deal, logo: b.dataset.dealLogo, img: b.dataset.dealImg, pre: b.dataset.dealPre, value: b.dataset.dealValue });
    });
  });
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () { showDialog(document.getElementById(b.dataset.open)); });
  });
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d) {
        var r = d.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) d.close();
      }
    });
    $$('[data-close]', d).forEach(function (x) { x.addEventListener('click', function () { d.close(); }); });
  });

  /* ---------------------------------------------------------------- Ankerlinks sanft (mit Kopfzeilen-Abstand) */
  $$('a[href^="#"]').forEach(function (a) {
    if (a.hasAttribute('data-store')) return;
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var t = id.length > 1 ? $(id) : null;
      if (id === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY;
      // Kapitel der App-Story: zur Kapitelmitte, dort steht das Handy still
      var y = t.hasAttribute('data-chapter') ? top + (t.offsetHeight - window.innerHeight) / 2 : top - (id === '#gewinnspiel' ? 0 : 70);
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------------------------------------------------------------- Scroll-Schleife */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollUi(); onScrollStory(); onScrollWin(); });
  }
  var measurePending = false;
  function remeasure() {
    if (measurePending) return;
    measurePending = true;
    requestAnimationFrame(function () {
      measurePending = false;
      if (story) measure();
      placeRail();
      measureUi(); measureWin();
      onScrollUi(); onScrollStory(); onScrollWin();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) {
    var lastDocH = 0;
    new ResizeObserver(function () {
      var hNow = document.documentElement.scrollHeight;
      if (Math.abs(hNow - lastDocH) > 2) { lastDocH = hNow; remeasure(); }
    }).observe(document.body);
  }
  measureUi(); measureWin();
  onScroll();

  /* ---------------------------------------------------------------- Animationen außerhalb des Bildschirms pausieren */
  if ('IntersectionObserver' in window) {
    var idleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-idle', !en.isIntersecting); });
    }, { rootMargin: '100px 0px' });
    $$('.hero__panel, .win__panel, .brands, .final-cta__card').forEach(function (el) { idleIO.observe(el); });
  }
})();
