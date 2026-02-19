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
                                onChange={(e) => setCardName(e.target.value)}
                                placeholder="Ad Soyad"
                                required
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Kart Numarası</span>
                            <input
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="0000 0000 0000 0000"
                                required
                            />
                        </label>

                        <div className={styles.row}>
                            <label className={styles.field}>
                                <span>Son Kullanma</span>
                                <input
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="AA/YY"
                                    required
                                />
                            </label>
                            <label className={styles.field}>
                                <span>CVV</span>
                                <input
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    placeholder="123"
                                    required
                                />
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
