"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import EnhanceResultModal from '@/components/EnhanceResultModal';
import styles from './Enhance.module.css';

interface EnhancedItem {
    id: string;
    file: File;
    previewUrl: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    resultUrl?: string;
    error?: string;
}

const MAX_FILES = 2;

export default function EnhanceClient() {
    const router = useRouter();
    const pathname = usePathname();
    const isInStudio = pathname === '/studio';
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({}); // Yapay Zeka Seçsin varsayılan kapalı
    const [items, setItems] = useState<EnhancedItem[]>([]);
    const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);

    // Modal State
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        before: string;
        after: string;
    }>({ isOpen: false, before: '', after: '' });

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            items.forEach(item => URL.revokeObjectURL(item.previewUrl));
        };
    }, []);

    const handleFilesSelect = (files: File[]) => {
        const newItems: EnhancedItem[] = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending'
        }));

        setItems(prev => {
            const combined = [...prev, ...newItems];
            if (combined.length > MAX_FILES) {
                alert(`En fazla ${MAX_FILES} fotoğraf yükleyebilirsiniz.`);
                // Cleanup unused URLs
                newItems.slice(MAX_FILES - prev.length).forEach(i => URL.revokeObjectURL(i.previewUrl));
                return combined.slice(0, MAX_FILES);
            }
            return combined;
        });
    };

    const removeFile = (id: string) => {
        setItems(prev => {
            const itemToRemove = prev.find(i => i.id === id);
            if (itemToRemove) URL.revokeObjectURL(itemToRemove.previewUrl);
            return prev.filter(i => i.id !== id);
        });
    };

    const toggleOption = (id: string) => {
        if (isGlobalProcessing) return;

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

    const processItem = async (item: EnhancedItem) => {
        if (item.status === 'success') return;

        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

        try {
            const phone = window.localStorage.getItem('emlak_user_phone') || '';
            const formData = new FormData();
            formData.append('image', item.file);
            formData.append('options', JSON.stringify(selectedOptions));
            formData.append('phone', phone);

            const response = await fetch('/api/enhance', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                setItems(prev => prev.map(i => i.id === item.id ? {
                    ...i,
                    status: 'success',
                    resultUrl: data.imageUrl
                } : i));
            } else {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert('Yetersiz kredi. Lütfen kredi yükleyin.');
                }
                setItems(prev => prev.map(i => i.id === item.id ? {
                    ...i,
                    status: 'error',
                    error: data.error
                } : i));
            }
        } catch (error) {
            console.error('Enhance error:', error);
            setItems(prev => prev.map(i => i.id === item.id ? {
                ...i,
                status: 'error',
                error: 'Hata'
            } : i));
        }
    };

    const handleProcessAll = async () => {
        const pending = items.filter(i => i.status !== 'success');
        if (pending.length === 0) return;

        setIsGlobalProcessing(true);
        // Kredi kesintisi istek başına yapıldığı için yarış durumunu önlemek adına sıralı işleme.
        for (const item of pending) {
            // eslint-disable-next-line no-await-in-loop
            await processItem(item);
        }

        setIsGlobalProcessing(false);
    };

    const openResult = (item: EnhancedItem) => {
        if (item.status === 'success' && item.resultUrl) {
            setModalState({
                isOpen: true,
                before: item.previewUrl,
                after: item.resultUrl
            });
        }
    };

    const hasItems = items.length > 0;
    const selectedOptionCount = Object.values(selectedOptions).filter(Boolean).length;
    const allDone = hasItems && items.every(i => i.status === 'success' || i.status === 'error');
    const pendingCount = items.filter(i => i.status === 'pending').length;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Fotoğraf Geliştirme Stüdyosu</h1>
                    <p className={styles.description}>
                        Yapay zeka ile fotoğraflarınızı analiz eder, ışık ve renk dengesini sağlar,
                        çözünürlüğü 4K kaliteye yükseltir.
                    </p>
                </div>
            </header>

            <div className={styles.workspace}>
                {/* LEFT: Gallery Area */}
                <div className={styles.gallerySection}>
                    {!hasItems ? (
                        <div className={styles.emptyState}>
                            <ImageUploader
                                onImagesSelect={handleFilesSelect}
                                label="Fotoğrafları Buraya Tıklayıp Yükleyin"
                                multiple={true}
                                maxFiles={MAX_FILES}
                            />
                        </div>
                    ) : (
                        <div className={styles.itemsGrid}>
                            {items.map(item => (
                                <div key={item.id} className={styles.itemCard} onClick={() => openResult(item)}>
                                    {/* Status Badge */}
                                    <div className={`${styles.statusBadge} ${item.status === 'pending' ? styles.statusPending :
                                        item.status === 'processing' ? styles.statusProcessing :
                                            item.status === 'success' ? styles.statusSuccess :
                                                styles.statusError
                                        }`}>
                                        {item.status === 'pending' && <span className={styles.dotPending} />}
                                        {item.status === 'processing' && <span className={styles.spinner} style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />}
                                        {item.status === 'success' && '✓'}
                                        {item.status === 'error' && '!'}

                                        {item.status === 'pending' && 'Bekliyor'}
                                        {item.status === 'processing' && 'İşleniyor'}
                                        {item.status === 'success' && 'Hazır'}
                                        {item.status === 'error' && 'Hata'}
                                    </div>

                                    {/* Image */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.status === 'success' ? item.resultUrl : item.previewUrl}
                                        alt="Preview"
                                        className={styles.itemImage}
                                    />

                                    {/* Overlay Actions */}
                                    <div className={styles.itemOverlay}>
                                        {item.status === 'success' ? (
                                            <button
                                                className={`${styles.actionBtn} ${styles.btnView}`}
                                                onClick={(e) => { e.stopPropagation(); openResult(item); }}
                                                title="İncele"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                        ) : null}

                                        {item.status !== 'processing' && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.btnRemove}`}
                                                onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                                                title="Sil"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add More Button */}
                            {items.length < MAX_FILES && (
                                <div className={styles.uploadCard}>
                                    <div style={{ transform: 'scale(0.8)', width: '100%', height: '100%' }}>
                                        <ImageUploader
                                            onImagesSelect={handleFilesSelect}
                                            label="+"
                                            multiple={true}
                                            maxFiles={MAX_FILES - items.length}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Sidebar Controls */}
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
                                            <span className={styles.optionName}>{opt.label}</span>
                                            <span className={styles.optionCost}>{opt.creditCost}</span>
                                        </div>
                                        <span className={styles.optionDesc}>{opt.desc}</span>
                                    </div>
                                    <div className={styles.optionIcon}>{opt.icon}</div>
                                </div>
                            ))}

                            {/* Auto Option Last */}
                            <div
                                className={`${styles.optionItem} ${selectedOptions['auto'] ? styles.activeAi : ''}`}
                                onClick={() => toggleOption('auto')}
                                style={{ border: '2px solid rgba(16, 185, 129, 0.2)' }}
                            >
                                <div className={styles.checkbox}>
                                    {selectedOptions['auto'] && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                </div>
                                <div className={styles.optionText}>
                                    <div className={styles.optionNameRow}>
                                        <span className={styles.optionName}>Yapay Zeka Seçsin</span>
                                        <span className={styles.optionCost}>5 kredi</span>
                                    </div>
                                    <span className={styles.optionDesc}>Yapay zeka en iyi ayarları seçsin</span>
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
                            onClick={handleProcessAll}
                            disabled={isGlobalProcessing || !hasItems || selectedOptionCount === 0 || (pendingCount === 0 && !items.some(i => i.status === 'error'))}
                        >
                            {isGlobalProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    {allDone ? 'Tekrar İşle' : 'Geliştirmeyi Başlat'}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <EnhanceResultModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
                beforeImage={modalState.before}
                afterImage={modalState.after}
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
    }
];
