'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ComparisonSlider from './ComparisonSlider';
import BeforeAfterPopup from './BeforeAfterPopup';
import styles from './Hero.module.css';
import { useI18n } from '@/components/LanguageProvider';
import LocalizedLink from '@/components/LocalizedLink';

const HERO_BEFORE = '/images/hero-empty-room-4k.png';
const HERO_AFTER = '/images/hero-decorated-4k.png';

import { EXAMPLES, POPUP_HINT_SENTENCES, type ExampleItem } from '../lib/examplesData';

const Hero = () => {
    const { t } = useI18n();
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
                        {t('Emlak Fotoğraflarınızı')} <br />
                        <span className={styles.heroTitleAi}>{t('Akıllı Düzenlemelerle')}</span> <br />
                        {t('Güçlendirin')}
                        <span className={styles.aiIcon}>
                            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                            <strong>{t('İlanlarınız Daha Fazla Tıklansın')}</strong>
                            <span className={styles.listDesc}>{t('Kaliteli görsellerle ilanınızın tıklanma oranını yükseltin.')}</span>
                        </li>
                        <li>
                            <strong>{t('Mülkün Potansiyelini Anında Gösterin')}</strong>
                            <span className={styles.listDesc}>{t('Boş alanları saniyeler içinde modern ve gerçekçi şekilde dekore edin.')}</span>
                        </li>
                        <li>
                            <strong>{t('Daha Hızlı ve Kârlı Satış Yapın')}</strong>
                            <span className={styles.listDesc}>{t('Güçlü görsellerle ilan süresini kısaltın, pazarlık gücünüzü artırın.')}</span>
                        </li>
                    </ul>
                    <div className={styles.actions}>
                        <LocalizedLink
                            id="hero-examples-link"
                            href="/examples"
                            className={styles.secondaryBtn}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            {t('Örnekleri İnceleyin')}
                        </LocalizedLink>

                        <LocalizedLink href="/register" className={styles.primaryBtn}>
                            {t('Ücretsiz Deneyin')}
                        </LocalizedLink>
                    </div>
                </div>
                <div className={styles.visual}>
                    <div className={styles.sliderWrapper}>
                        <ComparisonSlider
                            beforeImage={HERO_BEFORE}
                            afterImage={HERO_AFTER}
                            variant="hero"
                            introHint="once"
                            brightenAfter
                            labels={{
                                before: t('Boş Oda'),
                                after: t('Studio Estate ile Dekorasyon'),
                            }}
                        />
                        <button
                            type="button"
                            className={styles.heroZoomBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveExampleIndex(0);
                                setHeroPopupOpen(true);
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
            </div>

            <BeforeAfterPopup
                open={heroPopupOpen}
                onClose={() => setHeroPopupOpen(false)}
                beforeSrc={currentExample.before}
                afterSrc={currentExample.after}
                beforeAlt={t('Boş oda')}
                afterAlt={t('Yapay zeka ile dekore edilmiş oda')}
                showArrows={true}
                onPrev={handlePrev}
                onNext={handleNext}
                ctaText={t('Ücretsiz Deneyin')}
                ctaHref="/register"
                hintText={POPUP_HINT_SENTENCES[popupHintIndex]}
                gradientIdPrefix="hero_popup_ai"
                heightScale={1.1}
            />
        </section>
    );
};

export default Hero;
