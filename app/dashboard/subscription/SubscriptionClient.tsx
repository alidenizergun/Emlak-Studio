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
    const [purchaseAmount, setPurchaseAmount] = useState<number>(100);
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
        if (!phone) return;
        const amount = Math.floor(Number(purchaseAmount) || 0);
        if (amount <= 0) {
            setError('Lütfen 0’dan büyük bir kredi adedi girin.');
            return;
        }

        setProcessingPurchase(true);
        setError('');
        setPurchaseNote('');
        try {
            const response = await fetch('/api/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, amount }),
            });
            const data = await response.json();
            if (!data.success) {
                setError(data.error || 'Kredi satın alma işlemi başarısız oldu.');
                return;
            }

            const nextCredits = typeof data.credits === 'number' ? data.credits : credits + amount;
            setCredits(nextCredits);
            window.localStorage.setItem('emlak_credits', String(nextCredits));
            window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                detail: { credits: nextCredits }
            }));
            setPurchaseNote(`${amount} kredi hesabınıza eklendi.`);
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
                    <Link href="/pricing" className={styles.linkBtn}>Paketleri Gör</Link>
                </div>
                <p className={styles.subtitle}>Abonelik durumunuz, kredi kullanımı ve iptal işlemini bu ekrandan yönetebilirsiniz.</p>

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
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={purchaseAmount}
                                        onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                                        className={styles.purchaseInput}
                                    />
                                    <button
                                        type="button"
                                        className={styles.purchaseBtn}
                                        onClick={handlePurchaseCredits}
                                        disabled={processingPurchase}
                                    >
                                        {processingPurchase ? 'Ekleniyor...' : 'Kredi Satın Al'}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => setShowCancelModal(true)}
                                disabled={processingCancel || processingPurchase || !subscription || subscription.status === 'cancelled'}
                            >
                                {processingCancel ? 'İptal Ediliyor...' : 'Üyeliği İptal Et'}
                            </button>
                            <p className={styles.warning}>
                                Üyelik iptalinde kullanılan krediler düşülür, kullanılmamış kredi bakiyesi sıfırlanır.
                            </p>
                        </div>

                        {showCancelModal ? (
                            <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Abonelik iptali">
                                <div className={styles.modalCard}>
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
