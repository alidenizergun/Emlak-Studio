'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOOLS } from '@/app/tools/toolsData';
import { useI18n } from '@/components/LanguageProvider';
import { getStoredUserId, isStoredAuthed } from '@/lib/client-auth';
import styles from './Dashboard.module.css';
import LocalizedLink from '@/components/LocalizedLink';
import { localizePath } from '@/lib/locale-routing';

export default function DashboardClient() {
    const { t, lang } = useI18n();
    const router = useRouter();
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const authed = isStoredAuthed();
        if (!authed) {
            router.replace(localizePath('/login', lang));
            return;
        }
        const email = getStoredUserId();
        if (email) {
            fetch(`/api/credits?email=${encodeURIComponent(email)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && typeof data.credits === 'number') {
                        setCredits(data.credits);
                        window.localStorage.setItem('emlak_credits', String(data.credits));
                    }
                })
                .catch(() => {});
        }
    }, [lang, router]);

    return (
        <div className={styles.pageContainer}>
            {/* Üst bölüm: Hesabım, ayarlar, kredi */}
            <section className={styles.topSection}>
                <div className={styles.topInner}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>{t('Bana Özel')}</h1>
                        <p className={styles.subtitle}>{t('Hesabınız ve araçlara tek yerden erişin.')}</p>
                    </header>

                    <div className={styles.accountCard}>
                        <div className={styles.accountRow}>
                            <div className={styles.krediBlock}>
                                <span className={styles.krediLabel}>{t('Kullanılabilir kredi')}</span>
                                <span className={styles.krediValue}>{credits !== null ? credits : '—'}</span>
                            </div>
                            <div className={styles.accountActions}>
                                <LocalizedLink href="/pricing" className={styles.accountBtn}>
                                    {t('Paketleri Gör')}
                                </LocalizedLink>
                                <LocalizedLink href="/dashboard/settings" className={styles.accountBtnSecondary}>{t('Ayarlar')}</LocalizedLink>
                            </div>
                        </div>
                        <p className={styles.accountNote}>
                            {t('İlk müşteriler için kredi ve paket aktivasyonları manuel olarak yapılır.')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Alt bölüm: Tüm araçlar */}
            <section className={styles.bottomSection}>
                <div className={styles.bottomInner}>
                    <h2 className={styles.toolsTitle}>{t('Tüm Araçlar')}</h2>
                    <div className={styles.toolsGrid}>
                        {TOOLS.map((tool) => {
                            const isDisabled = !!tool.status;
                            const content = (
                                <>
                                    {tool.status && (
                                        <span className={styles.toolBadge}>{t(tool.status)}</span>
                                    )}
                                    <div className={styles.toolIcon}>{tool.icon}</div>
                                    <div className={styles.toolContent}>
                                        <h3 className={styles.toolCardTitle}>{t(tool.title)}</h3>
                                        <p className={styles.toolCardDesc}>{t(tool.description)}</p>
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
                                <LocalizedLink key={tool.id} href={tool.href} className={styles.toolCard}>
                                    {content}
                                </LocalizedLink>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
