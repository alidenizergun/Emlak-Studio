import type { Metadata } from 'next';
import { ExamplesContent } from './ExamplesContent';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Örnekler',
    description: 'Studio Estate dönüşüm örneklerini inceleyin.',
    path: '/examples',
  });
}

export default function ExamplesPage() {
  return <ExamplesContent />;
}
