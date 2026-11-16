# Dark Lines

A single-page, scroll-driven story built with plain HTML, CSS and JavaScript. No framework and no dependencies, so there is nothing to `npm install`.

## Requirements

- Node.js 18 or newer

## Run locally

```bash
npm run dev
```

Then open http://127.0.0.1:4173/ in your browser.

Use a server rather than opening `index.html` directly, because the JavaScript modules don't load from `file://`.

Other commands:

```bash
npm run build                  # regenerate index.html from content/
npm run serve                  # serve without rebuilding
node serve.mjs --port 8080     # serve on a different port
```

## Edit content

1. Edit the JSON files in `content/` (`chapters.json`, `open.json`, `plates.json`, `references.json`).
2. Run `npm run build` to regenerate `index.html`.

Don't edit `index.html` by hand, because the next build overwrites it.

## Project layout

- `build.mjs`: generates `index.html` from `content/`
- `serve.mjs`: local static server
- `css/`, `js/`: styles and scripts
- `assets/`: fonts and images

## Deploy

It's a static site, and the built `index.html` is committed, so any static host works. On Vercel:

- Framework preset: **Other**
- Build command: `npm run build`
- Output directory: `.`

## Docs

- `PRODUCT.md`: product brief
- `DESIGN.md`: design system
- `docs/SPEC.md`: build spec
