import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Yönlendiriliyor - Emlak Stüdyosu',
    robots: { index: false, follow: false },
};

/** Dashboard iptal; giriş yapan kullanıcı doğrudan Stüdyo sayfasına yönlendirilir. */
export default function DashboardPage() {
    redirect('/studio');
}
