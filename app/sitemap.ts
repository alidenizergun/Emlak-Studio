import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';

const INDEXABLE_ROUTES = [
  '/',
  '/tools',
  '/enhance',
  '/stage',
  '/remove-object',
  '/sanal-tadilat',
  '/ilan-metni',
  '/ai-tour-guide',
  '/pricing',
  '/examples',
  '/contact',
  '/help',
  '/register',
  '/suggestions',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return INDEXABLE_ROUTES.map((route, index) => ({
    url: `${SITE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: index === 0 ? 1 : 0.7,
  }));
}
