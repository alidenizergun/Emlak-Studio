import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOtp } from '@/lib/otp';
import { isOwnerBypassPhone } from '@/lib/auth-bypass';
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from '@/lib/session';

function allowDevOtpBypass(): boolean {
    return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_OTP_BYPASS === '1';
}

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();
        const normalizedPhone = String(phone || '').replace(/\D/g, '');

        if (!normalizedPhone || normalizedPhone.length !== 10) {
            return NextResponse.json({ success: false, error: 'Geçersiz telefon' }, { status: 400 });
        }

        if (isOwnerBypassPhone(normalizedPhone)) {
            const token = createSessionToken(normalizedPhone);
            const response = NextResponse.json({ success: true, directLogin: true });
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
        }

        if (allowDevOtpBypass() && normalizedPhone === '5322168292') {
            return NextResponse.json({ success: true, directLogin: true });
        }

        await createAndSendOtp(normalizedPhone);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        const status = message.includes('bekleyin') || message.includes('Geçersiz') ? 400 : 500;
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
