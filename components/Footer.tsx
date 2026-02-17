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
                                    alt="Emlak YZ Logo"
                                    width={64}
                                    height={64}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div className={styles.logoTextWrapper}>
                                <span className={styles.logoBrand}>Emlak</span>
                                <span className={styles.logoStudio}>YZ</span>
                            </div>
                        </div>
                        <p>Emlak pazarlamasında <span className={styles.logoStudio}>Y</span>apay <span className={styles.logoStudio}>Z</span>eka devrimi.</p>
                        <div className={styles.copyrightWrapper}>
                            <p className="text-secondary">© 2026 Emlak YZ</p>
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
                        <li><Link href="/">Tüm araçlar</Link></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>Kurumsal</h4>
                    <ul>
                        <li><Link href="/about">Hakkımızda</Link></li>
                        <li><Link href="/help">Yardım Merkezi</Link></li>
                        <li><Link href="/blog">Blog</Link></li>
                        <li><Link href="/contact">İletişim</Link></li>
                        <li><Link href="/suggestions">Öneriler</Link></li>
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
