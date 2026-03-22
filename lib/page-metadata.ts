import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site';
import { LANGUAGE_LOCALES, translateText } from '@/lib/i18n';
import { localizePath } from '@/lib/locale-routing';
import { getCurrentLanguage } from '@/lib/server-language';

interface MetadataOptions {
    title: string;
    description: string;
    path: string;
    index?: boolean;
    images?: string[];
}

export async function buildLocalizedMetadata({
    title,
    description,
    path,
    index = true,
    images = [DEFAULT_OG_IMAGE],
}: MetadataOptions): Promise<Metadata> {
    const lang = await getCurrentLanguage();
    const localizedTitle = translateText(lang, title);
    const localizedDescription = translateText(lang, description);
    const fullTitle = `${localizedTitle} | ${SITE_NAME}`;
    const canonicalPath = localizePath(path, lang);

    return {
        title: localizedTitle,
        description: localizedDescription,
        alternates: {
            canonical: canonicalPath,
            languages: {
                tr: localizePath(path, 'tr'),
                en: localizePath(path, 'en'),
            },
        },
        openGraph: {
            title: fullTitle,
            description: localizedDescription,
            url: absoluteUrl(canonicalPath),
            siteName: SITE_NAME,
            locale: LANGUAGE_LOCALES[lang],
            type: 'website',
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description: localizedDescription,
            images,
        },
        robots: {
            index,
            follow: index,
        },
    };
}
