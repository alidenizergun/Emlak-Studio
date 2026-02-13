"use client";

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import styles from './Stage.module.css';

const ROOM_TYPES = [
    { id: 'living_room', label: 'Oturma Odası' },
    { id: 'bedroom', label: 'Yatak Odası' },
    { id: 'kitchen', label: 'Mutfak' },
    { id: 'dining_room', label: 'Yemek Odası' },
    { id: 'office', label: 'Çalışma Odası' },
];

const STYLES = [
    { id: 'modern', label: 'Modern', image: '/styles/modern.jpg' },
    { id: 'scandinavian', label: 'İskandinav', image: '/styles/scandinavian.jpg' },
    { id: 'industrial', label: 'Endüstriyel', image: '/styles/industrial.jpg' },
    { id: 'bohemian', label: 'Bohem', image: '/styles/bohemian.jpg' },
    { id: 'luxury', label: 'Lüks', image: '/styles/luxury.jpg' },
];

export default function StageClient() {
    const [file, setFile] = useState<File | null>(null);
    const [selectedRoom, setSelectedRoom] = useState(ROOM_TYPES[0].id);
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDetectingRoom, setIsDetectingRoom] = useState(false);
    const [isSelectingStyle, setIsSelectingStyle] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string } | null>(null);

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('roomType', selectedRoom);
            formData.append('style', selectedStyle);

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
        setResult(null);
    };

    const handleAIDetectRoom = () => {
        if (!file) return;
        setIsDetectingRoom(true);
        // Simulate AI room detection
        setTimeout(() => {
            const randomRoom = ROOM_TYPES[Math.floor(Math.random() * ROOM_TYPES.length)];
            setSelectedRoom(randomRoom.id);
            setIsDetectingRoom(false);
        }, 1500);
    };

    const handleAISelectStyle = () => {
        if (!file) return;
        setIsSelectingStyle(true);
        // Simulate AI style recommendation
        setTimeout(() => {
            const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
            setSelectedStyle(randomStyle.id);
            setIsSelectingStyle(false);
        }, 1500);
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
                                        src={URL.createObjectURL(file)}
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
                                            className={`${styles.roomBtn} ${selectedRoom === room.id ? styles.active : ''}`}
                                            onClick={() => setSelectedRoom(room.id)}
                                        >
                                            {room.label}
                                        </button>
                                    ))}
                                    <button
                                        className={styles.aiButton}
                                        onClick={handleAIDetectRoom}
                                        disabled={!file || isDetectingRoom}
                                    >
                                        <svg className={styles.aiButtonIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                                        </svg>
                                        {isDetectingRoom ? 'Tespit Ediliyor...' : 'AI Tespit Etsin'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Dekorasyon Tarzı</label>
                                <div className={styles.styleGrid}>
                                    {STYLES.map((style) => (
                                        <button
                                            key={style.id}
                                            className={`${styles.styleBtn} ${selectedStyle === style.id ? styles.active : ''}`}
                                            onClick={() => setSelectedStyle(style.id)}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                    <button
                                        className={styles.aiButton}
                                        onClick={handleAISelectStyle}
                                        disabled={!file || isSelectingStyle}
                                    >
                                        <svg className={styles.aiButtonIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                                        </svg>
                                        {isSelectingStyle ? 'Seçiliyor...' : 'AI Seçsin'}
                                    </button>
                                </div>
                            </div>

                            <button
                                className={styles.generateBtn}
                                disabled={!file || isProcessing}
                                onClick={handleGenerate}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className={styles.spinnerSm}></span>
                                        Dekore Ediliyor...
                                    </>
                                ) : (
                                    'Sanal Dekorasyon Oluştur'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
