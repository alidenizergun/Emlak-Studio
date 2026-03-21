'use client';

import { useEffect, useState } from 'react';
import styles from './ProcessingOverlay.module.css';

interface ProcessingOverlayProps {
    active: boolean;
    message?: string;
    estimatedSeconds?: number;
}

function formatRemaining(seconds: number): string {
    const safe = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    if (minutes <= 0) return `${secs} sn`;
    return `${minutes} dk ${secs.toString().padStart(2, '0')} sn`;
}

export default function ProcessingOverlay({
    active,
    message = 'İşlem sürüyor',
    estimatedSeconds = 45,
}: ProcessingOverlayProps) {
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!active) {
            setStartedAt(null);
            setElapsedSeconds(0);
            return;
        }
        const now = Date.now();
        setStartedAt(now);
        setElapsedSeconds(0);
        const timer = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - now) / 1000));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [active]);

    const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);
    const etaText =
        startedAt === null
            ? `Tahmini kalan süre: ${formatRemaining(estimatedSeconds)}`
            : remainingSeconds > 0
                ? `Tahmini kalan süre: ${formatRemaining(remainingSeconds)}`
                : 'Son dokunuşlar yapılıyor...';

    if (!active) return null;

    return (
        <div className={styles.overlay} role="status" aria-live="polite">
            <div className={styles.card}>
                <p className={styles.text}>
                    {message} <span className={styles.hourglass}>⏳</span>
                </p>
                <p className={styles.eta}>{etaText}</p>
                <div className={styles.progressTrack} aria-hidden="true">
                    <span className={styles.progressFill} />
                </div>
            </div>
        </div>
    );
}
