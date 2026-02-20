"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../../components/Pricing.module.css';
import {
    clearCheckoutSource,
    savePendingCheckoutSelection,
    setCheckoutSource,
    setPostAuthRedirect
} from '@/lib/checkout';

const PRICE_PER_CREDIT = 10;
const MIN_CREDITS = 1;
const MAX_CREDITS = 10000;

const FAQ_ITEMS = [
    {
        question: 'Pay as you go modeli nasıl çalışıyor?',
        answer: 'Abonelik yok. Sadece ihtiyaç duyduğunuz kadar kredi satın alırsınız ve kullandığınız kadar ödersiniz.'
    },
    {
        question: 'Kredi başına fiyat nedir?',
        answer: `Her kredi sabit ${PRICE_PER_CREDIT.toLocaleString('tr-TR')} TL olarak fiyatlanır.`
    },
    {
        question: 'Satın alınan krediler ne zaman hesaba geçer?',
        answer: 'Ödeme tamamlandıktan sonra krediler anında hesabınıza tanımlanır ve tüm araçlarda kullanılabilir.'
    },
    {
        question: 'Minimum ve maksimum alım limiti var mı?',
        answer: `Tek işlemde minimum ${MIN_CREDITS.toLocaleString('tr-TR')}, maksimum ${MAX_CREDITS.toLocaleString('tr-TR')} kredi alabilirsiniz.`
    }
];

const CheckIcon = () => (
    <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export default function PricingClient() {
    const [creditsInput, setCreditsInput] = useState('100');
    const [isAuthed] = useState(() => (
        typeof window !== 'undefined' && window.localStorage.getItem('emlak_authed') === '1'
    ));

    const credits = useMemo(() => {
        const parsed = Number(creditsInput || '0');
        if (!Number.isFinite(parsed)) return MIN_CREDITS;
        return Math.max(MIN_CREDITS, Math.min(MAX_CREDITS, Math.floor(parsed)));
    }, [creditsInput]);

    const totalPrice = useMemo(() => credits * PRICE_PER_CREDIT, [credits]);

    const handleCreditsChange = (value: string) => {
        const digits = value.replace(/\D/g, '');
        setCreditsInput(digits);
    };

    const handleCreditsBlur = () => {
        setCreditsInput(String(credits));
    };

    const handleSelect = () => {
        if (!isAuthed) {
            clearCheckoutSource();
            return;
        }
        savePendingCheckoutSelection({ planId: 'ofis', billing: 'monthly' });
        setCheckoutSource('pricing');
        setPostAuthRedirect('/checkout');
    };

    const checkoutHref = isAuthed
        ? `/checkout?mode=topup&plan=ofis&billing=monthly&credits=${credits}&total=${totalPrice}`
        : '/studio';

    return (
        <div className={styles.pricingPage}>
            <div className={styles.backgroundGlow} />

            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span style={{ display: 'block' }}>Tek Paket,</span>
                        <span style={{ display: 'block' }}>
                            <span className={styles.titleGradient}>Pay as you go</span> fiyatlama
                        </span>
                    </h1>
                    <p className={styles.subtitle}>
                        Abonelik yok. Kredi adedini seçin, sadece satın aldığınız kadar ödeyin.
                    </p>
                </div>

                <div className={styles.singlePricingWrap}>
                    <div className={`${styles.card} ${styles.singleCard}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.tierName}>Tek Paket</h3>
                            <p className={styles.tierDesc}>Tüm araçlara erişim, kredi bazlı kullanım, taahhütsüz ödeme.</p>
                        </div>

                        <div className={styles.paygoInputBlock}>
                            <label className={styles.paygoLabel} htmlFor="pricing-credits-input">Satın alınacak kredi</label>
                            <input
                                id="pricing-credits-input"
                                className={styles.paygoInput}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={creditsInput}
                                onChange={(e) => handleCreditsChange(e.target.value)}
                                onBlur={handleCreditsBlur}
                            />
                            <p className={styles.paygoHint}>
                                Kredi başına fiyat: ₺{PRICE_PER_CREDIT.toLocaleString('tr-TR')}
                            </p>
                        </div>

                        <div className={styles.paygoSummary}>
                            <span>Toplam</span>
                            <strong>₺{totalPrice.toLocaleString('tr-TR')}</strong>
                        </div>

                        <Link
                            href={checkoutHref}
                            onClick={handleSelect}
                            className={`${styles.ctaButton} ${styles.popularCta}`}
                        >
                            {isAuthed ? 'Ödemeye Geç' : 'Devam Et'}
                        </Link>

                        <div className={styles.features}>
                            <p className={styles.featuresTitle}>Neler Dahil?</p>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}><CheckIcon /><span>Tüm araçlarda kullanım</span></li>
                                <li className={styles.featureItem}><CheckIcon /><span>Kredi bittiğinde durur, sürpriz ücret yok</span></li>
                                <li className={styles.featureItem}><CheckIcon /><span>Satın alım sonrası anında kredi yükleme</span></li>
                                <li className={styles.featureItem}><CheckIcon /><span>Kurumsal kullanıma uygun</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <section className={styles.faqSection}>
                <div className="container">
                    <div className={styles.faqHeader}>
                        <h2 className={styles.faqTitle}>Sıkça Sorulan Sorular</h2>
                        <p className={styles.faqSubtitle}>Pay as you go modeline dair hızlı cevaplar.</p>
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
