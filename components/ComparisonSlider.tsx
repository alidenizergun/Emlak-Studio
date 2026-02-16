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
    afterAlt = "Yapay Zeka ile Dekorasyon",
    degradeBefore = false,
    onPositionChange,
    hintSlide = false,
    preserveAspect = false,
    hintFullRange = false,
    brightenAfter = false
}: ComparisonSliderProps) => {
    const [isResizing, setIsResizing] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [hintPlaying, setHintPlaying] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const hintPlayedRef = useRef(false);
    const visibilityTriggeredRef = useRef(false);

    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);

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

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

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
            const rect = el.getBoundingClientRect();
            if (typeof window === 'undefined') return false;
            const vp = window.visualViewport;
            if (vp) {
                const top = rect.top - vp.offsetTop;
                const bottom = rect.bottom - vp.offsetTop;
                const left = rect.left - vp.offsetLeft;
                const right = rect.right - vp.offsetLeft;
                return top >= 0 && bottom <= vp.height && left >= 0 && right <= vp.width;
            }
            return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
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

    // İpucu: görünür olduktan sonra konumu kare kare güncelle — handle ve kesim senkron
    const hintRafRef = useRef<number>(0);
    useEffect(() => {
        if (!hintSlide || !hintVisible || hintPlayedRef.current) return;
        hintPlayedRef.current = true;
        const id = setTimeout(() => setHintPlaying(true), 0);

        const startDelay = 0;
        const duration = 1500;
        const linear = (t: number) => t;

        const runPhase = (from: number, to: number, phaseDuration: number) => {
            cancelAnimationFrame(hintRafRef.current);
            const phaseStart = performance.now();
            const tick = (now: number) => {
                const elapsed = now - phaseStart;
                const t = Math.min(elapsed / phaseDuration, 1);
                const value = from + (to - from) * linear(t);
                setSliderPosition(value);
                onPositionChange?.(value);
                if (t < 1) hintRafRef.current = requestAnimationFrame(tick);
            };
            hintRafRef.current = requestAnimationFrame(tick);
        };

        const left = hintFullRange ? 0.5 : 25.5;
        const right = hintFullRange ? 99.5 : 74.5;
        const t1 = setTimeout(() => runPhase(50, right, duration), startDelay);
        const t2 = setTimeout(() => runPhase(right, left, duration), startDelay + duration);
        const t3 = setTimeout(() => runPhase(left, 50, duration), startDelay + duration * 2);
        const t4 = setTimeout(() => setHintPlaying(false), startDelay + duration * 3);

        return () => {
            clearTimeout(id);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            cancelAnimationFrame(hintRafRef.current);
        };
    }, [hintSlide, hintVisible, onPositionChange, hintFullRange]);

    const safePosition = Math.max(0.5, Math.min(99.5, sliderPosition));

    return (
        <div
            className={`${styles.container} ${preserveAspect ? styles.containerPreserveAspect : ''}`}
            ref={sliderRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            style={{ ['--slider-position' as string]: safePosition }}
        >
            <div className={`${styles.imageWrapperAfter} ${brightenAfter ? styles.imageWrapperAfterBright : ''}`}>
                <Image
                    src={afterImage}
                    alt={afterAlt}
                    fill
                    quality={100}
                    priority
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>
            <div
                className={styles.beforeClip}
                style={{ filter: degradeBefore ? 'brightness(0.7) contrast(1.1) sepia(0.2)' : 'none' }}
            >
                <div className={styles.beforeInner}>
                    <Image
                        src={beforeImage}
                        alt={beforeAlt}
                        fill
                        quality={100}
                        priority
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        draggable={false}
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
            </div>
            <div
                className={`${styles.sliderHandle} ${isResizing ? styles.sliderHandleDragging : ''} ${hintPlaying ? styles.sliderHandleNoTransition : ''}`}
                style={{ left: `${safePosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                <div className={styles.handleLine} />
                <div className={styles.handleCircle}>
                    {SLIDER_HANDLE_ICON}
                </div>
            </div>
        </div>
    );
};

export default ComparisonSlider;
