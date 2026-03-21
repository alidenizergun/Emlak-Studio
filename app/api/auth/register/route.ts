import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';
import { createEmailUser, findUserByEmail, hashPassword, normalizeEmail } from '@/lib/auth-users';

function isValidPassword(password: string): boolean {
    return password.trim().length >= 8;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');

        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
        }
        if (!isValidPassword(password)) {
            return NextResponse.json({ success: false, error: 'Şifre en az 8 karakter olmalı.' }, { status: 400 });
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser?.passwordHash) {
            return NextResponse.json({ success: false, error: 'Bu e-posta adresi zaten kayıtlı.' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        await createEmailUser(email, passwordHash);

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
        const message = error instanceof Error ? error.message : 'Kayıt oluşturulamadı.';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
