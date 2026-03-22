import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { LANGUAGE_COOKIE, resolveLanguage } from '@/lib/i18n';
import { localizePath, stripLocalePrefix } from '@/lib/locale-routing';

function isAssetRequest(pathname: string): boolean {
    return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        isAssetRequest(pathname)
    ) {
        return NextResponse.next();
    }

    const localeInfo = stripLocalePrefix(pathname);
    const preferredLanguage = resolveLanguage(request.cookies.get(LANGUAGE_COOKIE)?.value);

    if (!localeInfo.lang) {
        const url = request.nextUrl.clone();
        url.pathname = localizePath(pathname, preferredLanguage);
        url.search = search;
        const response = NextResponse.redirect(url);
        response.cookies.set(LANGUAGE_COOKIE, preferredLanguage, { path: '/', sameSite: 'lax' });
        return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-site-lang', localeInfo.lang);
    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    response.cookies.set(LANGUAGE_COOKIE, localeInfo.lang, { path: '/', sameSite: 'lax' });
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
