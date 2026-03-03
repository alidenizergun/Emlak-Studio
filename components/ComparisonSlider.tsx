"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './ComparisonSlider.module.css';

/** Tüm sitedeki slider handle ikonu — beyaz arka plan üzerinde koyu stroke (currentColor). */
const SLIDER_HANDLE_ICON = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 12H4" />
        <path d="M20 12h-6" />
        <path d="M8 8L4 12l4 4" />
        <path d="M16 8l4 4-4 4" />
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
}

const ComparisonSlider = ({
    beforeImage,
    afterImage,
    beforeAlt = "Boş Oda",
    afterAlt = "Emlak Stüdyosu ile Dekorasyon",
    degradeBefore = false,
    onPositionChange,
    hintSlide = false,
    preserveAspect = false,
    hintFullRange = false,
    brightenAfter = false
}: ComparisonSliderProps) => {
    const [isResizing, setIsResizing] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [displayBeforeImage, setDisplayBeforeImage] = useState(beforeImage);
    const [displayAfterImage, setDisplayAfterImage] = useState(afterImage);
    const [hintPlaying, setHintPlaying] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const [beforeLoadedFor, setBeforeLoadedFor] = useState<string | null>(null);
    const [afterLoadedFor, setAfterLoadedFor] = useState<string | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const hintPlayedRef = useRef(false);
    const visibilityTriggeredRef = useRef(false);

    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current || typeof window === 'undefined' || window.innerWidth < 1025) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        const clamped = Math.min(100, Math.max(0, pct));
        setSliderPosition(clamped);
        onPositionChange?.(clamped);
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

    const safePosition = Math.max(0.5, Math.min(99.5, sliderPosition));
    const safeAfterImage = displayAfterImage || displayBeforeImage;
    const beforeReady = beforeLoadedFor === beforeImage;
    const afterReady = afterLoadedFor === afterImage;

    // Slider %100 görünür olduğunda ipucunu başlat (desktop + mobil); mobilde scroll ile tam görünce de tetiklenir
    useEffect(() => {
        if (!hintSlide || !sliderRef.current) return;
        const el = sliderRef.current;

        const triggerHint = () => {
            if (visibilityTriggeredRef.current) return;
            visibilityTriggeredRef.current = true;
            setHintVisible(true);
        };

        const checkFullyVisible = () => {
            if (!el || typeof window === 'undefined') return false;
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        };

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting) return;
                if (entry.intersectionRatio >= 1) {
                    triggerHint();
                    observer.disconnect();
                }
            },
            { threshold: [0, 0.5, 0.99, 1], rootMargin: '0px', root: null }
        );
        observer.observe(el);

        // Desktop: sayfa açıldığında slider zaten tam görünürse observer bazen 1 vermeyebilir; fallback
        const fallbackId = setTimeout(() => {
            if (checkFullyVisible()) triggerHint();
        }, 150);

        // Mobil: kullanıcı scroll edip hero %100 görünce tetikle (observer bazen mobilde ratio 1 vermeyebilir)
        let rafId = 0;
        const onScrollOrResize = () => {
            if (visibilityTriggeredRef.current) return;
            rafId = requestAnimationFrame(() => {
                if (checkFullyVisible()) triggerHint();
            });
        };
        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('scroll', onScrollOrResize, { passive: true });
            window.visualViewport.addEventListener('resize', onScrollOrResize);
        }

        return () => {
            observer.disconnect();
            clearTimeout(fallbackId);
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', onScrollOrResize);
            window.removeEventListener('resize', onScrollOrResize);
            if (typeof window !== 'undefined' && window.visualViewport) {
                window.visualViewport.removeEventListener('scroll', onScrollOrResize);
                window.visualViewport.removeEventListener('resize', onScrollOrResize);
            }
        };
    }, [hintSlide]);

    // İpucu: CSS animasyonu ile çalışır; React'ta her frame setState yapılmaz.
    useEffect(() => {
        if (!hintSlide || !hintVisible || hintPlayedRef.current) return;
        if (!beforeReady || !afterReady) return;
        hintPlayedRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHintPlaying(true);
        const totalDuration = 4200;
        const end = setTimeout(() => {
            setHintPlaying(false);
            setSliderPosition(50);
            onPositionChange?.(50);
        }, totalDuration);

        return () => {
            clearTimeout(end);
        };
    }, [hintSlide, hintVisible, onPositionChange, hintFullRange, beforeReady, afterReady]);

    return (
        <div
            className={`${styles.container} ${preserveAspect ? styles.containerPreserveAspect : ''} ${hintPlaying ? styles.containerHintPlaying : ''}`}
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
                ['--hint-left' as string]: hintFullRange ? 0.5 : 25.5,
                ['--hint-right' as string]: hintFullRange ? 99.5 : 74.5,
            }}
        >
            <div
                className={`${styles.imageWrapperAfter} ${brightenAfter ? styles.imageWrapperAfterBright : ''} ${styles.imageLoaded}`}
            >
                <Image
                    src={safeAfterImage}
                    alt={afterAlt}
                    fill
                    quality={100}
                    unoptimized
                    placeholder="empty"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, (max-width: 1920px) 80vw, 3840px"
                    onError={() => setDisplayAfterImage(displayBeforeImage)}
                />
            </div>
            <div
                className={`${styles.beforeClip} ${hintPlaying ? styles.beforeClipHintPlaying : ''} ${styles.imageLoaded}`}
                style={{ filter: degradeBefore ? 'brightness(0.7) contrast(1.1) sepia(0.2)' : 'none' }}
            >
                <Image
                    src={displayBeforeImage}
                    alt={beforeAlt}
                    fill
                    quality={100}
                    unoptimized
                    placeholder="empty"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, (max-width: 1920px) 80vw, 3840px"
                />
            </div>
            <button
                type="button"
                className={`${styles.sliderHandle} ${isResizing ? styles.sliderHandleDragging : ''} ${hintPlaying ? styles.sliderHandleHintPlaying : ''} ${hintPlaying ? styles.sliderHandleNoTransition : ''}`}
                style={{ left: `${safePosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                aria-label="Karsilastirma ayiracini kaydir"
            >
                <div className={styles.handleLine} />
                <div className={styles.handleCircle}>
                    {SLIDER_HANDLE_ICON}
                </div>
            </button>
        </div>
    );
};

export default ComparisonSlider;
