'use client';

import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_LANGUAGE, type Language, translateText } from '@/lib/i18n';

interface LanguageContextValue {
    lang: Language;
    t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
    initialLanguage,
    children,
}: {
    initialLanguage?: Language;
    children: React.ReactNode;
}) {
    const lang = initialLanguage ?? DEFAULT_LANGUAGE;

    const value = useMemo<LanguageContextValue>(
        () => ({
            lang,
            t: (text: string) => translateText(lang, text),
        }),
        [lang]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useI18n must be used within LanguageProvider');
    }
    return ctx;
}
