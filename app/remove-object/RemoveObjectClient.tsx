'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import styles from './RemoveObject.module.css';
import { buildRemoveObjectPrompt, type RemoveMode } from './prompts';

export default function RemoveObjectClient() {
    const defaultRemovePrompt = 'Örnek: koltuğu sil, televizyonu sil, halıyı sil';
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [removePrompt, setRemovePrompt] = useState(defaultRemovePrompt);
    const [mode, setMode] = useState<RemoveMode>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string } | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isExampleOpen, setIsExampleOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        setRemovePrompt((prev) => {
            const trimmed = prev.trim();
            if (!trimmed) return defaultRemovePrompt;
            if (trimmed.startsWith('Örnek:') && trimmed !== defaultRemovePrompt) return defaultRemovePrompt;
            return prev;
        });
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

    const callRemoveApi = async (payload: { mode: RemoveMode; userPrompt?: string }) => {
        if (!file) return;
        setIsProcessing(true);
        setResult(null);

        try {
            const phone = window.localStorage.getItem('emlak_user_phone') || '';
            const formData = new FormData();
            formData.append('image', file);
            formData.append('mode', payload.mode);
            if (payload.userPrompt) formData.append('userPrompt', payload.userPrompt);
            formData.append('prompt', buildRemoveObjectPrompt(payload.mode, payload.userPrompt));
            formData.append('phone', phone);

            const response = await fetch('/api/remove-object', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.imageUrl) {
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                const beforeUrl = URL.createObjectURL(file);
                setResult({
                    before: beforeUrl,
                    after: data.imageUrl,
                });
            } else {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert('Yetersiz kredi. Lütfen kredi yükleyin.');
                    return;
                }
                alert(data.error || 'İşlem başarısız. Lütfen tekrar deneyin.');
            }
        } catch (err) {
            console.error(err);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveAll = () => callRemoveApi({ mode: 'all' });
    const handleRemoveWithPrompt = () => callRemoveApi({ mode: 'prompt', userPrompt: removePrompt.trim() });
    const handleProcess = () => {
        if (mode === 'all') {
            handleRemoveAll();
        } else {
            handleRemoveWithPrompt();
        }
    };

    const handleReset = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        if (result?.before) URL.revokeObjectURL(result.before);
        setFile(null);
        setFileUrl(null);
        setRemovePrompt(defaultRemovePrompt);
        setMode('all');
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
                        <button type="button" className={styles.exampleLink} onClick={() => setIsExampleOpen(true)}>
                            Örnek Gör
                        </button>
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
                        <div className={styles.modeGroup}>
                            <label
                                className={`${styles.modeOption} ${
                                    mode === 'all' ? styles.modeOptionActive : ''
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="remove-mode"
                                    value="all"
                                    checked={mode === 'all'}
                                    onChange={() => setMode('all')}
                                />
                                <span className={styles.modeText}>
                                    <span>Tüm eşyaları sil</span>
                                    <span className={styles.modeCost}>2 kredi</span>
                                </span>
                            </label>
                            <label
                                className={`${styles.modeOption} ${
                                    mode === 'prompt' ? styles.modeOptionActive : ''
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="remove-mode"
                                    value="prompt"
                                    checked={mode === 'prompt'}
                                    onChange={() => setMode('prompt')}
                                />
                                <span className={styles.modeText}>
                                    <span>Belirli eşyaları aşağıdaki metne göre sil</span>
                                    <span className={styles.modeCost}>2 kredi</span>
                                </span>
                            </label>
                        </div>

                        <div className={styles.promptBlock}>
                            <label htmlFor="remove-prompt" className={styles.promptLabel}>
                                Silmek istediğiniz eşyayı yazın
                            </label>
                            <textarea
                                id="remove-prompt"
                                className={styles.promptInput}
                                placeholder="Örnek: koltuğu sil, televizyonu sil, halıyı sil"
                                value={removePrompt}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setRemovePrompt(value);
                                    if (value.trim()) {
                                        setMode('prompt');
                                    }
                                }}
                                rows={3}
                                lang="tr"
                            />
                        </div>

                        <button
                            type="button"
                            className={styles.processBtn}
                            onClick={handleProcess}
                            disabled={
                                !file ||
                                isProcessing ||
                                (mode === 'prompt' && !removePrompt.trim())
                            }
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

                        <div className={styles.panelTitle} style={{ marginTop: '2rem' }}>Nasıl çalışır?</div>
                        <div className={styles.tipBlock}>
                            <p>
                                Fotoğrafı yükleyin. Yukarıdan tüm eşyaları silme veya sadece belirli eşyaları metne göre silme
                                seçeneğini işaretleyin, ardından <strong>Eşyayı Sil</strong> butonuna tıklayın.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title="Akıllı Eşya Silme Örneği"
                summary="Fotoğraftaki dağınıklık ve istenmeyen objeler korunacak alanlara zarar vermeden temizlenir."
                beforeSrc="/images/examples/pantry-before.png"
                afterSrc="/images/examples/pantry-after.png"
            />
        </div>
    );
}
