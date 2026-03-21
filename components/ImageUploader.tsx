"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './ImageUploader.module.css';

type ValidationTool = 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation';

export interface ImageValidationSummary {
    score: number;
    passed: boolean;
    nonce: number;
}

function getScoreTone(score: number): 'good' | 'medium' | 'low' {
    if (score >= 80) return 'good';
    if (score >= 60) return 'medium';
    return 'low';
}

interface ImageUploaderProps {
    onImageSelect?: (file: File) => void;
    onImagesSelect?: (files: File[]) => void;
    onInvalidSelection?: () => void;
    onValidationResult?: (summary: ImageValidationSummary | null) => void;
    label?: string;
    subtext?: string;
    multiple?: boolean;
    maxFiles?: number;
    mini?: boolean;
    validationTool?: ValidationTool;
}

const ImageUploader = ({
    onImageSelect,
    onImagesSelect,
    onInvalidSelection,
    onValidationResult,
    label = "Fotoğraf Yükle",
    subtext,
    multiple = false,
    maxFiles = 5,
    mini = false,
    validationTool,
}: ImageUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [validationScore, setValidationScore] = useState<number | null>(null);
    const [isExampleOpen, setIsExampleOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isExampleOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsExampleOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExampleOpen]);

    const clearSelection = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        onInvalidSelection?.();
    };

    const validateSingleFile = async (file: File): Promise<boolean> => {
        if (!validationTool) {
            setValidationMessage('');
            setValidationScore(null);
            return true;
        }

        setIsValidating(true);
        setValidationMessage('');
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('tool', validationTool);
            const response = await fetch('/api/validate-image', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return true;
            }
            if (data?.success) {
                setValidationMessage('');
                const score = typeof data?.score === 'number' ? Math.round(data.score * 100) : null;
                setValidationScore(score);
                onValidationResult?.(score === null ? null : { score, passed: true, nonce: Date.now() });
                return true;
            }

            const reason = String(data?.error || 'Bu fotoğraf şu an işlem için uygun değil.');
            const guidance = String(data?.guidance || 'Lütfen daha net ve iyi ışıklandırılmış bir fotoğraf yükleyin.');
            const score = typeof data?.score === 'number' ? Math.round(data.score * 100) : null;
            setValidationScore(score);
            onValidationResult?.(score === null ? null : { score, passed: false, nonce: Date.now() });
            setValidationMessage(`${reason} ${guidance}`.trim());
            clearSelection();
            return false;
        } catch {
            return true;
        } finally {
            setIsValidating(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));

            if (droppedFiles.length === 0) return;

            if (multiple) {
                if (droppedFiles.length > maxFiles) {
                    alert(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz.`);
                    clearSelection();
                    return;
                }
                setValidationMessage('');
                onImagesSelect?.(droppedFiles);
            } else {
                const ok = await validateSingleFile(droppedFiles[0]);
                if (ok) onImageSelect?.(droppedFiles[0]);
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            if (multiple) {
                if (selectedFiles.length > maxFiles) {
                    alert(`En fazla ${maxFiles} fotoğraf yükleyebilirsiniz.`);
                    clearSelection();
                    return;
                }
                setValidationMessage('');
                onImagesSelect?.(selectedFiles);
            } else {
                const ok = await validateSingleFile(selectedFiles[0]);
                if (ok) onImageSelect?.(selectedFiles[0]);
            }
        }
    };

    return (
        <div
            className={`${styles.uploader} ${mini ? styles.mini : ''} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple={multiple}
                className={styles.hiddenInput}
            />
            <div className={styles.content}>
                {!mini && (
                    <div className={styles.icon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
                <p className={styles.text} style={mini ? { fontSize: '2rem', margin: 0, color: '#94a3b8' } : {}}>{label}</p>
                {!mini && (
                    <p className={styles.subtext}>
                        {subtext || (multiple ? `veya sürükleyip bırakın (en fazla ${maxFiles} fotoğraf)` : 'veya sürükleyip bırakın')}
                    </p>
                )}
                {isValidating ? <p className={styles.validationInfo}>Fotoğraf kontrol ediliyor...</p> : null}
                {validationMessage ? (
                    <div className={styles.validationErrorBox}>
                        <p className={styles.validationErrorTitle}>Bu fotoğraf şu an işleme uygun değil</p>
                        {validationScore !== null ? (
                            <p className={`${styles.validationScoreInline} ${styles[`validationScoreInline${getScoreTone(validationScore)[0].toUpperCase()}${getScoreTone(validationScore).slice(1)}`]}`}>
                                Uygunluk skoru: {validationScore}/100
                            </p>
                        ) : null}
                        <p className={styles.validationError}>{validationMessage}</p>
                    </div>
                ) : null}
                {!mini && validationTool ? (
                    <div className={styles.qualityChecklist}>
                        <p className={styles.qualityChecklistTitle}>Daha iyi sonuç için</p>
                        <div className={styles.examplePanel}>
                            <div className={styles.exampleThumbWrap}>
                                <button
                                    type="button"
                                    className={styles.exampleThumbButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExampleOpen(true);
                                    }}
                                    aria-label="İyi örnek fotoğrafı büyüt"
                                >
                                    <img
                                        src="/images/hero-before-v17.png"
                                        alt="İyi fotoğraf örneği"
                                        className={styles.exampleThumb}
                                    />
                                </button>
                                <span className={styles.exampleBadge}>İyi Örnek</span>
                            </div>
                            <div className={styles.examplePanelContent}>
                                <ul className={styles.qualityChecklistList}>
                                    <li>Net ve titreşimsiz fotoğraf kullanın</li>
                                    <li>Oda iyi aydınlatılmış olsun</li>
                                    <li>Duvarlar ve zemin kadrajda açık görünsün</li>
                                    <li>Çok düşük çözünürlüklü veya aşırı sıkıştırılmış görsel kullanmayın</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
            {isExampleOpen ? (
                <div
                    className={styles.exampleLightbox}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExampleOpen(false);
                    }}
                >
                    <div
                        className={styles.exampleLightboxDialog}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className={styles.exampleLightboxClose}
                            onClick={() => setIsExampleOpen(false)}
                            aria-label="Kapat"
                        >
                            ×
                        </button>
                        <img
                            src="/images/hero-before-v17.png"
                            alt="İyi fotoğraf örneği büyük önizleme"
                            className={styles.exampleLightboxImage}
                        />
                        <div className={styles.exampleLightboxCaption}>
                            Bu örnek; net çizgiler, dengeli ışık ve odanın tamamını gösteren kadraj sayesinde araçlar için uygundur.
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ImageUploader;
