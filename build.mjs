#!/usr/bin/env node
// Dark Lines: static page generator. Zero dependencies.
// Usage: node build.mjs [--content <dir>]
//
// The page is a pinned scroll story: one WebGL particle field (js/stage.js) changes
// shape from scene to scene, and each chapter's full text lives in a slide-up sheet.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
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

// ---------- palette: one hue per chapter, red end to the edge of the visible ----------
// `shape` names the particle formation js/shapes.js builds for that scene.
const TABLE = {
  sky:        { hue: 25,  ground: 'oklch(0.40 0.16 25)',  wdth: 125, shape: 'moons' },
  reasons:    { hue: 32,  ground: 'oklch(0.50 0.19 32)',  wdth: 118, shape: 'solid' },
  method:     { hue: 58,  ground: 'oklch(0.74 0.17 58)',  wdth: 110, shape: 'lens' },
  revolution: { hue: 96,  ground: 'oklch(0.89 0.17 96)',  wdth: 102, shape: 'orbits' },
  matter:     { hue: 125, ground: 'oklch(0.85 0.19 125)', wdth: 95,  shape: 'field' },
  life:       { hue: 150, ground: 'oklch(0.72 0.18 150)', wdth: 88,  shape: 'helix' },
  quanta:     { hue: 200, ground: 'oklch(0.79 0.12 200)', wdth: 80,  shape: 'spacetime' },
  machines:   { hue: 255, ground: 'oklch(0.48 0.17 255)', wdth: 74,  shape: 'chip' },
  space:      { hue: 264, ground: 'oklch(0.35 0.16 264)', wdth: 68,  shape: 'planet' },
  code:       { hue: 270, ground: 'oklch(0.26 0.13 270)', wdth: 64,  shape: 'network' },
  open:       { hue: 272, ground: 'oklch(0.13 0.03 272)', wdth: 62,  shape: 'galaxy' },
};

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const pad = (n) => String(n).padStart(2, '0');
const pct = (n) => `${+n.toFixed(3)}%`;

const ARROW = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const ARROW_UP = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20V5M6 11l6-6 6 6"/></svg>';
const CROSS = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const PLUS = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>';

// Title with its last word set in the italic serif.
function title(t) {
  const words = String(t).trim().split(/\s+/);
  const last = words.pop();
  const head = words.map((w, i) => `<span class="w" style="--wi:${i}"><span>${esc(w)}</span></span>`).join(' ');
  return `${head}${head ? ' ' : ''}<span class="w" style="--wi:${words.length}"><em>${esc(last)}</em></span>`;
}
// Words wrapped for the scroll-scrubbed reveal.
function scrub(text) {
  return String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `<span class="sw">${esc(w)}</span>`)
    .join(' ');
}
const paragraphs = (arr) => (arr || []).map((p) => `<p>${esc(p)}</p>`).join('\n');

// ---------- load + validate ----------
const chapters = readJson('chapters.json', null, true);
const open = readJson('open.json', null, true);
const plates = readJson('plates.json', {});
const references = readJson('references.json', []);

if (!Array.isArray(chapters) || !chapters.length) fail('chapters.json must be a non-empty array');

const seen = new Map();
const lineById = new Map();
function claim(id, where) {
  if (!id) fail(`empty id in ${where}`);
  if (seen.has(id)) fail(`duplicate id "${id}" (${where}; first seen in ${seen.get(id)})`);
  seen.set(id, where);
}
for (const c of chapters) {
  claim(c.id, 'chapter');
  if (!TABLE[c.id]) fail(`chapter id "${c.id}" is not in the colour table`);
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

// ---------- spectrum geometry: where each dark line sits, 0..1 across the visible ----------
const allChapters = [
  ...chapters.map((c) => ({ ...c, kind: 'chapter' })),
  { id: 'open', kind: 'open', title: open.title, years: open.years || 'Not yet dated', nm: open.nm,
    intro: open.intro || [], lines: (open.questions || []).map((q) => ({ ...q, _q: true })) },
];
const SEG = 1 / allChapters.length;
const ticks = [];
allChapters.forEach((c, ci) => {
  const n = c.lines.length;
  c.lines.forEach((l, i) => {
    ticks.push({
      x: ci * SEG + ((i + 1) / (n + 1)) * SEG,
      w: l._q ? 2 : l.weight || 1,
      q: !!l._q,
      label: l._q ? `Open question: ${l.title}` : `${l.year}: ${l.title}`,
    });
  });
});
const railGradient = `linear-gradient(to bottom in oklch, ${allChapters
  .map((c, ci) => {
    const g = TABLE[c.id].ground;
    return `${g} ${pct(ci * SEG * 100 + SEG * 20)}, ${g} ${pct(ci * SEG * 100 + SEG * 80)}`;
  })
  .join(', ')})`;

// ---------- fragments ----------
function plateFigure(id) {
  const p = plates[id];
  if (!p) return '';
  const credit = [p.credit, p.license].filter(Boolean).map(esc).join(' · ');
  return `<figure class="find__plate" style="--ar:${esc(p.w)}/${esc(p.h)}"><img src="${esc(p.file)}" width="${esc(p.w)}" height="${esc(p.h)}" alt="${esc(p.alt)}" loading="lazy" decoding="async">${credit ? `<figcaption>${credit}</figcaption>` : ''}</figure>`;
}
function linkList(label, ids) {
  if (!ids.length) return '';
  const links = ids
    .slice()
    .sort(bySort)
    .map((id) => {
      const { line } = lineById.get(id);
      return `<a class="chip" href="#f-${esc(id)}" data-goto="${esc(id)}"><span>${esc(line.year)}</span> ${esc(line.title)}</a>`;
    })
    .join('');
  return `<div class="find__links"><span class="find__label">${label}</span><div class="chips">${links}</div></div>`;
}
function renderFind(l, i) {
  const built = l.builtOn || [];
  const led = ledTo.get(l.id) || [];
  const w = [1, 2, 3].includes(l.weight) ? l.weight : 1;
  return `<article class="find" id="f-${esc(l.id)}" data-weight="${w}" style="--i:${i}">
<div class="find__meta"><span class="find__year">${esc(l.year)}</span>${w === 3 ? '<span class="tag">Landmark</span>' : ''}</div>
<h3 class="find__title">${esc(l.title)}</h3>
<p class="find__summary">${esc(l.summary)}</p>
${plateFigure(l.plate || l.id)}
<details class="more">
<summary><span>Before and after</span>${PLUS}</summary>
<div class="more__body">
<div><h4>What it replaced</h4><p>${esc(l.replaced)}</p></div>
<div><h4>What it made possible</h4><p>${esc(l.enabled)}</p></div>
</div>
</details>
${linkList('Built on', built)}${linkList('Led to', led)}
</article>`;
}

// Highlights shown on the main page: up to three, heaviest first, then shown in date order.
function highlights(lines) {
  return lines
    .slice()
    .sort((a, b) => (b.weight || 1) - (a.weight || 1) || a.sortYear - b.sortYear)
    .slice(0, 3)
    .sort((a, b) => a.sortYear - b.sortYear);
}

function chapterScene(c, ci, sceneIndex) {
  const t = TABLE[c.id];
  const side = ci % 2 === 0 ? 'left' : 'right';
  const marks = highlights(c.lines)
    .map((l) => `<li><button type="button" data-open="${esc(c.id)}" data-focus="${esc(l.id)}"><span class="mark__year">${esc(l.year)}</span><span class="mark__title">${esc(l.title)}</span></button></li>`)
    .join('');
  return `<section class="scene scene--chapter" id="c-${esc(c.id)}" data-scene="${sceneIndex}" data-shape="${t.shape}" data-side="${side}" data-label="${esc(c.title)}" data-nm="${esc(c.nm)} nm" data-hue="${t.hue}" style="--hue:${t.hue};--wdth:${t.wdth}%" aria-labelledby="t-${esc(c.id)}">
<div class="pin">
<div class="copy">
<p class="kicker r"><span class="kicker__n">${pad(ci + 1)}</span><span class="kicker__bar"></span><span>${esc(c.nm)} nm</span></p>
<h2 class="display" id="t-${esc(c.id)}">${title(c.title)}</h2>
<p class="years r">${esc(c.years)}</p>
<p class="lede r">${esc(c.intro[0])}</p>
<ol class="marks r">${marks}</ol>
<button class="cta r" type="button" data-open="${esc(c.id)}" aria-haspopup="dialog"><span class="cta__label">Read the chapter</span><span class="cta__count">${c.lines.length} discoveries</span>${ARROW}</button>
</div>
</div>
</section>`;
}

function chapterSheet(c, ci) {
  const t = TABLE[c.id];
  const next = allChapters[ci + 1];
  const finds = c.lines.map(renderFind).join('\n');
  return `<dialog class="sheet" id="sheet-${esc(c.id)}" data-sheet="${esc(c.id)}" style="--hue:${t.hue};--wdth:${t.wdth}%" aria-labelledby="st-${esc(c.id)}">
<div class="sheet__panel">
<div class="sheet__bar"><span class="sheet__crumb">${pad(ci + 1)} · ${esc(c.nm)} nm</span><button class="sheet__close" type="button" data-close>${CROSS}<span>Close</span></button></div>
<div class="sheet__scroll" data-scroll>
<div class="sheet__grid">
<header class="sheet__head">
<p class="kicker"><span class="kicker__n">${pad(ci + 1)}</span><span class="kicker__bar"></span><span>${esc(c.years)}</span></p>
<h2 class="display display--sheet" id="st-${esc(c.id)}">${title(c.title)}</h2>
<div class="sheet__intro">${paragraphs(c.intro)}</div>
<p class="sheet__handoff"><span>Handed on</span>${esc(c.handoff)}</p>
</header>
<div class="finds">${finds}</div>
</div>
${next ? `<button class="sheet__next" type="button" data-open="${esc(next.id)}"><span class="sheet__next-k">Next · ${esc(next.nm)}${next.kind === 'open' ? '' : ' nm'}</span><span class="sheet__next-t">${esc(next.title)}</span>${ARROW}</button>` : ''}
</div>
</div>
</dialog>`;
}

function openScene(sceneIndex) {
  const t = TABLE.open;
  const qs = (open.questions || [])
    .map((q, i) => `<li><button type="button" data-open="open" data-focus="${esc(q.id)}"><span class="q__n">?${i + 1}</span><span class="q__t">${esc(q.title)}</span></button></li>`)
    .join('');
  return `<section class="scene scene--open" id="c-open" data-scene="${sceneIndex}" data-shape="${t.shape}" data-side="left" data-label="${esc(open.title)}" data-nm="${esc(open.nm)} nm" data-hue="${t.hue}" style="--hue:${t.hue};--wdth:${t.wdth}%" aria-labelledby="t-open">
<div class="pin">
<div class="copy">
<p class="kicker r"><span class="kicker__n">??</span><span class="kicker__bar"></span><span>${esc(open.nm)} nm</span></p>
<h2 class="display" id="t-open">${title(open.title)}</h2>
<p class="lede r">${esc(open.intro[1] || open.intro[0])}</p>
<ol class="questions r">${qs}</ol>
</div>
</div>
</section>`;
}

function openSheet() {
  const t = TABLE.open;
  const qs = (open.questions || [])
    .map((q, i) => `<article class="find find--q" id="f-${esc(q.id)}" style="--i:${i}">
<div class="find__meta"><span class="find__year">Open question ${i + 1}</span></div>
<h3 class="find__title">${esc(q.title)}</h3>
<p class="find__summary">${esc(q.text)}</p>
${linkList('Rests on', q.builtOn || [])}
</article>`)
    .join('\n');
  return `<dialog class="sheet" id="sheet-open" data-sheet="open" style="--hue:${t.hue};--wdth:${t.wdth}%" aria-labelledby="st-open">
<div class="sheet__panel">
<div class="sheet__bar"><span class="sheet__crumb">Beyond the visible</span><button class="sheet__close" type="button" data-close>${CROSS}<span>Close</span></button></div>
<div class="sheet__scroll" data-scroll>
<div class="sheet__grid">
<header class="sheet__head">
<p class="kicker"><span class="kicker__n">??</span><span class="kicker__bar"></span><span>${esc(open.years)}</span></p>
<h2 class="display display--sheet" id="st-open">${title(open.title)}</h2>
<div class="sheet__intro">${paragraphs(open.intro)}</div>
</header>
<div class="finds">${qs}</div>
</div>
</div>
</div>
</dialog>`;
}

function sourcesSheet() {
  const refs = references
    .map((r) => `<li><a href="${esc(r.url)}" rel="noopener" target="_blank">${esc(r.label)}</a></li>`)
    .join('');
  const credits = Object.entries(plates)
    .map(([id, p]) => {
      const line = lineById.get(id)?.line;
      return `<li><span>${esc(line ? line.title : id)}</span> <a href="${esc(p.source)}" rel="noopener" target="_blank">${esc(p.credit)}</a> <em>${esc(p.license)}</em></li>`;
    })
    .join('');
  return `<dialog class="sheet sheet--plain" id="sheet-sources" data-sheet="sources" style="--hue:272;--wdth:90%" aria-labelledby="st-sources">
<div class="sheet__panel">
<div class="sheet__bar"><span class="sheet__crumb">Sources and credits</span><button class="sheet__close" type="button" data-close>${CROSS}<span>Close</span></button></div>
<div class="sheet__scroll" data-scroll>
<div class="sheet__grid">
<header class="sheet__head">
<h2 class="display display--sheet" id="st-sources">${title('Sources & credits')}</h2>
<div class="sheet__intro"><p>Dates and claims follow the sources below. Plates are from Wikimedia Commons, resized and converted to WebP.</p></div>
</header>
<div class="sources">
<h3>Reading</h3><ol class="reflist">${refs}</ol>
<h3>Plates</h3><ul class="credits">${credits}</ul>
</div>
</div>
</div>
</div>
</dialog>`;
}

function indexMenu() {
  const rows = allChapters
    .map((c, ci) => {
      const t = TABLE[c.id];
      const n = c.kind === 'open' ? '??' : pad(ci + 1);
      return `<li style="--hue:${t.hue};--ground:${t.ground};--i:${ci}"><a href="#c-${esc(c.id)}" data-jump="c-${esc(c.id)}"><span class="ix__n">${n}</span><span class="ix__t">${esc(c.title)}</span><span class="ix__y">${esc(c.years)}</span><span class="ix__sw" aria-hidden="true"></span></a></li>`;
    })
    .join('');
  return `<dialog class="sheet sheet--index" id="sheet-index" data-sheet="index" aria-label="Chapters">
<div class="sheet__panel">
<div class="sheet__bar"><span class="sheet__crumb">Index · 700 nm to the edge of the visible</span><button class="sheet__close" type="button" data-close>${CROSS}<span>Close</span></button></div>
<div class="sheet__scroll" data-scroll>
<ol class="ix">${rows}</ol>
</div>
</div>
</dialog>`;
}

// ---------- page ----------
const firstChapterScene = 2;
const scenesHtml = [
  `<section class="scene scene--hero" id="top" data-scene="0" data-shape="sun" data-side="center" data-label="The Sun" data-nm="white light" data-hue="40" style="--hue:40" aria-labelledby="t-hero">
<div class="pin">
<div class="hero">
<p class="hero__eyebrow r"><span>A history of science</span><span>in ${ticks.length} lines</span></p>
<h1 class="hero__title" id="t-hero"><span class="hero__row"><span class="hero__word">Dark</span></span><span class="hero__row hero__row--2"><span class="hero__word"><em>Lines</em></span></span></h1>
<p class="hero__lede r">In 1814 Joseph von Fraunhofer counted 574 dark lines in the light of the Sun. Nobody could say what they were.</p>
<p class="hero__cue r" aria-hidden="true"><span class="hero__cue-line"></span>Scroll</p>
</div>
</div>
</section>`,
  `<section class="scene scene--intro" id="intro" data-scene="1" data-shape="spectrum" data-side="center" data-label="Fraunhofer’s chart" data-nm="380 – 700 nm" data-hue="58" style="--hue:58" aria-label="How to read this page">
<div class="pin">
<div class="statement">
<p class="kicker r"><span class="kicker__n">1814 → 1859</span><span class="kicker__bar"></span><span>How to read this page</span></p>
<p class="statement__text" data-scrub>${scrub('Forty-five years later the lines turned out to be a record of what the Sun is made of. This page uses his chart. It runs from red to the edge of the visible, and every dark line is something we learned.')}</p>
</div>
</div>
</section>`,
  ...chapters.map((c, ci) => chapterScene(c, ci, firstChapterScene + ci)),
  openScene(firstChapterScene + chapters.length),
  `<section class="scene scene--close" id="close" data-scene="${firstChapterScene + chapters.length + 1}" data-shape="ring" data-side="center" data-label="The whole spectrum" data-nm="380 – 700 nm" data-hue="40" style="--hue:40" aria-labelledby="t-close">
<div class="pin">
<div class="close">
<h2 class="display display--close" id="t-close">${title('Every dark line is something we learned.')}</h2>
<p class="lede r">The rest of the spectrum is still dark.</p>
<div class="close__actions r">
<button class="cta cta--ghost" type="button" data-top>${ARROW_UP}<span class="cta__label">Back to the red end</span></button>
<button class="cta cta--ghost" type="button" data-open="sources" aria-haspopup="dialog"><span class="cta__label">Sources &amp; credits</span>${ARROW}</button>
</div>
<p class="close__foot r">Drawn live in WebGL from about sixteen thousand points. No frameworks.</p>
</div>
</div>
</section>`,
];

const railTicks = ticks
  .map((t) => `<span class="rail__tick${t.q ? ' rail__tick--q' : ''}" data-w="${t.w}" style="--y:${pct(t.x * 100)}"></span>`)
  .join('');
const railStops = allChapters
  .map((c, ci) => `<button class="rail__stop" type="button" data-jump="c-${esc(c.id)}" style="--y:${pct((ci + 0.5) * SEG * 100)}" aria-label="${esc(c.title)}"></button>`)
  .join('');

const spectrumData = {
  lines: ticks.map((t) => [+t.x.toFixed(4), t.w]),
  hues: allChapters.map((c) => TABLE[c.id].hue),
};

const html = `<!doctype html>
<html lang="en" class="no-js">
<head>
<script>document.documentElement.className=document.documentElement.className.replace('no-js','js')</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dark Lines: a history of science</title>
<meta name="description" content="A history of science drawn as the Sun’s spectrum, where every dark line is something we learned.">
<meta name="theme-color" content="#07070a">
<meta property="og:title" content="Dark Lines: a history of science">
<meta property="og:description" content="A history of science drawn as the Sun’s spectrum, where every dark line is something we learned.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://manstory-liart.vercel.app/">
<meta property="og:image" content="https://manstory-liart.vercel.app/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Dark Lines: a history of science">
<meta name="twitter:description" content="A history of science drawn as the Sun’s spectrum, where every dark line is something we learned.">
<meta name="twitter:image" content="https://manstory-liart.vercel.app/assets/og.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%2212%22%20fill%3D%22%23ffcf7a%22%2F%3E%3Cpath%20d%3D%22M11%206v20M16%204v24M20%206v20%22%20stroke%3D%22%2307070a%22%20stroke-width%3D%221.6%22%2F%3E%3C%2Fsvg%3E">
<link rel="preload" href="assets/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/stix-two-text-latin-wght-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/site.css">
</head>
<body>
<a class="skip" href="#c-sky">Skip to the first chapter</a>
<canvas class="stage" data-stage aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>

<header class="hud">
<a class="hud__mark" href="#top" data-jump="top"><span class="hud__glyph" aria-hidden="true"></span>Dark Lines</a>
<p class="hud__now" aria-live="off"><span class="hud__nm" data-hud-nm>white light</span><span class="hud__label" data-hud-label>The Sun</span></p>
<button class="hud__menu" type="button" data-open="index" aria-haspopup="dialog"><span>Index</span><span class="hud__bars" aria-hidden="true"></span></button>
</header>

<nav class="rail" aria-label="Spectrum">
<span class="rail__nm rail__nm--top" aria-hidden="true">700</span>
<div class="rail__bar" style="background:${railGradient}">${railTicks}${railStops}<span class="rail__cursor" data-rail-cursor aria-hidden="true"></span></div>
<span class="rail__nm rail__nm--bottom" aria-hidden="true">380</span>
</nav>

<p class="count" aria-hidden="true"><span data-count>00</span><span class="count__of">/ ${pad(chapters.length)}</span></p>

<main id="main">
${scenesHtml.join('\n\n')}
</main>

${chapters.map(chapterSheet).join('\n')}
${openSheet()}
${sourcesSheet()}
${indexMenu()}

<script type="application/json" id="spectrum-data">${JSON.stringify(spectrumData)}</script>
<script type="module" src="js/main.js"></script>
</body>
</html>
`;

writeFileSync(resolve(ROOT, 'index.html'), html);
console.log(`built index.html: ${chapters.length} chapters, ${ticks.length} lines, ${Object.keys(plates).length} plates, ${(html.length / 1024).toFixed(1)} KB`);
