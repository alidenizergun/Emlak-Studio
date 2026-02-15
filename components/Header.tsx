"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { TOOLS } from '@/app/tools/toolsData';

// Icons for Mobile Menu
const Icons = {
    Enhance: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    // Set mounted state
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

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
                            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 20L16 16L20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 16V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 14C6 8.47715 10.4772 4 16 4C21.5228 4 26 8.47715 26 14V22C26 23.1046 25.1046 24 24 24H8C6.89543 24 6 23.1046 6 22V14Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                                <circle cx="24" cy="8" r="4" fill="url(#logo_gradient)" />
                                <path d="M24 6.5L25 8L24 9.5L23 8L24 6.5Z" fill="white" />
                                <defs>
                                    <linearGradient id="logo_gradient" x1="20" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#10b981" />
                                        <stop offset="1" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className={styles.logoTextWrapper}>
                            <span className={styles.logoBrand}>Emlak</span>
                            <span className={styles.logoStudio}>AISTUDIO</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className={`${styles.nav} ${styles.desktopNav}`}>
                    <ul className={styles.navList}>
                        <li>
                            <Link href="/enhance" className={styles.navLink}>Fotoğraf Geliştirme</Link>
                        </li>
                        <li>
                            <Link href="/stage" className={styles.navLink}>Sanal Dekorasyon</Link>
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
                                        <Link key={tool.id} href={tool.href} className={styles.megaMenuItem}>
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
                    <Link href="/login" className={styles.loginBtn}>Giriş Yap</Link>
                    <Link href="/register" className={styles.registerBtn}>Ücretsiz Dene</Link>
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
                                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 20L16 16L20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M16 16V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M6 14C6 8.47715 10.4772 4 16 4C21.5228 4 26 8.47715 26 14V22C26 23.1046 25.1046 24 24 24H8C6.89543 24 6 23.1046 6 22V14Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                                        <circle cx="24" cy="8" r="4" fill="url(#logo_gradient_mobile)" />
                                        <path d="M24 6.5L25 8L24 9.5L23 8L24 6.5Z" fill="white" />
                                        <defs>
                                            <linearGradient id="logo_gradient_mobile" x1="20" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
                                                <stop stopColor="#10b981" />
                                                <stop offset="1" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                <div className={styles.logoTextWrapper}>
                                    <span className={styles.logoBrand}>Emlak</span>
                                    <span className={styles.logoStudio}>AISTUDIO</span>
                                </div>
                            </Link>
                        </div>
                        <button className={styles.menuCloseBtn} onClick={() => setIsMenuOpen(false)}>
                            {Icons.Close}
                        </button>
                    </div>

                    <nav className={styles.mobileNav}>
                        <Link href="/enhance" className={styles.mobileNavLink}>
                            <div className={styles.mobileIconWrapper}>{Icons.Enhance}</div>
                            <div className={styles.mobileLinkContent}>
                                <span className={styles.mobileLinkLabel}>Fotoğraf Geliştirme</span>
                                <span className={styles.mobileLinkDesc}>Emlak fotoğraflarını yapay zeka ile mükemmelleştirin</span>
                            </div>
                        </Link>
                        <Link href="/stage" className={styles.mobileNavLink}>
                            <div className={styles.mobileIconWrapper}>{Icons.Stage}</div>
                            <div className={styles.mobileLinkContent}>
                                <span className={styles.mobileLinkLabel}>Sanal Dekorasyon</span>
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
                            <Link href="/register" className={styles.mobileRegisterBtn}>✨ Ücretsiz Denemeye Başla</Link>
                            <Link href="/login" className={styles.mobileLoginBtn}>Giriş Yap</Link>
                        </div>
                    </nav>

                    <div className={styles.mobileMenuFooter} style={{ "--i": "4" } as any}>
                        <div className={styles.footerLinks}>
                            <Link href="/help" className={styles.footerLink}>
                                {Icons.Support} <span>Yardım Merkezi</span>
                            </Link>
                        </div>
                        <div className={styles.footerBrand}>
                            <p>© 2026 Emlak Studio. Her hakkı saklıdır.</p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
