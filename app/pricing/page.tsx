"use client";

import { useState } from 'react';
import styles from '../../components/Pricing.module.css';

const PRICING_TIERS = [
    {
        name: "Danışman",
        price: "₺1.199",
        period: "/ay",
        description: "",
        features: [
            "100 Kredi (Aylık)",
            "Yaklaşık 50 ilan görseli",
            "Tüm AI Modelleri",
            "Hızlı İşlem Önceliği",
            "Ticari Kullanım İzni",
            "Email destek"
        ],
        cta: "Abone Ol",
        popular: false,
        discount: "%50 İNDİRİM"
    },
    {
        name: "Ofis",
        price: "₺1.999",
        period: "/ay",
        description: "",
        features: [
            "200 Kredi (Aylık)",
            "Yaklaşık 100 ilan görseli",
            "Tüm AI Modelleri",
            "Hızlı İşlem Önceliği",
            "Ticari Kullanım İzni",
            "Öncelikli destek"
        ],
        cta: "Abone Ol",
        popular: true,
        discount: "%50 İNDİRİM"
    },
    {
        name: "Kurumsal",
        price: "₺4.999",
        period: "/ay",
        description: "",
        features: [
            "500 Kredi (Aylık)",
            "Yaklaşık 250 ilan görseli",
            "Tüm AI Modelleri",
            "Hızlı İşlem Önceliği",
            "Ticari Kullanım İzni",
            "7/24 canlı destek"
        ],
        cta: "Abone Ol",
        popular: false,
        discount: "%50 İNDİRİM"
    }
];

const FAQ_ITEMS = [
    {
        question: "💳 Kredi nedir ve nasıl kullanılır?",
        answer: "1 kredi, 1 odayı sanal olarak dekore etmek veya düzenlemek anlamına gelir. Ortalama 2 kredi 1 ilan görseline denk gelir (ör. 100 kredi ile yaklaşık 50 ilan görseli). Kredilerinizi ay boyunca dilediğiniz zaman kullanabilirsiniz."
    },
    {
        question: "🔄 Planımı sonradan değiştirebilir miyim?",
        answer: "Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz. Yükseltme işlemlerinde aradaki fark anında yansıtılır, düşürme işlemlerinde ise bir sonraki fatura döneminde yeni plan devreye girer."
    },
    {
        question: "💰 Kullanılmayan krediler bir sonraki aya devreder mi?",
        answer: "Hayır, krediler aylık kullanım içindir ve her fatura döneminde yenilenir. Kullanılmayan krediler bir sonraki aya devretmez, bu yüzden kredilerinizi ay içinde kullanmanızı öneririz."
    },
    {
        question: "📄 Fatura alabilir miyim? Şirketim için gider gösterebilir miyim?",
        answer: "Kesinlikle. Ödemeniz tamamlandıktan sonra e-faturanız otomatik olarak oluşturulur ve kayıtlı e-posta adresinize gönderilir. Bu faturayı şirket harcamalarınızda gider olarak kullanabilirsiniz."
    },
    {
        question: "❌ İptal ve iade politikanız nedir?",
        answer: "Hizmetimizden memnun kalmazsanız, ilk 14 gün içinde koşulsuz şartsız para iadesi talep edebilirsiniz. Aboneliğinizi ise dilediğiniz zaman panel üzerinden tek tıkla iptal edebilirsiniz."
    },
    {
        question: "🏢 Kurumsal planın avantajları nelerdir?",
        answer: "Kurumsal plan, büyük emlak ofisleri ve ajanslar için tasarlanmıştır. Bu planda daha yüksek kredi limitleri, 8K ultra çözünürlük desteği, özel logo ekleme (white-label) ve 7/24 öncelikli canlı destek sunulmaktadır."
    },
    {
        question: "🖼️ Görsellerde filigran (watermark) olacak mı?",
        answer: "Danışman (Başlangıç) planında görsellerde küçük bir logo bulunabilir. Ofis ve Kurumsal planlarımızda ise görseller tamamen filigransızdır ve kendi logonuzu ekleme seçeneği sunulur."
    },
    {
        question: "⚖️ Oluşturulan görselleri ticari olarak kullanabilir miyim?",
        answer: "Evet, tüm planlarımız size oluşturduğunuz görseller üzerinde tam ticari kullanım hakkı verir. İlan sitelerinde, sosyal medyada veya basılı materyallerde özgürce kullanabilirsiniz."
    }
];

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.faqItem}>
            <button
                className={styles.faqQuestion}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h4>{question}</h4>
                <svg
                    className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <div className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ''}`}>
                <p>{answer}</p>
            </div>
        </div>
    );
};

export default function PricingPage() {
    return (
        <div className={styles.pricingPage}>
            <div className="container">
                <div className={styles.priceNotice}>
                    <span className={styles.priceNoticeIcon} aria-hidden>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                        </svg>
                    </span>
                    <p className={styles.priceNoticeText}>
                        <strong>Kısa süreli fırsat:</strong> Şu an tüm planlarda %50 indirim. Fiyatlar yakında yükseliyor — aşağıdaki planlardan birini seçin, indirimli fiyatlarla hemen başlayın.
                    </p>
                </div>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Başarınıza Uygun Planı Seçin
                    </h1>
                    <p className={styles.subtitle}>
                        Tüm planlar 14 gün para iade garantisi ile gelir.<br />
                        İstediğiniz zaman iptal edebilirsiniz.
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
                    <div className={styles.faqList}>
                        {FAQ_ITEMS.map((item, index) => (
                            <FAQItem key={index} question={item.question} answer={item.answer} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
