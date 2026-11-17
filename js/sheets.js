// Slide-up sheets for chapter detail, the index and the sources. Built on <dialog> so
// focus trapping, Escape and the top layer come from the browser.
const CLOSE_MS = 720;

export function initSheets({ onJump, onPause }) {
  const root = document.documentElement;
  const sheets = new Map([...document.querySelectorAll('dialog[data-sheet]')].map((d) => [d.dataset.sheet, d]));
  let current = null;
  let closing = null;
  let leaving = null;

  function lock(on) {
    root.classList.toggle('is-locked', on);
    onPause?.(on);
  }

  function flash(el) {
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
  }

  function focusIn(dialog, id) {
    const target = id && dialog.querySelector(`#f-${CSS.escape(id)}`);
    const scroller = dialog.querySelector('[data-scroll]');
    if (!target || !scroller) {
      if (scroller) scroller.scrollTop = 0;
      return;
    }
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 96;
    scroller.scrollTo({ top, behavior: 'auto' });
    const more = target.querySelector('details');
    if (more) more.open = true;
    flash(target);
  }

  function open(name, focusId) {
    const d = sheets.get(name);
    if (!d) return;
    if (current === d) {
      focusIn(d, focusId);
      return;
    }
    if (current) {
      // swap sheets without dropping the lock
      const prev = current;
      prev.classList.remove('is-open');
      prev.classList.add('is-leaving');
      setTimeout(() => {
        prev.classList.remove('is-leaving');
        prev.close();
      }, CLOSE_MS);
    }
    if (closing) {
      // a close was still animating: finish it now
      clearTimeout(closing);
      closing = null;
      if (leaving && leaving !== d) leaving.close();
      leaving?.classList.remove('is-leaving');
      leaving = null;
    }
    d.classList.remove('is-leaving');
    if (!d.open) d.showModal();
    current = d;
    lock(true);
    focusIn(d, focusId);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
  }

  function close(after) {
    const d = current;
    if (!d) {
      after?.();
      return;
    }
    current = null;
    leaving = d;
    d.classList.remove('is-open');
    d.classList.add('is-leaving');
    const reduced = root.hasAttribute('data-reduced-motion');
    closing = setTimeout(() => {
      closing = null;
      leaving = null;
      d.classList.remove('is-leaving');
      d.close();
      lock(false);
      after?.();
    }, reduced ? 0 : CLOSE_MS);
  }

  sheets.forEach((d) => {
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    // a click on the backdrop area (outside the panel) closes
    d.addEventListener('click', (e) => {
      if (e.target === d) close();
    });
  });

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      open(opener.dataset.open, opener.dataset.focus);
      return;
    }
    if (e.target.closest('[data-close]')) {
      e.preventDefault();
      close();
      return;
    }
    const go = e.target.closest('[data-goto]');
    if (go) {
      e.preventDefault();
      const id = go.dataset.goto;
      const owner = document.getElementById(`f-${id}`)?.closest('dialog[data-sheet]');
      if (owner) open(owner.dataset.sheet, id);
      return;
    }
    const jump = e.target.closest('dialog [data-jump]');
    if (jump) {
      e.preventDefault();
      close(() => onJump(jump.dataset.jump));
    }
  });
}
