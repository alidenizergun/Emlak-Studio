import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/db';
import { getSessionUser, getSessionPhone } from '@/lib/session';

export function requireAuthUser(request: NextRequest, identityRaw: string): NextResponse | null {
    const providedIdentity = normalizePhone(identityRaw);
    const sessionUser = getSessionUser(request);

    if (!sessionUser) {
        return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
    }
    if (!providedIdentity || providedIdentity !== sessionUser) {
        return NextResponse.json({ success: false, error: 'Yetkisiz hesap isteği' }, { status: 403 });
    }
    return null;
}

export function requireAuthPhone(request: NextRequest, phoneRaw: string): NextResponse | null {
    return requireAuthUser(request, phoneRaw);
}

export { getSessionPhone };
