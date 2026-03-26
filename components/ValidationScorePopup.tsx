"use client";

import { useEffect, useMemo, useState } from 'react';
import styles from './ValidationScorePopup.module.css';
import type { ImageValidationSummary } from '@/components/ImageUploader';
import { useI18n } from '@/components/LanguageProvider';

function getTone(score: number): 'good' | 'medium' | 'low' {
    if (score >= 75) return 'good';
    if (score >= 50) return 'medium';
    return 'low';
}

interface ValidationScorePopupProps {
    summary: ImageValidationSummary | null;
}

const POPUP_DURATION_SECONDS = 10;

export default function ValidationScorePopup({ summary }: ValidationScorePopupProps) {
    const { t } = useI18n();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!summary || !summary.passed) return;

        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 250);

        return () => window.clearInterval(interval);
    }, [summary]);

    const tone = useMemo(() => (summary ? getTone(summary.score) : 'medium'), [summary]);
    const label = useMemo(() => {
        if (!summary) return '';
        if (summary.score >= 75) return t('Hazır');
        if (summary.score >= 50) return t('Sınırda');
        return t('Uygun değil');
    }, [summary, t]);
    const title = useMemo(() => {
        if (!summary) return '';
        if (summary.score >= 75) return t('Fotoğraf işlem için uygun görünüyor.');
        if (summary.score >= 50) return t('Fotoğraf işlenebilir, ancak sonuç kalitesi sınırlı olabilir.');
        return t('Bu fotoğraf işlem için uygun değil.');
    }, [summary, t]);
    const remaining = useMemo(() => {
        if (!summary || !summary.passed) return 0;
        const elapsed = Math.floor((Math.max(now, summary.nonce) - summary.nonce) / 1000);
        return Math.max(0, POPUP_DURATION_SECONDS - elapsed);
    }, [now, summary]);

    if (!summary || !summary.passed || remaining <= 0) return null;

    return (
        <div className={`${styles.popup} ${styles[tone]}`}>
            <div className={styles.topRow}>
                <span className={`${styles.label} ${styles[`label${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>{label}</span>
                <span className={styles.numeric}>{t('{score}/100').replace('{score}', String(summary.score))}</span>
            </div>
            <div className={styles.bar}>
                <span className={`${styles.segment} ${styles.segmentLow}`} />
                <span className={`${styles.segment} ${styles.segmentMedium}`} />
                <span className={`${styles.segment} ${styles.segmentGood}`} />
                <span className={styles.marker} style={{ left: `${summary.score}%` }} />
            </div>
            <div className={styles.title}>{title}</div>
            <div className={styles.countdown}>{t('{count} sn').replace('{count}', String(remaining))}</div>
        </div>
    );
}
