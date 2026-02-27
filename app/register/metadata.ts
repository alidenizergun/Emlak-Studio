import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ücretsiz Kayıt Ol - Emlak Stüdyosu | 2 Kredi Hediye",
    description: "Emlak Stüdyosu'na ücretsiz kayıt olun, 2 kredi hediye kazanın. Profesyonel emlak görselleri oluşturmaya hemen başlayın. Kredi kartı gerekmez.",
    openGraph: {
        title: "Ücretsiz Kayıt Ol - Emlak Stüdyosu",
        description: "Ücretsiz kayıt olun, 2 kredi hediye kazanın. Profesyonel emlak görselleri oluşturmaya hemen başlayın.",
        url: 'https://emlak-yz.com/register',
        siteName: 'Emlak Stüdyosu',
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: "Ücretsiz Kayıt Ol - Emlak Stüdyosu",
        description: "Ücretsiz kayıt olun, 2 kredi hediye kazanın.",
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: '/register',
    },
};
