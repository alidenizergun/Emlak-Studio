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
                <h1 className={styles.title}>Yapay Zeka Araçları</h1>
                <p className={styles.description}>
                    İş akışınızı hızlandıracak ve satışlarınızı artıracak tüm araçlar tek bir yerde.
                </p>
            </div>

            <div className={styles.grid}>
                {TOOLS.map((tool) => (
                    <Link key={tool.id} href={tool.href} className={`${styles.card} ${tool.status ? styles.disabled : ''}`}>
                        <div className={styles.iconWrapper}>
                            {tool.icon}
                        </div>
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>
                                {tool.title}
                                {tool.status && <span className={styles.badge}>{tool.status}</span>}
                            </h3>
                            <p className={styles.cardDescription}>{tool.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
