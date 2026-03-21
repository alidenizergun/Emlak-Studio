'use client';

import Link from 'next/link';
import styles from './AiTourGuide.module.css';

export default function AiTourGuideComingSoon() {
    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Sanal Sunucu</h1>
                    <p className={styles.description}>
                        Bu araç MVP sonrasındaki sürüm için hazırlanıyor. Metin akışı, anlatım kalitesi ve gerçek video üretimi tamamlandığında tekrar açacağız.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        <span className={styles.inlineCost} style={{ background: '#f4efe4', color: '#8a5a12' }}>Yakında</span>
                        <span className={styles.inlineCost}>MVP sonrası açılacak</span>
                    </div>
                </div>
            </header>

            <div className={styles.workspace}>
                <div className={styles.controlsSidebar} style={{ maxWidth: 720, margin: '0 auto' }}>
                    <div className={styles.panel}>
                        <div className={styles.panelTitleRow}>
                            <div className={styles.panelTitle}>Bu arada aktif araçlarla devam edebilirsiniz</div>
                        </div>
                        <p style={{ marginTop: '0.75rem', lineHeight: 1.7 }}>
                            Fotoğraf geliştirme, dekorasyon, akıllı eşya silme, tadilat ve ilan metni oluşturucu şu anda aktif. Sanal Sunucu kartı görünür kalacak, ancak işlem başlatmayacak.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                            <Link href="/studio?tool=enhance" className={styles.downloadBtn}>Fotoğraf Geliştirme</Link>
                            <Link href="/studio?tool=stage" className={styles.resetBtn}>Dekorasyon</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
