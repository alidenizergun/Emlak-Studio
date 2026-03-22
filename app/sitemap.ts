import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site';
import { localizePath } from '@/lib/locale-routing';

const INDEXABLE_ROUTES = [
  '/',
  '/tools',
  '/enhance',
  '/stage',
  '/remove-object',
  '/sanal-tadilat',
  '/ai-tour-guide',
  '/pricing',
  '/examples',
  '/contact',
  '/help',
  '/about',
  '/privacy',
  '/terms',
  '/register',
  '/suggestions',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ['tr', 'en'].flatMap((lang) =>
    INDEXABLE_ROUTES.map((route, index) => ({
      url: `${SITE_URL}${localizePath(route, lang as 'tr' | 'en')}`,
      lastModified: now,
      changeFrequency: route === '/' ? 'daily' : 'weekly',
      priority: index === 0 ? 1 : 0.7,
      alternates: {
        languages: {
          tr: `${SITE_URL}${localizePath(route, 'tr')}`,
          en: `${SITE_URL}${localizePath(route, 'en')}`,
        },
      },
    }))
  );
}
