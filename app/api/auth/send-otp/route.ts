import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();
        if (!phone || String(phone).replace(/\D/g, '').length !== 10) {
            return NextResponse.json({ success: false, error: 'Geçersiz telefon' }, { status: 400 });
        }
        // TODO: Gerçek SMS entegrasyonu (Twilio, Netgsm vb.)
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
    }
}
