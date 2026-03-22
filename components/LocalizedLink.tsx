'use client';

import Link, { type LinkProps } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import { localizePath, stripLocalePrefix } from '@/lib/locale-routing';

type Props = LinkProps & ComponentPropsWithoutRef<'a'>;

export default function LocalizedLink({ href, ...props }: Props) {
    const { lang } = useI18n();

    const localizedHref = (() => {
        if (typeof href !== 'string' || !href.startsWith('/')) return href;

        const url = new URL(href, 'https://studio-estate.local');
        if (stripLocalePrefix(url.pathname).lang) {
            return `${url.pathname}${url.search}${url.hash}`;
        }

        return `${localizePath(url.pathname, lang)}${url.search}${url.hash}`;
    })();

    return <Link href={localizedHref} {...props} />;
}
