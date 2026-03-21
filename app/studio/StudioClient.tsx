'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { TOOLS } from '@/app/tools/toolsData';
import { clearStoredAuth, getStoredUserId, isStoredAuthed, persistStoredUserId } from '@/lib/client-auth';
import { useI18n } from '@/components/LanguageProvider';
import styles from './Studio.module.css';

const STUDIO_MIN_TOPUP_CREDITS = 10;
const STUDIO_MAX_TOPUP_CREDITS = 10000;

interface SubscriptionInfo {
    planId: 'danisman' | 'ofis' | 'kurumsal';
    monthlyCredits: number;
    monthlyPrice: number;
    status: 'active' | 'cancelled';
}

const VALID_TOOL_IDS = new Set(TOOLS.map((t) => t.id));
function getToolIdFromParam(param: string | null): string {
    if (param && VALID_TOOL_IDS.has(param)) return param;
    return TOOLS[0]?.id ?? 'enhance';
}

/** Aynı bileşenler standalone sayfalarda da kullanılıyor; enhance/stage vb. sayfalardaki değişiklikler Studio'da otomatik yansır. */
const EnhanceClient = dynamic(() => import('@/app/enhance/EnhanceEditor'), { ssr: false });
const StageClient = dynamic(() => import('@/app/stage/Stage'), { ssr: false });
const RemoveObjectClient = dynamic(() => import('@/app/remove-object/RemoveObjectClient'), { ssr: false });
const SanalTadilatClient = dynamic(() => import('@/app/sanal-tadilat/SanalTadilatClient'), { ssr: false });
const AiTourGuideComingSoon = dynamic(() => import('@/app/ai-tour-guide/AiTourGuideComingSoon'), { ssr: false });

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
    'enhance': EnhanceClient,
    'stage': StageClient,
    'remove-object': RemoveObjectClient,
    'renovation': SanalTadilatClient,
    'ai-tour-guide': AiTourGuideComingSoon,
};

export default function StudioClient() {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const toolParam = searchParams.get('tool');
    const [mounted, setMounted] = useState(false);
    const [credits, setCredits] = useState<number>(0);
    const [accountId, setAccountId] = useState('');
    const [selectedToolId, setSelectedToolId] = useState<string>(() => getToolIdFromParam(toolParam));
    const [showTopupPanel, setShowTopupPanel] = useState(false);
    const [purchaseAmountInput, setPurchaseAmountInput] = useState('100');
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [topupLoading, setTopupLoading] = useState(false);
    const [topupProcessing, setTopupProcessing] = useState(false);
    const workspaceRef = useRef<HTMLDivElement>(null);
    const stageTabParam = searchParams.get('stageTab');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const cachedCredits = window.localStorage.getItem('emlak_credits');
        const storedUserId = getStoredUserId();
        if (storedUserId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAccountId(storedUserId);
        }
        if (!cachedCredits) return;
        const parsed = Number(cachedCredits);
        if (Number.isFinite(parsed) && parsed >= 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCredits(Math.floor(parsed));
        }
    }, []);

    useEffect(() => {
        const id = getToolIdFromParam(searchParams.get('tool'));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedToolId(id);
    }, [searchParams]);

    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!workspace) return;

        // Tool değiştiğinde içerik alanını en üste al.
        workspace.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [selectedToolId]);

    const refreshCredits = useCallback(async () => {
        try {
            const res = await fetch('/api/credits');
            const data = await res.json().catch(() => ({}));

            if (res.ok && data?.success && typeof data.credits === 'number') {
                setCredits(data.credits);
                window.localStorage.setItem('emlak_credits', String(data.credits));
                if (typeof data.email === 'string' && data.email) {
                    setAccountId(data.email);
                    persistStoredUserId(data.email);
                }
                return;
            }

            if (res.status === 401 || res.status === 403) {
                clearStoredAuth();
                router.replace('/login');
            }
        } catch {
            // no-op
        }
    }, [router]);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;
        const authed = isStoredAuthed();
        if (!authed) {
            router.replace('/login');
            return;
        }
        const frameId = window.requestAnimationFrame(() => {
            refreshCredits();
        });
        return () => window.cancelAnimationFrame(frameId);
    }, [mounted, refreshCredits, router]);

    useEffect(() => {
        if (!showTopupPanel || !accountId) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTopupLoading(true);
        fetch(`/api/subscription?email=${encodeURIComponent(accountId)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.subscription) {
                    setSubscription(data.subscription as SubscriptionInfo);
                }
            })
            .catch(() => {})
            .finally(() => setTopupLoading(false));
    }, [showTopupPanel, accountId]);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;

        const onCreditsUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ credits?: number }>;
            const nextCredits = customEvent.detail?.credits;
            if (typeof nextCredits === 'number') {
                setCredits(nextCredits);
                window.localStorage.setItem('emlak_credits', String(nextCredits));
                return;
            }
            refreshCredits();
        };

        window.addEventListener('emlak:credits-updated', onCreditsUpdated);
        return () => {
            window.removeEventListener('emlak:credits-updated', onCreditsUpdated);
        };
    }, [mounted, refreshCredits]);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;

        const intervalId = window.setInterval(() => {
            refreshCredits();
        }, 10000);

        const onFocus = () => refreshCredits();
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') refreshCredits();
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [mounted, refreshCredits]);

    if (!mounted) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.loading}>{t('Yükleniyor...')}</div>
            </div>
        );
    }

    const ToolComponent = TOOL_COMPONENTS[selectedToolId];
    const isMyPhotosActive = selectedToolId === 'stage' && (stageTabParam === 'works' || stageTabParam === 'photos');
    const purchaseAmount = Math.floor(Number(purchaseAmountInput) || 0);
    const perCreditPrice = subscription
        ? subscription.monthlyPrice / Math.max(subscription.monthlyCredits, 1)
        : 0;
    const totalTopupPrice = Math.round(perCreditPrice * purchaseAmount);

    const normalizeTopupAmount = () => {
        const raw = purchaseAmountInput.replace(/\D/g, '');
        if (!raw) {
            setPurchaseAmountInput(String(STUDIO_MIN_TOPUP_CREDITS));
            return;
        }
        const numericValue = Number(raw);
        if (numericValue < STUDIO_MIN_TOPUP_CREDITS) {
            setPurchaseAmountInput(String(STUDIO_MIN_TOPUP_CREDITS));
            return;
        }
        if (numericValue > STUDIO_MAX_TOPUP_CREDITS) {
            setPurchaseAmountInput(String(STUDIO_MAX_TOPUP_CREDITS));
            return;
        }
        setPurchaseAmountInput(String(numericValue));
    };

    const handleTopupPurchase = () => {
        if (!subscription || !accountId || subscription.status === 'cancelled') return;
        setTopupProcessing(true);
        router.push('/contact');
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTop}>
                        <div className={styles.sidebarMetaRow}>
                            <div className={styles.sidebarCreditRow}>
                                <span className={styles.sidebarCreditLabel}>{t('Kalan kredi')}</span>
                                <span className={styles.sidebarCreditValue}>{credits.toLocaleString('tr-TR')}</span>
                            </div>
                            <p className={styles.sidebarHelper}>{t('Krediler anlık olarak senkronize edilir.')}</p>
                        </div>
                        <div className={styles.sidebarQuickActions}>
                            <button
                                type="button"
                                className={styles.sidebarCta}
                                onClick={() => setShowTopupPanel((prev) => !prev)}
                            >
                                {t('Aktivasyon Talep Et')}
                            </button>
                            <Link href="/dashboard/settings" className={styles.sidebarSettings}>{t('Ayarlar')}</Link>
                        </div>
                        {showTopupPanel ? (
                            <div className={styles.topupPanel}>
                                <p className={styles.topupText}>
                                    {t('İlk müşteriler için kredi ve paket aktivasyonlarini manuel olarak yapiyoruz. Ihtiyacinizi bize iletin, hesabinizi fatura ile aktive edelim.')}
                                </p>
                                <div className={styles.topupRow}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={purchaseAmountInput}
                                        onChange={(e) => {
                                            const digitsOnly = e.target.value.replace(/\D/g, '');
                                            setPurchaseAmountInput(digitsOnly);
                                        }}
                                        onFocus={(e) => e.currentTarget.select()}
                                        onBlur={normalizeTopupAmount}
                                        className={styles.topupInput}
                                    />
                                    <Link href="/contact" className={styles.topupButton}>
                                        {t('Bizimle Iletisime Gecin')}
                                    </Link>
                                </div>
                                <p className={`${styles.topupText} ${styles.topupTotalText}`}>
                                    {t('Tahmini aylik paket referansi: ₺{amount}').replace('{amount}', totalTopupPrice.toLocaleString('tr-TR'))}
                                </p>
                                <p className={`${styles.topupNote} ${styles.topupNoteSpaced}`}>
                                    {t('Minimum {min}, maksimum {max} kredi ihtiyacinizi belirtebilirsiniz.')
                                        .replace('{min}', STUDIO_MIN_TOPUP_CREDITS.toLocaleString('tr-TR'))
                                        .replace('{max}', STUDIO_MAX_TOPUP_CREDITS.toLocaleString('tr-TR'))}
                                </p>
                            </div>
                        ) : null}
                    </div>
                    <nav className={styles.toolNav} aria-label={t('Araçlar')}>
                        {TOOLS.map((tool) => {
                            const isDisabled = !!tool.status;
                            const isActive =
                                selectedToolId === tool.id &&
                                !(tool.id === 'stage' && (stageTabParam === 'works' || stageTabParam === 'photos'));
                            return (
                                <div key={tool.id} className={styles.toolGroup}>
                                    <button
                                        type="button"
                                        className={`${styles.toolItem} ${isActive ? styles.toolItemActive : ''} ${isDisabled ? styles.toolItemDisabled : ''}`}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            setSelectedToolId(tool.id);
                                            const params = new URLSearchParams();
                                            params.set('tool', tool.id);
                                            if (tool.id === 'stage') {
                                                params.set('stageTab', 'editor');
                                            }
                                            router.replace(`/studio?${params.toString()}`, { scroll: false });
                                        }}
                                        disabled={isDisabled}
                                    >
                                        <span className={styles.toolItemIcon}>{tool.icon}</span>
                                        <span className={styles.toolItemTitle}>{t(tool.title)}</span>
                                        {tool.status && <span className={styles.toolBadge}>{t(tool.status)}</span>}
                                    </button>
                                    {tool.id === 'ai-tour-guide' ? (
                                        <button
                                            type="button"
                                            className={`${styles.myPhotosItem} ${isMyPhotosActive ? styles.myPhotosItemActive : ''}`}
                                            onClick={() => {
                                                setSelectedToolId('stage');
                                                router.replace('/studio?tool=stage&stageTab=works', { scroll: false });
                                            }}
                                        >
                                            <span className={styles.myPhotosIcon} aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                                    <path d="M3 14l5-4 4 3 3-2 6 5" />
                                                    <circle cx="9" cy="9" r="1.2" />
                                                </svg>
                                            </span>
                                            <span className={styles.myPhotosTitle}>{t('Tüm Çalışmalarım')}</span>
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                <main className={styles.workspace} ref={workspaceRef}>
                    {ToolComponent ? (
                        <div className={styles.workspaceToolWrap}>
                            <ToolComponent />
                        </div>
                    ) : (
                        <div className={styles.noTool}>{t('Bir araç seçin.')}</div>
                    )}
                </main>
            </div>
        </div>
    );
}
