import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
    title: 'Bana Özel - Emlak YZ',
    description: 'Hesabınız ve araçlara hızlı erişim.',
};

export default function DashboardPage() {
    return <DashboardClient />;
}
