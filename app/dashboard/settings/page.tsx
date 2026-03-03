import SettingsClient from './SettingsClient';

export const metadata = {
    title: 'Ayarlar - Bana Özel',
    description: 'Hesap ayarları.',
    robots: { index: false, follow: false },
};

export default function SettingsPage() {
    return <SettingsClient />;
}
