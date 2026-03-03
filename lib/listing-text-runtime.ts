import { randomUUID } from 'crypto';
import { ensureUser, getDb, normalizePhone } from '@/lib/db';

interface ListingInfoShape {
    lokasyon?: string;
    metrekare?: string;
    odaSayisi?: string;
    banyoSayisi?: string;
    kat?: string;
    binaYasi?: string;
    isitma?: string;
    kullanim?: string;
    fiyat?: string;
    ekNotlar?: string;
}

type ListingFailReason = 'format' | 'coverage' | 'generic' | 'provider' | 'other';

export interface ListingAdaptivePolicy {
    minChars: number;
    maxChars: number;
    strictFormat: boolean;
    coverageBoost: boolean;
    antiGenericBoost: boolean;
    retryEnabled: boolean;
    temperature: number;
    maxOutputTokens: number;
    successEma: number;
    formatFailEma: number;
    coverageFailEma: number;
    genericFailEma: number;
    updatedAt: number;
}

interface ListingQualityResult {
    ok: boolean;
    score: number;
    issues: string[];
    reason?: ListingFailReason;
}

const POLICY_KEY = 'global';
const EMA_ALPHA = Number(process.env.LISTING_ADAPTIVE_EMA_ALPHA || 0.17);

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function defaultPolicy(): ListingAdaptivePolicy {
    return {
        minChars: 430,
        maxChars: 1700,
        strictFormat: true,
        coverageBoost: false,
        antiGenericBoost: false,
        retryEnabled: true,
        temperature: 0.62,
        maxOutputTokens: 980,
        successEma: 0.8,
        formatFailEma: 0.05,
        coverageFailEma: 0.05,
        genericFailEma: 0.05,
        updatedAt: Date.now(),
    };
}

function normalizePolicy(input: Partial<ListingAdaptivePolicy> | null | undefined): ListingAdaptivePolicy {
    const base = defaultPolicy();
    if (!input) return base;
    return {
        minChars: clamp(Number(input.minChars ?? base.minChars), 300, 900),
        maxChars: clamp(Number(input.maxChars ?? base.maxChars), 900, 2400),
        strictFormat: Boolean(input.strictFormat ?? true),
        coverageBoost: Boolean(input.coverageBoost),
        antiGenericBoost: Boolean(input.antiGenericBoost),
        retryEnabled: Boolean(input.retryEnabled ?? true),
        temperature: clamp(Number(input.temperature ?? base.temperature), 0.35, 0.78),
        maxOutputTokens: clamp(Number(input.maxOutputTokens ?? base.maxOutputTokens), 700, 1400),
        successEma: clamp(Number(input.successEma ?? base.successEma), 0, 1),
        formatFailEma: clamp(Number(input.formatFailEma ?? base.formatFailEma), 0, 1),
        coverageFailEma: clamp(Number(input.coverageFailEma ?? base.coverageFailEma), 0, 1),
        genericFailEma: clamp(Number(input.genericFailEma ?? base.genericFailEma), 0, 1),
        updatedAt: Number(input.updatedAt || Date.now()),
    };
}

function persistPolicy(policy: ListingAdaptivePolicy): void {
    const db = getDb();
    db.prepare(
        `INSERT INTO listing_text_adaptive_policy (policy_key, policy_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(policy_key) DO UPDATE SET
            policy_json = excluded.policy_json,
            updated_at = excluded.updated_at`
    ).run(POLICY_KEY, JSON.stringify(policy), Date.now());
}

export function getListingAdaptivePolicy(): ListingAdaptivePolicy {
    const db = getDb();
    const row = db
        .prepare(`SELECT policy_json FROM listing_text_adaptive_policy WHERE policy_key = ?`)
        .get(POLICY_KEY) as { policy_json: string } | undefined;
    if (!row) {
        const policy = defaultPolicy();
        persistPolicy(policy);
        return policy;
    }
    try {
        return normalizePolicy(JSON.parse(row.policy_json) as Partial<ListingAdaptivePolicy>);
    } catch {
        const policy = defaultPolicy();
        persistPolicy(policy);
        return policy;
    }
}

function hasSection(text: string, token: string): boolean {
    return text.toLowerCase().includes(token.toLowerCase());
}

function bulletCount(text: string): number {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^[-*•]\s+/.test(line)).length;
}

function normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function evaluateCoverage(text: string, info: ListingInfoShape): number {
    const t = text.toLowerCase();
    const required: string[] = [];
    if (info.lokasyon) required.push(String(info.lokasyon).toLowerCase());
    if (info.metrekare) required.push(String(info.metrekare).toLowerCase());
    if (info.fiyat) required.push(String(info.fiyat).toLowerCase());
    if (info.odaSayisi) required.push(String(info.odaSayisi).toLowerCase());
    if (required.length === 0) return 1;
    const hits = required.filter((kw) => t.includes(kw)).length;
    return hits / required.length;
}

function looksGeneric(text: string): boolean {
    const t = text.toLowerCase();
    const weakPatterns = [
        'yatırıma uygun',
        'kaçırılmayacak fırsat',
        'detaylı bilgi için arayın',
        'eşsiz',
        'benzersiz',
    ];
    const repeated = weakPatterns.filter((p) => t.includes(p)).length;
    return repeated >= 3 || normalizeText(text).length < 380;
}

export function evaluateListingTextQuality(text: string, info: ListingInfoShape, policy: ListingAdaptivePolicy): ListingQualityResult {
    const normalized = String(text || '').trim();
    const issues: string[] = [];
    let score = 1;
    let reason: ListingFailReason | undefined;

    if (!normalized) {
        return { ok: false, score: 0, issues: ['Metin boş'], reason: 'other' };
    }
    if (normalized.length < policy.minChars) {
        issues.push('Metin çok kısa');
        score -= 0.28;
        reason = reason || 'format';
    }
    if (normalized.length > policy.maxChars) {
        issues.push('Metin gereğinden uzun');
        score -= 0.16;
        reason = reason || 'format';
    }
    const bullets = bulletCount(normalized);
    if (policy.strictFormat) {
        if (!hasSection(normalized, 'Öne Çıkan Özellikler')) {
            issues.push('Öne Çıkan Özellikler başlığı eksik');
            score -= 0.23;
            reason = reason || 'format';
        }
        if (bullets < 4 || bullets > 10) {
            issues.push('Madde sayısı uygun değil');
            score -= 0.15;
            reason = reason || 'format';
        }
    }
    const coverage = evaluateCoverage(normalized, info);
    if (coverage < 0.66) {
        issues.push('Zorunlu alan kapsamı düşük');
        score -= 0.24;
        reason = reason || 'coverage';
    }
    if (looksGeneric(normalized)) {
        issues.push('Metin fazla genel');
        score -= 0.18;
        reason = reason || 'generic';
    }

    return {
        ok: score >= 0.62,
        score: clamp(score, 0, 1),
        issues,
        reason,
    };
}

function toFailCode(reason?: ListingFailReason): string | null {
    if (!reason) return null;
    if (reason === 'format') return 'QUALITY_FORMAT';
    if (reason === 'coverage') return 'QUALITY_COVERAGE';
    if (reason === 'generic') return 'QUALITY_GENERIC';
    if (reason === 'provider') return 'PROVIDER_ERROR';
    return 'QUALITY_OTHER';
}

export function recordListingRun(input: {
    runId: string;
    phone: string;
    status: 'success' | 'failed';
    provider: 'gemini' | 'fallback';
    info: ListingInfoShape;
    outputText: string;
    qualityScore?: number;
    reason?: ListingFailReason;
    usedCredits?: number;
}): void {
    const phone = normalizePhone(input.phone);
    if (!phone) return;
    ensureUser(phone);
    const db = getDb();
    db.prepare(
        `INSERT INTO listing_text_runs (run_id, phone, status, fail_code, quality_score, provider, input_json, output_text, used_credits, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(run_id) DO UPDATE SET
            status = excluded.status,
            fail_code = excluded.fail_code,
            quality_score = excluded.quality_score,
            provider = excluded.provider,
            input_json = excluded.input_json,
            output_text = excluded.output_text,
            used_credits = excluded.used_credits`
    ).run(
        input.runId,
        phone,
        input.status,
        toFailCode(input.reason),
        input.qualityScore ?? null,
        input.provider,
        JSON.stringify(input.info || {}),
        String(input.outputText || ''),
        Number(input.usedCredits || 0),
        Date.now()
    );
}

export function updateListingAdaptiveOutcome(ok: boolean, reason?: ListingFailReason): ListingAdaptivePolicy {
    const prev = getListingAdaptivePolicy();
    const alpha = clamp(EMA_ALPHA, 0.08, 0.35);
    const successSignal = ok ? 1 : 0;
    const formatSignal = !ok && reason === 'format' ? 1 : 0;
    const coverageSignal = !ok && reason === 'coverage' ? 1 : 0;
    const genericSignal = !ok && reason === 'generic' ? 1 : 0;

    const successEma = prev.successEma * (1 - alpha) + successSignal * alpha;
    const formatFailEma = prev.formatFailEma * (1 - alpha) + formatSignal * alpha;
    const coverageFailEma = prev.coverageFailEma * (1 - alpha) + coverageSignal * alpha;
    const genericFailEma = prev.genericFailEma * (1 - alpha) + genericSignal * alpha;

    const next = normalizePolicy({
        minChars: 410 + Math.round(coverageFailEma * 140),
        maxChars: 1700 - Math.round(formatFailEma * 220),
        strictFormat: formatFailEma >= 0.1 || successEma < 0.82,
        coverageBoost: coverageFailEma >= 0.1 || successEma < 0.8,
        antiGenericBoost: genericFailEma >= 0.1 || successEma < 0.78,
        retryEnabled: formatFailEma >= 0.08 || coverageFailEma >= 0.08 || genericFailEma >= 0.08 || successEma < 0.88,
        temperature: clamp(0.62 - formatFailEma * 0.12 - genericFailEma * 0.08, 0.38, 0.75),
        maxOutputTokens: clamp(980 + Math.round(coverageFailEma * 220), 760, 1350),
        successEma,
        formatFailEma,
        coverageFailEma,
        genericFailEma,
        updatedAt: Date.now(),
    });
    persistPolicy(next);
    return next;
}

export function createListingRunId(): string {
    return randomUUID();
}

export function buildAdaptiveListingPrompt(basePrompt: string, policy: ListingAdaptivePolicy, retry = false): string {
    const strict = policy.strictFormat
        ? '- Enforce format strictly: title + intro + "Öne Çıkan Özellikler" + closing.'
        : '';
    const coverage = policy.coverageBoost
        ? '- Explicitly include user-provided fields such as location, square meters, price, and room count throughout the text.'
        : '';
    const antiGeneric = policy.antiGenericBoost
        ? '- Avoid generic repetitive sales phrases; use concrete details consistent with the uploaded photo.'
        : '';
    const retryRule = retry
        ? '- Previous output was insufficient. Fix format issues, missing information coverage, and generic language.'
        : '';
    return `${basePrompt}

ADAPTIVE QUALITY RULES:
${strict}
${coverage}
${antiGeneric}
${retryRule}`.trim();
}

export function getListingRunForFeedback(runId: string, phoneRaw: string): { status: string } | null {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const row = db
        .prepare(`SELECT status FROM listing_text_runs WHERE run_id = ? AND phone = ?`)
        .get(runId, phone) as { status: string } | undefined;
    if (!row) return null;
    return { status: row.status };
}

export function recordListingFeedback(runId: string, phoneRaw: string, verdict: 'good' | 'bad', note: string): void {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    if (!phone) return;
    ensureUser(phone);
    const safeNote = String(note || '').replace(/\s+/g, ' ').trim().slice(0, 450);
    db.prepare(
        `INSERT INTO listing_text_feedback (run_id, phone, verdict, note, created_at)
         VALUES (?, ?, ?, ?, ?)`
    ).run(runId, phone, verdict, safeNote || null, Date.now());

    if (verdict === 'good') {
        updateListingAdaptiveOutcome(true);
        return;
    }
    if (/format|madde|başlık|başlik|sıra|sira/i.test(safeNote)) {
        updateListingAdaptiveOutcome(false, 'format');
        return;
    }
    if (/eksik|kapsam|metrekare|fiyat|lokasyon|oda|bilgi/i.test(safeNote)) {
        updateListingAdaptiveOutcome(false, 'coverage');
        return;
    }
    if (/genel|klişe|klise|tekrar|sıradan|siradan/i.test(safeNote)) {
        updateListingAdaptiveOutcome(false, 'generic');
        return;
    }
    updateListingAdaptiveOutcome(false, 'other');
}
