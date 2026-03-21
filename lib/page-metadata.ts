import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl } from '@/lib/seo/site';
import { DEFAULT_LANGUAGE, LANGUAGE_LOCALES, translateText } from '@/lib/i18n';

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
    const lang = DEFAULT_LANGUAGE;
    const localizedTitle = translateText(lang, title);
    const localizedDescription = translateText(lang, description);
    const fullTitle = `${localizedTitle} | ${SITE_NAME}`;

    return {
        title: localizedTitle,
        description: localizedDescription,
        alternates: {
            canonical: path,
        },
        openGraph: {
            title: fullTitle,
            description: localizedDescription,
            url: absoluteUrl(path),
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
