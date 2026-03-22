'use client';

import { useState, useEffect } from 'react';
import { isStoredAuthed } from '@/lib/client-auth';
import styles from './ToolCreditBar.module.css';
import LocalizedLink from '@/components/LocalizedLink';
import { useI18n } from '@/components/LanguageProvider';

const CREDITS_KEY = 'emlak_credits';

interface ToolCreditBarProps {
    /** Örn: "1 kredi / fotoğraf" veya "Bu işlem: 1 kredi" */
    costLabel: string;
}

export default function ToolCreditBar({ costLabel }: ToolCreditBarProps) {
    const { t } = useI18n();
    const [mounted, setMounted] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;
        try {
            const authed = isStoredAuthed();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsAuthed(authed);
            if (authed) {
                const raw = window.localStorage.getItem(CREDITS_KEY);
                const value = raw !== null ? parseInt(raw, 10) : null;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCredits(Number.isNaN(value) ? null : value);
            }
        } catch {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsAuthed(false);
        }
    }, [mounted]);

    if (!mounted || !isAuthed) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.bar}>
                <div className={styles.creditBlock}>
                    <span className={styles.creditLabel}>{t('Kullanılabilir kredi')}</span>
                    <span className={styles.creditValue}>
                        {credits !== null ? credits : '—'}
                    </span>
                </div>
                <div className={styles.costBlock}>
                    <span className={styles.costLabel}>{t('Bu işlem')}</span>
                    <span className={styles.costValue}>{t(costLabel)}</span>
                </div>
                <LocalizedLink href="/pricing" className={styles.ctaBtn}>
                    {t('Kredi al')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </LocalizedLink>
            </div>
        </div>
    );
}
