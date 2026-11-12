/**
 * hero.js — Pinned 3D ribbon carousel, giant sliding headline,
 *           Catmull-Rom fixed rail, card flight choreography,
 *           pixel-identical DOM grid handoff, and video management.
 * Driven by one smooth scroll progress number p (0 to 1).
 */

import * as THREE from 'three';
import { Canvas2DRenderer, detectGraphics } from './canvas-renderer.js?v=3';

export function initHero(projects, openProjectPanel) {
  const $ = id => document.getElementById(id);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const mix   = (a, b, t) => a + (b - a) * t;
  const ease  = t => t * t * (3 - 2 * t);
  const out   = t => 1 - (1 - t) ** 3;
  const span  = (p, a, b) => clamp((p - a) / (b - a));

  /* ---------- Carousel health status (visible in DevTools and with ?debug=1) ---------- */
  const rootEl = document.documentElement;
  const setStatus = (state, msg) => {
    rootEl.dataset.carousel = state;
    if (msg) rootEl.dataset.carouselMsg = String(msg).slice(0, 240);
  };
  setStatus('starting');
  const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';
  let debugEl = null;
  if (DEBUG) {
    debugEl = document.createElement('div');
    debugEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;font:12px/1.4 monospace;background:#000c;color:#0f0;padding:6px 10px;border-radius:6px;pointer-events:none;max-width:60vw;white-space:pre-wrap';
    document.body.appendChild(debugEl);
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const theme = {
    bg:      rootStyle.getPropertyValue('--bg').trim()      || '#141414',
    ink:     rootStyle.getPropertyValue('--ink').trim()     || '#FAFAFA',
    red:     rootStyle.getPropertyValue('--red').trim()     || '#C1121F',
    surface: rootStyle.getPropertyValue('--surface').trim() || '#1C1C1C',
    muted:   rootStyle.getPropertyValue('--muted').trim()   || '#A8A8A8',
    line:    rootStyle.getPropertyValue('--line').trim()    || '#3A3A3A',
  };

  function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  /* ---------- Scroll Progress & State ---------- */
  let target = 0, p = 0;
  let trackTop = 0, trackHeight = 1;

  /* ---------- Hero Stage & ID Card Parallax (p <= 0.005) ---------- */
  const heroStageContent = $('hero-stage-content');
  const heroCardCol      = $('hero-card-col');
  const idCard           = document.querySelector('.id-card');
  const prefersReduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroStageContent && idCard && !prefersReduced && window.innerWidth >= 900) {
    heroStageContent.addEventListener('mousemove', e => {
      if (p > 0.005) return;
      const rect = heroStageContent.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      idCard.style.transform = `rotate(6.5deg) translate(${nx * 10}px, ${ny * 8}px) rotateX(${-ny * 5}deg) rotateY(${nx * 7}deg)`;
    });
    heroStageContent.addEventListener('mouseleave', () => {
      if (p <= 0.005) {
        idCard.style.transform = 'rotate(6.5deg)';
      }
    });
  }

  /* ---------- Poster Generation ---------- */
  function drawCardPoster(cvs, proj, index) {
    try {
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, 1024, 640);

      ctx.fillStyle = theme.surface;
      ctx.fillRect(0, 0, 1024, 640);

      // Faint background grid lines
      ctx.strokeStyle = hexToRgba(theme.line, 0.4);
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x <= 1024; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 640); ctx.stroke();
      }
      for (let y = 0; y <= 640; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      }

      // Outer border
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(28, 28, 1024 - 56, 640 - 56);

      // Top corner metadata
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.08em';
      ctx.font = '600 18px "Inter Tight", system-ui, sans-serif';
      ctx.fillStyle = theme.muted;
      ctx.fillText(`[ ${(proj.category || 'PROJECT').toUpperCase()} ]`, 52, 70);

      const idxStr = String(index + 1).padStart(2, '0') + ' / ' + String(projects.length).padStart(2, '0');
      ctx.fillText(idxStr, 1024 - 52 - ctx.measureText(idxStr).width, 70);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

      // Separator
      ctx.strokeStyle = theme.line;
      ctx.beginPath(); ctx.moveTo(52, 92); ctx.lineTo(1024 - 52, 92); ctx.stroke();

      // Title
      const MAX_TITLE_W = 1024 - 104;
      const titleUpper = (proj.title || 'PROJECT').toUpperCase();
      let titleSize = 64;
      ctx.font = `400 ${titleSize}px "Anton", sans-serif`;
      while (ctx.measureText(titleUpper).width > MAX_TITLE_W && titleSize > 32) {
        titleSize -= 4;
        ctx.font = `400 ${titleSize}px "Anton", sans-serif`;
      }
      ctx.fillStyle = theme.ink;
      const titleY = 185;
      ctx.fillText(titleUpper, 52, titleY);

      // Red accent bar
      ctx.strokeStyle = theme.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(52, titleY + 24); ctx.lineTo(210, titleY + 24); ctx.stroke();

      // Summary lines
      ctx.font = '400 24px "Inter Tight", system-ui, sans-serif';
      ctx.fillStyle = theme.muted;
      const words = (proj.summary || '').split(' ');
      const lines = [];
      let curLine = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = curLine ? curLine + ' ' + words[n] : words[n];
        if (ctx.measureText(testLine).width > MAX_TITLE_W && curLine) {
          lines.push(curLine);
          curLine = words[n];
          if (lines.length === 2) break;
        } else {
          curLine = testLine;
        }
      }
      if (lines.length < 3 && curLine) lines.push(curLine);
      const sumStartY = 280;
      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        ctx.fillText(lines[i], 52, sumStartY + i * 38);
      }

      // Stack chips
      if (Array.isArray(proj.stack) && proj.stack.length > 0) {
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.08em';
        ctx.font = '600 18px "Inter Tight", system-ui, sans-serif';
        let chipX = 52;
        const chipY = 565;
        const displayChips = proj.stack.slice(0, 4);
        if (proj.stack.length > 4) displayChips.push(`+${proj.stack.length - 4}`);
        for (const tech of displayChips) {
          const techUpper = tech.toUpperCase();
          const textWidth = ctx.measureText(techUpper).width;
          const padX = 14, boxW = textWidth + padX * 2, boxH = 38;
          if (chipX + boxW > 1024 - 52) break;
          ctx.strokeStyle = theme.line;
          ctx.lineWidth = 1;
          ctx.strokeRect(chipX, chipY - 26, boxW, boxH);
          ctx.fillStyle = theme.ink;
          ctx.fillText(techUpper, chipX + padX, chipY);
          chipX += boxW + 12;
        }
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      }
    } catch (_) {}
  }

  function createCardPoster(proj, index) {
    const cvs = document.createElement('canvas');
    cvs.width  = 1024;
    cvs.height = 640;

    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace      = THREE.NoColorSpace;
    tex.minFilter       = THREE.LinearFilter;
    tex.magFilter       = THREE.LinearFilter;
    tex.generateMipmaps = false;

    // Draw immediately so frame 0 has texture pixels
    drawCardPoster(cvs, proj, index);
    tex.needsUpdate = true;

    // Redraw once fonts are confirmed ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        drawCardPoster(cvs, proj, index);
        tex.needsUpdate = true;
      }).catch(() => {});
    }

    return tex;
  }

  /* ---------- Fallback Grid (Reduced Motion / WebGL Failure) ---------- */
  const fallbackGrid = $('fallback-grid');
  function populateFallbackGrid() {
    if (!fallbackGrid) return;
    fallbackGrid.innerHTML = '';
    projects.forEach((proj, idx) => {
      const card = document.createElement('article');
      card.className = 'grid-project-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('data-slug', proj.slug);
      card.setAttribute('aria-label', `View ${proj.title} project details`);

      const padIdx = String(idx + 1).padStart(2, '0');
      let coverHtml = '';
      if (proj.cover) {
        coverHtml = `<img class="card-cover-img" src="${proj.cover}" alt="${proj.title} preview" loading="lazy" width="640" height="400">`;
      } else {
        coverHtml = `
          <div class="card-typo-cover" aria-hidden="true">
            <span class="typo-cover-number">${padIdx}</span>
            <span class="typo-cover-cat">[ ${(proj.category || 'PROJECT').toUpperCase()} ]</span>
            <div class="typo-cover-pattern"></div>
          </div>
        `;
      }

      const chipsHtml = (proj.stack || []).slice(0, 3).map(t => `<span class="card-chip">${t}</span>`).join('');
      card.innerHTML = `
        <div class="card-cover-wrap">${coverHtml}</div>
        <div class="card-body">
          <div class="card-category">[ ${(proj.category || 'PROJECT').toUpperCase()} ]</div>
          <h3 class="card-title">${proj.title}</h3>
          <p class="card-summary">${proj.summary}</p>
          <div class="card-stack">${chipsHtml}</div>
        </div>
      `;
      card.addEventListener('click', () => openProjectPanel(proj, card));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProjectPanel(proj, card);
        }
      });
      fallbackGrid.appendChild(card);
    });
  }

  /* ---------- Check WebGL & Reduced Motion ---------- */
  const urlParams    = new URLSearchParams(window.location.search);
  // Renderer choice: real GPU -> WebGL. No GPU / no WebGL / software-only WebGL -> CPU canvas renderer.
  // Override with ?renderer=canvas or ?renderer=webgl. ?view=fallback shows the plain grid.
  const rendererParam = urlParams.get('renderer') || (urlParams.get('no_webgl') === '1' ? 'canvas' : '');
  const forceFallbackGrid = urlParams.get('view') === 'fallback';
  const gfx = detectGraphics();
  const useCanvasRenderer = rendererParam === 'canvas' || (rendererParam !== 'webgl' && (!gfx.webgl || gfx.software));

  if (forceFallbackGrid || prefersReduced) {
    setStatus('fallback', prefersReduced ? 'reduced motion' : 'fallback grid requested');
    document.body.classList.add('no-webgl');
    populateFallbackGrid();
    return {
      pause: () => {},
      resume: () => {},
      updateGridMetrics: () => {}
    };
  }

  /* ================================================================
     WebGL Initialization & Ribbon Rail Engine
     ================================================================ */
  try {
    return initWebGL();
  } catch (err) {
    console.error('[carousel] WebGL init failed, using fallback grid:', err);
    setStatus('fallback', err && err.message);
    document.body.classList.add('no-webgl');
    populateFallbackGrid();
    return {
      pause: () => {},
      resume: () => {},
      updateGridMetrics: () => {}
    };
  }

  function initWebGL() {
    const WORK_PROJECTS = projects.slice(0, 10);
    const canvas = $('gl');
    if (!canvas) throw new Error('Missing #gl canvas');

    // GPU path first (when a real GPU exists); otherwise, or if WebGL fails to start, the CPU renderer.
    let renderer = null;
    if (!useCanvasRenderer) {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setClearColor(0, 0);
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        rootEl.dataset.renderer = 'webgl';
      } catch (err) {
        console.warn('[carousel] WebGL renderer failed, switching to the CPU renderer:', err);
        renderer = null;
      }
    }
    if (!renderer) {
      renderer = new Canvas2DRenderer({ canvas });
      rootEl.dataset.renderer = 'canvas';
      if (gfx && gfx.reason) rootEl.dataset.rendererReason = String(gfx.reason).slice(0, 120);
    }

    const scene = new THREE.Scene();
    const FOV = 35;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    /* ---------- Ribbon Path (161 pts CatmullRom, 1201 sampled) ---------- */
    let path, PATH_L = 1;
    const SAMPLES = 1200, pathP = [], pathT = [];
    const PH0 = -1.5, PH1 = Math.PI * 2 + 1.35;

    function buildPath() {
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const t = i / 160, ph = mix(PH0, PH1, t), cs = Math.cos(ph), u = 2 * t - 1;
        const depth = cs > 0 ? 7.6 + 16.4 * (cs ** 0.9) : 7.6 + 2.2 * cs;
        const edge  = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
        pts.push(new THREE.Vector3(
          edge * Math.sin(ph) * depth * 0.561,
          0.5 * Math.sign(u) * (Math.abs(u) ** 1.4) * depth * 0.63,
          -depth
        ));
      }
      path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      path.arcLengthDivisions = 1500;
      PATH_L = path.getLength();
      pathP.length = 0;
      pathT.length = 0;
      for (let i = 0; i <= SAMPLES; i++) {
        const u = i / SAMPLES;
        pathP.push(path.getPointAt(u));
        pathT.push(path.getTangentAt(u));
      }
    }

    const at = (s, op, ot) => {
      const f = clamp(s / PATH_L) * SAMPLES;
      const i = Math.min(SAMPLES - 1, Math.floor(f));
      const k = f - i;
      op.lerpVectors(pathP[i], pathP[i + 1], k);
      ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
    };

    /* ---------- Cards Shader Pipeline ---------- */
    const CARD_W = 2.1, CARD_H = 1.32, GAP = 0.03, STEP = CARD_W + GAP, NX = 28, NY = 3;
    const vs = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
    const fs = `uniform sampler2D map;uniform vec2 cover;uniform float aspect,ready,radius;varying vec2 vUv;
    void main(){
      vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
      float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
      float px=fwidth(d),a=1.-smoothstep(-px,px,d);
      if(a<.01)discard;
      vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
      vec3 c=mix(vec3(.075),texture2D(map,(uv-.5)*cover+.5).rgb,ready);
      float edge=smoothstep(-.012-px,-.012,d);
      gl_FragColor=vec4(mix(c,vec3(1.),edge*.1),a);
    }`;

    const textureLoader = new THREE.TextureLoader();

    const makeCard = (proj, i) => {
      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const posterTex = createCardPoster(proj, i);
      const mat = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          map:    { value: posterTex },
          cover:  { value: new THREE.Vector2(1, 1) },
          aspect: { value: CARD_W / CARD_H },
          ready:  { value: 1 },
          radius: { value: 0.018 }
        }
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);

      const c = {
        i,
        proj,
        title: proj.title,
        tex: posterTex,
        posterCover: new THREE.Vector2(1, 1),
        videoCover: new THREE.Vector2(1, 1),
        geo,
        mat,
        mesh,
        rect: null,
        v: null,
        vTex: null,
        isPlaying: false,
        hasVideoError: false
      };

      // Background image texture if available
      if (proj.cover && /\.(webp|png|jpe?g)$/i.test(proj.cover)) {
        try {
          textureLoader.load(proj.cover, loadedTex => {
            try {
              loadedTex.colorSpace = THREE.NoColorSpace;
              loadedTex.minFilter  = THREE.LinearFilter;
              loadedTex.magFilter  = THREE.LinearFilter;
              loadedTex.generateMipmaps = false;
              c.tex = loadedTex;
              const img = loadedTex.image;
              const va = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
              const ca = CARD_W / CARD_H;
              c.posterCover.set(va > ca ? ca / va : 1, va > ca ? 1 : va / ca);
              if (!c.isPlaying) {
                mat.uniforms.map.value = loadedTex;
                mat.uniforms.cover.value.copy(c.posterCover);
              }
            } catch (_) {}
          }, undefined, () => {});
        } catch (_) {}
      }

      // Safe video texture setup (never throws on missing or unplayable media)
      if (proj.clip && proj.clip.mp4) {
        try {
          const v = document.createElement('video');
          v.crossOrigin = 'anonymous';
          v.muted = true;
          v.defaultMuted = true;
          v.loop = true;
          v.playsInline = true;
          v.preload = 'none';
          v.setAttribute('playsinline', '');
          v.setAttribute('muted', '');
          v.src = proj.clip.mp4;

          const vTex = new THREE.VideoTexture(v);
          vTex.colorSpace = THREE.NoColorSpace;
          vTex.minFilter  = THREE.LinearFilter;
          vTex.magFilter  = THREE.LinearFilter;
          vTex.generateMipmaps = false;

          v.addEventListener('loadeddata', () => {
            try {
              const vw = v.videoWidth || 16, vh = v.videoHeight || 9;
              const va = vw / vh, ca = CARD_W / CARD_H;
              c.videoCover.set(va > ca ? ca / va : 1, va > ca ? 1 : va / ca);
              if (c.isPlaying && c.mesh.visible) {
                mat.uniforms.map.value = vTex;
                mat.uniforms.cover.value.copy(c.videoCover);
              }
            } catch (_) {}
          });

          v.addEventListener('error', () => {
            c.hasVideoError = true;
            c.isPlaying = false;
            mat.uniforms.map.value = c.tex;
            mat.uniforms.cover.value.copy(c.posterCover);
          });

          c.v = v;
          c.vTex = vTex;
        } catch (_) {
          c.v = null;
          c.vTex = null;
        }
      }

      return c;
    };

    // Build every card in isolation: if one project's data or media is broken, that card
    // falls back to a plain dark card and the rest of the ribbon still renders.
    const makeBlankCard = (proj, i) => {
      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const blank = new THREE.DataTexture(new Uint8Array([20, 20, 20, 255]), 1, 1);
      blank.needsUpdate = true;
      const mat = new THREE.ShaderMaterial({
        vertexShader: vs, fragmentShader: fs, transparent: true, side: THREE.DoubleSide,
        uniforms: {
          map: { value: blank }, cover: { value: new THREE.Vector2(1, 1) },
          aspect: { value: CARD_W / CARD_H }, ready: { value: 1 }, radius: { value: 0.018 }
        }
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return {
        i, proj, title: (proj && proj.title) || 'Project', tex: blank,
        posterCover: new THREE.Vector2(1, 1), videoCover: new THREE.Vector2(1, 1),
        geo, mat, mesh, rect: null, v: null, vTex: null, isPlaying: false, hasVideoError: true
      };
    };

    const cards = WORK_PROJECTS.map((proj, i) => {
      try {
        return makeCard(proj, i);
      } catch (err) {
        console.error(`[carousel] card ${i} (${proj && proj.slug}) failed, using blank card:`, err);
        return makeBlankCard(proj, i);
      }
    });

    /* ---------- Responsive Layout & Camera Setup ---------- */
    const GZ = 8;
    let W = 1, H = 1, asp = 1, cols = 3, rows = 2, tanH = 0.3153;
    let cachedGridRects = [];

    function updateGridCellRects() {
      const stage = $('stage');
      const domCards = document.querySelectorAll('#work-grid-cards .grid-project-card');
      if (!stage || !domCards || domCards.length === 0) {
        cachedGridRects = [];
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const sW = stageRect.width || innerWidth;
      const sH = stageRect.height || innerHeight;
      const vh = 2 * GZ * tanH;
      const vw = vh * camera.aspect;

      cachedGridRects = Array.from(domCards).map((cardEl, i) => {
        const rect = cardEl.getBoundingClientRect();
        const cellLeft = rect.left - stageRect.left;
        const cellTop  = rect.top - stageRect.top;
        const cw = rect.width;
        const ch = rect.height;
        const cx = cellLeft + cw / 2;
        const cy = cellTop + ch / 2;
        const nx = (cx / sW) - 0.5;
        const ny = 0.5 - (cy / sH);
        return {
          x: nx * vw,
          y: ny * vh,
          w: (cw / sW) * vw,
          h: (ch / sH) * vh,
          vw,
          vh,
          c: i % cols,
          r: Math.floor(i / cols)
        };
      });
    }

    function grid(i) {
      if (cachedGridRects[i]) return cachedGridRects[i];
      const vh = 2 * GZ * tanH, vw = vh * asp;
      const gw = vw * (cols === 3 ? 0.74 : 0.88), gap = gw * 0.017;
      const cw = (gw - gap * (cols - 1)) / cols, ch = cw / (CARD_W / CARD_H);
      const gh = ch * rows + gap * 1.6 * (rows - 1);
      const c = i % cols, r = Math.floor(i / cols);
      return {
        x: -gw / 2 + cw / 2 + c * (cw + gap),
        y:  gh / 2 - ch / 2 - r * (ch + gap * 1.6),
        w: cw,
        h: ch,
        vw,
        vh,
        c,
        r
      };
    }

    function resize() {
      const stage = $('stage');
      W   = stage ? stage.clientWidth : innerWidth;
      H   = stage ? stage.clientHeight : innerHeight;
      asp = W / H;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(W, H, false);
      camera.aspect = asp;
      camera.fov = asp < 16 / 9 ? Math.atan(0.561 / asp) * 360 / Math.PI : FOV;
      camera.updateProjectionMatrix();
      tanH = Math.tan(camera.fov * Math.PI / 360);
      cols = asp < 0.9 ? 2 : 3;
      rows = asp < 0.9 ? 3 : 2;
      updateGridCellRects();
    }

    addEventListener('resize', resize);
    resize();
    buildPath();

    /* ---------- Scroll Metric Caching (No DOM reads during scroll) ---------- */
    function updateMetrics() {
      const t = $('track');
      if (t) {
        let top = 0, el = t;
        while (el) {
          top += el.offsetTop;
          el = el.offsetParent;
        }
        trackTop = top;
        trackHeight = t.offsetHeight;
      }
      updateGridCellRects();
    }

    addEventListener('scroll', () => {
      const scrollable = trackHeight - window.innerHeight;
      target = clamp((window.scrollY - trackTop) / (scrollable > 0 ? scrollable : 1), 0, 1);
      if (target < 0.88 && !isPaused && !isOffscreen) {
        startLoop();
      }
    }, { passive: true });

    addEventListener('resize', updateMetrics);
    window.addEventListener('load', updateMetrics);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateMetrics).catch(() => {});
    }
    updateMetrics();

    /* ---------- Pose Functions ---------- */
    const op = new THREE.Vector3(), ot = new THREE.Vector3(), up = new THREE.Vector3(),
          Y  = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3();

    function poseRibbon(c, head) {
      const pos = c.geo.attributes.position, centre = head - c.i * STEP;
      for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
        const k = iy * (NX + 1) + ix, lu = ix / NX - 0.5, lv = 0.5 - iy / NY;
        at(centre + lu * CARD_W, op, ot);
        up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
        vp.copy(op).addScaledVector(up, lv * CARD_H);
        pos.setXYZ(k, vp.x, vp.y, vp.z);
      }
      pos.needsUpdate = true;
    }

    function poseGrid(c, q) {
      const g = grid(c.i), pos = c.geo.attributes.position;
      const dx = (g.c - (cols - 1) / 2) * 1.2 + (cols === 3 && g.c === 1 ? 0 : 0);
      const dy = g.r < rows / 2 ? 1 : -1;
      const ox = dx * g.vw * 0.62 * (1 - q);
      const oy = dy * g.vh * (g.c === 1 ? 0.95 : 0.34) * (1 - q);
      const tilt = (1 - q) * 0.22 * (g.c - 1 || 0.5) * dy;
      const cs = Math.cos(tilt), sn = Math.sin(tilt);
      for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
        const k = iy * (NX + 1) + ix, x = (ix / NX - 0.5) * g.w, y = (0.5 - iy / NY) * g.h;
        pos.setXYZ(k, g.x + ox + x * cs - y * sn, g.y + oy + x * sn + y * cs, -GZ - (1 - q) * 0.6 * Math.sin(ix / NX * Math.PI));
      }
      pos.needsUpdate = true;
      c.rect = g;
    }

    /* ---------- DOM Elements Driven by Timeline ---------- */
    const l1El       = $('l1');
    const l2El       = $('l2');
    const capEl      = $('cap');
    const ruleEl     = $('rule');
    const stageEl    = $('stage');
    const nameEl     = $('name');
    const gridViewEl = $('work-grid-view');
    const RIB_A = 0.14, RIB_B = 0.63;
    let canvasVisible = true;

    function updateHeroElements(pp) {
      const isMobile = window.innerWidth < 768;

      // p 0 to 0.07: hero intro layer fades to 0 and lifts 8vh
      const heroFade = 1 - span(pp, 0, 0.07);
      const heroLift = -8 * span(pp, 0, 0.07);
      if (heroStageContent) {
        heroStageContent.style.opacity = heroFade;
        heroStageContent.style.transform = heroLift !== 0 ? `translate3d(0, ${heroLift}vh, 0)` : '';
        heroStageContent.style.pointerEvents = pp > 0.07 ? 'none' : 'auto';
      }

      // ID card slides 60vw right, rotating ~8deg, and fades out
      if (heroCardCol) {
        if (isMobile) {
          heroCardCol.style.transform = '';
          heroCardCol.style.opacity = heroFade;
        } else {
          const idProg = span(pp, 0, 0.07);
          const idTx = idProg * 60;
          const idRot = 6.5 + idProg * 8;
          heroCardCol.style.transform = idProg > 0 ? `translate3d(${idTx}vw, 0, 0) rotate(${idRot}deg)` : '';
          heroCardCol.style.opacity = heroFade;
        }
      }

      // Below 768px: skip horizontal headline run
      if (isMobile) {
        if (l1El) l1El.style.opacity = 0;
        if (l2El) l2El.style.opacity = 0;
        if (capEl) capEl.style.opacity = 0;
        return;
      }

      // p 0 to 0.12: giant headline and tagline rise from 34vh below into place
      const rise = 1 - out(span(pp, 0, 0.12));
      const hlAlpha = span(pp, 0, 0.06);

      // p 0 to 0.58: ALISHA runs -50vw to +76vw, SAWANT runs +76vw to -50vw
      const run = mix(-50, 76, span(pp, 0, 0.58));
      if (l1El) {
        l1El.style.transform = `translate3d(${run}vw, ${rise * 34}vh, 0)`;
        l1El.style.opacity = hlAlpha;
      }
      if (l2El) {
        l2El.style.transform = `translate3d(${-run}vw, ${rise * 34}vh, 0)`;
        l2El.style.opacity = hlAlpha;
      }

      // p 0.52 to 0.57: tagline fades out
      if (capEl) {
        const capFade = 1 - span(pp, 0.52, 0.57);
        capEl.style.opacity = Math.min(hlAlpha, capFade);
        capEl.style.transform = `translate(-50%, calc(-50% + ${rise * 34}vh))`;
      }
    }

    /* ---------- Render Pipeline ---------- */
    function render() {
      const pp = p;

      // Hairline across middle between grid rows
      if (ruleEl) {
        ruleEl.style.transform = `scaleX(${ease(span(pp, 0.72, 0.86))})`;
        ruleEl.style.top = '50%';
      }

      // Ribbon sliding and card flight to grid
      const pr = span(pp, RIB_A, RIB_B);
      const head = mix(0, PATH_L + cards.length * STEP, pr);

      for (const c of cards) {
        const s = head - c.i * STEP, end = PATH_L - CARD_W;
        if (s < end) {
          c.mesh.visible = s > CARD_W;
          c.rect = null;
          if (c.mesh.visible) poseRibbon(c, head);
        } else if (c.i < cols * rows) {
          const st = mix(RIB_A, RIB_B, (end + c.i * STEP) / (PATH_L + cards.length * STEP));
          const q = out(span(pp, st, st + 0.13));
          c.mesh.visible = q > 0.001;
          if (c.mesh.visible) poseGrid(c, q);
        } else {
          c.mesh.visible = false;
          c.rect = null;
        }
      }

      // Video playback budget (max 3 visible playing at once)
      if (pp >= 0.90 || isOffscreen || isPaused) {
        for (const c of cards) {
          if (c.v && !c.v.paused) c.v.pause();
          c.isPlaying = false;
        }
      } else {
        let playingCount = 0;
        for (const c of cards) {
          if (!c.v || c.hasVideoError) continue;
          if (c.mesh.visible && playingCount < 3) {
            if (c.v.paused) c.v.play().catch(() => {});
            c.isPlaying = true;
            playingCount++;
          } else {
            if (!c.v.paused) c.v.pause();
            c.isPlaying = false;
          }
        }
      }

      renderer.render(scene, camera);

      // Crossfade to DOM grid at p >= 0.90
      if (pp >= 0.90) {
        if (canvasVisible) {
          canvasVisible = false;
          canvas.style.opacity = '0';
          if (gridViewEl) gridViewEl.classList.add('active');
        }
      } else if (pp < 0.88) {
        if (!canvasVisible) {
          canvasVisible = true;
          canvas.style.opacity = '1';
          if (gridViewEl) gridViewEl.classList.remove('active');
        }
      }
    }

    /* ---------- Hover Tooltip (p > 0.86 && p < 0.90) ---------- */
    if (stageEl && nameEl) {
      stageEl.addEventListener('pointermove', e => {
        let hit = null;
        if (p > 0.86 && p < 0.90) {
          const stageRect = stageEl.getBoundingClientRect();
          const nx = (e.clientX - stageRect.left) / W - 0.5;
          const ny = 0.5 - (e.clientY - stageRect.top) / H;
          for (const c of cards) {
            const g = c.rect;
            if (!g) continue;
            const x = nx * g.vw, y = ny * g.vh;
            if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) hit = c;
          }
        }
        nameEl.style.opacity = hit ? '1' : '0';
        if (hit) {
          nameEl.textContent = hit.title;
          nameEl.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 16}px)`;
        }
      });
    }

    /* ---------- Render Loop Management ---------- */
    let animId = null;
    let isPaused = false;
    let isOffscreen = false;

    function shouldRun() {
      if (isPaused || isOffscreen) return false;
      if (p >= 0.90 && Math.abs(target - p) < 0.0001) return false;
      return true;
    }

    let lastFrameErrorAt = -1e9;
    function loop() {
      // An exception inside a frame must never stop the loop (that is what made the
      // carousel freeze or vanish). Log it (throttled) and always schedule the next frame.
      try {
        p += (target - p) * 0.09;
        if (Math.abs(target - p) < 0.00005) p = target;

        updateHeroElements(p);
        render();
        if (rootEl.dataset.carousel !== 'ok') setStatus('ok');
      } catch (err) {
        const now = performance.now();
        if (now - lastFrameErrorAt > 2000) {
          lastFrameErrorAt = now;
          console.error('[carousel] frame error (loop keeps running):', err);
        }
        setStatus('error', err && err.message);
      }

      if (debugEl) {
        const playing = cards.filter(c => c.isPlaying).length;
        debugEl.textContent = `carousel: ${rootEl.dataset.carousel} (${rootEl.dataset.renderer || '?'}) | p=${p.toFixed(3)} | cards=${cards.length} | videos playing=${playing}` +
          (rootEl.dataset.carouselMsg ? `\nlast error: ${rootEl.dataset.carouselMsg}` : '');
      }

      let again = false;
      try { again = shouldRun(); } catch (_) { again = true; }
      if (again) {
        animId = requestAnimationFrame(loop);
      } else {
        animId = null;
      }
    }

    function startLoop() {
      if (animId === null && shouldRun()) {
        animId = requestAnimationFrame(loop);
      }
    }

    // IntersectionObserver for stage
    const trackEl = $('track');
    if (trackEl && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        isOffscreen = !entries[0].isIntersecting;
        if (isOffscreen) {
          for (const c of cards) {
            if (c.v && !c.v.paused) c.v.pause();
          }
        } else {
          startLoop();
        }
      }, { threshold: 0 });
      obs.observe(trackEl);
    }

    updateHeroElements(p);
    startLoop();

    return {
      pause: () => {
        isPaused = true;
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        for (const c of cards) {
          if (c.v && !c.v.paused) c.v.pause();
        }
      },
      resume: () => {
        if (!isPaused) return;
        isPaused = false;
        startLoop();
      },
      updateGridMetrics: () => {
        updateGridCellRects();
      }
    };
  }
}
