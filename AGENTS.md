# Project rules for AI agents (Antigravity, Gemini, Claude Code)

This is a static portfolio site: `index.html`, `css/`, `js/`, `assets/`. The signature feature is a
scroll-driven 3D carousel (Three.js). It has broken before after unrelated edits, so follow these rules.

## File map
- `js/carousel-boot.js`: independent entry for the carousel. Loaded by its own `<script type="module">`.
- `js/hero.js`: the carousel (ribbon rail, shaders, scroll choreography, grid handoff, videos).
- `js/canvas-renderer.js`: CPU renderer used automatically when there is no GPU / no WebGL (same scene, drawn with the 2D canvas).
- `js/normalize.js`: repairs project data so a missing field can never crash anything.
- `js/main.js`: everything else (project grid, detail panel, About/Experience/Skills, navigation).
- `js/data.js`: the ONLY place for project and profile content.
- `js/vendor/three.module.min.js`: self-hosted three.js 0.170.0.
- `references/vante-ribbon.md`: original spec of the ribbon effect (source of truth for its maths and timing).

## Protected: do not edit unless the user explicitly asks about the carousel
`js/hero.js`, `js/carousel-boot.js`, `js/canvas-renderer.js`, `js/normalize.js`, `js/vendor/*`, the `#track`, `.stage`, `#gl` rules in `css/hero.css`.
If a task really needs a change there, keep it minimal and keep every crash protection
(per-card try/catch with `makeBlankCard`, the try/catch inside `loop()`, the `carousel-failed` fallback).

## Never do these (each one has broken the carousel before)
- Do not import `hero.js` from `main.js`, and do not merge `carousel-boot.js` into `main.js`.
- Do not load three.js from a CDN. The importmap must point to `./js/vendor/three.module.min.js`.
- Do not put `overflow: hidden/auto/scroll` on `html`, `body`, `#track` or any ancestor of `.stage`
  (it breaks `position: sticky`). `overflow-x: clip` is fine.
- Do not hide `#gl`, shrink `#track` below 300vh, or remove the `id`s the scripts look up.
- Do not write code at the top level of `main.js` that can throw. Wrap new init steps in `safe('name', fn)`.
- Do not hardcode project text in HTML or JS. Read it from `data.js`.

## Data rules (`js/data.js`)
- Each project needs: `slug` (unique), `title`, `category`, `summary` (strings), `stack` (array of strings).
- `cover`: `'assets/projects/<slug>/cover.webp'` or `null`. `clip`: `{ mp4: 'assets/projects/<slug>/demo.mp4' }` or omitted.
- Asset paths are lowercase, no spaces, and must match the file on disk exactly (the live server is case sensitive).
- Videos: MP4 (H.264), no audio, about 720px wide, under 3 MB. Ikshaa and JanMitra have no clip by design.
- Never invent metrics, results or claims. Ask the user for real numbers.

## After EVERY change (required, cheap)
1. Run `node tools/check.mjs`. If it fails, fix the cause or undo your change. Never edit `tools/` to make it pass.
2. If you touched `js/hero.js`, `js/carousel-boot.js`, `js/main.js`, `js/data.js`, `js/normalize.js`, `index.html` or `css/`,
   also run `node tools/check.mjs --sim` (one-time setup: `cd tools/carousel-sim && npm install`).
3. Do not finish while a check fails.

## Quota and workflow
- Make surgical, file-specific edits. Do not rewrite files or the whole project.
- Do not write extra test scripts, install puppeteer/playwright, or take screenshots. `tools/check.mjs` is the test.
- Final report: files changed (one line each) plus the check result.

## Debugging the carousel
The carousel must work WITHOUT a GPU. `?renderer=canvas` forces the CPU renderer, `?renderer=webgl` forces the GPU one,
`?view=fallback` shows the plain grid. `document.documentElement.dataset.renderer` says which one is running.
Open the site with `?debug=1` for a small status box. In DevTools, `document.documentElement.dataset.carousel`
is `ok`, `starting`, `fallback` or `error`, and `dataset.carouselMsg` holds the last error message.
