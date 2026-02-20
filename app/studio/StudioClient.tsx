'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { TOOLS } from '@/app/tools/toolsData';
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
const IlanMetniClient = dynamic(() => import('@/app/ilan-metni/IlanMetniClient'), { ssr: false });
const SanalTadilatClient = dynamic(() => import('@/app/sanal-tadilat/SanalTadilatClient'), { ssr: false });
const AiTourGuideClient = dynamic(() => import('@/app/ai-tour-guide/AiTourGuideClient'), { ssr: false });

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
    'enhance': EnhanceClient,
    'stage': StageClient,
    'remove-object': RemoveObjectClient,
    'text': IlanMetniClient,
    'renovation': SanalTadilatClient,
    'ai-tour-guide': AiTourGuideClient,
};

export default function StudioClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toolParam = searchParams.get('tool');
    const [mounted, setMounted] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const [phone, setPhone] = useState('');
    const [selectedToolId, setSelectedToolId] = useState<string>(() => getToolIdFromParam(toolParam));
    const [showTopupPanel, setShowTopupPanel] = useState(false);
    const [purchaseAmountInput, setPurchaseAmountInput] = useState('100');
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [topupLoading, setTopupLoading] = useState(false);
    const [topupProcessing, setTopupProcessing] = useState(false);
    const workspaceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
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

    const refreshCredits = useCallback(() => {
        const phone = window.localStorage.getItem('emlak_user_phone');
        if (!phone) return;

        fetch(`/api/credits?phone=${encodeURIComponent(phone)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && typeof data.credits === 'number') {
                    setCredits(data.credits);
                    window.localStorage.setItem('emlak_credits', String(data.credits));
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;
        const authed = window.localStorage.getItem('emlak_authed') === '1';
        if (!authed) {
            router.replace('/login');
            return;
        }
        const currentPhone = window.localStorage.getItem('emlak_user_phone') || '';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPhone(currentPhone);
        refreshCredits();
    }, [mounted, refreshCredits, router]);

    useEffect(() => {
        if (!showTopupPanel || !phone) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTopupLoading(true);
        fetch(`/api/subscription?phone=${encodeURIComponent(phone)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.subscription) {
                    setSubscription(data.subscription as SubscriptionInfo);
                }
            })
            .catch(() => {})
            .finally(() => setTopupLoading(false));
    }, [showTopupPanel, phone]);

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
                <div className={styles.loading}>Yükleniyor...</div>
            </div>
        );
    }

    const ToolComponent = TOOL_COMPONENTS[selectedToolId];
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
        if (!subscription || !phone || subscription.status === 'cancelled') return;
        const amount = Math.max(STUDIO_MIN_TOPUP_CREDITS, Math.min(purchaseAmount, STUDIO_MAX_TOPUP_CREDITS));
        const params = new URLSearchParams({
            mode: 'topup',
            plan: subscription.planId,
            billing: 'monthly',
            credits: String(amount),
            total: String(Math.round(perCreditPrice * amount)),
        });
        setTopupProcessing(true);
        router.push(`/checkout?${params.toString()}`);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTop}>
                        <div className={styles.sidebarMetaRow}>
                            <div className={styles.sidebarCreditRow}>
                                <span className={styles.sidebarCreditLabel}>Kalan kredi</span>
                                <span className={styles.sidebarCreditValue}>{credits !== null ? credits : '—'}</span>
                            </div>
                            <p className={styles.sidebarHelper}>Krediler anlık olarak senkronize edilir.</p>
                        </div>
                        <div className={styles.sidebarQuickActions}>
                            <button
                                type="button"
                                className={styles.sidebarCta}
                                onClick={() => setShowTopupPanel((prev) => !prev)}
                            >
                                Kredi Satın Al
                            </button>
                            <Link href="/dashboard/settings" className={styles.sidebarSettings}>Ayarlar</Link>
                        </div>
                        {showTopupPanel ? (
                            <div className={styles.topupPanel}>
                                <p className={styles.topupText}>
                                    İhtiyacınıza göre kredi adedini girin ve anında hesabınıza ekleyin.
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
                                    <button
                                        type="button"
                                        className={styles.topupButton}
                                        onClick={handleTopupPurchase}
                                        disabled={topupLoading || topupProcessing || !subscription || subscription.status === 'cancelled'}
                                    >
                                        {topupProcessing ? 'Yönlendiriliyor...' : 'Kredi Satın Al'}
                                    </button>
                                </div>
                                <p className={`${styles.topupText} ${styles.topupTotalText}`}>Toplam ödeme: ₺{totalTopupPrice.toLocaleString('tr-TR')}</p>
                                <p className={styles.topupNote}>
                                    Ödeme tutarı, paketinize özel kredi birim maliyetine göre hesaplanır: ₺{Math.round(perCreditPrice).toLocaleString('tr-TR')} x {purchaseAmount} kredi.
                                </p>
                                <p className={`${styles.topupNote} ${styles.topupNoteSpaced}`}>
                                    Ek kredi satın alımı için minimum {STUDIO_MIN_TOPUP_CREDITS.toLocaleString('tr-TR')}, maksimum {STUDIO_MAX_TOPUP_CREDITS.toLocaleString('tr-TR')} kredi girebilirsiniz.
                                </p>
                            </div>
                        ) : null}
                    </div>
                    <nav className={styles.toolNav} aria-label="Araçlar">
                        {TOOLS.map((tool) => {
                            const isDisabled = !!tool.status;
                            const isActive = selectedToolId === tool.id;
                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    className={`${styles.toolItem} ${isActive ? styles.toolItemActive : ''} ${isDisabled ? styles.toolItemDisabled : ''}`}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        setSelectedToolId(tool.id);
                                        router.replace(`/studio?tool=${encodeURIComponent(tool.id)}`, { scroll: false });
                                    }}
                                    disabled={isDisabled}
                                >
                                    <span className={styles.toolItemIcon}>{tool.icon}</span>
                                    <span className={styles.toolItemTitle}>{tool.title}</span>
                                    {tool.status && <span className={styles.toolBadge}>{tool.status}</span>}
                                </button>
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
                        <div className={styles.noTool}>Bir araç seçin.</div>
                    )}
                </main>
            </div>
        </div>
    );
}
