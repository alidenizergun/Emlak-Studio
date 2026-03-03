import type { Metadata } from 'next';
import SuggestionsClient from './SuggestionsClient';

export const metadata: Metadata = {
  title: 'Öneriler',
  description: 'Emlak Stüdyosu için ürün ve özellik önerilerinizi paylaşın.',
  alternates: {
    canonical: '/suggestions',
  },
};

export default function SuggestionsPage() {
  return <SuggestionsClient />;
}
