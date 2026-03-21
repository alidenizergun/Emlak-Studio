import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Örnekler',
  description: 'Studio Estate ile üretilen örnek dönüşümleri inceleyin.',
  alternates: {
    canonical: '/examples',
  },
};

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
