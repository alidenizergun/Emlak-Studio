import type { Metadata } from 'next';
import styles from './Tools.module.css';
import { TOOLS } from './toolsData';
import { translateText } from '@/lib/i18n';
import { buildLocalizedMetadata } from '@/lib/page-metadata';
import { getCurrentLanguage } from '@/lib/server-language';
import { localizePath } from '@/lib/locale-routing';

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    title: 'Tüm Araçlar',
    description: 'Studio Estate araçları: fotoğraf geliştirme, dekorasyon, akıllı eşya silme, tadilat, ilan metni ve sanal sunucu.',
    path: '/tools',
  });
}

export default async function ToolsPage() {
  const lang = await getCurrentLanguage();
  return (
    <div className={`container ${styles.pageContainer}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Studio <span className={styles.titleAi}>Estate</span> {translateText(lang, 'Araçlar')}</h1>
        <p className={styles.description}>
          {translateText(lang, 'İş akışınızı hızlandıracak ve satışlarınızı artıracak tüm araçlar tek bir yerde.')}
        </p>
      </div>

      <div className={styles.grid}>
        {TOOLS.map((tool) => {
          const isDisabled = !!tool.status;
          const cardContent = (
            <>
              {tool.status && <span className={styles.badgeCorner}>{translateText(lang, tool.status)}</span>}
              <div className={styles.iconWrapper}>{tool.icon}</div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{translateText(lang, tool.title)}</h3>
                <p className={styles.cardDescription}>{translateText(lang, tool.description)}</p>
              </div>
            </>
          );
          return isDisabled ? (
            <span key={tool.id} className={`${styles.card} ${styles.disabled}`} aria-disabled="true">
              {cardContent}
            </span>
          ) : (
            <a key={tool.id} href={`${localizePath('/studio', lang)}?tool=${encodeURIComponent(tool.id)}`} className={styles.card}>
              {cardContent}
            </a>
          );
        })}
      </div>

    </div>
  );
}
