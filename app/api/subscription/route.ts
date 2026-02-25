import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/db';
import { getCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { cancelSubscription, getOrCreateSubscription } from '@/lib/subscriptions';

export async function GET(request: NextRequest) {
    try {
        const phone = normalizePhone(request.nextUrl.searchParams.get('phone'));
        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarası gerekli' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const currentCredits = Math.max(0, await getCredits(phone));
        const subscription = await getOrCreateSubscription(phone);
        const usedCredits = Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits));

        return NextResponse.json({
            success: true,
            subscription,
            credits: currentCredits,
            usedCredits,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const phone = normalizePhone(body.phone ?? null);
        const action = String(body.action || '');

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarası gerekli' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;
        if (action !== 'cancel') {
            return NextResponse.json({ success: false, error: 'Geçersiz işlem' }, { status: 400 });
        }

        const result = await cancelSubscription(phone);
        return NextResponse.json({
            success: true,
            message: 'Abonelik iptal edildi',
            subscription: result.subscription,
            credits: result.credits,
            usedCredits: result.usedCredits,
            removedCredits: result.removedCredits,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
