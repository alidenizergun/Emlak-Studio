import type { Language } from '@/lib/i18n';

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export const DEFAULT_LANGUAGE: Language = 'tr';

export function isSupportedLanguage(value: string | null | undefined): value is Language {
    return value === 'tr' || value === 'en';
}

export function normalizePath(pathname: string): string {
    if (!pathname) return '/';
    return pathname === '/' ? '/' : pathname.replace(/\/+$/, '') || '/';
}

export function stripLocalePrefix(pathname: string): { lang: Language | null; path: string } {
    const normalized = normalizePath(pathname);
    const segments = normalized.split('/').filter(Boolean);
    const first = segments[0];

    if (!isSupportedLanguage(first)) {
        return { lang: null, path: normalized };
    }

    const rest = `/${segments.slice(1).join('/')}`.replace(/\/+$/, '') || '/';
    return { lang: first, path: rest === '' ? '/' : rest };
}

export function localizePath(pathname: string, lang: Language): string {
    const stripped = stripLocalePrefix(pathname).path;
    if (stripped === '/') return `/${lang}`;
    return `/${lang}${stripped}`;
}

export function swapLocaleInPath(pathname: string, lang: Language): string {
    return localizePath(pathname, lang);
}

