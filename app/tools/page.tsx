import Link from 'next/link';
import styles from './Tools.module.css';
import { TOOLS } from './toolsData';


export const metadata = {
    title: "Araçlar - Emlak AIStudio",
    description: "Emlak AIStudio yapay zeka araçları.",
};

export default function ToolsPage() {
    return (
        <div className={`container ${styles.pageContainer}`}>
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
                        <Link key={tool.id} href={tool.href} className={styles.card}>
                            {cardContent}
                        </Link>
                    );
                })}
            </div>

        </div>
    );
}
