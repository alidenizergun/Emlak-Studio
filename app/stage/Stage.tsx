"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import styles from './Stage.module.css';

const ROOM_TYPES = [
    {
        id: 'salon',
        label: 'Salon',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 20V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12M3 20h18M12 6V4M6 20v-6a2 2 0 0 1 2-2M18 20v-6a2 2 0 0 0-2-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'living_room',
        label: 'Oturma Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 20h20M4 20v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5M8 13V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'bedroom',
        label: 'Yatak Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 19h20M4 19v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M9 11V9M15 11V9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 7h6a2 2 0 0 1 2 2v2H7V9a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'child_room',
        label: 'Çocuk Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 19h20M4 19v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M9 11V9M15 11V9" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="2" />
            </svg>
        )
    },
    {
        id: 'guest_room',
        label: 'Misafir Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 19h20M4 19v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 9h10M9 9V7h6v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'dressing_room',
        label: 'Giyinme Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 8h6M9 12h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'office',
        label: 'Çalışma Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 20H3M15 20V8a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12M19 20v-4a2 2 0 0 0-2-2h-2M11 12h.01M11 16h.01M7 12h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'game_room',
        label: 'Oyun Odası',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 9h10a4 4 0 0 1 4 4v1a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-1a4 4 0 0 1 4-4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 14h4M11 12v4M15.5 13.5h.01M17.5 15.5h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'kitchen',
        label: 'Mutfak',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 13h18M5 13v7h14v-7M3 10V6a2 2 0 0 1 2-2h3M21 10V6a2 2 0 0 0-2-2h-3M9 4h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'bathroom',
        label: 'Banyo',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8zM4 6h16M7 4h10M12 10v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'entryway',
        label: 'Antre',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 21h16M11 12h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'balcony',
        label: 'Balkon Teras',
        icon: (
            <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 14h16v4h-16z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 14v-4M10 14v-4M14 14v-4M18 14v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 10h16v-2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
];

const STYLES = [
    {
        id: 'modern',
        label: 'Modern',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9h18M9 21V9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'scandinavian',
        label: 'İskandinav',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3v18M12 3L7 8M12 3l5 5M12 18l-5-5M12 18l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'industrial',
        label: 'Endüstriyel',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="16" height="16" rx="1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 8h16M4 12h16M4 16h16M8 4v16M12 4v16M16 4v16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'bohemian',
        label: 'Bohem',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'luxury',
        label: 'Lüks',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'minimalist',
        label: 'Minimalist',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'classic',
        label: 'Klasik',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7h10v10H7z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 3l18 18M3 21L21 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        id: 'rustic',
        label: 'Rustik',
        icon: (
            <svg className={styles.styleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 22h20L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 6l-6 12h12l-6-12z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
];

const ROOM_TYPE_LABEL_BY_ID = Object.fromEntries(ROOM_TYPES.map((room) => [room.id, room.label])) as Record<string, string>;
const STYLE_LABEL_BY_ID = Object.fromEntries(STYLES.map((style) => [style.id, style.label])) as Record<string, string>;

function toInputDateValue(ts: number): string {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function StageClient() {
    const searchParams = useSearchParams();
    const stageTab = searchParams.get('stageTab');
    const urlTab: 'editor' | 'photos' = stageTab === 'photos' ? 'photos' : 'editor';
    const [activeTab, setActiveTab] = useState<'editor' | 'photos'>(urlTab);
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSelectingStyle, setIsSelectingStyle] = useState(false);
    const [isAiStyle, setIsAiStyle] = useState(false);
    const [result, setResult] = useState<{ before: string; after: string } | null>(null);
    const [historyItems, setHistoryItems] = useState<Array<{
        runId: string;
        roomType: string;
        style: string;
        createdAt: number;
        beforeImageUrl: string | null;
        afterImageUrl: string | null;
    }>>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string>('');
    const [historyFromDate, setHistoryFromDate] = useState<string>('');
    const [historyToDate, setHistoryToDate] = useState<string>('');
    const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());
    const [historyDeleting, setHistoryDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isExampleOpen, setIsExampleOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setActiveTab(urlTab);
    }, [urlTab]);

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setFileUrl(URL.createObjectURL(selectedFile));
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const phone = window.localStorage.getItem('emlak_user_phone') || '';
            const formData = new FormData();
            formData.append('image', file);
            formData.append('roomType', selectedRoom!);
            formData.append('style', selectedStyle!);
            formData.append('phone', phone);

            const response = await fetch('/api/stage', {
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
                const objectUrl = URL.createObjectURL(file);
                setResult({
                    before: objectUrl,
                    after: data.imageUrl
                });
            } else {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert('Yetersiz kredi. Lütfen kredi yükleyin.');
                }
                alert('İşlem başarısız: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Stage error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setFileUrl(null);
        setResult(null);
        setSelectedRoom(null);
        setSelectedStyle(null);
    };

    const handleAISelectStyle = () => {
        setIsSelectingStyle(true);
        setIsAiStyle(true); // Enable AI mode for style
        const otherStyles = STYLES.filter(s => s.id !== selectedStyle);
        const randomStyle = otherStyles.length > 0
            ? otherStyles[Math.floor(Math.random() * otherStyles.length)]
            : STYLES[Math.floor(Math.random() * STYLES.length)];

        setTimeout(() => {
            setSelectedStyle(randomStyle.id);
            setIsSelectingStyle(false);
        }, 500);
    };

    const handleDownload = () => {
        if (result?.after) {
            const link = document.createElement('a');
            link.href = result.after;
            link.download = 'sanal-dekorasyon.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadUrl = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPair = async (item: {
        runId: string;
        beforeImageUrl: string | null;
        afterImageUrl: string | null;
    }) => {
        if (item.beforeImageUrl) {
            handleDownloadUrl(item.beforeImageUrl, `yuklenen-${item.runId}.jpg`);
        }
        if (item.afterImageUrl) {
            setTimeout(() => {
                handleDownloadUrl(item.afterImageUrl as string, `islenmis-${item.runId}.jpg`);
            }, item.beforeImageUrl ? 240 : 0);
        }
    };

    const loadHistory = useCallback(async () => {
        const phone = window.localStorage.getItem('emlak_user_phone') || '';
        if (!phone) {
            setHistoryError('Geçmiş fotoğrafları görmek için giriş yapın.');
            setHistoryItems([]);
            return;
        }
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const res = await fetch(`/api/stage/history?phone=${encodeURIComponent(phone)}&limit=200`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Geçmiş getirilemedi');
            }
            const items = Array.isArray(data.items) ? data.items : [];
            setHistoryItems(items);
            setSelectedRunIds((prev) => {
                if (prev.size === 0) return prev;
                const next = new Set<string>();
                const validIds = new Set(items.map((x: { runId: string }) => x.runId));
                prev.forEach((id) => {
                    if (validIds.has(id)) next.add(id);
                });
                return next;
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Geçmiş getirilemedi';
            setHistoryError(message);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const handleDeleteRuns = async (runIds: string[]) => {
        if (runIds.length === 0) return;
        const confirmed = window.confirm(`Seçili ${runIds.length} kaydı silmek istediğinizden emin misiniz?`);
        if (!confirmed) return;
        const phone = window.localStorage.getItem('emlak_user_phone') || '';
        if (!phone) return;
        setHistoryDeleting(true);
        try {
            const res = await fetch('/api/stage/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, runIds }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Silme işlemi başarısız');
            }
            setSelectedRunIds(new Set());
            await loadHistory();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Silme işlemi başarısız';
            alert(message);
        } finally {
            setHistoryDeleting(false);
        }
    };

    const visibleHistoryItems = useMemo(() => {
        const from = historyFromDate ? new Date(`${historyFromDate}T00:00:00`).getTime() : null;
        const to = historyToDate ? new Date(`${historyToDate}T23:59:59`).getTime() : null;
        return historyItems.filter((item) => {
            if (from !== null && item.createdAt < from) return false;
            if (to !== null && item.createdAt > to) return false;
            return true;
        });
    }, [historyFromDate, historyItems, historyToDate]);

    const allVisibleSelected = visibleHistoryItems.length > 0 && visibleHistoryItems.every((item) => selectedRunIds.has(item.runId));

    useEffect(() => {
        if (activeTab !== 'photos') return;
        loadHistory();
    }, [activeTab, loadHistory]);

    if (!mounted) {
        return <div className={styles.pageContainer} style={{ textAlign: 'center' }}>Yükleniyor...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            {activeTab !== 'photos' ? (
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Dekorasyon</h1>
                        <p className={styles.description}>
                            Boş odaları saniyeler içinde mobilyalandırın. Fotoğrafı yükleyin, oda tipini ve tarzını seçin emlak stüdyosu evinizi dekore etsin.
                            <button type="button" className={styles.exampleLink} onClick={() => setIsExampleOpen(true)}>
                                Örnek Gör
                            </button>
                        </p>
                    </div>
                </header>
            ) : null}

            <div className={styles.workspace}>
                {activeTab === 'photos' ? (
                    <section className={styles.photosPage}>
                        <div className={styles.photosPageHeader}>
                            <h2 className={styles.photosTitle}>Tüm Fotoğraflarım</h2>
                            <p className={styles.photosSubtitle}>Yüklediğiniz ve sistemin ürettiği görselleri tarih aralığıyla filtreleyin, birlikte indirin veya silin.</p>
                        </div>
                        <div className={styles.photosFilters}>
                            <div className={styles.dateFilterGroup}>
                                <label className={styles.filterLabel} htmlFor="historyFromDate">Başlangıç</label>
                                <input
                                    id="historyFromDate"
                                    type="date"
                                    className={styles.dateInput}
                                    value={historyFromDate}
                                    onChange={(e) => setHistoryFromDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.dateFilterGroup}>
                                <label className={styles.filterLabel} htmlFor="historyToDate">Bitiş</label>
                                <input
                                    id="historyToDate"
                                    type="date"
                                    className={styles.dateInput}
                                    value={historyToDate}
                                    onChange={(e) => setHistoryToDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.quickFilters}>
                                <button className={styles.quickFilterBtn} onClick={() => { setHistoryFromDate(toInputDateValue(Date.now())); setHistoryToDate(toInputDateValue(Date.now())); }}>Bugün</button>
                                <button className={styles.quickFilterBtn} onClick={() => { setHistoryFromDate(toInputDateValue(Date.now() - 6 * 24 * 60 * 60 * 1000)); setHistoryToDate(toInputDateValue(Date.now())); }}>Son 7 Gün</button>
                                <button className={styles.quickFilterBtn} onClick={() => { setHistoryFromDate(toInputDateValue(Date.now() - 29 * 24 * 60 * 60 * 1000)); setHistoryToDate(toInputDateValue(Date.now())); }}>Son 30 Gün</button>
                                <button className={styles.quickFilterBtn} onClick={() => { setHistoryFromDate(''); setHistoryToDate(''); }}>Temizle</button>
                            </div>
                        </div>
                        {historyLoading && <div className={styles.historyInfo}>Geçmiş yükleniyor...</div>}
                        {!historyLoading && historyError && <div className={styles.historyInfo}>{historyError}</div>}
                        {!historyLoading && !historyError && historyItems.length === 0 && (
                            <div className={styles.historyInfo}>Henüz işlenmiş fotoğraf bulunmuyor.</div>
                        )}
                        {!historyLoading && !historyError && historyItems.length > 0 && (
                            <div className={styles.photosBody}>
                                <div className={styles.bulkActions}>
                                    <label className={styles.bulkCheck}>
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={(e) => {
                                                if (!e.target.checked) {
                                                    setSelectedRunIds(new Set());
                                                    return;
                                                }
                                                setSelectedRunIds(new Set(visibleHistoryItems.map((item) => item.runId)));
                                            }}
                                        />
                                        <span>Tümünü Seç</span>
                                    </label>
                                    <div className={styles.bulkButtons}>
                                        <button
                                            className={styles.downloadBtn}
                                            disabled={selectedRunIds.size === 0}
                                            onClick={() => {
                                                visibleHistoryItems
                                                    .filter((item) => selectedRunIds.has(item.runId))
                                                    .forEach((item, idx) => {
                                                        setTimeout(() => {
                                                            handleDownloadPair(item);
                                                        }, idx * 280);
                                                    });
                                            }}
                                        >
                                            Seçilenleri İndir
                                        </button>
                                        <button
                                            className={styles.deleteBtn}
                                            disabled={selectedRunIds.size === 0 || historyDeleting}
                                            onClick={() => handleDeleteRuns(Array.from(selectedRunIds))}
                                        >
                                            {historyDeleting ? 'Siliniyor...' : 'Seçilenleri Sil'}
                                        </button>
                                    </div>
                                </div>
                                {visibleHistoryItems.length === 0 ? (
                                    <div className={styles.historyInfo}>Bu tarih aralığında fotoğraf bulunamadı.</div>
                                ) : (
                                    <div className={styles.photoGrid}>
                                        {visibleHistoryItems.map((item) => (
                                            <article key={item.runId} className={styles.photoPairCard}>
                                                <div className={styles.photoCardHeader}>
                                                    <label className={styles.bulkCheck}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRunIds.has(item.runId)}
                                                            onChange={(e) => {
                                                                setSelectedRunIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (e.target.checked) next.add(item.runId);
                                                                    else next.delete(item.runId);
                                                                    return next;
                                                                });
                                                            }}
                                                        />
                                                        <span>{new Date(item.createdAt).toLocaleString('tr-TR')}</span>
                                                    </label>
                                                    <span className={styles.photoMeta}>
                                                        {(ROOM_TYPE_LABEL_BY_ID[item.roomType] || item.roomType)} • {(STYLE_LABEL_BY_ID[item.style] || item.style)}
                                                    </span>
                                                </div>
                                                <div className={styles.pairGrid}>
                                                    <div className={styles.pairFrame}>
                                                        <span className={styles.frameLabel}>Yüklenen</span>
                                                        <div className={styles.photoThumbWrap}>
                                                            {item.beforeImageUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={item.beforeImageUrl}
                                                                    alt="Yüklenen fotoğraf"
                                                                    className={styles.photoThumb}
                                                                    onClick={() => setPreviewImageUrl(item.beforeImageUrl)}
                                                                />
                                                            ) : (
                                                                <div className={styles.photoPlaceholder}>Görsel yok</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={styles.pairFrame}>
                                                        <span className={styles.frameLabel}>İşlenmiş</span>
                                                        <div className={styles.photoThumbWrap}>
                                                            {item.afterImageUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={item.afterImageUrl}
                                                                    alt="İşlenmiş fotoğraf"
                                                                    className={styles.photoThumb}
                                                                    onClick={() => setPreviewImageUrl(item.afterImageUrl)}
                                                                />
                                                            ) : (
                                                                <div className={styles.photoPlaceholder}>Görsel yok</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={styles.photoMetaRow}>
                                                    <button className={styles.downloadBtn} onClick={() => handleDownloadPair(item)}>
                                                        Birlikte İndir
                                                    </button>
                                                    <button className={styles.deleteBtn} onClick={() => handleDeleteRuns([item.runId])}>
                                                        Sil
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* LEFT: Canvas/Gallery */}
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
                                            <ComparisonSlider beforeImage={result.before} afterImage={result.after} />
                                            <div className={styles.resultActions}>
                                                <button className={styles.downloadBtn} onClick={handleDownload}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    İndir
                                                </button>
                                                <button className={styles.resetBtn} onClick={handleReset}>Yeni Fotoğraf</button>
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
                                                className={styles.changeImageBtn}
                                                onClick={() => setFile(null)}
                                            >
                                                Farklı Görsel Seç
                                            </button>
                                        </>
                                    )}
                                    <ProcessingOverlay active={isProcessing} />
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Controls Sidebar */}
                        <div className={styles.controlsSidebar}>
                            <div className={styles.panel}>
                        <div className={styles.optionsArea} style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                            <div className={styles.functionalStep}>
                                <div className={styles.stepHeader}>
                                    <label className={styles.label}>Oda Tipi</label>
                                </div>
                                <div className={styles.controlGroup}>
                                    <div className={styles.roomGrid}>
                                        {ROOM_TYPES.map((room) => (
                                            <button
                                                key={room.id}
                                                className={`${styles.roomBtn} ${selectedRoom === room.id ? styles.selected : ''}`}
                                                onClick={() => {
                                                    setSelectedRoom(room.id);
                                                }}
                                            >
                                                <div className={styles.roomIcon}>{room.icon}</div>
                                                <span>{room.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.functionalStep}>
                                <div className={styles.stepHeader}>
                                    <label className={styles.label}>Tasarım Tarzı</label>
                                    <span className={styles.stepCost}>2 Kredi</span>
                                </div>
                                <div className={styles.controlGroup}>
                                    <div className={styles.styleGrid}>
                                        {STYLES.map((style) => (
                                            <button
                                                key={style.id}
                                                className={`${styles.styleBtn} ${selectedStyle === style.id && !isAiStyle ? styles.selected : ''}`}
                                                onClick={() => {
                                                    setSelectedStyle(style.id);
                                                    setIsAiStyle(false);
                                                }}
                                            >
                                                <div className={styles.styleIcon}>{style.icon}</div>
                                                <span>{style.label}</span>
                                            </button>
                                        ))}
                                        <button
                                            className={`${styles.aiButton} ${isAiStyle ? styles.selected : ''}`}
                                            onClick={handleAISelectStyle}
                                            disabled={isSelectingStyle}
                                        >
                                            <div className={styles.checkbox}>
                                                {isAiStyle && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                )}
                                            </div>
                                            <div className={styles.aiText}>
                                                <span className={styles.aiTitle}>Emlak Stüdyosu Seçsin</span>
                                                <span className={styles.aiDesc}>En uygun tarzı uygula</span>
                                            </div>
                                            <div className={styles.aiSparkle}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <defs>
                                                        <linearGradient id="yzSparkleGradientStyle" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#10b981" />
                                                            <stop offset="100%" stopColor="#059669" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M12 2L14.5 9L22 11.5L14.5 14L12 21L9.5 14L2 11.5L9.5 9L12 2Z" fill="url(#yzSparkleGradientStyle)" />
                                                    <path d="M19 16L19.75 18.25L22 19L19.75 19.75L19 22L18.25 19.75L16 19L18.25 18.25L19 16Z" fill="url(#yzSparkleGradientStyle)" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className={styles.processBtn}
                            onClick={handleGenerate}
                            disabled={!file || isProcessing || !selectedRoom || (!selectedStyle && !isAiStyle)}
                        >
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    Dekore Ediliyor...
                                </>
                            ) : (
                                <>
                                    Geliştirmeyi Başlat
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {previewImageUrl ? (
                <div className={styles.lightboxOverlay} onClick={() => setPreviewImageUrl(null)}>
                    <button
                        type="button"
                        className={styles.lightboxClose}
                        onClick={(event) => {
                            event.stopPropagation();
                            setPreviewImageUrl(null);
                        }}
                    >
                        Kapat
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewImageUrl}
                        alt="Büyük önizleme"
                        className={styles.lightboxImage}
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            ) : null}
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title="Dekorasyon Örneği"
                summary="Boş oda fotoğrafına seçtiğiniz oda tipi ve tarz doğrultusunda sanal mobilyalama uygulanır."
                beforeSrc="/images/examples/bedroom-empty.png"
                afterSrc="/images/examples/bedroom-furnished.png"
            />
        </div>
    );
}
