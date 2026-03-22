import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';
import { findUserByEmail, normalizeEmail, verifyPassword } from '@/lib/auth-users';

function getPasswordlessLoginEmail(): string {
    return String(
        process.env.OWNER_EMAIL ||
        process.env.SUPER_ADMIN_EMAIL ||
        'alidenizergun@gmail.com'
    ).trim().toLowerCase();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        const passwordlessEmail = getPasswordlessLoginEmail();
        const isPasswordlessLogin = email === passwordlessEmail;

        if (!email || !email.includes('@') || (!password && !isPasswordlessLogin)) {
            return NextResponse.json({ success: false, error: 'E-posta ve şifre gerekli.' }, { status: 400 });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 });
        }

        if (!isPasswordlessLogin) {
            if (!user.passwordHash) {
                return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 });
            }

            const valid = await verifyPassword(password, user.passwordHash);
            if (!valid) {
                return NextResponse.json({ success: false, error: 'E-posta veya şifre hatalı.' }, { status: 401 });
            }
        }

        const token = createSessionToken(user.email);
        const response = NextResponse.json({ success: true, email: user.email });
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
        const message = error instanceof Error ? error.message : 'Giriş yapılamadı.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
