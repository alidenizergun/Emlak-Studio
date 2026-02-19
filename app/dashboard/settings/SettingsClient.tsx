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
    const [fullName, setFullName] = useState('');
    const [officeName, setOfficeName] = useState('');
    const [email, setEmail] = useState('');
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
