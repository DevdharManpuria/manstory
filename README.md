<div align="center">

# MANSTORY
### A Visual Chronicle of Human Inquiry & Scientific Discovery

[![Live Deployment](https://img.shields.io/badge/Live_Site-manstory--liart.vercel.app-111111?style=for-the-badge&logo=vercel&logoColor=white)](https://manstory-liart.vercel.app/)
[![Architecture](https://img.shields.io/badge/Runtime-Zero_Dependencies-1a4be0?style=for-the-badge)](https://manstory-liart.vercel.app/)
[![JavaScript](https://img.shields.io/badge/ES_Modules-Vanilla_JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://manstory-liart.vercel.app/)
[![CSS](https://img.shields.io/badge/Styling-Custom_Tokens-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://manstory-liart.vercel.app/)

<p align="center">
  An interactive editorial publication tracing how humanity learned to measure, model, and compute the physical world—from the 20,000-year-old Ishango tally bone to gravitational-wave interferometry and deep-field infrared astronomy.
</p>

[**Explore the Live Chronicle ↗**](https://manstory-liart.vercel.app/)

</div>

---

## Overview

**Manstory** is built as a self-contained digital monograph rather than a standard web app. Every diagram, scroll transition, and typographic scale is engineered from scratch using native Web APIs, custom SVG geometry, and zero third-party runtime frameworks.

* **10 Interactive Chapters:** Each era pairs narrative prose with a custom-built, mathematically driven SVG diagram module (`sky`, `method`, `matter`, `life`, `quanta`, `space`, `code`, `machines`, `revolution`, and `reasons`).
* **18 Archival Plates:** High-resolution WebP plates with structured historical metadata, attribution, and focal-point calibration—spanning *Plimpton 322*, *Euclid's Elements*, Hooke's *Micrographia*, and *JWST*.
* **Editorial Typography:** Self-hosted variable WOFF2 cuts of **Archivo** (display & UI) and **STIX Two Text** (body & mathematical notation).
* **Scroll-Synchronized Rail:** A persistent chapter rail and continuous reading line driven by `IntersectionObserver` and `requestAnimationFrame` with full keyboard and `prefers-reduced-motion` support.

---

## The Chronicle

| Chapter | Module | Archival Plates |
| :--- | :--- | :--- |
| **01 · Sky** | `js/diagrams/sky.js` | Ishango Bone · Plimpton 322 · Copernicus (*De revolutionibus*) |
| **02 · Method** | `js/diagrams/method.js` | Euclid's *Elements* · Ibn al-Haytham (*Kitāb al-Manāẓir*) · Galileo (*Sidereus Nuncius*) |
| **03 · Matter** | `js/diagrams/matter.js` | Fraunhofer's Solar Spectrum · Röntgen's First X-Ray |
| **04 · Life** | `js/diagrams/life.js` | Hooke's *Micrographia* · Darwin's Notebook B ("I think" tree) |
| **05 · Quanta** | `js/diagrams/quanta.js` | 1927 Solvay Conference · CERN Higgs Boson Candidate Event |
| **06 · Space** | `js/diagrams/space.js` | Einstein's 1919 Eclipse Expedition · LIGO Hanford/Livingston Strain |
| **07 · Code** | `js/diagrams/code.js` | Bell Labs Point-Contact Transistor (1947) |
| **08 · Machines** | `js/diagrams/machines.js` | Apollo 11 *Earthrise* · Voyager Golden Record Cover |
| **09 · Revolution** | `js/diagrams/revolution.js` | James Webb Space Telescope Deep Field (SMACS 0723) |
| **10 · Reasons** | `js/diagrams/reasons.js` | Synthesis & Epilogue Diagram |

---

## Architecture & Repository Layout

```text
├── assets/
│   ├── fonts/          # Self-hosted variable WOFF2 fonts (Archivo, STIX Two Text)
│   └── plates/         # 18 archival WebP plates + per-plate JSON metadata
├── content/
│   ├── open.json       # Opening sequence copy and prologue data
│   ├── chapters.json   # Narrative body, milestones, and chapter structure
│   ├── plates.json     # Archival plate captions and historical context
│   └── references.json # Primary sources and bibliography
├── css/
│   ├── tokens.css      # Color palette, fluid type scale, and spacing tokens
│   ├── base.css        # Document reset and editorial grid layout
│   ├── hero.css        # Opening sequence and title treatment
│   ├── chapter.css     # Chapter spreads, plates, and diagram frames
│   ├── rail.css        # Sticky progress rail and chapter index
│   ├── line.css        # Continuous vertical reading thread
│   └── close.css       # Bibliography and colophon styling
├── js/
│   ├── diagrams/       # 11 modular SVG interactive simulations + shared math utils
│   ├── main.js         # Application bootstrap and content hydration
│   ├── hero.js         # Opening canvas and scroll handoff
│   ├── scroll.js       # Viewport tracking and section progress
│   ├── rail.js         # Chapter navigation state
│   ├── lines.js        # Reading thread geometry
│   └── record.js       # Plate and reference binding
├── index.html          # Main document shell
├── build.mjs           # Static production bundler & verifier
└── serve.mjs           # Zero-dependency local development server
```

---

## Local Development

No `npm install` or external package tree is required to run the site locally.

### 1. Clone the repository

```bash
git clone https://github.com/DevdharManpuria/manstory.git
cd manstory
```

### 2. Start the development server

```bash
node serve.mjs
```

Open the local address printed in your terminal to browse with live module loading.

### 3. Production Build

```bash
node build.mjs
```

Validates content schemas (`content/*.json`), verifies asset integrity, and outputs the static bundle ready for Vercel.

---

## Deployment

Deployed on **Vercel** at [**manstory-liart.vercel.app**](https://manstory-liart.vercel.app/). Every push to the main branch deploys directly as a static build with zero cold-start overhead.

## License

Source code is released under the **MIT License**. Historical plates and archival media belong to the public domain or their respective institutions as credited in `content/plates.json` and `content/references.json`.