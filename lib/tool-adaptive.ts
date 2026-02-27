import { getDb } from '@/lib/db';

export type AdaptiveTool = 'enhance' | 'remove-object' | 'virtual-renovation';
export type AdaptiveFailureReason = 'architecture' | 'quality' | 'provider' | 'other';

export interface ToolAdaptivePolicy {
    architectureThreshold: number;
    retryEnabled: boolean;
    retryPromptBoost: boolean;
    postprocessBoost: boolean;
    successEma: number;
    archFailEma: number;
    qualityFailEma: number;
    updatedAt: number;
}

const POLICY_PREFIX = 'tool:';
const EMA_ALPHA = Number(process.env.TOOL_ADAPTIVE_EMA_ALPHA || 0.16);

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function keyFor(tool: AdaptiveTool): string {
    return `${POLICY_PREFIX}${tool}`;
}

function baseArchitectureThreshold(tool: AdaptiveTool): number {
    if (tool === 'enhance') return Number(process.env.ENHANCE_ARCH_GUARD_THRESHOLD || process.env.ARCH_GUARD_THRESHOLD || 0.58);
    if (tool === 'remove-object') return Number(process.env.REMOVE_ARCH_GUARD_THRESHOLD || process.env.ARCH_GUARD_THRESHOLD || 0.58);
    return Number(process.env.RENOVATION_ARCH_GUARD_THRESHOLD || process.env.ARCH_GUARD_THRESHOLD || 0.58);
}

function defaultPolicy(tool: AdaptiveTool): ToolAdaptivePolicy {
    return {
        architectureThreshold: clamp(baseArchitectureThreshold(tool), 0.54, 0.72),
        retryEnabled: true,
        retryPromptBoost: false,
        postprocessBoost: false,
        successEma: 0.8,
        archFailEma: 0.05,
        qualityFailEma: 0.05,
        updatedAt: Date.now(),
    };
}

function normalizePolicy(tool: AdaptiveTool, input: Partial<ToolAdaptivePolicy> | null | undefined): ToolAdaptivePolicy {
    const base = defaultPolicy(tool);
    if (!input) return base;
    return {
        architectureThreshold: clamp(Number(input.architectureThreshold ?? base.architectureThreshold), 0.54, 0.72),
        retryEnabled: Boolean(input.retryEnabled ?? base.retryEnabled),
        retryPromptBoost: Boolean(input.retryPromptBoost),
        postprocessBoost: Boolean(input.postprocessBoost),
        successEma: clamp(Number(input.successEma ?? base.successEma), 0, 1),
        archFailEma: clamp(Number(input.archFailEma ?? base.archFailEma), 0, 1),
        qualityFailEma: clamp(Number(input.qualityFailEma ?? base.qualityFailEma), 0, 1),
        updatedAt: Number(input.updatedAt || Date.now()),
    };
}

function persistPolicy(tool: AdaptiveTool, policy: ToolAdaptivePolicy): void {
    const db = getDb();
    db.prepare(
        `INSERT INTO tool_adaptive_policy (policy_key, policy_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(policy_key) DO UPDATE SET
           policy_json = excluded.policy_json,
           updated_at = excluded.updated_at`
    ).run(keyFor(tool), JSON.stringify(policy), Date.now());
}

export function getToolAdaptivePolicy(tool: AdaptiveTool): ToolAdaptivePolicy {
    const db = getDb();
    const row = db
        .prepare(`SELECT policy_json FROM tool_adaptive_policy WHERE policy_key = ?`)
        .get(keyFor(tool)) as { policy_json: string } | undefined;
    if (!row) {
        const policy = defaultPolicy(tool);
        persistPolicy(tool, policy);
        return policy;
    }
    try {
        return normalizePolicy(tool, JSON.parse(row.policy_json) as Partial<ToolAdaptivePolicy>);
    } catch {
        const policy = defaultPolicy(tool);
        persistPolicy(tool, policy);
        return policy;
    }
}

export function recordToolAdaptiveOutcome(tool: AdaptiveTool, input: { ok: boolean; reason?: AdaptiveFailureReason }): ToolAdaptivePolicy {
    const prev = getToolAdaptivePolicy(tool);
    const alpha = clamp(EMA_ALPHA, 0.05, 0.35);
    const successSignal = input.ok ? 1 : 0;
    const archSignal = input.ok ? 0 : input.reason === 'architecture' ? 1 : 0;
    const qualitySignal = input.ok ? 0 : input.reason === 'quality' ? 1 : 0;

    const successEma = prev.successEma * (1 - alpha) + successSignal * alpha;
    const archFailEma = prev.archFailEma * (1 - alpha) + archSignal * alpha;
    const qualityFailEma = prev.qualityFailEma * (1 - alpha) + qualitySignal * alpha;

    const threshold = clamp(baseArchitectureThreshold(tool) + archFailEma * 0.08 - qualityFailEma * 0.02, 0.54, 0.72);
    const retryEnabled = archFailEma >= 0.08 || qualityFailEma >= 0.08 || successEma < 0.85;
    const retryPromptBoost = qualityFailEma >= 0.14 || archFailEma >= 0.14;
    const postprocessBoost = qualityFailEma >= 0.2;

    const next: ToolAdaptivePolicy = {
        architectureThreshold: threshold,
        retryEnabled,
        retryPromptBoost,
        postprocessBoost,
        successEma,
        archFailEma,
        qualityFailEma,
        updatedAt: Date.now(),
    };
    persistPolicy(tool, next);
    return next;
}

export function getAllToolAdaptivePolicies(): Record<AdaptiveTool, ToolAdaptivePolicy> {
    return {
        enhance: getToolAdaptivePolicy('enhance'),
        'remove-object': getToolAdaptivePolicy('remove-object'),
        'virtual-renovation': getToolAdaptivePolicy('virtual-renovation'),
    };
}
