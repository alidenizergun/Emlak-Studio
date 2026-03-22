import bcrypt from 'bcryptjs';
import { ensureUser, getDb, normalizePhone } from '@/lib/db';
import {
    ensurePersistentSchema,
    ensurePersistentUser,
    getPersistentSql,
    hasPersistentDb,
    isSqliteDevFallbackEnabled
} from '@/lib/persistent-db';

export interface AuthUser {
    email: string;
    passwordHash: string | null;
}

function isValidEmail(emailRaw: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw);
}

export function normalizeEmail(emailRaw: string | null | undefined): string {
    return normalizePhone(emailRaw);
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
}

export async function findUserByEmail(emailRaw: string): Promise<AuthUser | null> {
    const email = normalizeEmail(emailRaw);
    if (!email || !isValidEmail(email)) return null;

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        const sql = getPersistentSql();
        const rows = await sql<{ email: string | null; password_hash: string | null }[]>`
            SELECT email, password_hash
            FROM users
            WHERE email = ${email} OR phone = ${email}
            LIMIT 1
        `;
        const row = rows[0];
        if (!row) return null;
        return {
            email: String(row.email || email),
            passwordHash: row.password_hash ? String(row.password_hash) : null,
        };
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
    const row = db.prepare(
        `SELECT email, password_hash
         FROM users
         WHERE email = ? OR phone = ?
         LIMIT 1`
    ).get(email, email) as { email: string | null; password_hash: string | null } | undefined;

    if (!row) return null;
    return {
        email: String(row.email || email),
        passwordHash: row.password_hash ? String(row.password_hash) : null,
    };
}

export async function createEmailUser(emailRaw: string, passwordHash: string): Promise<AuthUser> {
    const email = normalizeEmail(emailRaw);
    if (!email || !isValidEmail(email)) {
        throw new Error('Geçerli bir e-posta adresi girin.');
    }

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(email);
        const sql = getPersistentSql();
        try {
            await sql`
                INSERT INTO users (phone, email, password_hash, created_at)
                VALUES (${email}, ${email}, ${passwordHash}, ${Date.now()})
            `;
        } catch (error) {
            if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
                throw new Error('Bu e-posta adresi zaten kayıtlı.');
            }
            throw error;
        }
        return { email, passwordHash };
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
    ensureUser(email);
    try {
        db.prepare(
            `UPDATE users
             SET email = ?, password_hash = ?
             WHERE phone = ?`
        ).run(email, passwordHash, email);
    } catch (error) {
        if (error instanceof Error && /unique|constraint/i.test(error.message)) {
            throw new Error('Bu e-posta adresi zaten kayıtlı.');
        }
        throw error;
    }
    return { email, passwordHash };
}

export async function upsertEmailUser(emailRaw: string, passwordHash: string): Promise<AuthUser> {
    const email = normalizeEmail(emailRaw);
    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(email);
        const sql = getPersistentSql();
        await sql`
            INSERT INTO users (phone, email, password_hash, created_at)
            VALUES (${email}, ${email}, ${passwordHash}, ${Date.now()})
            ON CONFLICT (phone) DO UPDATE SET
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash
        `;
        return { email, passwordHash };
    }

    ensureUser(email);
    const db = getDb();
    db.prepare(
        `UPDATE users
         SET email = ?, password_hash = ?
         WHERE phone = ?`
    ).run(email, passwordHash, email);
    return { email, passwordHash };
}

export async function ensureOAuthUser(emailRaw: string): Promise<AuthUser> {
    const email = normalizeEmail(emailRaw);
    if (!email || !isValidEmail(email)) {
        throw new Error('Geçerli bir e-posta adresi girin.');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
        return existing;
    }

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        const sql = getPersistentSql();
        try {
            await sql`
                INSERT INTO users (phone, email, password_hash, created_at)
                VALUES (${email}, ${email}, ${null}, ${Date.now()})
            `;
        } catch (error) {
            if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
                const found = await findUserByEmail(email);
                if (found) return found;
            }
            throw error;
        }
        return { email, passwordHash: null };
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
    ensureUser(email);
    db.prepare(
        `UPDATE users
         SET email = COALESCE(email, ?)
         WHERE phone = ?`
    ).run(email, email);
    return { email, passwordHash: null };
}
