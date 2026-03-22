'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/LanguageProvider';
import LocalizedLink from '@/components/LocalizedLink';
import { swapLocaleInPath } from '@/lib/locale-routing';
import styles from './Footer.module.css';

const LANGUAGES = [
    { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
];

export default function FooterLanguageSwitcher() {
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();
    const { lang } = useI18n();
    const query = searchParams.toString();
    const languageLabel = lang === 'en' ? 'Language' : 'Dil';

    return (
        <div className={styles.languageBlock}>
            <span className={styles.languageLabel}>{languageLabel}</span>
            <div className={styles.languageList}>
                {LANGUAGES.map((item) => {
                    const href = `${swapLocaleInPath(pathname, item.code)}${query ? `?${query}` : ''}`;
                    const active = item.code === lang;

                    return (
                        <LocalizedLink
                            key={item.code}
                            href={href}
                            className={`${styles.languageOption} ${active ? styles.languageOptionActive : ''}`}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span aria-hidden="true">{item.flag}</span>
                            <span>{item.label}</span>
                        </LocalizedLink>
                    );
                })}
            </div>
        </div>
    );
}
