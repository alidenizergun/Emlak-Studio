import type { Metadata } from 'next';
import HelpClient from './HelpClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Yardım Merkezi',
    description: 'Studio Estate kullanım rehberi, sıkça sorulan sorular ve destek içerikleri.',
    path: '/help',
  });
}

export default function HelpPage() {
  return <HelpClient />;
}
