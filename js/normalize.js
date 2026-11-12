/**
 * normalize.js: data safety net shared by main.js and carousel-boot.js.
 * A missing or mistyped field in data.js (e.g. no "stack" array) is repaired here,
 * so it can never crash the page or the 3D carousel.
 */
const str = (v, d = '') => (typeof v === 'string' ? v : d);

export function normalizeProject(p, i) {
  return {
    ...p,
    slug: str(p.slug) || `project-${i + 1}`,
    title: str(p.title, 'Untitled project'),
    eyebrow: str(p.eyebrow),
    category: str(p.category, 'Project'),
    tagline: str(p.tagline),
    description: str(p.description),
    summary: str(p.summary),
    stack: Array.isArray(p.stack) ? p.stack.filter(t => typeof t === 'string') : [],
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    links: p.links && typeof p.links === 'object' ? p.links : {},
    cover: typeof p.cover === 'string' && p.cover ? p.cover : null,
    clip: p.clip && typeof p.clip.mp4 === 'string' && p.clip.mp4 ? { ...p.clip } : undefined
  };
}

export function normalizeProjects(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter(p => p && typeof p === 'object')
    .map(normalizeProject);
}
