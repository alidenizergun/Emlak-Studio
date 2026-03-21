import LoginClient from './LoginClient';
import type { Metadata } from 'next';
import { buildLocalizedMetadata } from '@/lib/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
    return buildLocalizedMetadata({
        title: 'Giriş Yap',
        description: 'Studio Estate hesabınıza güvenli şekilde giriş yapın.',
        path: '/login',
        index: false,
    });
}

export default function LoginPage() {
    return <LoginClient />;
}
