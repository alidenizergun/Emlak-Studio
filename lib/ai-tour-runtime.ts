import { randomUUID } from 'crypto';
import { ensureUser, getDb, normalizePhone } from '@/lib/db';

type AiTourFailureReason = 'too_short' | 'too_long' | 'generic' | 'provider' | 'other';

export interface AiTourAdaptivePolicy {
    targetLength: number;
    minLength: number;
    maxLength: number;
    detailBoost: boolean;
    ctaBoost: boolean;
    antiGenericBoost: boolean;
    retryEnabled: boolean;
    successEma: number;
    genericEma: number;
    lengthEma: number;
    updatedAt: number;
}

export interface AiTourDraft {
    runId: string;
    script: string;
    qualityScore: number;
    issues: string[];
    policy: AiTourAdaptivePolicy;
}

interface ScriptEvaluation {
    ok: boolean;
    score: number;
    reason?: AiTourFailureReason;
    issues: string[];
}

const POLICY_KEY = 'global';
const EMA_ALPHA = Number(process.env.AI_TOUR_ADAPTIVE_EMA_ALPHA || 0.18);

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function defaultPolicy(): AiTourAdaptivePolicy {
    return {
        targetLength: 125,
        minLength: 70,
        maxLength: 150,
        detailBoost: false,
        ctaBoost: true,
        antiGenericBoost: false,
        retryEnabled: true,
        successEma: 0.8,
        genericEma: 0.05,
        lengthEma: 0.05,
        updatedAt: Date.now(),
    };
}

function normalizePolicy(input: Partial<AiTourAdaptivePolicy> | null | undefined): AiTourAdaptivePolicy {
    const base = defaultPolicy();
    if (!input) return base;
    return {
        targetLength: clamp(Number(input.targetLength ?? base.targetLength), 90, 145),
        minLength: clamp(Number(input.minLength ?? base.minLength), 45, 120),
        maxLength: clamp(Number(input.maxLength ?? base.maxLength), 110, 160),
        detailBoost: Boolean(input.detailBoost),
        ctaBoost: Boolean(input.ctaBoost ?? true),
        antiGenericBoost: Boolean(input.antiGenericBoost),
        retryEnabled: Boolean(input.retryEnabled ?? true),
        successEma: clamp(Number(input.successEma ?? base.successEma), 0, 1),
        genericEma: clamp(Number(input.genericEma ?? base.genericEma), 0, 1),
        lengthEma: clamp(Number(input.lengthEma ?? base.lengthEma), 0, 1),
        updatedAt: Number(input.updatedAt || Date.now()),
    };
}

function persistPolicy(policy: AiTourAdaptivePolicy): void {
    const db = getDb();
    db.prepare(
        `INSERT INTO ai_tour_adaptive_policy (policy_key, policy_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(policy_key) DO UPDATE SET
           policy_json = excluded.policy_json,
           updated_at = excluded.updated_at`
    ).run(POLICY_KEY, JSON.stringify(policy), Date.now());
}

export function getAiTourAdaptivePolicy(): AiTourAdaptivePolicy {
    const db = getDb();
    const row = db
        .prepare(`SELECT policy_json FROM ai_tour_adaptive_policy WHERE policy_key = ?`)
        .get(POLICY_KEY) as { policy_json: string } | undefined;
    if (!row) {
        const policy = defaultPolicy();
        persistPolicy(policy);
        return policy;
    }
    try {
        return normalizePolicy(JSON.parse(row.policy_json) as Partial<AiTourAdaptivePolicy>);
    } catch {
        const policy = defaultPolicy();
        persistPolicy(policy);
        return policy;
    }
}

function normalizeSentence(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function ensureEnding(text: string): string {
    if (!text) return text;
    if (/[.!?…]$/.test(text)) return text;
    return `${text}.`;
}

function wordCount(text: string): number {
    return normalizeSentence(text).split(' ').filter(Boolean).length;
}

function isGenericText(text: string): boolean {
    const t = text.toLowerCase();
    const domainHits = [
        'salon',
        'mutfak',
        'balkon',
        'oda',
        'cephe',
        'ulaşım',
        'lokasyon',
        'depolama',
        'gün ışığı',
        'ferah',
        'yatırım',
        'banyo',
        'giyinme',
        'plan',
    ].filter((kw) => t.includes(kw)).length;
    const wc = wordCount(t);
    return domainHits < 2 || wc < 14;
}

function trimToWordLimit(text: string, maxWords: number): string {
    const words = normalizeSentence(text).split(' ').filter(Boolean);
    if (words.length <= maxWords) return ensureEnding(words.join(' '));
    return ensureEnding(words.slice(0, maxWords).join(' '));
}

function buildBaseScript(inputScript: string, policy: AiTourAdaptivePolicy, retryMode: boolean): string {
    const cleaned = normalizeSentence(inputScript);
    const fallback =
        'Bu mülkte ferah yaşam alanı, dengeli doğal ışık ve işlevsel plan öne çıkıyor. Salon, günlük kullanıma uygun akış sunarken mutfak ve ıslak hacimler pratik kullanım sağlıyor.';
    let out = cleaned || fallback;
    const outWordCount = wordCount(out);

    if (outWordCount < Math.floor(policy.minLength * 0.55)) {
        out = `${out} Oda geçişleri dengeli, depolama potansiyeli güçlü ve yaşam konforunu artıran bir düzen mevcut.`;
    }
    if (policy.detailBoost || retryMode) {
        out = `${out} Pencere yönlenmesi sayesinde gün ışığı dağılımı dengeli; mobilya yerleşimi için esnek alanlar bulunuyor.`;
    }
    if (policy.antiGenericBoost || retryMode) {
        out = `${out} Ulaşım, günlük ihtiyaç noktalarına erişim ve kiralama potansiyeli açısından da değerlendirmeye uygun bir seçenek sunuyor.`;
    }
    if (policy.ctaBoost) {
        out = `${out} Detaylı bilgi ve yerinde inceleme için bizimle iletişime geçebilirsiniz.`;
    }

    return trimToWordLimit(ensureEnding(out), policy.maxLength);
}

function evaluateScript(script: string, policy: AiTourAdaptivePolicy): ScriptEvaluation {
    const wc = wordCount(script);
    const issues: string[] = [];
    let score = 1;
    let reason: AiTourFailureReason | undefined;

    if (wc < policy.minLength) {
        issues.push('Metin kısa kaldı');
        score -= 0.35;
        reason = 'too_short';
    }
    if (wc > policy.maxLength) {
        issues.push('Metin fazla uzun');
        score -= 0.25;
        reason = reason || 'too_long';
    }
    if (isGenericText(script)) {
        issues.push('Metin fazla genel');
        score -= 0.3;
        reason = reason || 'generic';
    }

    return {
        ok: score >= 0.62,
        score: clamp(score, 0, 1),
        reason,
        issues,
    };
}

export function generateAdaptiveAiTourScript(inputScript: string): {
    runId: string;
    script: string;
    qualityScore: number;
    issues: string[];
    policy: AiTourAdaptivePolicy;
} {
    const policy = getAiTourAdaptivePolicy();
    const firstScript = buildBaseScript(inputScript, policy, false);
    const firstEval = evaluateScript(firstScript, policy);
    const accepted = firstEval.ok || !policy.retryEnabled
        ? { script: firstScript, eval: firstEval }
        : (() => {
              const retryScript = buildBaseScript(firstScript, { ...policy, detailBoost: true, antiGenericBoost: true }, true);
              const retryEval = evaluateScript(retryScript, policy);
              return retryEval.score >= firstEval.score
                  ? { script: retryScript, eval: retryEval }
                  : { script: firstScript, eval: firstEval };
          })();

    const runId = randomUUID();
    recordAiTourRun({
        runId,
        status: 'success',
        scriptInput: inputScript,
        scriptOutput: accepted.script,
        qualityScore: accepted.eval.score,
        failCode: accepted.eval.ok ? undefined : accepted.eval.reason || 'other',
    });
    recordAiTourAdaptiveOutcome(accepted.eval.ok, accepted.eval.reason);
    return {
        runId,
        script: accepted.script,
        qualityScore: accepted.eval.score,
        issues: accepted.eval.issues,
        policy,
    };
}

function recordAiTourRun(input: {
    runId: string;
    status: 'success' | 'failed';
    scriptInput: string;
    scriptOutput: string;
    qualityScore?: number;
    failCode?: string;
    phone?: string;
    usedCredits?: number;
    provider?: string;
    videoUrl?: string | null;
    durationSeconds?: number | null;
}): void {
    const db = getDb();
    const phone = normalizePhone(input.phone || '');
    if (!phone) return;
    ensureUser(phone);
    db.prepare(
        `INSERT INTO ai_tour_runs (run_id, phone, status, fail_code, quality_score, script_input, script_output, provider, video_url, duration_seconds, used_credits, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(run_id) DO UPDATE SET
           status = excluded.status,
           fail_code = excluded.fail_code,
           quality_score = excluded.quality_score,
           script_input = excluded.script_input,
           script_output = excluded.script_output,
           provider = excluded.provider,
           video_url = excluded.video_url,
           duration_seconds = excluded.duration_seconds,
           used_credits = excluded.used_credits`
    ).run(
        input.runId,
        phone,
        input.status,
        input.failCode || null,
        input.qualityScore ?? null,
        normalizeSentence(input.scriptInput),
        normalizeSentence(input.scriptOutput),
        input.provider || null,
        input.videoUrl || null,
        Number(input.durationSeconds ?? 0) || null,
        input.usedCredits || 0,
        Date.now()
    );
}

export function createAiTourDraft(inputScript: string): AiTourDraft {
    const policy = getAiTourAdaptivePolicy();
    const firstScript = buildBaseScript(inputScript, policy, false);
    const firstEval = evaluateScript(firstScript, policy);
    const accepted = firstEval.ok || !policy.retryEnabled
        ? { script: firstScript, eval: firstEval }
        : (() => {
              const retryScript = buildBaseScript(firstScript, { ...policy, detailBoost: true, antiGenericBoost: true }, true);
              const retryEval = evaluateScript(retryScript, policy);
              return retryEval.score >= firstEval.score
                  ? { script: retryScript, eval: retryEval }
                  : { script: firstScript, eval: firstEval };
          })();

    return {
        runId: randomUUID(),
        script: accepted.script,
        qualityScore: accepted.eval.score,
        issues: accepted.eval.issues,
        policy,
    };
}

export function finalizeAiTourSuccess(input: {
    runId: string;
    phone: string;
    scriptInput: string;
    scriptOutput: string;
    qualityScore: number;
    usedCredits: number;
    provider: string;
    videoUrl: string;
    durationSeconds: number;
}): void {
    const phone = normalizePhone(input.phone);
    if (!phone) return;

    recordAiTourRun({
        runId: input.runId,
        status: 'success',
        scriptInput: input.scriptInput,
        scriptOutput: input.scriptOutput,
        qualityScore: input.qualityScore,
        failCode: undefined,
        phone,
        usedCredits: input.usedCredits,
        provider: input.provider,
        videoUrl: input.videoUrl,
        durationSeconds: input.durationSeconds,
    });
    recordAiTourAdaptiveOutcome(true);
}

export function finalizeAiTourFailure(input: {
    runId: string;
    phone: string;
    scriptInput: string;
    scriptOutput: string;
    reason: AiTourFailureReason;
    qualityScore?: number;
}): void {
    const phone = normalizePhone(input.phone);
    if (!phone) return;
    recordAiTourRun({
        runId: input.runId,
        status: 'failed',
        failCode: input.reason,
        scriptInput: input.scriptInput,
        scriptOutput: input.scriptOutput,
        qualityScore: input.qualityScore ?? 0,
        phone,
        usedCredits: 0,
    });
    recordAiTourAdaptiveOutcome(false, input.reason);
}

function recordAiTourAdaptiveOutcome(ok: boolean, reason?: AiTourFailureReason): AiTourAdaptivePolicy {
    const prev = getAiTourAdaptivePolicy();
    const alpha = clamp(EMA_ALPHA, 0.08, 0.34);
    const successSignal = ok ? 1 : 0;
    const genericSignal = !ok && reason === 'generic' ? 1 : 0;
    const lengthSignal = !ok && (reason === 'too_short' || reason === 'too_long') ? 1 : 0;

    const successEma = prev.successEma * (1 - alpha) + successSignal * alpha;
    const genericEma = prev.genericEma * (1 - alpha) + genericSignal * alpha;
    const lengthEma = prev.lengthEma * (1 - alpha) + lengthSignal * alpha;

    const next = normalizePolicy({
        targetLength: clamp(120 + Math.round(genericEma * 18), 95, 145),
        minLength: clamp(65 + Math.round(genericEma * 14), 50, 120),
        maxLength: clamp(145 - Math.round(lengthEma * 10), 110, 160),
        detailBoost: genericEma >= 0.16 || successEma < 0.72,
        ctaBoost: true,
        antiGenericBoost: genericEma >= 0.14 || successEma < 0.76,
        retryEnabled: lengthEma >= 0.1 || genericEma >= 0.1 || successEma < 0.85,
        successEma,
        genericEma,
        lengthEma,
        updatedAt: Date.now(),
    });
    persistPolicy(next);
    return next;
}

export function recordAiTourFailure(phoneRaw: string, inputScript: string, reason: AiTourFailureReason): void {
    const runId = randomUUID();
    const phone = normalizePhone(phoneRaw);
    recordAiTourRun({
        runId,
        phone,
        status: 'failed',
        failCode: reason,
        scriptInput: inputScript,
        scriptOutput: inputScript,
        qualityScore: 0,
        usedCredits: 0,
    });
    recordAiTourAdaptiveOutcome(false, reason);
}

export function getAiTourRunForFeedback(runId: string, phoneRaw: string): { status: string; qualityScore: number | null } | null {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const row = db
        .prepare(`SELECT status, quality_score FROM ai_tour_runs WHERE run_id = ? AND phone = ?`)
        .get(runId, phone) as { status: string; quality_score: number | null } | undefined;
    if (!row) return null;
    return {
        status: row.status,
        qualityScore: row.quality_score ?? null,
    };
}

export function recordAiTourFeedback(runId: string, phoneRaw: string, verdict: 'good' | 'bad', note: string): void {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    if (!phone) return;
    ensureUser(phone);
    const normalizedNote = normalizeSentence(note).slice(0, 400);
    db.prepare(
        `INSERT INTO ai_tour_feedback (run_id, phone, verdict, note, created_at) VALUES (?, ?, ?, ?, ?)`
    ).run(runId, phone, verdict, normalizedNote || null, Date.now());

    if (verdict === 'good') {
        recordAiTourAdaptiveOutcome(true);
        return;
    }
    if (/kisa|kısa|az/i.test(normalizedNote)) {
        recordAiTourAdaptiveOutcome(false, 'too_short');
        return;
    }
    if (/uzun|detay fazla/i.test(normalizedNote)) {
        recordAiTourAdaptiveOutcome(false, 'too_long');
        return;
    }
    if (/genel|zayif|yetersiz|sıradan|siradan|tekrar/i.test(normalizedNote)) {
        recordAiTourAdaptiveOutcome(false, 'generic');
        return;
    }
    recordAiTourAdaptiveOutcome(false, 'other');
}
