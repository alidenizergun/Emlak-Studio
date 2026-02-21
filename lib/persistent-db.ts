import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL?.trim() || '';
const persistentEnabled = databaseUrl.length > 0;

const globalForDb = globalThis as unknown as {
    persistentSql?: postgres.Sql;
    persistentSchemaReady?: boolean;
};

export function hasPersistentDb(): boolean {
    return persistentEnabled;
}

export function getPersistentSql(): postgres.Sql {
    if (!persistentEnabled) {
        throw new Error('DATABASE_URL tanımlı değil');
    }
    if (!globalForDb.persistentSql) {
        globalForDb.persistentSql = postgres(databaseUrl, {
            max: 1,
            prepare: false,
            idle_timeout: 5,
            connect_timeout: 10,
        });
    }
    return globalForDb.persistentSql;
}

export async function ensurePersistentSchema(): Promise<void> {
    if (!persistentEnabled || globalForDb.persistentSchemaReady) return;

    const sql = getPersistentSql();
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            phone TEXT PRIMARY KEY,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS credits (
            phone TEXT PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
            balance INTEGER NOT NULL DEFAULT 0,
            updated_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS credit_ledger (
            id BIGSERIAL PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            delta INTEGER NOT NULL,
            reason TEXT NOT NULL,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS subscriptions (
            phone TEXT PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
            plan_id TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            monthly_credits INTEGER NOT NULL,
            monthly_price INTEGER NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('active', 'cancelled')),
            start_date TEXT NOT NULL,
            next_billing_date TEXT NOT NULL,
            cancelled_at TEXT,
            last_used_credits INTEGER
        )
    `;
    globalForDb.persistentSchemaReady = true;
}

export async function ensurePersistentUser(phone: string): Promise<void> {
    if (!persistentEnabled || !phone) return;
    await ensurePersistentSchema();
    const sql = getPersistentSql();
    await sql`
        INSERT INTO users (phone, created_at)
        VALUES (${phone}, ${Date.now()})
        ON CONFLICT (phone) DO NOTHING
    `;
}
