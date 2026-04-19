'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './Checkout.module.css';
import LocalizedLink from '@/components/LocalizedLink';

export default function CheckoutClient() {
    const searchParams = useSearchParams();
    const isNativeIOSCheckout = useMemo(() => searchParams.get('native') === 'ios', [searchParams]);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.container}>
                <div className={styles.hero}>
                    <div>
                        <h1 className={styles.title}>
                            {isNativeIOSCheckout
                                ? 'iOS satin alma girisi hazirlaniyor'
                                : 'Odeme entegrasyonu MVP sonrasi acilacak'}
                        </h1>
                        <p className={styles.subtitle}>
                            {isNativeIOSCheckout
                                ? 'Bu ekran iOS uygulamasi icindeki App Store satin alma akisina ayrilmistir. Gecis surecinde aktivasyonlari manuel olarak hizla tamamliyoruz.'
                                : 'Ilk musteriler icin kredi ve paket aktivasyonlarini manuel olarak yurutuyoruz. Ihtiyacinizi paylasin, faturanizi keselim ve hesabinizi aktive edelim.'}
                        </p>
                    </div>
                </div>

                <div className={styles.layout}>
                    <div className={styles.card}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                {isNativeIOSCheckout ? 'iOS icin gecici satin alma adimlari' : 'Simdilik nasil ilerliyoruz?'}
                            </h2>
                            <span className={styles.secureNote}>{isNativeIOSCheckout ? 'iOS Gecis Modu' : 'Manuel Aktivasyon'}</span>
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
