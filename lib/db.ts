import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';

function isReadonlyFsError(error: unknown): boolean {
    return (
        error instanceof Error &&
        'code' in error &&
        (String((error as { code?: string }).code) === 'EROFS' ||
            String((error as { code?: string }).code) === 'ENOENT')
    );
}

function resolvePreferredDbPath(): string {
    if (process.env.APP_DB_PATH) return process.env.APP_DB_PATH;
    // Vercel/Serverless runtime uses read-only /var/task, so default to /tmp.
    if (process.env.VERCEL) return '/tmp/emlak-studio/app.db';
    return path.join(process.cwd(), 'data', 'app.db');
}

let dbPath = resolvePreferredDbPath();

let dbInstance: Database.Database | null = null;

export function normalizePhone(phoneRaw: string | null | undefined): string {
    const value = String(phoneRaw || '').trim().toLowerCase();
    if (!value) return '';
    if (value.includes('@')) {
        return value;
    }
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 12 && digits.startsWith('90')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length > 10) return digits.slice(-10);
    return digits;
}

export function normalizeUserId(userIdRaw: string | null | undefined): string {
    return normalizePhone(userIdRaw);
}

function initDb(db: Database.Database): void {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            phone TEXT PRIMARY KEY,
            email TEXT,
            password_hash TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS credits (
            phone TEXT PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
            balance INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS credit_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            delta INTEGER NOT NULL,
            reason TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            phone TEXT PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
            plan_id TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            monthly_credits INTEGER NOT NULL,
            monthly_price INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('active', 'cancelled')),
            start_date TEXT NOT NULL,
            next_billing_date TEXT NOT NULL,
            cancelled_at TEXT,
            last_used_credits INTEGER,
            entitlement_status TEXT CHECK(entitlement_status IN ('active', 'grace_period', 'billing_retry', 'paused', 'expired', 'revoked')),
            entitlement_source TEXT CHECK(entitlement_source IN ('legacy', 'app_store', 'revenuecat')),
            provider_customer_id TEXT,
            provider_subscription_id TEXT,
            entitlement_id TEXT,
            product_id TEXT,
            original_transaction_id TEXT,
            billing_environment TEXT CHECK(billing_environment IN ('sandbox', 'production')),
            auto_renews INTEGER CHECK(auto_renews IN (0, 1)),
            current_period_start TEXT,
            current_period_end TEXT,
            entitlement_updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS billing_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL CHECK(provider IN ('app_store', 'revenuecat')),
            event_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            phone TEXT REFERENCES users(phone) ON DELETE SET NULL,
            provider_customer_id TEXT,
            provider_subscription_id TEXT,
            idempotency_key TEXT,
            occurred_at TEXT,
            received_at INTEGER NOT NULL,
            processing_state TEXT NOT NULL DEFAULT 'pending' CHECK(processing_state IN ('pending', 'processed', 'failed')),
            processed_at INTEGER,
            error_message TEXT,
            payload_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS otp_codes (
            phone TEXT PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
            code_hash TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            last_sent_at INTEGER NOT NULL,
            resend_count INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS mock_payment_checkouts (
            checkout_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            mode TEXT NOT NULL CHECK(mode IN ('topup', 'subscription')),
            plan_id TEXT NOT NULL,
            billing TEXT NOT NULL CHECK(billing IN ('monthly', 'yearly')),
            credits INTEGER NOT NULL CHECK(credits >= 0),
            amount INTEGER NOT NULL CHECK(amount >= 0),
            status TEXT NOT NULL CHECK(status IN ('pending', 'paid', 'failed')),
            idempotency_key TEXT UNIQUE,
            confirm_idempotency_key TEXT UNIQUE,
            ledger_id INTEGER,
            created_at INTEGER NOT NULL,
            paid_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS stage_result_cache (
            request_key TEXT PRIMARY KEY,
            response_json TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS enhance_result_cache (
            request_key TEXT PRIMARY KEY,
            response_json TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stage_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            request_key TEXT NOT NULL,
            room_type TEXT NOT NULL,
            style TEXT NOT NULL,
            prompt_version TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'blocked')),
            fail_code TEXT,
            architecture_score REAL,
            quality_score REAL,
            before_image_url TEXT,
            after_image_url TEXT,
            used_credits INTEGER NOT NULL DEFAULT 0,
            refunded INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stage_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL REFERENCES stage_runs(run_id) ON DELETE CASCADE,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK(verdict IN ('good', 'bad')),
            note TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS stage_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tool_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_tour_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
            fail_code TEXT,
            quality_score REAL,
            script_input TEXT,
            script_output TEXT,
            provider TEXT,
            video_url TEXT,
            duration_seconds INTEGER,
            used_credits INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_tour_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL REFERENCES ai_tour_runs(run_id) ON DELETE CASCADE,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK(verdict IN ('good', 'bad')),
            note TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_tour_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS listing_text_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
            fail_code TEXT,
            quality_score REAL,
            provider TEXT,
            input_json TEXT,
            output_text TEXT,
            used_credits INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS listing_text_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL REFERENCES listing_text_runs(run_id) ON DELETE CASCADE,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            verdict TEXT NOT NULL CHECK(verdict IN ('good', 'bad')),
            note TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS listing_text_adaptive_policy (
            policy_key TEXT PRIMARY KEY,
            policy_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tool_runs (
            run_id TEXT PRIMARY KEY,
            phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
            tool_id TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
            before_image_url TEXT,
            after_image_url TEXT,
            title TEXT,
            detail TEXT,
            used_credits INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        );
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_stage_cache_expires_at ON stage_result_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_enhance_cache_expires_at ON enhance_result_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_stage_runs_phone_created_at ON stage_runs(phone, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_stage_runs_status_created_at ON stage_runs(status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_stage_feedback_run_id ON stage_feedback(run_id);
        CREATE INDEX IF NOT EXISTS idx_ai_tour_runs_phone_created_at ON ai_tour_runs(phone, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_ai_tour_feedback_run_id ON ai_tour_feedback(run_id);
        CREATE INDEX IF NOT EXISTS idx_listing_text_runs_phone_created_at ON listing_text_runs(phone, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_listing_text_feedback_run_id ON listing_text_feedback(run_id);
        CREATE INDEX IF NOT EXISTS idx_tool_runs_phone_created_at ON tool_runs(phone, created_at DESC);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_provider_event ON billing_events(provider, event_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_idempotency_key ON billing_events(idempotency_key) WHERE idempotency_key IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_billing_events_state_received ON billing_events(processing_state, received_at DESC);
    `);

    // Lightweight migrations for existing local databases.
    try {
        db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL`);
    } catch {
        // ignore
    }
    try {
        db.exec(`ALTER TABLE stage_runs ADD COLUMN before_image_url TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE stage_runs ADD COLUMN after_image_url TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE ai_tour_runs ADD COLUMN provider TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE ai_tour_runs ADD COLUMN video_url TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE ai_tour_runs ADD COLUMN duration_seconds INTEGER`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN entitlement_status TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN entitlement_source TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN provider_customer_id TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN provider_subscription_id TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN entitlement_id TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN product_id TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN original_transaction_id TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN billing_environment TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN auto_renews INTEGER`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN current_period_start TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN current_period_end TEXT`);
    } catch {
        // ignore (already exists)
    }
    try {
        db.exec(`ALTER TABLE subscriptions ADD COLUMN entitlement_updated_at TEXT`);
    } catch {
        // ignore (already exists)
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON subscriptions(provider_subscription_id)`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_provider_event ON billing_events(provider, event_id)`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_idempotency_key ON billing_events(idempotency_key) WHERE idempotency_key IS NOT NULL`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_billing_events_state_received ON billing_events(processing_state, received_at DESC)`);
}

export function getDb(): Database.Database {
    if (dbInstance) return dbInstance;

    try {
        mkdirSync(path.dirname(dbPath), { recursive: true });
        dbInstance = new Database(dbPath);
    } catch (error: unknown) {
        if (!isReadonlyFsError(error) || dbPath.startsWith('/tmp/')) {
            throw error;
        }
        dbPath = '/tmp/emlak-studio/app.db';
        mkdirSync(path.dirname(dbPath), { recursive: true });
        dbInstance = new Database(dbPath);
    }
    initDb(dbInstance);
    return dbInstance;
}

export function ensureUser(phone: string): void {
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    const db = getDb();
    const email = normalized.includes('@') ? normalized : null;
    db.prepare(
        `INSERT INTO users (phone, email, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(phone) DO UPDATE SET
            email = COALESCE(excluded.email, users.email)`
    ).run(normalized, email, Date.now());
}
