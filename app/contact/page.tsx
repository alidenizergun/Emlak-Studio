import Link from 'next/link';
import styles from './Contact.module.css';

export const metadata = {
    title: 'İletişim - Emlak YZ | Müşteri Destek',
    description: 'Emlak YZ destek ekibi ile iletişime geçin. Her türlü sorunuz ve probleminiz için yanınızdayız.',
};

export default function ContactPage() {
    return (
        <div className={`container ${styles.page}`}>
            <header className={styles.header}>
                <h1 className={styles.title}>İletişime Geçin</h1>
                <p className={styles.subtitle}>
                    Emlak YZ ile ilgili her türlü soru, öneri ve destek talebiniz için bize ulaşabilirsiniz.
                    Uzman ekibimiz size yardımcı olmaktan mutluluk duyacaktır.
                </p>
            </header>

            <div className={styles.content}>
                <div className={styles.contactGrid}>
                    {/* Support Person Card */}
                    <div className={styles.contactCard}>
                        <div className={styles.cardIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.12a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                        </div>
                        <div className={styles.cardInfo}>
                            <h3 className={styles.cardInfoTitle}>Müşteri İlişkileri</h3>
                        </div>
                    </div>

                    {/* Email Support */}
                    <div className={styles.contactCard}>
                        <div className={styles.cardIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <div className={styles.cardInfo}>
                            <h3 className={styles.cardInfoTitle}>E-posta Destek</h3>
                            <a href="mailto:destek@emlak-yz.com" className={styles.contactLink}>destek@emlak-yz.com</a>
                            <p className={styles.supportNote}>7/24 e-posta üzerinden bizlere ulaşabilirsiniz.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.helpGuide}>
                    <div className={styles.helpIcon}>❓</div>
                    <p>
                        Sıkça sorulan sorulara göz atmak ister misiniz?
                        <Link href="/help"> Yardım Merkezi</Link> sayfamızı ziyaret edebilirsiniz.
                    </p>
                </div>
            </div>
        </div>
    );
}
