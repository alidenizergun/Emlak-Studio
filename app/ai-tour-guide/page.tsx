import type { Metadata } from 'next';
import AiTourGuideClient from './AiTourGuideClient';

export const metadata: Metadata = {
  title: 'Sanal Sunucu',
  description: 'Mülk bilgilerini akıcı bir anlatım ile sunan sanal sunucu içeriği oluşturun.',
  alternates: {
    canonical: '/ai-tour-guide',
  },
};

export default function AiTourGuidePage() {
  return <AiTourGuideClient />;
}
