'use client';

import Link from 'next/link';
import styles from './Tools.module.css';
import { TOOLS } from './toolsData';

export default function ToolsPanelClient() {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Emlak <span className={styles.titleAi}>Yapay Zeka</span> Araçları</h1>
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
