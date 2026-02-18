'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import styles from './RemoveObject.module.css';

export default function RemoveObjectClient() {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
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

    const handleRemove = async () => {
        if (!file) return;
        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/remove-object', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.imageUrl) {
                const beforeUrl = URL.createObjectURL(file);
                setResult({
                    before: beforeUrl,
                    after: data.imageUrl,
                });
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
    };

    const handleDownload = () => {
        if (!result?.after) return;
        const link = document.createElement('a');
        link.href = result.after;
        link.download = 'esya-silme-sonuc.jpg';
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
                    <h1 className={styles.title}>Akıllı Eşya Silme</h1>
                    <p className={styles.description}>
                        İstenmeyen eşyaları, dağınıklığı veya eski mobilyaları saniyeler içinde silin. Fotoğrafı yükleyin, yapay zeka seçtiğiniz alanları temizlesin.
                    </p>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection}>
                    {!file ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={(f) => handleImageSelect(f)}
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
                                    <img
                                        src={fileUrl || ''}
                                        alt="Önizleme"
                                        className={styles.previewImage}
                                    />
                                    <button
                                        type="button"
                                        className={styles.changeImageBtn}
                                        onClick={handleReset}
                                    >
                                        Farklı Görsel Seç
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.controlsSidebar}>
                    <div className={styles.panel}>
                        <div className={styles.panelTitle}>Nasıl çalışır?</div>
                        <div className={styles.tipBlock}>
                            <p>Fotoğrafı yükleyin ve <strong>Eşyayı Sil</strong> butonuna tıklayın. Yapay zeka görseldeki istenmeyen nesneleri (eşya, dağınıklık, eski mobilya) otomatik tespit edip temizler.</p>
                        </div>
                        <ul className={styles.tipList}>
                            <li>Emlak fotoğraflarından eşya veya kişi kaldırma</li>
                            <li>Dağınıklığı temizleme</li>
                            <li>Eski mobilyaları silme</li>
                        </ul>
                        <button
                            type="button"
                            className={styles.processBtn}
                            onClick={handleRemove}
                            disabled={!file || isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    Eşyayı Sil
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
