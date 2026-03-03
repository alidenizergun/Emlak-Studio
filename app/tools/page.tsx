import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './Tools.module.css';
import { TOOLS } from './toolsData';
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Tüm Araçlar',
  description: `${SITE_NAME} araçları: fotoğraf geliştirme, dekorasyon, akıllı eşya silme, tadilat, ilan metni ve sanal sunucu.`,
  alternates: {
    canonical: '/tools',
  },
  openGraph: {
    title: `Tüm Araçlar | ${SITE_NAME}`,
    description: `${SITE_NAME} araçlarını tek noktadan keşfedin.`,
    url: absoluteUrl('/tools'),
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ToolsPage() {
  return (
    <div className={`container ${styles.pageContainer}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Emlak <span className={styles.titleAi}>Stüdyosu</span> Araçları</h1>
        <p className={styles.description}>
          İş akışınızı hızlandıracak ve satışlarınızı artıracak tüm araçlar tek bir yerde.
        </p>
      </div>

      <div className={styles.grid}>
        {TOOLS.map((tool) => {
          const isDisabled = !!tool.status;
          const cardContent = (
            <>
              {tool.status && <span className={styles.badgeCorner}>{tool.status}</span>}
              <div className={styles.iconWrapper}>{tool.icon}</div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{tool.title}</h3>
                <p className={styles.cardDescription}>{tool.description}</p>
              </div>
            </>
          );
          return isDisabled ? (
            <span key={tool.id} className={`${styles.card} ${styles.disabled}`} aria-disabled="true">
              {cardContent}
            </span>
          ) : (
            <Link key={tool.id} href={`/studio?tool=${encodeURIComponent(tool.id)}`} className={styles.card}>
              {cardContent}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
