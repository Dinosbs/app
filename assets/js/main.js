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
    countUp($$('.hero [data-count]'));
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 900); })]).then(intro);

  /* ---------------------------------------------------------------- Kopfzeile, Fortschritt, Sticky */
  var nav = $('[data-nav]');
  var bar = $('.progress');
  var sticky = $('[data-sticky]');
  var heroPanel = $('.hero__panel');
  var lastY = window.scrollY;
  var navLinks = $$('.nav__links a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });

  function onScrollUi() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
    nav.classList.toggle('is-solid', y > 40);
    var heroBottom = heroPanel.getBoundingClientRect().bottom;
    nav.classList.toggle('is-hidden', y > lastY && y > 600 && !document.querySelector('dialog[open]'));
    if (sticky) {
      var dl = document.getElementById('download');
      var dlr = dl ? dl.getBoundingClientRect() : null;
      var ctaVisible = dlr && dlr.top < window.innerHeight && dlr.bottom > 0;
      var on = heroBottom < 0 && !ctaVisible && (window.innerHeight + y < document.documentElement.scrollHeight - 40) && !html.classList.contains('is-redirecting');
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      var sb = sticky.querySelector('a'); if (sb) sb.tabIndex = on ? 0 : -1;
    }
    var mid = window.innerHeight * 0.35, current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < mid) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
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
    $$('[data-count]').forEach(function (el) { if (!el.closest('.hero')) countIO.observe(el); });
  }

  /* ---------------------------------------------------------------- Hero: Parallax mit der Maus */
  var stage = $('[data-parallax]');
  if (stage && finePointer && !reduce) {
    var layers = $$('[data-depth]', stage);
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    var hero = $('.hero__panel');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    var loop = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = +l.dataset.depth;
        var rot = l.classList.contains('phone') ? ' rotateY(' + (cx * 10).toFixed(2) + 'deg) rotateX(' + (-cy * 8).toFixed(2) + 'deg)' : '';
        l.style.translate = (cx * d * 26).toFixed(2) + 'px ' + (cy * d * 22).toFixed(2) + 'px';
        if (rot) l.style.transform = html.classList.contains('is-ready') ? rot : '';
      });
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(loop) : null;
    };
  }

  /* ---------------------------------------------------------------- Push-Nachricht im Hero wechselt */
  var pushText = $('[data-push-text]');
  if (pushText && !reduce) {
    var msgs = ['Deals der Woche: Sony bis zu 45%', 'Neu: Samsung bis zu 30% 📱', 'Gewinnspiel: Gewinne einen VW Tiguan 🚙', 'Advents-Special ist gestartet 🎁'];
    var mi = 0;
    setInterval(function () {
      pushText.classList.add('is-out');
      setTimeout(function () { mi = (mi + 1) % msgs.length; pushText.textContent = msgs[mi]; pushText.classList.remove('is-out'); }, 380);
    }, 3600);
  }

  /* ---------------------------------------------------------------- Bento: Push-Stapel */
  var stack = $('[data-push-stack]');
  if (stack) {
    var cards = $$('.push--stack', stack), order = cards.map(function (_, i) { return i; });
    var layout = function () {
      order.forEach(function (ci, pos) {
        var c = cards[ci];
        c.style.setProperty('--y', (pos * 22 - 30) + 'px');
        c.style.setProperty('--s', (1 - pos * 0.06).toFixed(3));
        c.style.setProperty('--o', pos > 2 ? 0 : (1 - pos * 0.22).toFixed(2));
        c.style.setProperty('--z', 10 - pos);
        c.style.setProperty('--c', pos === 0 ? 1 : 0);
      });
    };
    layout();
    if (!reduce) setInterval(function () {
      // oberste Karte fliegt raus, die nächste rückt nach, die alte kommt hinten an
      var top = cards[order[0]];
      top.style.setProperty('--y', '-110px'); top.style.setProperty('--o', 0);
      setTimeout(function () { order.push(order.shift()); layout(); }, 420);
    }, 3000);
  }

  /* ---------------------------------------------------------------- Bento: Welten leuchten auf */
  var welten = $$('[data-welten] li');
  if (welten.length && !reduce) {
    var lit = [];
    setInterval(function () {
      lit.forEach(function (l) { l.classList.remove('is-lit'); });
      lit = [];
      for (var k = 0; k < 3; k++) { var el = welten[Math.floor(Math.random() * welten.length)]; el.classList.add('is-lit'); lit.push(el); }
    }, 1600);
  }

  /* ---------------------------------------------------------------- Zeiger-Lichtschein auf Karten */
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var g = e.target.closest && e.target.closest('.glow');
      if (!g) return;
      var r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
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

  function onScrollWin() {
    var vh = window.innerHeight;
    if (car && !reduce) {
      var r = car.getBoundingClientRect();
      var p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      var e = easeOut(p);
      car.style.setProperty('--cx', ((1 - e) * 42).toFixed(2) + 'vw');
      car.style.setProperty('--cs', (0.86 + e * 0.14).toFixed(3));
      car.style.opacity = clamp(p * 1.6, 0, 1).toFixed(3);
    }
    if (ghost && !reduce) {
      var pr = winPanel.getBoundingClientRect();
      var gp = clamp((vh - pr.top) / (vh + pr.height), 0, 1);
      ghost.style.setProperty('--gx', ((0.5 - gp) * 40).toFixed(2) + 'vw');
    }
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var sp = clamp((vh * 0.82 - sr.top) / (sr.height * 0.85), 0, 1);
      if (reduce) sp = sr.top < vh * 0.8 ? 1 : 0;
      var on0 = 0.35 / (stepEls.length + 0.6), onN = (stepEls.length - 1 + 0.35) / (stepEls.length + 0.6);
      steps.style.setProperty('--rp', clamp((sp - on0) / (onN - on0), 0, 1).toFixed(3));
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
    var icons = $$('.step__icon', steps), sr = steps.getBoundingClientRect();
    var a = icons[0].getBoundingClientRect(), b = icons[icons.length - 1].getBoundingClientRect();
    var vertical = Math.abs(a.left - b.left) < 10;
    rail.classList.toggle('is-vertical', vertical);
    if (vertical) {
      rail.style.cssText = 'left:' + (a.left + a.width / 2 - sr.left - 1) + 'px;top:' + (a.top + a.height / 2 - sr.top) + 'px;width:2px;height:' + (b.top - a.top) + 'px';
    } else {
      rail.style.cssText = 'left:' + (a.left + a.width / 2 - sr.left) + 'px;top:' + (a.top + a.height / 2 - sr.top - 1) + 'px;height:2px;width:' + (b.left - a.left) + 'px';
    }
  }
  placeRail();
  window.addEventListener('resize', placeRail);
  window.addEventListener('load', placeRail);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeRail);

  /* ---------------------------------------------------------------- Konfetti */
  var canvas = $('[data-confetti]');
  function confetti(origin) {
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
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
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        p.life = clamp(1.9 - el, 0, 1);
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2))); ctx.restore();
      });
      if (el < 2) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
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
    moreBtn.hidden = all;
    moreApp.hidden = !all;
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
    moreBtn.addEventListener('click', function () { state.limit += 9; renderDeals(true); });
  }

  /* ---------------------------------------------------------------- Produkt-Karussell */
  var carousel = $('[data-carousel]');
  if (carousel) {
    var prev = $('[data-carousel-prev]'), next = $('[data-carousel-next]'), cbar = $('[data-carousel-bar]');
    var update = function () {
      var max = carousel.scrollWidth - carousel.clientWidth;
      var w = clamp(carousel.clientWidth / carousel.scrollWidth, 0.08, 1);
      cbar.style.setProperty('--bw', (w * 100).toFixed(2) + '%');
      cbar.style.setProperty('--bx', (max > 0 ? carousel.scrollLeft / max * (1 - w) * 100 : 0).toFixed(2) + '%');
      prev.disabled = carousel.scrollLeft < 8;
      next.disabled = carousel.scrollLeft > max - 8;
    };
    var stepBy = function (dir) {
      var card = $('.product', carousel);
      var w = card ? card.getBoundingClientRect().width + 20 : 280;
      carousel.scrollBy({ left: dir * w * Math.max(1, Math.floor(carousel.clientWidth / w) - 1), behavior: reduce ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { stepBy(-1); });
    next.addEventListener('click', function () { stepBy(1); });
    carousel.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Ziehen mit der Maus (Touch scrollt nativ)
    var down = false, startX = 0, startL = 0, moved = 0, vel = 0, lastX = 0, lastT = 0;
    carousel.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; startX = lastX = e.clientX; startL = carousel.scrollLeft; lastT = performance.now(); vel = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4 && !carousel.classList.contains('is-dragging')) carousel.classList.add('is-dragging');
      moved = Math.abs(dx);
      carousel.scrollLeft = startL - dx;
      var now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved > 4) {
        var v = vel * 16;
        (function glide() {
          if (Math.abs(v) < 0.4) { carousel.classList.remove('is-dragging'); return; }
          carousel.scrollLeft -= v; v *= 0.94; requestAnimationFrame(glide);
        })();
      } else carousel.classList.remove('is-dragging');
    });
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
      var y = t.getBoundingClientRect().top + window.scrollY - (id === '#gewinnspiel' ? 0 : 70);
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------------------------------------------------------------- Scroll-Schleife */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollUi(); onScrollWin(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
