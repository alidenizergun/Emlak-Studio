'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TrialCTA.module.css';
import { useI18n } from '@/components/LanguageProvider';
import LocalizedLink from '@/components/LocalizedLink';

const TrialCTA = () => {
    const { t } = useI18n();
    const [timeLeft, setTimeLeft] = useState(60);
    const [hasStarted, setHasStarted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.5 } // Start when 50% visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [hasStarted, timeLeft]);

    const isExpired = timeLeft <= 0;

    return (
        <div className={styles.ctaWrapper} ref={containerRef}>
            <div className={styles.ctaContainer}>
                <h2 className={styles.ctaTitle}>🎯 {t('Sınırlı Süre için Ücretsiz Deneyin!')}</h2>

                <div className={styles.promoText}>
                    🎁 {t('2 Kredi Hediye')} 🎁
                </div>

                <div className={styles.countdown}>
                    {timeLeft > 0 ? (
                        <span>{`⏱️ ${t('Bu fırsat {count} saniye içinde sona erecek').replace('{count}', String(timeLeft))}`}</span>
                    ) : (
                        <span>❌ {t('Fırsat sona erdi!')}</span>
                    )}
                </div>

                <LocalizedLink
                    href="/register"
                    className={`${styles.ctaButton} ${isExpired ? styles.ctaButtonDisabled : ''}`}
                    onClick={(e) => isExpired && e.preventDefault()}
                    style={{ pointerEvents: isExpired ? 'none' : 'auto' }}
                >
                    {isExpired ? `⏰ ${t('Fırsat Sona Erdi')}` : `✨ ${t('Ücretsiz Denemeyi Başlat')}`}
                </LocalizedLink>
            </div>
        </div>
    );
};

export default TrialCTA;
