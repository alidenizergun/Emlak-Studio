"use client";

import { useState } from 'react';
import ComparisonSlider from '../../components/ComparisonSlider';
import TrialCTA from '../../components/TrialCTA';
import styles from './Examples.module.css';

const CATEGORIES = [
    { id: 'all', label: 'Tümü' },
    { id: 'living', label: 'Salon & Oturma Odası' },
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
        category: "Çalışma Odası",
        categoryId: "other",
        before: "/images/examples/office-empty.png",
        after: "/images/examples/office-furnished.png"
    },
    {
        id: 6,
        title: "Lüks Arka Bahçe",
        category: "Bahçe",
        categoryId: "outdoor",
        before: "/images/examples/garden-empty.png",
        after: "/images/examples/garden-furnished.png"
    },
    {
        id: 7,
        title: "Çocuk Odası",
        category: "Çocuk Odası",
        categoryId: "bedroom",
        before: "/images/examples/kids-empty.png",
        after: "/images/examples/kids-furnished.png"
    },
    {
        id: 8,
        title: "Yemek Odası",
        category: "Yemek Odası",
        categoryId: "kitchen",
        before: "/images/examples/dining-empty.png",
        after: "/images/examples/dining-furnished.png"
    },
    {
        id: 9,
        title: "Panoramik Balkon",
        category: "Balkon & Teras",
        categoryId: "outdoor",
        before: "/images/examples/balcony-empty.png",
        after: "/images/examples/balcony-furnished.png"
    },
    {
        id: 10,
        title: "Ev Spor Salonu",
        category: "Spor Odası",
        categoryId: "other",
        before: "/images/examples/gym-empty.png",
        after: "/images/examples/gym-furnished.png"
    },
    {
        id: 11,
        title: "Giyinme Odası",
        category: "Giyinme Odası",
        categoryId: "bedroom",
        before: "/images/examples/closet-empty.png",
        after: "/images/examples/closet-furnished.png"
    },
    {
        id: 12,
        title: "Çatı Katı Lounge",
        category: "Çatı Katı",
        categoryId: "other",
        before: "/images/examples/attic-empty.png",
        after: "/images/examples/attic-furnished.png"
    },
    {
        id: 13,
        title: "Çocuk Oyun Odası",
        category: "Oyun Odası",
        categoryId: "other",
        before: "/images/examples/playroom-empty.png",
        after: "/images/examples/playroom-furnished.png"
    },
    {
        id: 14,
        title: "Ev Sineması",
        category: "Sinema Odası",
        categoryId: "living",
        before: "/images/examples/cinema-empty.png",
        after: "/images/examples/cinema-furnished.png"
    },
    {
        id: 15,
        title: "Modern Çamaşır Odası",
        category: "Çamaşır Odası",
        categoryId: "other",
        before: "/images/examples/laundry-empty.png",
        after: "/images/examples/laundry-furnished.png"
    },
    {
        id: 16,
        title: "Klasik Kütüphane",
        category: "Kütüphane",
        categoryId: "living",
        before: "/images/examples/library-empty.png",
        after: "/images/examples/library-furnished.png"
    },
    {
        id: 17,
        title: "Misafir Yatak Odası",
        category: "Misafir Odası",
        categoryId: "bedroom",
        before: "/images/examples/guest-empty.png",
        after: "/images/examples/guest-furnished.png"
    },
    {
        id: 18,
        title: "Eğlence ve Hobi Alanı",
        category: "Bodrum Kat",
        categoryId: "other",
        before: "/images/examples/basement-empty.png",
        after: "/images/examples/basement-furnished.png"
    },
    {
        id: 19,
        title: "Lüks Havuz Başı",
        category: "Havuz & Deck",
        categoryId: "outdoor",
        before: "/images/examples/pool-empty.png",
        after: "/images/examples/pool-furnished.png"
    },
    {
        id: 20,
        title: "Kış Bahçesi",
        category: "Sunroom",
        categoryId: "outdoor",
        before: "/images/examples/sunroom-empty.png",
        after: "/images/examples/sunroom-furnished.png"
    },
    {
        id: 21,
        title: "Giriş Holü",
        before: "/images/examples/foyer-before.png",
        after: "/images/examples/foyer-after.png",
        category: "Giriş",
        categoryId: "other"
    },
    {
        id: 22,
        title: "Çamurluk Odası",
        before: "/images/examples/mudroom-before.png",
        after: "/images/examples/mudroom-after.png",
        category: "Giriş",
        categoryId: "other"
    },
    {
        id: 23,
        title: "Kiler",
        before: "/images/examples/pantry-before.png",
        after: "/images/examples/pantry-after.png",
        category: "Mutfak",
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

    const filteredExamples = activeCategory === 'all'
        ? EXAMPLES
        : EXAMPLES.filter(ex => ex.categoryId === activeCategory);

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
                            />
                        </div>
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>{ex.title}</h3>
                            <span className={styles.categoryTag}>
                                {ex.category}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <TrialCTA />
        </div>
    );
}
