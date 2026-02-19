'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './ToolCreditBar.module.css';

const CREDITS_KEY = 'emlak_credits';
const AUTH_KEY = 'emlak_authed';

interface ToolCreditBarProps {
    /** Örn: "1 kredi / fotoğraf" veya "Bu işlem: 1 kredi" */
    costLabel: string;
}

export default function ToolCreditBar({ costLabel }: ToolCreditBarProps) {
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
            const authed = window.localStorage.getItem(AUTH_KEY) === '1';
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
                    <span className={styles.creditLabel}>Kullanılabilir kredi</span>
                    <span className={styles.creditValue}>
                        {credits !== null ? credits : '—'}
                    </span>
                </div>
                <div className={styles.costBlock}>
                    <span className={styles.costLabel}>Bu işlem</span>
                    <span className={styles.costValue}>{costLabel}</span>
                </div>
                <Link href="/pricing" className={styles.ctaBtn}>
                    Kredi al
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
