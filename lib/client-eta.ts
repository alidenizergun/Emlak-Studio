'use client';

export type EtaToolId =
    | 'stage'
    | 'remove-object'
    | 'virtual-renovation'
    | 'enhance'
    | 'listing-text'
    | 'ai-tour-guide';

type EtaSample = {
    toolId: EtaToolId;
    durationMs: number;
    createdAt: number;
    success: boolean;
    inputBytes?: number;
    complexity?: number;
};

const STORAGE_KEY = 'emlak_tool_eta_v1';
const MAX_SAMPLES_PER_TOOL = 12;

const DEFAULT_SECONDS: Record<EtaToolId, number> = {
    stage: 70,
    'remove-object': 55,
    'virtual-renovation': 70,
    enhance: 40,
    'listing-text': 18,
    'ai-tour-guide': 75,
};

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readSamples(): EtaSample[] {
    if (!canUseStorage()) return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as EtaSample[];
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item) => item && typeof item.toolId === 'string' && Number(item.durationMs) > 0)
            .slice(-120);
    } catch {
        return [];
    }
}

function writeSamples(samples: EtaSample[]): void {
    if (!canUseStorage()) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(samples.slice(-120)));
    } catch {
        // Ignore storage quota / serialization issues; ETA is best-effort.
    }
}

function weightedAverage(values: number[]): number {
    if (values.length === 0) return 0;
    let total = 0;
    let weightSum = 0;
    for (let idx = 0; idx < values.length; idx += 1) {
        const weight = idx + 1;
        total += values[idx] * weight;
        weightSum += weight;
    }
    return total / Math.max(weightSum, 1);
}

export function recordEtaSample(input: {
    toolId: EtaToolId;
    durationMs: number;
    success: boolean;
    inputBytes?: number;
    complexity?: number;
}): void {
    const durationMs = Math.max(250, Math.floor(Number(input.durationMs) || 0));
    if (!durationMs) return;

    const previous = readSamples();
    const next = previous
        .filter((sample) => sample.toolId !== input.toolId)
        .concat(
            previous
                .filter((sample) => sample.toolId === input.toolId)
                .slice(-(MAX_SAMPLES_PER_TOOL - 1))
        )
        .concat({
            toolId: input.toolId,
            durationMs,
            createdAt: Date.now(),
            success: Boolean(input.success),
            inputBytes: Number(input.inputBytes || 0) || undefined,
            complexity: Number(input.complexity || 0) || undefined,
        });
    writeSamples(next);
}

export function estimateToolEtaSeconds(input: {
    toolId: EtaToolId;
    inputBytes?: number;
    complexity?: number;
    fallbackSeconds?: number;
}): number {
    const fallbackSeconds = Math.max(5, Math.floor(input.fallbackSeconds || DEFAULT_SECONDS[input.toolId] || 45));
    const samples = readSamples()
        .filter((sample) => sample.toolId === input.toolId)
        .slice(-MAX_SAMPLES_PER_TOOL);

    const successSamples = samples.filter((sample) => sample.success).slice(-8);
    if (successSamples.length === 0) {
        return fallbackSeconds;
    }

    const baseMs = weightedAverage(successSamples.map((sample) => sample.durationMs));
    const avgBytes = weightedAverage(
        successSamples.map((sample) => Number(sample.inputBytes || 0)).filter((value) => value > 0)
    );
    const avgComplexity = weightedAverage(
        successSamples.map((sample) => Number(sample.complexity || 0)).filter((value) => value > 0)
    );

    let adjustedMs = baseMs;
    const currentBytes = Number(input.inputBytes || 0);
    if (currentBytes > 0 && avgBytes > 0) {
        const sizeFactor = clamp(Math.sqrt(currentBytes / avgBytes), 0.84, 1.32);
        adjustedMs *= sizeFactor;
    }

    const currentComplexity = Number(input.complexity || 0);
    if (currentComplexity > 0 && avgComplexity > 0) {
        const complexityFactor = clamp(1 + ((currentComplexity - avgComplexity) / avgComplexity) * 0.18, 0.9, 1.28);
        adjustedMs *= complexityFactor;
    }

    const recentFailures = samples.filter((sample) => !sample.success).slice(-4).length;
    if (recentFailures > 0) {
        adjustedMs *= 1 + recentFailures * 0.04;
    }

    return clamp(Math.round(adjustedMs / 1000), 8, 180);
}

export function defaultEtaSeconds(toolId: EtaToolId): number {
    return DEFAULT_SECONDS[toolId];
}
