"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import styles from './Stage.module.css';

const ROOM_TYPES = [
    {
        id: 'living_room',
        label: 'Oturma Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 20h20M4 20v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5M8 13V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'bedroom',
        label: 'Yatak Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 19h20M4 19v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M9 11V9M15 11V9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 7h6a2 2 0 0 1 2 2v2H7V9a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'child_room',
        label: 'Çocuk Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 19h20M4 19v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M9 11V9M15 11V9" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="2" />
            </svg>
        )
    },
    {
        id: 'dining_room',
        label: 'Yemek Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 20V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12M3 20h18M12 6V4M6 20v-6a2 2 0 0 1 2-2M18 20v-6a2 2 0 0 0-2-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'kitchen',
        label: 'Mutfak',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 13h18M5 13v7h14v-7M3 10V6a2 2 0 0 1 2-2h3M21 10V6a2 2 0 0 0-2-2h-3M9 4h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'office',
        label: 'Çalışma',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 20H3M15 20V8a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12M19 20v-4a2 2 0 0 0-2-2h-2M11 12h.01M11 16h.01M7 12h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'bathroom',
        label: 'Banyo',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8zM4 6h16M7 4h10M12 10v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
];

const STYLES = [
    {
        id: 'modern',
        label: 'Modern',
        image: '/images/styles/modern.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9h18M9 21V9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'scandinavian',
        label: 'İskandinav',
        image: '/images/styles/scandinavian.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v18M12 3L7 8M12 3l5 5M12 18l-5-5M12 18l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'industrial',
        label: 'Endüstriyel',
        image: '/images/styles/industrial.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="16" height="16" rx="1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 8h16M4 12h16M4 16h16M8 4v16M12 4v16M16 4v16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'bohemian',
        label: 'Bohem',
        image: '/images/styles/bohemian.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'luxury',
        label: 'Lüks',
        image: '/images/styles/luxury.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'minimalist',
        label: 'Minimalist',
        image: '/images/styles/minimalist.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'classic',
        label: 'Klasik',
        image: '/images/styles/classic.png',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7h10v10H7z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3l18 18M3 21L21 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
];

export default function StageClient() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDetectingRoom, setIsDetectingRoom] = useState(false);
    const [isSelectingStyle, setIsSelectingStyle] = useState(false);
    const [isAiRoom, setIsAiRoom] = useState(false);
    const [isAiStyle, setIsAiStyle] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Yükleniyor...</div>;
    }

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setFileUrl(URL.createObjectURL(selectedFile));
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('roomType', selectedRoom!);
            formData.append('style', selectedStyle!);

            const response = await fetch('/api/stage', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const objectUrl = URL.createObjectURL(file);
                setResult({
                    before: objectUrl,
                    after: data.imageUrl
                });
            } else {
                alert('İşlem başarısız: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Stage error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setFileUrl(null);
        setResult(null);
    };

    const handleAIDetectRoom = () => {
        setIsDetectingRoom(true);
        setIsAiRoom(true); // Enable AI mode for room
        const otherRooms = ROOM_TYPES.filter(r => r.id !== selectedRoom);
        const randomRoom = otherRooms.length > 0
            ? otherRooms[Math.floor(Math.random() * otherRooms.length)]
            : ROOM_TYPES[Math.floor(Math.random() * ROOM_TYPES.length)];

        setTimeout(() => {
            setSelectedRoom(randomRoom.id);
            setIsDetectingRoom(false);
        }, 500);
    };

    const handleAISelectStyle = () => {
        setIsSelectingStyle(true);
        setIsAiStyle(true); // Enable AI mode for style
        const otherStyles = STYLES.filter(s => s.id !== selectedStyle);
        const randomStyle = otherStyles.length > 0
            ? otherStyles[Math.floor(Math.random() * otherStyles.length)]
            : STYLES[Math.floor(Math.random() * STYLES.length)];

        setTimeout(() => {
            setSelectedStyle(randomStyle.id);
            setIsSelectingStyle(false);
        }, 500);
    };

    return (
        <div className={`container ${styles.pageContainer}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sanal Dekorasyon</h1>
                <p className={styles.description}>
                    Boş odaları saniyeler içinde mobilyalandırın. Fotoğrafınızı yükleyin, oda tipini ve tarzını seçin.
                </p>
            </div>

            <div className={styles.workspace}>
                {result ? (
                    <div className={styles.resultArea}>
                        <ComparisonSlider beforeImage={result.before} afterImage={result.after} />
                        <div className={styles.actions}>
                            <button className={styles.downloadBtn}>Fotoğrafı İndir</button>
                            <button className={styles.resetBtn} onClick={handleReset}>Yeni Dekorasyon</button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.editorLayout}>
                        <div className={styles.uploadSection}>
                            {file ? (
                                <div className={styles.previewContainer}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={fileUrl || URL.createObjectURL(file)}
                                        alt="Preview"
                                        className={styles.previewImage}
                                    />
                                    <button
                                        className={styles.changeImageBtn}
                                        onClick={() => setFile(null)}
                                    >
                                        Değiştir
                                    </button>
                                </div>
                            ) : (
                                <ImageUploader onImageSelect={handleImageSelect} label="Boş Oda Fotoğrafı Yükle" />
                            )}
                        </div>

                        <div className={styles.controlsSection}>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Oda Tipi</label>
                                <div className={styles.roomGrid}>
                                    {ROOM_TYPES.map((room) => (
                                        <button
                                            key={room.id}
                                            className={`${styles.roomBtn} ${selectedRoom === room.id && !isAiRoom ? styles.selected : ''}`}
                                            onClick={() => {
                                                setSelectedRoom(room.id);
                                                setIsAiRoom(false);
                                            }}
                                        >
                                            <div className={styles.roomIcon}>{room.icon}</div>
                                            <span>{room.label}</span>
                                        </button>
                                    ))}
                                    <button
                                        className={`${styles.aiButton} ${isAiRoom ? styles.selected : ''}`}
                                        onClick={handleAIDetectRoom}
                                        disabled={isDetectingRoom}
                                    >
                                        <div className={styles.aiSparkle}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 3l1.45 4.45L18 9l-4.55 1.55L12 15l-1.45-4.45L6 9l4.55-1.55L12 3z" fill="currentColor" />
                                                <path d="M5 16l.65 1.85L7.5 18.5 5.65 19.15 5 21l-.65-1.85L2.5 18.5l1.85-.65L5 16z" fill="currentColor" />
                                                <path d="M19 16l.65 1.85L21.5 18.5l-1.85.65L19 21l-.65-1.85L16.5 18.5l1.85-.65L19 16z" fill="currentColor" />
                                            </svg>
                                        </div>
                                        {isDetectingRoom ? '...' : 'Yapay Zeka Seçsin'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Dekorasyon Tarzı</label>
                                <div className={styles.styleGrid}>
                                    {STYLES.map((style) => (
                                        <button
                                            key={style.id}
                                            className={`${styles.styleBtn} ${selectedStyle === style.id && !isAiStyle ? styles.selected : ''}`}
                                            onClick={() => {
                                                setSelectedStyle(style.id);
                                                setIsAiStyle(false);
                                            }}
                                        >
                                            <div className={styles.stylePreviewWrapper}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={style.image} alt={style.label} className={styles.stylePreviewImage} />
                                            </div>
                                            <div className={styles.styleIcon}>{style.icon}</div>
                                            <span>{style.label}</span>
                                        </button>
                                    ))}
                                    <button
                                        className={`${styles.aiButton} ${isAiStyle ? styles.selected : ''}`}
                                        onClick={handleAISelectStyle}
                                        disabled={isSelectingStyle}
                                    >
                                        <div className={styles.aiSparkle}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 3l1.45 4.45L18 9l-4.55 1.55L12 15l-1.45-4.45L6 9l4.55-1.55L12 3z" fill="currentColor" />
                                                <path d="M5 16l.65 1.85L7.5 18.5 5.65 19.15 5 21l-.65-1.85L2.5 18.5l1.85-.65L5 16z" fill="currentColor" />
                                                <path d="M19 16l.65 1.85L21.5 18.5l-1.85.65L19 21l-.65-1.85L16.5 18.5l1.85-.65L19 16z" fill="currentColor" />
                                            </svg>
                                        </div>
                                        {isSelectingStyle ? '...' : 'Yapay Zeka Seçsin'}
                                    </button>
                                </div>
                            </div>

                            <button
                                className={styles.generateBtn}
                                disabled={!file || isProcessing || (!selectedRoom && !isAiRoom) || (!selectedStyle && !isAiStyle)}
                                onClick={handleGenerate}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className={styles.spinnerSm}></span>
                                        Dekore Ediliyor...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
                                        </svg>
                                        Sanal Dekorasyon Oluştur
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
