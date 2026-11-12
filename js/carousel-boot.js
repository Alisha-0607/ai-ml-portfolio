/**
 * carousel-boot.js: independent entry point for the 3D carousel.
 *
 * It is loaded by its own <script type="module"> tag in index.html, separately from
 * main.js. A bug in main.js (panel, About, grid, navigation) can therefore never stop the
 * carousel from starting, and a carousel failure never stops the rest of the site.
 *
 * It talks to main.js only through two window hooks:
 *   window.__openProject(project, cardEl)  set by main.js, opens the detail panel
 *   window.__heroApi                       set here: { pause, resume, updateGridMetrics }
 * If the carousel cannot start, it sets <html data-carousel="fallback"> and fires
 * the "carousel-failed" event; main.js then shows the plain project grid.
 */
import { projects as rawProjects } from './data.js?v=5';
import { normalizeProjects } from './normalize.js?v=3';

async function startCarousel() {
  try {
    const projects = normalizeProjects(rawProjects);
    const { initHero } = await import('./hero.js?v=3');
    const open = (project, el) => {
      if (typeof window.__openProject === 'function') window.__openProject(project, el);
    };
    const api = initHero(projects, open);
    window.__heroApi = api;
    if (api && typeof api.updateGridMetrics === 'function') api.updateGridMetrics();
  } catch (err) {
    console.error('[carousel] failed to start, the plain project grid is shown instead:', err);
    document.documentElement.dataset.carousel = 'fallback';
    document.documentElement.dataset.carouselMsg = String(err && err.message).slice(0, 240);
    document.body.classList.add('no-webgl');
    window.dispatchEvent(new CustomEvent('carousel-failed'));
  }
}

startCarousel();
