"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from '../../components/Pricing.module.css';

const PRICING_TIERS = [
    {
        name: "Danışman",
        id: "danisman",
        originalPrice: 2999,
        discountedPrice: 1299,
        yearlyPriceMultiplier: 0.8,
        description: "Bireysel emlak danışmanları için başlangıç paketi.",
        features: [
            "180 Kredi (Her ay yenilenir)",
            "Yaklaşık 90 ilan görseli",
            "Ticari Kullanım İzni"
        ],
        cta: "Hemen Başla",
        popular: false
    },
    {
        name: "Ofis",
        id: "ofis",
        originalPrice: 4499,
        discountedPrice: 1999,
        yearlyPriceMultiplier: 0.8,
        description: "Ekipler ve büyüyen emlak ofisleri için ideal çözüm.",
        features: [
            "320 Kredi (Her ay yenilenir)",
            "Yaklaşık 160 ilan görseli",
            "Tüm AI Modellerine Erişim",
            "Yüksek İşlem Önceliği",
            "Ticari Kullanım İzni",
            "Standart Email Desteği"
        ],
        cta: "En Popüler Planı Seç",
        popular: true
    },
    {
        name: "Kurumsal",
        id: "kurumsal",
        originalPrice: 10999,
        discountedPrice: 4999,
        yearlyPriceMultiplier: 0.8,
        description: "Büyük ajanslar ve gelişmiş kurumsal ihtiyaçlar için.",
        features: [
            "1000 Kredi (Her ay yenilenir)",
            "Yaklaşık 500 ilan görseli",
            "Tüm AI Modellerine Erişim",
            "Özel API Erişimi",
            "Ticari Kullanım İzni",
            "7/24 Özel Müşteri Temsilcisi"
        ],
        cta: "Kurumsal İletişim",
        popular: false
    }
];

const FAQ_ITEMS = [
    {
        question: "1 kredi ne anlama geliyor?",
        answer: "Her bir AI işlemi (örneğin bir odayı dekore etmek veya fotoğraf kalitesini artırmak) kredinizi kullanır. Ortalama bir ilan için 5-10 kredi kullanımı yeterli olmaktadır."
    },
    {
        question: "İstediğim zaman iptal edebilir miyim?",
        answer: "Evet, taahhüt yok. İstediğiniz zaman panel üzerinden aboneliğinizi dilediğiniz zaman tek tıkla iptal edebilirsiniz."
    },
    {
        question: "Fatura kesiyor musunuz?",
        answer: "Kesinlikle. Tüm ödemeleriniz için otomatik e-fatura oluşturulur ve email adresinize gönderilir. Şirket gideri olarak gösterebilirsiniz."
    },
    {
        question: "Kredilerim sonraki aya devreder mi?",
        answer: "Abonelik planlarındaki krediler her ay yenilenir. Kullanılmayan krediler ay sonunda sıfırlanır, bu yüzden ay içinde aktif kullanmanızı öneririz."
    },
    {
        question: "Kurumsal ihtiyaçlar için özel plan var mı?",
        answer: "Eğer aylık 750 kredi size yetmiyorsa, ihtiyaçlarınıza özel bir 'Kurumsal Plus' teklifi hazırlayabiliriz. Bizimle iletişime geçebilirsiniz."
    },
    {
        question: "Ücretsiz deneme var mı?",
        answer: "Sisteme kayıt olduğunuzda size hediye edilen ücretsiz kredilerle tüm özellikleri test edebilir, sonuçları kendi gözlerinizle görebilirsiniz."
    }
];

const CheckIcon = () => (
    <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div className={styles.pricingPage}>
            <div className={styles.backgroundGlow} />

            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span style={{ display: 'block' }}>Emlak Fotoğraflarınızı</span>
                        <span style={{ display: 'block' }}>
                            <span className={styles.titleGradient}>Yapay Zeka</span> ile
                        </span>
                        <span style={{ display: 'block' }}>Güçlendirin</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Şeffaf fiyatlandırma, sınırsız potansiyel. İstediğiniz an iptal edin.
                    </p>
                </div>

                <div className={styles.toggleSection}>
                    <div className={styles.toggleContainer}>
                        <span className={`${styles.toggleLabel} ${!isYearly ? styles.toggleLabelActive : ''}`}>Aylık</span>
                        <button
                            className={`${styles.toggleSwitch} ${isYearly ? styles.toggleSwitchActive : ''}`}
                            onClick={() => setIsYearly(!isYearly)}
                            aria-label="Ödeme periyodu değiştir"
                        >
                            <div className={`${styles.toggleHandle} ${isYearly ? styles.toggleHandleActive : ''}`} />
                        </button>
                        <span className={`${styles.toggleLabel} ${isYearly ? styles.toggleLabelActive : ''}`}>
                            Yıllık <span className={styles.saveBadge}>En Avantajlı</span>
                        </span>
                    </div>
                    <div className={styles.annualDiscountBadge}>
                        🌟 Yıllık ödemede %20 indirim fırsatını kaçırmayın
                    </div>
                </div>

                <div className={styles.grid}>
                    {PRICING_TIERS.map((tier) => {
                        const basePrice = tier.discountedPrice;
                        const originalMonthlyPrice = tier.originalPrice;

                        const displayPrice = isYearly
                            ? Math.round(basePrice * tier.yearlyPriceMultiplier)
                            : basePrice;

                        // Yıllıkta orijinal fiyat da (karşılaştırma için) yıllık bazda çarpılmalı mı? 
                        // Genelde aylık karşılaştırma daha etkileyici: "Şu fiyattı, şimdi bu"
                        const displayOriginalPrice = originalMonthlyPrice;

                        return (
                            <div
                                key={tier.id}
                                className={`${styles.card} ${tier.popular ? styles.popularCard : ''}`}
                            >
                                {tier.popular && (
                                    <div className={styles.popularBadge}>EN ÇOK TERCİH EDİLEN</div>
                                )}

                                <div className={styles.cardHeader}>
                                    <h3 className={styles.tierName}>{tier.name}</h3>
                                    <p className={styles.tierDesc}>{tier.description}</p>
                                </div>

                                <div className={styles.priceContainer}>
                                    <span className={styles.currency}>₺</span>
                                    <span className={styles.price}>{displayPrice.toLocaleString('tr-TR')}</span>
                                    <span className={styles.period}>/ay</span>
                                </div>

                                <div className={styles.discountWrapper}>
                                    <span className={styles.originalPrice}>₺{displayOriginalPrice.toLocaleString('tr-TR')}</span>
                                    <span className={styles.discountLabel}>Kısa süreliğine %60 İndirimli</span>
                                </div>

                                {isYearly && (
                                    <div className={styles.yearlyExtraNote}>
                                        Yıllık ödemede ek %20 avantajlı
                                    </div>
                                )}

                                <Link
                                    href={tier.id === 'kurumsal' ? '/contact' : '/register'}
                                    className={`${styles.ctaButton} ${tier.popular ? styles.popularCta : styles.secondaryCta}`}
                                >
                                    {tier.cta}
                                </Link>

                                <div className={styles.features}>
                                    <p className={styles.featuresTitle}>Neler Dahil?</p>
                                    <ul className={styles.featureList}>
                                        {tier.features.map((feature, index) => (
                                            <li key={index} className={styles.featureItem}>
                                                <CheckIcon />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <section className={styles.faqSection}>
                <div className="container">
                    <div className={styles.faqHeader}>
                        <h2 className={styles.faqTitle}>Sıkça Sorulan Sorular</h2>
                        <p className={styles.faqSubtitle}>Aklınıza takılan soruların cevaplarını burada bulabilirsiniz.</p>
                    </div>

                    <div className={styles.faqGrid}>
                        {FAQ_ITEMS.map((item, index) => (
                            <div key={index} className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>
                                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    {item.question}
                                </h4>
                                <p className={styles.faqAnswer}>{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
