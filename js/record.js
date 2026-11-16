const KEY = 'darklines:opened';
const opened = new Set();
let total = 0;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...opened]));
  } catch {
    /* storage unavailable: the page works without it */
  }
}

function lineFor(id) {
  return [...document.querySelectorAll('.line[data-line]')].find((el) => el.dataset.line === id);
}

function paint(id) {
  const line = lineFor(id);
  if (line) line.setAttribute('data-seen', '');
  document.querySelectorAll('.close__line').forEach((el) => {
    if (el.dataset.tick === id) el.setAttribute('data-seen', '');
  });
}

function renderCount() {
  const out = document.querySelector('[data-record-count]');
  if (!out) return;
  const n = [...opened].filter((id) => lineFor(id)?.querySelector('.line__toggle')).length;
  out.textContent = n === 0
    ? 'You have not opened a line yet. Start with any one above.'
    : `You opened ${n} of ${total} lines.`;
}

export function seen() {
  return new Set(opened);
}

export function markSeen(id) {
  paint(id);
  if (opened.has(id)) return;
  opened.add(id);
  save();
  renderCount();
}

function initLabel() {
  const band = document.querySelector('[data-record-band]');
  const label = document.querySelector('[data-record-label]');
  if (!band || !label) return;
  function show(link) {
    const text = link.getAttribute('aria-label') || '';
    label.textContent = text;
    const stage = band.parentElement.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    const w = label.offsetWidth;
    const x = rect.left + rect.width / 2 - stage.left - w / 2;
    const max = Math.max(0, stage.width - w);
    label.style.transform = `translateX(${Math.min(max, Math.max(0, x))}px)`;
    label.setAttribute('data-active', '');
  }
  function hide() {
    const a = document.activeElement;
    if (a instanceof Element && a.matches('.close__line:focus-visible')) show(a);
    else {
      label.removeAttribute('data-active');
      setTimeout(() => { if (!label.hasAttribute('data-active')) label.textContent = ''; }, 180);
    }
  }
  const linkOf = (e) => (e.target instanceof Element ? e.target.closest('.close__line') : null);
  band.addEventListener('pointerover', (e) => { const l = linkOf(e); if (l && e.pointerType === 'mouse') show(l); });
  band.addEventListener('pointerout', (e) => { if (linkOf(e) && e.pointerType === 'mouse') hide(); });
  band.addEventListener('focusin', (e) => { const l = linkOf(e); if (l && l.matches(':focus-visible')) show(l); });
  band.addEventListener('focusout', () => queueMicrotask(hide));
}

export function initRecord() {
  initLabel();
  total = [...document.querySelectorAll('.line[data-line]')].filter((el) => el.querySelector('.line__toggle')).length;
  load().forEach((id) => {
    opened.add(id);
    paint(id);
  });
  renderCount();
}
