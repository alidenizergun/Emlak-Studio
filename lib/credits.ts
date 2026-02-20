import { ensureUser, getDb, normalizePhone } from '@/lib/db';

function toPositiveInt(value: number): number {
    return Math.max(0, Math.ceil(Number(value) || 0));
}

export async function getCredits(phoneRaw: string): Promise<number> {
    const phone = normalizePhone(phoneRaw);
    if (!phone) return 0;

    ensureUser(phone);
    const db = getDb();
    const row = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(phone) as { balance: number } | undefined;
    return Math.max(0, row?.balance ?? 0);
}

export async function setCredits(phoneRaw: string, targetRaw: number, reason = 'set'): Promise<number> {
    const phone = normalizePhone(phoneRaw);
    const target = Math.max(0, Math.floor(Number(targetRaw) || 0));
    if (!phone) return 0;

    const db = getDb();
    const tx = db.transaction(() => {
        ensureUser(phone);
        const currentRow = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(phone) as { balance: number } | undefined;
        const current = Math.max(0, currentRow?.balance ?? 0);
        const delta = target - current;

        db.prepare(`
            INSERT INTO credits (phone, balance, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                balance = excluded.balance,
                updated_at = excluded.updated_at
        `).run(phone, target, Date.now());

        if (delta !== 0) {
            db.prepare(`
                INSERT INTO credit_ledger (phone, delta, reason, created_at)
                VALUES (?, ?, ?, ?)
            `).run(phone, delta, reason, Date.now());
        }

        return target;
    });

    return tx();
}

export async function addCredits(phoneRaw: string, amountRaw: number, reason = 'manual_add'): Promise<number> {
    const phone = normalizePhone(phoneRaw);
    const amount = toPositiveInt(amountRaw);
    if (!phone || amount <= 0) return await getCredits(phoneRaw);

    const db = getDb();
    const tx = db.transaction(() => {
        ensureUser(phone);
        const currentRow = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(phone) as { balance: number } | undefined;
        const current = Math.max(0, currentRow?.balance ?? 0);
        const next = current + amount;

        db.prepare(`
            INSERT INTO credits (phone, balance, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                balance = excluded.balance,
                updated_at = excluded.updated_at
        `).run(phone, next, Date.now());

        db.prepare(`
            INSERT INTO credit_ledger (phone, delta, reason, created_at)
            VALUES (?, ?, ?, ?)
        `).run(phone, amount, reason, Date.now());

        return next;
    });

    return tx();
}

export async function deductCredits(phoneRaw: string, amountRaw: number): Promise<{
    ok: boolean;
    credits: number;
}> {
    const phone = normalizePhone(phoneRaw);
    const amount = toPositiveInt(amountRaw);

    if (!phone || amount <= 0) {
        return { ok: false, credits: await getCredits(phoneRaw) };
    }

    const db = getDb();
    const tx = db.transaction(() => {
        ensureUser(phone);
        const row = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(phone) as { balance: number } | undefined;
        const current = Math.max(0, row?.balance ?? 0);
        if (current < amount) {
            return { ok: false, credits: current };
        }
        const next = current - amount;

        db.prepare(`
            INSERT INTO credits (phone, balance, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                balance = excluded.balance,
                updated_at = excluded.updated_at
        `).run(phone, next, Date.now());

        db.prepare(`
            INSERT INTO credit_ledger (phone, delta, reason, created_at)
            VALUES (?, ?, ?, ?)
        `).run(phone, -amount, 'usage', Date.now());

        return { ok: true, credits: next };
    });

    return tx();
}
