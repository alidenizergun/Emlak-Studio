'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ComparisonSlider from './ComparisonSlider';
import styles from './Hero.module.css';

const HERO_BEFORE = '/images/hero-before-v18.png';
const HERO_AFTER = '/images/hero-after-v16.png';

const Hero = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [heroPopupOpen, setHeroPopupOpen] = useState(false);

    useEffect(() => {
        if (!heroPopupOpen) return;
        const prevOverflow = document.body.style.overflow;
        const prevOverflowX = document.body.style.overflowX;
        document.body.style.overflow = 'hidden';
        document.body.style.overflowX = 'hidden';
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setHeroPopupOpen(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.overflowX = prevOverflowX;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [heroPopupOpen]);

    return (
        <section className={styles.hero}>
            <div className={styles.backgroundGlow} />
            <div className={`container ${styles.container}`}>
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        Emlak Görsellerinizi <br />
                        <span className="gradient-text">Yapay Zeka</span> ile Dönüştürün
                        <span className={styles.aiIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C13.2 8.5 15.5 10.8 22 12C15.5 13.2 13.2 15.5 12 22C10.8 15.5 8.5 13.2 2 12C8.5 10.8 10.8 8.5 12 2Z" fill="url(#paint0_linear_ai)" stroke="url(#paint0_linear_ai)" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M19 14.5C19.4 16.2 20.8 17.6 22.5 18C20.8 18.4 19.4 19.8 19 21.5C18.6 19.8 17.2 18.4 15.5 18C17.2 17.6 18.6 16.2 19 14.5Z" fill="url(#paint0_linear_ai)" stroke="url(#paint0_linear_ai)" strokeWidth="1" strokeLinejoin="round" />
                                <defs>
                                    <linearGradient id="paint0_linear_ai" x1="12" y1="2" x2="12" y2="22.2" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#2563EB" />
                                        <stop offset="1" stopColor="#7C3AED" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </span>
                    </h1>
                    <ul className={styles.subtitleList}>
                        <li>
                            <strong>İlanlarınız Daha Fazla Tıklansın</strong>
                            <span className={styles.listDesc}>AI destekli profesyonel görsellerle dikkat çekin, talebi artırın.</span>
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
                            Hemen Ücretsiz Dene
                        </Link>

                        <Link href="/examples" className={styles.secondaryBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Örnekleri İncele
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
                <div className={styles.heroPopupOverlay} onClick={() => setHeroPopupOpen(false)}>
                    <div className={styles.heroPopup} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={styles.heroPopupClose} onClick={() => setHeroPopupOpen(false)} aria-label="Kapat">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        <div className={styles.heroPopupImages}>
                            <div className={styles.heroPopupCol}>
                                <div className={`${styles.heroPopupImageWrap} ${styles.heroPopupImageWrapBefore} ${styles.heroPopupImageWrapNoFrame}`}>
                                    <Image src={HERO_BEFORE} alt="Önce" fill sizes="50vw" style={{ objectFit: 'contain' }} />
                                </div>
                                <span className={styles.heroPopupLabel}>Önce</span>
                            </div>
                            <div className={styles.heroPopupCol}>
                                <div className={`${styles.heroPopupImageWrap} ${styles.heroPopupImageWrapAfter}`}>
                                    <Image src={HERO_AFTER} alt="Yapay Zeka ile Dekore Edildikten Sonra" fill sizes="50vw" style={{ objectFit: 'cover' }} />
                                </div>
                                <span className={styles.heroPopupLabel}>
                                    Yapay Zeka ile Dekore Edildikten Sonra
                                    <span className={styles.heroPopupLabelStar} aria-hidden>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Hero;
