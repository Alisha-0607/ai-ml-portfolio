/**
 * canvas-renderer.js: a CPU renderer for the 3D carousel. No GPU and no WebGL needed.
 *
 * It has the same small interface as THREE.WebGLRenderer (setClearColor, setPixelRatio,
 * setSize, render), so hero.js can use either one. It reads the exact same scene
 * (cards posed on the ribbon rail by hero.js), projects every vertex through the camera,
 * and paints the card textures with the 2D canvas API as perspective-correct-enough
 * textured triangles (painter's algorithm, far to near). Videos, posters and covers all
 * work because a 2D canvas can draw <video>, <img> and <canvas> sources directly.
 *
 * Differences from the WebGL look (deliberate, for speed): square card corners and no
 * faint edge highlight.
 */
import * as THREE from 'three';

const SEAM_EXPAND_PX = 0.9;   // grows each triangle's edges outward so no hairline gaps show between neighbours
const STEP_FINE = 2;          // draw every 2nd ribbon column (14 segments per card)
const STEP_FAST = 4;          // automatic speed mode on slow CPUs (7 segments per card)

function sourceInfo(texture) {
  const img = texture && texture.image;
  if (!img) return null;
  if (img.videoWidth !== undefined) {                       // <video>
    return img.readyState >= 2 && img.videoWidth ? { img, w: img.videoWidth, h: img.videoHeight } : null;
  }
  if (img.naturalWidth !== undefined) {                     // <img>
    return img.complete && img.naturalWidth ? { img, w: img.naturalWidth, h: img.naturalHeight } : null;
  }
  if (img.width && img.height && !img.data) {               // <canvas> or ImageBitmap
    return { img, w: img.width, h: img.height };
  }
  return null;                                              // DataTexture (blank card) etc.
}

// Maps the source triangle (x,y) onto the destination triangle (u,v) with one affine transform.
function affine(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
  const delta = x0 * y1 + y0 * x2 + x1 * y2 - y1 * x2 - y0 * x1 - x0 * y2;
  if (Math.abs(delta) < 1e-6) return null;
  return [
    (u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2) / delta,
    (v0 * y1 + y0 * v2 + v1 * y2 - y1 * v2 - y0 * v1 - v0 * y2) / delta,
    (x0 * u1 + u0 * x2 + x1 * u2 - u1 * x2 - u0 * x1 - x0 * u2) / delta,
    (x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2) / delta,
    (x0 * y1 * u2 + y0 * u1 * x2 + u0 * x1 * y2 - u0 * y1 * x2 - y0 * x1 * u2 - x0 * u1 * y2) / delta,
    (x0 * y1 * v2 + y0 * v1 * x2 + v0 * x1 * y2 - v0 * y1 * x2 - y0 * x1 * v2 - x0 * v1 * y2) / delta
  ];
}

// Pushes every edge of the triangle outward by d pixels (mitered, length-limited).
function expandedTriangle(p0, p1, p2, d) {
  const pts = [p0, p1, p2];
  const cx = (p0.sx + p1.sx + p2.sx) / 3, cy = (p0.sy + p1.sy + p2.sy) / 3;
  const normals = [];
  for (let i = 0; i < 3; i++) {
    const a = pts[i], b = pts[(i + 1) % 3];
    const ex = b.sx - a.sx, ey = b.sy - a.sy, len = Math.hypot(ex, ey) || 1;
    let nx = ey / len, ny = -ex / len;
    if (nx * ((a.sx + b.sx) / 2 - cx) + ny * ((a.sy + b.sy) / 2 - cy) < 0) { nx = -nx; ny = -ny; }
    normals.push([nx, ny]);
  }
  return pts.map((p, i) => {
    const n1 = normals[(i + 2) % 3], n2 = normals[i];            // edges meeting at this vertex
    let sx = n1[0] + n2[0], sy = n1[1] + n2[1];
    const k = d / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
    sx *= k; sy *= k;
    const m = Math.hypot(sx, sy), max = d * 4;
    if (m > max) { sx *= max / m; sy *= max / m; }
    return [p.sx + sx, p.sy + sy];
  });
}

export class Canvas2DRenderer {
  constructor({ canvas }) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas is not available');
    this.domElement = canvas;
    this.ctx = ctx;
    this.kind = 'canvas2d';
    this.outputColorSpace = '';
    this.dpr = 1;
    this.frames = 0;
    this.trianglesDrawn = 0;
    this._m = new THREE.Matrix4();
    this.columnStep = STEP_FINE;   // switches itself to STEP_FAST if frames get slow
    this.avgMs = 0;
  }

  setClearColor() { /* always transparent */ }

  setPixelRatio(r) {
    // 1 is plenty for the small cards and keeps CPU rendering fast
    this.dpr = Math.min(r || 1, 1);
  }

  setSize(w, h) {
    this.domElement.width = Math.max(1, Math.round(w * this.dpr));
    this.domElement.height = Math.max(1, Math.round(h * this.dpr));
  }

  dispose() {}

  render(scene, camera) {
    const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
    const canvas = this.domElement;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width, ch = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';

    camera.updateMatrixWorld();
    this._m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const e = this._m.elements;

    const tris = [];
    for (const mesh of scene.children) {
      if (!mesh.visible || !mesh.isMesh) continue;
      const geo = mesh.geometry;
      const pos = geo.attributes.position.array;
      const params = geo.parameters || {};
      const segX = params.widthSegments || 28;
      const segY = params.heightSegments || 3;
      const stride = segX + 1;
      const uni = mesh.material.uniforms;
      const tex = uni.map.value;
      const cover = uni.cover.value;
      const src = sourceInfo(tex);

      // columns to draw (always include the last one)
      const cols = [];
      for (let ix = 0; ix <= segX; ix += this.columnStep) cols.push(ix);
      if (cols[cols.length - 1] !== segX) cols.push(segX);

      // project the top and bottom vertex of every column (the sheet is flat vertically)
      const top = [], bottom = [];
      for (const ix of cols) {
        for (const [iy, list] of [[0, top], [segY, bottom]]) {
          const k = (iy * stride + ix) * 3;
          const x = pos[k], y = pos[k + 1], z = pos[k + 2];
          const w = e[3] * x + e[7] * y + e[11] * z + e[15];
          if (w <= 0.01) { list.push(null); continue; }
          const nx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w;
          const ny = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
          list.push({ sx: (nx * 0.5 + 0.5) * cw, sy: (0.5 - ny * 0.5) * ch, nx, ny, w, u: ix / segX, v: iy === 0 ? 1 : 0 });
        }
      }

      for (let i = 0; i < cols.length - 1; i++) {
        const a = top[i], b = bottom[i], c = bottom[i + 1], d = top[i + 1];
        if (!a || !b || !c || !d) continue;
        // skip quads that are completely outside the canvas
        const minX = Math.min(a.sx, b.sx, c.sx, d.sx), maxX = Math.max(a.sx, b.sx, c.sx, d.sx);
        const minY = Math.min(a.sy, b.sy, c.sy, d.sy), maxY = Math.max(a.sy, b.sy, c.sy, d.sy);
        if (maxX < -2 || minX > cw + 2 || maxY < -2 || minY > ch + 2) continue;
        tris.push({ p: [a, b, d], depth: (a.w + b.w + d.w) / 3, src, cover });
        tris.push({ p: [b, c, d], depth: (b.w + c.w + d.w) / 3, src, cover });
      }
    }

    tris.sort((m, n) => n.depth - m.depth);   // far to near

    for (const t of tris) {
      const [p0, p1, p2] = t.p;
      // WebGL front faces are counter-clockwise in NDC; the card shader mirrors u on back faces
      const area = (p1.nx - p0.nx) * (p2.ny - p0.ny) - (p2.nx - p0.nx) * (p1.ny - p0.ny);
      const back = area <= 0;

      // expanded clip triangle (hides seams)
      ctx.save();
      ctx.beginPath();
      expandedTriangle(p0, p1, p2, SEAM_EXPAND_PX).forEach((q, i) => {
        if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      });
      ctx.closePath();
      ctx.clip();

      if (!t.src) {
        ctx.fillStyle = '#161616';
        ctx.fill();
      } else {
        const { img, w, h } = t.src;
        const map = p => {
          const u = back ? 1 - p.u : p.u;
          const u2 = (u - 0.5) * t.cover.x + 0.5;
          const v2 = (p.v - 0.5) * t.cover.y + 0.5;
          return [u2 * w, (1 - v2) * h];
        };
        const [s0x, s0y] = map(p0), [s1x, s1y] = map(p1), [s2x, s2y] = map(p2);
        const m = affine(s0x, s0y, s1x, s1y, s2x, s2y, p0.sx, p0.sy, p1.sx, p1.sy, p2.sx, p2.sy);
        if (m) {
          ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
          ctx.drawImage(img, 0, 0);
        }
      }
      ctx.restore();
    }

    this.frames++;
    this.trianglesDrawn = tris.length;

    // Self-tuning: use fewer, larger segments when frames are slow, more when there is headroom.
    if (t0) {
      const ms = performance.now() - t0;
      this.avgMs = this.avgMs ? this.avgMs * 0.9 + ms * 0.1 : ms;
      if (this.columnStep === STEP_FINE && this.avgMs > 20) this.columnStep = STEP_FAST;
      else if (this.columnStep === STEP_FAST && this.avgMs < 7) this.columnStep = STEP_FINE;
    }
  }
}

/**
 * Decides which renderer to use.
 * Returns { webgl, software, reason }:
 *   webgl    false  -> the browser has no WebGL at all
 *   software true   -> WebGL exists but only as a slow software emulation (no real GPU)
 * Either case means "use the CPU renderer".
 */
export function detectGraphics() {
  const result = { webgl: false, software: false, reason: '' };
  const release = gl => {
    try { const x = gl && gl.getExtension && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (_) {}
  };
  try {
    const c1 = document.createElement('canvas');
    // returns null when only a slow software renderer is available
    const hw = c1.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
               c1.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    if (hw) {
      result.webgl = true;
      try {
        const ext = hw.getExtension('WEBGL_debug_renderer_info');
        const name = ext ? String(hw.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
        result.reason = name;
        if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)) result.software = true;
      } catch (_) {}
      release(hw);
      return result;
    }
    const c2 = document.createElement('canvas');
    const any = c2.getContext('webgl') || c2.getContext('experimental-webgl');
    if (any) {
      result.webgl = true;
      result.software = true;
      result.reason = 'software WebGL only';
      release(any);
    } else {
      result.reason = 'WebGL unavailable';
    }
  } catch (err) {
    result.reason = 'WebGL check failed: ' + (err && err.message);
  }
  return result;
}
