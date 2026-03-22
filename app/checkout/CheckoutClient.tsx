'use client';

import styles from './Checkout.module.css';
import LocalizedLink from '@/components/LocalizedLink';

export default function CheckoutClient() {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <div className={styles.hero}>
                    <div>
                        <h1 className={styles.title}>Odeme entegrasyonu MVP sonrasi acilacak</h1>
                        <p className={styles.subtitle}>
                            Ilk musteriler icin kredi ve paket aktivasyonlarini manuel olarak yurutuyoruz. Ihtiyacinizi paylasin, faturanizi keselim ve hesabinizi aktive edelim.
                        </p>
                    </div>
                </div>

                <div className={styles.layout}>
                    <div className={styles.card}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Simdilik nasil ilerliyoruz?</h2>
                            <span className={styles.secureNote}>Manuel Aktivasyon</span>
                        </div>
                        <ol style={{ display: 'grid', gap: '0.9rem', lineHeight: 1.7, paddingLeft: '1.2rem' }}>
                            <li>Ihtiyac duydugunuz kredi veya paketi bize iletin.</li>
                            <li>Size uygun teklif ve fatura bilgisini paylasalim.</li>
                            <li>Odeme sonrasi hesabinizi ayni gun aktive edelim.</li>
                        </ol>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                            <LocalizedLink href="/contact" className={styles.payBtn}>Iletisime Gec</LocalizedLink>
                            <LocalizedLink href="/pricing" className={styles.payBtn}>Paketlere Geri Don</LocalizedLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
