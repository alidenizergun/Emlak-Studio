'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import { useI18n } from '@/components/LanguageProvider';
import { getStoredUserId } from '@/lib/client-auth';
import styles from './AiTourGuide.module.css';

interface TourResult {
    runId: string;
    script: string;
    videoUrl: string;
    durationSeconds: number;
    qualityScore: number | null;
    qualityIssues: string[];
}

function isImageLikeUrl(url: string): boolean {
    const value = String(url || '').toLowerCase();
    return value.startsWith('data:image/') || /\.(png|jpg|jpeg|webp|gif)(\?|$)/.test(value);
}

export default function AiTourGuideClient() {
    const { t } = useI18n();
    const SCRIPT_MAX_LENGTH = 280;

    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [scriptText, setScriptText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<TourResult | null>(null);
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sent'>('idle');
    const [mounted, setMounted] = useState(false);
    const [isExampleOpen, setIsExampleOpen] = useState(false);

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
        setResult(null);
        setFeedbackStatus('idle');
    };

    const runGenerate = async (scriptOverride?: string) => {
        if (!file) return;

        setIsProcessing(true);
        setResult(null);
        setFeedbackStatus('idle');
        try {
            const phone = getStoredUserId();
            const formData = new FormData();
            formData.append('image', file);
            const payloadScript = typeof scriptOverride === 'string' ? scriptOverride : scriptText;
            formData.append('script', payloadScript.trim().slice(0, SCRIPT_MAX_LENGTH));
            formData.append('phone', phone);

            const response = await fetch('/api/ai-tour-guide', { method: 'POST', body: formData });
            const data = await response.json();

            if (!response.ok || !data.success) {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert('Yetersiz kredi. Lütfen kredi satın alın.');
                    return;
                }
                throw new Error(data?.error || 'Video üretimi başarısız.');
            }

            if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                window.localStorage.setItem('emlak_credits', String(data.credits));
                window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                    detail: { credits: data.credits },
                }));
            }

            setResult({
                runId: String(data.runId || ''),
                script: String(data.generatedScript || ''),
                videoUrl: String(data.videoUrl || ''),
                durationSeconds: Number(data.durationSeconds || 9),
                qualityScore: typeof data.qualityScore === 'number' ? data.qualityScore : null,
                qualityIssues: Array.isArray(data.qualityIssues)
                    ? data.qualityIssues.map((x: unknown) => String(x))
                    : [],
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu. Lütfen tekrar deneyin.';
            alert(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerate = async () => {
        await runGenerate();
    };

    const handleReset = () => {
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        setFile(null);
        setFileUrl(null);
        setScriptText('');
        setResult(null);
        setFeedbackStatus('idle');
    };

    const sendFeedback = async (verdict: 'good' | 'bad', note = '') => {
        if (!result?.runId) return;
        const phone = getStoredUserId();
        if (!phone) return;
        try {
            const response = await fetch('/api/ai-tour-guide/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId: result.runId,
                    phone,
                    verdict,
                    note,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Geri bildirim gönderilemedi');
            }
            setFeedbackStatus('sent');
        } catch (err) {
            console.error(err);
        }
    };

    const handleImproveAgain = async () => {
        if (!result?.script) return;
        await sendFeedback('bad', 'Sunucu hareketi ve anlatımı daha doğal olsun');
        const nextScript = result.script.slice(0, SCRIPT_MAX_LENGTH);
        setScriptText(nextScript);
        await runGenerate(nextScript);
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
                    <h1 className={styles.title}>{t('Sanal Sunucu')}</h1>
                    <p className={styles.description}>
                        {t('Tek bir mülk fotoğrafından kısa, sunuculu bir video akışı oluşturun. Anlatım metni ve görsel sunum birlikte çalışarak ilanı daha dikkat çekici, daha anlaşılır ve daha paylaşılabilir bir formata taşır.')}
                    </p>
                    <button type="button" className={styles.exampleLink} onClick={() => setIsExampleOpen(true)}>
                        {t('Örnekleri Gör')}
                    </button>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.gallerySection}>
                    {!file ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                label="Tek fotoğraf yükleyin"
                                subtext="veya sürükleyip bırakın (en fazla 1 fotoğraf)"
                            />
                        </div>
                    ) : (
                        <div className={styles.previewContainer}>
                            {result?.videoUrl ? (
                                <div className={styles.videoResultWrap}>
                                    {isImageLikeUrl(result.videoUrl) ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={result.videoUrl} className={styles.tourVideo} alt="Sanal sunucu önizleme" />
                                            <div className={styles.resultMetaRow}>
                                                <span className={styles.resultMetaBadge}>Gemini geçiş modu: video yerine görsel önizleme üretildi</span>
                                            </div>
                                        </>
                                    ) : (
                                        <video
                                            src={result.videoUrl}
                                            className={styles.tourVideo}
                                            controls
                                            playsInline
                                            preload="metadata"
                                        />
                                    )}
                                    <div className={styles.resultMetaRow}>
                                        <span className={styles.resultMetaBadge}>Video süresi: {result.durationSeconds} sn</span>
                                        {result.qualityScore !== null ? (
                                            <span className={styles.resultMetaBadge}>Metin kalite skoru: {(result.qualityScore * 100).toFixed(0)}%</span>
                                        ) : null}
                                    </div>
                                    <div className={styles.generatedBox}>
                                        <div className={styles.generatedHeader}>
                                            <strong>Kullanılan Anlatım Metni</strong>
                                        </div>
                                        <p>{result.script}</p>
                                        {result.qualityIssues.length > 0 ? (
                                            <div className={styles.qualityIssues}>{result.qualityIssues.join(' • ')}</div>
                                        ) : null}
                                    </div>
                                    <div className={styles.feedbackActions}>
                                        <button type="button" className={styles.downloadBtn} onClick={() => sendFeedback('good', 'Video sonucu başarılı')}>
                                            Sonuç İyi
                                        </button>
                                        <button type="button" className={styles.resetBtn} onClick={handleImproveAgain}>
                                            Yeniden Üret
                                        </button>
                                        <a href={result.videoUrl} target="_blank" rel="noreferrer" className={styles.downloadBtn}>
                                            {isImageLikeUrl(result.videoUrl) ? 'Görseli İndir' : 'Videoyu İndir'}
                                        </a>
                                    </div>
                                    {feedbackStatus === 'sent' ? (
                                        <p className={styles.feedbackHint}>Geri bildiriminiz kaydedildi. Sonraki videolar buna göre iyileştirilecek.</p>
                                    ) : null}
                                    <button type="button" className={styles.resetBtn} onClick={handleReset}>
                                        Yeni Yükleme
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={fileUrl || ''} alt="Yüklenen görsel" className={styles.previewImage} />
                                    <button type="button" className={styles.changeImageBtn} onClick={handleReset}>
                                        Farklı Görsel Seç
                                    </button>
                                </>
                            )}
                            <ProcessingOverlay active={isProcessing} message="Video tur hazırlanıyor, lütfen bekleyin" estimatedSeconds={75} />
                        </div>
                    )}
                </div>

                <div className={styles.controlsSidebar}>
                    <div className={styles.panel}>
                        <div className={styles.panelTitleRow}>
                            <div className={styles.panelTitle}>Sanal Sunucu</div>
                        </div>
                        <div className={styles.scriptField}>
                            <label htmlFor="ai-script" className={styles.scriptLabel}>
                                Sunucunun söyleyeceği metin
                            </label>
                            <textarea
                                id="ai-script"
                                className={styles.scriptInput}
                                placeholder="Örnek: Bu dairemiz ferah salonu, gün ışığı alan odaları ve kullanışlı planı ile dikkat çekiyor."
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value.slice(0, SCRIPT_MAX_LENGTH))}
                                maxLength={SCRIPT_MAX_LENGTH}
                                rows={4}
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
                                    Başlat
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                        <div className={styles.panelTitle} style={{ marginTop: '2rem' }}>Nasıl çalışır?</div>
                        <div className={styles.tipBlock}>
                            <p>1) Tek fotoğraf yükleyin. 2) Metni girin. 3) Sistem 8-10 sn video üretir.</p>
                            <p>Video içinde kadın sunucu evin içinde konuşur; mimari detaylar korunur.</p>
                        </div>
                    </div>
                </div>
            </div>
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title={t('Sanal Sunucu Örneği')}
                summary={t('Yüklenen görselden 8-10 saniyelik kadın sunuculu video üretilir ve mülk anlatımı sesli şekilde verilir.')}
                singleSrc="/images/examples/living-furnished.png"
                sampleText={t('Örnek anlatım:\nMerhaba, şimdi bu ferah yaşam alanını birlikte geziyoruz...')}
            />
        </div>
    );
}
