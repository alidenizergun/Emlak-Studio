import styles from './Stats.module.css';

const stats = [
    {
        value: '%140',
        label: 'Daha Fazla İnceleme',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
            </svg>
        )
    },
    {
        value: '3x',
        label: 'Daha Hızlı Satış',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
        )
    },
    {
        value: '< 5sn',
        label: 'İşlem Süresi',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        )
    },
    {
        value: '%85',
        label: 'Maliyet Tasarrufu',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        )
    },
    {
        value: '10.000+',
        label: 'Başarılı İşlem',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0a5.995 5.995 0 0 0-4.058-3.006L12 12.054l-.001.002h-.002l-1.001 1.442a5.997 5.997 0 0 0-4.058 3.006L6 18.72m12 0a9 9 0 1 1-18 0c0-1.285.268-2.503.752-3.604l.112-.249a3 3 0 0 1 4.675-1.018l.867.57a3.033 3.033 0 0 0 2.593 0l.867-.57a3.002 3.002 0 0 1 4.675 1.018l.112.249c.484 1.101.752 2.319.752 3.604ZM15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        )
    }
];

const Stats = () => {
    return (
        <section className={styles.statsSection}>
            <div className={`container ${styles.statsContainer}`}>
                <div className={styles.stats}>
                    {stats.map((stat, index) => (
                        <div key={index} className={styles.statItem}>
                            <div className={styles.iconWrapper}>
                                {stat.icon}
                            </div>
                            <div className={styles.contentWrapper}>
                                <span className={styles.statValue}>{stat.value}</span>
                                <span className={styles.statLabel}>{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Stats;
