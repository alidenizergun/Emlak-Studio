import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/db';
import { getCredits } from '@/lib/credits';
import { requireAuthUser } from '@/lib/auth-guard';
import { getSessionUser } from '@/lib/session';
import { cancelSubscription, getOrCreateSubscription } from '@/lib/subscriptions';

function resolveIdentity(request: NextRequest): string {
    return normalizePhone(request.nextUrl.searchParams.get('email') || request.nextUrl.searchParams.get('phone')) || getSessionUser(request) || '';
}

export async function GET(request: NextRequest) {
    try {
        const identity = resolveIdentity(request);
        if (!identity) {
            return NextResponse.json({ success: false, error: 'Hesap bilgisi gerekli' }, { status: 400 });
        }
        const authError = requireAuthUser(request, identity);
        if (authError) return authError;

        const currentCredits = Math.max(0, await getCredits(identity));
        const subscription = await getOrCreateSubscription(identity);
        const usedCredits = Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits));

        return NextResponse.json({ success: true, email: identity, userId: identity, subscription, credits: currentCredits, usedCredits });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const identity = normalizePhone(body.email ?? body.phone) || getSessionUser(request) || '';
        const action = String(body.action || '');

        if (!identity) {
            return NextResponse.json({ success: false, error: 'Hesap bilgisi gerekli' }, { status: 400 });
        }
        const authError = requireAuthUser(request, identity);
        if (authError) return authError;
        if (action !== 'cancel') {
            return NextResponse.json({ success: false, error: 'Geçersiz işlem' }, { status: 400 });
        }

        const result = await cancelSubscription(identity);
        return NextResponse.json({
            success: true,
            message: 'Abonelik iptal edildi',
            email: identity,
            userId: identity,
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
