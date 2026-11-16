---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief: index.html (the whole journey)

Scope: the single page. Visitor mode: Experience.
Audience and job: a curious reader scrolling through the history of science in one sitting; they should leave remembering how discoveries connect.
Content: 10 dated chapters, 57 dated discoveries, one chapter of open questions, sources.
Constraints: static site, reduced motion, touch, no captions under plates, verified dates only.
Memorable moment: the hero spectrum shrinking into the top rail as the page turns red.
Unresolved: none. The user asked not to be consulted on design decisions; the direction round was not put to them.

## Direction contract

THESIS: The page is one solar spectrum laid on its side and scrolled from red to past the visible; each discovery is a dark absorption line you can open. It refuses the dark-space timeline with dated cards beside a centre line.

OWN-WORLD: Full-bleed saturated OKLCH fields that change hue by era (oxblood, vermilion, orange, yellow, yellow-green, green, cyan, blue, deep blue, indigo, near-black). Black horizontal rules of three weights crossing edge to edge. Opened lines become black bands. Archivo, wide at the red end and condensed at the blue end; STIX Two Text for reading. No cards, corners, shadows or glass.

STORY: The visitor learns that sunlight carried a record nobody could read until 1859, then reads science the same way: line by line, each one built on earlier lines. They open lines, follow threads backward and forward, and reach the lines not yet named.

FIRST VIEWPORT: Near-black ground. Title set large at the left wrap edge in the upper two thirds, a two-sentence lede with the 1814 fact, one button. A full-bleed spectrum band 26vh tall across the bottom, crossed by every discovery's dark line. A light beam draws across and the band unrolls on load.

FORM: Spectroscopic plate (Fraunhofer's chart), candidate 5 of 7 on the ordered list. seed:1f5303cf58dbad90
Raises: from the torn-billboard hand, opened lines stay recorded and are drawn back at the close; from the VU-meter hand, scroll-driven drawings move with damping, never instant values; from the HyperCard hand, every line has its own address; from the ikebana hand, each fade between eras is left empty; from the sand-glyph hand, colour is total, the ground is the palette.

Signature interaction: the hero band docks into the rail; opening a line lights its ancestors and descendants on the rail.
Motion grammar: unroll, dock, broaden. Strong ease-out, transforms and clip-path, nothing bounces.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Intended adaptation: on viewports under 600px tall (landscape phones) the hero band drops to 18svh, and to 14svh under 440px, so the title, lede and button stay readable and clear of the band. Reading comes first (PRODUCT.md principle 4).
