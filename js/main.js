import { createStage } from './stage.js';
import { oklch } from './shapes.js';
import { initSheets } from './sheets.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (reduced.matches) root.setAttribute('data-reduced-motion', '');

const scenes = [...document.querySelectorAll('[data-scene]')];
const sides = scenes.map((s) => s.dataset.side || 'center');
const shapes = scenes.map((s) => s.dataset.shape);
const hues = scenes.map((s) => Number(s.dataset.hue) || 40);
const data = JSON.parse(document.getElementById('spectrum-data').textContent);

// ---------- background colours per scene ----------
const colors = scenes.map((s, i) => {
  const h = hues[i];
  const strong = s.dataset.shape === 'sun' ? 1.35 : 1;
  const g = oklch(0.46, 0.12, h).map((c) => c * 0.32 * strong);
  return { base: oklch(0.13, 0.016, h).map((c) => c * 0.55), glow: g };
});

// ---------- stage ----------
let stage = null;
try {
  stage = createStage(document.querySelector('[data-stage]'), {
    shapes,
    colors,
    ctx: { lines: data.lines, hues: data.hues },
    reducedMotion: reduced.matches,
  });
} catch (err) {
  console.error('Dark Lines: WebGL stage failed', err);
}
if (!stage) root.classList.add('no-webgl');

// ---------- scroll geometry ----------
// Each scene is taller than the viewport and its content is pinned. While pinned the
// value holds at the scene's index; between two pins it runs from one index to the next.
// The morph also eats into the edges of each pin, so it plays out over more scroll.
const MORPH_PAD = 0.45; // of a viewport, taken from each side of a pin
let marks = [];
let vh = window.innerHeight;
function measure() {
  vh = window.innerHeight;
  const y = window.scrollY;
  const last = scenes.length - 1;
  marks = scenes.map((s, i) => {
    const r = s.getBoundingClientRect();
    const start = r.top + y;
    const end = Math.max(start, start + r.height - vh);
    const pad = Math.min(vh * MORPH_PAD, (end - start) * 0.4);
    return {
      start,
      end,
      holdStart: i === 0 ? start : start + pad,
      holdEnd: i === last ? end : end - pad,
    };
  });
}
function valueAt(y) {
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    if (y < m.holdStart) {
      if (i === 0) return 0;
      const p = marks[i - 1];
      return i - 1 + (y - p.holdEnd) / Math.max(1, m.holdStart - p.holdEnd);
    }
    if (y <= m.holdEnd) return i;
  }
  return marks.length - 1;
}

// ---------- HUD ----------
const hudNm = document.querySelector('[data-hud-nm]');
const hudLabel = document.querySelector('[data-hud-label]');
const count = document.querySelector('[data-count]');
const cursor = document.querySelector('[data-rail-cursor]');
const rail = document.querySelector('.rail');
const firstChapter = scenes.findIndex((s) => s.classList.contains('scene--chapter'));
const chapterCount = scenes.filter((s) => s.classList.contains('scene--chapter') || s.classList.contains('scene--open')).length;

let active = -1;
function setActive(i) {
  if (i === active) return;
  const prev = active;
  active = i;
  scenes.forEach((s, k) => {
    s.classList.toggle('is-active', k === i);
    s.classList.toggle('is-past', k < i);
  });
  const s = scenes[i];
  root.style.setProperty('--scene-hue', hues[i]);
  if (hudNm && hudLabel) {
    hudNm.textContent = s.dataset.nm || '';
    hudLabel.textContent = s.dataset.label || '';
    if (prev !== -1) {
      hudNm.parentElement.classList.remove('is-swap');
      void hudNm.parentElement.offsetWidth;
      hudNm.parentElement.classList.add('is-swap');
    }
  }
  if (count) {
    const n = i - firstChapter + 1;
    const on = n >= 1 && n <= chapterCount;
    count.parentElement.classList.toggle('is-off', !on);
    if (on) count.textContent = n > chapterCount - 1 ? '??' : String(n).padStart(2, '0');
  }
}

// ---------- the intro statement lights word by word ----------
const scrubEl = document.querySelector('[data-scrub]');
const scrubWords = scrubEl ? [...scrubEl.querySelectorAll('.sw')] : [];
const scrubScene = scrubEl ? scenes.indexOf(scrubEl.closest('[data-scene]')) : -1;
let lastScrub = -1;
function updateScrub(y) {
  if (scrubScene < 0 || !marks[scrubScene]) return;
  const m = marks[scrubScene];
  const from = m.start - vh * 0.55;
  const to = m.end - vh * 0.05;
  const p = Math.max(0, Math.min(1, (y - from) / Math.max(1, to - from)));
  const lit = p * (scrubWords.length + 3);
  if (Math.abs(lit - lastScrub) < 0.01) return;
  lastScrub = lit;
  scrubWords.forEach((w, i) => {
    const o = Math.max(0, Math.min(1, (lit - i) / 3));
    w.style.setProperty('--lit', o.toFixed(3));
  });
}

// ---------- loop ----------
let smooth = null;
let last = performance.now();
let paused = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const y = window.scrollY;
  const target = valueAt(y);
  if (smooth === null) smooth = target;
  const k = reduced.matches ? 1 : 1 - Math.exp(-dt * 3.2);
  smooth += (target - smooth) * k;
  if (Math.abs(target - smooth) < 0.0005) smooth = target;

  setActive(Math.max(0, Math.min(scenes.length - 1, Math.round(smooth))));
  updateScrub(y);

  if (cursor) {
    // rail covers the chapters and the open questions
    const r = (smooth - firstChapter + 0.5) / chapterCount;
    cursor.style.setProperty('--p', Math.max(0, Math.min(1, r)).toFixed(4));
    cursor.classList.toggle('is-off', r < 0 || r > 1);
    rail?.classList.toggle('is-off', r < -0.04 || r > 1.04);
  }

  if (stage && !paused) stage.render(smooth, sides, now);
  requestAnimationFrame(frame);
}

measure();
window.addEventListener('resize', () => {
  measure();
  stage?.resize();
});
window.addEventListener('load', measure);
document.fonts?.ready.then(measure);
new ResizeObserver(measure).observe(document.body);

// pointer
if (matchMedia('(pointer: fine)').matches && stage) {
  window.addEventListener('pointermove', (e) => {
    stage.setMouse((e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2);
  }, { passive: true });
  document.addEventListener('pointerleave', () => stage.clearMouse());
}

// ---------- navigation ----------
function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const i = scenes.indexOf(el);
  const top = i >= 0 && marks[i] ? marks[i].holdStart : el.offsetTop;
  window.scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
}

initSheets({
  onJump: jumpTo,
  onPause(p) {
    paused = p;
  },
});

document.addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (j && !j.closest('dialog')) {
    e.preventDefault();
    jumpTo(j.dataset.jump);
  }
  if (e.target.closest('[data-top]')) window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
});

root.classList.add('is-ready');
requestAnimationFrame((t) => {
  last = t;
  frame(t);
});
