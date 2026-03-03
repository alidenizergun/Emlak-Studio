import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Emlak Stüdyosu',
    short_name: 'Emlak Stüdyosu',
    description: 'Emlak Stüdyosu ile fotoğraf geliştirme, dekorasyon ve ilan üretimi araçlarını kullanın.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
