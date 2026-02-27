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
                <div className={styles.aiOrb} aria-hidden="true">
                    <span className={styles.ringA} />
                    <span className={styles.ringB} />
                    <span className={styles.core} />
                </div>
                <p className={styles.text}>{message}</p>
            </div>
        </div>
    );
}
