'use client';

import ComparisonSlider from './ComparisonSlider';
import { useI18n } from '@/components/LanguageProvider';
import styles from './HomeFeatureCards.module.css';

const cards = [
    {
        id: 'stage',
        eyebrow: 'Sanal Dekorasyon',
        titleAccent: 'Boş Odaları',
        titleRest: 'ilan-ready sahnelere dönüştürün',
        description:
            'Mobilya, aydınlatma ve stil dokunuşlarıyla boş alanları dakikalar içinde daha sıcak ve daha ikna edici gösterin.',
        beforeImage: '/images/examples/living-empty.png',
        afterImage: '/images/examples/living-furnished.png',
        beforeAlt: 'Dekorasyon öncesi boş salon',
        afterAlt: 'Dekorasyon sonrası döşenmiş salon',
    },
    {
        id: 'enhance',
        eyebrow: 'Fotoğraf Geliştirme',
        titleAccent: 'Karanlık Kareleri',
        titleRest: 'temiz ve dikkat çekici hale getirin',
        description:
            'Düşük etkili emlak fotoğraflarını daha net, daha dengeli ve daha profesyonel bir sunuma yükseltin.',
        beforeImage: '/images/hero-before-v17.png',
        afterImage: '/images/hero-after-v17.png',
        beforeAlt: 'Fotoğraf geliştirme öncesi oda',
        afterAlt: 'Fotoğraf geliştirme sonrası aydınlatılmış oda',
    },
    {
        id: 'remove-object',
        eyebrow: 'Akıllı Eşya Silme',
        titleAccent: 'Dikkat Dağıtan',
        titleRest: 'eşyaları tek dokunuşla temizleyin',
        description:
            'Kadrajdaki gereksiz eşyaları, dağınıklığı ve dikkat dağıtan nesneleri kaldırarak mekanı daha temiz ve daha ferah gösterin.',
        beforeImage: '/images/examples/mudroom-after.png',
        afterImage: '/images/home-cards/remove-object-after.png',
        beforeAlt: 'Eşya silme öncesi dağınık giriş alanı',
        afterAlt: 'Eşya silme sonrası sadeleştirilmiş giriş alanı',
    },
    {
        id: 'renovation',
        eyebrow: 'Sanal Tadilat',
        titleAccent: 'Eski Alanları',
        titleRest: 'modern bitmiş mekanlar gibi sunun',
        description:
            'Tamamlanmamış ya da eski görünen alanları, yatırımcıya ve alıcıya daha net bir gelecek senaryosuyla gösterin.',
        beforeImage: '/images/examples/pantry-before.png',
        afterImage: '/images/examples/pantry-after.png',
        beforeAlt: 'Sanal tadilat öncesi mekan',
        afterAlt: 'Sanal tadilat sonrası yenilenmiş mekan',
    },
];

export default function HomeFeatureCards() {
    const { t } = useI18n();

    return (
        <section className={styles.section}>
            <div className={styles.backdrop} aria-hidden="true" />
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span>{t('Tek bir akışta mekanı iyileştirin,')}</span>
                        <span>{t('dekore edin ve yeniden hayal ettirin')}</span>
                    </h2>
                </div>

                <div className={styles.grid}>
                    {cards.map((card) => (
                        <article key={card.id} className={styles.card}>
                            <div className={styles.sliderWrap}>
                                <ComparisonSlider
                                    beforeImage={card.beforeImage}
                                    afterImage={card.afterImage}
                                    beforeAlt={t(card.beforeAlt)}
                                    afterAlt={t(card.afterAlt)}
                                    preserveAspect={true}
                                    introHint="once"
                                    variant="default"
                                    labels={{ before: t('Önce'), after: t('Sonra') }}
                                />
                            </div>

                            <div className={styles.cardBody}>
                                <span className={styles.cardEyebrow}>{t(card.eyebrow)}</span>
                                <div className={styles.titleRule} aria-hidden="true" />
                                <p className={styles.cardDescription}>{t(card.description)}</p>
                            </div>
                        </article>
                    ))}
                </div>

            </div>
        </section>
    );
}
