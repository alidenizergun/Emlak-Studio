import { getDb, normalizePhone, ensureUser } from './db';

const PHONE_TABLES = [
    'credit_ledger',
    'mock_payment_checkouts',
    'stage_runs',
    'stage_feedback',
    'ai_tour_runs',
    'ai_tour_feedback',
    'listing_text_runs',
    'listing_text_feedback',
    'tool_runs',
] as const;

type SubscriptionRow = {
    phone: string;
    plan_id: string;
    plan_name: string;
    monthly_credits: number;
    monthly_price: number;
    status: string;
    start_date: string;
    next_billing_date: string;
    cancelled_at: string | null;
    last_used_credits: number | null;
};

export function mergeUserAccounts(sourceUserIdRaw: string, targetUserIdRaw: string): { sourceUserId: string; targetUserId: string; movedHistoryItems: number; mergedCredits: number; } {
    const db = getDb();
    const sourceUserId = normalizePhone(sourceUserIdRaw);
    const targetUserId = normalizePhone(targetUserIdRaw);

    if (!sourceUserId || !targetUserId) {
        throw new Error('Kaynak ve hedef hesap kimlikleri gerekli.');
    }
    if (sourceUserId === targetUserId) {
        throw new Error('Kaynak ve hedef hesap ayni olamaz.');
    }

    ensureUser(sourceUserId);
    ensureUser(targetUserId);

    const tx = db.transaction(() => {
        const sourceUser = db.prepare(`SELECT phone, email FROM users WHERE phone = ?`).get(sourceUserId) as { phone: string; email: string | null } | undefined;
        const targetUser = db.prepare(`SELECT phone, email FROM users WHERE phone = ?`).get(targetUserId) as { phone: string; email: string | null } | undefined;
        if (!sourceUser) throw new Error('Kaynak hesap bulunamadi.');
        if (!targetUser) throw new Error('Hedef hesap bulunamadi.');

        const sourceCreditsRow = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(sourceUserId) as { balance: number } | undefined;
        const targetCreditsRow = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(targetUserId) as { balance: number } | undefined;
        const sourceCredits = Math.max(0, Number(sourceCreditsRow?.balance || 0));
        const targetCredits = Math.max(0, Number(targetCreditsRow?.balance || 0));
        const mergedCredits = sourceCredits + targetCredits;

        db.prepare(`
            INSERT INTO credits (phone, balance, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                balance = excluded.balance,
                updated_at = excluded.updated_at
        `).run(targetUserId, mergedCredits, Date.now());
        db.prepare(`DELETE FROM credits WHERE phone = ?`).run(sourceUserId);
        db.prepare(`
            INSERT INTO credit_ledger (phone, delta, reason, created_at)
            VALUES (?, ?, ?, ?)
        `).run(targetUserId, sourceCredits, `account_merge_from_${sourceUserId}`, Date.now());
        db.prepare(`UPDATE credit_ledger SET phone = ? WHERE phone = ?`).run(targetUserId, sourceUserId);

        const sourceSubscription = db.prepare(`SELECT * FROM subscriptions WHERE phone = ?`).get(sourceUserId) as SubscriptionRow | undefined;
        const targetSubscription = db.prepare(`SELECT * FROM subscriptions WHERE phone = ?`).get(targetUserId) as SubscriptionRow | undefined;
        const chosenSubscription = pickPreferredSubscription(sourceSubscription, targetSubscription);
        if (chosenSubscription) {
            db.prepare(`DELETE FROM subscriptions WHERE phone IN (?, ?)`).run(sourceUserId, targetUserId);
            db.prepare(`
                INSERT INTO subscriptions (
                    phone, plan_id, plan_name, monthly_credits, monthly_price, status, start_date, next_billing_date, cancelled_at, last_used_credits
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                targetUserId,
                chosenSubscription.plan_id,
                chosenSubscription.plan_name,
                chosenSubscription.monthly_credits,
                chosenSubscription.monthly_price,
                chosenSubscription.status,
                chosenSubscription.start_date,
                chosenSubscription.next_billing_date,
                chosenSubscription.cancelled_at,
                chosenSubscription.last_used_credits
            );
        }

        let movedHistoryItems = 0;
        for (const table of PHONE_TABLES) {
            const result = db.prepare(`UPDATE ${table} SET phone = ? WHERE phone = ?`).run(targetUserId, sourceUserId);
            movedHistoryItems += Number(result.changes || 0);
        }

        db.prepare(`DELETE FROM otp_codes WHERE phone = ?`).run(sourceUserId);
        db.prepare(`UPDATE users SET email = COALESCE(email, ?) WHERE phone = ?`).run(targetUserId, targetUserId);

        return { movedHistoryItems, mergedCredits };
    });

    const result = tx();
    return { sourceUserId, targetUserId, ...result };
}

function pickPreferredSubscription(source?: SubscriptionRow, target?: SubscriptionRow): SubscriptionRow | null {
    if (!source && !target) return null;
    if (!source) return target || null;
    if (!target) return source;

    const sourceActive = source.status === 'active';
    const targetActive = target.status === 'active';
    if (sourceActive && !targetActive) return source;
    if (!sourceActive && targetActive) return target;

    if (source.monthly_credits !== target.monthly_credits) {
        return source.monthly_credits > target.monthly_credits ? source : target;
    }

    return new Date(source.start_date).getTime() > new Date(target.start_date).getTime() ? source : target;
}
