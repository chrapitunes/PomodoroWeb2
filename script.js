(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Mobile menu ----------
  const menuBtn = document.querySelector('[data-menu-btn]');
  const menuPanel = document.querySelector('[data-menu-panel]');
  const menuIconOpen = document.querySelector('[data-menu-icon="open"]');
  const menuIconClose = document.querySelector('[data-menu-icon="close"]');

  const setMenu = (open) => {
    if (!menuBtn || !menuPanel) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuPanel.classList.toggle('hidden', !open);
    menuPanel.classList.toggle('flex', open);
    menuIconOpen?.classList.toggle('hidden', open);
    menuIconClose?.classList.toggle('hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    setMenu(!open);
  });

  menuPanel?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // ---------- 2. Scroll-spy nav ----------
  const spyLinks = Array.from(document.querySelectorAll('[data-spy-link]'));
  const spyTargets = spyLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (spyTargets.length && 'IntersectionObserver' in window) {
    const setActive = (id) => {
      spyLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('text-ink', active);
        link.classList.toggle('text-muted', !active);
      });
    };

    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    spyTargets.forEach((t) => spy.observe(t));
  }

  // ---------- 3. Fade-in on scroll ----------
  const fadeEls = document.querySelectorAll('[data-fade]');

  if (reduceMotion) {
    fadeEls.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );
    fadeEls.forEach((el) => fadeObserver.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ---------- 4. Animated counter ----------
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.counter, 10);
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      el.textContent = target.toLocaleString('es-CO');
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const value = Math.round(target * easeOut(p));
      el.textContent = value.toLocaleString('es-CO');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObs.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  // ---------- 5. Live status rotator on phone mockup ----------
  const statusEl = document.querySelector('[data-status-rotate]');
  if (statusEl && !reduceMotion) {
    const states = [
      { label: 'Disponible', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-available', pulse: true },
      { label: 'Fila · 6m', cls: 'bg-amber-50 text-amber-800', dot: 'bg-queue', pulse: false },
      { label: 'Disponible', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-available', pulse: true },
      { label: 'Fila · 12m', cls: 'bg-amber-50 text-amber-800', dot: 'bg-queue', pulse: false },
    ];
    let i = 0;
    const labelEl = statusEl.querySelector('[data-status-label]');
    const dotEl = statusEl.querySelector('[data-status-dot]');
    const ringEl = statusEl.querySelector('[data-status-ring]');

    const apply = () => {
      const s = states[i];
      statusEl.className = 'flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors duration-300 ' + s.cls;
      labelEl.textContent = s.label;
      dotEl.className = 'relative inline-flex w-1.5 h-1.5 rounded-full ' + s.dot;
      ringEl.className = 'absolute inline-flex w-full h-full rounded-full ' + s.dot + (s.pulse ? ' animate-pulseRing' : ' opacity-0');
      i = (i + 1) % states.length;
    };

    setInterval(apply, 3200);
  }

  // ---------- 6. Showcase scroll animation (ContainerScroll port) ----------
  const showcase = document.querySelector('[data-showcase]');
  const showcaseHeader = document.querySelector('[data-showcase-header]');
  const showcasePhone = document.querySelector('[data-showcase-phone]');

  if (showcase && showcaseHeader && showcasePhone && !reduceMotion) {
    let isMobileShow = window.innerWidth <= 768;
    let ticking = false;

    const updateShowcase = () => {
      const rect = showcase.getBoundingClientRect();
      const vh = window.innerHeight;
      // raw progress: 0 when section's top reaches viewport bottom,
      // 1 when section's bottom reaches viewport top.
      const raw = (vh - rect.top) / (vh + rect.height);
      const p = Math.max(0, Math.min(1, raw));

      const lerp = (a, b, t) => a + (b - a) * t;
      const rotate = lerp(20, 0, p);
      // Never upscale past 1.0 to keep the screen content pixel-crisp.
      const scaleStart = isMobileShow ? 0.78 : 1;
      const scaleEnd = isMobileShow ? 0.92 : 1;
      const scale = lerp(scaleStart, scaleEnd, p);
      const translate = lerp(0, -100, p);

      showcasePhone.style.transform = `rotateX(${rotate}deg) scale(${scale}) translateZ(0)`;
      showcaseHeader.style.transform = `translateY(${translate}px)`;
    };

    const onScrollShow = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateShowcase();
          ticking = false;
        });
        ticking = true;
      }
    };

    const onResizeShow = () => {
      isMobileShow = window.innerWidth <= 768;
      updateShowcase();
    };

    window.addEventListener('scroll', onScrollShow, { passive: true });
    window.addEventListener('resize', onResizeShow);
    updateShowcase();
  }

  // ---------- 7. Year in footer ----------
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
