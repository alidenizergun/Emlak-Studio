import { NextRequest, NextResponse } from 'next/server';
import { ensureOAuthUser, normalizeEmail } from '@/lib/auth-users';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';

class SocialSessionError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'SocialSessionError';
        this.status = status;
    }
}

function getSupabaseUrl(): string {
    return String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
}

function getSupabaseAnonKey(): string {
    return String(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        ''
    ).trim();
}

async function resolveSupabaseUserEmail(accessTokenRaw: string): Promise<string> {
    const accessToken = String(accessTokenRaw || '').trim();
    if (!accessToken) {
        throw new SocialSessionError('Sosyal giriş için doğrulama jetonu gerekli.', 400);
    }

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new SocialSessionError('Sosyal giriş yapılandırması eksik.', 500);
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
        },
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const status = response.status >= 500 ? 502 : 401;
        throw new SocialSessionError('Sosyal giriş doğrulanamadı.', status);
    }

    const email = normalizeEmail(payload?.email);
    if (!email || !email.includes('@')) {
        throw new SocialSessionError('Sosyal girişte doğrulanmış bir e-posta bulunamadı.', 401);
    }
    return email;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const email = await resolveSupabaseUserEmail(body.accessToken);

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
        const status = error instanceof SocialSessionError ? error.status : 500;
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
