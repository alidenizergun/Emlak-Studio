import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yardım Merkezi | Emlak AISTUDIO',
  description: 'Emlak AIStudio kullanım rehberi, sıkça sorulan sorular ve destek. Fotoğraf geliştirme, sanal dekorasyon ve hesaplar hakkında yardım.',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
