"use client";

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import styles from './Enhance.module.css';

export default function EnhanceClient() {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string } | null>(null);

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setIsProcessing(false);
        setResult(null);
        setSelectedOptions({});
    };

    const toggleOption = (id: string) => {
        if (selectedOptions['auto']) return; // Prevent selection if auto is active
        setSelectedOptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('options', JSON.stringify(selectedOptions));

            const response = await fetch('/api/enhance', {
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
            console.error('Enhance error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAutoFix = () => {
        const isAuto = selectedOptions['auto'];
        if (isAuto) {
            setSelectedOptions({});
        } else {
            setSelectedOptions({ 'auto': true });
        }
    };

    return (
        <div className={`container ${styles.pageContainer}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Fotoğraf Geliştirme</h1>
                <p className={styles.description}>
                    Karanlık, solgun veya düşük çözünürlüklü fotoğrafları saniyeler içinde 4K kalitesine yükseltin.
                </p>
            </div>

            <div className={styles.workspace}>
                {result ? (
                    <div className={styles.resultArea}>
                        <ComparisonSlider beforeImage={result.before} afterImage={result.after} />
                        <div className={styles.actions}>
                            <button className={styles.downloadBtn}>Fotoğrafı İndir</button>
                            <button className={styles.resetBtn} onClick={() => {
                                setFile(null);
                                setResult(null);
                            }}>Yeni Fotoğraf Yükle</button>
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
                                <ImageUploader onImageSelect={handleImageSelect} label="Geliştirilecek Fotoğrafı Seçin" />
                            )}
                        </div>

                        <div className={styles.controlsSection}>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Geliştirme Seçenekleri</label>
                                <div className={styles.optionsGrid}>
                                    {OPTIONS.map(option => (
                                        <button
                                            key={option.id}
                                            className={`${styles.optionCard} ${selectedOptions[option.id] ? styles.active : ''}`}
                                            onClick={() => toggleOption(option.id)}
                                            disabled={selectedOptions['auto']}
                                            style={{ opacity: selectedOptions['auto'] ? 0.5 : 1, cursor: selectedOptions['auto'] ? 'not-allowed' : 'pointer' }}
                                        >
                                            <div className={styles.optionIcon}>{option.icon}</div>
                                            <span className={styles.optionLabel}>{option.label}</span>
                                            <div className={styles.checkbox}>
                                                {selectedOptions[option.id] && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}

                                    {/* Auto Fix Button as Grid Item */}
                                    <button
                                        className={`${styles.optionCard} ${styles.autoOption} ${selectedOptions['auto'] ? styles.active : ''}`}
                                        onClick={handleAutoFix}
                                    >
                                        <div className={styles.optionIcon}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem', flex: 1 }}>
                                            <span className={styles.optionLabel}>Otomatik İyileştir</span>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400, lineHeight: 1.5 }}>
                                                Işık, renk ve netlik ayarları yapılıp varsa kirler temizlenir. Yapay zeka tespit ettiği diğer hataları da düzeltir.
                                            </span>
                                        </div>
                                        <div className={styles.checkbox}>
                                            {selectedOptions['auto'] && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <button
                                className={styles.processBtn}
                                onClick={handleProcess}
                                disabled={!file || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className={styles.spinnerSm}></div>
                                        İşleniyor...
                                    </>
                                ) : (
                                    'Seçilenleri Uygula'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

const OPTIONS = [
    {
        id: 'lighting',
        label: 'Işığı Düzelt',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
        )
    },
    {
        id: 'color',
        label: 'Renkleri Canlandır',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.74 5.74c3.04 3.04 3.04 7.96 0 11a7.8 7.8 0 0 1-11.48 0c-3.04-3.04-3.04-7.96 0-11L12 2.69z" />
                <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
        )
    },
    {
        id: 'sharpness',
        label: 'Netleştir',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        )
    },
    {
        id: 'clean',
        label: 'Kirleri Temizle',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 12l-6-6-6 6a3 3 0 0 0 0 4.24l.76.76a3 3 0 0 0 4.24 0L12 16" />
                <path d="M6 13l6 6" />
                <path d="M17 22h5" />
            </svg>
        )
    }
];
