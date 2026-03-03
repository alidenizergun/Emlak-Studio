import type { Metadata } from 'next';
import SanalTadilatClient from './SanalTadilatClient';

export const metadata: Metadata = {
  title: 'Tadilat',
  description: 'Zemin, duvar ve yüzey yenileme çalışmalarıyla mülkün potansiyelini gösterin.',
  alternates: {
    canonical: '/sanal-tadilat',
  },
};

export default function SanalTadilatPage() {
  return <SanalTadilatClient />;
}
