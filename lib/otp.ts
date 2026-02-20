import crypto from 'crypto';
import { ensureUser, getDb, normalizePhone } from '@/lib/db';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SECRET = process.env.OTP_SECRET || 'dev-otp-secret-change-me';

function hashOtp(phone: string, code: string): string {
    return crypto
        .createHash('sha256')
        .update(`${phone}:${code}:${OTP_SECRET}`)
        .digest('hex');
}

function generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendTwilioSms(toPhone: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM_PHONE;

    if (!accountSid || !authToken || !fromPhone) {
        throw new Error('SMS sağlayıcısı yapılandırılmamış');
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const body = new URLSearchParams({
        To: `+90${toPhone}`,
        From: fromPhone,
        Body: message,
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'SMS gönderimi başarısız');
    }
}

async function sendOtpSms(phone: string, code: string): Promise<void> {
    const message = `Emlak YZ doğrulama kodunuz: ${code}. Kod 5 dakika geçerlidir.`;
    const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_PHONE);

    if (hasTwilio) {
        await sendTwilioSms(phone, message);
        return;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('SMS sağlayıcısı eksik: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_PHONE');
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

    const db = getDb();
    const now = Date.now();
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
