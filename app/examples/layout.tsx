import type { Metadata } from 'next';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Örnekler',
    description: 'Studio Estate ile üretilen örnek dönüşümleri inceleyin.',
    path: '/examples',
  });
}

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
