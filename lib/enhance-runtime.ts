import crypto from 'crypto';
import { getDb } from '@/lib/db';

interface CachedEnhanceResponse {
    success: true;
    imageUrl: string;
    provider: string;
    model: string;
    fallbackUsed?: boolean;
    attemptedModels?: string[];
    attemptLog?: Array<{
        model: string;
        attempt: number;
        status: string;
        latencyMs: number;
        message?: string;
    }>;
    processingMode?: 'ai' | 'ai_cached';
    appliedOptionsResolved?: string[];
    architectureScore?: number;
    qualityScore?: number;
    contractScore?: number;
    qualityMetrics?: {
        architectureScore?: number;
        contractScore?: number;
        outputScore?: number;
    };
    appliedOptions?: string[];
}

const inflightByKey = new Map<string, Promise<unknown>>();
const retryBudgetByDay = new Map<string, number>();

const CACHE_TTL_MS = Number(process.env.ENHANCE_CACHE_TTL_MS || 1000 * 60 * 60 * 24);
const DAILY_RETRY_LIMIT = Number(process.env.ENHANCE_DAILY_RETRY_BUDGET || 2);
const FALLBACK_PIPELINE_VERSION = process.env.ENHANCE_FALLBACK_PIPELINE_VERSION || 'fp1';
const ENHANCE_GUARD_VERSION = process.env.ENHANCE_GUARD_VERSION || 'eg1';
const ENHANCE_POSTPROCESS_VERSION = process.env.ENHANCE_POSTPROCESS_VERSION || 'pp1';

function hashParts(parts: string[]): string {
    const h = crypto.createHash('sha256');
    for (const p of parts) h.update(p).update('\n');
    return h.digest('hex');
}

function todayKey(phone: string): string {
    return `${phone}:${new Date().toISOString().slice(0, 10)}`;
}

export async function buildEnhanceRequestKey(
    image: File,
    options: Record<string, boolean>,
    promptVersion: string,
    promptText?: string
): Promise<string> {
    const bytes = Buffer.from(await image.arrayBuffer());
    const imageHash = crypto.createHash('sha256').update(bytes).digest('hex');
    const selected = Object.keys(options).filter((k) => options[k]).sort().join(',');
    const promptHash = crypto.createHash('sha256').update(String(promptText || '')).digest('hex').slice(0, 16);
    return hashParts([
        imageHash,
        selected,
        promptVersion,
        promptHash,
        FALLBACK_PIPELINE_VERSION,
        ENHANCE_GUARD_VERSION,
        ENHANCE_POSTPROCESS_VERSION,
        'enhance-v3',
    ]);
}

export function withEnhanceIdempotency<T>(requestKey: string, fn: () => Promise<T>): Promise<T> {
    const pending = inflightByKey.get(requestKey);
    if (pending) return pending as Promise<T>;
    const run = fn();
    inflightByKey.set(requestKey, run as Promise<unknown>);
    return run.finally(() => inflightByKey.delete(requestKey));
}

export function consumeEnhanceRetryBudget(phone: string): { allowed: boolean; used: number; limit: number } {
    const key = todayKey(phone);
    const used = retryBudgetByDay.get(key) || 0;
    if (used >= DAILY_RETRY_LIMIT) return { allowed: false, used, limit: DAILY_RETRY_LIMIT };
    retryBudgetByDay.set(key, used + 1);
    return { allowed: true, used: used + 1, limit: DAILY_RETRY_LIMIT };
}

export function readCachedEnhanceResponse(requestKey: string): CachedEnhanceResponse | null {
    const db = getDb();
    const row = db
        .prepare(`SELECT response_json, expires_at FROM enhance_result_cache WHERE request_key = ?`)
        .get(requestKey) as { response_json: string; expires_at: number } | undefined;
    if (!row) return null;
    if (Date.now() > Number(row.expires_at || 0)) {
        db.prepare(`DELETE FROM enhance_result_cache WHERE request_key = ?`).run(requestKey);
        return null;
    }
    try {
        return JSON.parse(row.response_json) as CachedEnhanceResponse;
    } catch {
        db.prepare(`DELETE FROM enhance_result_cache WHERE request_key = ?`).run(requestKey);
        return null;
    }
}

export function writeCachedEnhanceResponse(requestKey: string, response: CachedEnhanceResponse): void {
    const db = getDb();
    const now = Date.now();
    db.prepare(
        `INSERT INTO enhance_result_cache (request_key, response_json, created_at, expires_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(request_key) DO UPDATE SET
          response_json = excluded.response_json,
          created_at = excluded.created_at,
          expires_at = excluded.expires_at`
    ).run(requestKey, JSON.stringify(response), now, now + CACHE_TTL_MS);
}
