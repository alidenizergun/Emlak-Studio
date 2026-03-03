import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menü Demo',
  robots: { index: false, follow: false },
};

export default function MenuDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
