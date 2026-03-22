"use client";

import { useEffect, useMemo, useState } from 'react';
import styles from './ValidationScorePopup.module.css';
import type { ImageValidationSummary } from '@/components/ImageUploader';

function getTone(score: number): 'good' | 'medium' | 'low' {
    if (score >= 70) return 'good';
    if (score >= 60) return 'medium';
    return 'low';
}

function getLabel(score: number): string {
    if (score >= 70) return 'Harika';
    if (score >= 60) return 'İdare eder';
    return 'Zayıf';
}

interface ValidationScorePopupProps {
    summary: ImageValidationSummary | null;
}

const POPUP_DURATION_SECONDS = 10;

export default function ValidationScorePopup({ summary }: ValidationScorePopupProps) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!summary || !summary.passed) return;

        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 250);

        return () => window.clearInterval(interval);
    }, [summary]);

    const tone = useMemo(() => (summary ? getTone(summary.score) : 'medium'), [summary]);
    const label = useMemo(() => (summary ? getLabel(summary.score) : ''), [summary]);
    const remaining = useMemo(() => {
        if (!summary || !summary.passed) return 0;
        const elapsed = Math.floor((Math.max(now, summary.nonce) - summary.nonce) / 1000);
        return Math.max(0, POPUP_DURATION_SECONDS - elapsed);
    }, [now, summary]);

    if (!summary || !summary.passed || remaining <= 0) return null;

    return (
        <div className={`${styles.popup} ${styles[tone]}`}>
            <div className={styles.topRow}>
                <span className={styles.label}>{label}</span>
                <span className={styles.countdown}>{remaining} sn</span>
            </div>
            <div className={styles.score}>Fotoğraf uygunluk skoru: {summary.score}/100</div>
        </div>
    );
}
