"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ComparisonSlider from '../../components/ComparisonSlider';
import TrialCTA from '../../components/TrialCTA';
import styles from './Examples.module.css';

type ExampleItem = { id: number; title: string; category: string; categoryId: string; before: string; after: string };

const CATEGORIES = [
    { id: 'all', label: 'Tümü' },
    { id: 'living', label: 'Salon' },
    { id: 'bedroom', label: 'Yatak Odası' },
    { id: 'kitchen', label: 'Mutfak & Yemek' },
    { id: 'bathroom', label: 'Banyo' },
    { id: 'outdoor', label: 'Bahçe & Dış Mekan' },
    { id: 'other', label: 'Diğer & Ofis' }
];

const EXAMPLES = [
    {
        id: 1,
        title: "Modern Lüks Salon",
        category: "Salon",
        categoryId: "living",
        before: "/images/examples/living-empty.png",
        after: "/images/examples/living-furnished.png"
    },
    {
        id: 2,
        title: "İskandinav Yatak Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/bedroom-empty.png",
        after: "/images/examples/bedroom-furnished.png"
    },
    {
        id: 3,
        title: "Modern Mutfak",
        category: "Mutfak",
        categoryId: "kitchen",
        before: "/images/examples/kitchen-empty.png",
        after: "/images/examples/kitchen-furnished.png"
    },
    {
        id: 4,
        title: "Spa Banyo",
        category: "Banyo",
        categoryId: "bathroom",
        before: "/images/examples/bathroom-empty-v3.png",
        after: "/images/examples/bathroom-furnished-v3.png"
    },
    {
        id: 5,
        title: "Ev Ofisi",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/office-empty.png",
        after: "/images/examples/office-furnished.png"
    },
    {
        id: 6,
        title: "Lüks Arka Bahçe",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/garden-empty.png",
        after: "/images/examples/garden-furnished.png"
    },
    {
        id: 7,
        title: "Çocuk Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/kids-empty.png",
        after: "/images/examples/kids-furnished.png"
    },
    {
        id: 8,
        title: "Yemek Odası",
        category: "Mutfak & Yemek",
        categoryId: "kitchen",
        before: "/images/examples/dining-empty.png",
        after: "/images/examples/dining-furnished.png"
    },
    {
        id: 9,
        title: "Panoramik Balkon",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/balcony-empty.png",
        after: "/images/examples/balcony-furnished.png"
    },
    {
        id: 10,
        title: "Ev Spor Salonu",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/gym-empty.png",
        after: "/images/examples/gym-furnished.png"
    },
    {
        id: 11,
        title: "Giyinme Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/closet-empty.png",
        after: "/images/examples/closet-furnished.png"
    },
    {
        id: 12,
        title: "Çatı Katı Lounge",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/attic-empty.png",
        after: "/images/examples/attic-furnished.png"
    },
    {
        id: 13,
        title: "Çocuk Oyun Odası",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/playroom-empty.png",
        after: "/images/examples/playroom-furnished.png"
    },
    {
        id: 14,
        title: "Ev Sineması",
        category: "Salon",
        categoryId: "living",
        before: "/images/examples/cinema-empty.png",
        after: "/images/examples/cinema-furnished.png"
    },
    {
        id: 15,
        title: "Modern Çamaşır Odası",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/laundry-empty.png",
        after: "/images/examples/laundry-furnished.png"
    },
    {
        id: 16,
        title: "Klasik Kütüphane",
        category: "Salon",
        categoryId: "living",
        before: "/images/examples/library-empty.png",
        after: "/images/examples/library-furnished.png"
    },
    {
        id: 17,
        title: "Misafir Yatak Odası",
        category: "Yatak Odası",
        categoryId: "bedroom",
        before: "/images/examples/guest-empty.png",
        after: "/images/examples/guest-furnished.png"
    },
    {
        id: 18,
        title: "Eğlence ve Hobi Alanı",
        category: "Diğer & Ofis",
        categoryId: "other",
        before: "/images/examples/basement-empty.png",
        after: "/images/examples/basement-furnished.png"
    },
    {
        id: 19,
        title: "Lüks Havuz Başı",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/pool-empty.png",
        after: "/images/examples/pool-furnished.png"
    },
    {
        id: 20,
        title: "Kış Bahçesi",
        category: "Bahçe & Dış Mekan",
        categoryId: "outdoor",
        before: "/images/examples/sunroom-empty.png",
        after: "/images/examples/sunroom-furnished.png"
    },
    {
        id: 21,
        title: "Giriş Holü",
        before: "/images/examples/foyer-before.png",
        after: "/images/examples/foyer-after.png",
        category: "Diğer & Ofis",
        categoryId: "other"
    },
    {
        id: 22,
        title: "Çamurluk Odası",
        before: "/images/examples/mudroom-before.png",
        after: "/images/examples/mudroom-after.png",
        category: "Diğer & Ofis",
        categoryId: "other"
    },
    {
        id: 23,
        title: "Kiler",
        before: "/images/examples/pantry-before.png",
        after: "/images/examples/pantry-after.png",
        category: "Mutfak & Yemek",
        categoryId: "kitchen"
    },
    {
        id: 32,
        title: "Ebeveyn Banyosu",
        before: "/images/examples/bathroom-empty.png",
        after: "/images/examples/bathroom-furnished.png",
        category: "Banyo",
        categoryId: "bathroom"
    }
];

export default function ExamplesPage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [popupExample, setPopupExample] = useState<ExampleItem | null>(null);

    const filteredExamples = activeCategory === 'all'
        ? EXAMPLES
        : EXAMPLES.filter(ex => ex.categoryId === activeCategory);

    // Body scroll lock, Escape to close, Arrow keys for prev/next when popup is open
    useEffect(() => {
        if (!popupExample) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPopupExample(null);
                return;
            }
            if (filteredExamples.length === 0) return;
            const currentIndex = filteredExamples.findIndex(ex => ex.id === popupExample.id);
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = currentIndex > 0 ? filteredExamples[currentIndex - 1] : filteredExamples[filteredExamples.length - 1];
                setPopupExample(prev);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const next = currentIndex < filteredExamples.length - 1 ? filteredExamples[currentIndex + 1] : filteredExamples[0];
                setPopupExample(next);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [popupExample, filteredExamples]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Dönüşüm Örnekleri
                </h1>
                <p className={styles.description}>
                    Boş ve cansız odaların yapay zeka ile nasıl satışa hazır, büyüleyici yaşam alanlarına dönüştüğünü keşfedin.
                </p>

                {/* Categories Tabs */}
                <div className={styles.tabsContainer}>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
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
                            />
                            <button
                                type="button"
                                className={styles.zoomBtn}
                                onClick={(e) => { e.stopPropagation(); setPopupExample(ex); }}
                                aria-label="Büyüt"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {popupExample && (() => {
                const currentIndex = filteredExamples.findIndex(ex => ex.id === popupExample.id);
                const prevExample = currentIndex > 0 ? filteredExamples[currentIndex - 1] : filteredExamples[filteredExamples.length - 1];
                const nextExample = currentIndex < filteredExamples.length - 1 ? filteredExamples[currentIndex + 1] : filteredExamples[0];
                return (
                <div className={styles.popupOverlay} onClick={() => setPopupExample(null)} role="dialog" aria-modal="true" aria-label="Önce ve sonra karşılaştırması">
                    <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={styles.popupClose} onClick={() => setPopupExample(null)} aria-label="Kapat">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        <div className={styles.popupImages}>
                            <div className={styles.popupCol}>
                                <span className={`${styles.popupBadge} ${styles.popupBadgeBefore}`}>Önce</span>
                                <div className={styles.popupImageWrap}>
                                    <Image src={popupExample.before} alt="Önce" fill sizes="(max-width: 768px) 100vw, 45vw" style={{ objectFit: 'contain' }} />
                                </div>
                            </div>
                            <div className={styles.popupCol}>
                                <span className={`${styles.popupBadge} ${styles.popupBadgeAfter}`}>
                                    Yapay Zeka ile Dekore Edildikten Sonra
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                                </span>
                                <div className={`${styles.popupImageWrap} ${styles.popupImageWrapAfter}`}>
                                    <Image src={popupExample.after} alt="Yapay Zeka ile Dekore Edildikten Sonra" fill sizes="(max-width: 768px) 100vw, 45vw" style={{ objectFit: 'contain' }} />
                                </div>
                            </div>
                        </div>
                        <footer className={styles.popupFooter}>
                            <Link href="/register" className={styles.popupCta} onClick={() => setPopupExample(null)}>
                                Hemen Ücretsiz Dene
                            </Link>
                            <div className={styles.popupCtaHintWrap}>
                                <p className={styles.popupCtaHint}>Siz de ilanlarınızı böyle güçlendirin.</p>
                            </div>
                        </footer>
                        {filteredExamples.length > 0 && (
                            <button
                                type="button"
                                className={`${styles.popupArrow} ${styles.popupArrowLeft}`}
                                onClick={(e) => { e.stopPropagation(); setPopupExample(prevExample); }}
                                aria-label="Önceki örnek"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                        )}
                        {filteredExamples.length > 0 && (
                            <button
                                type="button"
                                className={`${styles.popupArrow} ${styles.popupArrowRight}`}
                                onClick={(e) => { e.stopPropagation(); setPopupExample(nextExample); }}
                                aria-label="Sonraki örnek"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        )}
                    </div>
                </div>
                );
            })()}

            <TrialCTA />
        </div>
    );
}
