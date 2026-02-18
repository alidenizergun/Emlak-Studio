import Link from 'next/link';
import styles from '../Dashboard.module.css';

export const metadata = {
    title: 'Ayarlar - Bana Özel',
    description: 'Hesap ayarları.',
};

export default function SettingsPage() {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.topSection}>
                <div className={styles.topInner}>
                    <h1 className={styles.title}>Ayarlar</h1>
                    <p className={styles.subtitle}>Hesap ve tercih ayarları yakında eklenecek.</p>
                    <Link href="/studio" className={styles.accountBtn}>Stüdyoya dön</Link>
                </div>
            </div>
        </div>
    );
}
