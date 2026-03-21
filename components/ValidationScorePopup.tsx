"use client";

import { useEffect, useMemo, useState } from 'react';
import styles from './ValidationScorePopup.module.css';
import type { ImageValidationSummary } from '@/components/ImageUploader';

function getTone(score: number): 'good' | 'medium' | 'low' {
    if (score >= 80) return 'good';
    if (score >= 60) return 'medium';
    return 'low';
}

function getLabel(score: number): string {
    if (score >= 80) return 'Harika';
    if (score >= 60) return 'İdare eder';
    return 'Zayıf';
}

interface ValidationScorePopupProps {
    summary: ImageValidationSummary | null;
}

const POPUP_DURATION_SECONDS = 10;

export default function ValidationScorePopup({ summary }: ValidationScorePopupProps) {
    const [visible, setVisible] = useState(false);
    const [remaining, setRemaining] = useState(POPUP_DURATION_SECONDS);

    useEffect(() => {
        if (!summary || !summary.passed) {
            setVisible(false);
            return;
        }

        setVisible(true);
        setRemaining(POPUP_DURATION_SECONDS);

        const startedAt = Date.now();
        const interval = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const next = Math.max(0, POPUP_DURATION_SECONDS - elapsed);
            setRemaining(next);
            if (next <= 0) {
                setVisible(false);
                window.clearInterval(interval);
            }
        }, 250);

        return () => window.clearInterval(interval);
    }, [summary?.nonce]);

    const tone = useMemo(() => (summary ? getTone(summary.score) : 'medium'), [summary]);
    const label = useMemo(() => (summary ? getLabel(summary.score) : ''), [summary]);

    if (!summary || !summary.passed || !visible) return null;

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
