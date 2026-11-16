# Dark Lines

An interactive, scroll-driven journey through the history of human science, from the first tally marks and sky-watchers to particle physics, AI and the questions still open today.

Most timelines list names and dates. Dark Lines is built around the **connections**: every discovery is shown alongside what it overturned and what it made possible later, so you can follow the thread from one breakthrough to the next.

## Features

- **Scroll-driven chapters** covering early counting and astronomy, Greek thought, the scientific method, Copernicus, Galileo and Newton, electromagnetism, Darwin, DNA, relativity and quantum mechanics, computing, spaceflight, modern genetics, particle physics, AI and open questions.
- **Discovery points** that expand to reveal more detail when you want it.
- **Progress indicator** so you always know where you are in the story.
- **References and further reading** for every claim.
- **Accessible by design**: works with mouse, touch and keyboard, and respects `prefers-reduced-motion`.
- **Zero dependencies**: plain HTML, CSS and ES-module JavaScript. No framework, no `npm install`.

## Getting started

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/DevdharManpuria/manstory.git
cd manstory
npm run dev
```

Open http://127.0.0.1:4173/ in your browser.

> The page uses JavaScript modules, which browsers won't load from `file://`. Serve it through a local server instead of opening `index.html` directly.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Build `index.html`, then start the local server |
| `npm run build` | Regenerate `index.html` from `content/` |
| `npm run serve` | Start the local server without rebuilding |
| `node serve.mjs --port 8080` | Serve on a custom port |

## Editing the content

All story content lives in JSON files under `content/`:

| File | Contains |
| --- | --- |
| `chapters.json` | The chapters and their discoveries |
| `open.json` | The opening section |
| `plates.json` | Image plates |
| `references.json` | Sources and further reading |

After editing, run `npm run build`. `index.html` is generated, so changes made to it directly will be overwritten on the next build.

## Project structure

```
├── assets/        Fonts and images
├── content/       Story content (JSON)
├── css/           Stylesheets
├── js/            Client-side scripts
├── docs/          Build specification
├── build.mjs      Generates index.html from content/
├── serve.mjs      Minimal static file server
├── PRODUCT.md     Product brief
└── DESIGN.md      Design system
```

## Deployment

Dark Lines is a static site and the built `index.html` is committed, so it runs on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.).

For Vercel, use:

- **Framework preset:** Other
- **Build command:** `npm run build`
- **Output directory:** `.`

## Contributing

Corrections and improvements are welcome. Historical claims should be backed by a reliable source added to `content/references.json`. Please open an issue to discuss larger changes before submitting a pull request.
