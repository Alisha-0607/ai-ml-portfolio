/**
 * Simulated carousel test (no browser, no GPU). Run via: node tools/check.mjs --sim
 *
 * Loads index.html + js/*.js into a fake DOM with a stubbed WebGL renderer, scrolls from
 * top to bottom and back, and checks that the carousel keeps rendering and hands off to the
 * grid. It also checks it survives bad data, render errors and a broken main.js.
 * Setup once: cd tools/carousel-sim && npm install
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const work = path.join(here, '.work');

// 'three' resolves to a shim: the real three.js maths, with a stubbed WebGLRenderer
const shim = path.join(here, 'node_modules', 'three');
fs.mkdirSync(shim, { recursive: true });
fs.writeFileSync(path.join(shim, 'package.json'), JSON.stringify({ name: 'three', type: 'module', main: 'index.js', exports: './index.js' }));
fs.writeFileSync(path.join(shim, 'index.js'), `export * from 'three-real';
export class WebGLRenderer {
  constructor(o){ this.domElement = o && o.canvas; this.renders = 0; globalThis.__renderer = this; }
  setClearColor(){} setPixelRatio(){} setSize(){} dispose(){}
  render(){ if (globalThis.__failRenders > 0) { globalThis.__failRenders--; throw new Error('injected render failure'); } this.renders++; }
}
`);

const files = ['main.js', 'hero.js', 'data.js', 'normalize.js', 'carousel-boot.js', 'canvas-renderer.js'];
const append = (dir, file, text) => fs.appendFileSync(path.join(dir, file), text);

const scenarios = [
  { name: 'normal run', expect: 'carousel' },
  { name: 'bad project data (wrong types, missing files)', expect: 'carousel',
    mutate: d => append(d, 'data.js', "\nprojects[1].cover = {}; projects[2].clip = { mp4: 123 }; projects[3].title = undefined; projects[3].stack = undefined; projects[4].summary = null; projects[5].cover = 'assets/missing/nope.webp'; projects[6].clip = { mp4: 'assets/missing/nope.mp4' };\n") },
  { name: 'null / undefined project entries', expect: 'carousel',
    mutate: d => append(d, 'data.js', '\nprojects[2] = null; projects.splice(4, 0, undefined);\n') },
  { name: 'broken About / Experience / Skills data', expect: 'carousel',
    mutate: d => append(d, 'data.js', "\nprofile.experience = 'not-an-array'; profile.skills = null; profile.about.stats = 5;\n") },
  { name: '8 render errors in a row', expect: 'carousel', env: { FAIL_RENDERS: '8' } },
  { name: 'syntax error in main.js', expect: 'carousel', mutate: d => append(d, 'main.js', '\n}}}} syntax error\n') },
  { name: 'syntax error in hero.js (fallback grid)', expect: 'fallback', mutate: d => append(d, 'hero.js', '\n}}}} syntax error\n') },
  // No GPU: the carousel must still run end to end, using the CPU canvas renderer
  { name: 'NO GPU: browser has no WebGL at all', expect: 'carousel', renderer: 'canvas', env: { GFX: 'none' } },
  { name: 'NO GPU: software-only WebGL', expect: 'carousel', renderer: 'canvas', env: { GFX: 'software' } },
  { name: 'NO GPU forced with ?renderer=canvas', expect: 'carousel', renderer: 'canvas', env: { URL_SEARCH: '?renderer=canvas' } },
  { name: 'NO GPU + bad project data + 8 render errors', expect: 'carousel', renderer: 'canvas', env: { GFX: 'none', FAIL_RENDERS: '8' },
    mutate: d => append(d, 'data.js', "\nprojects[1].cover = {}; projects[3].title = undefined; projects[3].stack = undefined; projects[6].clip = { mp4: 'assets/missing/nope.mp4' };\n") }
];

let bad = 0;
console.log('Carousel simulation:');
for (const [i, sc] of scenarios.entries()) {
  const dir = path.join(work, `s${i}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const f of files) fs.copyFileSync(path.join(root, 'js', f), path.join(dir, f));
  if (sc.mutate) sc.mutate(dir);
  const r = spawnSync(process.execPath, [path.join(here, 'scenario.mjs')], {
    encoding: 'utf8', cwd: here, env: { ...process.env, WORK: `./.work/s${i}`, FAIL_RENDERS: '', ...(sc.env || {}) }
  });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('SUMMARY '));
  let s = null;
  try { s = JSON.parse(line.slice(8)); } catch { /* handled below */ }
  let ok = false;
  let why = 'no result (the simulation itself crashed)';
  if (s && sc.expect === 'carousel') {
    ok = !s.fallbackShown && s.gridHandoffAt92 && s.returnsToCarouselAtEnd;
    if (sc.renderer === 'canvas') ok = ok && s.renderer === 'canvas' && s.drawImageCalls > 200;   // CPU renderer really painted cards
    else ok = ok && s.rendersAtEnd > s.rendersAtStart;                                            // GPU path kept rendering
    why = ok ? '' : `carousel did not run correctly ${JSON.stringify(s)}`;
  } else if (s && sc.expect === 'fallback') {
    ok = s.fallbackShown && s.fallbackCards > 0;
    why = ok ? '' : `fallback grid did not appear ${JSON.stringify(s)}`;
  }
  if (!ok) bad++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${sc.name}${ok ? '' : '  <- ' + why + '\n' + (r.stderr || '').split('\n').slice(0, 3).join('\n')}`);
}
fs.rmSync(work, { recursive: true, force: true });
process.exit(bad ? 1 : 0);
