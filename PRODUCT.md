# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: static HTML, CSS and ES-module JavaScript with no framework and no npm dependencies. `node build.mjs` generates `index.html` from `content/*.json`; `node serve.mjs` serves it locally. The folder was empty, the brief asked for no unnecessary dependencies, and a single scroll-driven page needs no router, server or component runtime. Fonts and images are served from the project's own files.

## Users

Curious general readers and people reviewing the work as a frontend portfolio piece. They arrive with time to scroll, on a desktop or a phone, and want to be carried through a story rather than look something up.

## Product Purpose

An interactive, single-page journey through the history of human science, from the earliest counting and sky-watching to current research and open questions. It exists to show how discoveries build on one another: each breakthrough is presented with what it overturned and what it made possible later. Success is a visitor who scrolls to the end, remembers the connections between discoveries, and would describe the page as an experience rather than a timeline.

## Positioning

The connections are the subject. The page is organised around what each discovery inherited and enabled, not around a list of names and dates.

## Operating Context

Read in one sitting by scrolling. No account, no data entry, no backend. Works with touch, mouse and keyboard, and with reduced motion.

## Capabilities and Constraints

- Scroll-driven chapters covering early counting and astronomy, Greek thought, the scientific method, Copernicus, Galileo and Newton, electricity and electromagnetism, Darwin, DNA, relativity and quantum mechanics, computing and the internet, spaceflight, modern genetics, particle physics and AI, and open questions.
- Discovery points that reveal more detail on demand.
- A progress indicator showing position in the journey.
- A references and further-reading section.
- Historical claims and dates are verified against reliable sources before they ship.
- Must respect `prefers-reduced-motion` and work on mobile and touch devices.
- Animation must stay smooth and must never make text hard to read.
- No fake buttons, placeholder components or broken image paths.

## Brand Commitments

None binding. The brief rules out generic SaaS layouts, gradient-and-glass cards, repeated rounded rectangles and a static timeline with text beside dates. (Source: the user's written brief, 2026-11-16.)

## Evidence on Hand

No client assets. Imagery must be real, verifiable historical material in the public domain or under an open licence (for example Wikimedia Commons, NASA), stored locally with credits. No invented quotes, figures or attributions.

## Product Principles

1. Show the inheritance: every discovery names what it built on and what it unlocked.
2. Accuracy before drama: a date or claim that cannot be verified is cut.
3. Motion carries the story or it is removed.
4. Reading comes first: text stays legible at every point of every transition.
5. One continuous journey, not a set of separate pages.

## Accessibility & Inclusion

Reduced-motion support, keyboard access to every discovery point, visible focus, alt text on all imagery, and text contrast at WCAG AA or better.
