import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'Emlak Stüdyosu kredi ve abonelik planlarını karşılaştırın.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
