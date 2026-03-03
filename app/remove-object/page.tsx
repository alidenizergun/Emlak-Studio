import type { Metadata } from 'next';
import RemoveObjectClient from './RemoveObjectClient';

export const metadata: Metadata = {
  title: 'Akıllı Eşya Silme',
  description: 'İstenmeyen eşyaları fotoğraflarınızdan doğal ve temiz sonuçlarla kaldırın.',
  alternates: {
    canonical: '/remove-object',
  },
};

export default function RemoveObjectPage() {
  return <RemoveObjectClient />;
}
