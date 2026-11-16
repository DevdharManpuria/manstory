import { markSeen } from './record.js';
import { afterFrames, prefersReducedMotion } from './scroll.js';

const entries = new Map();
const ticks = new Map();
let hovered = null;

const ids = (value) => (value || '').split(/[\s,]+/).filter(Boolean);
const isOpen = (entry) => entry.line.hasAttribute('data-open');

function updateThreads() {
  const kinds = new Map();
  entries.forEach((entry) => {
    if (isOpen(entry)) ids(entry.line.dataset.builtOn).forEach((id) => kinds.set(id, 'built'));
  });
  entries.forEach((entry) => {
    if (isOpen(entry)) ids(entry.line.dataset.ledTo).forEach((id) => { if (!kinds.has(id)) kinds.set(id, 'led'); });
  });
  if (hovered) kinds.set(hovered.id, hovered.kind);
  ticks.forEach((tick, id) => {
    const kind = kinds.get(id) ?? null;
    if (tick.getAttribute('data-thread') === kind) return;
    if (kind) tick.setAttribute('data-thread', kind);
    else tick.removeAttribute('data-thread');
  });
}

function announceLayout(entry, instant) {
  entry.cancel?.();
  const finish = () => {
    entry.cancel?.();
    entry.cancel = null;
    document.dispatchEvent(new CustomEvent('lines:layout'));
  };
  if (instant) {
    afterFrames(finish);
    return;
  }
  const onEnd = (event) => {
    if (event.target === entry.panel) finish();
  };
  const timer = setTimeout(finish, 500);
  entry.panel.addEventListener('transitionend', onEnd);
  entry.cancel = () => {
    clearTimeout(timer);
    entry.panel.removeEventListener('transitionend', onEnd);
  };
}

function setOpen(entry, open, instant) {
  const { line, toggle, panel } = entry;
  if (instant) {
    line.setAttribute('data-instant', '');
    afterFrames(() => line.removeAttribute('data-instant'));
  }
  if (open) line.setAttribute('data-open', '');
  else line.removeAttribute('data-open');
  panel.inert = !open;
  toggle.setAttribute('aria-expanded', String(open));
  updateThreads();
  announceLayout(entry, instant);
}

export function openLine(id, { scroll = false, flash = false, instant = false } = {}) {
  const entry = entries.get(id);
  if (!entry) return;
  if (!isOpen(entry)) setOpen(entry, true, instant);
  markSeen(id);
  try {
    history.replaceState(null, '', `#d-${id}`);
  } catch {
    /* history unavailable: the hash is a convenience */
  }
  if (scroll) {
    entry.line.scrollIntoView({ block: 'start', behavior: instant || prefersReducedMotion() ? 'auto' : 'smooth' });
  }
  if (flash) {
    clearTimeout(entry.flashTimer);
    entry.line.removeAttribute('data-flash');
    afterFrames(() => entry.line.setAttribute('data-flash', ''), 1);
    entry.flashTimer = setTimeout(() => entry.line.removeAttribute('data-flash'), 1000);
  }
}

export function closeLine(id) {
  const entry = entries.get(id);
  if (entry && isOpen(entry)) setOpen(entry, false, false);
}

function threadKind(link) {
  const label = link.closest('.line__links-row')?.querySelector('.line__links-label');
  return /^\s*built/i.test(label?.textContent ?? '') ? 'built' : 'led';
}

function setHovered(link) {
  const next = link ? { id: link.dataset.thread, kind: threadKind(link) } : null;
  if (hovered?.id === next?.id && hovered?.kind === next?.kind) return;
  hovered = next;
  updateThreads();
}

function threadLink(event) {
  return event.target instanceof Element ? event.target.closest('a.thread') : null;
}

function applyHash(initial) {
  let hash = '';
  try {
    hash = decodeURIComponent(location.hash.slice(1));
  } catch {
    return;
  }
  if (hash.startsWith('d-')) {
    openLine(hash.slice(2), { scroll: true, instant: initial });
  } else if (initial && /^[qc]-/.test(hash)) {
    document.getElementById(hash)?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
}

export function initLines() {
  document.querySelectorAll('.line[data-line]').forEach((line) => {
    const toggle = line.querySelector('.line__toggle');
    const panel = line.querySelector('.line__panel');
    if (!toggle || !panel) return;
    line.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
    panel.inert = true;
    entries.set(line.dataset.line, { line, toggle, panel, cancel: null, flashTimer: 0 });
  });
  document.querySelectorAll('.rail__tick[data-tick]').forEach((tick) => ticks.set(tick.dataset.tick, tick));

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const toggle = event.target.closest('.line__toggle');
    const line = toggle?.closest('.line[data-line]');
    const entry = line && entries.get(line.dataset.line);
    if (entry) {
      if (isOpen(entry)) setOpen(entry, false, event.detail === 0);
      else openLine(line.dataset.line, { instant: event.detail === 0 });
      return;
    }
    const link = threadLink(event);
    const target = link && entries.get(link.dataset.thread);
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openLine(link.dataset.thread, { scroll: true, flash: true });
    target.toggle.focus({ preventScroll: true });
  });
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'mouse') setHovered(threadLink(event));
  });
  document.addEventListener('focusin', (event) => setHovered(threadLink(event)));
  document.addEventListener('focusout', (event) => {
    if (threadLink(event)) setHovered(null);
  });
  window.addEventListener('hashchange', () => applyHash(false));
  applyHash(true);
}
