import type { Metadata } from 'next';
import { Suspense } from 'react';
import Stage from './Stage';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Dekorasyon',
    description: 'Boş odaları Studio Estate ile mimariyi koruyarak dekore edin.',
    path: '/stage',
  });
}

export default function StagePage() {
  return (
    <Suspense fallback={null}>
      <Stage />
    </Suspense>
  );
}
