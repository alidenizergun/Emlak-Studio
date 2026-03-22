import { cookies, headers } from 'next/headers';
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, resolveLanguage, type Language } from '@/lib/i18n';

export async function getCurrentLanguage(): Promise<Language> {
    const headerStore = await headers();
    const cookieStore = await cookies();

    return resolveLanguage(
        headerStore.get('x-site-lang') ||
        cookieStore.get(LANGUAGE_COOKIE)?.value ||
        DEFAULT_LANGUAGE
    );
}

