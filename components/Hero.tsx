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
                    </h1>
                    <ul className={styles.subtitleList}>
                        <li>Satış hızını artıran profesyonel görsel çözümler.</li>
                        <li>Saniyeler içinde boş odaları mobilyalandırın ve canlandırın.</li>
                        <li>Tadilat masrafı olmadan mülkün potansiyelini gösterin.</li>
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
