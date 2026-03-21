import { NextRequest, NextResponse } from 'next/server';
import { addCredits, getCredits, setCredits } from '@/lib/credits';
import { normalizePhone } from '@/lib/db';
import { requireAuthUser } from '@/lib/auth-guard';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const queryIdentity = normalizePhone(request.nextUrl.searchParams.get('email') || request.nextUrl.searchParams.get('phone'));
        const sessionUser = getSessionUser(request) || '';
        const normalized = queryIdentity || sessionUser;
        if (!normalized) {
            return NextResponse.json(
                { success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' },
                { status: 401 }
            );
        }
        if (queryIdentity) {
            const authError = requireAuthUser(request, normalized);
            if (authError) return authError;
        }
        const credits = await getCredits(normalized);
        return NextResponse.json({ success: true, email: normalized, userId: normalized, credits });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const identity = normalizePhone(body.email ?? body.phone);
        if (!identity) {
            return NextResponse.json(
                { success: false, error: 'Hesap bilgisi gerekli' },
                { status: 400 }
            );
        }
        const authError = requireAuthUser(request, identity);
        if (authError) return authError;

        const amount = typeof body.amount === 'number' ? body.amount : 0;
        const set = typeof body.set === 'number' ? body.set : null;
        const credits = set !== null
            ? await setCredits(identity, set, 'admin_set')
            : await addCredits(identity, amount, 'manual_add');

        return NextResponse.json({ success: true, email: identity, userId: identity, credits });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
