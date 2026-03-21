"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import ComparisonSlider from '@/components/ComparisonSlider';
import BeforeAfterPopup from '@/components/BeforeAfterPopup';
import styles from './Examples.module.css';
import { EXAMPLES, POPUP_HINT_SENTENCES, type ExampleItem } from '@/lib/examplesData';

const CATEGORIES = [
    { id: 'all', label: 'Tümü' },
    { id: 'living', label: 'Salon' },
    { id: 'bedroom', label: 'Yatak Odası' },
    { id: 'kitchen', label: 'Mutfak & Yemek' },
    { id: 'bathroom', label: 'Banyo' },
    { id: 'outdoor', label: 'Bahçe & Dış Mekan' },
    { id: 'other', label: 'Diğer & Ofis' }
];

export function ExamplesContent() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [popupExample, setPopupExample] = useState<ExampleItem | null>(null);
    const [ctaHintIndex, setCtaHintIndex] = useState(0);

    // Filter examples based on active category (memoized to avoid new ref every render)
    const filteredExamples = useMemo(
        () => activeCategory === 'all' ? EXAMPLES : EXAMPLES.filter(ex => ex.categoryId === activeCategory),
        [activeCategory]
    );

    const filteredExamplesRef = useRef(filteredExamples);
    useEffect(() => {
        filteredExamplesRef.current = filteredExamples;
    }, [filteredExamples]);

    // Rotate CTA hint sentences
    useEffect(() => {
        const len = POPUP_HINT_SENTENCES.length;
        if (len === 0) return () => {};
        const t = setInterval(() => {
            setCtaHintIndex((i) => (i + 1) % len);
        }, 6000);
        return () => clearInterval(t);
    }, []);

    // Body scroll lock, Escape to close, Arrow keys for prev/next
    useEffect(() => {
        if (!popupExample) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPopupExample(null);
                return;
            }
            const list = filteredExamplesRef.current;
            if (!list || list.length === 0) return;

            const currentIndex = list.findIndex(ex => ex.id === popupExample.id);
            if (currentIndex === -1) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = currentIndex > 0 ? list[currentIndex - 1] : list[list.length - 1];
                setPopupExample(prev);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = currentIndex < list.length - 1 ? list[currentIndex + 1] : list[0];
                setPopupExample(next);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [popupExample]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Dönüşüm Örnekleri
                </h1>
                <p className={styles.description}>
                    Boş ve cansız odaların yapay zeka ile nasıl satışa hazır, büyüleyici yaşam alanlarına dönüştüğünü keşfedin.
                </p>

                {/* Categories Tabs - render as non-interactive placeholders until mount to avoid hydration mismatch */}
                <div className={styles.tabsContainer}>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={`${styles.tabButton} ${activeCategory === cat.id ? styles.tabButtonActive : ''}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.grid}>
                {filteredExamples.map((ex) => (
                    <div key={ex.id} className={styles.card}>
                        <div className={styles.sliderContainer}>
                            <ComparisonSlider
                                beforeImage={ex.before}
                                afterImage={ex.after}
                                degradeBefore={true}
                                preserveAspect
                                variant="hero"
                            />
                            <button
                                type="button"
                                className={styles.zoomBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPopupExample(ex);
                                }}
                                aria-label="Büyüt"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h6v6" />
                                    <path d="M9 21H3v-6" />
                                    <path d="M21 3l-7 7" />
                                    <path d="M3 21l7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {popupExample && (
                <BeforeAfterPopup
                    open={true}
                    onClose={() => setPopupExample(null)}
                    beforeSrc={popupExample.before}
                    afterSrc={popupExample.after}
                    beforeAlt="Önce"
                    afterAlt="Studio Estate ile Dekore Edildikten Sonra"
                    showArrows={filteredExamples.length > 1}
                    onPrev={(e) => {
                        e.stopPropagation();
                        const idx = filteredExamples.findIndex(ex => ex.id === popupExample.id);
                        const prev = idx > 0 ? filteredExamples[idx - 1] : filteredExamples[filteredExamples.length - 1];
                        setPopupExample(prev);
                    }}
                    onNext={(e) => {
                        e.stopPropagation();
                        const idx = filteredExamples.findIndex(ex => ex.id === popupExample.id);
                        const next = idx < filteredExamples.length - 1 ? filteredExamples[idx + 1] : filteredExamples[0];
                        setPopupExample(next);
                    }}
                    ctaText="Hemen Ücretsiz Deneyin"
                    ctaHref="/register"
                    hintText={POPUP_HINT_SENTENCES[ctaHintIndex]}
                    gradientIdPrefix="examples_popup_ai"
                    heightScale={1.1}
                />
            )}

            <section className={styles.ctaSection}>
                <Link href="/register" className={styles.ctaButton}>
                    Hemen Ücretsiz Deneyin
                </Link>
                <div className={styles.ctaHintWrap}>
                    <p className={styles.ctaHint}>
                        {POPUP_HINT_SENTENCES[ctaHintIndex]}
                    </p>
                </div>
            </section>
        </div>
    );
}
