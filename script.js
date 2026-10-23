(function () {
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav-toggle');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // Nav: background on scroll, mobile menu
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 30); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Reveal on scroll + count-up stats
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
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (el.closest('.hero') ? i * 0.08 : 0) + 's';
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(reveal);
  }

  // Rotating role text
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
