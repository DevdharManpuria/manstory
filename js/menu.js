import { afterFrames, prefersReducedMotion } from './scroll.js';

export function initMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;
  let isOpen = false;
  let timer = 0;

  function open() {
    clearTimeout(timer);
    isOpen = true;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    afterFrames(() => {
      if (isOpen) menu.setAttribute('data-open', '');
    });
    menu.querySelector('a')?.focus();
  }

  function close(restoreFocus) {
    if (!isOpen) return;
    isOpen = false;
    menu.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (prefersReducedMotion()) menu.hidden = true;
    else timer = setTimeout(() => { menu.hidden = true; }, 160);
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen ? close(false) : open()));
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) close(false);
  });
  menu.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !menu.contains(next) && next !== toggle) close(false);
  });
  document.addEventListener('click', (event) => {
    if (isOpen && event.target instanceof Node && !menu.contains(event.target) && !toggle.contains(event.target)) close(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) close(true);
  });
}
