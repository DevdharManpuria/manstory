---
name: Dark Lines
description: A history of science drawn as the Sun's spectrum, where every dark line is something we learned.
colors:
  ground-sky: "oklch(0.40 0.16 25)"
  ground-reasons: "oklch(0.50 0.19 32)"
  ground-method: "oklch(0.74 0.17 58)"
  ground-revolution: "oklch(0.89 0.17 96)"
  ground-matter: "oklch(0.85 0.19 125)"
  ground-life: "oklch(0.72 0.18 150)"
  ground-quanta: "oklch(0.79 0.12 200)"
  ground-machines: "oklch(0.48 0.17 255)"
  ground-space: "oklch(0.35 0.16 264)"
  ground-code: "oklch(0.26 0.13 270)"
  ground-open: "oklch(0.13 0.03 272)"
  hero-ground: "oklch(0.13 0.02 25)"
  close-ground: "oklch(0.11 0.02 272)"
  sources-ground: "oklch(0.09 0.02 272)"
  rail-bg: "oklch(0.11 0.02 25)"
  rail-ink: "oklch(0.97 0.02 25)"
  tone-light: "oklch(0.97 0.02 90)"
  tone-dark: "oklch(0.08 0.02 25)"
typography:
  display:
    fontFamily: "Archivo, Archivo Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, min(8.8vw, 8.6svh), 5.25rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, Archivo Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 8.5vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, Archivo Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 2.4vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  handoff:
    fontFamily: "Archivo, Archivo Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "STIX Two Text, Georgia, Times New Roman, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo, Archivo Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.3
    fontVariation: "'wdth' 100"
    fontFeature: "'tnum'"
rounded:
  none: "0px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "72px"
  s-9: "112px"
  s-10: "168px"
  gutter: "clamp(1.25rem, 5vw, 4rem)"
  gap: "clamp(0.75rem, 2vw, 1.5rem)"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.tone-light}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
    height: "48px"
  button-hover:
    backgroundColor: "{colors.tone-light}"
    textColor: "{colors.hero-ground}"
  rail:
    backgroundColor: "{colors.rail-bg}"
    textColor: "{colors.rail-ink}"
    height: "44px"
  rail-menu:
    backgroundColor: "transparent"
    textColor: "{colors.rail-ink}"
    typography: "{typography.label}"
    padding: "0 12px"
    height: "44px"
  rail-menu-hover:
    backgroundColor: "{colors.rail-ink}"
    textColor: "{colors.rail-bg}"
  menu-row:
    backgroundColor: "{colors.ground-sky}"
    textColor: "{colors.rail-ink}"
    padding: "12px clamp(1.25rem, 5vw, 4rem)"
    height: "52px"
  line-panel:
    backgroundColor: "{colors.rail-bg}"
    textColor: "{colors.rail-ink}"
    padding: "48px 0"
---

# Design System: Dark Lines

## Overview

**Creative North Star: "The Spectroscopic Plate"**

The system is Fraunhofer's chart of the solar spectrum laid on its side and scrolled from red to past the visible. The ground is the palette: every era is a full-bleed field of one saturated OKLCH colour, and the page moves through eleven of them, oxblood to near-black indigo. Content sits on that field as dark absorption lines: black rules that cross edge to edge, in three weights, each one a thing that can be opened. An opened line broadens into a black band.

Everything is flat and square. There are no cards, no rounded corners, no shadows and no glass; a surface is either a colour field, a rule across it, or a near-black band cut into it. Type carries the spectrum too: Archivo runs wide at the red end and condensed at the blue end, so the width of a heading tells you where you are. STIX Two Text, a face made for scientific publishing, does the reading.

Motion has three verbs, unroll, dock and broaden, on strong ease-out curves with transforms and clip-path. Nothing bounces. Reduced motion replaces every transform with a short opacity fade.

**Key Characteristics:**
- Full-bleed saturated colour fields that change hue by position in the sequence
- Edge-to-edge horizontal rules in three weights as the only divider and the only interactive row marker
- Near-black bands for opened content and for chrome (rail, menu, close, sources)
- One variable sans whose width axis tracks the spectrum; one serif for reading
- Square corners, no shadows, no layered surfaces
- Ink is always a tint of the ground's own hue, never neutral grey

## Colors

Eleven saturated spectral grounds between two near-black ends; all colours are authored in OKLCH and every dark or light tone is tinted toward the hue it sits on.

### Primary
The spectral grounds, in reading order. Each is a whole-section background, never an accent on another ground.
- **Oxblood** (`ground-sky`, hue 25): first chapter; also the colour the hero ground fades into. Light ink.
- **Vermilion** (`ground-reasons`, hue 32): light ink.
- **Orange** (`ground-method`, hue 58): dark ink.
- **Yellow** (`ground-revolution`, hue 96): the lightest ground. Dark ink.
- **Yellow-green** (`ground-matter`, hue 125): dark ink.
- **Green** (`ground-life`, hue 150): dark ink.
- **Cyan** (`ground-quanta`, hue 200): lower chroma than its neighbours. Dark ink.
- **Blue** (`ground-machines`, hue 255): light ink.
- **Deep Blue** (`ground-space`, hue 264): light ink.
- **Indigo** (`ground-code`, hue 270): light ink.
- **Past the Visible** (`ground-open`, hue 272): near-black; the open-questions chapter. Light ink, bright rules.

### Neutral
- **Hero Ground** (`hero-ground`): near-black warmed toward red; page background and first viewport.
- **Close Ground** (`close-ground`) and **Sources Ground** (`sources-ground`): near-black cooled toward indigo; the closing band section, then sources and footer one step darker.
- **Rail Black** (`rail-bg`) and **Rail Ink** (`rail-ink`): the fixed rail and the chapters menu; solid, readable over every ground.
- **Bright Line** (`tone-light`): emission-line white, slightly warm. Rules on dark grounds, undated lines on the spectrum band, the hero beam, the skip link, default focus ring.
- **Dark Line** (`tone-dark`): fallback absorption-line black for spectrum-band lines.

### Derived tones
These are formulas over the section's hue, set in `css/tokens.css`, and are not separate tokens:
- Light ink: `oklch(0.97 0.02 <hue>)`; secondary text is the same at 90% alpha.
- Dark ink: `oklch(0.17 0.03 <hue>)`; secondary text at 78% alpha.
- Rules: `oklch(0.08 0.02 <hue>)` on light-ink grounds, `oklch(0.12 0.02 <hue>)` on dark-ink grounds, Bright Line on the hero, open-questions, close, sources and footer.
- Opened panel: ground `oklch(0.11 0.02 <hue>)`, ink `oklch(0.96 0.02 <hue>)`, secondary at 82% alpha.
- Spectrum-band lines: `oklch(L 0.03 <hue>)` with L 0.04, 0.06 or 0.08, stepping darker as the ground gets darker, so a dated line is always darker than the colour it crosses.

### Named Rules
**The Ground Is The Palette Rule.** Colour is applied as a whole field. A spectral colour never appears as a button fill, a tag, a border or a highlight on another ground; the only place two spectral colours touch is a gradient between neighbours.

**The Tinted Ink Rule.** No neutral grey, pure black or pure white. Every ink, rule and dark band carries chroma 0.02 to 0.03 at the hue of the ground it belongs to.

**The Ink Follows Lightness Rule.** Ink is chosen per ground from the table in `build.mjs`: the five grounds from orange to cyan (lightness 0.72 and up) take dark ink, the rest take light ink. A new ground gets its ink by the same test.

**The Neighbour Gradient Rule.** Gradients exist only where the spectrum itself is continuous: between one ground and the next (chapter fades, the hero's fall into oxblood) and across the full spectrum band. They are interpolated in OKLCH. The short end of the sequence stops at hue 272.

## Typography

**Display Font:** Archivo variable, weight 100 to 900, width 62 to 125 (with Arial Narrow, system-ui)
**Body Font:** STIX Two Text variable, weight 400 to 700, roman and italic (with Georgia, Times New Roman)
**Label Font:** Archivo at width 100, weight 500

Both are self-hosted woff2 with `font-display: swap`.

**Character:** A grotesque that physically narrows as the page moves from red to blue, set tight and heavy against a quiet scientific serif. Headings state; the serif explains.

### Hierarchy
- **Display** (700, `clamp(1.75rem, min(8.8vw, 8.6svh), 5.25rem)`, 0.95, -0.02em, width 125): the page title only. Sized against viewport height as well as width so it never collides with the spectrum band.
- **Headline** (700, `clamp(2.75rem, 8.5vw, 6rem)`, 0.95, -0.02em, width per chapter): chapter titles and the closing title. Below 900px: `clamp(2.5rem, 12vw, 4.25rem)`. Balanced wrapping.
- **Title** (600, `clamp(1.375rem, 2.4vw, 2rem)`, 1.12, -0.01em, width per chapter): the title of a line (a discovery or an open question).
- **Handoff** (600, `clamp(1.5rem, 3.2vw, 2.5rem)`, 1.15, -0.01em, width per chapter): the one sentence that closes a chapter, max 26em.
- **Body** (400, 1.1875rem, 1.55; 1.0625rem at 600px and below): reading text, max 64ch. Summaries cap at 48ch; sources and footer run at 1rem / 1.5.
- **Label** (500, 0.9375rem, 1.3, width 100, tabular figures): years, wavelength, rail readout, thread links, link-row labels. Sentence case. Panel subheads are the same face at 600 / 1.0625rem.

### Named Rules
**The Width Axis Rule.** Archivo's width is set by spectral position: 125, 118, 110, 102, 95, 88, 80, 74, 68, 64, 62 across the eleven grounds. Chapter titles, line titles, handoffs and menu rows inherit their chapter's width. Labels and controls stay at 100 everywhere so they read as instrument, not as content.

**The Sentence Case Rule.** No uppercase and no positive letter-spacing anywhere. Large Archivo is tightened (-0.02em display, -0.01em title); labels are untracked.

**The Tabular Figures Rule.** Every year and count is set in Archivo with tabular numerals so dates align down a column of lines.

## Layout

A single continuous column of full-bleed sections. Content sits in a wrap of `min(100% - 2 * gutter, 78rem)`, with a 12-column grid inside it (gap `clamp(0.75rem, 2vw, 1.5rem)`). Rules, bands and colour fields ignore the wrap and run edge to edge; text never does.

- **Left-hung composition.** Text hangs from the left wrap edge. Chapter heads use columns 1 to 7 for title, span and intro and columns 8 to 12 for a square diagram. Line rows put the year in columns 1 to 2, the title in 3 to 9, the summary in 3 to 8 and the toggle mark in column 12. Opened panels keep the same column 3 start for text, with a plate in 9 to 12.
- **Spacing scale.** 4, 8, 12, 16, 24, 32, 48, 72, 112, 168px. Sections open with 168px of top padding (112px below 900px); line rows take 24px above and 32px below their rule.
- **Empty fades.** Each chapter ends in a 70svh gradient to the next ground that carries no content, only a few faint hairlines. The transition between eras is left empty on purpose.
- **Faint lines.** Between a chapter head and its first line sits a 96px strip of five to nine 1px rules at 10 to 28% opacity, placed by a seeded generator. They are texture for the plate, not dividers.
- **Breakpoints.** 899px and below: the 12-column grid collapses to one column, the diagram goes 4:3 under the title, year stacks above title. 600px and below: rail drops to 40px and loses the wordmark, body steps down, spectrum-band lines thin to 1px (2px for the heaviest) and the lightest rail ticks are hidden. 400px and below: the rail readout is hidden.
- **Height breakpoints.** The hero band is 26svh, 22svh at heights up to 820px, 18svh under 600px and 14svh under 440px; title, lede and button shrink with it so reading stays clear of the band.
- **Anchors.** Every chapter, line and question has its own id and a `scroll-margin-top` of the rail height plus 24px.
- **Hit areas.** Interactive targets are at least 44px tall (buttons 48px, menu rows 52px); thin lines on the spectrum bands get invisible padding (14px wider on the rail, 24px wide on the closing band).

## Elevation & Depth

Flat. There are no shadows, no blurred backdrops and no stacked translucent surfaces. Depth is said in two ways only: tone (an opened panel and the chrome are near-black bands cut into the colour field) and stacking order (the rail at z 50, its menu at 49, both solid).

### Named Rules
**The No-Shadow Rule.** Nothing casts a shadow. A thing that needs to separate from the ground does it with a rule, a near-black band, or a 1px contrasting outline (the rail's current tick and cursor carry a 1px dark outline so they read on every hue).

## Shapes

Square. Radius is 0 on every element; buttons are explicitly reset to it. The form language is the line: full-width horizontal rules in content (2px, 5px and 11px by a line's weight; open questions always 2px), and vertical lines on the spectrum bands (2px, 3px, 5px by the same weight). The only borders are the 1.5px button outline, a 2px rule above a panel's thread links in the chapter's ground colour, and a 1px low-alpha line above the footer. Icons are 24-unit inline SVG strokes at 1.5 to 1.75 width with square ends: a plus that rotates 45 degrees when its line is open, and an arrow in buttons. Plates (historical images) are shown uncropped, in greyscale with slight contrast, on a near-black mat, with no frame and no caption; credits live in Sources. The single small mark is a 6px square after the year of a line that has been opened.

## Components

### Buttons
Outlined, square, quiet until touched.
- **Shape:** square (0 radius), 1.5px outline in the section's ink, min-height 48px, padding 14px 22px, 12px gap to a 20px arrow.
- **Type:** Archivo 600, 1rem, line-height 1.2, width 100.
- **Hover:** fills with ink and the text takes the ground colour (180ms); the arrow moves 3px in its direction.
- **Active:** scales to 0.97 (120ms ease-out).
- **Focus:** 2px ink outline, 3px offset (the global focus ring).
- There is one button style. No filled-at-rest, ghost or secondary variant exists.

### The Spectrum Band
The signature object: a horizontal gradient through all eleven grounds (each ground holds flat across the middle 60% of its segment and blends into its neighbours), crossed by one vertical line per entry. Dated lines are dark and weighted 2, 3 or 5px; undated questions are Bright Line. It appears three times at three scales: the hero band (26svh, decorative), the rail strip (10px, each line a link) and the closing band (40svh, min 12rem, each line a link; unopened lines sit at 30% opacity and opened ones at full).

### Rail
A solid Rail Black bar fixed to the top, 44px (40px on phones): wordmark (Archivo 700, width 110), the spectrum strip, a tabular year readout, and a Chapters control. It is hidden above the viewport until the hero band docks into it, and always shown on keyboard focus.
- **Ticks:** hover scales a tick to 1.9 times its height; the current line's tick turns near-white at 1.5 times with a 1px dark outline; ancestors and descendants of an opened line stand at 2.4 times, warm-white for built-on and pale cyan (`oklch(0.97 0.05 220)`) for led-to.
- **Cursor:** a 2px near-white line with a 1px dark outline marking scroll position.
- **Chapters control:** label type, transparent at rest, inverts to Rail Ink on Rail Black on hover and while expanded, scales to 0.97 on press.

### Chapters Menu
A panel under the rail, right-aligned, `min(26rem, 100%)` wide (full width on phones). Each row is a full band of its chapter's own ground in that chapter's ink and type width: title (Archivo 700, 1.25rem) over years (0.875rem). Hover and focus draw a 2px ink outline inset 6px and slide the title 6px right. Opens with opacity and a 0.96 to 1 scale from the top-right corner (180ms in, 140ms out).

### Lines (discovery rows)
The primary content unit and the primary control. A full-bleed rule sits on top of a row; the whole heading is the button.
- **Rest:** rule in the section's rule tone at the line's weight; year in label type and secondary ink; title in Title type; summary in body.
- **Hover:** the rule thickens to 1.6 times and the title slides 6px right.
- **Press:** the row scales to 0.995.
- **Open:** the plus rotates to a cross and a near-black panel broadens open beneath (grid rows 0fr to 1fr, 440ms in, 280ms out, ease-in-out); its content fades in 90ms later. This is the system's only layout transition.
- **Flash:** when a line is reached by a thread link, a near-white highlight sweeps across its rule once (900ms).
- **Seen:** a 6px square appears after the year.
- **Open questions** are static rows: no toggle, always a 2px Bright Line rule, the question in Title type.

### Panels
The opened state of a line: a full-bleed band of `oklch(0.11 0.02 <hue>)` with 48px vertical padding. Text column with two fixed subheads, an optional plate to the right, and below them a row of thread links separated by a 2px rule in the chapter's ground colour.

### Thread Links
Inline links to an ancestor or descendant line, in label type, underlined at 1.5px with 0.22em offset; the underline thickens to 3px on hover and the link dims to 70% on press. Min-height 44px. On desktop they hang in a column beside their label ("Built on", "Led to") so wrapped links stay aligned. Sources links use the same underline behaviour.

### Motion
Lives with the components above; the shared grammar is:
- **Curves:** `cubic-bezier(0.23, 1, 0.32, 1)` for entrances and state changes, `cubic-bezier(0.77, 0, 0.175, 1)` for the panel and the beam.
- **Durations:** 120 to 200ms for press, hover and tick states; 280 to 440ms for the panel; 640 to 760ms for title reveals and the band unroll.
- **Entrances:** chapter titles rise word by word out of a clip (720ms, staggered 60 to 150ms) when a chapter below the fold is entered. The hero plays once on load: a 1px beam draws across, the band unrolls by clip-path, lines stand up in sequence.
- **Scroll-driven:** the hero band scales down and docks into the rail over the first 70% of a viewport of scroll.
- **Reduced motion:** all transforms, clip reveals and blur are removed; states change with opacity fades of 200ms or less. The same rules apply under the `data-reduced-motion` attribute.

## Do's and Don'ts

### Do:
- **Do** give every new section one ground and let it run full-bleed; derive its ink, rule and panel tones from that ground's hue with the formulas in Colors.
- **Do** separate items with a full-width rule and use its thickness (2, 5 or 11px) to say how much the item matters.
- **Do** set Archivo's width from spectral position for headings and at 100 for labels and controls.
- **Do** keep text inside the 78rem wrap, hung from the left edge, with body at 64ch or less.
- **Do** put opened or secondary content in a near-black band tinted to the local hue.
- **Do** interpolate every gradient in OKLCH and only between neighbouring grounds.
- **Do** use ease-out transforms and clip-path for motion, and provide an opacity-only version for reduced motion.
- **Do** keep every interactive target at 44px or more, padding thin lines invisibly.
- **Do** keep plates greyscale and uncaptioned, with credit and licence in Sources.

### Don't:
- **Don't** build cards, tiles or any boxed container; the brief rules out repeated rounded rectangles and gradient-and-glass cards.
- **Don't** round a corner. Radius is 0.
- **Don't** add shadows, glows or backdrop blur.
- **Don't** use a spectral colour as an accent on a different ground.
- **Don't** use neutral grey, `#000` or `#fff`; tint every tone to its hue.
- **Don't** set uppercase or letter-spaced labels.
- **Don't** lay entries out as dated cards beside a centre line; the product rejects the static timeline.
- **Don't** bounce, overshoot or spring any motion.
- **Don't** add a second button style or a filled-at-rest button.
