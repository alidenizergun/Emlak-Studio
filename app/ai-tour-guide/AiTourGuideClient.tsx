'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import styles from './AiTourGuide.module.css';

export default function AiTourGuideClient() {
    const SCRIPT_MAX_LENGTH = 150;

    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [scriptText, setScriptText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [latestRunId, setLatestRunId] = useState<string>('');
    const [generatedScript, setGeneratedScript] = useState<string>('');
    const [qualityScore, setQualityScore] = useState<number | null>(null);
    const [qualityIssues, setQualityIssues] = useState<string[]>([]);
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
        setSubmitted(false);
    };

    const runGenerate = async (scriptOverride?: string) => {
        if (!file) return;
        setIsProcessing(true);
        setSubmitted(false);
        setFeedbackStatus('idle');
        try {
            const phone = window.localStorage.getItem('emlak_user_phone') || '';
            const formData = new FormData();
            formData.append('image', file);
            const payloadScript = typeof scriptOverride === 'string' ? scriptOverride : scriptText;
            formData.append('script', payloadScript.trim().slice(0, SCRIPT_MAX_LENGTH));
            formData.append('phone', phone);
            const response = await fetch('/api/ai-tour-guide', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success) {
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                setLatestRunId(String(data.runId || ''));
                setGeneratedScript(String(data.generatedScript || ''));
                setQualityScore(typeof data.qualityScore === 'number' ? data.qualityScore : null);
                setQualityIssues(Array.isArray(data.qualityIssues) ? data.qualityIssues.map((x: unknown) => String(x)) : []);
                setSubmitted(true);
            } else {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert('Yetersiz kredi. Lütfen kredi yükleyin.');
                    return;
                }
                alert(data.error || 'İşlem başarısız. Lütfen tekrar deneyin.');
            }
        } catch {
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
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
        setLatestRunId('');
        setGeneratedScript('');
        setQualityScore(null);
        setQualityIssues([]);
        setFeedbackStatus('idle');
        setSubmitted(false);
    };

    const sendFeedback = async (verdict: 'good' | 'bad', note = '') => {
        if (!latestRunId) return;
        const phone = window.localStorage.getItem('emlak_user_phone') || '';
        if (!phone) return;
        try {
            const response = await fetch('/api/ai-tour-guide/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId: latestRunId,
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
        } catch (error) {
            console.error(error);
        }
    };

    const handleImproveAgain = async () => {
        if (!generatedScript) return;
        await sendFeedback('bad', 'Metni daha detaylı ve özgün hale getir');
        const nextScript = generatedScript.slice(0, SCRIPT_MAX_LENGTH);
        setScriptText(nextScript);
        await runGenerate(nextScript);
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
                    <h1 className={styles.title}>Sanal Sunucu</h1>
                    <p className={styles.description}>
                        Mülk fotoğraflarınızı yükleyin. Sanal sunucu evi gezer, girdiğiniz bilgileri sesli ve videolu şeklinde sunar.
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
                                    <p>Video tur özelliği hazırlanıyor. Bu arada adaptif anlatım metni üretildi.</p>
                                    {generatedScript ? (
                                        <div className={styles.generatedBox}>
                                            <div className={styles.generatedHeader}>
                                                <strong>Üretilen Metin</strong>
                                                {qualityScore !== null ? (
                                                    <span className={styles.qualityBadge}>Kalite: {(qualityScore * 100).toFixed(0)}%</span>
                                                ) : null}
                                            </div>
                                            <p>{generatedScript}</p>
                                            {qualityIssues.length > 0 ? (
                                                <div className={styles.qualityIssues}>
                                                    {qualityIssues.join(' • ')}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    <div className={styles.feedbackActions}>
                                        <button type="button" className={styles.downloadBtn} onClick={() => sendFeedback('good', 'Metin başarılı')}>
                                            Metin İyi
                                        </button>
                                        <button type="button" className={styles.resetBtn} onClick={handleImproveAgain}>
                                            Yeniden İyileştir
                                        </button>
                                    </div>
                                    {feedbackStatus === 'sent' ? (
                                        <p className={styles.feedbackHint}>Geri bildiriminiz kaydedildi. Sonraki çıktılar buna göre iyileştirilecek.</p>
                                    ) : null}
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
                            <ProcessingOverlay active={isProcessing} />
                        </div>
                    )}
                </div>

                <div className={styles.controlsSidebar}>
                    <div className={styles.panel}>
                        <div className={styles.panelTitleRow}>
                            <div className={styles.panelTitle}>Sanal Sunucu</div>
                            <span className={styles.inlineCost}>10 kredi</span>
                        </div>
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
                            <p>Mülk fotoğraflarınızı yükleyin. Sanal sunucu evi gezer, girdiğiniz bilgileri sesli ve videolu şeklinde sunar.</p>
                        </div>
                    </div>
                </div>
            </div>
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title="Sanal Sunucu Örneği"
                summary="Yüklenen görsel üzerinde kısa bir tur metni oluşturulur ve video anlatım için hazır hale getirilir."
                singleSrc="/images/examples/living-furnished.png"
                sampleText={`Örnek anlatım:\\nMerhaba, şimdi geniş salon ve doğal ışık alan oturma bölümünü geziyoruz...`}
            />
        </div>
    );
}
