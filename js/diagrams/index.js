// Scroll-driven canvas line drawings. See docs/SPEC.md section 8.
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function mountDiagrams({ reducedMotion = false } = {}) {
  const canvases = Array.from(document.querySelectorAll('canvas[data-diagram]'));
  if (!canvases.length) return;

  const items = [];
  let running = false;
  let last = 0;
  const t0 = performance.now();

  function readColours(it) {
    try {
      const cs = it.section ? getComputedStyle(it.section) : null;
      let ink = cs ? cs.getPropertyValue('--ink').trim() : '';
      if (!ink) ink = getComputedStyle(it.canvas).color || '#000';
      let accent = cs ? cs.getPropertyValue('--ground').trim() : '';
      if (!accent) accent = '#fff';
      it.ink = ink;
      it.accent = accent;
    } catch (e) {
      it.ink = it.ink || '#000';
      it.accent = it.accent || '#fff';
    }
  }

  function resize(it) {
    const w = it.canvas.clientWidth;
    const h = it.canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    it.w = w;
    it.h = h;
    it.dpr = dpr;
    it.canvas.width = Math.round(w * dpr);
    it.canvas.height = Math.round(h * dpr);
    readColours(it);
    it.dirty = true;
  }

  function target(it) {
    const el = it.figure || it.canvas;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return clamp01((vh - r.top) / (vh * 0.5 + r.height * 0.5));
  }

  function render(it, p, t) {
    if (!it.draw || !it.ctx || !it.w) return;
    const ctx = it.ctx;
    try {
      ctx.setTransform(it.dpr, 0, 0, it.dpr, 0, 0);
      ctx.clearRect(0, 0, it.w, it.h);
      ctx.save();
      ctx.strokeStyle = it.ink;
      ctx.fillStyle = it.ink;
      ctx.lineWidth = 1.25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      it.draw(ctx, { w: it.w, h: it.h, p, t, ink: it.ink, accent: it.accent });
      ctx.restore();
    } catch (e) {
      try {
        ctx.restore();
      } catch (e2) {
        /* ignore */
      }
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const t = (now - t0) / 1000;
    let any = false;
    for (const it of items) {
      if (!it.visible) continue;
      any = true;
      const tg = target(it);
      if (it.p === null) it.p = tg;
      else it.p += (tg - it.p) * (1 - Math.exp(-dt * 7));
      render(it, it.p, t);
    }
    if (!any || document.hidden) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reducedMotion || document.hidden) return;
    if (!items.some((it) => it.visible)) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function drawStatic(it) {
    render(it, 1, 0);
  }

  for (const canvas of canvases) {
    const id = canvas.dataset.diagram || '';
    if (!/^[a-z]+$/.test(id)) continue;
    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch (e) {
      ctx = null;
    }
    if (!ctx) continue;
    const it = {
      canvas,
      ctx,
      id,
      section: canvas.closest('section.chapter') || canvas.closest('section'),
      figure: canvas.closest('figure') || canvas,
      draw: null,
      visible: false,
      p: null,
      w: 0,
      h: 0,
      dpr: 1,
      ink: '',
      accent: '',
      dirty: true,
    };
    items.push(it);

    import(`./${id}.js`)
      .then((m) => {
        it.draw = m.default;
        if (reducedMotion) drawStatic(it);
        else {
          it.dirty = true;
          if (!it.visible) render(it, target(it), (performance.now() - t0) / 1000);
          start();
        }
      })
      .catch(() => {
        /* unknown id: skip */
      });

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => {
        resize(it);
        if (reducedMotion) drawStatic(it);
        else if (it.visible || it.draw) {
          if (it.p === null) it.p = target(it);
          render(it, it.p, (performance.now() - t0) / 1000);
        }
      }).observe(canvas);
    } else {
      resize(it);
    }

    if (!reducedMotion && typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver((entries) => {
        for (const e of entries) {
          it.visible = e.isIntersecting;
          if (it.visible) {
            it.p = it.p === null ? target(it) : it.p;
            start();
          }
        }
      }).observe(canvas);
    } else if (!reducedMotion) {
      it.visible = true;
    }
  }

  if (!reducedMotion) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) start();
    });
    start();
  }
}
