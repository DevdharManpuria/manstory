#!/usr/bin/env node
// Dark Lines: static page generator. Zero dependencies.
// Usage: node build.mjs [--content <dir>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, posix, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// ---------- arguments ----------
const argv = process.argv.slice(2);
let contentDir = 'content';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--content' && argv[i + 1]) contentDir = argv[++i];
}
const CONTENT = resolve(ROOT, contentDir);

function fail(msg) {
  console.error(`build error: ${msg}`);
  process.exit(1);
}
function readJson(name, fallback, required = false) {
  const p = resolve(CONTENT, name);
  if (!existsSync(p)) {
    if (required) fail(`missing ${p}`);
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`${name} is not valid JSON: ${e.message}`);
  }
}

// ---------- SPEC section 3 table ----------
const TABLE = {
  sky:        { ground: 'oklch(0.40 0.16 25)',  ink: 'light', wdth: 125 },
  reasons:    { ground: 'oklch(0.50 0.19 32)',  ink: 'light', wdth: 118 },
  method:     { ground: 'oklch(0.74 0.17 58)',  ink: 'dark',  wdth: 110 },
  revolution: { ground: 'oklch(0.89 0.17 96)',  ink: 'dark',  wdth: 102 },
  matter:     { ground: 'oklch(0.85 0.19 125)', ink: 'dark',  wdth: 95 },
  life:       { ground: 'oklch(0.72 0.18 150)', ink: 'dark',  wdth: 88 },
  quanta:     { ground: 'oklch(0.79 0.12 200)', ink: 'dark',  wdth: 80 },
  machines:   { ground: 'oklch(0.48 0.17 255)', ink: 'light', wdth: 74 },
  space:      { ground: 'oklch(0.35 0.16 264)', ink: 'light', wdth: 68 },
  code:       { ground: 'oklch(0.26 0.13 270)', ink: 'light', wdth: 64 },
  open:       { ground: 'oklch(0.13 0.03 272)', ink: 'light', wdth: 62 },
};
const CLOSE_GROUND = 'oklch(0.11 0.02 272)';
const THEME_COLOR = '#171011'; // approx oklch(0.13 0.02 25)

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
const hueOf = (oklch) => Number(oklch.replace(')', '').trim().split(/\s+/).pop());
const lightnessOf = (oklch) => Number(oklch.match(/oklch\(\s*([\d.]+)/)[1]);
const pct = (n) => `${+n.toFixed(2)}%`;

function faints(rng, count, yMin, yMax) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const y = yMin + rng() * (yMax - yMin);
    const a = 0.1 + rng() * 0.18;
    out += `<span class="faint" aria-hidden="true" style="--y:${pct(y)};--a:${a.toFixed(2)}"></span>`;
  }
  return out;
}
function between(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

const ARROW_RIGHT =
  '<svg class="btn__arrow" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M3 12h16M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>';
const ARROW_UP =
  '<svg class="btn__arrow" data-up viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 21V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>';

// ---------- load + validate ----------
const chapters = readJson('chapters.json', null, true);
const open = readJson('open.json', null, true);
const plates = readJson('plates.json', {});
const references = readJson('references.json', []);

if (!Array.isArray(chapters) || !chapters.length) fail('chapters.json must be a non-empty array');

const seen = new Map(); // id -> kind
const lineById = new Map();
function claim(id, where) {
  if (!id) fail(`empty id in ${where}`);
  if (seen.has(id)) fail(`duplicate id "${id}" (${where}; first seen in ${seen.get(id)})`);
  seen.set(id, where);
}
for (const c of chapters) {
  claim(c.id, 'chapter');
  if (!TABLE[c.id]) fail(`chapter id "${c.id}" is not in the colour table (SPEC section 3)`);
  if (c.id === 'open') fail('chapters.json must not contain the "open" chapter');
  for (const l of c.lines || []) {
    claim(l.id, `line in chapter ${c.id}`);
    lineById.set(l.id, { line: l, chapter: c });
  }
}
for (const q of open.questions || []) claim(q.id, 'open question');
for (const c of chapters) {
  for (const l of c.lines || []) {
    for (const b of l.builtOn || []) {
      if (!lineById.has(b)) fail(`line "${l.id}" is built on unknown id "${b}"`);
    }
  }
}
for (const q of open.questions || []) {
  for (const b of q.builtOn || []) {
    if (!lineById.has(b)) fail(`question "${q.id}" is built on unknown id "${b}"`);
  }
}

// derived ledTo (lines only)
const ledTo = new Map();
for (const c of chapters) {
  for (const l of c.lines || []) {
    for (const b of l.builtOn || []) {
      if (!ledTo.has(b)) ledTo.set(b, []);
      ledTo.get(b).push(l.id);
    }
  }
}
const bySort = (a, b) => lineById.get(a).line.sortYear - lineById.get(b).line.sortYear;

// ---------- spectrum geometry ----------
const allChapters = [
  ...chapters.map((c) => ({ ...c, kind: 'chapter' })),
  {
    id: 'open', kind: 'open', title: open.title, years: open.years || 'Not yet dated',
    intro: open.intro || [], lines: (open.questions || []).map((q) => ({ ...q, _q: true })),
  },
];
const N = allChapters.length;
const segW = 100 / N;
const ticks = []; // { id, href, x, weight, label, tone, open }
allChapters.forEach((c, ci) => {
  const t = TABLE[c.id];
  const gl = lightnessOf(t.ground);
  const hue = hueOf(t.ground);
  const n = c.lines.length;
  c.lines.forEach((l, i) => {
    const x = ci * segW + ((i + 1) / (n + 1)) * segW;
    // dated lines are always dark: a near-black tinted to the local hue, darker than the ground.
    // Only the undated questions are bright.
    const tone = l._q ? 'bright' : 'dark';
    const lc = `oklch(${gl < 0.3 ? 0.04 : gl < 0.45 ? 0.06 : 0.08} 0.03 ${hue})`;
    ticks.push({
      lc,
      closeLabel: l._q ? l.title : `${l.year}: ${l.title}`,
      id: l.id,
      href: l._q ? `#q-${l.id}` : `#d-${l.id}`,
      x,
      weight: l._q ? 2 : l.weight || 1,
      label: l._q ? `Open question: ${l.title}` : `${l.year}: ${l.title}`,
      tone,
    });
  });
});
const gradientStops = [];
allChapters.forEach((c, ci) => {
  const g = TABLE[c.id].ground;
  const a = ci === 0 ? 0 : ci * segW + segW * 0.2;
  const b = ci === N - 1 ? 100 : ci * segW + segW * 0.8;
  gradientStops.push(`${g} ${pct(a)}`, `${g} ${pct(b)}`);
});
const GRADIENT = `linear-gradient(to right in oklch, ${gradientStops.join(', ')})`;

// seeded stepping for hero entrance delays (non-uniform 18-34ms)
const heroRng = mulberry32(seedFrom('hero'));
let heroDelay = 700;
const heroDelays = ticks.map(() => {
  const d = heroDelay;
  heroDelay += 18 + Math.round(heroRng() * 16);
  return d;
});

// ---------- fonts preload ----------
function fontPreloads() {
  const p = resolve(ROOT, 'css/fonts.css');
  if (!existsSync(p)) return '';
  const css = readFileSync(p, 'utf8');
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+\.woff2?)['"]?\s*\)/gi)].map((m) => m[1]);
  const pick = (re) => urls.find((u) => re.test(u));
  const wanted = [pick(/archivo/i), pick(/stix[^/]*?(?<!italic)\.woff2?$/i) || pick(/stix/i)].filter(Boolean);
  return [...new Set(wanted)]
    .map((u) => {
      const href = posix.normalize(posix.join('css', u));
      const type = extname(u) === '.woff' ? 'font/woff' : 'font/woff2';
      return `<link rel="preload" href="${esc(href)}" as="font" type="${type}" crossorigin>`;
    })
    .join('\n');
}

// ---------- fragments ----------
function threadLinks(ids) {
  return ids
    .slice()
    .sort(bySort)
    .map((id) => {
      const { line } = lineById.get(id);
      return `<a class="thread" href="#d-${esc(id)}" data-thread="${esc(id)}">${esc(line.year)}, ${esc(line.title)}</a>`;
    })
    .join(' ');
}
function linksRow(label, ids) {
  if (!ids.length) return '';
  return `<p class="line__links-row"><span class="line__links-label">${label}</span> ${threadLinks(ids)}</p>`;
}
function words(title) {
  return String(title)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `<span class="word"><span>${esc(w)}</span></span>`)
    .join(' ');
}
function paragraphs(arr) {
  return (arr || []).map((p) => `<p>${esc(p)}</p>`).join('\n');
}

function renderLine(l) {
  const built = (l.builtOn || []).slice().sort(bySort);
  const led = (ledTo.get(l.id) || []).slice().sort(bySort);
  const plate = plates[l.plate || l.id] || null;
  const plateHtml = plate
    ? `<figure class="plate"><img src="${esc(plate.file)}" width="${esc(plate.w)}" height="${esc(plate.h)}" alt="${esc(plate.alt)}" loading="lazy" decoding="async"></figure>`
    : '';
  const w = [1, 2, 3].includes(l.weight) ? l.weight : 1;
  return `<li class="line" id="d-${esc(l.id)}" data-line="${esc(l.id)}" data-weight="${w}" data-built-on="${esc(built.join(','))}" data-led-to="${esc(led.join(','))}">
<span class="line__rule" aria-hidden="true"></span>
<div class="wrap line__row">
<h3 class="line__head">
<button class="line__toggle" type="button" aria-expanded="false" aria-controls="p-${esc(l.id)}">
<span class="line__year">${esc(l.year)}</span>
<span class="line__title">${esc(l.title)}</span>
<span class="line__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>
</button>
</h3>
<p class="line__summary">${esc(l.summary)}</p>
</div>
<div class="line__panel" id="p-${esc(l.id)}" data-panel>
<div class="line__panel-clip">
<div class="wrap line__panel-inner">
<div class="line__text">
<h4>What it replaced</h4>
<p>${esc(l.replaced)}</p>
<h4>What it made possible</h4>
<p>${esc(l.enabled)}</p>
</div>
${plateHtml}
<div class="line__links">
${linksRow('Built on', built)}
${linksRow('Led to', led)}
</div>
</div>
</div>
</div>
</li>`;
}

function renderQuestion(q) {
  const built = (q.builtOn || []).slice().sort(bySort);
  return `<li class="line line--open" id="q-${esc(q.id)}" data-line="q-${esc(q.id)}" data-built-on="${esc(built.join(','))}">
<span class="line__rule" aria-hidden="true"></span>
<div class="wrap line__row">
<h3 class="line__head line__head--static">${esc(q.title)}</h3>
<p class="line__summary">${esc(q.text)}</p>
${linksRow('Built on', built)}
</div>
</li>`;
}

function chapterStyle(c, i) {
  const t = TABLE[c.id];
  const next = allChapters[i + 1];
  const nextGround = next ? TABLE[next.id].ground : CLOSE_GROUND;
  return `--ground:${t.ground};--ground-next:${nextGround};--hue:${hueOf(t.ground)};--wdth:${t.wdth}`;
}

function renderChapter(c, i) {
  const t = TABLE[c.id];
  const rng = mulberry32(seedFrom(c.id));
  const isOpen = c.kind === 'open';
  const nm = isOpen ? 'Below 380 nm' : `${c.nm} nm`;
  const label = isOpen
    ? 'A spectrum fading past the visible edge'
    : c.diagramLabel || `Diagram for ${c.title}`;
  const chapFaints = faints(rng, between(rng, 5, 9), 4, 92);
  const fadeFaints = faints(rng, between(rng, 2, 4), 6, 94);
  const lines = isOpen
    ? `<ol class="lines lines--open">\n${c.lines.map(renderQuestion).join('\n')}\n</ol>`
    : `<ol class="lines">\n${c.lines.map(renderLine).join('\n')}\n</ol>`;
  const handoff = !isOpen && c.handoff ? `<p class="wrap chapter__handoff">${esc(c.handoff)}</p>` : '';
  return `<section class="chapter${isOpen ? ' chapter--open' : ''}" id="c-${esc(c.id)}" data-chapter="${esc(c.id)}" data-ink="${t.ink}" style="${chapterStyle(c, i)}">
<div class="wrap chapter__head">
<h2 class="chapter__title">${words(c.title)}</h2>
<p class="chapter__span"><span class="chapter__years">${esc(c.years)}</span><span class="chapter__nm">${esc(nm)}</span></p>
<figure class="chapter__figure"><canvas class="diagram" data-diagram="${esc(c.id)}" role="img" aria-label="${esc(label)}"></canvas></figure>
<div class="chapter__intro">
${paragraphs(c.intro)}
</div>
</div>
<div class="chapter__faints" aria-hidden="true">${chapFaints}</div>
${lines}
${handoff}
<div class="chapter__fade" aria-hidden="true">${fadeFaints}</div>
</section>`;
}

// ---------- page ----------
const favicon = (() => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g"><stop offset="0" stop-color="#9b1b1b"/><stop offset=".35" stop-color="#e8a317"/><stop offset=".65" stop-color="#3fb37a"/><stop offset="1" stop-color="#1b3f9b"/></linearGradient></defs><rect x="0" y="8" width="32" height="16" fill="url(#g)"/><rect x="10" y="8" width="3" height="16" fill="#120d0d"/><rect x="21" y="8" width="2" height="16" fill="#120d0d"/></svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

const DESCRIPTION =
  'A history of science drawn as the Sun’s spectrum, where every dark line is something we learned.';
const TITLE = 'Dark Lines: a history of science';

const tickHtml = ticks
  .map(
    (t) =>
      `<a class="rail__tick" href="${esc(t.href)}" data-tick="${esc(t.id)}" data-weight="${t.weight}" data-tone="${t.tone}" style="--x:${pct(t.x)};--lc:${t.lc}" aria-label="${esc(t.label)}"></a>`
  )
  .join('\n');
const heroLines = ticks
  .map(
    (t, i) =>
      `<span class="hero__line" data-weight="${t.weight}" data-tone="${t.tone}" style="--x:${pct(t.x)};--lc:${t.lc};--d:${heroDelays[i]}ms"></span>`
  )
  .join('');
const closeLines = ticks
  .map(
    (t) =>
      `<a class="close__line" href="${esc(t.href)}" data-tick="${esc(t.id)}" data-weight="${t.weight}" data-tone="${t.tone}" style="--x:${pct(t.x)};--lc:${t.lc}" aria-label="${esc(t.closeLabel)}"></a>`
  )
  .join('');

const menuItems = allChapters
  .map(
    (c) =>
      `<li><a class="menu__link" href="#c-${esc(c.id)}" data-ink="${TABLE[c.id].ink}" style="--ground:${TABLE[c.id].ground};--hue:${hueOf(TABLE[c.id].ground)};--wdth:${TABLE[c.id].wdth}"><span class="menu__title">${esc(c.title)}</span><span class="menu__years">${esc(c.years)}</span></a></li>`
  )
  .join('\n');

// sources
const refsHtml = references.length
  ? `<ol class="sources__list">\n${references
      .map((r) => `<li><a href="${esc(r.url)}" rel="noopener">${esc(r.label)}</a></li>`)
      .join('\n')}\n</ol>`
  : '';
const plateLines = [];
for (const c of chapters)
  for (const l of c.lines || [])
    if (plates[l.plate || l.id]) plateLines.push({ l, p: plates[l.plate || l.id] });
const platesHtml = plateLines.length
  ? `<h3>Plates</h3>\n<ul class="sources__plates">\n${plateLines
      .map(
        ({ l, p }) =>
          `<li><a href="${esc(p.source)}" rel="noopener">${esc(l.year)}, ${esc(l.title)}</a>: ${esc(p.credit)}, ${esc(p.license)}</li>`
      )
      .join('\n')}\n</ul>`
  : '';

const heroTitle = ['A history of science,', 'read like', 'sunlight']
  .map((s, i) => `<span class="hero__tl" style="--i:${i}">${esc(s)}</span>`)
  .join(' ');

const html = `<!doctype html>
<html lang="en" class="no-js">
<head>
<script>document.documentElement.className=document.documentElement.className.replace('no-js','js')</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESCRIPTION)}">
<meta name="theme-color" content="${THEME_COLOR}">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESCRIPTION)}">
<meta property="og:type" content="website">
<link rel="icon" href="${favicon}">
${fontPreloads()}
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/rail.css">
<link rel="stylesheet" href="css/hero.css">
<link rel="stylesheet" href="css/chapter.css">
<link rel="stylesheet" href="css/line.css">
<link rel="stylesheet" href="css/close.css">
</head>
<body>
<a class="skip" href="#main">Skip to the first chapter</a>

<header class="rail" data-rail>
<a class="rail__name" href="#top">Dark Lines</a>
<div class="rail__strip" data-rail-strip style="background:${GRADIENT}">
${tickHtml}
<span class="rail__cursor" data-rail-cursor aria-hidden="true"></span>
</div>
<span class="rail__readout" data-rail-readout aria-hidden="true">${esc(allChapters[0].lines[0]?.year ?? '')}</span>
<button class="rail__menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="chapters">Chapters</button>
</header>

<nav class="menu" id="chapters" data-menu aria-label="Chapters" hidden>
<ol class="menu__list">
${menuItems}
</ol>
</nav>

<main id="main">
<section class="hero" id="top" data-hero>
<div class="hero__stick">
<div class="wrap hero__copy">
<h1 class="hero__title">${heroTitle}</h1>
<p class="hero__lede">In 1814 Joseph von Fraunhofer mapped 574 dark lines in the Sun’s spectrum and could not say what they were; in 1859 they turned out to be a record of what the Sun is made of. This page uses his chart: it runs from red to the edge of the visible, and each dark line is something we learned.</p>
<a class="btn" href="#c-${esc(allChapters[0].id)}"><span>Start at the red end</span>${ARROW_RIGHT}</a>
</div>
<div class="hero__beam" aria-hidden="true"></div>
<div class="hero__band" data-hero-band aria-hidden="true" style="background:${GRADIENT}">
${heroLines}
</div>
</div>
</section>

${allChapters.map(renderChapter).join('\n\n')}

<section class="close" id="close" data-close>
<div class="wrap close__head">
<h2 class="close__title">Every line so far</h2>
<p class="close__text">Each line on this band is one entry above. The ones you opened are drawn in full. The five bright lines at the dark end are the questions nobody has dated yet.</p>
<p class="close__count" data-record-count></p>
</div>
<div class="close__stage">
<p class="close__label" data-record-label aria-hidden="true"></p>
<div class="close__band" data-record-band style="background:${GRADIENT}">
${closeLines}
</div>
</div>
<div class="wrap close__foot"><a class="btn" href="#top"><span>Return to the red end</span>${ARROW_UP}</a></div>
</section>

<section class="sources" id="sources">
<div class="wrap">
<h2>Sources and further reading</h2>
${refsHtml}
${platesHtml}
</div>
</section>
</main>
<footer class="foot"><div class="wrap"><p>Dark Lines. Plates from Wikimedia Commons and NASA; details under <a href="#sources">Sources</a>.</p></div></footer>
<script type="module" src="js/main.js"></script>
</body>
</html>
`;

writeFileSync(resolve(ROOT, 'index.html'), html);
const lineCount = chapters.reduce((n, c) => n + (c.lines || []).length, 0);
console.log(`built index.html from ${contentDir}: ${chapters.length + 1} chapters, ${lineCount} lines, ${(open.questions || []).length} questions`);
