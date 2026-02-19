'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Checkout.module.css';
import { readPendingCheckoutSelection, savePendingCheckoutSelection, type BillingCycle } from '@/lib/checkout';

type PlanId = 'danisman' | 'ofis' | 'kurumsal';

const PLAN_MAP: Record<PlanId, { name: string; monthlyPrice: number; monthlyCredits: number }> = {
    danisman: { name: 'Danışman', monthlyPrice: 1999, monthlyCredits: 200 },
    ofis: { name: 'Ofis', monthlyPrice: 2499, monthlyCredits: 400 },
    kurumsal: { name: 'Kurumsal', monthlyPrice: 4999, monthlyCredits: 1000 },
};

function parsePlanId(value: string | null): PlanId | null {
    if (value === 'danisman' || value === 'ofis' || value === 'kurumsal') return value;
    return null;
}

function parseBilling(value: string | null): BillingCycle {
    return value === 'yearly' ? 'yearly' : 'monthly';
}

function normalizeCardName(value: string): string {
    return value
        .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s]/g, '')
        .replace(/\s+/g, ' ')
        .trimStart()
        .slice(0, 40);
}

function normalizeCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function normalizeExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function normalizeCvv(value: string): string {
    return value.replace(/\D/g, '').slice(0, 3);
}

function isValidExpiry(value: string): boolean {
    if (!/^\d{2}\/\d{2}$/.test(value)) return false;
    const month = Number(value.slice(0, 2));
    return month >= 1 && month <= 12;
}

export default function CheckoutClient() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [planId, setPlanId] = useState<PlanId>('danisman');
    const [billing, setBilling] = useState<BillingCycle>('monthly');
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setMounted(true);
        if (typeof window === 'undefined') return;

        const authed = window.localStorage.getItem('emlak_authed') === '1';
        const params = new URLSearchParams(window.location.search);
        const queryPlan = parsePlanId(params.get('plan'));
        const queryBilling = parseBilling(params.get('billing'));
        const pending = readPendingCheckoutSelection();
        const pendingPlan = parsePlanId(pending?.planId ?? null);

        const effectivePlan: PlanId = queryPlan ?? pendingPlan ?? 'danisman';
        const effectiveBilling = (queryPlan ? queryBilling : pending?.billing) ?? 'monthly';

        savePendingCheckoutSelection({ planId: effectivePlan, billing: effectiveBilling });
        setPlanId(effectivePlan);
        setBilling(effectiveBilling);

        if (!authed) {
            router.replace(`/login?next=checkout&plan=${effectivePlan}&billing=${effectiveBilling}`);
        }
    }, [router]);

    const plan = PLAN_MAP[planId];

    const displayPrice = useMemo(() => {
        if (billing === 'yearly') {
            return Math.round(plan.monthlyPrice * 0.8 * 12);
        }
        return plan.monthlyPrice;
    }, [billing, plan.monthlyPrice]);

    const displayPeriod = billing === 'yearly' ? '/yıl' : '/ay';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};

        if (cardName.trim().length < 3) {
            nextErrors.cardName = 'Kart üzerindeki isim en az 3 karakter olmalı.';
        }
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            nextErrors.cardNumber = 'Kart numarası 16 haneli olmalı.';
        }
        if (!isValidExpiry(expiry)) {
            nextErrors.expiry = 'Son kullanma tarihi AA/YY formatında olmalı.';
        }
        if (cvv.length !== 3) {
            nextErrors.cvv = 'CVV 3 haneli olmalı.';
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setSubmitted(false);
            return;
        }

        setSubmitted(true);
    };

    if (!mounted) {
        return <div className={styles.pageContainer}>Yükleniyor...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <h1 className={styles.title}>Kredi Kartı Ödeme</h1>
                <p className={styles.subtitle}>Seçtiğiniz paket: <strong>{plan.name}</strong> ({billing === 'yearly' ? 'Yıllık' : 'Aylık'})</p>

                <div className={styles.layout}>
                    <form className={styles.card} onSubmit={handleSubmit}>
                        <h2 className={styles.sectionTitle}>Kart Bilgileri</h2>

                        <label className={styles.field}>
                            <span>Kart Üzerindeki İsim</span>
                            <input
                                value={cardName}
                                onChange={(e) => {
                                    setCardName(normalizeCardName(e.target.value));
                                    if (errors.cardName) setErrors((prev) => ({ ...prev, cardName: '' }));
                                }}
                                placeholder="Ad Soyad"
                                autoComplete="cc-name"
                                required
                            />
                            {errors.cardName ? <span className={styles.errorText}>{errors.cardName}</span> : null}
                        </label>

                        <label className={styles.field}>
                            <span>Kart Numarası</span>
                            <input
                                value={cardNumber}
                                onChange={(e) => {
                                    setCardNumber(normalizeCardNumber(e.target.value));
                                    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: '' }));
                                }}
                                placeholder="0000 0000 0000 0000"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                maxLength={19}
                                required
                            />
                            {errors.cardNumber ? <span className={styles.errorText}>{errors.cardNumber}</span> : null}
                        </label>

                        <div className={styles.row}>
                            <label className={styles.field}>
                                <span>Son Kullanma</span>
                                <input
                                    value={expiry}
                                    onChange={(e) => {
                                        setExpiry(normalizeExpiry(e.target.value));
                                        if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: '' }));
                                    }}
                                    placeholder="AA/YY"
                                    inputMode="numeric"
                                    autoComplete="cc-exp"
                                    maxLength={5}
                                    required
                                />
                                {errors.expiry ? <span className={styles.errorText}>{errors.expiry}</span> : null}
                            </label>
                            <label className={styles.field}>
                                <span>CVV</span>
                                <input
                                    value={cvv}
                                    onChange={(e) => {
                                        setCvv(normalizeCvv(e.target.value));
                                        if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: '' }));
                                    }}
                                    placeholder="123"
                                    inputMode="numeric"
                                    autoComplete="cc-csc"
                                    maxLength={3}
                                    required
                                />
                                {errors.cvv ? <span className={styles.errorText}>{errors.cvv}</span> : null}
                            </label>
                        </div>

                        <button className={styles.payBtn} type="submit">Ödemeyi Tamamla</button>
                        {submitted ? (
                            <p className={styles.success}>
                                Ödeme talebi alındı. Ödeme sağlayıcısı entegrasyonunda bu adım gerçek kart tahsiline yönlenecek.
                            </p>
                        ) : null}
                    </form>

                    <aside className={styles.summary}>
                        <h3 className={styles.sectionTitle}>Sipariş Özeti</h3>
                        <div className={styles.summaryRow}>
                            <span>Paket</span>
                            <strong>{plan.name}</strong>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Plan</span>
                            <strong>{billing === 'yearly' ? 'Yıllık' : 'Aylık'}</strong>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Aylık kredi</span>
                            <strong>{plan.monthlyCredits}</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Toplam</span>
                            <strong>₺{displayPrice.toLocaleString('tr-TR')}{displayPeriod}</strong>
                        </div>

                        <Link href="/pricing" className={styles.backLink}>Paketlere geri dön</Link>
                    </aside>
                </div>
            </div>
        </div>
    );
}
