import type { Metadata } from 'next';
import { Suspense } from 'react';
import StudioClient from './StudioClient';

export const metadata: Metadata = {
  title: 'Stüdyo',
  description: 'Tüm araçlara tek ekrandan erişin.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/studio',
  },
};

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Yükleniyor...</div>}>
      <StudioClient />
    </Suspense>
  );
}
