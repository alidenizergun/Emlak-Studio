import styles from './StudioSidebarVariants.module.css';
import type { Metadata } from 'next';

type Variant = {
  id: string;
  name: string;
  note: string;
};

const variants: Variant[] = [
  { id: 'v1', name: 'Left Rail', note: 'Sol ray + sade blok' },
  { id: 'v2', name: 'Top Metric', note: 'Ustte buyuk metrik' },
  { id: 'v3', name: 'Split Stack', note: 'Ikiye bolunmus kart' },
  { id: 'v4', name: 'Pill Header', note: 'Rozet baslik + inline kredi' },
  { id: 'v5', name: 'Action First', note: 'Aksiyon odakli hiyerarsi' },
  { id: 'v6', name: 'Center Focus', note: 'Ortalanmis kredi odagi' },
  { id: 'v7', name: 'Dual Tone', note: 'Iki tonlu panel yapisi' },
  { id: 'v8', name: 'Outline Grid', note: 'Keskin cerceve sistemi' },
  { id: 'v9', name: 'Compact Strip', note: 'Serit panel + mini butonlar' },
  { id: 'v10', name: 'Card Rows', note: 'Satir bazli bilgi duzeni' },
  { id: 'v11', name: 'Hero CTA', note: 'CTA one cikan ust blok' },
  { id: 'v12', name: 'Mono Pro', note: 'Monokrom profesyonel' },
  { id: 'v13', name: 'Segmented', note: 'Segmentli buton bar' },
  { id: 'v14', name: 'Soft Panel', note: 'Yumusak ayri katmanlar' },
  { id: 'v15', name: 'Label Blocks', note: 'Etiket kutu dili' },
  { id: 'v16', name: 'Dashboard Lite', note: 'Mini dashboard hissi' },
  { id: 'v17', name: 'Vertical CTA', note: 'Dikey aksiyon kolonlari' },
  { id: 'v18', name: 'Info Bar', note: 'Bilgi cizgisi + sabit eylem' },
  { id: 'v19', name: 'Minimal Tabs', note: 'Tab benzeri kontrol' },
  { id: 'v20', name: 'Clean Future', note: 'Modern sade gelecek dili' },
];

export const metadata: Metadata = {
  title: 'Studio Sidebar Varyasyonları',
  robots: { index: false, follow: false },
};

export default function StudioSidebarVariantsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Studio Sidebar Tasarim Varyasyonlari</h1>
        <p>20 farkli yapisal tasarim ayni sayfada. Renk degil, layout farklarini karsilastir.</p>
      </header>

      <div className={styles.grid}>
        {variants.map((variant) => (
          <article key={variant.id} className={`${styles.variantCard} ${styles[variant.id]}`}>
            <div className={styles.variantMeta}>
              <span className={styles.variantId}>{variant.id.toUpperCase()}</span>
              <div>
                <h2 className={styles.variantName}>{variant.name}</h2>
                <p className={styles.variantNote}>{variant.note}</p>
              </div>
            </div>

            <div className={styles.mock}>
              <div className={styles.creditBox}>
                <span className={styles.creditLabel}>Kalan kredi</span>
                <span className={styles.creditValue}>250</span>
              </div>

              <p className={styles.helper}>Kredi anlik olarak senkronize edilir.</p>

              <div className={styles.actions}>
                <button type="button" className={styles.primaryBtn}>Kredi al</button>
                <button type="button" className={styles.secondaryBtn}>Ayarlar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
