import { NextRequest, NextResponse } from 'next/server';
import { addCredits, getCredits, setCredits } from '@/lib/credits';
import { normalizePhone } from '@/lib/db';
import { requireAuthPhone } from '@/lib/auth-guard';
import { getSessionPhone } from '@/lib/session';

/** GET: Kredi sorgula. ?phone=5322168292 */
export async function GET(request: NextRequest) {
    try {
        const normalized = normalizePhone(request.nextUrl.searchParams.get('phone')) || getSessionPhone(request) || '';
        if (!normalized) {
            return NextResponse.json(
                { success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' },
                { status: 401 }
            );
        }
        const hasPhoneQuery = !!normalizePhone(request.nextUrl.searchParams.get('phone'));
        if (hasPhoneQuery) {
            const authError = requireAuthPhone(request, normalized);
            if (authError) return authError;
        }
        const credits = await getCredits(normalized);
        return NextResponse.json({ success: true, phone: normalized, credits });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

/** POST: Belirli numaraya kredi ekle (admin / dahili). Body: { phone, amount } veya { phone, set } (tam değer) */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const phone = normalizePhone(body.phone);
        const amount = typeof body.amount === 'number' ? body.amount : 0;
        const set = typeof body.set === 'number' ? body.set : null;
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Telefon numarası gerekli' },
                { status: 400 }
            );
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        let credits = 0;
        if (set !== null) {
            credits = await setCredits(phone, set, 'admin_set');
        } else {
            credits = await addCredits(phone, amount, 'manual_add');
        }
        return NextResponse.json({ success: true, credits });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
