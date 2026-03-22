import type { Metadata } from 'next';
import AiTourGuideComingSoon from './AiTourGuideComingSoon';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Sanal Sunucu - Yakında',
    description: 'Sanal Sunucu aracı MVP sonrasında açılacak.',
    path: '/ai-tour-guide',
    index: false,
  });
}

export default function AiTourGuidePage() {
  return <AiTourGuideComingSoon />;
}
