import Link from 'next/link';
import styles from './Contact.module.css';

export const metadata = {
    title: 'İletişim - Emlak YZ | 7/24 Destek',
    description: 'Emlak YZ müşteri hizmetleri ile iletişime geçin. Telefon ve e-posta desteği ile yanınızdayız.',
};

export default function ContactPage() {
    return (
        <div className={`container ${styles.page}`}>
            <header className={styles.header}>
                <span className={styles.badge}>Bize Ulaşın</span>
                <h1 className={styles.title}>Size Nasıl Yardımcı Olabiliriz?</h1>
                <p className={styles.subtitle}>
                    Emlak görselleştirme süreçlerinizle ilgili teknik destek, paket önerileri veya iş birliği fırsatları için ekibimizle dilediğiniz kanaldan iletişime geçebilirsiniz.
                </p>
            </header>

            <div className={styles.content}>
                <div className={styles.contactGrid}>
                    {/* Phone Card */}
                    <div className={styles.contactCard}>
                        <div className={`${styles.cardIcon} ${styles.iconPhone}`}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.12a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                        </div>
                        <div className={styles.cardInfo}>
                            <h3 className={styles.cardTitle}>Müşteri Hizmetleri</h3>
                            <p className={styles.cardDesc}>
                                Satış öncesi sorularınız ve teknik destek konuları için bizi arayın.
                            </p>
                            <a href="tel:08501234567" className={styles.contactLink}>
                                0850 123 45 67
                            </a>
                            <div className={styles.hoursBadge}>
                                <span className={styles.dot}></span> Hafta içi 09:00 - 18:00
                            </div>
                        </div>
                    </div>

                    {/* Email Card */}
                    <div className={styles.contactCard}>
                        <div className={`${styles.cardIcon} ${styles.iconEmail}`}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <div className={styles.cardInfo}>
                            <h3 className={styles.cardTitle}>E-posta Desteği</h3>
                            <p className={styles.cardDesc}>
                                Detaylı sorularınız ve kurumsal iş ortaklığı talepleriniz için bize yazın.
                            </p>
                            <a href="mailto:destek@emlak-yz.com" className={styles.contactLink}>
                                destek@emlak-yz.com
                            </a>
                            <div className={styles.responseBadge}>
                                ⚡️ Ortalama 2 saat içinde yanıt
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Link Section */}
                <div className={styles.faqSection}>
                    <div className={styles.faqContent}>
                        <h3>Sıkça Sorulan Sorular</h3>
                        <p>Kredi kullanımı, faturalandırma ve teknik detaylarla ilgili yanıtları hızlıca bulun.</p>
                    </div>
                    <Link href="/help" className={styles.faqButton}>
                        Yardım Merkezine Git
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
