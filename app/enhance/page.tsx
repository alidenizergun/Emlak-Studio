import type { Metadata } from 'next';
import EnhanceEditor from './EnhanceEditor';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Fotoğraf Geliştirme',
    description: 'Işık, renk, netlik ve temizlik ayarlarıyla emlak fotoğraflarınızı geliştirin.',
    path: '/enhance',
  });
}

export default function EnhancePage() {
  return <EnhanceEditor />;
}
