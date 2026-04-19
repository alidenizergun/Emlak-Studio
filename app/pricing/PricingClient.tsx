'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../../components/Pricing.module.css';
import { useI18n } from '@/components/LanguageProvider';
import { getPricingCtaHref, getRuntimeFeatureGates } from '@/lib/runtime-env';
import { useRuntimeSnapshot } from '@/lib/use-runtime-env';

const PRICING_TIERS = [
    {
        name: 'Danisman',
        id: 'danisman',
        originalPrice: 2499,
        discountedPrice: 1999,
        yearlyPriceMultiplier: 0.8,
        ilanGorseli: 100,
        description: 'Bireysel emlak danismanlari icin baslangic paketi.',
        features: ['200 Kredi', '100 gorsele YZ calismasi', 'Ticari Kullanim Izni'],
        cta: 'Iletisime Gec',
        popular: false,
    },
    {
        name: 'Ofis',
        id: 'ofis',
        originalPrice: 2999,
        discountedPrice: 2499,
        yearlyPriceMultiplier: 0.8,
        ilanGorseli: 200,
        description: 'Ekipler ve emlak ofisleri icin ideal cozum.',
        features: ['400 Kredi', '200 gorsele YZ calismasi', 'Tum AI Modellerine Erisim', 'Islem onceligi', 'Ticari Kullanim Izni', 'Email ile destek'],
        cta: 'En Cok Tercih Edilen',
        popular: true,
    },
    {
        name: 'Kurumsal',
        id: 'kurumsal',
        originalPrice: 5999,
        discountedPrice: 4999,
        yearlyPriceMultiplier: 0.8,
        ilanGorseli: 500,
        description: 'Buyuk ajanslar ve gelismis kurumsal ihtiyaclar icin.',
        features: ['1000 Kredi', '500 gorsele YZ calismasi', 'Tum AI Modellerine Erisim', 'Yuksek islem onceligi', 'Ozel API Hazirligi', 'Ticari Kullanim Izni'],
        cta: 'Teklif Al',
        popular: false,
    },
];

const FAQ_ITEMS = [
    {
        question: '1 kredi ne anlama geliyor?',
        answer: 'Her bir AI islemi kredinizi kullanir. Ortalama bir ilan icin 5-10 kredi yeterli olmaktadir.',
    },
    {
        question: 'Istedigim zaman iptal edebilir miyim?',
        answer: 'Evet. MVP doneminde paket aktivasyonlari manuel ilerledigi icin iptal ve degisiklik taleplerini hizli sekilde destek ekibi uzerinden yonetiyoruz.',
    },
    {
        question: 'Fatura kesiyor musunuz?',
        answer: 'Evet. Ilk musteriler icin faturalandirmayi manuel yapiyoruz ve aktivasyonu fatura sonrasinda hesabiniza tanimliyoruz.',
    },
    {
        question: 'Kredilerim sonraki aya devreder mi?',
        answer: 'Paket yapisina gore kredi devri ayrintisini teklif sirasinda netlestiriyoruz. MVP doneminde bunu size ozel olarak tanimliyoruz.',
    },
    {
        question: 'Kurumsal ihtiyaclar icin ozel plan var mi?',
        answer: 'Evet. Aylik ihtiyaciniza gore size ozel kredi ve kullanim plani hazirlayabiliriz.',
    },
    {
        question: 'Ucretsiz deneme var mi?',
        answer: 'Kayit oldugunuzda verilen deneme kredileri ile aktif araclari test edebilirsiniz.',
    },
];

const CheckIcon = () => (
    <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export default function PricingClient() {
    const { t } = useI18n();
    const [isYearly, setIsYearly] = useState(false);
    const runtime = useRuntimeSnapshot();
    const runtimeGates = useMemo(() => getRuntimeFeatureGates(runtime), [runtime]);

    return (
        <div className={styles.pricingPage}>
            <div className={styles.backgroundGlow} />

            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span style={{ display: 'block' }}>{t('Emlak Fotoğraflarınızı')}</span>
                        <span style={{ display: 'block' }}>
                            <span className={styles.titleGradient}>{t('Akıllı Düzenlemelerle')}</span> {t('Güçlendirin')}
                        </span>
                    </h1>
                    <p className={styles.subtitle}>
                        {t('MVP doneminde aktivasyonlari manuel yapiyoruz. Paketinizi secelim, faturayi keselim, hesabinizi ayni gun acalim.')}
                    </p>
                </div>

                <div className={styles.toggleSection}>
                    <div className={styles.toggleContainer}>
                        <span className={`${styles.toggleLabel} ${!isYearly ? styles.toggleLabelActive : ''}`}>{t('Aylik Referans')}</span>
                        <button
                            className={`${styles.toggleSwitch} ${isYearly ? styles.toggleSwitchActive : ''}`}
                            onClick={() => setIsYearly(!isYearly)}
                            aria-label={t('Paket gosterimini degistir')}
                        >
                            <div className={`${styles.toggleHandle} ${isYearly ? styles.toggleHandleActive : ''}`} />
                        </button>
                        <span className={`${styles.toggleLabel} ${isYearly ? styles.toggleLabelActive : ''}`}>{t('Yillik Referans')}</span>
                    </div>
                    <div className={styles.annualDiscountBadge}>{t('MVP ozelinde ilk musterilere esnek teklif hazirliyoruz')}</div>
                </div>

                <div className={styles.grid}>
                    {PRICING_TIERS.map((tier) => {
                        const displayPrice = isYearly
                            ? Math.round(tier.discountedPrice * tier.yearlyPriceMultiplier)
                            : tier.discountedPrice;

                        return (
                            <div key={tier.id} className={`${styles.card} ${tier.popular ? styles.popularCard : ''}`}>
                                {tier.popular ? <div className={styles.popularBadge}>{t('En Cok Tercih Edilen')}</div> : null}

                                <div className={styles.cardHeader}>
                                    <h3 className={styles.tierName}>{t(tier.name)}</h3>
                                    <p className={styles.tierDesc}>{t(tier.description)}</p>
                                </div>

                                <div className={styles.priceContainer}>
                                    <span className={styles.currency}>₺</span>
                                    <span className={styles.price}>{displayPrice.toLocaleString('tr-TR')}</span>
                                    <span className={styles.period}>{isYearly ? t('/ay (yillik referans)') : t('/ay')}</span>
                                </div>

                                <div className={styles.discountWrapper}>
                                    <span className={styles.originalPrice}>₺{tier.originalPrice.toLocaleString('tr-TR')}</span>
                                    <span className={styles.discountLabel}>{t('Ilk gorusmede netlestirilir')}</span>
                                </div>

                                <Link href={getPricingCtaHref(runtime, tier.id)} className={`${styles.ctaButton} ${tier.popular ? styles.popularCta : styles.secondaryCta}`}>
                                    {runtimeGates.useIOSNativePurchases ? t('App Store ile devam et') : t(tier.cta)}
                                </Link>

                                <div className={styles.features}>
                                    <p className={styles.featuresTitle}>{t('Neler Dahil?')}</p>
                                    <ul className={styles.featureList}>
                                        {tier.features.map((feature, index) => {
                                            const isIlanGorseli = feature.includes('gorsele YZ calismasi');
                                            const perImagePrice = isIlanGorseli && tier.ilanGorseli
                                                ? (displayPrice / tier.ilanGorseli).toFixed(0)
                                                : null;
                                            return (
                                                <li key={index} className={styles.featureItem}>
                                                    <CheckIcon />
                                                    <span>
                                                        {t(feature)}
                                                        {perImagePrice != null ? (
                                                            <span className={styles.perImagePrice}>{t('Gorsel basina {amount} TL referansi').replace('{amount}', Number(perImagePrice).toLocaleString('tr-TR'))}</span>
                                                        ) : null}
                                                    </span>
                                                </li>
                                            );
                                        })}
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
                        <h2 className={styles.faqTitle}>{t('Sikca Sorulan Sorular')}</h2>
                        <p className={styles.faqSubtitle}>{t('MVP donemindeki paketleme ve aktivasyon surecini burada gorebilirsiniz.')}</p>
                    </div>

                    <div className={styles.faqGrid}>
                        {FAQ_ITEMS.map((item, index) => (
                            <div key={index} className={styles.faqCard}>
                                <h4 className={styles.faqQuestion}>{t(item.question)}</h4>
                                <p className={styles.faqAnswer}>{t(item.answer)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
