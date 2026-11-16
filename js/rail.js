import { onFrame, requestFrame } from './scroll.js';
import { openLine } from './lines.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initRail() {
  const strip = document.querySelector('[data-rail-strip]');
  const cursor = document.querySelector('[data-rail-cursor]');
  const readout = document.querySelector('[data-rail-readout]');
  if (!strip) return;

  const chapterEls = [...document.querySelectorAll('[data-chapter]')];
  const lineEls = [...document.querySelectorAll('.line[data-line]')].filter((el) => el.querySelector('.line__year'));
  const ticks = new Map();
  strip.querySelectorAll('.rail__tick[data-tick]').forEach((tick) => ticks.set(tick.dataset.tick, tick));

  let stale = true;
  let stripWidth = 0;
  let chapters = [];
  let lines = [];
  let shownX = null;
  let shownText = null;
  let shownTick = null;

  function measureAll(y) {
    stripWidth = strip.getBoundingClientRect().width;
    chapters = chapterEls.map((el) => {
      const rect = el.getBoundingClientRect();
      const years = el.querySelector('.chapter__years')?.textContent ?? '';
      return { id: el.dataset.chapter, top: rect.top + y, bottom: rect.bottom + y, start: years.split(/\s+to\s+/)[0].trim() };
    });
    lines = lineEls.map((el) => ({
      id: el.dataset.line,
      top: el.getBoundingClientRect().top + y,
      year: el.querySelector('.line__year').textContent.trim(),
    }));
    stale = false;
  }

  document.addEventListener('lines:layout', () => {
    stale = true;
    requestFrame();
  });
  strip.addEventListener('click', (event) => {
    const tick = event.target instanceof Element ? event.target.closest('.rail__tick[data-tick]') : null;
    if (tick) openLine(tick.dataset.tick);
  });

  onFrame((f) => {
    if (stale || f.resized) measureAll(f.y);
    const centre = f.y + f.vh / 2;
    const count = chapters.length;

    let position = 0;
    let chapter = null;
    let past = false;
    if (count) {
      if (centre >= chapters[count - 1].bottom) {
        position = 1;
        past = true;
      } else {
        const index = chapters.findIndex((c) => centre < c.bottom);
        const c = chapters[index];
        if (centre >= c.top) {
          chapter = c;
          position = (index + clamp01((centre - c.top) / (c.bottom - c.top))) / count;
        }
      }
    }

    let current = null;
    for (const line of lines) {
      if (line.top >= centre) break;
      current = line;
    }
    const inOpen = chapter?.id === 'open';
    // inside the open chapter nothing is dated; after it the readout is empty
    const text = past ? '' : inOpen ? 'Not yet dated' : current ? current.year : chapter ? chapter.start : '';
    const x = Math.round(position * stripWidth * 100) / 100;
    const tickId = past || inOpen || !current ? null : current.id;

    return () => {
      if (cursor && x !== shownX) {
        cursor.style.transform = `translateX(${x}px)`;
        shownX = x;
      }
      if (readout && text !== shownText) {
        readout.textContent = text;
        shownText = text;
      }
      if (tickId !== shownTick) {
        ticks.get(shownTick)?.removeAttribute('data-current');
        ticks.get(tickId)?.setAttribute('data-current', '');
        shownTick = tickId;
      }
    };
  });
}
