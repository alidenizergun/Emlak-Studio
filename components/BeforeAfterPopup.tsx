'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './BeforeAfterPopup.module.css';

export type BeforeAfterPopupProps = {
    open: boolean;
    onClose: () => void;
    beforeSrc: string;
    afterSrc: string;
    beforeAlt?: string;
    afterAlt?: string;
    showArrows?: boolean;
    onPrev?: (e: React.MouseEvent) => void;
    onNext?: (e: React.MouseEvent) => void;
    ctaText?: string;
    ctaHref?: string;
    hintText?: string;
    /** SVG gradient id prefix (farklı sayfalarda çakışmayı önlemek için) */
    gradientIdPrefix?: string;
};

const CLOSE_SVG = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const ARROW_LEFT_SVG = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ARROW_RIGHT_SVG = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const AI_BADGE_SVG = ({ id }: { id: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
        </defs>
        <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            fill={`url(#${id})`}
            stroke={`url(#${id})`}
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
    </svg>
);

export function BeforeAfterPopup({
    open,
    onClose,
    beforeSrc,
    afterSrc,
    beforeAlt = 'Önce',
    afterAlt = 'Yapay Zeka ile Dekore Edildikten Sonra',
    showArrows = false,
    onPrev,
    onNext,
    ctaText = 'Hemen Ücretsiz Deneyin',
    ctaHref = '/register',
    hintText,
    gradientIdPrefix = 'popup_ai',
}: BeforeAfterPopupProps) {
    if (!open) return null;

    const gradientId = `${gradientIdPrefix}_gradient`;

    return (
        <div
            className={styles.popupOverlay}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Önce ve sonra karşılaştırması"
        >
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <button type="button" className={styles.popupClose} onClick={onClose} aria-label="Kapat">
                    {CLOSE_SVG}
                </button>

                {showArrows && (
                    <>
                        <button
                            type="button"
                            className={`${styles.popupArrow} ${styles.popupArrowLeft}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrev?.(e);
                            }}
                            aria-label="Önceki örnek"
                        >
                            {ARROW_LEFT_SVG}
                        </button>
                        <button
                            type="button"
                            className={`${styles.popupArrow} ${styles.popupArrowRight}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onNext?.(e);
                            }}
                            aria-label="Sonraki örnek"
                        >
                            {ARROW_RIGHT_SVG}
                        </button>
                    </>
                )}

                <div className={styles.popupInner}>
                    <div className={styles.popupImages}>
                        <div className={styles.popupCol}>
                            <span className={`${styles.popupBadge} ${styles.popupBadgeBefore}`}>Önce</span>
                            <div className={styles.popupImageWrap}>
                                <Image
                                    src={beforeSrc}
                                    alt={beforeAlt}
                                    fill
                                    sizes="(max-width: 1200px) 100vw, 50vw"
                                    className={styles.popupImage}
                                    priority
                                />
                            </div>
                        </div>
                        <div className={styles.popupCol}>
                            <span className={`${styles.popupBadge} ${styles.popupBadgeAfter}`}>
                                Yapay Zeka ile Dekore Edildikten Sonra
                                <AI_BADGE_SVG id={gradientId} />
                            </span>
                            <div className={`${styles.popupImageWrap} ${styles.popupImageWrapAfter}`}>
                                <Image
                                    src={afterSrc}
                                    alt={afterAlt}
                                    fill
                                    sizes="(max-width: 1200px) 100vw, 50vw"
                                    className={styles.popupImage}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                    <footer className={styles.popupFooter}>
                        <div className={styles.popupCtaWrap}>
                            <Link href={ctaHref} className={styles.popupCta} onClick={onClose}>
                                {ctaText}
                            </Link>
                            {hintText != null && hintText !== '' && (
                                <div className={styles.popupCtaHintWrap}>
                                    <p className={styles.popupCtaHint}>{hintText}</p>
                                </div>
                            )}
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default BeforeAfterPopup;
