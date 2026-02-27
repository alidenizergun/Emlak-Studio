import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Yönlendiriliyor - Emlak Stüdyosu',
};

/** Dashboard iptal; giriş yapan kullanıcı doğrudan Stüdyo sayfasına yönlendirilir. */
export default function DashboardPage() {
    redirect('/studio');
}
