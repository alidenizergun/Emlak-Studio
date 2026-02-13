import styles from '../../components/Pricing.module.css';

const PRICING_TIERS = [
    {
        name: "Başlangıç",
        price: "₺299",
        period: "/ay",
        description: "Küçük portföyler için ideal",
        features: [
            "20 kredi/ay",
            "Temel dekorasyon stilleri",
            "HD kalite (1080p)",
            "Email destek",
            "Basit filigran kaldırma",


            "1 kullanıcı hesabı"
        ],
        cta: "Başla",
        popular: false,
        discount: null
    },
    {
        name: "Profesyonel",
        price: "₺699",
        period: "/ay",
        description: "Aktif emlakçılar için en popüler",
        features: [
            "100 kredi/ay",
            "Tüm premium stiller",
            "4K ultra kalite",
            "Öncelikli destek",
            "Filigransız görseller",
            "5 kullanıcı hesabı",
            "Toplu yükleme",
            "Özel marka logosu",
            "API erişimi"
        ],
        cta: "En Popüler ✨",
        popular: true,
        discount: "%60 İndirim - Normalde ₺1.749"
    },
    {
        name: "Kurumsal",
        price: "₺1.499",
        period: "/ay",
        description: "Büyük ajanslar için",
        features: [
            "Sınırsız kredi",
            "Tüm özellikler",
            "8K ultra kalite",
            "7/24 canlı destek",
            "Filigransız + özel logo",
            "Sınırsız kullanıcı",
            "Toplu işlem",
            "White-label çözüm",
            "Kişisel hesap yöneticisi",
            "Özel model eğitimi"
        ],
        cta: "İletişime Geç",
        popular: false,
        discount: null
    }
];

export default function PricingPage() {
    return (
        <div className={styles.pricingPage}>
            <div className="container">
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Başarınıza Uygun Planı Seçin
                    </h1>
                    <p className={styles.subtitle}>
                        Tüm planlar 14 gün para iade garantisi ile gelir. İstediğiniz zaman iptal edebilirsiniz.
                    </p>
                </div>

                <div className={styles.grid}>
                    {PRICING_TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className={`${styles.card} ${tier.popular ? styles.popular : ''}`}
                        >
                            {tier.popular && (
                                <div className={styles.badge}>
                                    🏆 En Çok Tercih Edilen
                                </div>
                            )}

                            <div className={styles.cardHeader}>
                                <h3 className={styles.tierName}>{tier.name}</h3>
                                <p className={styles.description}>{tier.description}</p>
                            </div>

                            <div className={styles.priceSection}>
                                <div className={styles.price}>
                                    {tier.price}
                                    <span className={styles.period}>{tier.period}</span>
                                </div>
                                {tier.discount && (
                                    <div className={styles.discount}>{tier.discount}</div>
                                )}
                            </div>

                            <ul className={styles.features}>
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} className={styles.feature}>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="10" fill="#10b981" />
                                            <path d="M6 10l2.5 2.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={tier.name === "Kurumsal" ? "/contact" : "/register"}
                                className={`${styles.ctaButton} ${tier.popular ? styles.ctaPopular : ''}`}
                            >
                                {tier.cta}
                            </a>
                        </div>
                    ))}
                </div>

                <div className={styles.faq}>
                    <h2>Sıkça Sorulan Sorular</h2>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h4>💳 Kredi nedir?</h4>
                            <p>1 kredi = 1 oda dekoras yonu. Kullanılmayan krediler bir sonraki aya aktarılmaz.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>🔄 Plan değiştirebilir miyim?</h4>
                            <p>Evet, istediğiniz zaman yükseltme veya düşürme yapabilirsiniz.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>💰 Ödeme nasıl yapılır?</h4>
                            <p>Kredi kartı veya banka kartı ile güvenli ödeme. Tüm kartlar kabul edilir.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>📞 Destek var mı?</h4>
                            <p>Tüm planlarda email destek. Profesyonel ve Kurumsal'da öncelikli destek.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
