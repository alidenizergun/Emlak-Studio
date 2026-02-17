'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TOOLS } from '@/app/tools/toolsData';
import styles from './Dashboard.module.css';

export default function DashboardClient() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;
        const authed = window.localStorage.getItem('emlak_authed') === '1';
        if (!authed) {
            router.replace('/login');
            return;
        }
        const phone = window.localStorage.getItem('emlak_user_phone');
        if (phone) {
            fetch(`/api/credits?phone=${encodeURIComponent(phone)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && typeof data.credits === 'number') {
                        setCredits(data.credits);
                        window.localStorage.setItem('emlak_credits', String(data.credits));
                    }
                })
                .catch(() => {});
        }
    }, [mounted, router]);

    if (!mounted) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.loading}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            {/* Üst bölüm: Hesabım, ayarlar, kredi */}
            <section className={styles.topSection}>
                <div className={styles.topInner}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Bana Özel</h1>
                        <p className={styles.subtitle}>Hesabınız ve araçlara tek yerden erişin.</p>
                    </header>

                    <div className={styles.accountCard}>
                        <div className={styles.accountRow}>
                            <div className={styles.krediBlock}>
                                <span className={styles.krediLabel}>Kullanılabilir kredi</span>
                                <span className={styles.krediValue}>{credits !== null ? credits : '—'}</span>
                            </div>
                            <div className={styles.accountActions}>
                                <Link href="/pricing" className={styles.accountBtn}>
                                    Kredi / Paket al
                                </Link>
                                <Link href="/dashboard/settings" className={styles.accountBtnSecondary}>Ayarlar</Link>
                            </div>
                        </div>
                        <p className={styles.accountNote}>
                            Abonelik veya paket satın alarak kredi ekleyebilirsiniz.
                        </p>
                    </div>
                </div>
            </section>

            {/* Alt bölüm: Tüm araçlar */}
            <section className={styles.bottomSection}>
                <div className={styles.bottomInner}>
                    <h2 className={styles.toolsTitle}>Tüm Araçlar</h2>
                    <div className={styles.toolsGrid}>
                        {TOOLS.map((tool) => {
                            const isDisabled = !!tool.status;
                            const content = (
                                <>
                                    {tool.status && (
                                        <span className={styles.toolBadge}>{tool.status}</span>
                                    )}
                                    <div className={styles.toolIcon}>{tool.icon}</div>
                                    <div className={styles.toolContent}>
                                        <h3 className={styles.toolCardTitle}>{tool.title}</h3>
                                        <p className={styles.toolCardDesc}>{tool.description}</p>
                                    </div>
                                </>
                            );
                            return isDisabled ? (
                                <span
                                    key={tool.id}
                                    className={`${styles.toolCard} ${styles.toolCardDisabled}`}
                                    aria-disabled="true"
                                >
                                    {content}
                                </span>
                            ) : (
                                <Link key={tool.id} href={tool.href} className={styles.toolCard}>
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
