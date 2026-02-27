"use client";

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { TOOLS, ENHANCE_ICON } from '@/app/tools/toolsData';

// Icons for Mobile Menu (ENHANCE_ICON tek kaynak — hydration uyumu)
const Icons = {
    Enhance: ENHANCE_ICON,
    Stage: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-2m-14 0H5m14 0v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
        </svg>
    ),
    Tools: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 011-1V4z" />
        </svg>
    ),
    Pricing: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    Close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    ),
    Support: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
};

const Header = () => {
    const pathname = usePathname();
    const isBillingPage = pathname?.startsWith('/checkout');
    const isStudioPage = pathname?.startsWith('/studio');
    const useNeutralPrivateBtnStyle = isBillingPage || isStudioPage;
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showRegisterNotify, setShowRegisterNotify] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);

    // Set mounted state and read auth
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
        try {
            if (typeof window !== 'undefined') {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsAuthed(window.localStorage.getItem('emlak_authed') === '1');
            }
        } catch {}

        let timeoutId: NodeJS.Timeout;

        const startCycle = () => {
            // Wait 15s before showing (ilk açılışta 15 sn sonra gelsin)
            timeoutId = setTimeout(() => {
                setShowRegisterNotify(true);
                // Show for 20s
                timeoutId = setTimeout(() => {
                    setShowRegisterNotify(false);
                    // Cycle again after 10s hide
                    startCycle();
                }, 20000);
            }, 15000);
        };

        startCycle();

        // Close notification if hero popup opens
        const handleHeroPopup = () => {
            setShowRegisterNotify(false);
            // Optionally clear timeout to reset cycle if it's currently showing or about to show
            if (timeoutId) clearTimeout(timeoutId);
            // Restart cycle after a delay if popup closed? No, let's keep it simple for now as per request.
        };
        window.addEventListener('heroPopupOpen', handleHeroPopup);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            window.removeEventListener('heroPopupOpen', handleHeroPopup);
        };
    }, []);

    // Close menu when route changes
    useEffect(() => {
        const t = setTimeout(() => setIsMenuOpen(false), 0);
        return () => clearTimeout(t);
    }, [pathname]);

    // Re-read auth when pathname changes (e.g. after login redirect)
    useEffect(() => {
        if (!isMounted || typeof window === 'undefined') return;
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsAuthed(window.localStorage.getItem('emlak_authed') === '1');
        } catch {}
    }, [pathname, isMounted]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('emlak_authed');
                window.localStorage.removeItem('emlak_user_phone');
                window.localStorage.removeItem('emlak_credits');
            }
        } catch {}
        setIsAuthed(false);
        setShowRegisterNotify(false);
        setIsMenuOpen(false);
        router.push('/');
    };

    // Close menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    return (
        <header className={styles.header}>
            <div className={`container ${styles.container}`}>
                <div className={styles.logo}>
                    <Link href="/">
                        <div className={styles.logoIcon}>
                            <Image
                                src="/logo.png"
                                alt="Emlak Stüdyosu Logo"
                                width={64}
                                height={64}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                priority
                            />
                        </div>
                        <div className={styles.logoTextWrapper}>
                            <span className={styles.logoBrand}>EMLAK</span>
                            <span className={styles.logoStudio}><span className={styles.logoStudioInner}>Stüdyosu</span></span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className={`${styles.nav} ${styles.desktopNav}`}>
                    <ul className={styles.navList}>
                        <li>
                            <Link href={isAuthed ? '/studio?tool=enhance' : '/enhance'} className={styles.navLink}>Fotoğraf Geliştirme</Link>
                        </li>
                        <li>
                            <Link href={isAuthed ? '/studio?tool=stage' : '/stage'} className={styles.navLink}>Dekorasyon</Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link href="/tools" className={styles.navLink}>Tüm Araçlar</Link>
                            <div className={styles.megaMenu}>
                                {TOOLS.map((tool) => {
                                    const isSoon = !!tool.status;
                                    const content = (
                                        <>
                                            <div className={styles.menuIcon}>{tool.icon}</div>
                                            <div className={styles.menuContent}>
                                                <span className={styles.menuTitle}>
                                                    {tool.title}
                                                    {tool.status && <span className={styles.menuBadge}>{tool.status}</span>}
                                                </span>
                                                <span className={styles.menuDesc}>{tool.description}</span>
                                            </div>
                                        </>
                                    );
                                    return isSoon ? (
                                        <span key={tool.id} className={`${styles.megaMenuItem} ${styles.megaMenuItemDisabled}`} aria-disabled="true">
                                            {content}
                                        </span>
                                    ) : (
                                        <Link key={tool.id} href={isAuthed ? `/studio?tool=${encodeURIComponent(tool.id)}` : tool.href} className={styles.megaMenuItem}>
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </li>
                        <li>
                            <Link href="/pricing" className={styles.navLink}>Fiyatlandırma</Link>
                        </li>
                    </ul>
                </nav>

                <div className={`${styles.cta} ${styles.desktopCta}`}>
                    {isAuthed ? (
                        <>
                            <Link href="/studio" className={useNeutralPrivateBtnStyle ? styles.loginBtn : styles.registerBtn}>Stüdyo</Link>
                            <button type="button" className={styles.loginBtn} onClick={handleLogout}>
                                Çıkış Yap
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={styles.loginBtn} onClick={() => setShowRegisterNotify(false)}>Giriş Yap</Link>
                            <div className={styles.registerWrapper}>
                                <Link href="/register" className={styles.registerBtn} onClick={() => setShowRegisterNotify(false)}>
                                    Ücretsiz Deneyin
                                </Link>
                                {showRegisterNotify && (
                                    <div className={styles.notification} onClick={() => setShowRegisterNotify(false)}>
                                        <span>1 fotoğraf için ücretsiz deneyin 🎁</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className={styles.mobileToggle}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                    style={{
                        opacity: isMenuOpen ? 0 : 1,
                        pointerEvents: isMenuOpen ? 'none' : 'auto',
                        visibility: isMenuOpen ? 'hidden' : 'visible'
                    }}
                >
                    <span className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>

            {/* Mobile Menu Overlay - Moved outside container but inside header tag */}
            {isMounted && (
                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                    <div className={styles.mobileMenuHeader}>
                        <div className={styles.logo}>
                            <Link href="/" onClick={() => setIsMenuOpen(false)}>
                                <div className={styles.logoIcon}>
                                    <Image
                                        src="/logo.png"
                                        alt="Emlak Stüdyosu Logo"
                                        width={64}
                                        height={64}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <div className={styles.logoTextWrapper}>
                                    <span className={styles.logoBrand}>EMLAK</span>
                                    <span className={styles.logoStudio}><span className={styles.logoStudioInner}>Stüdyosu</span></span>
                                </div>
                            </Link>
                        </div>
                        <button className={styles.menuCloseBtn} onClick={() => setIsMenuOpen(false)}>
                            {Icons.Close}
                        </button>
                    </div>

                    <nav className={styles.mobileNav}>
                        <Link href={isAuthed ? '/studio?tool=enhance' : '/enhance'} className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                            <div className={styles.mobileIconWrapper}>{Icons.Enhance}</div>
                            <div className={styles.mobileLinkContent}>
                                <span className={styles.mobileLinkLabel}>Fotoğraf Geliştirme</span>
                                <span className={styles.mobileLinkDesc}>Emlak fotoğraflarını yapay zeka ile mükemmelleştirin</span>
                            </div>
                        </Link>
                        <Link href={isAuthed ? '/studio?tool=stage' : '/stage'} className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                            <div className={styles.mobileIconWrapper}>{Icons.Stage}</div>
                            <div className={styles.mobileLinkContent}>
                                <span className={styles.mobileLinkLabel}>Dekorasyon</span>
                                <span className={styles.mobileLinkDesc}>Boş odaları yapay zeka ile döşeyin</span>
                            </div>
                        </Link>
                        <Link href="/tools" className={styles.mobileNavLink}>
                            <div className={styles.mobileIconWrapper}>{Icons.Tools}</div>
                            <div className={styles.mobileLinkContent}>
                                <span className={styles.mobileLinkLabel}>Tüm Araçlar</span>
                                <span className={styles.mobileLinkDesc}>Aktif araçlar + Yakında gelecekler</span>
                            </div>
                        </Link>
                        <Link href="/pricing" className={styles.mobileNavLink}>
                            <div className={styles.mobileIconWrapper}>{Icons.Pricing}</div>
                            <div className={styles.mobileLinkContent}>
                                <span className={styles.mobileLinkLabel}>Fiyatlandırma</span>
                                <span className={styles.mobileLinkDesc}>Sizin için en uygun planı seçin</span>
                            </div>
                        </Link>

                        <div className={styles.mobileCtaCard}>
                            {isAuthed ? (
                                <>
                                    <div className={styles.mobileRegisterWrapper}>
                                        <Link href="/studio" className={useNeutralPrivateBtnStyle ? styles.mobileLoginBtn : styles.mobileRegisterBtn} onClick={() => setIsMenuOpen(false)}>
                                            Stüdyo
                                        </Link>
                                    </div>
                                    <button type="button" className={styles.mobileLoginBtn} onClick={handleLogout}>
                                        Çıkış Yap
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className={styles.mobileRegisterWrapper}>
                                        <Link href="/register" className={styles.mobileRegisterBtn}>✨ Ücretsiz Denemeye Başla</Link>
                                        <span className={styles.mobileCtaSubText}>1 fotoğraf için ücretsiz deneyin 🎁</span>
                                    </div>
                                    <Link href="/login" className={styles.mobileLoginBtn}>Giriş Yap</Link>
                                </>
                            )}
                        </div>
                    </nav>

                    <div className={styles.mobileMenuFooter} style={{ "--i": "4" } as CSSProperties}>
                        <div className={styles.footerLinks}>
                            <Link href="/help" className={styles.footerLink}>
                                {Icons.Support} <span>Yardım Merkezi</span>
                            </Link>
                        </div>
                        <div className={styles.footerBrand}>
                            <p>© 2026 Emlak Stüdyosu. Her hakkı saklıdır.</p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
