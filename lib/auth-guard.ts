import { NextRequest, NextResponse } from 'next/server';
import { getSessionPhone } from '@/lib/session';

export function requireAuthPhone(request: NextRequest, phoneRaw: string): NextResponse | null {
    const providedPhone = String(phoneRaw || '').replace(/\D/g, '');
    const sessionPhone = getSessionPhone(request);

    if (!sessionPhone) {
        return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
    }
    if (!providedPhone || providedPhone !== sessionPhone) {
        return NextResponse.json({ success: false, error: 'Yetkisiz telefon numarası' }, { status: 403 });
    }
    return null;
}
