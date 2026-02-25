'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Checkout.module.css';
import {
    readCheckoutSource,
    readPendingCheckoutSelection,
    savePendingCheckoutSelection,
    type BillingCycle
} from '@/lib/checkout';
import {
    type PlanId,
    parsePlanId,
    parseBillingCycle,
    isBillingCycle,
    getPlanDefinition
} from '@/lib/pricing-policy';

type CheckoutMode = 'subscription' | 'topup';

function parseCheckoutMode(value: string | null): CheckoutMode {
    return value === 'topup' ? 'topup' : 'subscription';
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
    const [mode, setMode] = useState<CheckoutMode>('subscription');
    const [phone, setPhone] = useState('');
    const [topupCredits, setTopupCredits] = useState(0);
    const [serverTotal, setServerTotal] = useState(0);
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setMounted(true);
        if (typeof window === 'undefined') return;

        const authed = window.localStorage.getItem('emlak_authed') === '1';
        const currentPhone = window.localStorage.getItem('emlak_user_phone') || '';
        setPhone(currentPhone);
        const params = new URLSearchParams(window.location.search);
        const queryMode = parseCheckoutMode(params.get('mode'));
        const rawPlan = params.get('plan');
        const rawBilling = params.get('billing');
        const queryPlan = parsePlanId(rawPlan);
        const queryBilling = parseBillingCycle(rawBilling);
        const hasValidPricingSelection = queryPlan !== null && isBillingCycle(rawBilling);
        const queryTopupCredits = Math.max(0, Math.floor(Number(params.get('credits') || 0)));
        const pending = readPendingCheckoutSelection();
        const source = readCheckoutSource();
        const pendingPlan = parsePlanId(pending?.planId ?? null);

        if (!authed) {
            router.replace('/studio');
            return;
        }

        if (queryMode !== 'topup' && (!hasValidPricingSelection || source !== 'pricing')) {
            router.replace('/studio');
            return;
        }

        const effectivePlan: PlanId = queryPlan ?? pendingPlan ?? 'danisman';
        const effectiveBilling = (queryPlan ? queryBilling : pending?.billing) ?? 'monthly';

        savePendingCheckoutSelection({ planId: effectivePlan, billing: effectiveBilling });
        setPlanId(effectivePlan);
        setBilling(effectiveBilling);
        setMode(queryMode);
        setTopupCredits(queryTopupCredits);
        setServerTotal(0);
    }, [router]);

    const plan = getPlanDefinition(planId);

    const displayPrice = useMemo(() => {
        if (mode === 'topup') return serverTotal;
        if (billing === 'yearly') {
            return Math.round(plan.monthlyPrice * 0.8 * 12);
        }
        return plan.monthlyPrice;
    }, [billing, mode, plan.monthlyPrice, serverTotal]);

    const displayPeriod = mode === 'topup' ? '' : billing === 'yearly' ? '/yıl' : '/ay';
    const isFormReady =
        cardName.trim().length >= 3 &&
        cardNumber.replace(/\s/g, '').length === 16 &&
        isValidExpiry(expiry) &&
        cvv.length === 3;

    const handleSubmit = async (e: React.FormEvent) => {
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
        if (mode === 'topup' && topupCredits <= 0) {
            setErrors({ form: 'Ek kredi bilgisi eksik. Lütfen abonelik ekranından tekrar deneyin.' });
            setSubmitted(false);
            return;
        }

        setIsSubmitting(true);
        try {
            const checkoutIdempotencyKey = crypto.randomUUID();
            const checkoutResponse = await fetch('/api/payments/mock/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': checkoutIdempotencyKey,
                },
                body: JSON.stringify({
                    mode,
                    planId,
                    billing,
                    credits: mode === 'topup' ? topupCredits : undefined,
                    phone,
                }),
            });
            const checkoutData = await checkoutResponse.json();
            if (!checkoutResponse.ok || !checkoutData.success || !checkoutData.checkoutId) {
                setErrors({ form: checkoutData.error || 'Ödeme başlatılamadı.' });
                setSubmitted(false);
                return;
            }

            setServerTotal(Number(checkoutData.total || 0));

            const confirmIdempotencyKey = crypto.randomUUID();
            const confirmResponse = await fetch('/api/payments/mock/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-idempotency-key': confirmIdempotencyKey,
                },
                body: JSON.stringify({ checkoutId: checkoutData.checkoutId, phone }),
            });
            const confirmData = await confirmResponse.json();
            if (!confirmResponse.ok || !confirmData.success || typeof confirmData.creditsBalance !== 'number') {
                setErrors({ form: confirmData.error || 'Ödeme onayı başarısız oldu.' });
                setSubmitted(false);
                return;
            }

            window.localStorage.setItem('emlak_credits', String(confirmData.creditsBalance));
            window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                detail: { credits: confirmData.creditsBalance }
            }));
            setSubmitted(true);
        } catch {
            setErrors({ form: 'Ödeme işlemi sırasında bir hata oluştu.' });
            setSubmitted(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) {
        return <div className={styles.pageContainer}>Yükleniyor...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <div className={styles.hero}>
                    <div>
                        <h1 className={styles.title}>{mode === 'topup' ? 'Ek Kredi Ödeme' : 'Kredi Kartı Ödeme'}</h1>
                        <p className={styles.subtitle}>
                            {mode === 'topup'
                                ? `Bulunduğunuz ${plan.name} paketine göre ${topupCredits} ek kredi satın alıyorsunuz.`
                                : 'Ödemeyi hızlıca tamamlayın. Kart bilgileriniz güvenli ve şifreli biçimde işlenir.'}
                        </p>
                    </div>
                </div>

                <div className={styles.layout}>
                    <form className={styles.card} onSubmit={handleSubmit}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Kart Bilgileri</h2>
                            <span className={styles.secureNote}>Güvenli Ödeme</span>
                        </div>

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

                        <button className={styles.payBtn} type="submit" disabled={!isFormReady || isSubmitting}>
                            {isSubmitting
                                ? 'Ödeme İşleniyor...'
                                : 'Ödemeyi Tamamla'}
                        </button>
                        {errors.form ? <p className={styles.errorText}>{errors.form}</p> : null}
                        {submitted ? (
                            <p className={styles.success}>
                                {mode === 'topup'
                                    ? `${topupCredits} kredi hesabınıza eklendi.`
                                    : 'Paket ödemeniz alındı ve krediniz hesabınıza tanımlandı.'}
                            </p>
                        ) : null}
                    </form>

                    <aside className={styles.summary}>
                        <h3 className={styles.sectionTitle}>Sipariş Özeti</h3>
                        <div className={styles.summaryRow}>
                            <span>{mode === 'topup' ? 'İşlem' : 'Paket'}</span>
                            <strong>{mode === 'topup' ? 'Ek Kredi Satın Alma' : plan.name}</strong>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Plan</span>
                            <strong>{billing === 'yearly' ? 'Yıllık' : 'Aylık'}</strong>
                        </div>
                        {mode === 'topup' ? (
                            <>
                                <div className={styles.summaryRow}>
                                    <span>Satın Alınacak Kredi</span>
                                    <strong>{topupCredits}</strong>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Paket Bazlı Tutar</span>
                                    <strong>₺{displayPrice.toLocaleString('tr-TR')}</strong>
                                </div>
                            </>
                        ) : (
                            <div className={styles.summaryRow}>
                                <span>Aylık kredi</span>
                                <strong>{plan.monthlyCredits}</strong>
                            </div>
                        )}
                        <div className={styles.totalRow}>
                            <span>Toplam</span>
                            <strong>₺{displayPrice.toLocaleString('tr-TR')}{displayPeriod}</strong>
                        </div>
                        <div className={styles.trustList}>
                            <span>SSL ile şifreli ödeme</span>
                            <span>3D Secure uyumlu işlem</span>
                            <span>Anında kredi tanımlama</span>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
