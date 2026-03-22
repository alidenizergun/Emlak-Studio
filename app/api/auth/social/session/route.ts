import { NextRequest, NextResponse } from 'next/server';
import { ensureOAuthUser, normalizeEmail } from '@/lib/auth-users';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const email = normalizeEmail(body.email);

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Geçerli bir e-posta bulunamadı.' }, { status: 400 });
        }

        await ensureOAuthUser(email);

        const token = createSessionToken(email);
        const response = NextResponse.json({ success: true, email });
        response.cookies.set({
            name: getSessionCookieName(),
            value: token,
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: getSessionTtlSeconds(),
        });
        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sosyal giriş tamamlanamadı.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
