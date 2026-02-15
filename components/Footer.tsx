import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.column}>
                    <div className={styles.brand}>
                        <div className={styles.logoWrapper}>
                            <div className={styles.logoIcon}>
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 20L16 16L20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 16V24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 14C6 8.47715 10.4772 4 16 4C21.5228 4 26 8.47715 26 14V22C26 23.1046 25.1046 24 24 24H8C6.89543 24 6 23.1046 6 22V14Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                                    <circle cx="24" cy="8" r="4" fill="url(#logo_gradient_footer)" />
                                    <path d="M24 6.5L25 8L24 9.5L23 8L24 6.5Z" fill="white" />
                                    <defs>
                                        <linearGradient id="logo_gradient_footer" x1="20" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
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
                        </div>
                        <p>Emlak pazarlamasında yapay zeka devrimi.</p>
                        <div className={styles.copyrightWrapper}>
                            <p className="text-secondary">© 2026 Emlak Studio</p>
                            <p className="text-secondary">Tüm hakları saklıdır.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.column}>
                    <h4>Ürünler</h4>
                    <ul>
                        <li><Link href="/enhance">Fotoğraf Geliştirme</Link></li>
                        <li><Link href="/stage">Sanal Dekorasyon</Link></li>
                        <li><Link href="/tools">Metin Üretici</Link></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>Kurumsal</h4>
                    <ul>
                        <li><Link href="/about">Hakkımızda</Link></li>
                        <li><Link href="/blog">Blog</Link></li>
                        <li><Link href="/contact">İletişim</Link></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>Yasal</h4>
                    <ul>
                        <li><Link href="/privacy">Gizlilik Politikası</Link></li>
                        <li><Link href="/terms">Kullanım Şartları</Link></li>
                    </ul>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
