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
            email TEXT UNIQUE,
            password_hash TEXT,
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
    await sql`
        CREATE TABLE IF NOT EXISTS stage_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            request_key TEXT NOT NULL,
            room_type TEXT NOT NULL,
            style TEXT NOT NULL,
            prompt_version TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'blocked')),
            fail_code TEXT,
            architecture_score DOUBLE PRECISION,
            quality_score DOUBLE PRECISION,
            before_image_url TEXT,
            after_image_url TEXT,
            used_credits INTEGER NOT NULL DEFAULT 0,
            refunded INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS stage_feedback (
            id BIGSERIAL PRIMARY KEY,
            run_id TEXT NOT NULL REFERENCES stage_runs(run_id) ON DELETE CASCADE,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
            note TEXT,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS stage_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS listing_text_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
            fail_code TEXT,
            quality_score DOUBLE PRECISION,
            provider TEXT,
            input_json TEXT,
            output_text TEXT,
            used_credits INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS ai_tour_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
            fail_code TEXT,
            quality_score DOUBLE PRECISION,
            script_input TEXT,
            script_output TEXT,
            provider TEXT,
            video_url TEXT,
            duration_seconds INTEGER,
            used_credits INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS ai_tour_feedback (
            id BIGSERIAL PRIMARY KEY,
            run_id TEXT NOT NULL REFERENCES ai_tour_runs(run_id) ON DELETE CASCADE,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
            note TEXT,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS ai_tour_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS tool_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            tool_id TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
            before_image_url TEXT,
            after_image_url TEXT,
            title TEXT,
            detail TEXT,
            used_credits INTEGER NOT NULL DEFAULT 0,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS listing_text_feedback (
            id BIGSERIAL PRIMARY KEY,
            run_id TEXT NOT NULL REFERENCES listing_text_runs(run_id) ON DELETE CASCADE,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
            note TEXT,
            created_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS listing_text_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at BIGINT NOT NULL
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS tool_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at BIGINT NOT NULL
        )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_ledger_phone_created_at ON credit_ledger(phone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_credit_ledger_reason_created_at ON credit_ledger(reason, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_status_next_billing ON subscriptions(status, next_billing_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mock_payment_phone_created_at ON mock_payment_checkouts(phone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stage_runs_phone_created_at ON stage_runs(phone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stage_runs_status_created_at ON stage_runs(status, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stage_feedback_run_id ON stage_feedback(run_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listing_text_runs_phone_created_at ON listing_text_runs(phone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listing_text_feedback_run_id ON listing_text_feedback(run_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_tour_runs_phone_created_at ON ai_tour_runs(phone, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_tour_feedback_run_id ON ai_tour_feedback(run_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tool_runs_phone_created_at ON tool_runs(phone, created_at DESC)`;

    globalForDb.persistentSchemaReady = true;
}

export async function ensurePersistentUser(phone: string): Promise<void> {
    if (!persistentEnabled || !phone) return;
    await ensurePersistentSchema();
    const sql = getPersistentSql();
    const email = phone.includes('@') ? phone : null;
    await sql`
        INSERT INTO users (phone, email, created_at)
        VALUES (${phone}, ${email}, ${Date.now()})
        ON CONFLICT (phone) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, users.email)
    `;
}
