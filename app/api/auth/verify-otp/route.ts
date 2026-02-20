import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otp';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();
        if (!phone || !code || String(code).replace(/\D/g, '').length !== 6) {
            return NextResponse.json({ success: false, error: 'Geçersiz kod' }, { status: 400 });
        }
        const result = await verifyOtp(String(phone), String(code));
        if (!result.ok) {
            return NextResponse.json({ success: false, error: result.error || 'Kod geçersiz' }, { status: 400 });
        }

        const token = createSessionToken(String(phone));
        const response = NextResponse.json({ success: true });
        response.cookies.set({
            name: getSessionCookieName(),
            value: token,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: getSessionTtlSeconds(),
        });
        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
