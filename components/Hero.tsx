'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ComparisonSlider from './ComparisonSlider';
import styles from './Hero.module.css';

const HERO_BEFORE = '/images/hero-empty-room-4k.png';
const HERO_AFTER = '/images/hero-decorated-4k.png';

import { EXAMPLES, POPUP_HINT_SENTENCES, type ExampleItem } from '../lib/examplesData';

const Hero = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [heroPopupOpen, setHeroPopupOpen] = useState(false);
    const [popupHintIndex, setPopupHintIndex] = useState(0);
    const [activeExampleIndex, setActiveExampleIndex] = useState(0);

    // Initial example for the hero (the one shown on the page)
    const heroExample: ExampleItem = {
        id: 0,
        title: "Kapak Örneği",
        category: "Salon",
        categoryId: "living",
        before: HERO_BEFORE,
        after: HERO_AFTER
    };

    // Combine hero example with the rest for the gallery
    const allExamples = [heroExample, ...EXAMPLES];
    const currentExample = allExamples[activeExampleIndex];

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveExampleIndex((prev) => (prev > 0 ? prev - 1 : allExamples.length - 1));
    };

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveExampleIndex((prev) => (prev < allExamples.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        if (!heroPopupOpen) return;

        // Dispatch event to close other UI elements like notifications
        window.dispatchEvent(new CustomEvent('heroPopupOpen'));

        const prevOverflow = document.body.style.overflow;
        const prevOverflowX = document.body.style.overflowX;
        document.body.style.overflow = 'hidden';
        document.body.style.overflowX = 'hidden';

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setHeroPopupOpen(false);
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.overflowX = prevOverflowX;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [heroPopupOpen, activeExampleIndex]);

    useEffect(() => {
        if (!heroPopupOpen) return;
        const t = setInterval(() => {
            setPopupHintIndex((i) => (i + 1) % POPUP_HINT_SENTENCES.length);
        }, 5000);
        return () => clearInterval(t);
    }, [heroPopupOpen]);

    return (
        <section className={styles.hero}>
            <div className={styles.backgroundGlow} />
            <div className={`container ${styles.container}`}>
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        Emlak Fotoğraflarınızı <br />
                        <span className={styles.heroTitleAi}>
                            <span className={styles.heroLogoChar}>Y</span>apay <span className={styles.heroLogoChar}>Z</span>eka
                        </span> ile <br />
                        Güçlendirin
                        <span className={styles.aiIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C13.2 8.5 15.5 10.8 22 12C15.5 13.2 13.2 15.5 12 22C10.8 15.5 8.5 13.2 2 12C8.5 10.8 10.8 8.5 12 2Z" fill="url(#paint0_linear_ai)" stroke="url(#paint0_linear_ai)" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M19 14.5C19.4 16.2 20.8 17.6 22.5 18C20.8 18.4 19.4 19.8 19 21.5C18.6 19.8 17.2 18.4 15.5 18C17.2 17.6 18.6 16.2 19 14.5Z" fill="url(#paint0_linear_ai)" stroke="url(#paint0_linear_ai)" strokeWidth="1" strokeLinejoin="round" />
                                <defs>
                                    <linearGradient id="paint0_linear_ai" x1="12" y1="2" x2="12" y2="22.2" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#10b981" />
                                        <stop offset="1" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </span>
                    </h1>
                    <ul className={styles.subtitleList}>
                        <li>
                            <strong>İlanlarınız Daha Fazla Tıklansın</strong>
                            <span className={styles.listDesc}>Yapay Zeka destekli profesyonel görsellerle dikkat çekin, talebi artırın.</span>
                        </li>
                        <li>
                            <strong>Mülkün Potansiyelini Anında Gösterin</strong>
                            <span className={styles.listDesc}>Boş alanları saniyeler içinde modern ve gerçekçi şekilde dekore edin.</span>
                        </li>
                        <li>
                            <strong>Daha Hızlı ve Kârlı Satış Yapın</strong>
                            <span className={styles.listDesc}>Güçlü görsellerle ilan süresini kısaltın, pazarlık gücünüzü artırın.</span>
                        </li>
                    </ul>
                    <div className={styles.actions}>
                        <Link href="/register" className={styles.primaryBtn}>
                            Hemen Ücretsiz Deneyin
                        </Link>

                        <Link href="/examples" className={styles.secondaryBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Örnekleri İnceleyin
                        </Link>
                    </div>
                </div>
                <div className={styles.visual}>
                    <div className={styles.sliderWrapper}>
                        <ComparisonSlider
                            beforeImage={HERO_BEFORE}
                            afterImage={HERO_AFTER}
                            onPositionChange={setSliderPosition}
                            hintSlide
                            hintFullRange
                            brightenAfter
                        />
                        <button
                            type="button"
                            className={styles.heroZoomBtn}
                            onClick={(e) => { e.stopPropagation(); setHeroPopupOpen(true); }}
                            aria-label="Büyüt"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h6v6" />
                                <path d="M9 21H3v-6" />
                                <path d="M21 3l-7 7" />
                                <path d="M3 21l7-7" />
                            </svg>
                        </button>
                        <div className={styles.sliderLabel}>
                            <span
                                className={`${styles.labelBefore} ${sliderPosition <= 50 ? styles.labelGlow : ''}`}
                                style={{
                                    opacity: sliderPosition > 20 ? 1 : 0,
                                    transition: 'opacity 0.3s ease, box-shadow 0.3s ease'
                                }}
                            >
                                Boş Oda
                            </span>
                            <span
                                className={`${styles.labelAfter} ${sliderPosition >= 50 ? styles.labelGlow : ''}`}
                                style={{
                                    opacity: sliderPosition < 80 ? 1 : 0,
                                    transition: 'opacity 0.3s ease, box-shadow 0.3s ease'
                                }}
                            >
                                Yapay Zeka ile Dekorasyon
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {heroPopupOpen && (
                <div
                    className={styles.heroPopupOverlay}
                    onClick={() => setHeroPopupOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Önce ve sonra karşılaştırması"
                >
                    <div className={styles.heroPopup} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className={styles.heroPopupClose}
                            onClick={() => setHeroPopupOpen(false)}
                            aria-label="Kapat"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        {/* Navigation Arrows */}
                        <button
                            className={`${styles.popupArrow} ${styles.popupArrowLeft}`}
                            onClick={handlePrev}
                            aria-label="Önceki örnek"
                        >
                            <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <button
                            className={`${styles.popupArrow} ${styles.popupArrowRight}`}
                            onClick={handleNext}
                            aria-label="Sonraki örnek"
                        >
                            <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                        </button>

                        <div className={styles.heroPopupImages}>
                            <div className={styles.heroPopupCol}>
                                <span className={`${styles.heroPopupBadge} ${styles.heroPopupBadgeBefore}`}>
                                    Önce
                                </span>
                                <div className={styles.heroPopupImageWrap}>
                                    <Image
                                        src={currentExample.before}
                                        alt="Boş oda"
                                        fill
                                        sizes="(max-width: 1200px) 100vw, 50vw"
                                        style={{ objectFit: 'contain' }}
                                        priority
                                    />
                                </div>
                            </div>
                            <div className={styles.heroPopupCol}>
                                <span className={`${styles.heroPopupBadge} ${styles.heroPopupBadgeAfter}`}>
                                    Yapay Zeka ile Dekore Edildikten Sonra
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                        <defs>
                                            <linearGradient id="hero_pop_paint_ai" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#hero_pop_paint_ai)" stroke="url(#hero_pop_paint_ai)" strokeWidth="1.2" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <div className={`${styles.heroPopupImageWrap} ${styles.heroPopupImageWrapAfter}`}>
                                    <Image
                                        src={currentExample.after}
                                        alt="Yapay zeka ile dekore edilmiş oda"
                                        fill
                                        sizes="(max-width: 1200px) 100vw, 50vw"
                                        style={{ objectFit: 'contain' }}
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                        <footer className={styles.heroPopupFooter}>
                            <Link href="/register" className={styles.heroPopupCta} onClick={() => setHeroPopupOpen(false)}>
                                Hemen Ücretsiz Deneyin
                            </Link>
                            <div className={styles.heroPopupCtaHintWrap}>
                                <p key={popupHintIndex} className={styles.heroPopupCtaHint}>
                                    {POPUP_HINT_SENTENCES[popupHintIndex]}
                                </p>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Hero;
