import type { Metadata } from 'next';
import PricingClient from './PricingClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Fiyatlandırma',
    description: 'Studio Estate kredi ve abonelik planlarını karşılaştırın.',
    path: '/pricing',
  });
}

export default function PricingPage() {
  return <PricingClient />;
}
