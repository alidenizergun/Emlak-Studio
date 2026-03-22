import type { Metadata } from 'next';
import SuggestionsClient from './SuggestionsClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Öneriler',
    description: 'Studio Estate için ürün ve özellik önerilerinizi paylaşın.',
    path: '/suggestions',
  });
}

export default function SuggestionsPage() {
  return <SuggestionsClient />;
}
