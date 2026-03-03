import type { Metadata } from 'next';
import IlanMetniClient from './IlanMetniClient';

export const metadata: Metadata = {
  title: 'İlan Metni Oluşturucu',
  description: 'Fotoğraf ve mülk verilerine göre ilan metinlerini hızlıca oluşturun.',
  alternates: {
    canonical: '/ilan-metni',
  },
};

export default function IlanMetniPage() {
  return <IlanMetniClient />;
}
