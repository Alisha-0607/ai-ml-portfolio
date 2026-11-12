#!/usr/bin/env node
/**
 * tools/check.mjs: fast safety check for the portfolio. Run after EVERY change:
 *
 *     node tools/check.mjs            static checks (about 1 second, no installs)
 *     node tools/check.mjs --sim      static checks + simulated carousel run
 *                                     (first time: cd tools/carousel-sim && npm install)
 *
 * It catches the things that made the 3D carousel disappear before: syntax errors,
 * missing DOM ids, bad data.js fields, missing or wrongly cased asset files, CSS that hides
 * or un-sticks the stage, and removed crash protections.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const failures = [];
const warnings = [];
const fail = m => failures.push(m);
const warn = m => warnings.push(m);

/* 1. JavaScript syntax (every file in js/, vendor excluded) */
const jsFiles = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'));
for (const f of jsFiles) {
  const tmp = path.join(os.tmpdir(), `chk_${process.pid}_${f}.mjs`);
  fs.copyFileSync(path.join(root, 'js', f), tmp);
  const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  fs.unlinkSync(tmp);
  if (r.status !== 0) fail(`Syntax error in js/${f}: ${(r.stderr || '').split('\n').find(l => /Error/.test(l)) || 'see node --check'}`);
}

/* 2. index.html wiring */
const html = read('index.html');
const importmap = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
if (!importmap) {
  fail('index.html has no importmap for "three".');
} else {
  let target = '';
  try { target = JSON.parse(importmap[1]).imports.three; } catch { fail('importmap JSON is invalid.'); }
  if (/^https?:/.test(target)) fail(`importmap loads three.js from a CDN (${target}). It must use the local file ./js/vendor/three.module.min.js.`);
  else if (target && !exists(target.replace(/^\.\//, ''))) fail(`importmap points to a missing file: ${target}`);
}
const iBoot = html.indexOf('js/carousel-boot.js');
const iMain = html.indexOf('js/main.js');
if (iBoot < 0) fail('index.html must load js/carousel-boot.js (the carousel entry point) with its own <script type="module">.');
if (iMain < 0) fail('index.html must load js/main.js.');
if (iBoot >= 0 && iMain >= 0 && iBoot > iMain) fail('carousel-boot.js must be loaded BEFORE main.js.');

/* 3. DOM ids that the scripts look up */
const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const CORE_IDS = ['gl', 'track', 'stage', 'work-grid-view', 'l1', 'l2', 'cap', 'rule', 'name', 'hero-stage-content', 'hero-card-col', 'fallback-grid'];
for (const id of CORE_IDS) if (!htmlIds.has(id)) fail(`index.html is missing id="${id}", which the carousel needs.`);
for (const f of ['hero.js', 'main.js', 'carousel-boot.js']) {
  const src = read(`js/${f}`);
  const used = new Set([...src.matchAll(/(?:\$|getElementById)\(\s*'([^']+)'\s*\)/g)].map(m => m[1]));
  for (const id of used) if (!htmlIds.has(id) && !CORE_IDS.includes(id)) warn(`js/${f} looks up id "${id}" which is not in index.html (ok only if it is created dynamically).`);
}

/* 4. data.js contract and asset files (case-exact, because the live server is case sensitive) */
const exactExists = rel => {
  const parts = rel.split('/');
  let dir = root;
  for (const part of parts) {
    let names;
    try { names = fs.readdirSync(dir); } catch { return false; }
    if (!names.includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
};
try {
  const tmp = path.join(os.tmpdir(), `data_${process.pid}.mjs`);
  fs.copyFileSync(path.join(root, 'js', 'data.js'), tmp);
  const { projects } = await import(pathToFileURL(tmp).href);
  fs.unlinkSync(tmp);
  if (!Array.isArray(projects) || projects.length === 0) fail('data.js must export a non-empty projects array.');
  const slugs = new Set();
  (projects || []).forEach((p, i) => {
    const tag = `project #${i + 1} (${p && p.slug})`;
    if (!p || typeof p !== 'object') return fail(`${tag} is not an object.`);
    for (const k of ['slug', 'title', 'category', 'summary']) if (typeof p[k] !== 'string' || !p[k]) fail(`${tag}: "${k}" must be a non-empty string.`);
    if (!Array.isArray(p.stack)) fail(`${tag}: "stack" must be an array of strings.`);
    if (!Array.isArray(p.highlights)) warn(`${tag}: "highlights" should be an array.`);
    if (slugs.has(p.slug)) fail(`${tag}: duplicate slug.`);
    slugs.add(p.slug);
    if (p.cover != null) {
      if (typeof p.cover !== 'string') fail(`${tag}: "cover" must be a path string or null.`);
      else if (!exactExists(p.cover)) fail(`${tag}: cover file not found (check spelling and lowercase): ${p.cover}`);
    }
    if (p.clip != null) {
      const mp4 = p.clip && p.clip.mp4;
      if (typeof mp4 !== 'string') fail(`${tag}: clip.mp4 must be a path string.`);
      else if (!exactExists(mp4)) fail(`${tag}: video file not found (check spelling and lowercase): ${mp4}`);
      else if (fs.statSync(path.join(root, mp4)).size > 3 * 1024 * 1024) warn(`${tag}: ${mp4} is over 3 MB; compress it (720px wide, no audio) or the carousel will stutter.`);
      if (!p.cover) warn(`${tag}: has a clip but no cover image (the cover is the poster before the video plays).`);
    }
    if (p.media && p.media.type === 'panel') warn(`${tag}: media type "panel" is no longer shown; use clip and cover instead.`);
  });
  if (projects && projects.length > 10) warn('The carousel is designed for at most 10 cards.');
} catch (err) {
  fail(`data.js could not be loaded: ${err.message}`);
}

/* 5. Asset file names: lowercase, no spaces */
const walk = d => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
if (exists('assets/projects')) {
  for (const f of walk('assets/projects')) {
    if (/\s/.test(f)) warn(`File name contains a space (breaks URLs): ${f}`);
    else if (/[A-Z]/.test(path.basename(f)) && /\.(mp4|webp|png|jpe?g)$/i.test(f)) warn(`File name has capital letters (case-sensitive on the live server): ${f}`);
  }
}

/* 6. CSS that can hide the carousel or break the sticky stage */
const css = ['css/base.css', 'css/hero.css'].filter(exists).map(read).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
const rulesFor = sel => rules.filter(r => r.sel.split(',').map(s => s.trim()).includes(sel));
for (const r of rulesFor('#gl')) if (/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0\s*[;}]?\s*$/m.test(r.body)) fail('CSS hides the #gl canvas (display:none / visibility:hidden / opacity:0) outside the .no-webgl fallback.');
for (const sel of ['html', 'body', '#track', '.scroll-track', '#stage-wrapper']) {
  for (const r of rulesFor(sel)) if (/overflow(-x|-y)?\s*:\s*(hidden|auto|scroll)/.test(r.body)) fail(`CSS: "${sel}" has overflow hidden/auto/scroll, which breaks the sticky stage. Use overflow-x: clip if needed.`);
}
const stageRule = [...rulesFor('.stage'), ...rulesFor('#stage')].map(r => r.body).join(' ');
if (!/position\s*:\s*sticky/.test(stageRule)) fail('CSS: .stage must be position: sticky.');
const trackH = (rulesFor('#track').map(r => r.body).join(' ').match(/height\s*:\s*(\d+)vh/) || [])[1];
if (!trackH || +trackH < 300) fail('CSS: #track needs a height of at least 300vh (the scroll distance that drives the carousel).');

/* 7. Crash protections that must never be removed */
const must = (file, needle, why) => { if (!read(file).includes(needle)) fail(`${file}: protection removed (${why}).`); };
must('js/hero.js', 'frame error (loop keeps running)', 'the frame loop must catch errors and keep running');
must('js/hero.js', 'makeBlankCard', 'one broken project must not stop the other cards');
must('js/carousel-boot.js', 'carousel-failed', 'carousel failure must show the fallback grid');
must('js/carousel-boot.js', 'normalizeProjects', 'project data must be normalised');
must('js/main.js', 'normalizeProjects', 'project data must be normalised');
must('js/main.js', 'safe(', 'each init step must be isolated');
must('js/main.js', 'ensurePanelVisible', 'the project panel must always end up visible after a click');
for (const f of ['assets/alisha-portrait-1.webp', 'assets/alisha-portrait-2.webp']) if (!exists(f)) fail(`${f} is missing (hero ID card photo).`);
if (/from\s+['"]\.\/hero\.js/.test(read('js/main.js'))) fail('js/main.js must NOT import hero.js. The carousel starts from carousel-boot.js.');
must('js/hero.js', 'Canvas2DRenderer', 'the no-GPU CPU renderer must stay wired in');
must('js/hero.js', 'detectGraphics', 'GPU detection must stay');
if (!exists('js/canvas-renderer.js')) fail('js/canvas-renderer.js is missing (the no-GPU renderer).');
if (!exists('js/vendor/three.module.min.js')) fail('js/vendor/three.module.min.js is missing.');

/* 8. Optional: simulated carousel run */
if (process.argv.includes('--sim')) {
  const simDir = path.join(root, 'tools', 'carousel-sim');
  if (!fs.existsSync(path.join(simDir, 'node_modules', 'jsdom'))) {
    warn('Simulation skipped: run "cd tools/carousel-sim && npm install" once, then re-run with --sim.');
  } else {
    const r = spawnSync(process.execPath, [path.join(simDir, 'run.mjs')], { encoding: 'utf8', cwd: simDir });
    process.stdout.write(r.stdout || '');
    if (r.status !== 0) fail('Carousel simulation failed (see above).');
  }
}

/* Report */
for (const w of warnings) console.log(`  warn  ${w}`);
for (const f of failures) console.log(`  FAIL  ${f}`);
if (failures.length) {
  console.log(`\nCHECK FAILED: ${failures.length} problem(s). Fix them or undo the last change. Do not edit this script to make it pass.`);
  process.exit(1);
}
console.log(`\nCHECK PASSED${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
