'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../Dashboard.module.css';

function maskPhone(raw: string): string {
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
    const [phoneDisplay, setPhoneDisplay] = useState<string>('');
    const [fullName, setFullName] = useState('');
    const [officeName, setOfficeName] = useState('');
    const [email, setEmail] = useState('');
    const [saveNote, setSaveNote] = useState('');
    const [saveNoteType, setSaveNoteType] = useState<'success' | 'error'>('success');
    const [needsCorrectionAttempt, setNeedsCorrectionAttempt] = useState(false);
    const [bonusEligibilityLocked, setBonusEligibilityLocked] = useState(false);
    const redirectDone = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const authed = window.localStorage.getItem('emlak_authed') === '1';
        if (!authed) {
            if (!redirectDone.current) {
                redirectDone.current = true;
                router.replace('/login');
            }
            return;
        }
        const phone = window.localStorage.getItem('emlak_user_phone');
        const storedFullName = window.localStorage.getItem('emlak_profile_full_name') || '';
        const storedOfficeName = window.localStorage.getItem('emlak_profile_office_name') || '';
        const storedEmail = window.localStorage.getItem('emlak_profile_email') || '';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPhoneDisplay(phone ? maskPhone(phone) : '—');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFullName(storedFullName);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOfficeName(storedOfficeName);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(storedEmail);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, [router]);

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

        const phone = (window.localStorage.getItem('emlak_user_phone') || '').replace(/\D/g, '');
        const bonusKey = `emlak_profile_bonus_awarded_${phone}`;
        const bonusAlreadyAwarded = phone ? window.localStorage.getItem(bonusKey) === '1' : true;
        const bonusBlocked = bonusEligibilityLocked;

        setNeedsCorrectionAttempt(false);

        if (!phone || bonusAlreadyAwarded || bonusBlocked) {
            setSaveNoteType('success');
            setSaveNote('Bilgiler kaydedildi.');
            return;
        }

        try {
            const response = await fetch('/api/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, amount: 5 })
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
            setSaveNoteType('success');
            setSaveNote('Bilgiler kaydedildi. 5 kredi hesabınıza eklendi.');
        } catch {
            setSaveNoteType('error');
            setSaveNote('Bilgiler kaydedildi. Hediye kredi eklenemedi.');
        }
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
                                <span className={styles.krediLabel}>Telefon (değiştirilemez)</span>
                                <input
                                    className={styles.settingsInputReadOnly}
                                    type="text"
                                    value={phoneDisplay}
                                    readOnly
                                />
                            </label>
                        </div>
                        <div className={styles.accountActions} style={{ marginTop: '0.9rem' }}>
                            <button type="button" className={styles.accountBtn} onClick={handleSave}>
                                Kaydet
                            </button>
                        </div>
                        <p className={styles.accountHint}>Bilgilerinizi girin, 5 kredi hediye kazanın.</p>
                        {saveNote ? <p className={`${styles.accountNote} ${saveNoteType === 'error' ? styles.accountNoteError : ''}`}>{saveNote}</p> : null}
                    </div>

                    <div className={styles.accountCard} style={{ marginBottom: '1rem' }}>
                        <h2 className={styles.settingsSectionTitle}>Abonelik / Ödeme</h2>
                        <p className={styles.accountNote} style={{ marginTop: 0 }}>
                            Aboneliğinizi iptal etmek veya planınızı değiştirmek için aşağıdaki bağlantıyı kullanın.
                        </p>
                        <Link href="/dashboard/subscription" className={styles.accountBtn} style={{ marginTop: '1.25rem' }}>
                            Paketleri görüntüle / Aboneliği yönet
                        </Link>
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
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
