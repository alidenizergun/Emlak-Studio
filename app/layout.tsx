import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Emlak YZ - Yapay Zeka ile Emlak Görselleştirme | AI Fotoğraf Düzenleme",
  description: "Emlak ilanlarınızı yapay zeka ile dönüştürün. Boş odaları mobilyalandırın, karanlık fotoğrafları aydınlatın, gökyüzünü maviye boyayın. Ücretsiz deneyin!",
  keywords: ["emlak ai", "yapay zeka emlak", "sanal mobilyalama", "emlak fotoğraf", "ai dekorasyon", "emlak görselleştirme", "sanal staging"],
  authors: [{ name: "Emlak YZ" }],
  creator: "Emlak YZ",
  publisher: "Emlak YZ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://emlak-yz.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Emlak YZ - Yapay Zeka ile Emlak Görselleştirme",
    description: "Emlak ilanlarınızı yapay zeka ile dönüştürün. Boş odaları mobilyalandırın, karanlık fotoğrafları aydınlatın, gökyüzünü maviye boyayın.",
    url: 'https://emlak-yz.com',
    siteName: 'Emlak YZ',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Emlak YZ - Yapay Zeka ile Emlak Görselleştirme',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Emlak YZ - Yapay Zeka ile Emlak Görselleştirme",
    description: "Emlak ilanlarınızı yapay zeka ile dönüştürün. Ücretsiz deneyin!",
    images: ['/og-image.jpg'],
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
  verification: {
    google: 'google-site-verification-code',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "Emlak YZ",
        "url": "https://emlak-yz.com",
        "logo": "https://emlak-yz.com/logo.png"
      },
      {
        "@type": "WebSite",
        "name": "Emlak YZ",
        "url": "https://emlak-yz.com"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Emlak YZ",
        "applicationCategory": "BusinessApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY" }
      }
    ]
  };

  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
