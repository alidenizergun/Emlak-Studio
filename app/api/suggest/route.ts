import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, message } = await request.json();
        const trimmedEmail = typeof email === 'string' ? email.trim() : '';
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            return NextResponse.json({ success: false, error: 'Geçerli bir e-posta girin' }, { status: 400 });
        }
        // TODO: E-posta kaydet (DB, e-posta servisi vb.)
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
    }
}
