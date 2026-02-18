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

export default function SettingsClient() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [phoneDisplay, setPhoneDisplay] = useState<string>('');
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
        setPhoneDisplay(phone ? maskPhone(phone) : '—');
        setMounted(true);
    }, []);

    const handleLogout = () => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem('emlak_authed');
        window.localStorage.removeItem('emlak_user_phone');
        window.localStorage.removeItem('emlak_credits');
        router.replace('/login');
    };

    if (!mounted) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.loading}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <section className={styles.topSection}>
                <div className={styles.topInner}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Ayarlar</h1>
                        <p className={styles.subtitle}>Hesap, abonelik ve destek ayarları.</p>
                    </header>

                    <div className={styles.accountCard} style={{ marginBottom: '1rem' }}>
                        <h2 className={styles.settingsSectionTitle}>Hesap</h2>
                        <div className={styles.settingsRow}>
                            <span className={styles.krediLabel}>Telefon</span>
                            <span className={styles.krediValue} style={{ fontSize: '1.1rem' }}>{phoneDisplay}</span>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                type="button"
                                className={styles.accountBtnDanger}
                                onClick={handleLogout}
                            >
                                Çıkış yap
                            </button>
                        </div>
                    </div>

                    <div className={styles.accountCard} style={{ marginBottom: '1rem' }}>
                        <h2 className={styles.settingsSectionTitle}>Abonelik / Ödeme</h2>
                        <p className={styles.accountNote} style={{ marginTop: 0 }}>
                            Aboneliğinizi iptal etmek veya planınızı değiştirmek için aşağıdaki bağlantıyı kullanın.
                        </p>
                        <Link href="/pricing" className={styles.accountBtn}>
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

                    <Link href="/studio" className={styles.accountBtnSecondary}>
                        Stüdyoya dön
                    </Link>
                </div>
            </section>
        </div>
    );
}
