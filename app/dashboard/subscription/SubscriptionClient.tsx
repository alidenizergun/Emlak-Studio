'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoredUserId, isStoredAuthed } from '@/lib/client-auth';
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
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [accountId, setAccountId] = useState('');
    const [credits, setCredits] = useState<number>(0);
    const [usedCredits, setUsedCredits] = useState<number>(0);
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [resultNote, setResultNote] = useState<string>('');

    useEffect(() => {
        setMounted(true);
        if (typeof window === 'undefined') return;

        const authed = isStoredAuthed();
        if (!authed) {
            router.replace('/login');
            return;
        }

        const currentAccountId = getStoredUserId();
        if (!currentAccountId) {
            setError('Hesap bilgisi bulunamadi.');
            setLoading(false);
            return;
        }

        setAccountId(currentAccountId);

        fetch(`/api/subscription?email=${encodeURIComponent(currentAccountId)}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) {
                    setError(data.error || 'Paket bilgileri alinamadi.');
                    return;
                }
                setSubscription(data.subscription || null);
                setCredits(typeof data.credits === 'number' ? data.credits : 0);
                setUsedCredits(typeof data.usedCredits === 'number' ? data.usedCredits : 0);
            })
            .catch(() => setError('Paket bilgileri alinamadi.'))
            .finally(() => setLoading(false));
    }, [router]);

    const statusText = useMemo(() => {
        if (!subscription) return '-';
        return subscription.status === 'active' ? 'Aktif' : 'Iptal edildi';
    }, [subscription]);

    const handleCancelSubscription = async () => {
        if (!accountId || !subscription || subscription.status === 'cancelled') return;

        setProcessingCancel(true);
        setError('');
        setResultNote('');

        try {
            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: accountId, action: 'cancel' }),
            });
            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Iptal islemi basarisiz oldu.');
                return;
            }

            setSubscription(data.subscription || null);
            setCredits(typeof data.credits === 'number' ? data.credits : 0);
            setUsedCredits(typeof data.usedCredits === 'number' ? data.usedCredits : 0);
            window.localStorage.setItem('emlak_credits', String(typeof data.credits === 'number' ? data.credits : 0));
            window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                detail: { credits: typeof data.credits === 'number' ? data.credits : 0 }
            }));
            setResultNote('Paket iptal edildi. Yeni aktivasyon gerektiginde bizimle iletisime gecebilirsiniz.');
            setShowCancelModal(false);
        } catch {
            setError('Iptal islemi sirasinda bir hata olustu.');
        } finally {
            setProcessingCancel(false);
        }
    };

    if (!mounted) {
        return <div className={styles.pageContainer}>Yukleniyor...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <div className={styles.headerRow}>
                    <h1 className={styles.title}>Paket ve Aktivasyon</h1>
                </div>
                <p className={styles.subtitle}>MVP doneminde aktivasyonlari manuel olarak ilerletiyoruz. Mevcut kredi ve paket durumunuzu burada gorebilirsiniz.</p>

                {loading ? (
                    <div className={styles.card}>Yukleniyor...</div>
                ) : (
                    <>
                        {error ? <div className={styles.error}>{error}</div> : null}
                        {resultNote ? <div className={styles.success}>{resultNote}</div> : null}

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
                                <span className={styles.label}>Aylik Ucret Referansi</span>
                                <span className={styles.value}>₺{subscription?.monthlyPrice?.toLocaleString('tr-TR') ?? '-'}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Aylik Kredi</span>
                                <span className={styles.value}>{subscription?.monthlyCredits ?? 0}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Kullanilan Kredi</span>
                                <span className={styles.value}>{usedCredits}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Kalan Kredi</span>
                                <span className={styles.value}>{credits}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Baslangic</span>
                                <span className={styles.value}>{subscription?.startDate ? formatDate(subscription.startDate) : '-'}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>Sonraki Kontrol</span>
                                <span className={styles.value}>{subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate) : '-'}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <div className={styles.purchaseBlock}>
                                <p className={styles.purchaseText}>Yeni kredi ya da paket tanimi icin bize ulasin. Aktivasyonu manuel olarak ayni gun icinde tamamlayalim.</p>
                                <p className={`${styles.purchaseText} ${styles.purchaseTotalText}`}>Odeme entegrasyonu MVP sonrasinda acilacak.</p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <Link href="/pricing" className={styles.linkBtn}>Paketleri Gor</Link>
                            <Link href="/contact" className={styles.linkBtn}>Iletisime Gec</Link>
                            <button
                                type="button"
                                className={styles.linkBtn}
                                onClick={() => setShowCancelModal(true)}
                                disabled={processingCancel || !subscription || subscription.status === 'cancelled'}
                            >
                                {processingCancel ? 'Iptal Ediliyor...' : 'Paketi Iptal Et'}
                            </button>
                        </div>

                        {showCancelModal ? (
                            <div
                                className={styles.modalOverlay}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Paket iptali"
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
                                    <h3 className={styles.modalTitle}>Paketi kapatmadan once bizimle konusun</h3>
                                    <p className={styles.modalText}>
                                        Kredi ihtiyaciniza gore daha uygun bir manuel plan tanimlayabiliriz. Yine de devam etmek isterseniz mevcut paketi kapatabiliriz.
                                    </p>
                                    <div className={styles.modalActions}>
                                        <Link href="/contact" className={styles.modalSecondaryBtn}>
                                            Destek ile Goruş
                                        </Link>
                                        <Link href="/pricing" className={styles.modalSecondaryBtn}>
                                            Paketleri Incele
                                        </Link>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button
                                            type="button"
                                            className={styles.modalCloseBtn}
                                            onClick={() => setShowCancelModal(false)}
                                            disabled={processingCancel}
                                        >
                                            Vazgec
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.modalConfirmBtn}
                                            onClick={handleCancelSubscription}
                                            disabled={processingCancel}
                                        >
                                            {processingCancel ? 'Iptal Ediliyor...' : 'Paketi Iptal Et'}
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
