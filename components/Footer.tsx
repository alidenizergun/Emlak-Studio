"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

const Footer = () => {
    const logoTextWrapperRef = useRef<HTMLDivElement>(null);
    const logoBrandRef = useRef<HTMLSpanElement>(null);
    const logoStudioRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const wrapper = logoTextWrapperRef.current;
        const brand = logoBrandRef.current;
        const studio = logoStudioRef.current;
        if (!wrapper || !brand || !studio) return;
        const apply = () => {
            studio.style.transform = '';
            studio.style.transformOrigin = '';
            wrapper.style.width = '';
            wrapper.style.minWidth = '';
            wrapper.offsetHeight; // reflow
            const wBrand = brand.offsetWidth;
            const wStudio = studio.offsetWidth;
            if (wStudio <= 0) return;
            wrapper.style.width = `${wBrand}px`;
            wrapper.style.minWidth = `${wBrand}px`;
            const scale = wBrand / wStudio;
            studio.style.transform = `scaleX(${scale})`;
            studio.style.transformOrigin = 'left';
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(wrapper);
        return () => ro.disconnect();
    }, []);

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
                            <div className={styles.logoTextWrapper} ref={logoTextWrapperRef}>
                                <span className={styles.logoBrand} ref={logoBrandRef}>EMLAK</span>
                                <span className={styles.logoStudio}><span className={styles.logoStudioInner} ref={logoStudioRef}>YZ.com</span></span>
                            </div>
                        </div>
                        <p>Emlak pazarlamasında <span className={styles.logoStudioInline}>Y</span>apay <span className={styles.logoStudioInline}>Z</span>eka devrimi.</p>
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
                        <li><Link href="/stage">Dekorasyon Stüdyosu</Link></li>
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
