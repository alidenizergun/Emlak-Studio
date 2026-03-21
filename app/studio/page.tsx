import type { Metadata } from 'next';
import { Suspense } from 'react';
import StudioClient from './StudioClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Stüdyo',
    description: 'Tüm araçlara tek ekrandan erişin.',
    path: '/studio',
    index: false,
  });
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Yükleniyor...</div>}>
      <StudioClient />
    </Suspense>
  );
}
