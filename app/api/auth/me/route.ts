import { NextRequest, NextResponse } from 'next/server';
import { getSessionPhone } from '@/lib/session';

export async function GET(request: NextRequest) {
    const phone = getSessionPhone(request);
    if (!phone) {
        return NextResponse.json({ success: false, error: 'Oturum bulunamadı' }, { status: 401 });
    }
    return NextResponse.json({ success: true, phone });
}
