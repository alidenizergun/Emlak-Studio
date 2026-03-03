import { Metadata } from 'next';
import RegisterClient from './RegisterClient';
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Ücretsiz Kayıt Ol',
  description: `${SITE_NAME}'na ücretsiz kayıt olun ve araçları hemen kullanmaya başlayın.`,
  openGraph: {
    title: `Ücretsiz Kayıt Ol | ${SITE_NAME}`,
    description: `${SITE_NAME}'nda hesabınızı oluşturun ve çalışmalara başlayın.`,
    url: absoluteUrl('/register'),
    siteName: SITE_NAME,
    locale: 'tr_TR',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Ücretsiz Kayıt Ol | ${SITE_NAME}`,
    description: `${SITE_NAME}'nda hesabınızı oluşturun ve çalışmalara başlayın.`,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/register',
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
