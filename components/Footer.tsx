import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.column}>
                    <div className={styles.brand}>
                        <h3>Emlak{' '}<span style={{ color: '#10b981' }}>AIStudio</span></h3>
                        <p>Emlak pazarlamasında yapay zeka devrimi.</p>
                        <div className={styles.copyrightWrapper}>
                            <p className="text-secondary">© 2026 Emlak Studio by ADE</p>
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
