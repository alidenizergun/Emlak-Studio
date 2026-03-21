import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
    const email = getSessionUser(request);
    if (!email) {
        return NextResponse.json({ success: false, error: 'Oturum bulunamadı' }, { status: 401 });
    }
    return NextResponse.json({ success: true, email, userId: email });
}
