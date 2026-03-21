import type { Metadata } from 'next';
import AiTourGuideComingSoon from './AiTourGuideComingSoon';

export const metadata: Metadata = {
  title: 'Sanal Sunucu - Yakında',
  description: 'Sanal Sunucu aracı MVP sonrasında açılacak.',
  alternates: {
    canonical: '/ai-tour-guide',
  },
};

export default function AiTourGuidePage() {
  return <AiTourGuideComingSoon />;
}
