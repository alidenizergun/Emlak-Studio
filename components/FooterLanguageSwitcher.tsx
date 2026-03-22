'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/LanguageProvider';
import { swapLocaleInPath } from '@/lib/locale-routing';
import { LANGUAGE_COOKIE } from '@/lib/i18n';
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

    return (
        <div className={styles.languageBlock}>
            <div className={styles.languageSelectWrap}>
                <select
                    className={styles.languageSelect}
                    aria-label={lang === 'en' ? 'Language' : 'Dil'}
                    value={lang}
                    onChange={(event) => {
                        const nextLang = event.target.value as 'tr' | 'en';
                        if (nextLang === lang) return;
                        const nextPath = swapLocaleInPath(pathname, nextLang);
                        const nextUrl = `${nextPath}${query ? `?${query}` : ''}`;
                        document.cookie = `${LANGUAGE_COOKIE}=${nextLang}; path=/; SameSite=Lax`;
                        window.location.assign(nextUrl);
                    }}
                >
                    {LANGUAGES.map((item) => (
                        <option key={item.code} value={item.code}>
                            {item.flag} {item.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
