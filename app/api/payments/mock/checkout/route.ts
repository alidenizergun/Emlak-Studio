import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/db';
import { getSessionPhone } from '@/lib/session';
import {
    ensurePersistentSchema,
    ensurePersistentUser,
    getPersistentSql,
    hasPersistentDb,
    isSqliteDevFallbackEnabled
} from '@/lib/persistent-db';
import { ensureUser, getDb } from '@/lib/db';
import { parseBillingCycle, parsePlanId, getPlanDefinition, getSubscriptionCharge, getTopupTotal } from '@/lib/pricing-policy';

type Mode = 'topup' | 'subscription';

const MIN_TOPUP_CREDITS = 1;
const MAX_TOPUP_CREDITS = 10000;

export async function POST(request: NextRequest) {
    try {
        const sessionPhone = getSessionPhone(request);
        if (!sessionPhone) {
            return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const phone = normalizePhone(body.phone || sessionPhone);
        if (!phone || phone !== sessionPhone) {
            return NextResponse.json({ success: false, error: 'Yetkisiz telefon numarası' }, { status: 403 });
        }

        const mode: Mode = body.mode === 'topup' ? 'topup' : 'subscription';
        const parsedPlanId = parsePlanId(body.planId ?? body.plan);
        if (!parsedPlanId) {
            return NextResponse.json({ success: false, error: 'Geçersiz plan' }, { status: 400 });
        }
        const billing = parseBillingCycle(body.billing);
        const requestedCredits = Math.floor(Number(body.credits || body.quantity || 0));
        const normalizedCredits =
            mode === 'topup'
                ? Math.min(MAX_TOPUP_CREDITS, Math.max(MIN_TOPUP_CREDITS, requestedCredits || 0))
                : getPlanDefinition(parsedPlanId).monthlyCredits;
        const amount = mode === 'topup'
            ? getTopupTotal(parsedPlanId, normalizedCredits)
            : getSubscriptionCharge(parsedPlanId, billing);

        const requestIdempotencyKey = String(
            request.headers.get('x-idempotency-key') ||
            body.idempotencyKey ||
            ''
        ).trim() || null;
        const checkoutId = crypto.randomUUID();
        const now = Date.now();

        if (hasPersistentDb()) {
            await ensurePersistentSchema();
            await ensurePersistentUser(phone);
            const sql = getPersistentSql();

            if (requestIdempotencyKey) {
                const existing = await sql<{
                    checkout_id: string;
                    status: string;
                    mode: string;
                    plan_id: string;
                    billing: string;
                    credits: number;
                    amount: number;
                }[]>`
                    SELECT checkout_id, status, mode, plan_id, billing, credits, amount
                    FROM mock_payment_checkouts
                    WHERE idempotency_key = ${requestIdempotencyKey}
                      AND phone = ${phone}
                    LIMIT 1
                `;
                if (existing[0]) {
                    return NextResponse.json({
                        success: true,
                        checkoutId: existing[0].checkout_id,
                        status: existing[0].status,
                        mode: existing[0].mode,
                        planId: existing[0].plan_id,
                        billing: existing[0].billing,
                        credits: Number(existing[0].credits || 0),
                        total: Number(existing[0].amount || 0),
                    });
                }
            }

            await sql`
                INSERT INTO mock_payment_checkouts (
                    checkout_id, phone, mode, plan_id, billing, credits, amount, status, idempotency_key, created_at
                ) VALUES (
                    ${checkoutId}, ${phone}, ${mode}, ${parsedPlanId}, ${billing}, ${normalizedCredits}, ${amount},
                    'pending', ${requestIdempotencyKey}, ${now}
                )
            `;
        } else {
            if (!isSqliteDevFallbackEnabled()) {
                return NextResponse.json({ success: false, error: 'Postgres bağlantısı gerekli' }, { status: 500 });
            }

            const db = getDb();
            ensureUser(phone);
            if (requestIdempotencyKey) {
                const existing = db.prepare(`
                    SELECT checkout_id, status, mode, plan_id, billing, credits, amount
                    FROM mock_payment_checkouts
                    WHERE idempotency_key = ? AND phone = ?
                    LIMIT 1
                `).get(requestIdempotencyKey, phone) as {
                    checkout_id: string;
                    status: string;
                    mode: string;
                    plan_id: string;
                    billing: string;
                    credits: number;
                    amount: number;
                } | undefined;
                if (existing) {
                    return NextResponse.json({
                        success: true,
                        checkoutId: existing.checkout_id,
                        status: existing.status,
                        mode: existing.mode,
                        planId: existing.plan_id,
                        billing: existing.billing,
                        credits: Number(existing.credits || 0),
                        total: Number(existing.amount || 0),
                    });
                }
            }
            db.prepare(`
                INSERT INTO mock_payment_checkouts (
                    checkout_id, phone, mode, plan_id, billing, credits, amount, status, idempotency_key, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            `).run(checkoutId, phone, mode, parsedPlanId, billing, normalizedCredits, amount, requestIdempotencyKey, now);
        }

        return NextResponse.json({
            success: true,
            checkoutId,
            status: 'pending',
            mode,
            planId: parsedPlanId,
            billing,
            credits: normalizedCredits,
            total: amount,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ödeme başlatılamadı';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
