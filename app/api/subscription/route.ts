import { NextRequest, NextResponse } from 'next/server';
import { getDb, normalizePhone } from '@/lib/db';
import { getCredits, setCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { ensurePersistentSchema, ensurePersistentUser, getPersistentSql, hasPersistentDb } from '@/lib/persistent-db';

type PlanId = 'danisman' | 'ofis' | 'kurumsal';

interface SubscriptionInfo {
    planId: PlanId;
    planName: string;
    monthlyCredits: number;
    monthlyPrice: number;
    status: 'active' | 'cancelled';
    startDate: string;
    nextBillingDate: string;
    cancelledAt?: string;
    lastUsedCredits?: number;
}

function addOneMonthIso(date: Date): string {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next.toISOString();
}

function defaultPlanFromCredits(currentCredits: number): Omit<SubscriptionInfo, 'status' | 'startDate' | 'nextBillingDate'> {
    if (currentCredits >= 1000) {
        return { planId: 'kurumsal', planName: 'Kurumsal', monthlyCredits: 1000, monthlyPrice: 4999 };
    }
    if (currentCredits >= 400) {
        return { planId: 'ofis', planName: 'Ofis', monthlyCredits: 400, monthlyPrice: 2499 };
    }
    return { planId: 'danisman', planName: 'Danışman', monthlyCredits: 200, monthlyPrice: 1999 };
}

function mapSubscriptionRow(row: Record<string, unknown>): SubscriptionInfo {
    return {
        planId: String(row.plan_id) as PlanId,
        planName: String(row.plan_name),
        monthlyCredits: Number(row.monthly_credits || 0),
        monthlyPrice: Number(row.monthly_price || 0),
        status: String(row.status) === 'cancelled' ? 'cancelled' : 'active',
        startDate: String(row.start_date),
        nextBillingDate: String(row.next_billing_date),
        cancelledAt: row.cancelled_at ? String(row.cancelled_at) : undefined,
        lastUsedCredits: typeof row.last_used_credits === 'number' ? Number(row.last_used_credits) : undefined,
    };
}

async function getOrCreateSubscription(phone: string, currentCredits: number): Promise<SubscriptionInfo> {
    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);
        const sql = getPersistentSql();
        const existingRows = await sql<Record<string, unknown>[]>`
            SELECT * FROM subscriptions WHERE phone = ${phone}
        `;
        if (existingRows[0]) return mapSubscriptionRow(existingRows[0]);

        const now = new Date();
        const plan = defaultPlanFromCredits(currentCredits);
        const created: SubscriptionInfo = {
            ...plan,
            status: 'active',
            startDate: now.toISOString(),
            nextBillingDate: addOneMonthIso(now),
        };

        await sql`
            INSERT INTO subscriptions (
                phone, plan_id, plan_name, monthly_credits, monthly_price, status, start_date, next_billing_date, cancelled_at, last_used_credits
            ) VALUES (
                ${phone}, ${created.planId}, ${created.planName}, ${created.monthlyCredits}, ${created.monthlyPrice},
                ${created.status}, ${created.startDate}, ${created.nextBillingDate}, NULL, NULL
            )
            ON CONFLICT (phone) DO NOTHING
        `;

        const insertedRows = await sql<Record<string, unknown>[]>`
            SELECT * FROM subscriptions WHERE phone = ${phone}
        `;
        if (insertedRows[0]) return mapSubscriptionRow(insertedRows[0]);
        return created;
    }

    const db = getDb();
    const existing = db.prepare(`SELECT * FROM subscriptions WHERE phone = ?`).get(phone) as Record<string, unknown> | undefined;
    if (existing) return mapSubscriptionRow(existing);

    const now = new Date();
    const plan = defaultPlanFromCredits(currentCredits);
    const created: SubscriptionInfo = {
        ...plan,
        status: 'active',
        startDate: now.toISOString(),
        nextBillingDate: addOneMonthIso(now),
    };

    db.prepare(`
        INSERT INTO subscriptions (
            phone, plan_id, plan_name, monthly_credits, monthly_price, status, start_date, next_billing_date, cancelled_at, last_used_credits
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
    `).run(
        phone,
        created.planId,
        created.planName,
        created.monthlyCredits,
        created.monthlyPrice,
        created.status,
        created.startDate,
        created.nextBillingDate
    );

    return created;
}

export async function GET(request: NextRequest) {
    try {
        const phone = normalizePhone(request.nextUrl.searchParams.get('phone'));
        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarası gerekli' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const currentCredits = Math.max(0, await getCredits(phone));
        const subscription = await getOrCreateSubscription(phone, currentCredits);
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

        const currentCredits = Math.max(0, await getCredits(phone));
        const subscription = await getOrCreateSubscription(phone, currentCredits);

        if (subscription.status === 'cancelled') {
            return NextResponse.json({
                success: true,
                alreadyCancelled: true,
                subscription,
                credits: currentCredits,
            });
        }

        const usedCredits = Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits));
        const remainingCredits = currentCredits;
        const cancelledAt = new Date().toISOString();

        if (hasPersistentDb()) {
            await ensurePersistentSchema();
            await ensurePersistentUser(phone);
            const sql = getPersistentSql();
            await sql`
                UPDATE subscriptions
                SET status = 'cancelled', cancelled_at = ${cancelledAt}, last_used_credits = ${usedCredits}
                WHERE phone = ${phone}
            `;
        } else {
            const db = getDb();
            db.prepare(`
                UPDATE subscriptions
                SET status = 'cancelled', cancelled_at = ?, last_used_credits = ?
                WHERE phone = ?
            `).run(cancelledAt, usedCredits, phone);
        }

        await setCredits(phone, 0, 'subscription_cancel_reset');

        let updated: Record<string, unknown>;
        if (hasPersistentDb()) {
            const sql = getPersistentSql();
            const rows = await sql<Record<string, unknown>[]>`
                SELECT * FROM subscriptions WHERE phone = ${phone}
            `;
            updated = rows[0] || {};
        } else {
            const db = getDb();
            updated = (db.prepare(`SELECT * FROM subscriptions WHERE phone = ?`).get(phone) as Record<string, unknown>) || {};
        }
        return NextResponse.json({
            success: true,
            message: 'Abonelik iptal edildi',
            subscription: mapSubscriptionRow(updated),
            credits: 0,
            usedCredits,
            removedCredits: remainingCredits,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
