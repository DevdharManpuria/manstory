# Dark Lines

A single-page, scroll-driven story built with plain HTML, CSS and ES-module JavaScript. No framework, no npm dependencies.

## How it works

`build.mjs` reads `content/*.json` and generates `index.html`. Fonts and images are served from the project's own files (`assets/`, `css/`, `js/`).

## Run locally

```bash
npm run build   # generate index.html from content/
npm run serve   # serve the site locally
npm run dev     # build + serve
```

Requires Node.js 18+.

## Edit content

Change the JSON files in `content/` (`chapters.json`, `open.json`, `plates.json`, `references.json`), then rebuild.

## Deploy to Vercel

It's a static site, so it deploys as-is:

- Framework preset: **Other**
- Build command: `npm run build` (or leave empty, since `index.html` is committed)
- Output directory: `.` (project root)

## Docs

- `PRODUCT.md`: product brief
- `DESIGN.md`: design system
- `docs/SPEC.md`: build spec
