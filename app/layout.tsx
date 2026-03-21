import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/components/LanguageProvider';
import { buildOrganizationSchema, buildSoftwareApplicationSchema, buildWebsiteSchema } from '@/lib/seo/structured-data';
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_URL } from '@/lib/seo/site';
import { DEFAULT_LANGUAGE, translateText } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const lang = DEFAULT_LANGUAGE;
  const description = translateText(lang, SITE_DESCRIPTION);
  const productTitle = translateText(lang, 'Emlak Fotoğraf ve İçerik Araçları');
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} | ${productTitle}`,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords: [
      'Studio Estate',
      translateText(lang, 'emlak fotoğraf geliştirme'),
      translateText(lang, 'sanal dekorasyon'),
      translateText(lang, 'akıllı eşya silme'),
      translateText(lang, 'ilan metni oluşturucu'),
      translateText(lang, 'sanal tadilat'),
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: `${SITE_NAME} | ${productTitle}`,
      description,
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} ${translateText(lang, 'kapak görseli')}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} | ${productTitle}`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = DEFAULT_LANGUAGE;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationSchema(), buildWebsiteSchema(), buildSoftwareApplicationSchema()],
  };

  return (
    <html lang={lang}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <LanguageProvider initialLanguage={lang}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
