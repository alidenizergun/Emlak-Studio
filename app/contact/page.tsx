import Link from 'next/link';
import styles from './Contact.module.css';

export const metadata = {
    title: 'İletişim - Emlak Stüdyosu | 7/24 Destek',
    description: 'Emlak Stüdyosu müşteri hizmetleri ile iletişime geçin. Telefon ve e-posta desteği ile yanınızdayız.',
};

const CHANNELS = [
    {
        key: 'phone',
        label: 'Telefon Hattı',
        title: '0850 123 45 67',
        desc: 'Acil destek ve satış öncesi sorular için doğrudan bağlanın.',
        href: 'tel:08501234567',
        meta: 'Hafta içi 09:00 - 18:00',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.12a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
        ),
    },
    {
        key: 'mail',
        label: 'E-posta',
        title: 'destek@emlak-yz.com',
        desc: 'Teknik detaylar ve kurumsal talepler için yazılı destek alın.',
        href: 'mailto:destek@emlak-yz.com',
        meta: 'Ortalama 2 saat içinde yanıt',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <path d="m22 7-10 6L2 7" />
            </svg>
        ),
    },
    {
        key: 'help',
        label: 'Yardım Merkezi',
        title: 'Hızlı Çözüm Kütüphanesi',
        desc: 'En çok sorulan konulara adım adım rehberlerden anında yanıt bulun.',
        href: '/help',
        meta: '7/24 erişim',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    },
];

export default function ContactPage() {
    return (
        <div className={styles.page}>
            <div className={`container ${styles.container}`}>
                <section className={styles.hero}>
                    <p className={styles.kicker}>Contact Desk</p>
                    <h1 className={styles.title}>Sizin için doğru destek kanalını seçelim</h1>
                    <p className={styles.subtitle}>
                        Teknik destekten kurumsal iş birliğine kadar tüm iletişim noktaları tek yerde.
                        Hızlı, net ve takip edilebilir bir destek akışı sunuyoruz.
                    </p>

                    <div className={styles.heroStats}>
                        <div>
                            <strong>&lt; 2 saat</strong>
                            <span>Ortalama e-posta yanıtı</span>
                        </div>
                        <div>
                            <strong>09:00-18:00</strong>
                            <span>Canlı telefon desteği</span>
                        </div>
                        <div>
                            <strong>7/24</strong>
                            <span>Yardım merkezi erişimi</span>
                        </div>
                    </div>
                </section>

                <section className={styles.grid}>
                    {CHANNELS.map((channel) => (
                        <article key={channel.key} className={styles.card}>
                            <div className={styles.cardTop}>
                                <span className={styles.icon}>{channel.icon}</span>
                                <span className={styles.label}>{channel.label}</span>
                            </div>
                            <h2 className={styles.cardTitle}>{channel.title}</h2>
                            <p className={styles.cardDesc}>{channel.desc}</p>
                            <p className={styles.cardMeta}>{channel.meta}</p>
                            <Link href={channel.href} className={styles.cardCta}>
                                Hemen Ulaş
                            </Link>
                        </article>
                    ))}
                </section>

                <section className={styles.bottomStrip}>
                    <p>Çözüm bulamadınız mı?</p>
                    <Link href="/help" className={styles.stripBtn}>Yardım Merkezine Git</Link>
                </section>
            </div>
        </div>
    );
}
