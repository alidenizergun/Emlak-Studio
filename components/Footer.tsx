"use client";
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.column}>
                    <div className={styles.brand}>
                        <div className={styles.logoWrapper}>
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
                        </div>
                        <p>Emlak ilanlarınız için güçlü görsel çözümler.</p>
                        <div className={styles.copyrightWrapper}>
                            <p className="text-secondary">© 2026 Emlak Stüdyosu</p>
                            <p className="text-secondary">Tüm hakları saklıdır.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.column}>
                    <h4>Ürünler</h4>
                    <ul>
                        <li><Link href="/enhance">Fotoğraf Geliştirme</Link></li>
                        <li><Link href="/stage">Dekorasyon</Link></li>
                        <li><Link href="/">Tüm araçlar</Link></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>Kurumsal</h4>
                    <ul>
                        <li><Link href="/about">Hakkımızda</Link></li>
                        <li><Link href="/help">Yardım Merkezi</Link></li>
                        <li><Link href="/suggestions">Öneriler</Link></li>
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
            </div >

        </footer >
    );
};

export default Footer;
