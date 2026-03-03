import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Slider İkon Testi',
  robots: { index: false, follow: false },
};

export default function SliderIconsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
