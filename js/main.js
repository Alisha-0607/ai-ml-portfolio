/**
 * main.js — Bootstrap and orchestrator for Alisha Sawant's portfolio.
 * Manages:
 * 1. Navigation, smooth scroll, active section highlight, and accessible SR list.
 * 2. Unified Grid View cards (16:10 cover/typographic, title, summary, chips, hover states).
 * 3. 3x2 Grid Pagination (Page 1: 01–06, Page 2: 07–09).
 * 4. FLIP / Shared-Element flying card expansion into detail panel (~600ms, cubic-bezier(.22,1,.36,1)).
 * 5. Outward 3D tilt/scale/fade flight of non-clicked cards.
 * 6. Reverse collapse on close (X, Esc, backdrop click, mobile swipe-down, browser back).
 * 7. Prev/Next project slide/crossfade navigation with "03 / 09" counter and Left/Right keys.
 * 8. Media area engines: Before/After compare slider with tabs, Gallery with swipe & thumbs, Metrics panel.
 * 9. URL hash deep linking (#project=slug), body scroll locking, and carousel loop pausing/resuming.
 */

import { profile, projects as rawProjects } from './data.js?v=5';
import { normalizeProjects } from './normalize.js?v=3';

const projects = normalizeProjects(rawProjects);

const $ = id => document.getElementById(id);
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   1. NAVIGATION & ACCESSIBLE SR LIST
   ========================================================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [
    { id: 'work',       link: document.querySelector('.nav-link[href="#work"]') },
    { id: 'about',      link: document.querySelector('.nav-link[href="#about"]') },
    { id: 'experience', link: document.querySelector('.nav-link[href="#experience"]') },
    { id: 'skills',     link: document.querySelector('.nav-link[href="#skills"]') },
    { id: 'contact',    link: document.querySelector('.nav-link[href="#contact"]') }
  ];

  function scrollToTrackP(targetP) {
    const track = document.getElementById('track');
    if (!track) return;
    let top = 0;
    let el = track;
    while (el) {
      top += el.offsetTop;
      el = el.offsetParent;
    }
    const scrollable = track.offsetHeight - window.innerHeight;
    const targetY = top + (scrollable > 0 ? scrollable * targetP : 0);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#' || targetId.startsWith('#project=')) return;

      if (targetId === '#hero' || targetId === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (targetId === '#work') {
        e.preventDefault();
        scrollToTrackP(0.92);
        return;
      }

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  function updateActiveNav() {
    const scrollPos = window.scrollY + 140;
    let currentActive = null;

    const track = document.getElementById('track');
    let trackTop = 0;
    let trackHeight = 0;
    if (track) {
      let el = track;
      while (el) {
        trackTop += el.offsetTop;
        el = el.offsetParent;
      }
      trackHeight = track.offsetHeight;
    }
    const scrollable = trackHeight - window.innerHeight;
    const currentP = scrollable > 0 ? (window.scrollY - trackTop) / scrollable : 0;

    for (const sec of sections) {
      if (sec.id === 'work') {
        if (currentP >= 0.75 && scrollPos < trackTop + trackHeight) {
          currentActive = sec.link;
        }
      } else {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentActive = sec.link;
          }
        }
      }
    }

    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
      currentActive = sections[sections.length - 1].link;
    }

    navLinks.forEach(link => {
      if (link === currentActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'true');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

function renderScreenReaderList() {
  const srList = $('sr-projects-list');
  if (!srList) return;
  projects.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${p.title}</strong> (${p.category}) - ${p.summary} Stack: ${p.stack.join(', ')}` +
      (p.links && p.links.repo ? ` <a href="${p.links.repo}">Repository</a>` : '') +
      (p.links && p.links.demo ? ` <a href="${p.links.demo}">Live demo</a>` : '');
    srList.appendChild(li);
  });
}

/* ==========================================================================
   1b. ABOUT / EXPERIENCE / SKILLS RENDERED FROM data.js (single source of truth)
   ========================================================================== */
const esc = v => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderProfileSections() {
  const a = profile.about;
  if (a) {
    const lead = document.querySelector('.about-lead');
    if (lead && a.lead) lead.textContent = a.lead;

    const paras = document.querySelector('.about-paragraphs');
    if (paras && Array.isArray(a.bio) && a.bio.length) {
      paras.innerHTML = a.bio.map(t => `<p>${esc(t)}</p>`).join('');
    }

    const beyond = document.querySelector('.beyond-code-box p');
    if (beyond && a.beyondCode) beyond.textContent = a.beyondCode;

    const stats = document.querySelector('.stats-grid');
    if (stats && Array.isArray(a.stats) && a.stats.length) {
      stats.innerHTML = a.stats.map(s => `
        <div class="stat-card">
          <span class="stat-value">${esc(s.value)}</span>
          <span class="stat-label">${esc(s.label)}</span>
        </div>`).join('');
    }
  }

  const timeline = document.querySelector('.experience-timeline');
  if (timeline && Array.isArray(profile.experience) && profile.experience.length) {
    timeline.innerHTML = profile.experience.map(x => `
      <article class="experience-card">
        <div class="exp-header">
          <div>
            <h3 class="exp-role-title">${esc(x.role)}</h3>
            <div class="exp-org">${esc(x.organization)}</div>
          </div>
          <span class="exp-period">${esc(x.period)}</span>
        </div>
        ${(x.project || x.degree) ? `<div class="exp-project-name">${esc(x.project || x.degree)}</div>` : ''}
        <p class="exp-description">${esc(x.description)}</p>
      </article>`).join('');
  }

  const skillsGrid = document.querySelector('.skills-grid');
  if (skillsGrid && Array.isArray(profile.skills) && profile.skills.length) {
    skillsGrid.innerHTML = profile.skills.map(g => `
      <div class="skills-group">
        <h3 class="skills-group-title">${esc(g.category)}</h3>
        <div class="skills-chips">${(g.items || []).map(i => `<span class="skill-chip">${esc(i)}</span>`).join('')}</div>
      </div>`).join('');
  }
}

/* ==========================================================================
   2. UNIFIED GRID CARD GENERATOR
   ========================================================================== */
function createCardElement(project, index, onCardClick) {
  const card = document.createElement('article');
  card.className = 'grid-project-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('data-slug', project.slug);
  card.setAttribute('aria-label', `View ${project.title} project details`);

  const padIdx = String(index + 1).padStart(2, '0');
  let coverHtml = '';
  if (project.cover) {
    coverHtml = `<img class="card-cover-img" src="${project.cover}" alt="${project.title} cover preview" loading="lazy" width="640" height="400">`;
  } else {
    coverHtml = `
      <div class="card-typo-cover" aria-hidden="true">
        <span class="typo-cover-number">${padIdx}</span>
        <span class="typo-cover-cat">[ ${project.category.toUpperCase()} ]</span>
        <div class="typo-cover-pattern"></div>
      </div>
    `;
  }

  const chipsHtml = project.stack.slice(0, 3).map(tech => `<span class="card-chip">${tech}</span>`).join('');

  card.innerHTML = `
    <div class="card-cover-wrap">
      ${coverHtml}
      <span class="card-hover-hint">View project &nearr;</span>
    </div>
    <div class="card-body">
      <div class="card-category">[ ${project.category.toUpperCase()} ]</div>
      <h3 class="card-title">${project.title}</h3>
      <p class="card-summary">${project.summary}</p>
      <div class="card-stack">${chipsHtml}</div>
    </div>
  `;

  const coverWrap = card.querySelector('.card-cover-wrap');
  if (project.clip && project.clip.mp4 && coverWrap) {
    let hoverVideo = null;

    const startHoverVideo = () => {
      const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!isDesktop || prefersReduced()) return;
      if (navigator.connection && navigator.connection.saveData) return;

      if (!hoverVideo) {
        hoverVideo = document.createElement('video');
        hoverVideo.className = 'card-cover-video';
        hoverVideo.muted = true;
        hoverVideo.defaultMuted = true;
        hoverVideo.loop = true;
        hoverVideo.playsInline = true;
        hoverVideo.setAttribute('muted', '');
        hoverVideo.setAttribute('playsinline', '');
        hoverVideo.src = project.clip.mp4;
        hoverVideo.preload = 'metadata';
        hoverVideo.addEventListener('error', () => {
          stopHoverVideo();
          console.warn(`Grid card video failed to load: ${project.clip.mp4}`);
        });
        coverWrap.appendChild(hoverVideo);
      }
      hoverVideo.play().catch(() => {});
    };

    const stopHoverVideo = () => {
      if (hoverVideo) {
        hoverVideo.pause();
        hoverVideo.remove();
        hoverVideo = null;
      }
    };

    card.addEventListener('pointerenter', startHoverVideo);
    card.addEventListener('pointerleave', stopHoverVideo);
    card.addEventListener('focus', startHoverVideo);
    card.addEventListener('blur', stopHoverVideo);
  }

  card.addEventListener('click', () => onCardClick(project, card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick(project, card);
    }
  });

  return card;
}

/* ==========================================================================
   3. 3x2 GRID VIEW & PAGINATION (9 PROJECTS TOTAL)
   ========================================================================== */
const PAGE_SIZE = 6;
let currentGridPage = 0;
const totalPages = Math.ceil(projects.length / PAGE_SIZE);

function renderGridView(page = 0) {
  currentGridPage = page;
  const gridContainer = $('work-grid-cards');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';
  const startIdx = page * PAGE_SIZE;
  const pageProjects = projects.slice(startIdx, startIdx + PAGE_SIZE);

  pageProjects.forEach((p, idx) => {
    const cardEl = createCardElement(p, startIdx + idx, openProjectPanel);
    gridContainer.appendChild(cardEl);
  });

  if (window.__heroApi && typeof window.__heroApi.updateGridMetrics === 'function') {
    window.__heroApi.updateGridMetrics();
  }

  // Update pagination indicators
  const prevBtn = $('grid-prev-page');
  const nextBtn = $('grid-next-page');
  if (prevBtn) prevBtn.disabled = page === 0;
  if (nextBtn) nextBtn.disabled = page >= totalPages - 1;

  const pagePills = document.querySelectorAll('.grid-page-pill');
  pagePills.forEach(pill => {
    const pillPage = parseInt(pill.getAttribute('data-page'), 10);
    if (pillPage === page) {
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
    } else {
      pill.classList.remove('active');
      pill.setAttribute('aria-selected', 'false');
    }
  });
}

function initGridPagination() {
  const prevBtn = $('grid-prev-page');
  const nextBtn = $('grid-next-page');
  const pagePills = document.querySelectorAll('.grid-page-pill');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentGridPage > 0) renderGridView(currentGridPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentGridPage < totalPages - 1) renderGridView(currentGridPage + 1);
    });
  }

  pagePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetPage = parseInt(pill.getAttribute('data-page'), 10);
      if (!isNaN(targetPage) && targetPage !== currentGridPage) {
        renderGridView(targetPage);
      }
    });
  });

  renderGridView(0);
}

/* ==========================================================================
   4. DETAIL PANEL MEDIA RENDERERS
   ========================================================================== */
let activeCompareCleanup = null;
let activeGalleryCleanup = null;
let activeDetailVideo = null;

function cleanupMedia() {
  if (activeDetailVideo) {
    activeDetailVideo.pause();
    activeDetailVideo = null;
  }
  if (activeCompareCleanup) { activeCompareCleanup(); activeCompareCleanup = null; }
  if (activeGalleryCleanup) { activeGalleryCleanup(); activeGalleryCleanup = null; }
}

// Output clip: muted looping video (poster = cover). Falls back to stills if it fails to load.
function renderClip(project, target) {
  const videoWrap = document.createElement('div');
  videoWrap.className = 'detail-clip-wrap';
  const video = document.createElement('video');
  video.className = 'detail-clip-video';
  video.controls = true;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  if (project.cover) video.poster = project.cover;
  video.src = project.clip.mp4;
  video.addEventListener('error', () => {
    console.warn(`Detail video failed to load: ${project.clip.mp4}`);
    videoWrap.remove();
    activeDetailVideo = null;
    renderMediaFallback(project, target, project.media);
  });
  videoWrap.appendChild(video);
  target.appendChild(videoWrap);
  activeDetailVideo = video;
}

function renderMediaArea(project, container) {
  cleanupMedia();
  container.innerHTML = '';
  container.classList.remove('has-modes');

  const media = project.media;
  const hasClip = !!(project.clip && project.clip.mp4);
  const hasCompare = !!(media && media.type === 'compare' && (media.tabs || []).length > 0);
  const hasGallery = !!(media && media.type === 'gallery' && (media.items || []).length > 1);

  // Clip plus extra stills (e.g. House Muse before/after): small switcher above the media box
  if (hasClip && (hasCompare || hasGallery)) {
    container.classList.add('has-modes');
    const bar = document.createElement('div');
    bar.className = 'detail-mode-bar';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', 'Project media');
    bar.innerHTML = `
      <button class="detail-mode-btn active" role="tab" aria-selected="true" data-mode="video">Demo video</button>
      <button class="detail-mode-btn" role="tab" aria-selected="false" data-mode="stills">${hasCompare ? 'Before / after' : 'Screens'}</button>
    `;
    const stage = document.createElement('div');
    stage.className = 'detail-mode-stage';
    container.appendChild(bar);
    container.appendChild(stage);

    const show = mode => {
      cleanupMedia();
      stage.innerHTML = '';
      bar.querySelectorAll('.detail-mode-btn').forEach(btn => {
        const on = btn.getAttribute('data-mode') === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', String(on));
      });
      if (mode === 'video') renderClip(project, stage);
      else renderMediaFallback(project, stage, media);
    };
    bar.querySelectorAll('.detail-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => show(btn.getAttribute('data-mode')));
    });
    show('video');
    return;
  }

  if (hasClip) {
    renderClip(project, container);
    return;
  }

  renderMediaFallback(project, container, media);
}

function renderMediaFallback(project, container, media) {
  // Panel type projects: show cover image (or typographic placeholder)
  if (media && media.type === 'panel') {
    if (project.cover) {
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-media-container';
      wrapper.innerHTML = `
        <div class="gallery-main-view">
          <img class="gallery-active-img" src="${project.cover}" alt="${project.title} cover" width="1280" height="800">
        </div>
      `;
      container.appendChild(wrapper);
    } else {
      // Typographic placeholder for panel projects with no cover
      const wrapper = document.createElement('div');
      wrapper.className = 'detail-panel-cover-placeholder';
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.innerHTML = `
        <span class="typo-cover-number">${project.title.slice(0, 2).toUpperCase()}</span>
        <span class="typo-cover-cat">[ ${project.category.toUpperCase()} ]</span>
        <div class="typo-cover-pattern"></div>
      `;
      container.appendChild(wrapper);
    }
    return;
  }

  // 2. Compare Slider
  if (media && media.type === 'compare') {
    const tabs = media.tabs || [];
    if (tabs.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.className = 'compare-media-container';

      let tabsHtml = '';
      if (tabs.length > 1) {
        tabsHtml = `
          <div class="compare-tabs-bar" role="tablist" aria-label="Comparison room sets">
            ${tabs.map((tab, i) => `
              <button class="compare-tab ${i === 0 ? 'active' : ''}" data-tab-idx="${i}" role="tab" aria-selected="${i === 0}">
                ${tab.label}
              </button>
            `).join('')}
          </div>
        `;
      }

      const initialSet = tabs[0] || { before: '', after: '', alt: project.title };

      wrapper.innerHTML = `
        ${tabsHtml}
        <div class="compare-viewport" id="compare-viewport">
          <img class="compare-img compare-after" id="cmp-after" src="${initialSet.after}" alt="${initialSet.alt} (after)" width="1280" height="560">
          <div class="compare-clip-wrap" id="cmp-clip" style="clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);">
            <img class="compare-img compare-before" id="cmp-before" src="${initialSet.before}" alt="${initialSet.alt} (before)" width="1280" height="560">
          </div>
          <div class="compare-handle-line" id="cmp-line" style="left: 50%;">
            <div class="compare-handle" id="cmp-handle" role="slider" tabindex="0" aria-label="Before and after comparison slider" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l-5 5 5 5V7zm8 0v10l5-5-5-5z"/></svg>
            </div>
          </div>
          <span class="compare-pill compare-pill-before">BEFORE</span>
          <span class="compare-pill compare-pill-after">AFTER</span>
          <div class="compare-hint-pill">&#x25C2; DRAG TO COMPARE &#x25B8;</div>
        </div>
      `;

      container.appendChild(wrapper);

      const viewport = wrapper.querySelector('#compare-viewport');
      const clipWrap = wrapper.querySelector('#cmp-clip');
      const line     = wrapper.querySelector('#cmp-line');
      const handle   = wrapper.querySelector('#cmp-handle');
      const imgAfter = wrapper.querySelector('#cmp-after');
      const imgBefore= wrapper.querySelector('#cmp-before');

      let currentPos = 50;
      function setSliderPos(pct) {
        currentPos = Math.max(0, Math.min(100, pct));
        clipWrap.style.clipPath = `polygon(0 0, ${currentPos}% 0, ${currentPos}% 100%, 0 100%)`;
        line.style.left = `${currentPos}%`;
        handle.setAttribute('aria-valuenow', Math.round(currentPos));
      }

      let isDragging = false;
      function onPointerMove(e) {
        if (!isDragging) return;
        const rect = viewport.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPos(pct);
      }
      function onPointerUp() {
        isDragging = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }

      viewport.addEventListener('pointerdown', e => {
        isDragging = true;
        const rect = viewport.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPos(pct);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      });

      handle.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSliderPos(currentPos - 5);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSliderPos(currentPos + 5);
        } else if (e.key === 'Home') {
          e.preventDefault();
          setSliderPos(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          setSliderPos(100);
        }
      });

      // Tab buttons
      const tabBtns = wrapper.querySelectorAll('.compare-tab');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          const idx = parseInt(btn.getAttribute('data-tab-idx'), 10);
          const set = tabs[idx];
          if (set) {
            imgAfter.src = set.after;
            imgBefore.src = set.before;
            imgAfter.alt = `${set.alt} (after)`;
            imgBefore.alt = `${set.alt} (before)`;
            setSliderPos(50);
          }
        });
      });

      activeCompareCleanup = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
      return;
    }
  }

  // 3. Gallery
  if (media && media.type === 'gallery') {
    const items = media.items || [];
    if (items.length > 1) {
      let activeIdx = 0;
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-media-container';

      wrapper.innerHTML = `
        <div class="gallery-main-view" id="gallery-main">
          <img class="gallery-active-img" id="gallery-img" src="${items[0].src}" alt="${items[0].alt}" width="1280" height="560">
          <span class="gallery-counter" id="gallery-counter">1 / ${items.length}</span>
        </div>
        <div class="gallery-thumbs-strip" role="tablist" aria-label="Project images thumbnails">
          ${items.map((item, i) => `
            <button class="gallery-thumb-btn ${i === 0 ? 'active' : ''}" data-idx="${i}" role="tab" aria-selected="${i === 0}" aria-label="Image ${i + 1} of ${items.length}">
              <img src="${item.src}" alt="${item.alt}" loading="lazy" width="110" height="62">
            </button>
          `).join('')}
        </div>
      `;

      container.appendChild(wrapper);

      const mainImg = wrapper.querySelector('#gallery-img');
      const counter = wrapper.querySelector('#gallery-counter');
      const thumbBtns = wrapper.querySelectorAll('.gallery-thumb-btn');

      function setActiveImage(idx) {
        activeIdx = (idx + items.length) % items.length;
        mainImg.src = items[activeIdx].src;
        mainImg.alt = items[activeIdx].alt;
        counter.textContent = `${activeIdx + 1} / ${items.length}`;

        thumbBtns.forEach((btn, i) => {
          if (i === activeIdx) {
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
          }
        });
      }

      thumbBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          setActiveImage(idx);
        });
      });

      // Touch swipe on gallery
      let touchX = 0;
      const mainView = wrapper.querySelector('#gallery-main');
      mainView.addEventListener('touchstart', e => {
        if (e.touches.length === 1) touchX = e.touches[0].clientX;
      }, { passive: true });

      mainView.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) setActiveImage(activeIdx + 1);
          else setActiveImage(activeIdx - 1);
        }
      }, { passive: true });
      return;
    } else if (items.length === 1) {
      // Single gallery image: show as a single large image (no empty boxes, no thumbnail strip for one image)
      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-media-container';
      wrapper.innerHTML = `
        <div class="gallery-main-view">
          <img class="gallery-active-img" src="${items[0].src}" alt="${items[0].alt}" width="1280" height="560">
        </div>
      `;
      container.appendChild(wrapper);
      return;
    }
  }

  // 4. Fallback: if it has no gallery or compare images left, show cover as single large image
  if (project.cover) {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-media-container';
    wrapper.innerHTML = `
      <div class="gallery-main-view">
        <img class="gallery-active-img" src="${project.cover}" alt="${project.title} cover" width="1280" height="560">
      </div>
    `;
    container.appendChild(wrapper);
  }
}

/* ==========================================================================
   5. DETAIL PANEL POPULATOR
   ========================================================================== */
function populateDetailPanel(project, index) {
  $('detail-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  $('detail-eyebrow').textContent = `[ ${project.eyebrow || project.category.toUpperCase()} ]`;
  $('detail-title').textContent   = project.title;
  $('detail-tagline').textContent = project.tagline || '';
  $('detail-description').textContent = project.description || project.summary;

  // Stack chips
  const stackWrap = $('detail-stack-chips');
  stackWrap.innerHTML = '';
  project.stack.forEach(tech => {
    const chip = document.createElement('span');
    chip.className = 'detail-chip';
    chip.textContent = tech;
    stackWrap.appendChild(chip);
  });

  // Action pills
  const actionsWrap = $('detail-actions');
  actionsWrap.innerHTML = '';
  if (project.links && project.links.repo) {
    const repoA = document.createElement('a');
    repoA.className = 'detail-action-pill';
    repoA.href = project.links.repo;
    repoA.target = '_blank';
    repoA.rel = 'noopener noreferrer';
    repoA.innerHTML = 'View code &nearr;';
    actionsWrap.appendChild(repoA);
  }
  if (project.links && project.links.demo) {
    const demoA = document.createElement('a');
    demoA.className = 'detail-action-pill detail-pill-accent';
    demoA.href = project.links.demo;
    demoA.target = '_blank';
    demoA.rel = 'noopener noreferrer';
    demoA.innerHTML = 'Live demo &nearr;';
    actionsWrap.appendChild(demoA);
  }
  if (project.links && project.links.caseStudy) {
    const csA = document.createElement('a');
    csA.className = 'detail-action-pill';
    csA.href = project.links.caseStudy;
    csA.target = '_blank';
    csA.rel = 'noopener noreferrer';
    csA.innerHTML = 'Case study &nearr;';
    actionsWrap.appendChild(csA);
  }

  // 2x2 Highlights Grid
  const hlGrid = $('detail-highlights-grid');
  hlGrid.innerHTML = '';
  const highlights = project.highlights || [];
  for (let i = 0; i < 4; i++) {
    const text = highlights[i] || 'Technical specification pending.';
    const card = document.createElement('div');
    card.className = 'detail-highlight-card';
    card.innerHTML = `
      <span class="highlight-num">// 0${i + 1}</span>
      <p class="highlight-text">${text}</p>
    `;
    hlGrid.appendChild(card);
  }

  // Render Top Media
  const mediaArea = $('detail-media-area');
  renderMediaArea(project, mediaArea);
}

/* ==========================================================================
   6. THE FLYING OPEN ANIMATION (FLIP SHARED-ELEMENT TRANSITION)
   ========================================================================== */
const detailModal    = $('project-detail-modal');
const detailBackdrop = $('project-detail-backdrop');
const detailPanel    = $('detail-panel');
const detailCloseBtn = $('detail-close-btn');
const detailPrevBtn  = $('detail-prev-btn');
const detailNextBtn  = $('detail-next-btn');
const detailScroll   = $('detail-panel-scroll');

let isModalOpen = false;
let activeProject = null;
let activeCardElement = null;
let initialCardRect = null;
let otherCardAnims = [];
let lockedScrollY = 0;

function openProjectPanelInner(project, originatingCard) {
  if (!project || isModalOpen) return;
  isModalOpen = true;
  activeProject = project;

  // Locate originating card element if not explicitly passed
  let cardEl = originatingCard;
  if (!cardEl) {
    cardEl = document.querySelector(`.grid-project-card[data-slug="${project.slug}"]`);
  }
  activeCardElement = cardEl;

  const projectIndex = projects.findIndex(p => p.slug === project.slug);
  try {
    populateDetailPanel(project, projectIndex);
  } catch (err) {
    console.error('[panel] could not fill the project panel:', err);
  }

  // Lock body scroll
  lockedScrollY = window.scrollY;
  document.body.style.overflow = 'hidden';

  // Pause Three.js / video hero loop
  if (window.__heroApi && typeof window.__heroApi.pause === 'function') {
    window.__heroApi.pause();
  }

  // Deep linking URL hash
  if (window.location.hash !== `#project=${project.slug}`) {
    history.pushState(null, '', `#project=${project.slug}`);
  }

  // Reduced motion path
  if (prefersReduced()) {
    detailModal.classList.add('open');
    detailBackdrop.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');
    detailBackdrop.setAttribute('aria-hidden', 'false');
    detailPanel.style.transform = 'none';
    detailPanel.style.opacity = '1';
    detailCloseBtn.focus();
    return;
  }

  // If no card rect (e.g. opened from deep link or archive), fallback to center scale-up
  if (!cardEl) {
    detailModal.classList.add('open');
    detailBackdrop.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');
    detailBackdrop.setAttribute('aria-hidden', 'false');
    detailPanel.animate([
      { transform: 'scale(0.85)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: 400,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'forwards'
    });
    detailCloseBtn.focus();
    return;
  }

  // FLIP Measure
  initialCardRect = cardEl.getBoundingClientRect();
  const cardCenter = {
    x: initialCardRect.left + initialCardRect.width / 2,
    y: initialCardRect.top + initialCardRect.height / 2
  };

  // Fly away all other cards in the current grid view
  otherCardAnims = [];
  const currentGridCards = Array.from(document.querySelectorAll('.grid-project-card')).filter(c => c !== cardEl);
  currentGridCards.forEach(other => {
    const oRect = other.getBoundingClientRect();
    const oc = {
      x: oRect.left + oRect.width / 2,
      y: oRect.top + oRect.height / 2
    };
    let dx = oc.x - cardCenter.x;
    let dy = oc.y - cardCenter.y;
    const dist = Math.hypot(dx, dy) || 1;
    const pushDist = 75;
    const px = (dx / dist) * pushDist;
    const py = (dy / dist) * pushDist;
    const rotY = (dx >= 0 ? -1 : 1) * Math.min(15, Math.max(8, Math.abs(dx / 35)));
    const rotX = (dy >= 0 ? 1 : -1) * Math.min(15, Math.max(8, Math.abs(dy / 35)));
    const delay = Math.min(140, Math.round((dist / 320) * 45));

    const anim = other.animate([
      { transform: 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1)', opacity: 1 },
      { transform: `translate3d(${px}px, ${py}px, -40px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(0.85)`, opacity: 0 }
    ], {
      duration: 500,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      delay: delay,
      fill: 'forwards'
    });

    otherCardAnims.push({ card: other, anim, px, py, rotX, rotY, delay });
  });

  // Temporarily hide originating card to avoid double visual
  cardEl.style.opacity = '0';

  // Open modal
  detailModal.classList.add('open');
  detailBackdrop.classList.add('open');
  detailModal.setAttribute('aria-hidden', 'false');
  detailBackdrop.setAttribute('aria-hidden', 'false');

  // Measure target panel position
  const targetRect = detailPanel.getBoundingClientRect();
  const scaleX = initialCardRect.width / targetRect.width;
  const scaleY = initialCardRect.height / targetRect.height;
  const tx = (initialCardRect.left + initialCardRect.width / 2) - (targetRect.left + targetRect.width / 2);
  const ty = (initialCardRect.top + initialCardRect.height / 2) - (targetRect.top + targetRect.height / 2);

  if (![scaleX, scaleY, tx, ty].every(Number.isFinite)) {
    showPanelNow();
    detailCloseBtn.focus();
    return;
  }

  detailPanel.style.willChange = 'transform, opacity';
  const panelFlight = detailPanel.animate([
    {
      transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scaleX}, ${scaleY})`,
      opacity: 0.95
    },
    {
      transform: 'translate3d(0, 0, 0) scale(1, 1)',
      opacity: 1
    }
  ], {
    duration: 600,
    easing: 'cubic-bezier(.22, 1, .36, 1)',
    fill: 'forwards'
  });

  panelFlight.onfinish = () => {
    detailPanel.style.willChange = 'auto';
    detailCloseBtn.focus();
  };
}


// Opening is wrapped so the panel ALWAYS ends up visible, even if the fly-open animation fails.
function showPanelNow() {
  isModalOpen = true;
  try { detailPanel.getAnimations().forEach(a => a.cancel()); } catch (_) {}
  detailModal.classList.add('open');
  detailBackdrop.classList.add('open');
  detailModal.setAttribute('aria-hidden', 'false');
  detailBackdrop.setAttribute('aria-hidden', 'false');
  detailPanel.style.transform = 'none';
  detailPanel.style.opacity = '1';
}

function ensurePanelVisible() {
  const r = detailPanel.getBoundingClientRect();
  const cs = getComputedStyle(detailPanel);
  const settled = cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)';
  if (!detailModal.classList.contains('open') || Number(cs.opacity) < 0.99 || !settled || r.width < 200 || r.height < 200) {
    console.warn('[panel] forcing the project panel to be visible');
    showPanelNow();
  }
}

export function openProjectPanel(project, originatingCard) {
  if (!project || isModalOpen) return;
  try {
    openProjectPanelInner(project, originatingCard);
  } catch (err) {
    console.error('[panel] opening animation failed, showing the panel directly:', err);
    showPanelNow();
  }
  window.setTimeout(() => { if (isModalOpen) ensurePanelVisible(); }, 900);
}

export function closeProjectPanel() {
  if (!isModalOpen) return;
  isModalOpen = false;

  if (activeDetailVideo) {
    activeDetailVideo.pause();
    activeDetailVideo = null;
  }

  // Clean URL hash
  if (window.location.hash.startsWith('#project=')) {
    history.pushState(null, '', window.location.pathname + window.location.search + '#work');
  }

  function cleanupState() {
    detailModal.classList.remove('open');
    detailBackdrop.classList.remove('open');
    detailModal.setAttribute('aria-hidden', 'true');
    detailBackdrop.setAttribute('aria-hidden', 'true');

    if (activeCardElement) {
      activeCardElement.style.opacity = '';
      activeCardElement.focus();
    }

    otherCardAnims.forEach(item => {
      try { item.anim.cancel(); } catch (e) {}
      item.card.style.transform = '';
      item.card.style.opacity = '';
    });
    otherCardAnims = [];

    // Restore scroll
    document.body.style.overflow = '';
    window.scrollTo(0, lockedScrollY);

    // Resume Three.js hero loop
    if (window.__heroApi && typeof window.__heroApi.resume === 'function') {
      window.__heroApi.resume();
    }
  }

  if (prefersReduced() || !activeCardElement || !initialCardRect) {
    cleanupState();
    return;
  }

  // Reverse FLIP animation back into originating card
  const curTargetRect = detailPanel.getBoundingClientRect();
  const returnRect = activeCardElement.getBoundingClientRect();
  const sX = returnRect.width / curTargetRect.width;
  const sY = returnRect.height / curTargetRect.height;
  const cTx = (returnRect.left + returnRect.width / 2) - (curTargetRect.left + curTargetRect.width / 2);
  const cTy = (returnRect.top + returnRect.height / 2) - (curTargetRect.top + curTargetRect.height / 2);

  detailPanel.style.willChange = 'transform, opacity';
  const shrinkAnim = detailPanel.animate([
    { transform: 'translate3d(0, 0, 0) scale(1, 1)', opacity: 1 },
    { transform: `translate3d(${cTx}px, ${cTy}px, 0) scale(${sX}, ${sY})`, opacity: 0 }
  ], {
    duration: 480,
    easing: 'cubic-bezier(.22, 1, .36, 1)',
    fill: 'forwards'
  });

  // Animate other cards flying back to their grid slots
  otherCardAnims.forEach(item => {
    item.card.animate([
      { transform: `translate3d(${item.px}px, ${item.py}px, -40px) rotateX(${item.rotX}deg) rotateY(${item.rotY}deg) scale(0.85)`, opacity: 0 },
      { transform: 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1)', opacity: 1 }
    ], {
      duration: 440,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      delay: item.delay,
      fill: 'forwards'
    });
  });

  shrinkAnim.onfinish = () => {
    detailPanel.style.willChange = 'auto';
    cleanupState();
  };
}

/* ==========================================================================
   7. PREV / NEXT NEIGHBORING PROJECT SLIDE NAVIGATION
   ========================================================================== */
function navigateNeighbor(direction) {
  if (!isModalOpen || !activeProject) return;
  const curIdx = projects.findIndex(p => p.slug === activeProject.slug);
  const total = projects.length;
  const nextIdx = direction === 'next' ? (curIdx + 1) % total : (curIdx - 1 + total) % total;
  const nextProject = projects[nextIdx];

  if (prefersReduced()) {
    activeProject = nextProject;
    populateDetailPanel(nextProject, nextIdx);
    history.replaceState(null, '', `#project=${nextProject.slug}`);
    detailScroll.scrollTop = 0;
    activeCardElement = document.querySelector(`.grid-project-card[data-slug="${nextProject.slug}"]`);
    return;
  }

  // Smooth horizontal slide/crossfade
  const outTx = direction === 'next' ? -35 : 35;
  const inTx  = direction === 'next' ? 35 : -35;

  const slideOut = detailScroll.animate([
    { transform: 'translateX(0)', opacity: 1 },
    { transform: `translateX(${outTx}px)`, opacity: 0 }
  ], {
    duration: 180,
    easing: 'ease-in',
    fill: 'forwards'
  });

  slideOut.onfinish = () => {
    activeProject = nextProject;
    populateDetailPanel(nextProject, nextIdx);
    history.replaceState(null, '', `#project=${nextProject.slug}`);
    detailScroll.scrollTop = 0;
    activeCardElement = document.querySelector(`.grid-project-card[data-slug="${nextProject.slug}"]`);

    detailScroll.animate([
      { transform: `translateX(${inTx}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ], {
      duration: 220,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'forwards'
    });
  };
}

/* ==========================================================================
   8. DETAIL MODAL LISTENERS (CLOSE, KEYBOARD, SWIPE)
   ========================================================================== */
if (detailCloseBtn) detailCloseBtn.addEventListener('click', closeProjectPanel);
if (detailBackdrop) detailBackdrop.addEventListener('click', closeProjectPanel);
if (detailPrevBtn)  detailPrevBtn.addEventListener('click', () => navigateNeighbor('prev'));
if (detailNextBtn)  detailNextBtn.addEventListener('click', () => navigateNeighbor('next'));

window.addEventListener('keydown', e => {
  if (!isModalOpen) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeProjectPanel();
  } else if (e.key === 'ArrowLeft') {
    // If slider is focused, let slider handle it
    const activeEl = document.activeElement;
    if (activeEl && activeEl.getAttribute('role') === 'slider') return;
    e.preventDefault();
    navigateNeighbor('prev');
  } else if (e.key === 'ArrowRight') {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.getAttribute('role') === 'slider') return;
    e.preventDefault();
    navigateNeighbor('next');
  } else if (e.key === 'Tab') {
    // Accessible Focus Trap
    const focusable = detailPanel.querySelectorAll('button, a[href], [tabindex="0"], input, select, textarea');
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Mobile swipe-down to close
let touchStartY = 0;
let touchStartX = 0;
let isSwipeCandidate = false;

if (detailPanel && detailScroll) {
detailPanel.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isSwipeCandidate = detailScroll.scrollTop <= 0;
  }
}, { passive: true });

detailPanel.addEventListener('touchmove', e => {
  if (!isSwipeCandidate || e.touches.length !== 1) return;
  const dy = e.touches[0].clientY - touchStartY;
  const dx = e.touches[0].clientX - touchStartX;
  if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
    detailPanel.style.transform = `translate3d(0, ${dy * 0.6}px, 0)`;
  }
}, { passive: true });

detailPanel.addEventListener('touchend', e => {
  if (!isSwipeCandidate) return;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (dy > 85) {
    closeProjectPanel();
  } else {
    detailPanel.style.transition = 'transform 0.2s cubic-bezier(.16, 1, .3, 1)';
    detailPanel.style.transform = 'translate3d(0, 0, 0)';
    setTimeout(() => { detailPanel.style.transition = ''; }, 200);
  }
  isSwipeCandidate = false;
}, { passive: true });
}

// Browser Back Button & Deep Linking (#project=slug)
window.addEventListener('popstate', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#project=')) {
    const slug = hash.replace('#project=', '').trim();
    const p = projects.find(item => item.slug === slug);
    if (p && (!activeProject || activeProject.slug !== slug)) {
      openProjectPanel(p);
    }
  } else if (isModalOpen) {
    closeProjectPanel();
  }
});

function checkInitialDeepLink() {
  const hash = window.location.hash;
  if (hash.startsWith('#project=')) {
    const slug = hash.replace('#project=', '').trim();
    const p = projects.find(item => item.slug === slug);
    if (p) {
      setTimeout(() => openProjectPanel(p), 150);
    }
  }
}

/* ==========================================================================
   9. SYSTEM BOOTSTRAP
   Every step is isolated with safe(). The 3D carousel is started by carousel-boot.js,
   a separate entry file, so nothing in this file can stop it.
   ========================================================================== */
function safe(label, fn) {
  try {
    return fn();
  } catch (err) {
    console.error(`[init:${label}] failed (other sections keep working):`, err);
  }
}


function initPortraitSlideshow() {
  const slides = document.querySelectorAll('.id-card-photo .portrait-slide');
  if (slides.length < 2 || prefersReduced()) return;
  let i = 0;
  window.setInterval(() => {
    if (document.hidden) return;
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 4500);
}

// Hooks used by carousel-boot.js (the 3D carousel starts independently of this file)
window.__openProject = openProjectPanel;

function buildFallbackGrid() {
  const fb = $('fallback-grid');
  if (!fb) return;
  fb.innerHTML = '';
  projects.forEach((p, i) => fb.appendChild(createCardElement(p, i, openProjectPanel)));
}
window.addEventListener('carousel-failed', () => safe('fallback-grid', buildFallbackGrid));

safe('sr-list', renderScreenReaderList);
safe('profile', renderProfileSections);
safe('portrait', initPortraitSlideshow);
safe('navigation', initNavigation);
safe('grid-pagination', initGridPagination);
if (document.documentElement.dataset.carousel === 'fallback') safe('fallback-grid', buildFallbackGrid);
safe('deep-link', checkInitialDeepLink);
