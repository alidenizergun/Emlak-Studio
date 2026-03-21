import AdminClient from './AdminClient';

export const metadata = {
    title: 'Super Admin - Studio Estate',
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    return <AdminClient />;
}
