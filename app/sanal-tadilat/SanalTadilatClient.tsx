'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import styles from './SanalTadilat.module.css';

export default function SanalTadilatClient() {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [instructions, setInstructions] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
            if (result?.before) URL.revokeObjectURL(result.before);
        };
    }, [fileUrl, result]);

    const handleImageSelect = (selected: File) => {
        if (!selected) return;
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFile(selected);
        setFileUrl(URL.createObjectURL(selected));
        setResult(null);
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsProcessing(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('image', file);
            if (instructions.trim()) formData.append('instructions', instructions.trim());
            const response = await fetch('/api/sanal-tadilat', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success && data.imageUrl) {
                const beforeUrl = URL.createObjectURL(file);
                setResult({ before: beforeUrl, after: data.imageUrl });
            } else {
                alert(data.error || 'İşlem başarısız. Lütfen tekrar deneyin.');
            }
        } catch (err) {
            console.error(err);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        if (result?.before) URL.revokeObjectURL(result.before);
        setFile(null);
        setFileUrl(null);
        setResult(null);
        setInstructions('');
    };

    const handleDownload = () => {
        if (!result?.after) return;
        const link = document.createElement('a');
        link.href = result.after;
        link.download = 'sanal-tadilat-sonuc.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <h1 className={styles.title}>Sanal Tadilat</h1>
                    <div className={styles.costBadge}>2 kredi</div>
                    <p className={styles.description}>
                        Duvarları, zeminleri veya mutfakları tamamen yenileyin. Fotoğrafı yükleyin, yapay zeka tadilat sonrası görünümü oluştursun.
                    </p>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection}>
                    {!file ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                label="Fotoğrafı Buraya Tıklayıp Yükleyin"
                            />
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            {result ? (
                                <div style={{ width: '100%', height: '100%' }}>
                                    <ComparisonSlider
                                        beforeImage={result.before}
                                        afterImage={result.after}
                                    />
                                    <div className={styles.resultActions}>
                                        <button className={styles.downloadBtn} onClick={handleDownload}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            İndir
                                        </button>
                                        <button className={styles.resetBtn} onClick={handleReset}>
                                            Yeni Fotoğraf
                                        </button>
                                    </div>
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
                        <div className={styles.tadilatQuestionBlock}>
                            <label className={styles.tadilatQuestionLabel} htmlFor="sanal-tadilat-instructions">
                                Ne tür tadilat istiyorsunuz?
                            </label>
                            <textarea
                                id="sanal-tadilat-instructions"
                                className={styles.formTextarea}
                                placeholder="Örnek: Parkeler değişsin, duvarlar gri renge boyansın, mutfak dolapları yenilensin"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows={3}
                            />
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
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    Tadilatı Uygula
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                        <div className={styles.panelTitle} style={{ marginTop: '2rem' }}>Nasıl çalışır?</div>
                        <div className={styles.tipBlock}>
                            <p>Fotoğrafı yükleyin, nasıl bir tadilat istediğinizi yukarıdaki alana yazın ve <strong>Tadilatı Uygula</strong> butonuna basın.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
