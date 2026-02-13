import { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
    title: 'Ücretsiz Kayıt Ol - Emlak AIStudio | 2 Kredi Hediye',
    description: 'Emlak AIStudio\'ya ücretsiz kayıt olun, 2 kredi hediye kazanın. Profesyonel emlak görselleri oluşturmaya hemen başlayın. Kredi kartı gerekmez.',
    openGraph: {
        title: 'Ücretsiz Kayıt Ol - Emlak AIStudio',
        description: 'Ücretsiz kayıt olun, 2 kredi hediye kazanın. Profesyonel emlak görselleri oluşturmaya hemen başlayın.',
        url: 'https://emlak-aistudio.com/register',
        siteName: 'Emlak AIStudio',
        locale: 'tr_TR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Ücretsiz Kayıt Ol - Emlak AIStudio',
        description: 'Ücretsiz kayıt olun, 2 kredi hediye kazanın.',
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
