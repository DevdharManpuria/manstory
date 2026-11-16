const query = window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribers = new Set();
const frame = { y: 0, vh: 0, vw: 0, docHeight: 0, resized: true };
let queued = false;
let dimsStale = true;
let resizePending = true;

export function prefersReducedMotion() {
  return query.matches;
}

export function watchReducedMotion(fn) {
  query.addEventListener('change', () => fn(query.matches));
}

/** Runs fn after n animation frames, so a style change made now is rendered before fn runs. */
export function afterFrames(fn, n = 2) {
  const step = (left) => requestAnimationFrame(() => (left > 1 ? step(left - 1) : fn()));
  step(n);
}

/** Reads scroll position every call; viewport and document size are cached until invalidated. */
export function measure() {
  frame.y = window.scrollY;
  if (dimsStale) {
    const root = document.documentElement;
    frame.vh = window.innerHeight;
    frame.vw = root.clientWidth;
    frame.docHeight = root.scrollHeight;
    dimsStale = false;
  }
  return frame;
}

export function requestFrame() {
  if (queued || document.hidden) return;
  queued = true;
  requestAnimationFrame(run);
}

/**
 * fn receives { y, vh, vw, docHeight, resized } and does its reads. It may return a
 * function, which runs after every subscriber has read, so reads never follow writes.
 */
export function onFrame(fn) {
  subscribers.add(fn);
  requestFrame();
  return () => subscribers.delete(fn);
}

function run() {
  queued = false;
  if (document.hidden) return;
  const f = measure();
  f.resized = resizePending;
  const writes = [];
  subscribers.forEach((fn) => {
    const write = fn(f);
    if (typeof write === 'function') writes.push(write);
  });
  resizePending = false;
  writes.forEach((write) => write());
}

function invalidate() {
  dimsStale = true;
  requestFrame();
}

export function initScroll() {
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', () => {
    resizePending = true;
    invalidate();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) invalidate();
  });
  if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(document.body);
  invalidate();
}
