'use client';

import { useState } from 'react';
import Link from 'next/link';
import ComparisonSlider from './ComparisonSlider';
import styles from './Hero.module.css';

const Hero = () => {
    const [sliderPosition, setSliderPosition] = useState(50);

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
                        <Link href="/examples" className={styles.secondaryBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Örnekleri İncele
                        </Link>

                        <Link href="/register" className={styles.primaryBtn}>
                            Hemen Ücretsiz Dene
                        </Link>
                    </div>
                </div>
                <div className={styles.visual}>
                    <div className={styles.sliderWrapper}>
                        <ComparisonSlider
                            beforeImage="/images/hero-before-v18.png"
                            afterImage="/images/hero-after-v16.png"
                            onPositionChange={setSliderPosition}
                        />
                        <div className={styles.sliderLabel}>
                            <span
                                className={styles.labelBefore}
                                style={{
                                    opacity: sliderPosition > 20 ? 1 : 0,
                                    transition: 'opacity 0.3s ease'
                                }}
                            >
                                Boş Oda
                            </span>
                            <span
                                className={styles.labelAfter}
                                style={{
                                    opacity: sliderPosition < 80 ? 1 : 0,
                                    transition: 'opacity 0.3s ease'
                                }}
                            >
                                Yapay Zeka ile Dekorasyon
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
