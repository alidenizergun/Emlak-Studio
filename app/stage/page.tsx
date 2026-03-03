import type { Metadata } from 'next';
import { Suspense } from 'react';
import Stage from './Stage';

export const metadata: Metadata = {
  title: 'Dekorasyon',
  description: 'Boş odaları Emlak Stüdyosu ile mimariyi koruyarak dekore edin.',
  alternates: {
    canonical: '/stage',
  },
};

export default function StagePage() {
  return (
    <Suspense fallback={null}>
      <Stage />
    </Suspense>
  );
}
