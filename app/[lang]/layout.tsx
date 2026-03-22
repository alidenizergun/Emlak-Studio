import { notFound } from 'next/navigation';
import { isSupportedLanguage } from '@/lib/locale-routing';

export default async function LocalizedLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLanguage(lang)) notFound();
  return children;
}
