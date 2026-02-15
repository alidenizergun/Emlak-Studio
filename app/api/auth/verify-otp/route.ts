import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();
        if (!phone || !code || String(code).replace(/\D/g, '').length !== 6) {
            return NextResponse.json({ success: false, error: 'Geçersiz kod' }, { status: 400 });
        }
        // TODO: Gerçek OTP doğrulama (session / DB)
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
    }
}
