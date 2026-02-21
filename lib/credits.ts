import { ensureUser, getDb, normalizePhone } from '@/lib/db';
import { ensurePersistentSchema, ensurePersistentUser, getPersistentSql, hasPersistentDb } from '@/lib/persistent-db';

function toPositiveInt(value: number): number {
    return Math.max(0, Math.ceil(Number(value) || 0));
}

function getCreditsFromSqlite(phone: string): number {
    ensureUser(phone);
    const db = getDb();
    const row = db.prepare(`SELECT balance FROM credits WHERE phone = ?`).get(phone) as { balance: number } | undefined;
    return Math.max(0, row?.balance ?? 0);
}

export async function getCredits(phoneRaw: string): Promise<number> {
    const phone = normalizePhone(phoneRaw);
    if (!phone) return 0;

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);
        const sql = getPersistentSql();
        const rows = await sql`
            SELECT balance FROM credits WHERE phone = ${phone}
        ` as Array<{ balance: number }>;
        if (rows[0]) {
            return Math.max(0, Number(rows[0].balance ?? 0));
        }

        // One-time soft migration: if user has old SQLite credits, seed Postgres on first read.
        const sqliteCredits = getCreditsFromSqlite(phone);
        if (sqliteCredits > 0) {
            await sql`
                INSERT INTO credits (phone, balance, updated_at)
                VALUES (${phone}, ${sqliteCredits}, ${Date.now()})
                ON CONFLICT (phone) DO UPDATE SET
                    balance = EXCLUDED.balance,
                    updated_at = EXCLUDED.updated_at
            `;
            await sql`
                INSERT INTO credit_ledger (phone, delta, reason, created_at)
                VALUES (${phone}, ${sqliteCredits}, ${'sqlite_migration_seed'}, ${Date.now()})
            `;
        }
        return sqliteCredits;
    }

    return getCreditsFromSqlite(phone);
}

export async function setCredits(phoneRaw: string, targetRaw: number, reason = 'set'): Promise<number> {
    const phone = normalizePhone(phoneRaw);
    const target = Math.max(0, Math.floor(Number(targetRaw) || 0));
    if (!phone) return 0;

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);
        const sql = getPersistentSql();
        const reserved = await sql.reserve();
        try {
            await reserved`BEGIN`;
            const currentRows = await reserved`
                SELECT balance FROM credits WHERE phone = ${phone}
            ` as Array<{ balance: number }>;
            const current = Math.max(0, Number(currentRows[0]?.balance ?? 0));
            const delta = target - current;

            await reserved`
                INSERT INTO credits (phone, balance, updated_at)
                VALUES (${phone}, ${target}, ${Date.now()})
                ON CONFLICT (phone) DO UPDATE SET
                    balance = EXCLUDED.balance,
                    updated_at = EXCLUDED.updated_at
            `;

            if (delta !== 0) {
                await reserved`
                    INSERT INTO credit_ledger (phone, delta, reason, created_at)
                    VALUES (${phone}, ${delta}, ${reason}, ${Date.now()})
                `;
            }
            await reserved`COMMIT`;
        } catch (error: unknown) {
            await reserved`ROLLBACK`;
            throw error;
        } finally {
            reserved.release();
        }
        return target;
    }

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

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);
        const sql = getPersistentSql();
        const reserved = await sql.reserve();
        try {
            await reserved`BEGIN`;
            const currentRows = await reserved`
                SELECT balance FROM credits WHERE phone = ${phone}
            ` as Array<{ balance: number }>;
            const current = Math.max(0, Number(currentRows[0]?.balance ?? 0));
            const updated = current + amount;

            await reserved`
                INSERT INTO credits (phone, balance, updated_at)
                VALUES (${phone}, ${updated}, ${Date.now()})
                ON CONFLICT (phone) DO UPDATE SET
                    balance = EXCLUDED.balance,
                    updated_at = EXCLUDED.updated_at
            `;
            await reserved`
                INSERT INTO credit_ledger (phone, delta, reason, created_at)
                VALUES (${phone}, ${amount}, ${reason}, ${Date.now()})
            `;
            await reserved`COMMIT`;
            return updated;
        } catch (error: unknown) {
            await reserved`ROLLBACK`;
            throw error;
        } finally {
            reserved.release();
        }
    }

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

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);
        const sql = getPersistentSql();
        const reserved = await sql.reserve();
        try {
            await reserved`BEGIN`;
            const rows = await reserved`
                SELECT balance FROM credits WHERE phone = ${phone}
            ` as Array<{ balance: number }>;
            const current = Math.max(0, Number(rows[0]?.balance ?? 0));
            if (current < amount) {
                await reserved`COMMIT`;
                return { ok: false, credits: current };
            }
            const next = current - amount;

            await reserved`
                INSERT INTO credits (phone, balance, updated_at)
                VALUES (${phone}, ${next}, ${Date.now()})
                ON CONFLICT (phone) DO UPDATE SET
                    balance = EXCLUDED.balance,
                    updated_at = EXCLUDED.updated_at
            `;
            await reserved`
                INSERT INTO credit_ledger (phone, delta, reason, created_at)
                VALUES (${phone}, ${-amount}, ${'usage'}, ${Date.now()})
            `;
            await reserved`COMMIT`;

            return { ok: true, credits: next };
        } catch (error: unknown) {
            await reserved`ROLLBACK`;
            throw error;
        } finally {
            reserved.release();
        }
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
