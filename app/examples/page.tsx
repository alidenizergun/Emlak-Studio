import type { Metadata } from 'next';
import { ExamplesContent } from './ExamplesContent';

export const metadata: Metadata = {
  title: 'Örnekler',
  description: 'Emlak Stüdyosu dönüşüm örneklerini inceleyin.',
  alternates: {
    canonical: '/examples',
  },
};

export default function ExamplesPage() {
  return <ExamplesContent />;
}
