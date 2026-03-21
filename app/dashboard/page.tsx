import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Yönlendiriliyor - Studio Estate',
    robots: { index: false, follow: false },
};

/** Dashboard iptal; giriş yapan kullanıcı doğrudan Stüdyo sayfasına yönlendirilir. */
export default function DashboardPage() {
    redirect('/studio');
}
