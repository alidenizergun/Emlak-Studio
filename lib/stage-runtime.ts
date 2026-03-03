import crypto from 'crypto';
import { getDb, normalizePhone, ensureUser } from '@/lib/db';

type PromptVersion = 'A' | 'B';
type StageRunStatus = 'success' | 'failed' | 'blocked';

interface CachedStageResponse {
    success: true;
    runId: string;
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
    promptVersion: PromptVersion;
    architectureScore?: number;
    qualityScore?: number;
}

interface PromptStats {
    attempts: number;
    success: number;
}

export interface StageAdaptivePolicy {
    firstLockStrength: number;
    retryLockArchitecture: number;
    retryLockQuality: number;
    architectureThreshold: number;
    styleIntensityCap: 'medium' | 'high';
    cleanupBoost: boolean;
    antiGhostBoost: boolean;
    updatedAt: number;
}

const inflightByKey = new Map<string, Promise<unknown>>();
const retryBudgetByDay = new Map<string, number>();
const hardBlockFailures = new Map<string, { count: number; blockedUntil: number }>();
const promptStats: Record<PromptVersion, PromptStats> = {
    A: { attempts: 0, success: 0 },
    B: { attempts: 0, success: 0 },
};

const CACHE_TTL_MS = Number(process.env.STAGE_CACHE_TTL_MS || 1000 * 60 * 60 * 24);
const DAILY_RETRY_LIMIT = Number(process.env.STAGE_DAILY_RETRY_BUDGET || 3);
const HARD_BLOCK_FAIL_THRESHOLD = Number(process.env.STAGE_HARD_BLOCK_FAIL_THRESHOLD || 7);
const HARD_BLOCK_WINDOW_MS = Number(process.env.STAGE_HARD_BLOCK_WINDOW_MS || 1000 * 60 * 30);
const HARD_BLOCK_DURATION_MS = Number(process.env.STAGE_HARD_BLOCK_DURATION_MS || 1000 * 60 * 15);
const FEEDBACK_REFUND_ARCH_MAX = Number(process.env.STAGE_FEEDBACK_REFUND_ARCH_MAX || 0.76);
const FEEDBACK_REFUND_QUALITY_MAX = Number(process.env.STAGE_FEEDBACK_REFUND_QUALITY_MAX || 0.63);
const ADAPTIVE_POLICY_KEY = 'global';
const ADAPTIVE_MIN_RECALC_MS = Number(process.env.STAGE_ADAPTIVE_MIN_RECALC_MS || 1000 * 60 * 2);
const ADAPTIVE_WINDOW = Number(process.env.STAGE_ADAPTIVE_WINDOW || 280);

let adaptivePolicyCache: StageAdaptivePolicy | null = null;
let adaptivePolicyLastCalc = 0;

function todayKey(phone: string): string {
    const day = new Date().toISOString().slice(0, 10);
    return `${phone}:${day}`;
}

function comboKey(roomType: string, style: string): string {
    return `${roomType}:${style}`;
}

function hashParts(parts: string[]): string {
    const h = crypto.createHash('sha256');
    for (const p of parts) h.update(p).update('\n');
    return h.digest('hex');
}

export async function buildStageRequestKey(
    image: File,
    roomType: string,
    style: string,
    promptVersion: PromptVersion
): Promise<string> {
    const bytes = Buffer.from(await image.arrayBuffer());
    const imageHash = crypto.createHash('sha256').update(bytes).digest('hex');
    return hashParts([imageHash, roomType, style, promptVersion, 'stage-v3']);
}

export function withStageIdempotency<T>(requestKey: string, fn: () => Promise<T>): Promise<T> {
    const pending = inflightByKey.get(requestKey);
    if (pending) return pending as Promise<T>;
    const run = fn();
    inflightByKey.set(requestKey, run as Promise<unknown>);
    return run.finally(() => inflightByKey.delete(requestKey));
}

export function consumeRetryBudget(phoneRaw: string): { allowed: boolean; used: number; limit: number } {
    const phone = normalizePhone(phoneRaw);
    const key = todayKey(phone);
    const used = retryBudgetByDay.get(key) || 0;
    if (used >= DAILY_RETRY_LIMIT) return { allowed: false, used, limit: DAILY_RETRY_LIMIT };
    retryBudgetByDay.set(key, used + 1);
    return { allowed: true, used: used + 1, limit: DAILY_RETRY_LIMIT };
}

function parseStaticHardBlock(): Set<string> {
    const value = String(process.env.STAGE_HARD_BLOCK_LIST || '').trim();
    if (!value) return new Set();
    return new Set(value.split(',').map((s) => s.trim()).filter(Boolean));
}

const staticHardBlock = parseStaticHardBlock();

export function isHardBlocked(roomType: string, style: string): { blocked: boolean; reason?: string } {
    const key = comboKey(roomType, style);
    if (staticHardBlock.has(key)) {
        return { blocked: true, reason: 'Bu oda/stil kombinasyonu gecici olarak devre disi.' };
    }
    const record = hardBlockFailures.get(key);
    if (!record) return { blocked: false };
    if (record.blockedUntil > Date.now()) {
        return { blocked: true, reason: 'Bu kombinasyon kalite nedeniyle gecici olarak durduruldu.' };
    }
    return { blocked: false };
}

export function noteHardBlockFailure(roomType: string, style: string): void {
    const key = comboKey(roomType, style);
    const now = Date.now();
    const prev = hardBlockFailures.get(key);
    if (!prev || prev.blockedUntil + HARD_BLOCK_WINDOW_MS < now) {
        hardBlockFailures.set(key, { count: 1, blockedUntil: 0 });
        return;
    }
    const nextCount = prev.count + 1;
    const blockedUntil = nextCount >= HARD_BLOCK_FAIL_THRESHOLD ? now + HARD_BLOCK_DURATION_MS : 0;
    hardBlockFailures.set(key, { count: nextCount, blockedUntil });
}

export function choosePromptVersion(): PromptVersion {
    const totalAttempts = promptStats.A.attempts + promptStats.B.attempts;
    if (totalAttempts < 20) {
        return totalAttempts % 2 === 0 ? 'A' : 'B';
    }
    const aRate = promptStats.A.success / Math.max(promptStats.A.attempts, 1);
    const bRate = promptStats.B.success / Math.max(promptStats.B.attempts, 1);
    if (Math.abs(aRate - bRate) < 0.03) return totalAttempts % 2 === 0 ? 'A' : 'B';
    return aRate >= bRate ? 'A' : 'B';
}

export function notePromptAttempt(version: PromptVersion, ok: boolean): void {
    promptStats[version].attempts += 1;
    if (ok) promptStats[version].success += 1;
}

export function getPromptStats(): Record<PromptVersion, PromptStats> {
    return promptStats;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function defaultAdaptivePolicy(): StageAdaptivePolicy {
    return {
        firstLockStrength: 0.8,
        retryLockArchitecture: 0.86,
        retryLockQuality: 0.68,
        architectureThreshold: Number(process.env.ARCH_GUARD_THRESHOLD || 0.58),
        styleIntensityCap: 'high',
        cleanupBoost: false,
        antiGhostBoost: false,
        updatedAt: Date.now(),
    };
}

function normalizeAdaptivePolicy(input: Partial<StageAdaptivePolicy> | null | undefined): StageAdaptivePolicy {
    const base = defaultAdaptivePolicy();
    if (!input) return base;
    return {
        firstLockStrength: clamp(Number(input.firstLockStrength ?? base.firstLockStrength), 0.62, 0.9),
        retryLockArchitecture: clamp(
            Number(input.retryLockArchitecture ?? base.retryLockArchitecture),
            0.68,
            0.92
        ),
        retryLockQuality: clamp(Number(input.retryLockQuality ?? base.retryLockQuality), 0.55, 0.82),
        architectureThreshold: clamp(
            Number(input.architectureThreshold ?? base.architectureThreshold),
            0.54,
            0.72
        ),
        styleIntensityCap: input.styleIntensityCap === 'medium' ? 'medium' : 'high',
        cleanupBoost: Boolean(input.cleanupBoost),
        antiGhostBoost: Boolean(input.antiGhostBoost),
        updatedAt: Number(input.updatedAt || Date.now()),
    };
}

function ensureStageUser(phoneRaw: string): string {
    const phone = normalizePhone(phoneRaw);
    ensureUser(phone);
    return phone;
}

export function readCachedStageResponse(requestKey: string): CachedStageResponse | null {
    const db = getDb();
    const row = db
        .prepare(`SELECT response_json, expires_at FROM stage_result_cache WHERE request_key = ?`)
        .get(requestKey) as { response_json: string; expires_at: number } | undefined;
    if (!row) return null;
    if (Date.now() > Number(row.expires_at || 0)) {
        db.prepare(`DELETE FROM stage_result_cache WHERE request_key = ?`).run(requestKey);
        return null;
    }
    try {
        return JSON.parse(row.response_json) as CachedStageResponse;
    } catch {
        db.prepare(`DELETE FROM stage_result_cache WHERE request_key = ?`).run(requestKey);
        return null;
    }
}

export function writeCachedStageResponse(requestKey: string, response: CachedStageResponse): void {
    const db = getDb();
    const now = Date.now();
    db.prepare(
        `INSERT INTO stage_result_cache (request_key, response_json, created_at, expires_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(request_key) DO UPDATE SET
           response_json = excluded.response_json,
           created_at = excluded.created_at,
           expires_at = excluded.expires_at`
    ).run(requestKey, JSON.stringify(response), now, now + CACHE_TTL_MS);
}

export function recordStageRun(input: {
    runId: string;
    phone: string;
    requestKey: string;
    roomType: string;
    style: string;
    promptVersion: PromptVersion;
    status: StageRunStatus;
    failCode?: string;
    architectureScore?: number;
    qualityScore?: number;
    usedCredits?: number;
    beforeImageUrl?: string;
    afterImageUrl?: string;
}): void {
    const db = getDb();
    const phone = ensureStageUser(input.phone);
    db.prepare(
        `INSERT INTO stage_runs (
            run_id, phone, request_key, room_type, style, prompt_version, status, fail_code,
            architecture_score, quality_score, used_credits, refunded, created_at
            , before_image_url, after_image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        ON CONFLICT(run_id) DO UPDATE SET
            status = excluded.status,
            fail_code = excluded.fail_code,
            architecture_score = excluded.architecture_score,
            quality_score = excluded.quality_score,
            used_credits = excluded.used_credits,
            before_image_url = COALESCE(excluded.before_image_url, stage_runs.before_image_url),
            after_image_url = COALESCE(excluded.after_image_url, stage_runs.after_image_url)`
    ).run(
        input.runId,
        phone,
        input.requestKey,
        input.roomType,
        input.style,
        input.promptVersion,
        input.status,
        input.failCode || null,
        input.architectureScore ?? null,
        input.qualityScore ?? null,
        input.usedCredits || 0,
        Date.now()
        ,
        input.beforeImageUrl || null,
        input.afterImageUrl || null
    );
    maybeRecalculateAdaptivePolicy();
}

export function markStageRunRefunded(runId: string): void {
    const db = getDb();
    db.prepare(`UPDATE stage_runs SET refunded = 1 WHERE run_id = ?`).run(runId);
}

export function getStageRunForFeedback(runId: string, phoneRaw: string): {
    usedCredits: number;
    refunded: number;
    architectureScore: number | null;
    qualityScore: number | null;
    status: string;
} | null {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const row = db
        .prepare(
            `SELECT used_credits, refunded, architecture_score, quality_score, status
             FROM stage_runs WHERE run_id = ? AND phone = ?`
        )
        .get(runId, phone) as
        | {
              used_credits: number;
              refunded: number;
              architecture_score: number | null;
              quality_score: number | null;
              status: string;
          }
        | undefined;
    if (!row) return null;
    return {
        usedCredits: Number(row.used_credits || 0),
        refunded: Number(row.refunded || 0),
        architectureScore: row.architecture_score,
        qualityScore: row.quality_score,
        status: row.status,
    };
}

export function recordStageFeedback(runId: string, phoneRaw: string, verdict: 'good' | 'bad', note?: string): void {
    const db = getDb();
    const phone = ensureStageUser(phoneRaw);
    db.prepare(
        `INSERT INTO stage_feedback (run_id, phone, verdict, note, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(runId, phone, verdict, note || null, Date.now());
    maybeRecalculateAdaptivePolicy();
}

export function canAutoRefundByFeedback(scores: {
    architectureScore: number | null;
    qualityScore: number | null;
}): boolean {
    if (scores.architectureScore !== null && scores.architectureScore <= FEEDBACK_REFUND_ARCH_MAX) return true;
    if (scores.qualityScore !== null && scores.qualityScore <= FEEDBACK_REFUND_QUALITY_MAX) return true;
    return false;
}

export function getStageOpsSummary() {
    const db = getDb();
    const total = (db.prepare(`SELECT COUNT(*) as c FROM stage_runs`).get() as { c: number }).c || 0;
    const success = (db.prepare(`SELECT COUNT(*) as c FROM stage_runs WHERE status='success'`).get() as { c: number }).c || 0;
    const failed = (db.prepare(`SELECT COUNT(*) as c FROM stage_runs WHERE status='failed'`).get() as { c: number }).c || 0;
    const blocked = (db.prepare(`SELECT COUNT(*) as c FROM stage_runs WHERE status='blocked'`).get() as { c: number }).c || 0;
    const refunds = (db.prepare(`SELECT COUNT(*) as c FROM stage_runs WHERE refunded=1`).get() as { c: number }).c || 0;
    const failRows = db
        .prepare(`SELECT fail_code, COUNT(*) as c FROM stage_runs WHERE fail_code IS NOT NULL GROUP BY fail_code`)
        .all() as Array<{ fail_code: string; c: number }>;
    const failCodes = Object.fromEntries(failRows.map((r) => [r.fail_code, r.c]));
    return {
        total,
        success,
        failed,
        blocked,
        refunds,
        failCodes,
        promptStats,
        adaptivePolicy: getStageAdaptivePolicy(),
    };
}

export function getStageHistory(phoneRaw: string, limit = 60): Array<{
    runId: string;
    roomType: string;
    style: string;
    createdAt: number;
    beforeImageUrl: string | null;
    afterImageUrl: string | null;
    architectureScore: number | null;
    qualityScore: number | null;
}> {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const rows = db
        .prepare(
            `SELECT run_id, room_type, style, created_at, before_image_url, after_image_url, architecture_score, quality_score
             FROM stage_runs
             WHERE phone = ? AND status='success'
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(phone, Math.max(1, Math.min(200, limit))) as Array<{
        run_id: string;
        room_type: string;
        style: string;
        created_at: number;
        before_image_url: string | null;
        after_image_url: string | null;
        architecture_score: number | null;
        quality_score: number | null;
    }>;
    return rows.map((r) => ({
        runId: r.run_id,
        roomType: r.room_type,
        style: r.style,
        createdAt: Number(r.created_at || 0),
        beforeImageUrl: r.before_image_url || null,
        afterImageUrl: r.after_image_url || null,
        architectureScore: r.architecture_score,
        qualityScore: r.quality_score,
    }));
}

export function deleteStageRuns(phoneRaw: string, runIds: string[]): { requested: number; deleted: number } {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const uniqueRunIds = Array.from(
        new Set(
            runIds
                .map((id) => String(id || '').trim())
                .filter(Boolean)
        )
    );
    if (!phone || uniqueRunIds.length === 0) {
        return { requested: uniqueRunIds.length, deleted: 0 };
    }
    const stmt = db.prepare(`DELETE FROM stage_runs WHERE phone = ? AND run_id = ?`);
    const tx = db.transaction((ids: string[]) => {
        let deleted = 0;
        for (const runId of ids) {
            const result = stmt.run(phone, runId);
            deleted += Number(result.changes || 0);
        }
        return deleted;
    });
    const deleted = tx(uniqueRunIds);
    return { requested: uniqueRunIds.length, deleted };
}

export function getStageAdaptivePolicy(forceRecalc = false): StageAdaptivePolicy {
    const now = Date.now();
    if (!forceRecalc && adaptivePolicyCache && now - adaptivePolicyLastCalc < ADAPTIVE_MIN_RECALC_MS) {
        return adaptivePolicyCache;
    }
    const db = getDb();
    const row = db
        .prepare(`SELECT policy_json FROM stage_adaptive_policy WHERE policy_key = ?`)
        .get(ADAPTIVE_POLICY_KEY) as { policy_json: string } | undefined;
    if (!row) {
        const policy = defaultAdaptivePolicy();
        db.prepare(
            `INSERT INTO stage_adaptive_policy (policy_key, policy_json, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(policy_key) DO UPDATE SET policy_json = excluded.policy_json, updated_at = excluded.updated_at`
        ).run(ADAPTIVE_POLICY_KEY, JSON.stringify(policy), Date.now());
        adaptivePolicyCache = policy;
        adaptivePolicyLastCalc = now;
        return policy;
    }
    try {
        const parsed = JSON.parse(row.policy_json) as Partial<StageAdaptivePolicy>;
        const policy = normalizeAdaptivePolicy(parsed);
        adaptivePolicyCache = policy;
        adaptivePolicyLastCalc = now;
        return policy;
    } catch {
        const policy = defaultAdaptivePolicy();
        adaptivePolicyCache = policy;
        adaptivePolicyLastCalc = now;
        return policy;
    }
}

function deriveAdaptivePolicy(): StageAdaptivePolicy {
    const db = getDb();
    const rows = db
        .prepare(
            `SELECT status, fail_code, architecture_score, quality_score
             FROM stage_runs
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(Math.max(50, ADAPTIVE_WINDOW)) as Array<{
        status: string;
        fail_code: string | null;
        architecture_score: number | null;
        quality_score: number | null;
    }>;
    const feedbackRows = db
        .prepare(
            `SELECT verdict, COALESCE(note, '') as note
             FROM stage_feedback
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(Math.max(50, ADAPTIVE_WINDOW)) as Array<{ verdict: string; note: string }>;

    if (rows.length === 0) return getStageAdaptivePolicy();

    const total = rows.length;
    const archFails = rows.filter((r) => r.fail_code === 'ARCHITECTURE_CHANGED').length;
    const qualityFails = rows.filter((r) => r.fail_code === 'OUTPUT_QUALITY_LOW').length;
    const archRate = archFails / total;
    const qualityRate = qualityFails / total;

    const badFeedback = feedbackRows.filter((r) => r.verdict === 'bad').length;
    const badFeedbackRate = feedbackRows.length > 0 ? badFeedback / feedbackRows.length : 0;
    const ghostSignals = feedbackRows.filter((r) =>
        /ghost|hayalet|seffaf|şeffaf|double|transparen|iz|arti(k|fakt)|overlay/i.test(r.note || '')
    ).length;
    const clutterSignals = feedbackRows.filter((r) =>
        /kir|leke|toz|daginik|dağınık|kalinti|kalıntı|cöp|çöp|tool|alet/i.test(r.note || '')
    ).length;

    const firstLockStrength = clamp(0.78 + archRate * 0.2 - qualityRate * 0.07, 0.62, 0.9);
    const retryLockArchitecture = clamp(firstLockStrength + 0.06 + archRate * 0.04, 0.68, 0.92);
    const retryLockQuality = clamp(firstLockStrength - 0.12 - qualityRate * 0.04, 0.55, 0.82);
    const architectureThreshold = clamp(
        Number(process.env.ARCH_GUARD_THRESHOLD || 0.58) + archRate * 0.08 - qualityRate * 0.02,
        0.54,
        0.72
    );
    const styleIntensityCap: 'medium' | 'high' = badFeedbackRate >= 0.42 ? 'medium' : 'high';
    const antiGhostBoost = ghostSignals >= 2 || qualityRate >= 0.32;
    const cleanupBoost = clutterSignals >= 2 || badFeedbackRate >= 0.45;

    return {
        firstLockStrength,
        retryLockArchitecture,
        retryLockQuality,
        architectureThreshold,
        styleIntensityCap,
        antiGhostBoost,
        cleanupBoost,
        updatedAt: Date.now(),
    };
}

export function recalculateStageAdaptivePolicy(): StageAdaptivePolicy {
    const db = getDb();
    const policy = normalizeAdaptivePolicy(deriveAdaptivePolicy());
    db.prepare(
        `INSERT INTO stage_adaptive_policy (policy_key, policy_json, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(policy_key) DO UPDATE SET policy_json = excluded.policy_json, updated_at = excluded.updated_at`
    ).run(ADAPTIVE_POLICY_KEY, JSON.stringify(policy), Date.now());
    adaptivePolicyCache = policy;
    adaptivePolicyLastCalc = Date.now();
    return policy;
}

function maybeRecalculateAdaptivePolicy(): void {
    const now = Date.now();
    if (now - adaptivePolicyLastCalc < ADAPTIVE_MIN_RECALC_MS) return;
    recalculateStageAdaptivePolicy();
}
