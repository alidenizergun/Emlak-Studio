"use client";

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import styles from './ComparisonSlider.module.css';

/** Tüm sitedeki slider handle ikonu — beyaz arka plan üzerinde koyu stroke (currentColor). */
const HANDLE_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12H3" />
        <path d="M21 12h-6" />
        <path d="M7 9l-4 3 4 3" />
        <path d="M17 9l4 3-4 3" />
    </svg>
);

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeAlt?: string;
    afterAlt?: string;
    degradeBefore?: boolean;
    onPositionChange?: (position: number) => void;
    /** Ana sayfada ilk görüşte sol-sağ kaydırma ipucu (sadece bir kez) */
    hintSlide?: boolean;
    /** true ise sadece aspect-ratio kullanılır (ör. Examples grid), sabit 500px uygulanmaz */
    preserveAspect?: boolean;
    /** true ise ipucu animasyonu en sola ve en sağa gider (ör. Examples sayfası) */
    hintFullRange?: boolean;
    /** true ise "sonra" (dekore edilmiş) görseli %2 daha parlak gösterilir (örn. Hero) */
    brightenAfter?: boolean;
    variant?: 'default' | 'hero';
    introHint?: 'none' | 'once';
    labels?: {
        before: string;
        after: string;
    };
}

const ComparisonSlider = ({
    beforeImage,
    afterImage,
    beforeAlt = "Boş Oda",
    afterAlt = "Studio Estate ile Dekorasyon",
    degradeBefore = false,
    onPositionChange,
    hintSlide = false,
    preserveAspect = false,
    hintFullRange = false,
    brightenAfter = false,
    variant = 'default',
    introHint = 'none',
    labels,
}: ComparisonSliderProps) => {
    const { t } = useI18n();
    const [isResizing, setIsResizing] = useState(false);
    const [isClickJumping, setIsClickJumping] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [displayBeforeImage, setDisplayBeforeImage] = useState(beforeImage);
    const [displayAfterImage, setDisplayAfterImage] = useState(afterImage);
    const [hintPlaying, setHintPlaying] = useState(false);
    const [beforeLoadedFor, setBeforeLoadedFor] = useState<string | null>(null);
    const [afterLoadedFor, setAfterLoadedFor] = useState<string | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const sliderRef = useRef<HTMLDivElement>(null);
    const hintPlayedRef = useRef(false);
    const heroVariant = variant === 'hero';
    const resolvedBeforeAlt = t(beforeAlt);
    const resolvedAfterAlt = t(afterAlt);
    const resolvedLabels = labels
        ? { before: t(labels.before), after: t(labels.after) }
        : { before: t('Önce'), after: t('Sonra') };

    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current || typeof window === 'undefined' || window.innerWidth < 1025) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        const clamped = Math.min(100, Math.max(0, pct));
        setIsClickJumping(true);
        setSliderPosition(clamped);
        onPositionChange?.(clamped);
        window.requestAnimationFrame(() => {
            setIsClickJumping(false);
        });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isResizing || !sliderRef.current) return;

        const sliderRect = sliderRef.current.getBoundingClientRect();
        let clientX;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }

        const newPosition = ((clientX - sliderRect.left) / sliderRect.width) * 100;
        const clampedPosition = Math.min(100, Math.max(0, newPosition));
        setSliderPosition(clampedPosition);

        // Notify parent of position change
        if (onPositionChange) {
            onPositionChange(clampedPosition);
        }
    };

    const handleKeyAdjust = (delta: number) => {
        setSliderPosition((prev) => {
            const next = Math.max(0, Math.min(100, prev + delta));
            onPositionChange?.(next);
            return next;
        });
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        if (!sliderRef.current) return;
        const element = sliderRef.current;
        const updateSize = () => {
            const rect = element.getBoundingClientRect();
            setContainerSize({
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            });
        };

        updateSize();
        const observer = new ResizeObserver(() => updateSize());
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const img = new window.Image();
        img.decoding = 'async';
        img.onload = () => {
            if (cancelled) return;
            setDisplayBeforeImage(beforeImage);
            setBeforeLoadedFor(beforeImage);
        };
        img.onerror = () => {
            if (cancelled) return;
            setDisplayBeforeImage(beforeImage);
            setBeforeLoadedFor(beforeImage);
        };
        img.src = beforeImage;

        return () => {
            cancelled = true;
        };
    }, [beforeImage]);

    useEffect(() => {
        let cancelled = false;
        const img = new window.Image();
        img.decoding = 'async';
        img.onload = () => {
            if (cancelled) return;
            setDisplayAfterImage(afterImage);
            setAfterLoadedFor(afterImage);
        };
        img.onerror = () => {
            if (cancelled) return;
            // Sonra görseli okunamazsa beyaz/boş alan yerine güvenli fallback göster.
            setDisplayAfterImage(beforeImage);
            setAfterLoadedFor(afterImage);
        };
        img.src = afterImage;

        return () => {
            cancelled = true;
        };
    }, [afterImage, beforeImage]);

    const safePosition = heroVariant
        ? Math.max(2, Math.min(98, sliderPosition))
        : Math.max(0.5, Math.min(99.5, sliderPosition));
    const safeAfterImage = displayAfterImage || displayBeforeImage;
    const beforeReady = beforeLoadedFor === beforeImage;
    const afterReady = afterLoadedFor === afterImage;
    const contentReady = beforeReady && afterReady;

    const shouldPlayHint = introHint === 'once' || hintSlide;

    // İpucu animasyonu: üretim/lokal aynı davransın diye görünürlük API'lerine değil,
    // görsellerin hazır olmasına bağlı tek seferlik deterministik tetikleme.
    useEffect(() => {
        if (!shouldPlayHint || hintPlayedRef.current) return;
        if (!contentReady) return;
        if (!sliderRef.current || sliderRef.current.clientWidth <= 0) return;

        if (heroVariant) {
            if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
                hintPlayedRef.current = true;
                return;
            }

            let raf1 = 0;
            let raf2 = 0;
            let animationFrame = 0;
            let cancelled = false;
            const easeInOutCubic = (t: number) => (
                t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2
            );
            const runSegment = (from: number, to: number, duration: number) => (
                new Promise<void>((resolve) => {
                    const startTime = performance.now();
                    const step = (now: number) => {
                        if (cancelled) return;
                        const rawProgress = Math.min(1, (now - startTime) / duration);
                        const easedProgress = easeInOutCubic(rawProgress);
                        const nextPosition = from + ((to - from) * easedProgress);
                        setSliderPosition(nextPosition);
                        onPositionChange?.(nextPosition);

                        if (rawProgress < 1) {
                            animationFrame = window.requestAnimationFrame(step);
                        } else {
                            resolve();
                        }
                    };

                    animationFrame = window.requestAnimationFrame(step);
                })
            );

            raf1 = window.requestAnimationFrame(() => {
                raf2 = window.requestAnimationFrame(() => {
                    hintPlayedRef.current = true;
                    setHintPlaying(true);
                    void (async () => {
                        await runSegment(50, 61, 420);
                        await runSegment(61, 39, 640);
                        await runSegment(39, 50, 420);
                        if (cancelled) return;
                        setSliderPosition(50);
                        onPositionChange?.(50);
                        setHintPlaying(false);
                    })();
                });
            });

            return () => {
                cancelled = true;
                window.cancelAnimationFrame(raf1);
                window.cancelAnimationFrame(raf2);
                window.cancelAnimationFrame(animationFrame);
            };
        }

        let raf1 = 0;
        let raf2 = 0;
        let start = 0;
        let end = 0;
        raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(() => {
                start = window.setTimeout(() => {
                    hintPlayedRef.current = true;
                    setHintPlaying(true);
                }, 220);
            });
        });
        end = window.setTimeout(() => {
            setHintPlaying(false);
            setSliderPosition(50);
            onPositionChange?.(50);
        }, 4420);

        return () => {
            window.cancelAnimationFrame(raf1);
            window.cancelAnimationFrame(raf2);
            clearTimeout(start);
            clearTimeout(end);
        };
    }, [shouldPlayHint, onPositionChange, hintFullRange, contentReady, heroVariant]);

    return (
        <div
            className={`${styles.container} ${preserveAspect ? styles.containerPreserveAspect : ''} ${hintPlaying && !heroVariant ? styles.containerHintPlaying : ''} ${heroVariant ? styles.containerHero : ''} ${contentReady ? styles.containerReady : ''}`}
            ref={sliderRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onClick={handleContainerClick}
            onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    handleKeyAdjust(-2);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleKeyAdjust(2);
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    setSliderPosition(0);
                    onPositionChange?.(0);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    setSliderPosition(100);
                    onPositionChange?.(100);
                }
            }}
            tabIndex={0}
            style={{
                ['--slider-position' as string]: safePosition,
                ['--hint-left' as string]: variant === 'hero' ? 34 : hintFullRange ? 0.5 : 25.5,
                ['--hint-right' as string]: variant === 'hero' ? 66 : hintFullRange ? 99.5 : 74.5,
                ['--slider-fallback-image' as string]: `url("${displayBeforeImage}")`,
            }}
        >
            <div
                className={`${styles.imageWrapperAfter} ${brightenAfter ? styles.imageWrapperAfterBright : ''}`}
            >
                <div
                    role="img"
                    aria-label={resolvedAfterAlt}
                    className={`${styles.heroImage} ${styles.heroImageLayer}`}
                    style={{ backgroundImage: `url("${safeAfterImage}")` }}
                />
            </div>
            <div
                className={`${styles.beforeClip} ${heroVariant ? styles.beforeClipHero : ''} ${hintPlaying && !heroVariant ? styles.beforeClipHintPlaying : ''}`}
                style={{
                    filter: degradeBefore ? 'brightness(0.7) contrast(1.1) sepia(0.2)' : 'none',
                    width: `${safePosition}%`,
                }}
            >
                <div
                    className={styles.beforeMedia}
                    style={{
                        width: containerSize.width > 0 ? `${containerSize.width}px` : '100%',
                        height: containerSize.height > 0 ? `${containerSize.height}px` : '100%',
                    }}
                >
                    <div
                        role="img"
                        aria-label={resolvedBeforeAlt}
                        className={`${styles.heroImage} ${styles.heroImageLayer}`}
                        style={{ backgroundImage: `url("${displayBeforeImage}")` }}
                    />
                </div>
            </div>
            <button
                type="button"
                className={`${styles.sliderHandle} ${isResizing ? styles.sliderHandleDragging : ''} ${hintPlaying && !heroVariant ? styles.sliderHandleHintPlaying : ''} ${(hintPlaying || isClickJumping) ? styles.sliderHandleNoTransition : ''}`}
                style={{ left: `${safePosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                aria-label={t('Karşılaştırma ayıracını kaydır')}
            >
                <div className={styles.handleLine} />
                <div className={styles.handleCircle}>
                    {HANDLE_ICON}
                </div>
            </button>
            {labels ? (
                <div className={`${styles.labels} ${variant === 'hero' ? styles.labelsHero : ''}`}>
                    <span className={`${styles.labelChip} ${styles.labelChipBefore}`}>{resolvedLabels.before}</span>
                    <span className={`${styles.labelChip} ${styles.labelChipAfter}`}>{resolvedLabels.after}</span>
                </div>
            ) : null}
        </div>
    );
};

export default ComparisonSlider;
