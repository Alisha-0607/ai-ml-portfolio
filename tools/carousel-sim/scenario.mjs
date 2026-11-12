/* Runs one simulated scenario. Used by run.mjs; do not run directly. */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.resolve(here,'../../index.html'),'utf8').replace(/<script[\s\S]*?<\/script>/g,'');
const dom = new JSDOM(html,{url:'http://localhost/'+(process.env.URL_SEARCH||''),pretendToBeVisual:true});
const w = dom.window;
const errors=[]; 
const counts = { drawImage:0, clip:0, clearRect:0 };
globalThis.__ctxCounts = counts;
const noopCtx = new Proxy({}, { get:(t,k)=> { if (k in counts) return ()=>{ counts[k]++; }; return k==='measureText'? (s)=>({width:String(s).length*8}) : (k==='canvas'? {} : ()=>{}); }, set:()=>true });
const GFX = process.env.GFX || 'hw';   // hw = real GPU, software = slow software WebGL only, none = no WebGL

w.HTMLCanvasElement.prototype.getContext = function(type, attrs){
  if (type === '2d') return noopCtx;
  if (GFX === 'none') return null;
  if (GFX === 'software' && attrs && attrs.failIfMajorPerformanceCaveat) return null;
  return noopCtx;
};
w.WebGLRenderingContext = function(){};
w.HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
w.HTMLMediaElement.prototype.pause = function(){ };
w.matchMedia = w.matchMedia || (()=>({matches:false,addEventListener(){},removeEventListener(){}}));
w.IntersectionObserver = class { constructor(cb){this.cb=cb} observe(el){ this.cb([{isIntersecting:true,target:el}]) } disconnect(){} unobserve(){} };
w.ResizeObserver = class { observe(){} disconnect(){} unobserve(){} };
Object.defineProperty(w,'innerWidth',{value:1440,writable:true}); Object.defineProperty(w,'innerHeight',{value:900,writable:true});
let scrollY=0; Object.defineProperty(w,'scrollY',{get:()=>scrollY}); Object.defineProperty(w,'pageYOffset',{get:()=>scrollY});
const H = w.HTMLElement.prototype;
Object.defineProperty(H,'offsetHeight',{get(){ return this.id==='track'?4500:this.id==='stage'?832:100 }});
Object.defineProperty(H,'offsetWidth',{get(){ return this.id==='stage'?1440:300 }});
Object.defineProperty(H,'offsetTop',{get(){ return 0 }});
Object.defineProperty(H,'offsetParent',{get(){ return null }});
Object.defineProperty(H,'clientWidth',{get(){ return this.id==='stage'||this.id==='gl'?1440:300 }});
Object.defineProperty(H,'clientHeight',{get(){ return this.id==='stage'||this.id==='gl'?832:100 }});
w.Element.prototype.getBoundingClientRect = function(){ const s=this.id==='stage'||this.id==='gl'; return {x:0,y:0,left:0,top:0,width:s?1440:300,height:s?832:100,right:s?1440:300,bottom:s?832:100,toJSON(){}} };
// copy globals for module code
for (const k of ['window','document','navigator','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','addEventListener','removeEventListener','matchMedia','innerWidth','innerHeight','devicePixelRatio','IntersectionObserver','ResizeObserver','Element','HTMLElement','URLSearchParams','location','history','HTMLCanvasElement','Image','Event','CustomEvent']) {
  try { Object.defineProperty(globalThis,k,{configurable:true,get:()=>(k==='window'?w:(typeof w[k]==='function'&&!/^[A-Z]/.test(k)?w[k].bind(w):w[k])), set(v){} }); } catch(e){}
}
Object.defineProperty(globalThis,'scrollY',{configurable:true,get:()=>scrollY});
globalThis.window=w; 
// frame pump
const frames=[]; w.requestAnimationFrame = (cb)=>{ frames.push(cb); return frames.length; }; w.cancelAnimationFrame=()=>{};
globalThis.requestAnimationFrame = w.requestAnimationFrame; globalThis.cancelAnimationFrame=()=>{};
const origErr=console.error; console.error=(...a)=>{errors.push(a.join(' ')); };
const warns=[]; const origWarn=console.warn; console.warn=(...a)=>{warns.push(a.join(' ').slice(0,160))};
const pump=(n=1)=>{ for(let i=0;i<n;i++){ const cbs=frames.splice(0); for(const cb of cbs){ try{ cb(performance.now()); }catch(e){ errors.push('LOOP THREW: '+e.message+' @ '+(e.stack||'').split('\n')[1]); } } } };
const WORK = process.env.WORK || '.';
const {projects} = await import(WORK+'/data.js');
try { await import(WORK+'/carousel-boot.js'); } catch(e){ errors.push('carousel-boot THREW: '+e.message); }
try { await import(WORK+'/main.js'); } catch(e){ errors.push('main.js import THREW: '+String(e.message).split('\n')[0]); }
await new Promise(r=>setTimeout(r,500));
if (process.env.VERBOSE) console.log('body.no-webgl:', w.document.body.classList.contains('no-webgl'), '| data-carousel:', w.document.documentElement.dataset.carousel, '| fallback cards:', w.document.querySelectorAll('#fallback-grid .grid-project-card').length, '| grid cards:', w.document.querySelectorAll('#work-grid-cards .grid-project-card').length);
if (process.env.FAIL_RENDERS) { globalThis.__failRenders = +process.env.FAIL_RENDERS; }
counts.drawImage = 0;
const gridView = w.document.getElementById('work-grid-view');
const rows=[];
for (const p of [0,0.02,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.88,0.92,1,0.95,0.5,0.1,0]) {
  scrollY = p*(4500-900); w.dispatchEvent(new w.Event('scroll'));
  pump(240);
  rows.push({p, renders: globalThis.__renderer?.renders, gridActive: gridView?.classList.contains('active'), canvasOpacity: w.document.getElementById('gl')?.style.opacity, pendingFrames: frames.length});
}

const r92=rows.find(r=>r.p===0.92), r0=rows[0], rEnd=rows[rows.length-1], r88=rows.find(r=>r.p===0.88);
console.log('SUMMARY', JSON.stringify({renderer: w.document.documentElement.dataset.renderer || '', drawImageCalls: counts.drawImage, fallbackShown: w.document.body.classList.contains('no-webgl'), rendersAtStart:r0.renders, rendersAtEnd:rEnd.renders, gridHandoffAt92:r92&&r92.gridActive, returnsToCarouselAtEnd: rEnd.canvasOpacity==='1' && !rEnd.gridActive, mainGridCards: w.document.querySelectorAll('#work-grid-cards .grid-project-card').length, fallbackCards: w.document.querySelectorAll('#fallback-grid .grid-project-card').length}));
errors.filter(e=>!/MODULE_TYPELESS/.test(e)).slice(0,8).forEach(e=>console.log('ERR',e.slice(0,300)));

process.exit(0);
