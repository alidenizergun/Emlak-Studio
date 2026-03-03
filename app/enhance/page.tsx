import type { Metadata } from 'next';
import EnhanceEditor from './EnhanceEditor';
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Fotoğraf Geliştirme',
  description: 'Işık, renk, netlik ve temizlik ayarlarıyla emlak fotoğraflarınızı geliştirin.',
  alternates: {
    canonical: '/enhance',
  },
  openGraph: {
    title: `Fotoğraf Geliştirme | ${SITE_NAME}`,
    description: 'Işık, renk, netlik ve temizlik ayarlarıyla emlak fotoğraflarınızı geliştirin.',
    url: absoluteUrl('/enhance'),
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function EnhancePage() {
  return <EnhanceEditor />;
}
