import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOtp } from '@/lib/otp';

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

        if (allowDevOtpBypass() && normalizedPhone === '5322168292') {
            return NextResponse.json({ success: true });
        }

        await createAndSendOtp(normalizedPhone);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        const status = message.includes('bekleyin') || message.includes('Geçersiz') ? 400 : 500;
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
