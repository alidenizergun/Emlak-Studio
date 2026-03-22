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
import styles from './SanalTadilat.module.css';

export default function SanalTadilatClient() {
    const { t } = useI18n();
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [instructions, setInstructions] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string; runId: string } | null>(null);
    const [validationSummary, setValidationSummary] = useState<ImageValidationSummary | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isExampleOpen, setIsExampleOpen] = useState(false);
    const estimatedSeconds = useMemo(
        () =>
            estimateToolEtaSeconds({
                toolId: 'virtual-renovation',
                inputBytes: file?.size,
                complexity: 1.06 + Math.min(instructions.trim().length / 360, 0.34),
                fallbackSeconds: 70,
            }),
        [file?.size, instructions]
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

    const handleGenerate = async () => {
        if (!file) return;
        const startedAt = Date.now();
        setIsProcessing(true);
        setResult(null);
        try {
            const userId = getStoredUserId();
            const formData = new FormData();
            formData.append('image', file);
            if (instructions.trim()) formData.append('instructions', instructions.trim());
            formData.append('phone', userId);
            const response = await fetch('/api/sanal-tadilat', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success && data.imageUrl) {
                recordEtaSample({
                    toolId: 'virtual-renovation',
                    durationMs: Date.now() - startedAt,
                    success: true,
                    inputBytes: file.size,
                    complexity: 1.06 + Math.min(instructions.trim().length / 360, 0.34),
                });
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                const beforeUrl = URL.createObjectURL(file);
                setResult({ before: beforeUrl, after: data.imageUrl, runId: String(data.runId || '') });
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

    const handleReset = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        if (result?.before) URL.revokeObjectURL(result.before);
        setFile(null);
        setFileUrl(null);
        setResult(null);
        setInstructions('');
        setValidationSummary(null);
    };

    const handleDownload = () => {
        if (!result?.after || !result?.runId) return;
        const link = document.createElement('a');
        link.href = `/api/stage/history-download?entryId=${encodeURIComponent(`virtual-renovation:${result.runId}`)}&kind=after`;
        link.download = 'sanal-tadilat-sonuc.jpg';
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
                    <h1 className={styles.title}>{t('Sanal Tadilat')}</h1>
                    <p className={styles.description}>
                        {t('Duvarları, zeminleri veya mutfakları tamamen yenileyin. Fotoğrafı yükleyin, yapay zeka tadilat sonrası görünümü oluştursun.')}
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
                                onImageSelect={handleImageSelect}
                                onInvalidSelection={handleReset}
                                onValidationResult={setValidationSummary}
                                validationTool="virtual-renovation"
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
                                    <img src={fileUrl || ''} alt={t('Önizleme')} className={styles.previewImage} />
                                    <button type="button" className={styles.changeImageBtn} onClick={handleReset}>
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
                        <div className={styles.panelTitleRow}>
                            <div className={styles.panelTitle}>{t('Sanal Tadilat')}</div>
                            <span className={styles.inlineCost}>{t('2 kredi')}</span>
                        </div>
                        <div className={styles.tadilatQuestionBlock}>
                            <label className={styles.tadilatQuestionLabel} htmlFor="sanal-tadilat-instructions">
                                {t('Ne tür tadilat istiyorsunuz?')}
                            </label>
                            <textarea
                                id="sanal-tadilat-instructions"
                                className={styles.formTextarea}
                                placeholder={t('Örnek: Parkeler değişsin, duvarlar gri renge boyansın, mutfak dolapları yenilensin')}
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
                            <p>{t('Fotoğrafı yükleyin, nasıl bir tadilat istediğinizi yukarıdaki alana yazın ve Başlat butonuna basın.')}</p>
                        </div>
                    </div>
                </div>
            </div>
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title={t('Sanal Tadilat Örneği')}
                summary={t('Eski görünümlü alanlar, yeni malzeme ve modern yüzeylerle tadilat sonrası hale dönüştürülür.')}
                beforeSrc="/images/examples/kitchen-empty.png"
                afterSrc="/images/examples/kitchen-furnished.png"
            />
        </div>
    );
}
