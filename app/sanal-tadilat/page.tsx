import type { Metadata } from 'next';
import SanalTadilatClient from './SanalTadilatClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Sanal Tadilat',
    description: 'Zemin, duvar ve yüzey yenileme çalışmalarıyla mülkün potansiyelini gösterin.',
    path: '/sanal-tadilat',
  });
}

export default function SanalTadilatPage() {
  return <SanalTadilatClient />;
}
