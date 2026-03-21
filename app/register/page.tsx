import { Metadata } from 'next';
import RegisterClient from './RegisterClient';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Ücretsiz Kayıt Ol',
    description: 'Studio Estate hesabınızı oluşturun ve çalışmalara başlayın.',
    path: '/register',
  });
}

export default function RegisterPage() {
  return <RegisterClient />;
}
