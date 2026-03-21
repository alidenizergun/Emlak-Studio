"use client";
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';
import { useI18n } from '@/components/LanguageProvider';

const Footer = () => {
    const { t } = useI18n();
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.column}>
                    <div className={styles.brand}>
                        <div className={styles.logoWrapper}>
                            <div className={styles.logoIcon}>
                                <Image
                                    src="/logo.png"
                                    alt="Studio Estate Logo"
                                    width={64}
                                    height={64}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div className={styles.logoTextWrapper}>
                                <span className={styles.logoBrand}>Studio</span>
                                <span className={styles.logoStudio}><span className={styles.logoStudioInner}>Estate</span></span>
                            </div>
                        </div>
                        <p>{t('Emlak fotoğraflarınız için güçlü görsel çözümler.')}</p>
                        <div className={styles.copyrightWrapper}>
                            <p className="text-secondary">© 2026 Studio Estate</p>
                            <p className="text-secondary">{t('Tüm hakları saklıdır.')}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.column}>
                    <h4>{t('Ürünler')}</h4>
                    <ul>
                        <li><Link href="/enhance">{t('Fotoğraf Geliştirme')}</Link></li>
                        <li><Link href="/stage">{t('Dekorasyon')}</Link></li>
                        <li><Link href="/remove-object">{t('Akıllı Eşya Silme')}</Link></li>
                        <li><Link href="/sanal-tadilat">{t('Tadilat')}</Link></li>
                        <li>
                            <span className={styles.soonItem}>
                                <span>{t('Sanal Sunucu')}</span>
                                <span className={styles.soonBadge}>{t('Yakında')}</span>
                            </span>
                        </li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>{t('Kurumsal')}</h4>
                    <ul>
                        <li><Link href="/about">{t('Hakkımızda')}</Link></li>
                        <li><Link href="/help">{t('Yardım Merkezi')}</Link></li>
                        <li><Link href="/suggestions">{t('Öneriler')}</Link></li>
                        <li><Link href="/contact">{t('İletişim')}</Link></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>{t('Yasal')}</h4>
                    <ul>
                        <li><Link href="/privacy">{t('Gizlilik Politikası')}</Link></li>
                        <li><Link href="/terms">{t('Kullanım Şartları')}</Link></li>
                    </ul>
                </div>
            </div >

        </footer >
    );
};

export default Footer;
