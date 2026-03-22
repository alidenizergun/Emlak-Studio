'use client';

import { useEffect } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import styles from './ToolExamplePopup.module.css';

type ToolExamplePopupProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    summary: string;
    beforeSrc?: string;
    afterSrc?: string;
    singleSrc?: string;
    sampleText?: string;
};

export default function ToolExamplePopup({
    isOpen,
    onClose,
    title,
    summary,
    beforeSrc,
    afterSrc,
    singleSrc,
    sampleText,
}: ToolExamplePopupProps) {
    const { t } = useI18n();
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasCompare = Boolean(beforeSrc && afterSrc);

    return (
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={t('{title} örneği').replace('{title}', title)}>
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.summary}>{summary}</p>
                    </div>
                    <button type="button" className={styles.closeBtn} aria-label={t('Kapat')} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    {hasCompare ? (
                        <div className={styles.compareGrid}>
                            <div className={styles.card}>
                                <span className={styles.cardLabel}>{t('Önce')}</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className={styles.image} src={beforeSrc} alt={t('Önce örnek görsel')} />
                            </div>
                            <div className={styles.card}>
                                <span className={styles.cardLabel}>{t('Sonra')}</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className={styles.image} src={afterSrc} alt={t('Sonra örnek görsel')} />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.singleWrap}>
                            <div className={styles.card}>
                                {singleSrc ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img className={styles.image} src={singleSrc} alt={t('Örnek görsel')} />
                                        {sampleText ? <p className={styles.sampleText}>{sampleText}</p> : null}
                                    </>
                                ) : (
                                    <p className={styles.sampleText}>{sampleText || t('Örnek içerik yakında eklenecek.')}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
