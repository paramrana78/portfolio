(function () {
  var root = document.documentElement;
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav-toggle');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Theme toggle ----------
  var themeBtn = document.querySelector('.theme-toggle');
  var syncThemeBtn = function () {
    var light = root.getAttribute('data-theme') === 'light';
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  };
  syncThemeBtn();
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeBtn();
  });

  // ---------- Nav: background on scroll, mobile menu ----------
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('nav a', nav).forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ---------- Scroll-driven: nav state, progress bar, timeline ----------
  var progress = document.querySelector('.progress');
  var timeline = document.querySelector('.timeline');
  var jobs = $$('.job');
  var ticking = false;

  var onScroll = function () {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    nav.classList.toggle('scrolled', y > 30);

    var max = document.documentElement.scrollHeight - vh;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

    if (timeline) {
      var line = vh * 0.6;
      var r = timeline.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (line - r.top) / r.height));
      timeline.style.setProperty('--tl', p.toFixed(4));
      jobs.forEach(function (job) {
        job.classList.toggle('passed', job.getBoundingClientRect().top + 20 < line);
      });
    }
  };
  var requestTick = function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  // ---------- Active section in nav ----------
  var navLinks = {};
  $$('nav a[href^="#"]', nav).forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navLinks[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove('active'); });
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navLinks).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  // ---------- Reveal on scroll + count-up stats ----------
  var countUp = function (el) {
    var target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    var start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  var reveal = function (el) {
    el.classList.add('visible');
    var counter = el.querySelector('[data-count]');
    if (counter) countUp(counter);
  };

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (el.closest('.hero') ? i * 0.08 : 0) + 's';
      observer.observe(el);
    });
  } else {
    $$('.reveal').forEach(reveal);
  }

  // ---------- Expandable timeline ----------
  var heads = $$('.job-head');
  var expandAll = document.getElementById('expand-all');
  var setOpen = function (head, open) { head.setAttribute('aria-expanded', String(open)); };
  var syncExpandAll = function () {
    var allOpen = heads.every(function (h) { return h.getAttribute('aria-expanded') === 'true'; });
    expandAll.textContent = allOpen ? 'Collapse all' : 'Expand all';
  };
  heads.forEach(function (head, i) {
    setOpen(head, i === 0); // HTML ships expanded so it reads fine without JS
    head.addEventListener('click', function () {
      setOpen(head, head.getAttribute('aria-expanded') !== 'true');
      syncExpandAll();
      requestTick();
    });
  });
  expandAll.addEventListener('click', function () {
    var open = expandAll.textContent === 'Expand all';
    heads.forEach(function (h) { setOpen(h, open); });
    syncExpandAll();
    requestTick();
  });
  syncExpandAll();

  // ---------- Skill filter ----------
  var chips = $$('.chip');
  var projects = $$('.project');
  var status = document.querySelector('.filter-status');
  var hasTag = function (el, tag) { return (' ' + el.dataset.tags + ' ').indexOf(' ' + tag + ' ') !== -1; };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var tag = chip.dataset.tag;
      var all = tag === 'all';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });

      var roles = 0, apps = 0;
      jobs.forEach(function (job, i) {
        var match = all || hasTag(job, tag);
        job.classList.toggle('is-dim', !match);
        if (match && !all) roles++;
        if (!all) setOpen(heads[i], match);
      });
      projects.forEach(function (proj) {
        var match = all || hasTag(proj, tag);
        proj.classList.toggle('is-dim', !match);
        proj.classList.toggle('is-match', match && !all);
        if (match && !all) apps++;
      });
      if (all) heads.forEach(function (h, i) { setOpen(h, i === 0); });
      syncExpandAll();
      status.textContent = all ? '' : chip.textContent + ': ' + roles + (roles === 1 ? ' role' : ' roles') + ' · ' + apps + (apps === 1 ? ' project' : ' projects');
      requestTick();
    });
  });

  // ---------- Project preview (phone mockup dialog) ----------
  var dialog = document.getElementById('app-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    var phone = dialog.querySelector('.phone');
    var stage = dialog.querySelector('.phone-stage');
    var current = 0;

    var show = function (i) {
      current = (i + projects.length) % projects.length;
      var card = projects[current];
      var name = card.querySelector('h3').textContent;
      var links = $$('.links a', card);
      var platforms = links.map(function (a) {
        var t = a.textContent;
        return /App Store/.test(t) ? 'iOS' : /Google Play/.test(t) ? 'Android' : 'Web';
      });

      phone.style.setProperty('--app', card.dataset.color);
      dialog.querySelector('.app-icon').textContent = card.dataset.initials;
      dialog.querySelector('.app-name').textContent = name;
      dialog.querySelector('.app-plat').textContent = platforms.join(' · ');

      var list = dialog.querySelector('.app-list');
      list.innerHTML = '';
      card.querySelector('.stack').textContent.split('·').slice(0, 6).forEach(function (item, n) {
        var li = document.createElement('li');
        li.textContent = item.trim();
        li.style.setProperty('--i', n);
        list.appendChild(li);
      });

      document.getElementById('dlg-role').textContent = card.querySelector('.role').textContent;
      document.getElementById('dlg-title').textContent = name;
      document.getElementById('dlg-desc').textContent = card.querySelector('p:not(.role):not(.stack)').textContent;
      var dlgLinks = document.getElementById('dlg-links');
      dlgLinks.innerHTML = '';
      links.forEach(function (a) { dlgLinks.appendChild(a.cloneNode(true)); });
      document.getElementById('dlg-count').textContent = (current + 1) + ' / ' + projects.length;
    };

    var open = function (i) {
      show(i);
      if (!dialog.open) dialog.showModal();
    };

    projects.forEach(function (card, i) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return; // store links keep working directly
        open(i);
      });
    });
    dialog.querySelector('.dlg-close').addEventListener('click', function () { dialog.close(); });
    document.getElementById('dlg-prev').addEventListener('click', function () { show(current - 1); });
    document.getElementById('dlg-next').addEventListener('click', function () { show(current + 1); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(current + 1);
      if (e.key === 'ArrowLeft') show(current - 1);
    });

    // Gentle 3D tilt that follows the pointer
    if (finePointer && !reduceMotion) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        phone.style.setProperty('--ry', (x * 22).toFixed(2) + 'deg');
        phone.style.setProperty('--rx', (-y * 16).toFixed(2) + 'deg');
      });
      stage.addEventListener('pointerleave', function () {
        phone.style.removeProperty('--ry');
        phone.style.removeProperty('--rx');
      });
    }
  } else {
    $$('.preview').forEach(function (b) { b.hidden = true; });
  }

  // ---------- Pointer polish: card spotlight + magnetic buttons ----------
  if (finePointer && !reduceMotion) {
    $$('.card, .project').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
      });
    });

    $$('.btn').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.2).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  // ---------- Rotating role text ----------
  var rotator = document.querySelector('.rotator');
  var words = ['mobile products', 'React Native apps', 'Android experiences', 'iOS apps', 'great teams'];
  if (rotator && !reduceMotion) {
    var w = 0, c = words[0].length, deleting = true;
    var tick = function () {
      var word = words[w];
      c += deleting ? -1 : 1;
      rotator.textContent = word.slice(0, c);
      var delay = deleting ? 45 : 85;
      if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; word = words[w]; delay = 300; }
      else if (!deleting && c === words[w].length) { deleting = true; delay = 2200; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }
})();
