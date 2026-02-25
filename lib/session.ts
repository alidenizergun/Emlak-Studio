import crypto from 'crypto';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'emlak_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret(): string {
    const explicitSecret = process.env.SESSION_SECRET?.trim() || '';
    if (explicitSecret) return explicitSecret;

    if (process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET tanımlı olmalı');
    }

    return process.env.OTP_SECRET || 'dev-session-secret-change-me';
}

interface SessionPayload {
    phone: string;
    exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64');
}

function sign(data: string): string {
    return base64UrlEncode(crypto.createHmac('sha256', getSessionSecret()).update(data).digest());
}

function normalizePhone(phoneRaw: string): string {
    const digits = String(phoneRaw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 12 && digits.startsWith('90')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length > 10) return digits.slice(-10);
    return digits;
}

export function createSessionToken(phoneRaw: string): string {
    const phone = normalizePhone(phoneRaw);
    const payload: SessionPayload = {
        phone,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const body = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(body);
    return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
    if (!token) return null;
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    if (sign(body) !== signature) return null;

    try {
        const payload = JSON.parse(base64UrlDecode(body).toString('utf-8')) as SessionPayload;
        if (!payload?.phone || !payload?.exp) return null;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

export function getSessionPhone(request: NextRequest): string | null {
    const payload = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!payload?.phone) return null;
    return normalizePhone(payload.phone);
}

export function getSessionCookieName(): string {
    return SESSION_COOKIE_NAME;
}

export function getSessionTtlSeconds(): number {
    return SESSION_TTL_SECONDS;
}
