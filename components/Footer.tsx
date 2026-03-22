"use client";
import Image from 'next/image';
import styles from './Footer.module.css';
import { useI18n } from '@/components/LanguageProvider';
import LocalizedLink from '@/components/LocalizedLink';
import FooterLanguageSwitcher from '@/components/FooterLanguageSwitcher';

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
                        <li><LocalizedLink href="/enhance">{t('Fotoğraf Geliştirme')}</LocalizedLink></li>
                        <li><LocalizedLink href="/stage">{t('Sanal Dekorasyon')}</LocalizedLink></li>
                        <li><LocalizedLink href="/remove-object">{t('Akıllı Eşya Silme')}</LocalizedLink></li>
                        <li><LocalizedLink href="/sanal-tadilat">{t('Sanal Tadilat')}</LocalizedLink></li>
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
                        <li><LocalizedLink href="/about">{t('Hakkımızda')}</LocalizedLink></li>
                        <li><LocalizedLink href="/help">{t('Yardım Merkezi')}</LocalizedLink></li>
                        <li><LocalizedLink href="/suggestions">{t('Öneriler')}</LocalizedLink></li>
                        <li><LocalizedLink href="/pricing">{t('Fiyatlandırma')}</LocalizedLink></li>
                        <li><LocalizedLink href="/contact">{t('İletişim')}</LocalizedLink></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h4>{t('Yasal')}</h4>
                    <ul>
                        <li><LocalizedLink href="/privacy">{t('Gizlilik Politikası')}</LocalizedLink></li>
                        <li><LocalizedLink href="/terms">{t('Kullanım Şartları')}</LocalizedLink></li>
                    </ul>
                    <FooterLanguageSwitcher />
                </div>
            </div >

        </footer >
    );
};

export default Footer;
