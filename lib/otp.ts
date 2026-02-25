import crypto from 'crypto';
import { ensureUser, getDb, normalizePhone } from '@/lib/db';
import {
    ensurePersistentSchema,
    ensurePersistentUser,
    getPersistentSql,
    hasPersistentDb,
    isSqliteDevFallbackEnabled
} from '@/lib/persistent-db';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SECRET = process.env.OTP_SECRET || 'dev-otp-secret-change-me';

function xmlEscape(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function hashOtp(phone: string, code: string): string {
    return crypto
        .createHash('sha256')
        .update(`${phone}:${code}:${OTP_SECRET}`)
        .digest('hex');
}

function generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendPostaGuverciniSms(toPhone: string, message: string): Promise<void> {
    const username = process.env.POSTAGUVERCINI_USERNAME;
    const password = process.env.POSTAGUVERCINI_PASSWORD;
    const endpoint = process.env.POSTAGUVERCINI_ENDPOINT || 'https://www.postaguvercini.com/api_ws/smsservice.asmx';

    if (!username || !password) {
        throw new Error('POSTAGUVERCINI_USERNAME ve POSTAGUVERCINI_PASSWORD gerekli');
    }

    const now = new Date();
    const expire = new Date(now.getTime() + 5 * 60 * 1000);

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SmsInsert_1_N xmlns="http://83.66.137.24/PgApiWs">
      <Username>${xmlEscape(username)}</Username>
      <Password>${xmlEscape(password)}</Password>
      <SendDate>${now.toISOString()}</SendDate>
      <ExpireDate>${expire.toISOString()}</ExpireDate>
      <Recepients>
        <string>90${toPhone}</string>
      </Recepients>
      <Message>${xmlEscape(message)}</Message>
    </SmsInsert_1_N>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: '"http://83.66.137.24/PgApiWs/SmsInsert_1_N"',
        },
        body: xml,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'SMS gönderimi başarısız');
    }

    const responseXml = await response.text();
    if (responseXml.includes('<soap:Fault') || responseXml.includes('<faultcode>')) {
        throw new Error('Posta Güvercini SOAP fault döndürdü');
    }

    const match = responseXml.match(/<string>(.*?)<\/string>/);
    if (!match) {
        throw new Error('Posta Güvercini cevabı doğrulanamadı');
    }
}

async function sendOtpSms(phone: string, code: string): Promise<void> {
    const message = `Emlak YZ doğrulama kodunuz: ${code}. Kod 5 dakika geçerlidir.`;

    if (process.env.POSTAGUVERCINI_USERNAME && process.env.POSTAGUVERCINI_PASSWORD) {
        await sendPostaGuverciniSms(phone, message);
        return;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('Posta Güvercini yapılandırması eksik: POSTAGUVERCINI_USERNAME/POSTAGUVERCINI_PASSWORD');
    }

    // Local/dev fallback: gerçek doğrulama sürer, kod terminale yazdırılır.
    console.log(`[OTP][DEV] ${phone} kodu: ${code}`);
}

export async function createAndSendOtp(phoneRaw: string): Promise<void> {
    const phone = normalizePhone(phoneRaw);
    if (phone.length !== 10) {
        throw new Error('Geçersiz telefon');
    }
    if (process.env.NODE_ENV === 'production' && OTP_SECRET === 'dev-otp-secret-change-me') {
        throw new Error('OTP_SECRET yapılandırılmamış');
    }

    const now = Date.now();
    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);

        const sql = getPersistentSql();
        const existingRows = await sql<{ last_sent_at: number }[]>`
            SELECT last_sent_at FROM otp_codes WHERE phone = ${phone}
        `;
        const existing = existingRows[0];
        if (existing) {
            const nextAllowedAt = Number(existing.last_sent_at || 0) + OTP_RESEND_SECONDS * 1000;
            if (now < nextAllowedAt) {
                throw new Error(`Lütfen ${Math.ceil((nextAllowedAt - now) / 1000)} sn bekleyin`);
            }
        }

        const code = generateOtpCode();
        const codeHash = hashOtp(phone, code);
        const expiresAt = now + OTP_TTL_MS;

        await sql`
            INSERT INTO otp_codes (phone, code_hash, expires_at, attempts, created_at, last_sent_at, resend_count)
            VALUES (${phone}, ${codeHash}, ${expiresAt}, 0, ${now}, ${now}, 1)
            ON CONFLICT(phone) DO UPDATE SET
                code_hash = excluded.code_hash,
                expires_at = excluded.expires_at,
                attempts = 0,
                created_at = excluded.created_at,
                last_sent_at = excluded.last_sent_at,
                resend_count = otp_codes.resend_count + 1
        `;
        await sendOtpSms(phone, code);
        return;
    }

    if (!isSqliteDevFallbackEnabled()) {
        throw new Error('Postgres bağlantısı gerekli. Local debug için ALLOW_SQLITE_DEV_FALLBACK=1 ayarlayın.');
    }

    const db = getDb();
    ensureUser(phone);

    const existing = db.prepare(`SELECT last_sent_at FROM otp_codes WHERE phone = ?`).get(phone) as { last_sent_at: number } | undefined;
    if (existing) {
        const nextAllowedAt = Number(existing.last_sent_at || 0) + OTP_RESEND_SECONDS * 1000;
        if (now < nextAllowedAt) {
            throw new Error(`Lütfen ${Math.ceil((nextAllowedAt - now) / 1000)} sn bekleyin`);
        }
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(phone, code);
    const expiresAt = now + OTP_TTL_MS;

    db.prepare(`
        INSERT INTO otp_codes (phone, code_hash, expires_at, attempts, created_at, last_sent_at, resend_count)
        VALUES (?, ?, ?, 0, ?, ?, 1)
        ON CONFLICT(phone) DO UPDATE SET
            code_hash = excluded.code_hash,
            expires_at = excluded.expires_at,
            attempts = 0,
            created_at = excluded.created_at,
            last_sent_at = excluded.last_sent_at,
            resend_count = otp_codes.resend_count + 1
    `).run(phone, codeHash, expiresAt, now, now);

    await sendOtpSms(phone, code);
}

export async function verifyOtp(phoneRaw: string, codeRaw: string): Promise<{ ok: boolean; error?: string }> {
    const phone = normalizePhone(phoneRaw);
    const code = String(codeRaw || '').replace(/\D/g, '');
    if (phone.length !== 10 || code.length !== 6) {
        return { ok: false, error: 'Geçersiz kod' };
    }

    if (hasPersistentDb()) {
        await ensurePersistentSchema();
        await ensurePersistentUser(phone);

        const sql = getPersistentSql();
        const rows = await sql<{ code_hash: string; expires_at: number; attempts: number }[]>`
            SELECT code_hash, expires_at, attempts
            FROM otp_codes
            WHERE phone = ${phone}
        `;
        const row = rows[0];
        if (!row) return { ok: false, error: 'Kod bulunamadı veya süresi doldu' };

        const now = Date.now();
        if (now > Number(row.expires_at || 0)) {
            await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
            return { ok: false, error: 'Kod süresi doldu' };
        }

        if (Number(row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            return { ok: false, error: 'Çok fazla hatalı deneme. Yeni kod isteyin' };
        }

        const expectedHash = hashOtp(phone, code);
        if (expectedHash !== row.code_hash) {
            await sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ${phone}`;
            return { ok: false, error: 'Kod geçersiz' };
        }

        await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
        return { ok: true };
    }

    if (!isSqliteDevFallbackEnabled()) {
        return { ok: false, error: 'Doğrulama altyapısı hazır değil' };
    }

    const db = getDb();
    const row = db.prepare(`SELECT code_hash, expires_at, attempts FROM otp_codes WHERE phone = ?`).get(phone) as {
        code_hash: string;
        expires_at: number;
        attempts: number;
    } | undefined;

    if (!row) return { ok: false, error: 'Kod bulunamadı veya süresi doldu' };

    const now = Date.now();
    if (now > Number(row.expires_at || 0)) {
        db.prepare(`DELETE FROM otp_codes WHERE phone = ?`).run(phone);
        return { ok: false, error: 'Kod süresi doldu' };
    }

    if (Number(row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
        return { ok: false, error: 'Çok fazla hatalı deneme. Yeni kod isteyin' };
    }

    const expectedHash = hashOtp(phone, code);
    if (expectedHash !== row.code_hash) {
        db.prepare(`UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?`).run(phone);
        return { ok: false, error: 'Kod geçersiz' };
    }

    db.prepare(`DELETE FROM otp_codes WHERE phone = ?`).run(phone);
    return { ok: true };
}
