import { NextRequest, NextResponse } from 'next/server';
import { ensureOAuthUser, normalizeEmail } from '@/lib/auth-users';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';

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
        throw new Error('Sosyal giriş için doğrulama jetonu gerekli.');
    }

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Sosyal giriş yapılandırması eksik.');
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
        throw new Error('Sosyal giriş doğrulanamadı.');
    }

    const email = normalizeEmail(payload?.email);
    if (!email || !email.includes('@')) {
        throw new Error('Sosyal girişte doğrulanmış bir e-posta bulunamadı.');
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
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
