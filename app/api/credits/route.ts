import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const CREDITS_FILE = path.join(process.cwd(), 'data', 'credits.json');

async function getCreditsData(): Promise<Record<string, number>> {
    try {
        const raw = await readFile(CREDITS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return typeof data === 'object' && data !== null ? data : {};
    } catch {
        return {};
    }
}

async function setCreditsData(data: Record<string, number>): Promise<void> {
    await writeFile(CREDITS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** GET: Kredi sorgula. ?phone=5322168292 */
export async function GET(request: NextRequest) {
    try {
        const phone = request.nextUrl.searchParams.get('phone');
        const normalized = phone ? String(phone).replace(/\D/g, '') : '';
        if (!normalized) {
            return NextResponse.json(
                { success: false, error: 'Telefon numarası gerekli' },
                { status: 400 }
            );
        }
        const data = await getCreditsData();
        const credits = data[normalized] ?? 0;
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
        const phone = body.phone ? String(body.phone).replace(/\D/g, '') : '';
        const amount = typeof body.amount === 'number' ? body.amount : 0;
        const set = typeof body.set === 'number' ? body.set : null;
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Telefon numarası gerekli' },
                { status: 400 }
            );
        }
        const data = await getCreditsData();
        if (set !== null) {
            data[phone] = set;
        } else {
            data[phone] = (data[phone] ?? 0) + amount;
        }
        await setCreditsData(data);
        return NextResponse.json({ success: true, credits: data[phone] });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
