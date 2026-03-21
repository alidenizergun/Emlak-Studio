import type { Metadata } from 'next';
import { ExamplesContent } from './ExamplesContent';

export const metadata: Metadata = {
  title: 'Örnekler',
  description: 'Studio Estate dönüşüm örneklerini inceleyin.',
  alternates: {
    canonical: '/examples',
  },
};

export default function ExamplesPage() {
  return <ExamplesContent />;
}
