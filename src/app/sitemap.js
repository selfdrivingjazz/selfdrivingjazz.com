import { PROJECTS } from '../data/projects.js';
import { SITE_URL } from '../lib/metadata.js';

export default function sitemap() {
  const pages = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/projects', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/machine', priority: 0.6, changeFrequency: 'weekly' },
    ...PROJECTS.map((project) => ({
      path: `/projects/${project.slug}`,
      priority: 0.8,
      changeFrequency: 'monthly',
    })),
  ];

  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: new Date('2026-08-15'),
    changeFrequency,
    priority,
  }));
}
