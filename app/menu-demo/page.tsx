"use client";

import Link from "next/link";
import styles from "./MenuDemo.module.css";

export default function MenuDemoPage() {
  return (
    <div className={styles.page}>
      <div className={styles.back}>
        <Link href="/">← Ana sayfaya dön</Link>
      </div>
      <h1 className={styles.title}>Mobil menü butonu alternatifleri</h1>
      <p className={styles.subtitle}>
        Responsive header sağ üstte kullanılabilecek 5 seçenek. Birini seçip söyleyebilirsin.
      </p>

      {/* Seçenek 1: Hamburger + Menü */}
      <section className={styles.section}>
        <div className={styles.bar}>
          <div className={styles.logo}>Emlak AISTUDIO</div>
          <button type="button" className={styles.menuButton} aria-label="Menü">
            <span className={styles.hamburger}>
              <span />
              <span />
              <span />
            </span>
            <span className={styles.menuLabel}>Menü</span>
          </button>
        </div>
        <p className={styles.caption}>1. Hamburger + &quot;Menü&quot; yazısı</p>
      </section>

      {/* Seçenek 2: Liste ikonu */}
      <section className={styles.section}>
        <div className={styles.bar}>
          <div className={styles.logo}>Emlak AISTUDIO</div>
          <button type="button" className={styles.menuButton} aria-label="Menü">
            <svg className={styles.listIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="6" r="1.5" fill="currentColor" />
              <line x1="10" y1="6" x2="20" y2="6" />
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
              <line x1="10" y1="12" x2="20" y2="12" />
              <circle cx="5" cy="18" r="1.5" fill="currentColor" />
              <line x1="10" y1="18" x2="20" y2="18" />
            </svg>
            <span className={styles.menuLabel}>Menü</span>
          </button>
        </div>
        <p className={styles.caption}>2. Liste ikonu (satırlar + noktalar) + Menü</p>
      </section>

      {/* Seçenek 3: Dikey üç nokta */}
      <section className={styles.section}>
        <div className={styles.bar}>
          <div className={styles.logo}>Emlak AISTUDIO</div>
          <button type="button" className={styles.menuButton} aria-label="Menü">
            <span className={styles.dotsVertical}>
              <span />
              <span />
              <span />
            </span>
            <span className={styles.menuLabel}>Menü</span>
          </button>
        </div>
        <p className={styles.caption}>3. Dikey üç nokta (⋮) + Menü</p>
      </section>

      {/* Seçenek 4: Grid */}
      <section className={styles.section}>
        <div className={styles.bar}>
          <div className={styles.logo}>Emlak AISTUDIO</div>
          <button type="button" className={styles.menuButton} aria-label="Menü">
            <span className={styles.gridIcon}>
              <span /><span /><span /><span />
            </span>
            <span className={styles.menuLabel}>Menü</span>
          </button>
        </div>
        <p className={styles.caption}>4. Kare ızgara (grid) + Menü</p>
      </section>

      {/* Seçenek 5: Sadece "Menü" butonu */}
      <section className={styles.section}>
        <div className={styles.bar}>
          <div className={styles.logo}>Emlak AISTUDIO</div>
          <button type="button" className={styles.menuButtonTextOnly} aria-label="Menü">
            Menü
          </button>
        </div>
        <p className={styles.caption}>5. Sadece &quot;Menü&quot; butonu (pill)</p>
      </section>
    </div>
  );
}
