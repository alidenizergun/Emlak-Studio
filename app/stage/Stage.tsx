"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from 'next/navigation';
import ImageUploader, { type ImageValidationSummary } from '@/components/ImageUploader';
import ComparisonSlider from '@/components/ComparisonSlider';
import ToolExamplePopup from '@/components/ToolExamplePopup';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ValidationScorePopup from '@/components/ValidationScorePopup';
import UploadGuidancePanel from '@/components/UploadGuidancePanel';
import { getStoredUserId } from '@/lib/client-auth';
import { estimateToolEtaSeconds, recordEtaSample } from '@/lib/client-eta';
import { useI18n } from '@/components/LanguageProvider';
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
const STYLE_LABEL_BY_ID = {
    ...(Object.fromEntries(STYLES.map((style) => [style.id, style.label])) as Record<string, string>),
    custom: 'Özel',
} as Record<string, string>;
const TOOL_LABEL_BY_ID: Record<string, string> = {
    stage: 'Sanal Dekorasyon',
    enhance: 'Fotoğraf Geliştirme',
    'remove-object': 'Akıllı Eşya Silme',
    'virtual-renovation': 'Sanal Tadilat',
    'listing-text': 'İlan Metni Oluşturucu',
    'ai-tour-guide': 'Sanal Sunucu',
};
const TOOL_FILTER_OPTIONS: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Tümü' },
    { id: 'enhance', label: 'Fotoğraf Geliştirme' },
    { id: 'stage', label: 'Sanal Dekorasyon' },
    { id: 'remove-object', label: 'Akıllı Eşya Silme' },
    { id: 'listing-text', label: 'İlan Metni' },
    { id: 'virtual-renovation', label: 'Sanal Tadilat' },
    { id: 'ai-tour-guide', label: 'Sanal Sunucu' },
];

type HistoryItem = {
    entryId: string;
    runId: string;
    toolId: string;
    roomType?: string;
    style?: string;
    title?: string | null;
    detail?: string | null;
    createdAt: number;
    beforeImageUrl: string | null;
    afterImageUrl: string | null;
};

function toInputDateValue(ts: number): string {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function compactDetail(text: string | null | undefined, max = 72): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export default function StageClient() {
    const { t, lang } = useI18n();
    const searchParams = useSearchParams();
    const stageTab = searchParams.get('stageTab');
    const urlTab: 'editor' | 'works' = stageTab === 'works' || stageTab === 'photos' ? 'works' : 'editor';
    const [activeTab, setActiveTab] = useState<'editor' | 'works'>(urlTab);
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [customStylePrompt, setCustomStylePrompt] = useState('');
    const [result, setResult] = useState<{ before: string; after: string; runId: string } | null>(null);
    const [validationSummary, setValidationSummary] = useState<ImageValidationSummary | null>(null);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
    const [historyHasMore, setHistoryHasMore] = useState(false);
    const [historyError, setHistoryError] = useState<string>('');
    const [historyFromDate, setHistoryFromDate] = useState<string>('');
    const [historyToDate, setHistoryToDate] = useState<string>('');
    const [selectedQuickRange, setSelectedQuickRange] = useState<'all' | '3m' | '30d' | '7d' | 'today'>('all');
    const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');
    const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
    const [historyDeleting, setHistoryDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isExampleOpen, setIsExampleOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const estimatedSeconds = useMemo(
        () =>
            estimateToolEtaSeconds({
                toolId: 'stage',
                inputBytes: file?.size,
                complexity:
                    1 +
                    (selectedStyle === 'custom' ? 0.2 : 0.08) +
                    Math.min(customStylePrompt.trim().length / 320, 0.22),
                fallbackSeconds: 70,
            }),
        [file?.size, selectedStyle, customStylePrompt]
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setActiveTab(urlTab);
    }, [urlTab]);

    useEffect(() => {
        if (activeTab !== 'works') return;
        setSelectedQuickRange('all');
        setHistoryFromDate('');
        setHistoryToDate('');
    }, [activeTab]);

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setFileUrl(URL.createObjectURL(selectedFile));
        setValidationSummary((current) => current);
    };

    const handleGenerate = async () => {
        if (!file) return;
        const startedAt = Date.now();
        setIsProcessing(true);

        try {
            const userId = getStoredUserId();
            const formData = new FormData();
            formData.append('image', file);
            formData.append('roomType', selectedRoom!);
            formData.append('style', selectedStyle!);
            if (selectedStyle === 'custom') {
                formData.append('customStylePrompt', customStylePrompt.trim());
            }
            formData.append('phone', userId);

            const response = await fetch('/api/stage', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                recordEtaSample({
                    toolId: 'stage',
                    durationMs: Date.now() - startedAt,
                    success: true,
                    inputBytes: file.size,
                    complexity:
                        1 +
                        (selectedStyle === 'custom' ? 0.2 : 0.08) +
                        Math.min(customStylePrompt.trim().length / 320, 0.22),
                });
                if (typeof data.credits === 'number' && typeof window !== 'undefined') {
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                    window.dispatchEvent(new CustomEvent('emlak:credits-updated', {
                        detail: { credits: data.credits }
                    }));
                }
                const objectUrl = URL.createObjectURL(file);
                setResult({
                    before: objectUrl,
                    after: data.imageUrl,
                    runId: String(data.runId || ''),
                });
            } else {
                if (data?.code === 'INSUFFICIENT_CREDITS') {
                    alert(t('Yetersiz kredi. Lütfen kredi yükleyin.'));
                }
                alert(`${t('İşlem başarısız')}: ` + t(data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Stage error:', error);
            alert(t('Bir hata oluştu. Lütfen tekrar deneyin.'));
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
        setCustomStylePrompt('');
        setValidationSummary(null);
    };

    const handleDownload = () => {
        if (result?.after && result?.runId) {
            const link = document.createElement('a');
            link.href = buildHistoryDownloadUrl(`stage:${result.runId}`, 'after');
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

    const buildHistoryDownloadUrl = (entryId: string, kind: 'before' | 'after') =>
        `/api/stage/history-download?entryId=${encodeURIComponent(entryId)}&kind=${kind}`;

    const handleDownloadPair = async (item: {
        entryId: string;
        toolId?: string;
        runId: string;
        beforeImageUrl: string | null;
        afterImageUrl: string | null;
        detail?: string | null;
    }) => {
        if (item.beforeImageUrl) {
            handleDownloadUrl(buildHistoryDownloadUrl(item.entryId, 'before'), `yuklenen-${item.toolId || 'tool'}-${item.runId}.jpg`);
        }
        if (item.afterImageUrl) {
            setTimeout(() => {
                handleDownloadUrl(buildHistoryDownloadUrl(item.entryId, 'after'), `islenmis-${item.toolId || 'tool'}-${item.runId}.jpg`);
            }, item.beforeImageUrl ? 240 : 0);
            return;
        }
        if (item.detail) {
            const blob = new Blob([item.detail], { type: 'text/plain;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            handleDownloadUrl(blobUrl, `cikti-${item.toolId || 'tool'}-${item.runId}.txt`);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 800);
        }
    };

    const loadHistory = useCallback(async (append = false, offsetOverride = 0) => {
        const userId = getStoredUserId();
        if (!userId) {
            setHistoryError(t('Geçmiş fotoğrafları görmek için giriş yapın.'));
            setHistoryItems([]);
            setHistoryHasMore(false);
            return;
        }
        if (append) {
            setHistoryLoadingMore(true);
        } else {
            setHistoryLoading(true);
            setHistoryError('');
        }
        try {
            const offset = append ? Math.max(0, Math.floor(offsetOverride)) : 0;
            const res = await fetch(`/api/stage/history?userId=${encodeURIComponent(userId)}&limit=200&offset=${offset}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(t(data.error || 'Geçmiş getirilemedi'));
            }
            const items: HistoryItem[] = Array.isArray(data.items) ? data.items : [];
            setHistoryHasMore(Boolean(data.hasMore));
            setHistoryItems((prev) => {
                if (!append) return items;
                if (items.length === 0) return prev;
                const seen = new Set(prev.map((item) => item.entryId));
                const merged = [...prev];
                items.forEach((item) => {
                    if (!seen.has(item.entryId)) merged.push(item);
                });
                return merged;
            });
            if (!append) {
                setSelectedEntryIds((prev) => {
                    if (prev.size === 0) return prev;
                    const next = new Set<string>();
                    const validIds = new Set(items.map((x: { entryId: string }) => x.entryId));
                    prev.forEach((id) => {
                        if (validIds.has(id)) next.add(id);
                    });
                    return next;
                });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('Geçmiş getirilemedi');
            setHistoryError(message);
        } finally {
            if (append) setHistoryLoadingMore(false);
            else setHistoryLoading(false);
        }
    }, []);

    const handleDeleteRuns = async (entryIds: string[]) => {
        if (entryIds.length === 0) return;
        const confirmed = window.confirm(t('Seçili {count} kaydı silmek istediğinizden emin misiniz?').replace('{count}', String(entryIds.length)));
        if (!confirmed) return;
        const userId = getStoredUserId();
        if (!userId) return;
        setHistoryDeleting(true);
        try {
            const res = await fetch('/api/stage/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, entryIds }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(t(data.error || 'Silme işlemi başarısız'));
            }
            setSelectedEntryIds(new Set());
            await loadHistory(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('Silme işlemi başarısız');
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
            if (selectedToolFilter !== 'all' && item.toolId !== selectedToolFilter) return false;
            return true;
        });
    }, [historyFromDate, historyItems, historyToDate, selectedToolFilter]);

    const allVisibleSelected = visibleHistoryItems.length > 0 && visibleHistoryItems.every((item) => selectedEntryIds.has(item.entryId));

    useEffect(() => {
        if (activeTab !== 'works') return;
        loadHistory(false);
    }, [activeTab, loadHistory]);

    if (!mounted) {
        return <div className={styles.pageContainer} style={{ textAlign: 'center' }}>{t('Yükleniyor...')}</div>;
    }

    return (
        <div className={styles.pageContainer}>
            {activeTab !== 'works' ? (
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerMain}>
                        <h1 className={styles.title}>{t('Sanal Dekorasyon')}</h1>
                        <p className={styles.description}>
                            {t('Boş odaları saniyeler içinde mobilyalandırın. Fotoğrafı yükleyin, oda tipini ve tarzını seçin; Studio Estate mekanı mimariyi koruyarak daha sıcak, daha yaşanmış ve daha ikna edici bir sunuma dönüştürsün.')}
                        </p>
                        <button type="button" className={styles.exampleLink} onClick={() => setIsExampleOpen(true)}>
                            {t('Örnekleri Gör')}
                        </button>
                        </div>
                        <UploadGuidancePanel />
                    </div>
                </header>
            ) : null}

            <div className={styles.workspace}>
                {activeTab === 'works' ? (
                    <section className={styles.photosPage}>
                        <div className={styles.photosPageHeader}>
                            <div>
                                <h2 className={styles.photosTitle}>{t('Tüm Çalışmalarım')}</h2>
                                <p className={styles.photosSubtitle}>{t('Filtreleyin, seçin, indirin veya silin.')}</p>
                            </div>
                            <div className={styles.photosStats}>
                                <span>{visibleHistoryItems.length} {t('kayıt')}</span>
                                <span>{selectedEntryIds.size} {t('seçili')}</span>
                            </div>
                        </div>
                        <div className={styles.photosFilters}>
                            <div className={styles.quickFilters}>
                                <button
                                    className={`${styles.toolFilterBtn} ${selectedQuickRange === 'all' ? styles.toolFilterBtnActive : ''}`}
                                    onClick={() => {
                                        setSelectedQuickRange('all');
                                        setHistoryFromDate('');
                                        setHistoryToDate('');
                                    }}
                                >
                                    {t('Tümü')}
                                </button>
                                <button
                                    className={`${styles.toolFilterBtn} ${selectedQuickRange === '3m' ? styles.toolFilterBtnActive : ''}`}
                                    onClick={() => {
                                        setSelectedQuickRange('3m');
                                        setHistoryFromDate(toInputDateValue(Date.now() - 89 * 24 * 60 * 60 * 1000));
                                        setHistoryToDate(toInputDateValue(Date.now()));
                                    }}
                                >
                                    {t('Son 3 Ay')}
                                </button>
                                <button
                                    className={`${styles.toolFilterBtn} ${selectedQuickRange === '30d' ? styles.toolFilterBtnActive : ''}`}
                                    onClick={() => {
                                        setSelectedQuickRange('30d');
                                        setHistoryFromDate(toInputDateValue(Date.now() - 29 * 24 * 60 * 60 * 1000));
                                        setHistoryToDate(toInputDateValue(Date.now()));
                                    }}
                                >
                                    {t('Son 30 Gün')}
                                </button>
                                <button
                                    className={`${styles.toolFilterBtn} ${selectedQuickRange === '7d' ? styles.toolFilterBtnActive : ''}`}
                                    onClick={() => {
                                        setSelectedQuickRange('7d');
                                        setHistoryFromDate(toInputDateValue(Date.now() - 6 * 24 * 60 * 60 * 1000));
                                        setHistoryToDate(toInputDateValue(Date.now()));
                                    }}
                                >
                                    {t('Son 7 Gün')}
                                </button>
                                <button
                                    className={`${styles.toolFilterBtn} ${selectedQuickRange === 'today' ? styles.toolFilterBtnActive : ''}`}
                                    onClick={() => {
                                        setSelectedQuickRange('today');
                                        setHistoryFromDate(toInputDateValue(Date.now()));
                                        setHistoryToDate(toInputDateValue(Date.now()));
                                    }}
                                >
                                    {t('Bugün')}
                                </button>
                            </div>
                            <div className={styles.toolFilters}>
                                {TOOL_FILTER_OPTIONS.map((tool) => (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        className={`${styles.toolFilterBtn} ${selectedToolFilter === tool.id ? styles.toolFilterBtnActive : ''}`}
                                        onClick={() => setSelectedToolFilter(tool.id)}
                                    >
                                        {t(tool.label)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {!historyLoading && !historyError && historyItems.length > 0 && (
                            <div className={styles.bulkActions}>
                                <label className={styles.bulkCheck}>
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={(e) => {
                                            if (!e.target.checked) {
                                                setSelectedEntryIds(new Set());
                                                return;
                                            }
                                            setSelectedEntryIds(new Set(visibleHistoryItems.map((item) => item.entryId)));
                                        }}
                                    />
                                    <span>{t('Tümünü Seç')}</span>
                                </label>
                                <div className={styles.bulkButtons}>
                                    <button
                                        className={styles.photosPrimaryBtn}
                                        disabled={selectedEntryIds.size === 0}
                                        onClick={() => {
                                            visibleHistoryItems
                                                .filter((item) => selectedEntryIds.has(item.entryId))
                                                .forEach((item, idx) => {
                                                    setTimeout(() => {
                                                        handleDownloadPair(item);
                                                    }, idx * 280);
                                                });
                                        }}
                                    >
                                        {t('Seçilenleri İndir')}
                                    </button>
                                    <button
                                        className={styles.photosDangerBtn}
                                        disabled={selectedEntryIds.size === 0 || historyDeleting}
                                        onClick={() => handleDeleteRuns(Array.from(selectedEntryIds))}
                                    >
                                        {historyDeleting ? t('Siliniyor...') : t('Seçilenleri Sil')}
                                    </button>
                                </div>
                            </div>
                        )}
                        {historyLoading && <div className={styles.historyInfo}>{t('Geçmiş yükleniyor...')}</div>}
                        {!historyLoading && historyError && <div className={styles.historyInfo}>{historyError}</div>}
                        {!historyLoading && !historyError && historyItems.length === 0 && (
                            <div className={styles.historyInfo}>{t('Henüz işlenmiş fotoğraf bulunmuyor.')}</div>
                        )}
                        {!historyLoading && !historyError && historyItems.length > 0 && (
                            <div className={styles.photosBody}>
                                {visibleHistoryItems.length === 0 ? (
                                    <div className={styles.historyInfo}>{t('Bu tarih aralığında çalışma bulunamadı.')}</div>
                                ) : (
                                    <div className={styles.photoGrid}>
                                        {visibleHistoryItems.map((item) => (
                                            <article key={item.entryId} className={styles.photoPairCard}>
                                                <div className={styles.photoCardHeader}>
                                                    <div className={styles.photoCardInfo}>
                                                        <label className={styles.bulkCheck}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEntryIds.has(item.entryId)}
                                                                onChange={(e) => {
                                                                    setSelectedEntryIds((prev) => {
                                                                        const next = new Set(prev);
                                                                        if (e.target.checked) next.add(item.entryId);
                                                                        else next.delete(item.entryId);
                                                                        return next;
                                                                    });
                                                                }}
                                                            />
                                                            <span>{new Date(item.createdAt).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}</span>
                                                        </label>
                                                        <span className={styles.photoMeta}>
                                                            {t(TOOL_LABEL_BY_ID[item.toolId] || item.title || 'Çalışma')}
                                                            {item.toolId === 'stage'
                                                                ? ` • ${t(ROOM_TYPE_LABEL_BY_ID[item.roomType || ''] || item.roomType || '')} • ${t(STYLE_LABEL_BY_ID[item.style || ''] || item.style || '')}`
                                                                : item.detail ? ` • ${compactDetail(item.detail, 72)}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.pairGrid}>
                                                    <div className={styles.pairFrame}>
                                                        <span className={styles.frameLabel}>{t('Yüklenen')}</span>
                                                        <div className={styles.photoThumbWrap}>
                                                            {item.beforeImageUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={item.beforeImageUrl}
                                                                    alt={t('Yüklenen fotoğraf')}
                                                                    className={styles.photoThumb}
                                                                    onClick={() => setPreviewImageUrl(item.beforeImageUrl)}
                                                                />
                                                            ) : (
                                                                <div className={styles.photoPlaceholder}>{t('Görsel yok')}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={styles.pairFrame}>
                                                        <span className={styles.frameLabel}>{t('Çıktı')}</span>
                                                        <div className={styles.photoThumbWrap}>
                                                            {item.afterImageUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={item.afterImageUrl}
                                                                    alt={t('İşlenmiş fotoğraf')}
                                                                    className={styles.photoThumb}
                                                                    onClick={() => setPreviewImageUrl(item.afterImageUrl)}
                                                                />
                                                            ) : (
                                                                <div className={styles.photoPlaceholder}>{item.detail ? t('Metin çıktısı indirilebilir') : t('Görsel yok')}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={styles.photoCardActionsStack}>
                                                    <button className={styles.photosPrimaryBtn} onClick={() => handleDownloadPair(item)}>
                                                        {t('İndir')}
                                                    </button>
                                                    <button className={styles.photosDangerBtn} onClick={() => handleDeleteRuns([item.entryId])}>
                                                        {t('Sil')}
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                                {historyHasMore && (
                                    <div className={styles.historyInfo}>
                                        <button
                                            type="button"
                                            className={styles.quickFilterBtn}
                                            onClick={() => loadHistory(true, historyItems.length)}
                                            disabled={historyLoadingMore}
                                        >
                                            {historyLoadingMore ? t('Yükleniyor...') : t('Daha fazla yükle')}
                                        </button>
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
                                        onInvalidSelection={handleReset}
                                        onValidationResult={setValidationSummary}
                                        validationTool="stage"
                                        showGuidance={false}
                                        label={t('Fotoğrafı Buraya Tıklayıp Yükleyin')}
                                    />
                                </div>
                            ) : (
                                <div className={styles.previewContainer}>
                                    {result ? (
                                        <div style={{ width: '100%', height: '100%' }}>
                                            <ComparisonSlider beforeImage={result.before} afterImage={result.after} variant="hero" />
                                            <div className={styles.resultActions}>
                                                <button className={styles.downloadBtn} onClick={handleDownload}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    {t('İndir')}
                                                </button>
                                                <button className={styles.resetBtn} onClick={handleReset}>{t('Yeni Fotoğraf')}</button>
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

                        {/* RIGHT: Controls Sidebar */}
                        <div className={styles.controlsSidebar}>
                            <div className={styles.panel}>
                        <div className={styles.optionsArea} style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                            <div className={styles.functionalStep}>
                                <div className={styles.stepHeader}>
                                    <label className={styles.label}>{t('Oda Tipi')}</label>
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
                                                <span>{t(room.label)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.functionalStep}>
                                <div className={styles.stepHeader}>
                                    <label className={styles.label}>{t('Tasarım Tarzı')}</label>
                                    <span className={styles.stepCost}>{t('2 Kredi')}</span>
                                </div>
                                <div className={styles.controlGroup}>
                                    <div className={styles.styleGrid}>
                                        {STYLES.map((style) => (
                                            <button
                                                key={style.id}
                                                className={`${styles.styleBtn} ${selectedStyle === style.id ? styles.selected : ''}`}
                                                onClick={() => {
                                                    setSelectedStyle(style.id);
                                                    setCustomStylePrompt('');
                                                }}
                                            >
                                                <div className={styles.styleIcon}>{style.icon}</div>
                                                <span>{t(style.label)}</span>
                                            </button>
                                        ))}
                                        <div className={styles.customStyleWrap}>
                                            <label htmlFor="custom-style-prompt" className={styles.customStyleLabel}>{t('Özel tarz isteği')}</label>
                                            <textarea
                                                id="custom-style-prompt"
                                                className={styles.customStyleInput}
                                                placeholder={t('Örn: Japandi, açık meşe tonları, sade ve ferah...')}
                                                value={customStylePrompt}
                                                onChange={(event) => {
                                                    const next = event.target.value;
                                                    setCustomStylePrompt(next);
                                                    setSelectedStyle(next.trim() ? 'custom' : null);
                                                }}
                                                rows={3}
                                                maxLength={240}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className={styles.processBtn}
                            onClick={handleGenerate}
                            disabled={!file || isProcessing || !selectedRoom || !selectedStyle}
                        >
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} />
                                    {t('Dekore Ediliyor...')}
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
                        {t('Kapat')}
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewImageUrl}
                        alt={t('Büyük önizleme')}
                        className={styles.lightboxImage}
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            ) : null}
            <ToolExamplePopup
                isOpen={isExampleOpen}
                onClose={() => setIsExampleOpen(false)}
                title={t('Sanal Dekorasyon Örneği')}
                summary={t('Boş oda fotoğrafına seçtiğiniz oda tipi ve tarz doğrultusunda sanal mobilyalama uygulanır.')}
                beforeSrc="/images/examples/bedroom-empty.png"
                afterSrc="/images/examples/bedroom-furnished.png"
            />
        </div>
    );
}
