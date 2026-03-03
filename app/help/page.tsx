import type { Metadata } from 'next';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'Yardım Merkezi',
  description: 'Emlak Stüdyosu kullanım rehberi, sıkça sorulan sorular ve destek içerikleri.',
  alternates: {
    canonical: '/help',
  },
};

export default function HelpPage() {
  return <HelpClient />;
}
