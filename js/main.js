import { initScroll, prefersReducedMotion, watchReducedMotion } from './scroll.js';
import { initRecord } from './record.js';
import { initLines } from './lines.js';
import { initRail } from './rail.js';
import { initHero } from './hero.js';
import { initMenu } from './menu.js';

const root = document.documentElement;
root.classList.remove('no-js');
root.classList.add('js');

function guard(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`Dark Lines: ${name} failed`, error);
  }
}

function syncReducedMotion() {
  if (prefersReducedMotion()) root.setAttribute('data-reduced-motion', '');
  else root.removeAttribute('data-reduced-motion');
}

function initChapters() {
  const heads = new Map();
  document.querySelectorAll('.chapter').forEach((chapter) => {
    const head = chapter.querySelector('.chapter__head');
    if (!head) return;
    if (head.getBoundingClientRect().top > window.innerHeight) {
      chapter.setAttribute('data-armed', '');
      heads.set(head, chapter);
    } else {
      chapter.setAttribute('data-entered', '');
    }
  });
  if (!heads.size) return;
  const observer = new IntersectionObserver((records) => {
    records.forEach((record) => {
      if (!record.isIntersecting) return;
      heads.get(record.target)?.setAttribute('data-entered', '');
      observer.unobserve(record.target);
    });
  }, { threshold: 0.35 });
  heads.forEach((chapter, head) => observer.observe(head));
}

guard('reduced motion', () => {
  syncReducedMotion();
  watchReducedMotion(syncReducedMotion);
});
guard('scroll', initScroll);
guard('record', initRecord);
guard('lines', initLines);
guard('rail', initRail);
guard('hero', initHero);
guard('menu', initMenu);
guard('chapters', initChapters);

import('./diagrams/index.js')
  .then((m) => m.mountDiagrams({ reducedMotion: prefersReducedMotion() }))
  .catch(() => {});
