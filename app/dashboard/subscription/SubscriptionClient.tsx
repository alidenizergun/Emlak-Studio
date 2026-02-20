'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Subscription.module.css';

interface SubscriptionInfo {
    planId: 'danisman' | 'ofis' | 'kurumsal';
    planName: string;
    monthlyCredits: number;
    monthlyPrice: number;
    status: 'active' | 'cancelled';
    startDate: string;
    nextBillingDate: string;
    cancelledAt?: string;
    lastUsedCredits?: number;
}

const MIN_TOPUP_CREDITS = 10;
const MAX_TOPUP_CREDITS = 10000;

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('tr-TR');
    } catch {
        return '-';
    }
}

export default function SubscriptionClient() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processingCancel, setProcessingCancel] = useState(false);
    const [processingPurchase, setProcessingPurchase] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [purchaseAmountInput, setPurchaseAmountInput] = useState<string>('100');
    const [phone, setPhone] = useState('');
    const [credits, setCredits] = useState<number>(0);
    const [usedCredits, setUsedCredits] = useState<number>(0);
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [resultNote, setResultNote] = useState<string>('');
    const [purchaseNote, setPurchaseNote] = useState<string>('');

    useEffect(() => {
        setMounted(true);
        if (typeof window === 'undefined') return;

        const authed = window.localStorage.getItem('emlak_authed') === '1';
        if (!authed) {
            router.replace('/login');
            return;
        }

        const currentPhone = window.localStorage.getItem('emlak_user_phone') || '';
        if (!currentPhone) {
            setError('Telefon bilgisi bulunamadı.');
            setLoading(false);
            return;
        }

        setPhone(currentPhone);

        fetch(`/api/subscription?phone=${encodeURIComponent(currentPhone)}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) {
                    setError(data.error || 'Abonelik bilgileri alınamadı.');
                    return;
                }
                setSubscription(data.subscription || null);
                setCredits(typeof data.credits === 'number' ? data.credits : 0);
                setUsedCredits(typeof data.usedCredits === 'number' ? data.usedCredits : 0);
            })
            .catch(() => setError('Abonelik bilgileri alınamadı.'))
            .finally(() => setLoading(false));
    }, [router]);

    const statusText = useMemo(() => {
        if (!subscription) return '-';
        return subscription.status === 'active' ? 'Aktif' : 'İptal edildi';
    }, [subscription]);

    const purchaseQuote = useMemo(() => {
        const amount = Math.floor(Number(purchaseAmountInput) || 0);
        if (!subscription || amount <= 0) return { amount: 0, total: 0, perCreditPrice: 0 };
        const perCreditPrice = subscription.monthlyPrice / Math.max(subscription.monthlyCredits, 1);
        const total = Math.round(perCreditPrice * amount);
        return { amount, total, perCreditPrice };
    }, [purchaseAmountInput, subscription]);

    const handleCancelSubscription = async () => {
        if (!phone || !subscription || subscription.status === 'cancelled') return;

        setProcessingCancel(true);
        setError('');
        setResultNote('');

        try {
            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, action: 'cancel' }),
            });
            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'İptal işlemi başarısız oldu.');
                return;
            }

            setSubscription(data.subscription || null);
            setCredits(typeof data.credits === 'number' ? data.credits : 0);
            setUsedCredits(typeof data.usedCredits === 'number' ? data.usedCredits : 0);
            window.localStorage.setItem('emlak_credits', String(typeof data.credits === 'number' ? data.credits : 0));
            window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                detail: { credits: typeof data.credits === 'number' ? data.credits : 0 }
            }));
            setResultNote(
                `Abonelik iptal edildi. Kullanılan kredi: ${typeof data.usedCredits === 'number' ? data.usedCredits : 0}, ` +
                `kaldırılan bakiye: ${typeof data.removedCredits === 'number' ? data.removedCredits : 0}.`
            );
            setShowCancelModal(false);
        } catch {
            setError('İptal işlemi sırasında bir hata oluştu.');
        } finally {
            setProcessingCancel(false);
        }
    };

    const handlePurchaseCredits = async () => {
        if (!phone || !subscription) return;
        const amount = purchaseQuote.amount;
        if (amount < MIN_TOPUP_CREDITS || amount > MAX_TOPUP_CREDITS) return;

        setProcessingPurchase(true);
        setError('');
        setPurchaseNote('');
        try {
            const params = new URLSearchParams({
                mode: 'topup',
                plan: subscription.planId,
                billing: 'monthly',
                credits: String(amount),
                total: String(purchaseQuote.total),
            });
            router.push(`/checkout?${params.toString()}`);
        } catch {
            setError('Kredi satın alma sırasında bir hata oluştu.');
        } finally {
            setProcessingPurchase(false);
        }
    };

    if (!mounted) {
        return <div className={styles.pageContainer}>Yükleniyor...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <div className={styles.headerRow}>
                    <h1 className={styles.title}>Paketleri Görüntüle / Aboneliği Yönet</h1>
                </div>
                <p className={styles.subtitle}>Abonelik durumunuz, kredi kullanımı ve ek kredi satın alma işlemlerinizi bu ekrandan yönetebilirsiniz.</p>

                {loading ? (
                    <div className={styles.card}>Yükleniyor...</div>
                ) : (
                    <>
                        {error ? <div className={styles.error}>{error}</div> : null}
                        {resultNote ? <div className={styles.success}>{resultNote}</div> : null}
                        {purchaseNote ? <div className={styles.success}>{purchaseNote}</div> : null}

                        <div className={styles.card}>
                            <div className={styles.row}>
                                <span className={styles.label}>Paket</span>
                                <span className={styles.value}>{subscription?.planName ?? '-'}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Durum</span>
                                <span className={styles.value}>{statusText}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Aylık Ücret</span>
                                <span className={styles.value}>₺{subscription?.monthlyPrice?.toLocaleString('tr-TR') ?? '-'}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Aylık Kredi</span>
                                <span className={styles.value}>{subscription?.monthlyCredits ?? 0}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Kullanılan Kredi</span>
                                <span className={styles.value}>{usedCredits}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Kalan Kredi</span>
                                <span className={styles.value}>{credits}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Başlangıç</span>
                                <span className={styles.value}>{subscription?.startDate ? formatDate(subscription.startDate) : '-'}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Sonraki Fatura</span>
                                <span className={styles.value}>{subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate) : '-'}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <div className={styles.purchaseBlock}>
                                <h3 className={styles.purchaseTitle}>Ek kredi satın al</h3>
                                <p className={styles.purchaseText}>İhtiyacınıza göre kredi adedini girin ve anında hesabınıza ekleyin.</p>
                                <div className={styles.purchaseRow}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={purchaseAmountInput}
                                        onChange={(e) => {
                                            const digitsOnly = e.target.value.replace(/\D/g, '');
                                            if (!digitsOnly) {
                                                setPurchaseAmountInput('');
                                                return;
                                            }
                                            const numericValue = Number(digitsOnly);
                                            const boundedValue = Math.max(
                                                MIN_TOPUP_CREDITS,
                                                Math.min(numericValue, MAX_TOPUP_CREDITS)
                                            );
                                            setPurchaseAmountInput(String(boundedValue));
                                        }}
                                        className={styles.purchaseInput}
                                        placeholder="100"
                                        aria-label="Satın alınacak kredi adedi"
                                    />
                                    <button
                                        type="button"
                                        className={styles.purchaseBtn}
                                        onClick={handlePurchaseCredits}
                                        disabled={processingPurchase}
                                    >
                                        {processingPurchase ? 'Yönlendiriliyor...' : 'Kredi Satın Al'}
                                    </button>
                                </div>
                                <p className={styles.purchaseText}>
                                    Toplam ödeme: ₺{purchaseQuote.total.toLocaleString('tr-TR')}
                                </p>
                                <p className={styles.warning}>
                                    Tutar, paketinize özel kredi birim fiyatına göre hesaplanır:
                                    ₺{Math.round(purchaseQuote.perCreditPrice ?? 0).toLocaleString('tr-TR')} x {purchaseQuote.amount} kredi.
                                </p>
                                <p className={styles.warning}>
                                    Ek kredi satın alımı için minimum {MIN_TOPUP_CREDITS}, maksimum {MAX_TOPUP_CREDITS} kredi girebilirsiniz.
                                </p>
                            </div>

                        </div>
                        <div className={styles.headerActions}>
                            <Link href="/pricing" className={styles.linkBtn}>Paketleri Gör</Link>
                            <button
                                type="button"
                                className={styles.linkBtn}
                                onClick={() => setShowCancelModal(true)}
                                disabled={processingCancel || processingPurchase || !subscription || subscription.status === 'cancelled'}
                            >
                                {processingCancel ? 'İptal Ediliyor...' : 'Üyeliği İptal Et'}
                            </button>
                        </div>

                        {showCancelModal ? (
                            <div
                                className={styles.modalOverlay}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Abonelik iptali"
                                onClick={() => setShowCancelModal(false)}
                            >
                                <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        className={styles.modalXBtn}
                                        aria-label="Popup kapat"
                                        onClick={() => setShowCancelModal(false)}
                                        disabled={processingCancel}
                                    >
                                        ×
                                    </button>
                                    <h3 className={styles.modalTitle}>Gitmeden önce birlikte çözelim</h3>
                                    <p className={styles.modalText}>
                                        Aboneliğinizi iptal etmek yerine maliyeti düşürmek ve kredinizi daha verimli kullanmak için şu seçenekleri deneyebilirsiniz:
                                    </p>
                                    <div className={styles.modalActions}>
                                        <Link href="/pricing" className={styles.modalSecondaryBtn}>
                                            Daha Uygun Pakete Geç
                                        </Link>
                                        <Link href="/help" className={styles.modalSecondaryBtn}>
                                            Kullanım Rehberini Aç
                                        </Link>
                                        <Link href="/contact" className={styles.modalSecondaryBtn}>
                                            Destek ile Görüş
                                        </Link>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button
                                            type="button"
                                            className={styles.modalCloseBtn}
                                            onClick={() => setShowCancelModal(false)}
                                            disabled={processingCancel}
                                        >
                                            İptalden Vazgeç
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.modalDangerBtn}
                                            onClick={handleCancelSubscription}
                                            disabled={processingCancel}
                                        >
                                            {processingCancel ? 'İptal Ediliyor...' : 'Yine de İptal Et'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
