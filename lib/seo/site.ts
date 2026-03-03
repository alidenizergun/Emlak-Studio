export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://emlak-yz.com').replace(/\/$/, '');
export const SITE_NAME = 'Emlak Stüdyosu';
export const SITE_DESCRIPTION = 'Emlak Stüdyosu ile fotoğraf geliştirme, dekorasyon, akıllı eşya silme, tadilat ve ilan metni araçlarını tek platformda kullanın.';
export const SITE_LOCALE = 'tr_TR';
export const DEFAULT_OG_IMAGE = '/logo-4k.png';

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
