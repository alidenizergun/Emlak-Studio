import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL?.trim() || '';
const persistentEnabled = databaseUrl.length > 0;
const sqliteDevFallbackEnabled =
    process.env.ALLOW_SQLITE_DEV_FALLBACK === '1' ||
    (!persistentEnabled && process.env.NODE_ENV !== 'production');

const globalForDb = globalThis as unknown as {
    persistentSql?: postgres.Sql;
    persistentSchemaReady?: boolean;
};

export function hasPersistentDb(): boolean {
    return persistentEnabled;
}

export function isSqliteDevFallbackEnabled(): boolean {
    return sqliteDevFallbackEnabled;
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
            balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
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
    await sql`
        CREATE TABLE IF NOT EXISTS otp_codes (
            phone TEXT PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
            code_hash TEXT NOT NULL,
            expires_at BIGINT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL,
            last_sent_at BIGINT NOT NULL,
            resend_count INTEGER NOT NULL DEFAULT 1
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS mock_payment_checkouts (
            checkout_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            mode TEXT NOT NULL CHECK (mode IN ('topup', 'subscription')),
            plan_id TEXT NOT NULL,
            billing TEXT NOT NULL CHECK (billing IN ('monthly', 'yearly')),
            credits INTEGER NOT NULL CHECK (credits >= 0),
            amount INTEGER NOT NULL CHECK (amount >= 0),
            status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
            idempotency_key TEXT UNIQUE,
            confirm_idempotency_key TEXT UNIQUE,
            ledger_id BIGINT,
            created_at BIGINT NOT NULL,
            paid_at BIGINT
        )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_ledger_phone_created_at ON credit_ledger(phone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_ledger_reason_created_at ON credit_ledger(reason, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_status_next_billing ON subscriptions(status, next_billing_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mock_payment_phone_created_at ON mock_payment_checkouts(phone, created_at DESC)`;

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
