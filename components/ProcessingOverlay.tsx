'use client';

import { useEffect, useState } from 'react';
import styles from './ProcessingOverlay.module.css';
import { useI18n } from '@/components/LanguageProvider';

interface ProcessingOverlayProps {
    active: boolean;
    message?: string;
    estimatedSeconds?: number;
}

function formatRemaining(seconds: number): string {
    const safe = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    if (minutes <= 0) return `${secs}s`;
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

export default function ProcessingOverlay({
    active,
    message = 'İşlem sürüyor',
    estimatedSeconds = 45,
}: ProcessingOverlayProps) {
    const { t } = useI18n();
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!active) {
            const resetTimer = window.setTimeout(() => {
                setStartedAt(null);
                setElapsedSeconds(0);
            }, 0);
            return () => window.clearTimeout(resetTimer);
        }

        const now = Date.now();
        const startTimer = window.setTimeout(() => {
            setStartedAt(now);
            setElapsedSeconds(0);
        }, 0);
        const timer = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - now) / 1000));
        }, 1000);
        return () => {
            window.clearTimeout(startTimer);
            window.clearInterval(timer);
        };
    }, [active]);

    const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);
    const etaText =
        startedAt === null
            ? t('Tahmini kalan süre: {time}').replace('{time}', formatRemaining(estimatedSeconds))
            : remainingSeconds > 0
                ? t('Tahmini kalan süre: {time}').replace('{time}', formatRemaining(remainingSeconds))
                : t('Son dokunuşlar yapılıyor...');

    if (!active) return null;

    return (
        <div className={styles.overlay} role="status" aria-live="polite">
            <div className={styles.card}>
                <p className={styles.text}>
                    {t(message)} <span className={styles.hourglass}>⏳</span>
                </p>
                <p className={styles.eta}>{etaText}</p>
                <div className={styles.progressTrack} aria-hidden="true">
                    <span className={styles.progressFill} />
                </div>
            </div>
        </div>
    );
}
