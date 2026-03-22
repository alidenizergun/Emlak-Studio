"use client";

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import ImageUploader, { type ImageValidationSummary } from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ValidationScorePopup from '@/components/ValidationScorePopup';
import UploadGuidancePanel from '@/components/UploadGuidancePanel';
import { getStoredUserId } from '@/lib/client-auth';
import { estimateToolEtaSeconds, recordEtaSample } from '@/lib/client-eta';
import { useI18n } from '@/components/LanguageProvider';
import styles from './Enhance.module.css';

type EnhanceProcessingMode = 'ai' | 'ai_cached' | 'fallback_local';
type EnhanceFallbackReason = 'architecture' | 'quality' | 'black_output' | 'provider_timeout' | 'provider_error';

interface EnhanceResultState {
    before: string;
    after: string;
    runId: string;
    processingMode?: EnhanceProcessingMode;
    fallbackReason?: EnhanceFallbackReason;
    appliedOptionsResolved?: string[];
    qualityMetrics?: {
        architectureScore?: number;
        contractScore?: number;
        outputScore?: number;
    };
}

export default function EnhanceClient() {
    const { t } = useI18n();
    const pathname = usePathname();
    const isInStudio = pathname === '/studio';
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [result, setResult] = useState<EnhanceResultState | null>(null);
    const [validationSummary, setValidationSummary] = useState<ImageValidationSummary | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorText, setErrorText] = useState('');
    const [infoText, setInfoText] = useState('');
    const [isExampleOpen, setIsExampleOpen] = useState(false);
    const selectedOptionCount = useMemo(
        () => Object.values(selectedOptions).filter(Boolean).length || (selectedOptions.auto ? 1 : 0),
        [selectedOptions]
    );
    const estimatedSeconds = useMemo(
        () =>
            estimateToolEtaSeconds({
                toolId: 'enhance',
                inputBytes: file?.size,
                complexity: 1 + selectedOptionCount * 0.12 + (selectedOptions.auto ? 0.08 : 0),
                fallbackSeconds: 40,
            }),
        [file?.size, selectedOptionCount, selectedOptions]
    );

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setFileUrl(URL.createObjectURL(selectedFile));
        setResult(null);
        setValidationSummary((current) => current);
        setErrorText('');
        setInfoText('');
    };

    const handleReset = () => {
        setFile(null);
        setFileUrl(null);
        setResult(null);
        setValidationSummary(null);
        setErrorText('');
        setInfoText('');
    };

    const toggleOption = (id: string) => {
        if (isProcessing) return;

        setSelectedOptions(prev => {
            const isSelected = !prev[id];
            if (id === 'auto') {
                return isSelected ? { 'auto': true } : {};
            }
            // If selecting manual option, deselect auto
            const newOptions = { ...prev, [id]: isSelected };
            if (isSelected) delete newOptions['auto'];
            return newOptions;
        });
    };

    const handleProcess = async () => {
        if (!file) return;
        const startedAt = Date.now();
        setIsProcessing(true);
        setErrorText('');
        setInfoText('');
        try {
            const userId = getStoredUserId();
            if (!userId) {
                setErrorText(t('Oturum bulunamadı. Lütfen tekrar giriş yapın.'));
                alert(t('Oturum bulunamadı. Lütfen tekrar giriş yapın.'));
                return;
            }
            const formData = new FormData();
            formData.append('image', file);
            formData.append('options', JSON.stringify(selectedOptions));
            formData.append('phone', userId);

            const response = await fetch('/api/enhance', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                recordEtaSample({
                    toolId: 'enhance',
                    durationMs: Date.now() - startedAt,
                    success: true,
                    inputBytes: file.size,
                    complexity: 1 + selectedOptionCount * 0.12 + (selectedOptions.auto ? 0.08 : 0),
                });
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                if (data.notice) setInfoText(String(data.notice));
                const before = fileUrl || URL.createObjectURL(file);
                setResult({
                    before,
                    after: data.imageUrl,
                    runId: String(data.runId || ''),
                    processingMode: data.processingMode,
                    fallbackReason: data.fallbackReason,
                    appliedOptionsResolved: Array.isArray(data.appliedOptionsResolved) ? data.appliedOptionsResolved : undefined,
                    qualityMetrics: data.qualityMetrics,
                });
            } else {
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                const reason = String(data?.error ? t(data.error) : `${t('İşlem başarısız oldu')} (HTTP ${response.status}).`);
                setErrorText(reason);
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert(t('Yetersiz kredi. Lütfen kredi yükleyin.'));
                } else if (data?.refundApplied) {
                    alert(data?.refundMessage || `${reason}\n${t('Kredi iade edildi.')}`);
                } else if (data?.creditCharged === false) {
                    alert(`${reason}\n${t('Kredi düşülmedi.')}`);
                } else {
                    alert(reason);
                }
            }
        } catch (error) {
            console.error('Enhance error:', error);
            setErrorText(t('Bir hata oluştu. Lütfen tekrar deneyin.'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.after || !result?.runId) return;
        const link = document.createElement('a');
        link.href = `/api/stage/history-download?entryId=${encodeURIComponent(`enhance:${result.runId}`)}&kind=after`;
        link.download = 'gelistirilmis-fotograf.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasFile = Boolean(file);
    const appliedOptionLabels = result?.appliedOptionsResolved?.map((id) => t(OPTION_LABELS[id] || id)) || [];
    const showLimitedChangeHint = Boolean(result?.qualityMetrics?.outputScore !== undefined && result.qualityMetrics.outputScore < 0.58);

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerMain}>
                        <h1 className={styles.title}>{t('Fotoğraf Geliştirme')}</h1>
                        <p className={styles.description}>
                            {t('Studio Estate fotoğraflarınızı analiz eder; ışık, renk dengesi, netlik ve genel sunum kalitesini iyileştirir. Karanlık veya düşük etkili kareleri daha temiz, daha profesyonel ve listeleme için daha güçlü görsellere dönüştürür.')}
                        </p>
                        <button type="button" className={styles.exampleLink} onClick={() => setIsExampleOpen(true)}>
                            {t('Örnekleri Gör')}
                        </button>
                    </div>
                    <UploadGuidancePanel />
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection} style={{ position: 'relative' }}>
                    {!hasFile ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                onInvalidSelection={handleReset}
                                onValidationResult={setValidationSummary}
                                validationTool="enhance"
                                showGuidance={false}
                                label={t('Fotoğrafı Buraya Tıklayıp Yükleyin')}
                            />
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            {result ? (
                                <>
                                    <div className={styles.resultMetaBar}>
                                        <span
                                            className={`${styles.processingModeBadge} ${
                                                result.processingMode === 'fallback_local' ? styles.processingModeFallback : styles.processingModeAi
                                            }`}
                                        >
                                            {result.processingMode === 'fallback_local' ? t('Güvenli Fallback') : t('AI Çıktısı')}
                                        </span>
                                        {appliedOptionLabels.length > 0 ? (
                                            <span className={styles.appliedOptionsMini}>
                                                {t('Uygulanan ayarlar: {labels}').replace('{labels}', appliedOptionLabels.join(', '))}
                                            </span>
                                        ) : null}
                                    </div>
                                    <ComparisonSlider beforeImage={result.before} afterImage={result.after} variant="hero" />
                                    {showLimitedChangeHint ? (
                                        <div className={styles.limitedChangeHint}>{t('Bu fotoğrafta değişim sınırlı olabilir.')}</div>
                                    ) : null}
                                    <ValidationScorePopup summary={validationSummary} />
                                    {infoText ? <div className={styles.infoText}>{infoText}</div> : null}
                                    <div className={styles.resultActions}>
                                        <button className={styles.downloadBtn} onClick={handleDownload}>
                                            {t('İndir')}
                                        </button>
                                        <button className={styles.resetBtn} onClick={handleReset}>{t('Yeni Fotoğraf')}</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={fileUrl || ''} alt={t('Önizleme')} className={styles.previewImage} />
                                    <button className={styles.changeImageBtn} onClick={handleReset}>
                                        {t('Farklı Görsel Seç')}
                                    </button>
                                </>
                            )}
                            {errorText ? <div className={styles.itemErrorText}>{errorText}</div> : null}
                        </div>
                    )}
                    <ProcessingOverlay active={isProcessing} estimatedSeconds={estimatedSeconds} />
                </div>

                <div className={styles.controlsSidebar}>
                    <div className={styles.panel}>
                        <div className={styles.optionsList}>
                            {/* Manual Options First */}
                            {OPTIONS.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`${styles.optionItem} ${selectedOptions[opt.id] ? styles.active : ''}`}
                                    onClick={() => toggleOption(opt.id)}
                                >
                                    <div className={styles.checkbox}>
                                        {selectedOptions[opt.id] && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        )}
                                    </div>
                                    <div className={styles.optionText}>
                                        <div className={styles.optionNameRow}>
                                            <span className={styles.optionName}>{t(opt.label)}</span>
                                            <span className={styles.optionCost}>{t(opt.creditCost)}</span>
                                        </div>
                                        <span className={styles.optionDesc}>{t(opt.desc)}</span>
                                    </div>
                                    <div className={styles.optionIcon}>{opt.icon}</div>
                                </div>
                            ))}

                            {/* Auto Option Last */}
                            <div
                                className={`${styles.optionItem} ${selectedOptions['auto'] ? styles.active : ''}`}
                                onClick={() => toggleOption('auto')}
                            >
                                <div className={styles.checkbox}>
                                    {selectedOptions['auto'] && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                </div>
                                <div className={styles.optionText}>
                                    <div className={styles.optionNameRow}>
                                        <span className={styles.optionName}>{t('Studio Estate Seçsin')}</span>
                                        <span className={styles.optionCost}>{t('5 kredi')}</span>
                                    </div>
                                    <span className={styles.optionDesc}>{t('Studio Estate en iyi ayarları seçsin')}</span>
                                </div>
                                <div className={styles.optionIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="yzSparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#059669" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M12 2L14.5 9L22 11.5L14.5 14L12 21L9.5 14L2 11.5L9.5 9L12 2Z" fill="url(#yzSparkleGradient)" />
                                        <path d="M19 16L19.75 18.25L22 19L19.75 19.75L19 22L18.25 19.75L16 19L18.25 18.25L19 16Z" fill="url(#yzSparkleGradient)" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button
                            className={`${styles.processBtn} ${isInStudio ? styles.processBtnInStudio : ''}`}
                            onClick={handleProcess}
                            disabled={isProcessing || !hasFile || selectedOptionCount === 0}
                        >
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    {t('İşleniyor...')}
                                </>
                            ) : (
                                <>
                                    {t('Başlat')}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title={t('Fotoğraf Geliştirme Örneği')}
                summary={t('Işık, renk dengesi ve netlik yapay zeka ile optimize edilir.')}
                beforeSrc="/images/examples/living-empty.png"
                afterSrc="/images/examples/living-furnished.png"
            />
        </div>
    );
}

const OPTIONS = [
    {
        id: 'lighting',
        label: 'Işık Düzeltme',
        creditCost: '1 kredi',
        desc: 'Karanlık alanları aydınlatır',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
    },
    {
        id: 'color',
        label: 'Renk Canlandırma',
        creditCost: '1 kredi',
        desc: 'Solgun renkleri düzeltir',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 2.69l5.74 5.74c3.04 3.04 3.04 7.96 0 11a7.8 7.8 0 0 1-11.48 0c-3.04-3.04-3.04-7.96 0-11L12 2.69z" /></svg>
    },
    {
        id: 'sharpness',
        label: 'Ultra Netlik',
        creditCost: '1 kredi',
        desc: 'Bulanıklığı giderir',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
    },
    {
        id: 'clean',
        label: 'Oda Temizliği',
        creditCost: '1 kredi',
        desc: 'Leke ve kirleri temizler',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
            >
                {/* Sap */}
                <path d="M11 3v7" />
                {/* Fırça başı */}
                <path d="M7 14h10l-2 5H9l-2-5Z" />
                {/* Zemin */}
                <path d="M3 21h18" />
                {/* Parıltılar */}
                <path d="M5 7l1 1-1 1-1-1 1-1Z" />
                <path d="M18 6l1 1-1 1-1-1 1-1Z" />
            </svg>
        )
    },
    {
        id: 'sky',
        label: 'Mavi Gökyüzü',
        creditCost: '1 kredi',
        desc: 'Bulutlu havayı güneşe çevirir',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M17.5 19c0-1.7-1.3-3-3-3c-.4 0-.7.1-1 .3c-.4-2.2-2.3-3.8-4.5-3.8c-2.5 0-4.5 2-4.5 4.5c0 .2 0 .4.1.6c-1.6.4-2.6 1.9-2.6 3.4" /><circle cx="12" cy="5" r="3" /></svg>
    },
    {
        id: 'twilight',
        label: 'Gün Batımı Modu',
        creditCost: '1 kredi',
        desc: 'Büyüleyici akşam ışıkları',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
            >
                {/* Ufuk çizgisi */}
                <path d="M3 17h18" />
                {/* Yarım güneş */}
                <path d="M6 17a6 6 0 0 1 12 0" />
                {/* Işınlar */}
                <path d="M12 7V4" />
                <path d="M8 9l-1.5-1.5" />
                <path d="M16 9l1.5-1.5" />
            </svg>
        )
    },
    {
        id: 'privacy',
        label: 'Gizlilik Mozaiği',
        creditCost: '1 kredi',
        desc: 'Özel fotoğraflar ve yüzleri blurlar',
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
            >
                {/* Mozaik kareler */}
                <rect x="3" y="4" width="7" height="6" rx="1" />
                <rect x="14" y="4" width="7" height="6" rx="1" />
                <rect x="3" y="14" width="7" height="6" rx="1" />
                <rect x="14" y="14" width="7" height="6" rx="1" />
            </svg>
        )
    }
];

const OPTION_LABELS: Record<string, string> = {
    auto: 'Studio Estate Seçsin',
    lighting: 'Işık Düzeltme',
    color: 'Renk Canlandırma',
    sharpness: 'Ultra Netlik',
    clean: 'Oda Temizliği',
    privacy: 'Gizlilik Mozaiği',
    sky: 'Mavi Gökyüzü',
    twilight: 'Gün Batımı Modu',
};
