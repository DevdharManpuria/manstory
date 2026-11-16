# Dark Lines — build spec

Single-page site: a history of science laid out as a vertical solar spectrum.
The page scrolls from deep red (earliest counting) to past the visible (open
questions). Every discovery is a dark absorption line crossing the page
full-bleed; opening a line shows what it replaced, what it made possible, and
links to the lines it was built on and led to.

Static site. No framework, no npm dependencies. `node build.mjs` reads
`content/*.json` and writes `index.html`. `node serve.mjs` serves the folder on
http://127.0.0.1:4173.

## 1. Files and ownership

| Path | Owner task |
|---|---|
| `content/chapters.json`, `content/open.json` | CONTENT |
| `content/references.json` | FACTCHECK |
| `assets/fonts/*`, `assets/plates/*`, `content/plates.json`, `css/fonts.css` | ASSETS |
| `build.mjs`, `serve.mjs`, `package.json`, `css/tokens.css`, `css/base.css`, `css/hero.css`, `css/chapter.css`, `css/line.css`, `css/rail.css`, `css/close.css` | PAGE |
| `js/main.js`, `js/scroll.js`, `js/rail.js`, `js/lines.js`, `js/hero.js`, `js/menu.js`, `js/record.js` | INTERACTION |
| `js/diagrams/index.js`, `js/diagrams/*.js` | DIAGRAMS |

Never edit a file another task owns. `index.html` is generated; never hand-edit it.

## 2. Content schema

`content/chapters.json`: array of 10 chapters in order.

```json
{
  "id": "sky",                      // c-sky anchors
  "title": "Counting the sky",      // h2, 2-5 words, names a thing
  "years": "c. 20,000 BCE to 600 BCE",
  "nm": 700,                         // wavelength label
  "intro": ["paragraph", "paragraph"],   // 60-110 words total
  "handoff": "One sentence saying what this era handed to the next.",
  "diagramLabel": "Alt text for the chapter diagram",
  "lines": [
    {
      "id": "ishango",              // d-ishango anchors, unique site-wide
      "year": "c. 20,000 BCE",      // display string
      "sortYear": -20000,
      "title": "Notches on the Ishango bone",   // 3-8 words
      "weight": 1,                  // 1 minor, 2 major, 3 landmark (rule thickness)
      "summary": "One sentence, 25 words at most, always visible.",
      "replaced": "1-2 sentences: the belief or limit it overturned.",
      "enabled": "1-2 sentences: what later work it made possible.",
      "builtOn": ["other-line-id"],  // earlier lines only
      "plate": "ishango"            // optional key into plates.json
    }
  ]
}
```

`content/open.json`: `{ "title", "years": "Not yet dated", "intro": [..], "questions": [{ "id", "title", "text", "builtOn": [ids] }] }`.

`content/plates.json`: `{ "<key>": { "file": "assets/plates/x.webp", "w": 1600, "h": 1200, "alt": "...", "credit": "Author, source", "license": "Public domain", "source": "https://..." } }`.

`content/references.json`: `[{ "label": "Author, Title (Publisher, Year)", "url": "https://...", "lines": ["ids it supports"] }]`.

`ledTo` is derived at build time as the inverse of `builtOn`.

## 3. Chapters, colours, type width

Ground colours are OKLCH. `ink: light` means light text on the ground.
`wdth` is the Archivo width axis for that chapter's display type: wide at long
wavelengths, condensed at short ones.

| # | id | nm | ground | ink | wdth |
|---|---|---|---|---|---|
| hero | top | - | `oklch(0.13 0.02 25)` | light | 125 |
| 1 | sky | 700 | `oklch(0.40 0.16 25)` | light | 125 |
| 2 | reasons | 650 | `oklch(0.50 0.19 32)` | light | 118 |
| 3 | method | 610 | `oklch(0.74 0.17 58)` | dark | 110 |
| 4 | revolution | 580 | `oklch(0.89 0.17 96)` | dark | 102 |
| 5 | matter | 555 | `oklch(0.85 0.19 125)` | dark | 95 |
| 6 | life | 520 | `oklch(0.72 0.18 150)` | dark | 88 |
| 7 | quanta | 490 | `oklch(0.79 0.12 200)` | dark | 80 |
| 8 | machines | 465 | `oklch(0.48 0.17 255)` | light | 74 |
| 9 | space | 445 | `oklch(0.35 0.16 264)` | light | 68 |
| 10 | code | 425 | `oklch(0.26 0.13 270)` | light | 64 |
| 11 | open | <380 | `oklch(0.13 0.03 272)` | light | 62 |

Ink tokens, set per chapter from `data-ink`:

- dark ink: `--ink: oklch(0.17 0.03 var(--hue))`, `--ink-2: oklch(0.17 0.03 var(--hue) / 0.72)`, `--rule: oklch(0.12 0.02 var(--hue))`.
- light ink: `--ink: oklch(0.97 0.02 var(--hue))`, `--ink-2: oklch(0.97 0.02 var(--hue) / 0.78)`, `--rule: oklch(0.08 0.02 var(--hue))`.
- chapter 11 and the hero: rules are bright (`--rule: oklch(0.97 0.02 90)`), emission lines on a dark ground.

Every text/ground pair must reach 4.5:1 (3:1 for display type). Secondary text
is the ink at reduced alpha, never grey. No violet or lavender anywhere; the
short end stays on hue 264-272.

An opened line panel is a black band: ground `oklch(0.11 0.02 var(--hue))`,
text `oklch(0.96 0.02 var(--hue))`, accents in the chapter's own ground colour.

## 4. Type

- Display and labels: **Archivo** variable (wght 100-900, wdth 62-125), self-hosted.
  Chapter titles: weight 700, `font-stretch` from the table, size
  `clamp(2.75rem, 8.5vw, 6rem)`, line-height 0.95, tracking -0.02em,
  `text-wrap: balance`.
- Body: **STIX Two Text** variable, roman and italic, self-hosted. 1.1875rem /
  1.55 on desktop, 1.0625rem on phones, measure max 64ch.
- Labels (years, nm, links, buttons): Archivo 500, wdth 100, 0.9375rem,
  `font-variant-numeric: tabular-nums`. Sentence case. No all-caps labels,
  no monospace, no letter-spaced kickers, no eyebrow above a heading.
- h1 max 6rem. Tracking never below -0.04em.

## 5. Layout

- `.wrap`: `width: min(100% - 2 * var(--gutter), 78rem); margin-inline: auto`.
  `--gutter: clamp(1.25rem, 5vw, 4rem)`. Left and right content edges are equal
  everywhere. 12-column grid inside `.wrap` from 900px up; one column below.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 112, 168px. More space above a
  heading than below.
- No cards, no rounded rectangles, no drop shadows, no glass, no gradient text.
  The only gradients are the spectrum itself. Corners are square.
- Faint lines: the build scatters 5-9 unlabelled hairlines (`.faint`, 1px,
  rule colour at 0.10-0.28 alpha, `aria-hidden`) through each chapter and each
  fade, at seeded pseudo-random offsets, as a real spectrum has.

### DOM contract (build.mjs output; CSS and JS both rely on it)

```html
<html lang="en" class="no-js">   <!-- js/main.js swaps to class="js" first thing -->
<body>
<a class="skip" href="#main">Skip to the first chapter</a>

<header class="rail" data-rail>
  <a class="rail__name" href="#top">Dark Lines</a>
  <div class="rail__strip" data-rail-strip>            <!-- inline style: linear-gradient(to right in oklch, ...) -->
    <a class="rail__tick" href="#d-newton" data-tick="newton" data-weight="3" style="--x:43.2%" aria-label="1687: Newton's Principia"></a>
    ...
    <span class="rail__cursor" data-rail-cursor aria-hidden="true"></span>
  </div>
  <span class="rail__readout" data-rail-readout aria-hidden="true">c. 20,000 BCE</span>
  <button class="rail__menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="chapters">Chapters</button>
</header>

<nav class="menu" id="chapters" data-menu aria-label="Chapters" hidden>
  <ol class="menu__list">
    <li><a class="menu__link" href="#c-sky" style="--ground:..."><span class="menu__years">c. 20,000 BCE to 600 BCE</span><span class="menu__title">Counting the sky</span></a></li>
  </ol>
</nav>

<main id="main">
<section class="hero" id="top" data-hero>
  <div class="hero__stick">
    <div class="wrap hero__copy">
      <h1 class="hero__title">...</h1>
      <p class="hero__lede">...</p>
      <a class="btn" href="#c-sky">Start at the red end</a>
    </div>
    <div class="hero__beam" aria-hidden="true"></div>
    <div class="hero__band" data-hero-band aria-hidden="true">   <!-- same gradient + same --x ticks as the rail -->
      <span class="hero__line" data-weight="2" style="--x:12.1%"></span> ...
    </div>
  </div>
</section>

<section class="chapter" id="c-sky" data-chapter="sky" data-ink="light" style="--ground:...;--ground-next:...;--hue:25;--wdth:125">
  <div class="wrap chapter__head">
    <h2 class="chapter__title"><span class="word"><span>Counting</span></span> <span class="word"><span>the</span></span> ...</h2>
    <p class="chapter__span"><span class="chapter__years">c. 20,000 BCE to 600 BCE</span><span class="chapter__nm">700 nm</span></p>
    <figure class="chapter__figure"><canvas class="diagram" data-diagram="sky" role="img" aria-label="..."></canvas></figure>
    <div class="chapter__intro"><p>...</p></div>
  </div>
  <ol class="lines">
    <li class="line" id="d-ishango" data-line="ishango" data-weight="1" data-built-on="" data-led-to="plimpton">
      <span class="line__rule" aria-hidden="true"></span>
      <div class="wrap line__row">
        <h3 class="line__head">
          <button class="line__toggle" type="button" aria-expanded="false" aria-controls="p-ishango">
            <span class="line__year">c. 20,000 BCE</span>
            <span class="line__title">Notches on the Ishango bone</span>
            <span class="line__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>
          </button>
        </h3>
        <p class="line__summary">...</p>
      </div>
      <div class="line__panel" id="p-ishango" data-panel>
        <div class="line__panel-clip">
          <div class="wrap line__panel-inner">
            <div class="line__text">
              <h4>What it replaced</h4><p>...</p>
              <h4>What it made possible</h4><p>...</p>
            </div>
            <figure class="plate"><img src="assets/plates/ishango.webp" width="1600" height="1200" alt="..." loading="lazy" decoding="async"></figure>
            <div class="line__links">
              <p class="line__links-row"><span class="line__links-label">Built on</span> <a class="thread" href="#d-x" data-thread="x">1609, Kepler's ellipses</a> ...</p>
              <p class="line__links-row"><span class="line__links-label">Led to</span> <a class="thread" href="#d-y" data-thread="y">...</a></p>
            </div>
          </div>
        </div>
      </div>
    </li>
  </ol>
  <p class="wrap chapter__handoff">...</p>
  <div class="chapter__fade" aria-hidden="true"></div>
</section>
... chapters 2-10 ...

<section class="chapter chapter--open" id="c-open" data-chapter="open" data-ink="light" style="...">
  <!-- same head; then -->
  <ol class="lines lines--open">
    <li class="line line--open" id="q-dark-matter" data-line="q-dark-matter" data-built-on="...">
      <span class="line__rule" aria-hidden="true"></span>
      <div class="wrap line__row"><h3 class="line__head line__head--static">...</h3><p class="line__summary">...</p>
      <p class="line__links-row">...Built on links...</p></div>
    </li>
  </ol>
</section>

<section class="close" id="close" data-close>
  <div class="wrap">
    <h2 class="close__title">...</h2>
    <p class="close__count" data-record-count></p>      <!-- JS fills: "You opened 7 of 46 lines." -->
  </div>
  <div class="close__band" data-record-band aria-hidden="true">...same ticks as hero band, class close__line, data-tick...</div>
  <div class="wrap"><a class="btn" href="#top">Return to the red end</a></div>
</section>

<section class="sources" id="sources">
  <div class="wrap">
    <h2>Sources and further reading</h2>
    <ol class="sources__list">...</ol>
    <h3>Plates</h3>
    <ul class="sources__plates">...</ul>
  </div>
</section>
</main>
<footer class="foot"><div class="wrap">...</div></footer>
<script type="module" src="js/main.js"></script>
```

Rules of the contract:

- Rail gradient: 12 equal segments (hero excluded; chapters 1-11), each a
  chapter's ground colour, blended with `in oklch`. A tick's `--x` is its
  segment start plus `(index + 1) / (count + 1)` of the segment width.
- `.no-js`: every panel is open and visible, no entrance animation, rail shown.
- `.js`: panels are closed (`aria-expanded="false"`); the panel is `inert`
  while closed.
- No plate: the `figure.plate` is omitted and the text takes the width.
- No captions under plates. Plates are named in alt text and credited once in
  `#sources`.

### Composition

- Hero: `.hero` is 170vh tall; `.hero__stick` is sticky, 100vh (use `100svh`).
  Copy sits in the upper two thirds, left-aligned on the wrap edge. The band is
  full-bleed, 26vh tall, at the bottom of the first screen, on a near-black
  ground. On phones the band is 18vh.
- Chapter head: desktop grid. Title spans columns 1-9. `.chapter__span` sits
  under the title, columns 1-6. Figure occupies columns 8-12, starting level
  with the intro, square, max 26rem. Intro occupies columns 1-6. On phones:
  title, span, figure (full wrap width, 4:3), intro. Padding top 168px, 112px
  on phones.
- Lines: `.line__rule` is full-bleed, absolutely positioned at the top of the
  `li`, height by weight: 1 → 2px, 2 → 5px, 3 → 11px. Row padding 24px top,
  32px bottom. Desktop: year in columns 1-2, title in columns 3-9 (Archivo 600,
  chapter wdth, `clamp(1.375rem, 2.4vw, 2rem)`), icon at column 12, summary
  under the title in columns 3-8. Phones: year above title, icon top right.
  The whole toggle is at least 44px tall.
- Panel inner: text columns 3-8, plate columns 9-12 (or below on phones),
  links under the text. Padding 48px top and bottom.
- Plates sit on the black panel as greyscale images
  (`filter: grayscale(1) contrast(1.05)`), with `mix-blend-mode: screen`
  dropped if it harms legibility. Max height 60vh, `object-fit: contain`.
- `.chapter__handoff`: Archivo 600, chapter wdth, `clamp(1.5rem, 3.2vw, 2.5rem)`,
  max 22ch per line roughly (max-width 26em), 112px above.
- `.chapter__fade`: 70vh, `linear-gradient(to bottom in oklch, var(--ground), var(--ground-next))`.
  The chapter itself has `background: var(--ground)`.
- Close: the full band again, 40vh, full-bleed, with opened lines drawn solid
  and unopened ones at 0.3 alpha.

## 6. Motion

Tokens: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`,
`--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`. Animate only `transform`,
`opacity`, `clip-path`, `filter` (panel height via `grid-template-rows` is the
one exception). Never `transition: all`. Never `ease-in`. Never from
`scale(0)`. Hover effects only inside `@media (hover: hover) and (pointer: fine)`.
No scroll-jacking and no smooth-scroll library: native scrolling only. Body
text is never parallaxed and never hidden waiting for scroll.

1. **Hero entrance** (CSS, once, on load, `animation-fill-mode: backwards`):
   beam is a 1px light line across the viewport at the band's vertical centre,
   `scaleX(0→1)` from the left, 520ms `--ease-in-out`; band
   `clip-path: inset(0 100% 0 0)` → `inset(0)`, 760ms `--ease-out`, delay 380ms;
   hero lines fade in `opacity 0→1` + `scaleY(0.6→1)`, 300ms, delays stepping
   non-uniformly 18-34ms from left to right starting at 700ms; title lines rise
   `translateY(0.4em)` + opacity, 640ms `--ease-out`, delays 80/170/240ms;
   lede and button opacity only, delay 420ms.
2. **Docking** (scroll-linked, `js/hero.js`): as the hero scrolls from 0 to
   70vh, the band translates up and `scaleY` shrinks so that at the end it sits
   exactly where `.rail__strip` is, at the strip's height; then the rail
   (hidden above the viewport, `translateY(-100%)`) takes over with no visible
   jump. The hero copy fades out over the first 35vh (`opacity`, plus
   `filter: blur(0→6px)`). Write `transform` on the elements directly; no CSS
   variables on ancestors.
3. **Rail**: cursor moves with `transform: translateX()` only. Readout shows
   the `year` of the last line whose top has passed the viewport centre (the
   chapter's first year before any). Update text only when it changes. Ticks:
   hover grows `scaleY(1.9)` 140ms.
4. **Chapter title** (once, IntersectionObserver at 35%): each `.word > span`
   rises from `translateY(105%)` inside its overflow-hidden `.word`, 720ms
   `--ease-out`, delays 0/60/110/150ms. Visible by default with no JS.
5. **Line hover** (fine pointers): rule `scaleY(1.6)` from top, 160ms; title
   `translateX(6px)` 200ms `--ease-out`. Press: row `scale(0.995)` 120ms.
6. **Line open**: panel `grid-template-rows: 0fr → 1fr`, 440ms `--ease-in-out`;
   inner `opacity 0→1` and `filter: blur(4px→0)`, 320ms `--ease-out`, delay
   90ms; icon rotates 45deg, 260ms. Close is faster: 280ms, no delay. Uses CSS
   transitions so it is interruptible. Opening by keyboard is instant when
   `event.detail === 0` (keyboard-initiated actions are not animated).
7. **Threads** (connections): while a line is open, or a `.thread` link is
   hovered or focused, the matching rail ticks get `data-thread="built"` or
   `"led"` and stand taller and brighter. Clicking a `.thread` scrolls to the
   target line (native `scrollIntoView`, `behavior: smooth` unless reduced
   motion), opens it, and flashes it: `.line[data-flash]` sweeps a light
   highlight across the rule with `clip-path`, 900ms `--ease-out`, once.
8. **Diagrams**: scrubbed by scroll progress through the chapter head, eased
   toward the target each frame with a critically damped lerp (mass, no
   instant jumps). Canvases draw only while on screen.
9. **Reduced motion**: no docking transform (the band scrolls away normally and
   the rail fades in), no entrances beyond a 200ms opacity fade, panels open
   with opacity only, diagrams drawn complete and still, smooth scroll off.

## 7. Behaviour

- `location.hash` `#d-<id>` on load or change: open that line and scroll to it.
  Opening a line updates the hash with `history.replaceState`.
- Opened line ids persist in `localStorage` under `darklines:opened`
  (wrapped in try/catch; the page works without it). `.line[data-seen]` marks
  them; the close band draws them; the count sentence reports them.
- Menu: a popover from the top right, `transform-origin: top right`,
  `scale(0.96)` + opacity, 180ms in, 140ms out. Escape closes and returns
  focus to the toggle. Clicking a link closes it. On phones it is a full-width
  sheet under the rail.
- Keyboard: every toggle, tick, thread and menu link is reachable; focus ring
  is 2px solid in the current ink colour with 3px offset, never hidden under
  the rail (`scroll-margin-top` on targets = rail height + 24px).
- Browser surfaces: `::selection` uses the ink colour as background and the
  ground as text; `scrollbar-color` set from the palette; `accent-color` and
  `caret-color` set.
- Rail height: 44px on desktop, 40px on phones; strip is 10px tall, vertically
  centred, between the name and the readout. On phones the name is hidden and
  the strip takes the width.

## 8. Diagram module contract

`js/diagrams/index.js` exports `mountDiagrams({ reducedMotion })`. It finds
every `canvas[data-diagram]`, sizes it for `devicePixelRatio` (capped at 2),
and calls the drawing function for that id each frame while visible:

```js
draw(ctx, { w, h, p, t, ink, accent })
// p: 0..1 scroll progress (smoothed), t: seconds since mount, ink/accent: CSS colours read from the chapter
```

All drawings are line drawings in the chapter's ink colour, 1.25px strokes,
round joins, no fills except small dots, no text set in canvas except single
letters or numerals in Archivo. They are diagrams of the real thing, not
decoration.

## 9. Acceptance

- `node build.mjs` runs clean and `index.html` validates (no duplicate ids).
- No console errors. No horizontal scroll at 320, 390, 768, 1024, 1440.
- Works with JS off (all content readable) and with reduced motion.
- No layout shift from fonts or plates (`font-display: swap` with metric-close
  fallbacks; `width`/`height` on images).
- Lighthouse-style basics: one h1, heading levels in order, alt text, labelled
  controls, 44px touch targets.
