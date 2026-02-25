import { NextRequest, NextResponse } from 'next/server';
import { getSessionPhone } from '@/lib/session';
import { getCredits } from '@/lib/credits';
import {
    ensurePersistentSchema,
    ensurePersistentUser,
    getPersistentSql,
    hasPersistentDb,
    isSqliteDevFallbackEnabled
} from '@/lib/persistent-db';
import { ensureUser, getDb, normalizePhone } from '@/lib/db';
import { parsePlanId, getPlanDefinition } from '@/lib/pricing-policy';

export async function POST(request: NextRequest) {
    try {
        const sessionPhone = getSessionPhone(request);
        if (!sessionPhone) {
            return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const checkoutId = String(body.checkoutId || '').trim();
        if (!checkoutId) {
            return NextResponse.json({ success: false, error: 'checkoutId gerekli' }, { status: 400 });
        }

        const confirmIdempotencyKey = String(
            request.headers.get('x-idempotency-key') ||
            body.idempotencyKey ||
            ''
        ).trim() || null;

        if (hasPersistentDb()) {
            await ensurePersistentSchema();
            await ensurePersistentUser(sessionPhone);
            const sql = getPersistentSql();
            const reserved = await sql.reserve();

            try {
                await reserved`BEGIN`;
                const rows = await reserved<{
                    checkout_id: string;
                    phone: string;
                    mode: 'topup' | 'subscription';
                    plan_id: string;
                    billing: 'monthly' | 'yearly';
                    credits: number;
                    status: 'pending' | 'paid' | 'failed';
                    amount: number;
                    ledger_id: number | null;
                }[]>`
                    SELECT checkout_id, phone, mode, plan_id, billing, credits, status, amount, ledger_id
                    FROM mock_payment_checkouts
                    WHERE checkout_id = ${checkoutId}
                    FOR UPDATE
                `;
                const checkout = rows[0];
                if (!checkout) {
                    await reserved`ROLLBACK`;
                    return NextResponse.json({ success: false, error: 'Ödeme kaydı bulunamadı' }, { status: 404 });
                }
                if (normalizePhone(checkout.phone) !== sessionPhone) {
                    await reserved`ROLLBACK`;
                    return NextResponse.json({ success: false, error: 'Yetkisiz ödeme kaydı' }, { status: 403 });
                }

                if (
                    confirmIdempotencyKey &&
                    checkout.status === 'paid' &&
                    checkout.ledger_id &&
                    checkout.checkout_id
                ) {
                    await reserved`COMMIT`;
                    const creditsBalance = await getCredits(sessionPhone);
                    return NextResponse.json({
                        success: true,
                        status: 'paid',
                        checkoutId: checkout.checkout_id,
                        creditsBalance,
                        ledgerId: checkout.ledger_id,
                    });
                }

                if (checkout.status === 'paid') {
                    await reserved`COMMIT`;
                    const creditsBalance = await getCredits(sessionPhone);
                    return NextResponse.json({
                        success: true,
                        status: 'paid',
                        checkoutId: checkout.checkout_id,
                        creditsBalance,
                        ledgerId: checkout.ledger_id,
                    });
                }

                const currentRows = await reserved<{ balance: number }[]>`
                    SELECT balance FROM credits WHERE phone = ${sessionPhone} FOR UPDATE
                `;
                const currentBalance = Math.max(0, Number(currentRows[0]?.balance ?? 0));
                const delta = Math.max(0, Number(checkout.credits || 0));
                const nextBalance = currentBalance + delta;
                const reason =
                    checkout.mode === 'topup'
                        ? `topup_purchase_${checkout.plan_id}`
                        : `subscription_purchase_${checkout.plan_id}_${checkout.billing}`;

                await reserved`
                    INSERT INTO credits (phone, balance, updated_at)
                    VALUES (${sessionPhone}, ${nextBalance}, ${Date.now()})
                    ON CONFLICT (phone) DO UPDATE SET
                        balance = EXCLUDED.balance,
                        updated_at = EXCLUDED.updated_at
                `;

                const ledgerRows = await reserved<{ id: number }[]>`
                    INSERT INTO credit_ledger (phone, delta, reason, created_at)
                    VALUES (${sessionPhone}, ${delta}, ${reason}, ${Date.now()})
                    RETURNING id
                `;
                const ledgerId = Number(ledgerRows[0]?.id || 0);

                if (checkout.mode === 'subscription') {
                    const planId = parsePlanId(checkout.plan_id);
                    if (planId) {
                        const plan = getPlanDefinition(planId);
                        const nowIso = new Date().toISOString();
                        const nextBilling = new Date();
                        nextBilling.setMonth(nextBilling.getMonth() + 1);
                        await reserved`
                            INSERT INTO subscriptions (
                                phone, plan_id, plan_name, monthly_credits, monthly_price, status, start_date, next_billing_date, cancelled_at, last_used_credits
                            ) VALUES (
                                ${sessionPhone}, ${plan.id}, ${plan.name}, ${plan.monthlyCredits}, ${plan.monthlyPrice}, 'active',
                                ${nowIso}, ${nextBilling.toISOString()}, NULL, NULL
                            )
                            ON CONFLICT (phone) DO UPDATE SET
                                plan_id = excluded.plan_id,
                                plan_name = excluded.plan_name,
                                monthly_credits = excluded.monthly_credits,
                                monthly_price = excluded.monthly_price,
                                status = 'active',
                                start_date = excluded.start_date,
                                next_billing_date = excluded.next_billing_date,
                                cancelled_at = NULL
                        `;
                    }
                }

                await reserved`
                    UPDATE mock_payment_checkouts
                    SET status = 'paid',
                        paid_at = ${Date.now()},
                        ledger_id = ${ledgerId},
                        confirm_idempotency_key = COALESCE(${confirmIdempotencyKey}, confirm_idempotency_key)
                    WHERE checkout_id = ${checkoutId}
                `;
                await reserved`COMMIT`;

                return NextResponse.json({
                    success: true,
                    status: 'paid',
                    checkoutId,
                    creditsBalance: nextBalance,
                    ledgerId,
                });
            } catch (error: unknown) {
                await reserved`ROLLBACK`;
                throw error;
            } finally {
                reserved.release();
            }
        }

        if (!isSqliteDevFallbackEnabled()) {
            return NextResponse.json({ success: false, error: 'Postgres bağlantısı gerekli' }, { status: 500 });
        }

        const db = getDb();
        ensureUser(sessionPhone);
        const tx = db.transaction(() => {
            const checkout = db.prepare(`
                SELECT checkout_id, phone, mode, plan_id, billing, credits, status, amount, ledger_id
                FROM mock_payment_checkouts
                WHERE checkout_id = ?
            `).get(checkoutId) as {
                checkout_id: string;
                phone: string;
                mode: 'topup' | 'subscription';
                plan_id: string;
                billing: 'monthly' | 'yearly';
                credits: number;
                status: 'pending' | 'paid' | 'failed';
                amount: number;
                ledger_id: number | null;
            } | undefined;
            if (!checkout) {
                return { error: 'Ödeme kaydı bulunamadı', status: 404 };
            }
            if (normalizePhone(checkout.phone) !== sessionPhone) {
                return { error: 'Yetkisiz ödeme kaydı', status: 403 };
            }
            if (checkout.status === 'paid') {
                const balanceRow = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(sessionPhone) as { balance: number } | undefined;
                return {
                    success: true,
                    status: 'paid',
                    checkoutId,
                    creditsBalance: Math.max(0, Number(balanceRow?.balance || 0)),
                    ledgerId: checkout.ledger_id,
                };
            }

            const balanceRow = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(sessionPhone) as { balance: number } | undefined;
            const currentBalance = Math.max(0, Number(balanceRow?.balance || 0));
            const delta = Math.max(0, Number(checkout.credits || 0));
            const nextBalance = currentBalance + delta;
            const reason =
                checkout.mode === 'topup'
                    ? `topup_purchase_${checkout.plan_id}`
                    : `subscription_purchase_${checkout.plan_id}_${checkout.billing}`;

            db.prepare(`
                INSERT INTO credits (phone, balance, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(phone) DO UPDATE SET
                    balance = excluded.balance,
                    updated_at = excluded.updated_at
            `).run(sessionPhone, nextBalance, Date.now());
            const ledgerInsert = db.prepare(`
                INSERT INTO credit_ledger (phone, delta, reason, created_at)
                VALUES (?, ?, ?, ?)
            `).run(sessionPhone, delta, reason, Date.now());
            const ledgerId = Number(ledgerInsert.lastInsertRowid);

            if (checkout.mode === 'subscription') {
                const planId = parsePlanId(checkout.plan_id);
                if (planId) {
                    const plan = getPlanDefinition(planId);
                    const nowIso = new Date().toISOString();
                    const nextBilling = new Date();
                    nextBilling.setMonth(nextBilling.getMonth() + 1);
                    db.prepare(`
                        INSERT INTO subscriptions (
                            phone, plan_id, plan_name, monthly_credits, monthly_price, status, start_date, next_billing_date, cancelled_at, last_used_credits
                        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NULL, NULL)
                        ON CONFLICT(phone) DO UPDATE SET
                            plan_id = excluded.plan_id,
                            plan_name = excluded.plan_name,
                            monthly_credits = excluded.monthly_credits,
                            monthly_price = excluded.monthly_price,
                            status = 'active',
                            start_date = excluded.start_date,
                            next_billing_date = excluded.next_billing_date,
                            cancelled_at = NULL
                    `).run(sessionPhone, plan.id, plan.name, plan.monthlyCredits, plan.monthlyPrice, nowIso, nextBilling.toISOString());
                }
            }

            db.prepare(`
                UPDATE mock_payment_checkouts
                SET status = 'paid',
                    paid_at = ?,
                    ledger_id = ?,
                    confirm_idempotency_key = COALESCE(?, confirm_idempotency_key)
                WHERE checkout_id = ?
            `).run(Date.now(), ledgerId, confirmIdempotencyKey, checkoutId);

            return {
                success: true,
                status: 'paid',
                checkoutId,
                creditsBalance: nextBalance,
                ledgerId,
            };
        });

        const result = tx();
        if ('error' in result) {
            return NextResponse.json({ success: false, error: result.error }, { status: result.status as number });
        }
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ödeme doğrulanamadı';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
