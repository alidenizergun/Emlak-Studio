'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import styles from './AiTourGuide.module.css';

export default function AiTourGuideClient() {
    const SCRIPT_MAX_LENGTH = 150;

    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [scriptText, setScriptText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
        };
    }, [fileUrl]);

    const handleImageSelect = (selected: File) => {
        if (!selected) return;
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFile(selected);
        setFileUrl(URL.createObjectURL(selected));
        setSubmitted(false);
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsProcessing(true);
        setSubmitted(false);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('script', scriptText.trim().slice(0, SCRIPT_MAX_LENGTH));
            await fetch('/api/ai-tour-guide', { method: 'POST', body: formData });
            setSubmitted(true);
        } catch {
            setSubmitted(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFile(null);
        setFileUrl(null);
        setScriptText('');
        setSubmitted(false);
    };

    if (!mounted) {
        return (
            <div className={styles.pageContainer} style={{ textAlign: 'center', padding: '3rem' }}>
                Yükleniyor...
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Yapay Zeka Sunucusu</h1>
                    <div className={styles.costBadge}>10 kredi</div>
                    <p className={styles.description}>
                        Mülk fotoğraflarınızı yükleyin. Yapay zeka sunucusu evi gezer, yukarıda girdiğiniz bilgileri sesli ve videolu şeklinde sunar.
                    </p>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection}>
                    {!file ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                label="Fotoğrafları Buraya Tıklayıp Yükleyin"
                            />
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            {submitted ? (
                                <div className={styles.resultMessage}>
                                    <div className={styles.resultIcon}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                    <h3>Tur talebiniz alındı</h3>
                                    <p>Yapay zeka sunucusu ile sanal tur oluşturma özelliği yakında eklenecek.</p>
                                    <button type="button" className={styles.resetBtn} onClick={handleReset}>
                                        Yeni Yükleme
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={fileUrl || ''} alt="Önizleme" className={styles.previewImage} />
                                    <button type="button" className={styles.changeImageBtn} onClick={handleReset}>
                                        Farklı Görsel Seç
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.controlsSidebar}>
                    <div className={styles.panel}>
                        <div className={styles.scriptField}>
                            <label htmlFor="ai-script" className={styles.scriptLabel}>
                                Videoda söylenecek metin
                            </label>
                            <textarea
                                id="ai-script"
                                className={styles.scriptInput}
                                placeholder="Örnek: Bu mülk geniş salonu, aydınlık mutfağı ve ferah balkonu ile dikkat çekiyor. Konumu ve ulaşım imkânlarıyla değerlendirmeye değer bir seçenek."
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value.slice(0, SCRIPT_MAX_LENGTH))}
                                maxLength={SCRIPT_MAX_LENGTH}
                                rows={3}
                                lang="tr"
                                spellCheck
                            />
                            <span className={styles.scriptCounter}>{scriptText.length}/{SCRIPT_MAX_LENGTH}</span>
                        </div>
                        <button
                            type="button"
                            className={styles.processBtn}
                            onClick={handleGenerate}
                            disabled={!file || isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    Hazırlanıyor...
                                </>
                            ) : (
                                <>
                                    Tur Oluştur
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                        <div className={styles.panelTitle} style={{ marginTop: '2rem' }}>Nasıl çalışır?</div>
                        <div className={styles.tipBlock}>
                            <p>Mülk fotoğraflarınızı yükleyin. Yapay zeka sunucusu evi gezer, yukarıda girdiğiniz bilgileri sesli ve videolu şeklinde sunar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
