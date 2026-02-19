'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { TOOLS } from '@/app/tools/toolsData';
import styles from './Studio.module.css';

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
    const [selectedToolId, setSelectedToolId] = useState<string>(() => getToolIdFromParam(toolParam));
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
        refreshCredits();
    }, [mounted, refreshCredits, router]);

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

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTop}>
                        <h1 className={styles.sidebarTitle}>Stüdyo</h1>
                        <div className={styles.sidebarCreditRow}>
                            <span className={styles.sidebarCreditLabel}>Kalan kredi</span>
                            <span className={styles.sidebarCreditValue}>{credits !== null ? credits : '—'}</span>
                        </div>
                        <Link href="/pricing" className={styles.sidebarCta}>Kredi al</Link>
                        <Link href="/dashboard/settings" className={styles.sidebarSettings}>Ayarlar</Link>
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
