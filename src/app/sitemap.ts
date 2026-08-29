import type { MetadataRoute } from 'next';

import { PROJECTS } from '../data/projects';
import { SITE_URL } from '../lib/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/projects', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/method', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/machine', priority: 0.6, changeFrequency: 'weekly' },
    ...PROJECTS.map((project) => ({
      path: `/projects/${project.slug}`,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    })),
  ];

  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: new Date('2026-08-15'),
    changeFrequency,
    priority,
  }));
}
