import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOtp } from '@/lib/otp';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();
        if (!phone || String(phone).replace(/\D/g, '').length !== 10) {
            return NextResponse.json({ success: false, error: 'Geçersiz telefon' }, { status: 400 });
        }

        await createAndSendOtp(String(phone));
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        const status = message.includes('bekleyin') || message.includes('Geçersiz') ? 400 : 500;
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
