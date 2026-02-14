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
        setSelectedOptions(prev => {
            const isSelected = !prev[id];

            if (isSelected) {
                // If selecting, remove 'auto' and set the new option
                const { auto, ...others } = prev;
                return { ...others, [id]: true };
            } else {
                // If deselecting, just update the value
                return { ...prev, [id]: false };
            }
        });
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
                                        /* Force Update */
                                        onClick={handleAutoFix}
                                    >
                                        <div className={styles.optionIcon}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="4" x2="4" y1="21" y2="14" />
                                                <line x1="4" x2="4" y1="10" y2="3" />
                                                <line x1="12" x2="12" y1="21" y2="12" />
                                                <line x1="12" x2="12" y1="8" y2="3" />
                                                <line x1="20" x2="20" y1="21" y2="16" />
                                                <line x1="20" x2="20" y1="12" y2="3" />
                                                <line x1="2" x2="6" y1="14" y2="14" />
                                                <line x1="10" x2="14" y1="8" y2="8" />
                                                <line x1="18" x2="22" y1="16" y2="16" />
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
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M6.34 17.66l-1.41 1.41" />
                <path d="M19.07 4.93l-1.41 1.41" />
            </svg>
        )
    },
    {
        id: 'color',
        label: 'Renkleri Canlandır',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.74 5.74c3.04 3.04 3.04 7.96 0 11a7.8 7.8 0 0 1-11.48 0c-3.04-3.04-3.04-7.96 0-11L12 2.69z" />
                <path d="M8.7 8.5c1.6 0 2.9 1.3 2.9 2.9" />
                <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
        )
    },
    {
        id: 'sharpness',
        label: 'Netleştir',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        )
    },
    {
        id: 'clean',
        label: 'Kirleri Temizle',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                <path d="m5 11 6 6" />
                <path d="m12 13-4-4" />
            </svg>
        )
    }
];
