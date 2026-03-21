'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoredUserId, isStoredAuthed } from '@/lib/client-auth';
import styles from '../Dashboard.module.css';

const MIN_TOPUP_CREDITS = 1;
const MAX_TOPUP_CREDITS = 10000;

interface SubscriptionInfo {
    planId: 'danisman' | 'ofis' | 'kurumsal';
    monthlyCredits: number;
    monthlyPrice: number;
    status: 'active' | 'cancelled';
}

function maskIdentity(raw: string): string {
    if (!raw) return '—';
    if (raw.includes('@')) {
        const [name, domain] = raw.split('@');
        const safeName = name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***`;
        return `${safeName}@${domain}`;
    }
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 5) return '*** ** **';
    const first = digits.slice(0, 3);
    const last = digits.slice(-2);
    return `${first} *** ** ${last}`;
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidFullName(value: string): boolean {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    const parts = cleaned.split(' ').filter(Boolean);
    if (parts.length < 2) return false;
    return parts.every((part) => /^[A-Za-zCÇĞIİÖŞÜcçğıiöşü'-]{2,}$/.test(part));
}

function isValidOfficeName(value: string): boolean {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    if (cleaned.length < 3) return false;
    if (!/[A-Za-zCÇĞIİÖŞÜcçğıiöşü]/.test(cleaned)) return false;
    if (!/^[A-Za-z0-9CÇĞIİÖŞÜcçğıiöşü\s&.'-]+$/.test(cleaned)) return false;
    if (/(.)\1{4,}/.test(cleaned)) return false;
    return true;
}

export default function SettingsClient() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [identityDisplay, setIdentityDisplay] = useState<string>('');
    const [fullName, setFullName] = useState('');
    const [officeName, setOfficeName] = useState('');
    const [email, setEmail] = useState('');
    const [saveNote, setSaveNote] = useState('');
    const [saveNoteType, setSaveNoteType] = useState<'success' | 'error'>('success');
    const [needsCorrectionAttempt, setNeedsCorrectionAttempt] = useState(false);
    const [bonusEligibilityLocked, setBonusEligibilityLocked] = useState(false);
    const [showProfileBonusHint, setShowProfileBonusHint] = useState(true);
    const [accountId, setAccountId] = useState('');
    const [purchaseAmountInput, setPurchaseAmountInput] = useState('100');
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [topupLoading, setTopupLoading] = useState(false);
    const [topupProcessing, setTopupProcessing] = useState(false);
    const redirectDone = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const authed = isStoredAuthed();
        if (!authed) {
            if (!redirectDone.current) {
                redirectDone.current = true;
                router.replace('/login');
            }
            return;
        }
        const identity = getStoredUserId();
        const storedFullName = window.localStorage.getItem('emlak_profile_full_name') || '';
        const storedOfficeName = window.localStorage.getItem('emlak_profile_office_name') || '';
        const storedEmail = window.localStorage.getItem('emlak_profile_email') || '';
        const bonusKey = identity ? `emlak_profile_bonus_awarded_${identity}` : '';
        const bonusAlreadyAwarded = identity ? window.localStorage.getItem(bonusKey) === '1' : false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIdentityDisplay(identity ? maskIdentity(identity) : '—');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAccountId(identity || '');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFullName(storedFullName);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOfficeName(storedOfficeName);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(storedEmail);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowProfileBonusHint(!bonusAlreadyAwarded);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, [router]);

    useEffect(() => {
        if (!accountId) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTopupLoading(true);
        fetch(`/api/subscription?email=${encodeURIComponent(accountId)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.subscription) {
                    setSubscription(data.subscription as SubscriptionInfo);
                }
            })
            .catch(() => {})
            .finally(() => setTopupLoading(false));
    }, [accountId]);

    const handleSave = async () => {
        if (typeof window === 'undefined') return;
        const normalizedName = fullName.trim().replace(/\s+/g, ' ');
        const normalizedOffice = officeName.trim().replace(/\s+/g, ' ');
        const normalizedEmail = email.trim().toLowerCase();

        const isNameValid = isValidFullName(normalizedName);
        const isOfficeValid = isValidOfficeName(normalizedOffice);
        const isEmailValid = isValidEmail(normalizedEmail);

        if (isNameValid) {
            window.localStorage.setItem('emlak_profile_full_name', normalizedName);
        }
        if (isOfficeValid) {
            window.localStorage.setItem('emlak_profile_office_name', normalizedOffice);
        }
        if (isEmailValid) {
            window.localStorage.setItem('emlak_profile_email', normalizedEmail);
        }

        const invalidFields: string[] = [];
        if (!isNameValid) invalidFields.push('Ad Soyad');
        if (!isOfficeValid) invalidFields.push('Emlak Ofisi');
        if (!isEmailValid) invalidFields.push('E-posta');

        if (invalidFields.length > 0) {
            const invalidText = invalidFields.join(', ');
            setSaveNoteType('error');

            if (!needsCorrectionAttempt && !bonusEligibilityLocked) {
                setNeedsCorrectionAttempt(true);
                setSaveNote(
                    `Şu alanları düzeltin: ${invalidText}. Doğru alanlar kaydedildi, hediye kredi için 1 düzeltme hakkınız var.`
                );
                return;
            }

            if (needsCorrectionAttempt && !bonusEligibilityLocked) {
                setNeedsCorrectionAttempt(false);
                setBonusEligibilityLocked(true);
                setSaveNote(
                    `Şu alanlar hâlâ hatalı: ${invalidText}. Düzeltme hakkınız kullanıldı; bilgiler kaydedilebilir ancak hediye kredi verilemez.`
                );
                return;
            }

            setSaveNote(`Şu alanları geçerli girin: ${invalidText}.`);
            return;
        }

        window.localStorage.setItem('emlak_profile_full_name', normalizedName);
        window.localStorage.setItem('emlak_profile_office_name', normalizedOffice);
        window.localStorage.setItem('emlak_profile_email', normalizedEmail);

        const identity = getStoredUserId();
        const bonusKey = identity ? `emlak_profile_bonus_awarded_${identity}` : '';
        const bonusAlreadyAwarded = identity ? window.localStorage.getItem(bonusKey) === '1' : true;
        const bonusBlocked = bonusEligibilityLocked;

        setNeedsCorrectionAttempt(false);

        if (!identity || bonusAlreadyAwarded || bonusBlocked) {
            setSaveNoteType('success');
            setSaveNote('Bilgiler kaydedildi.');
            return;
        }

        try {
            const response = await fetch('/api/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identity, amount: 5 })
            });
            const data = await response.json();
            if (!data.success || typeof data.credits !== 'number') {
                setSaveNoteType('error');
                setSaveNote('Bilgiler kaydedildi. Hediye kredi eklenemedi.');
                return;
            }

            window.localStorage.setItem(bonusKey, '1');
            window.localStorage.setItem('emlak_credits', String(data.credits));
            window.dispatchEvent(new CustomEvent('emlak:credits-updated', { detail: { credits: data.credits } }));
            setShowProfileBonusHint(false);
            setSaveNoteType('success');
            setSaveNote('Bilgiler kaydedildi. 5 kredi hesabınıza eklendi.');
        } catch {
            setSaveNoteType('error');
            setSaveNote('Bilgiler kaydedildi. Hediye kredi eklenemedi.');
        }
    };

    const purchaseAmount = Math.floor(Number(purchaseAmountInput) || 0);
    const perCreditPrice = subscription
        ? subscription.monthlyPrice / Math.max(subscription.monthlyCredits, 1)
        : 0;
    const totalTopupPrice = Math.round(perCreditPrice * purchaseAmount);

    const handleTopupPurchase = () => {
        setTopupProcessing(true);
        router.push('/contact');
    };

    const normalizeTopupAmount = () => {
        const raw = purchaseAmountInput.replace(/\D/g, '');
        if (!raw) {
            setPurchaseAmountInput(String(MIN_TOPUP_CREDITS));
            return;
        }
        const numericValue = Number(raw);
        if (numericValue < MIN_TOPUP_CREDITS) {
            setPurchaseAmountInput(String(MIN_TOPUP_CREDITS));
            return;
        }
        if (numericValue > MAX_TOPUP_CREDITS) {
            setPurchaseAmountInput(String(MAX_TOPUP_CREDITS));
            return;
        }
        setPurchaseAmountInput(String(numericValue));
    };

    if (!mounted) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.loading}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className={`${styles.pageContainer} ${styles.settingsPageContainer}`}>
            <section className={`${styles.topSection} ${styles.settingsTopSection}`}>
                <div className={styles.topInner}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Ayarlar</h1>
                        <p className={styles.subtitle}>Hesap, abonelik ve destek ayarları.</p>
                    </header>

                    <div className={styles.accountCard} style={{ marginBottom: '1rem' }}>
                        <h2 className={styles.settingsSectionTitle}>Hesap</h2>
                        <div className={styles.settingsForm}>
                            <label className={styles.settingsField}>
                                <span className={styles.krediLabel}>Ad Soyad</span>
                                <input
                                    className={styles.settingsInput}
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ad soyad girin"
                                />
                            </label>
                            <label className={styles.settingsField}>
                                <span className={styles.krediLabel}>Emlak Ofisi</span>
                                <input
                                    className={styles.settingsInput}
                                    type="text"
                                    value={officeName}
                                    onChange={(e) => setOfficeName(e.target.value)}
                                    placeholder="Ofis adını girin"
                                />
                            </label>
                            <label className={styles.settingsField}>
                                <span className={styles.krediLabel}>E-posta</span>
                                <input
                                    className={styles.settingsInput}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@eposta.com"
                                />
                            </label>
                            <label className={styles.settingsField}>
                                <span className={styles.krediLabel}>Hesap (değiştirilemez)</span>
                                <input
                                    className={styles.settingsInputReadOnly}
                                    type="text"
                                    value={identityDisplay}
                                    readOnly
                                />
                            </label>
                        </div>
                        <div className={styles.accountActions} style={{ marginTop: '0.9rem' }}>
                            <button type="button" className={`${styles.accountBtn} ${styles.settingsActionBtn}`} onClick={handleSave}>
                                Kaydet
                            </button>
                        </div>
                        {showProfileBonusHint ? <p className={styles.accountHint}>Bilgilerinizi girin, 5 kredi hediye kazanın. 🎁</p> : null}
                        {saveNote ? <p className={`${styles.accountNote} ${saveNoteType === 'error' ? styles.accountNoteError : ''}`}>{saveNote}</p> : null}
                    </div>

                    <div className={styles.accountCard} style={{ marginBottom: '1rem' }}>
                        <h2 className={styles.settingsSectionTitle}>Abonelik / Ödeme</h2>
                        <p className={styles.accountNote} style={{ marginTop: 0 }}>
                            Paket aktivasyonu ve faturalandirma su anda manuel ilerliyor. Size uygun paketi birlikte belirleyelim.
                        </p>
                        <Link href="/dashboard/subscription" className={`${styles.accountBtn} ${styles.settingsActionBtn}`} style={{ marginTop: '1.25rem' }}>
                            Paketleri goruntule / aktivasyon talep et
                        </Link>

                        <div className={styles.topupPanel}>
                            <h3 className={styles.topupTitle}>Ek kredi satın al</h3>
                            <p className={styles.topupText}>
                                Ihtiyaciniza gore kredi adedini girin, ekibimiz hesabinizi manuel olarak aktive etsin.
                            </p>
                            <div className={styles.topupRow}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={purchaseAmountInput}
                                    onChange={(e) => {
                                        const digitsOnly = e.target.value.replace(/\D/g, '');
                                        setPurchaseAmountInput(digitsOnly);
                                    }}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={normalizeTopupAmount}
                                    className={styles.topupInput}
                                />
                                <button
                                    type="button"
                                    className={styles.accountBtn}
                                    onClick={handleTopupPurchase}
                                    disabled={topupLoading || topupProcessing || !subscription || subscription.status === 'cancelled'}
                                >
                                    {topupProcessing ? 'Yonlendiriliyor...' : 'Iletisime Gec'}
                                </button>
                            </div>
                            <p className={styles.topupText}>Tahmini paket referansi: ₺{totalTopupPrice.toLocaleString('tr-TR')}</p>
                            <p className={styles.topupNote}>
                                Ek kredi satın alımı için minimum {MIN_TOPUP_CREDITS}, maksimum {MAX_TOPUP_CREDITS} kredi girebilirsiniz.
                            </p>
                        </div>
                    </div>

                    <div className={styles.accountCard} style={{ marginBottom: '1rem' }}>
                        <h2 className={styles.settingsSectionTitle}>Destek</h2>
                        <div className={styles.accountActions} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                            <Link href="/help" className={styles.accountBtnSecondary}>
                                Yardım
                            </Link>
                            <Link href="/contact" className={styles.accountBtnSecondary}>
                                İletişim
                            </Link>
                            <Link href="/dashboard/admin" className={styles.accountBtnSecondary}>
                                Admin Paneli
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
