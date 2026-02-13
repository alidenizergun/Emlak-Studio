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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00 text-2 2v16m14 0h-2m-14 0H5m14 0v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
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
    )
};

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9.5L12 2L21 9.5V20.5C21 21.0523 20.5523 21.5 20 21.5H4C3.44772 21.5 3 21.0523 3 20.5V9.5Z" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9 21.5V12.5H15V21.5" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="18" cy="6" r="3" fill="#2563EB" />
                                <path d="M18 4.5L19.5 7.5L16.5 7.5L18 4.5Z" fill="white" />
                                <defs>
                                    <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#2563EB" />
                                        <stop offset="1" stopColor="#4F46E5" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className={styles.logoText}>
                            <span style={{ color: '#2563EB' }}>Emlak</span><span style={{ color: '#10b981' }}>AIStudio</span>
                        </span>
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
                            <Link href="/tools" className={styles.navLink}>Araçlar</Link>
                            <div className={styles.megaMenu}>
                                {TOOLS.map((tool) => (
                                    <Link key={tool.id} href={tool.href} className={styles.megaMenuItem}>
                                        <div className={styles.menuIcon}>
                                            {tool.icon}
                                        </div>
                                        <div className={styles.menuContent}>
                                            <span className={styles.menuTitle}>{tool.title}</span>
                                            <span className={styles.menuDesc}>{tool.description}</span>
                                        </div>
                                    </Link>
                                ))}
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
                >
                    <div className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>

                {/* Mobile Menu Overlay */}
                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                    <div className={styles.mobileMenuHeader}>
                        <div className={styles.logo}>
                            <Link href="/">
                                <span className={styles.logoText}>
                                    <span style={{ color: '#2563EB' }}>Emlak</span><span style={{ color: '#10b981' }}>AIStudio</span>
                                </span>
                            </Link>
                        </div>
                    </div>

                    <nav className={styles.mobileNav}>
                        <div className={styles.mobileMenuSection} style={{ "--i": 1 } as any}>
                            <span className={styles.sectionLabel}>HİZMETLER</span>
                            <div className={styles.linkGroup}>
                                <Link href="/enhance" className={styles.mobileNavLink}>
                                    <div className={styles.mobileIconWrapper}>{Icons.Enhance}</div>
                                    <span>Fotoğraf Geliştirme</span>
                                </Link>
                                <Link href="/stage" className={styles.mobileNavLink}>
                                    <div className={styles.mobileIconWrapper}>{Icons.Stage}</div>
                                    <span>Sanal Dekorasyon</span>
                                </Link>
                            </div>
                        </div>

                        <div className={styles.mobileMenuSection} style={{ "--i": 2 } as any}>
                            <span className={styles.sectionLabel}>YAPAY ZEKA ARAÇLARI</span>
                            <div className={styles.linkGroup}>
                                <Link href="/tools" className={styles.mobileNavLink}>
                                    <div className={styles.mobileIconWrapper}>{Icons.Tools}</div>
                                    <span>Tüm Araçlar</span>
                                </Link>
                                <Link href="/pricing" className={styles.mobileNavLink}>
                                    <div className={styles.mobileIconWrapper}>{Icons.Pricing}</div>
                                    <span>Fiyatlandırma</span>
                                </Link>
                            </div>
                        </div>

                        <div className={styles.mobileMenuSection} style={{ "--i": 3 } as any}>
                            <div className={styles.mobileCta}>
                                <Link href="/login" className={styles.mobileLoginBtn}>Giriş Yap</Link>
                                <Link href="/register" className={styles.mobileRegisterBtn}>Kayıt Ol & Ücretsiz Dene</Link>
                            </div>
                        </div>
                    </nav>

                    <div className={styles.mobileMenuFooter} style={{ "--i": 4 } as any}>
                        <p>© 2026 Emlak Studio. Premium AI Tools.</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
