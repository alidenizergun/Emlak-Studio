import { getDb, normalizePhone } from '@/lib/db';
import { getCredits, setCredits } from '@/lib/credits';
import {
    ensurePersistentSchema,
    ensurePersistentUser,
    getPersistentSql,
    hasPersistentDb,
    isSqliteDevFallbackEnabled
} from '@/lib/persistent-db';
import { type PlanId, getPlanDefinition } from '@/lib/pricing-policy';

export interface SubscriptionInfo {
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
        const plan = getPlanDefinition('kurumsal');
        return { planId: plan.id, planName: plan.name, monthlyCredits: plan.monthlyCredits, monthlyPrice: plan.monthlyPrice };
    }
    if (currentCredits >= 400) {
        const plan = getPlanDefinition('ofis');
        return { planId: plan.id, planName: plan.name, monthlyCredits: plan.monthlyCredits, monthlyPrice: plan.monthlyPrice };
    }
    const plan = getPlanDefinition('danisman');
    return { planId: plan.id, planName: plan.name, monthlyCredits: plan.monthlyCredits, monthlyPrice: plan.monthlyPrice };
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

export async function getOrCreateSubscription(userIdRaw: string): Promise<SubscriptionInfo> {
    const userId = normalizePhone(userIdRaw);
    if (!userId) {
        throw new Error('Hesap bilgisi gerekli');
    }

    const currentCredits = Math.max(0, await getCredits(userId));
    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(userId);
        const sql = getPersistentSql();
        const existingRows = await sql<Record<string, unknown>[]>`
            SELECT * FROM subscriptions WHERE phone = ${userId}
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
                ${userId}, ${created.planId}, ${created.planName}, ${created.monthlyCredits}, ${created.monthlyPrice},
                ${created.status}, ${created.startDate}, ${created.nextBillingDate}, NULL, NULL
            )
            ON CONFLICT (phone) DO NOTHING
        `;

        const insertedRows = await sql<Record<string, unknown>[]>`
            SELECT * FROM subscriptions WHERE phone = ${userId}
        `;
        if (insertedRows[0]) return mapSubscriptionRow(insertedRows[0]);
        return created;
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
    const existing = db.prepare(`SELECT * FROM subscriptions WHERE phone = ?`).get(userId) as Record<string, unknown> | undefined;
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
        userId,
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

export async function setSubscriptionPlan(userIdRaw: string, planId: PlanId): Promise<SubscriptionInfo> {
    const userId = normalizePhone(userIdRaw);
    if (!userId) throw new Error('Hesap bilgisi gerekli');

    const now = new Date();
    const plan = getPlanDefinition(planId);
    const subscription: SubscriptionInfo = {
        planId,
        planName: plan.name,
        monthlyCredits: plan.monthlyCredits,
        monthlyPrice: plan.monthlyPrice,
        status: 'active',
        startDate: now.toISOString(),
        nextBillingDate: addOneMonthIso(now),
    };

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(userId);
        const sql = getPersistentSql();
        await sql`
            INSERT INTO subscriptions (
                phone, plan_id, plan_name, monthly_credits, monthly_price, status, start_date, next_billing_date, cancelled_at, last_used_credits
            ) VALUES (
                ${userId}, ${subscription.planId}, ${subscription.planName}, ${subscription.monthlyCredits}, ${subscription.monthlyPrice},
                'active', ${subscription.startDate}, ${subscription.nextBillingDate}, NULL, NULL
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
        return subscription;
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
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
    `).run(
        userId,
        subscription.planId,
        subscription.planName,
        subscription.monthlyCredits,
        subscription.monthlyPrice,
        subscription.startDate,
        subscription.nextBillingDate
    );
    return subscription;
}

export async function cancelSubscription(userIdRaw: string): Promise<{
    subscription: SubscriptionInfo;
    credits: number;
    usedCredits: number;
    removedCredits: number;
}> {
    const userId = normalizePhone(userIdRaw);
    if (!userId) throw new Error('Hesap bilgisi gerekli');

    const currentCredits = Math.max(0, await getCredits(userId));
    const subscription = await getOrCreateSubscription(userId);
    if (subscription.status === 'cancelled') {
        return {
            subscription,
            credits: currentCredits,
            usedCredits: Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits)),
            removedCredits: 0,
        };
    }

    const usedCredits = Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits));
    const remainingCredits = currentCredits;
    const cancelledAt = new Date().toISOString();

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(userId);
        const sql = getPersistentSql();
        const reserved = await sql.reserve();
        try {
            await reserved`BEGIN`;
            await reserved`
                UPDATE subscriptions
                SET status = 'cancelled', cancelled_at = ${cancelledAt}, last_used_credits = ${usedCredits}
                WHERE phone = ${userId}
            `;
            await reserved`
                INSERT INTO credits (phone, balance, updated_at)
                VALUES (${userId}, 0, ${Date.now()})
                ON CONFLICT (phone) DO UPDATE SET
                    balance = EXCLUDED.balance,
                    updated_at = EXCLUDED.updated_at
            `;
            await reserved`
                INSERT INTO credit_ledger (phone, delta, reason, created_at)
                VALUES (${userId}, ${-remainingCredits}, ${'subscription_cancel_reset'}, ${Date.now()})
            `;
            await reserved`COMMIT`;
        } catch (error: unknown) {
            await reserved`ROLLBACK`;
            throw error;
        } finally {
            reserved.release();
        }
        const refreshed = await getOrCreateSubscription(userId);
        return { subscription: refreshed, credits: 0, usedCredits, removedCredits: remainingCredits };
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
    const tx = db.transaction(() => {
        db.prepare(`
            UPDATE subscriptions
            SET status = 'cancelled', cancelled_at = ?, last_used_credits = ?
            WHERE phone = ?
        `).run(cancelledAt, usedCredits, userId);

        db.prepare(`
            INSERT INTO credits (phone, balance, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                balance = excluded.balance,
                updated_at = excluded.updated_at
        `).run(userId, 0, Date.now());

        db.prepare(`
            INSERT INTO credit_ledger (phone, delta, reason, created_at)
            VALUES (?, ?, ?, ?)
        `).run(userId, -remainingCredits, 'subscription_cancel_reset', Date.now());
    });
    tx();

    const refreshed = await getOrCreateSubscription(userId);
    return { subscription: refreshed, credits: 0, usedCredits, removedCredits: remainingCredits };
}
