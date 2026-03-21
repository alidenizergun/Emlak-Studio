'use client';

import { useEffect, useMemo, useState } from 'react';
import ImageUploader, { type ImageValidationSummary } from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ValidationScorePopup from '@/components/ValidationScorePopup';
import { getStoredUserId } from '@/lib/client-auth';
import { estimateToolEtaSeconds, recordEtaSample } from '@/lib/client-eta';
import { useI18n } from '@/components/LanguageProvider';
import styles from './RemoveObject.module.css';
import { buildRemoveObjectPrompt, type RemoveMode } from './prompts';

export default function RemoveObjectClient() {
    const { t } = useI18n();
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [removePrompt, setRemovePrompt] = useState('');
    const [mode, setMode] = useState<RemoveMode>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string; runId: string } | null>(null);
    const [validationSummary, setValidationSummary] = useState<ImageValidationSummary | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isExampleOpen, setIsExampleOpen] = useState(false);
    const estimatedSeconds = useMemo(
        () =>
            estimateToolEtaSeconds({
                toolId: 'remove-object',
                inputBytes: file?.size,
                complexity: mode === 'prompt' ? 1.18 + Math.min(removePrompt.trim().length / 240, 0.28) : 1,
                fallbackSeconds: 55,
            }),
        [file?.size, mode, removePrompt]
    );

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
        setValidationSummary((current) => current);
    };

    const callRemoveApi = async (payload: { mode: RemoveMode; userPrompt?: string }) => {
        if (!file) return;
        const startedAt = Date.now();
        setIsProcessing(true);
        setResult(null);

        try {
            const userId = getStoredUserId();
            const formData = new FormData();
            formData.append('image', file);
            formData.append('mode', payload.mode);
            if (payload.userPrompt) formData.append('userPrompt', payload.userPrompt);
            formData.append('prompt', buildRemoveObjectPrompt(payload.mode, payload.userPrompt));
            formData.append('phone', userId);

            const response = await fetch('/api/remove-object', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.imageUrl) {
                recordEtaSample({
                    toolId: 'remove-object',
                    durationMs: Date.now() - startedAt,
                    success: true,
                    inputBytes: file.size,
                    complexity: payload.mode === 'prompt' ? 1.18 + Math.min((payload.userPrompt || '').length / 240, 0.28) : 1,
                });
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
                    runId: String(data.runId || ''),
                });
            } else {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert(t('Yetersiz kredi. Lütfen kredi yükleyin.'));
                    return;
                }
                alert(data.error ? t(data.error) : t('İşlem başarısız. Lütfen tekrar deneyin.'));
            }
        } catch (err) {
            console.error(err);
            alert(t('Bir hata oluştu. Lütfen tekrar deneyin.'));
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
        setRemovePrompt('');
        setMode('all');
        setResult(null);
        setValidationSummary(null);
    };

    const handleDownload = () => {
        if (!result?.after || !result?.runId) return;
        const link = document.createElement('a');
        link.href = `/api/stage/history-download?entryId=${encodeURIComponent(`remove-object:${result.runId}`)}&kind=after`;
        link.download = 'esya-silme-sonuc.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!mounted) {
        return (
            <div className={styles.pageContainer} style={{ textAlign: 'center', padding: '3rem' }}>
                {t('Yükleniyor...')}
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>{t('Akıllı Eşya Silme')}</h1>
                    <p className={styles.description}>
                        {t('İstenmeyen eşyaları, dağınıklığı veya eski mobilyaları saniyeler içinde silin.')}
                    </p>
                    <button type="button" className={styles.exampleLink} onClick={() => setIsExampleOpen(true)}>
                        {t('Örnekleri İnceleyin')}
                    </button>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection}>
                    {!file ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={(f) => handleImageSelect(f)}
                                onInvalidSelection={handleReset}
                                onValidationResult={setValidationSummary}
                                validationTool="remove-object"
                                label={t('Fotoğrafı Buraya Tıklayıp Yükleyin')}
                            />
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            {result ? (
                                <div style={{ width: '100%', height: '100%' }}>
                                    <ComparisonSlider
                                        beforeImage={result.before}
                                        afterImage={result.after}
                                        variant="hero"
                                    />
                                    <div className={styles.resultActions}>
                                        <button className={styles.downloadBtn} onClick={handleDownload}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            {t('İndir')}
                                        </button>
                                        <button className={styles.resetBtn} onClick={handleReset}>
                                            {t('Yeni Fotoğraf')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={fileUrl || ''}
                                        alt={t('Önizleme')}
                                        className={styles.previewImage}
                                    />
                                    <button
                                        type="button"
                                        className={styles.changeImageBtn}
                                        onClick={handleReset}
                                    >
                                        {t('Farklı Görsel Seç')}
                                    </button>
                                </>
                            )}
                            <ValidationScorePopup summary={validationSummary} />
                            <ProcessingOverlay active={isProcessing} estimatedSeconds={estimatedSeconds} />
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
                                    <span>{t('Tüm eşyaları sil')}</span>
                                    <span className={styles.modeCost}>{t('2 kredi')}</span>
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
                                    <span>{t('Belirli eşyaları aşağıdaki metne göre sil')}</span>
                                    <span className={styles.modeCost}>{t('2 kredi')}</span>
                                </span>
                            </label>
                        </div>

                        <div className={styles.promptBlock}>
                            <label htmlFor="remove-prompt" className={styles.promptLabel}>
                                {t('Silmek istediğiniz eşyayı yazın')}
                            </label>
                            <textarea
                                id="remove-prompt"
                                className={styles.promptInput}
                                placeholder={t('Örnek: koltuğu sil, televizyonu sil, halıyı sil')}
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
                                    {t('İşleniyor...')}
                                </>
                            ) : (
                                <>
                                    {t('Başlat')}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>

                        <div className={styles.panelTitle} style={{ marginTop: '2rem' }}>{t('Nasıl çalışır?')}</div>
                        <div className={styles.tipBlock}>
                            <p>
                                {t('Fotoğrafı yükleyin. Yukarıdan tüm eşyaları silme veya sadece belirli eşyaları metne göre silme seçeneğini işaretleyin, ardından Başlat butonuna tıklayın.')}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title={t('Akıllı Eşya Silme Örneği')}
                summary={t('Fotoğraftaki dağınıklık ve istenmeyen objeler korunacak alanlara zarar vermeden temizlenir.')}
                beforeSrc="/images/examples/pantry-before.png"
                afterSrc="/images/examples/pantry-after.png"
            />
        </div>
    );
}
