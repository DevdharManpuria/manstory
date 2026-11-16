import { onFrame, prefersReducedMotion, watchReducedMotion } from './scroll.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const IDENTITY = { tx: 0, ty: 0, sx: 1, sy: 1 };

export function initHero() {
  const band = document.querySelector('[data-hero-band]');
  const rail = document.querySelector('[data-rail]');
  const strip = document.querySelector('[data-rail-strip]');
  const stick = document.querySelector('[data-hero] .hero__stick');
  const copy = document.querySelector('.hero__copy');
  if (!rail) return;

  let applied = IDENTITY;
  let geometry = null;
  let measured = false;
  let docked = null;
  let shownBand = null;
  let shownCopy = null;
  let forceWrite = true;

  // The band is stuck to the top of the viewport while docking, so its stick-relative
  // rect is also its viewport rect. The last written transform is undone to get the
  // resting rect without writing anything.
  function measureGeometry() {
    measured = true;
    geometry = null;
    if (!band || !strip || !stick) return;
    const b = band.getBoundingClientRect();
    const s = stick.getBoundingClientRect();
    const sr = strip.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    if (!b.width || !b.height || !sr.width || !sr.height) return;
    const left = b.left - applied.tx;
    const top = b.top - applied.ty - s.top;
    geometry = {
      dx: sr.left - left,
      dy: sr.top - r.top - top,
      sx: sr.width / (b.width / applied.sx),
      sy: sr.height / (b.height / applied.sy),
    };
  }

  watchReducedMotion(() => { forceWrite = true; });

  onFrame((f) => {
    if (!measured || f.resized) measureGeometry();
    const reduced = prefersReducedMotion();
    const p = reduced ? 0 : clamp01(f.y / (0.7 * f.vh));
    const fade = reduced ? 0 : clamp01(f.y / (0.35 * f.vh));
    const dock = reduced ? f.y > 0.6 * f.vh : p === 1;
    const e = easeInOutCubic(p);
    const next = geometry && p > 0
      ? { tx: geometry.dx * e, ty: geometry.dy * e, sx: 1 + (geometry.sx - 1) * e, sy: 1 + (geometry.sy - 1) * e }
      : IDENTITY;
    const hideBand = dock && !reduced;
    const bandKey = `${next.tx}|${next.ty}|${next.sx}|${next.sy}|${hideBand}`;
    const force = forceWrite;
    forceWrite = false;

    return () => {
      if (dock !== docked) {
        if (dock) rail.setAttribute('data-docked', '');
        else rail.removeAttribute('data-docked');
        docked = dock;
      }
      if (band && (force || bandKey !== shownBand)) {
        const identity = next === IDENTITY;
        band.style.transform = identity
          ? ''
          : `translate(${next.tx}px, ${next.ty}px) scale(${next.sx}, ${next.sy})`;
        band.style.transformOrigin = identity ? '' : '0 0';
        band.style.visibility = hideBand ? 'hidden' : '';
        applied = next;
        shownBand = bandKey;
      }
      if (copy && (force || fade !== shownCopy)) {
        copy.style.opacity = fade === 0 ? '' : String(1 - fade);
        copy.style.filter = fade === 0 ? '' : `blur(${(6 * fade).toFixed(2)}px)`;
        copy.style.pointerEvents = fade >= 1 ? 'none' : '';
        shownCopy = fade;
      }
    };
  });
}
