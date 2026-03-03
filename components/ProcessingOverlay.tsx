'use client';

import styles from './ProcessingOverlay.module.css';

interface ProcessingOverlayProps {
    active: boolean;
    message?: string;
}

export default function ProcessingOverlay({
    active,
    message = 'Geliştirme yapılıyor, lütfen bekleyin',
}: ProcessingOverlayProps) {
    if (!active) return null;
    return (
        <div className={styles.overlay} role="status" aria-live="polite">
            <div className={styles.card}>
                <div className={styles.headerRow} aria-hidden="true">
                    <span className={styles.pingDot} />
                    <span className={styles.headerText}>Islem Suruyor</span>
                </div>
                <p className={styles.text}>
                    {message} <span className={styles.hourglass}>⏳</span>
                </p>
                <div className={styles.progressTrack} aria-hidden="true">
                    <span className={styles.progressFill} />
                </div>
            </div>
        </div>
    );
}
