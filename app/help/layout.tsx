import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yardım Merkezi',
  description: 'Emlak Stüdyosu kullanım rehberi, sıkça sorulan sorular ve destek içerikleri.',
  alternates: {
    canonical: '/help',
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
