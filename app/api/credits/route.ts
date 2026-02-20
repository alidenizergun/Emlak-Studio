import { NextRequest, NextResponse } from 'next/server';
import { addCredits, getCredits, setCredits } from '@/lib/credits';
import { normalizePhone } from '@/lib/db';

/** GET: Kredi sorgula. ?phone=5322168292 */
export async function GET(request: NextRequest) {
    try {
        const normalized = normalizePhone(request.nextUrl.searchParams.get('phone'));
        if (!normalized) {
            return NextResponse.json(
                { success: false, error: 'Telefon numarası gerekli' },
                { status: 400 }
            );
        }
        const credits = await getCredits(normalized);
        return NextResponse.json({ success: true, credits });
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
