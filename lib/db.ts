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
    const digits = String(phoneRaw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 12 && digits.startsWith('90')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length > 10) return digits.slice(-10);
    return digits;
}

function initDb(db: Database.Database): void {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            phone TEXT PRIMARY KEY,
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
            last_used_credits INTEGER
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
    `);

    // Lightweight migrations for existing local databases.
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
    db.prepare(
        `INSERT OR IGNORE INTO users (phone, created_at) VALUES (?, ?)`
    ).run(normalized, Date.now());
}
