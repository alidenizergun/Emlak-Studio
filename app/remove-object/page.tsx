import type { Metadata } from 'next';
import RemoveObjectClient from './RemoveObjectClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Akıllı Eşya Silme',
    description: 'İstenmeyen eşyaları fotoğraflarınızdan doğal ve temiz sonuçlarla kaldırın.',
    path: '/remove-object',
  });
}

export default function RemoveObjectPage() {
  return <RemoveObjectClient />;
}
