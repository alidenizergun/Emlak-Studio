import type { ImageMetrics } from '@/lib/image-quality-guard';

export type GeminiPolicyClass = 'easy' | 'medium' | 'hard';

export interface GeminiModelPolicy {
    difficulty: GeminiPolicyClass;
    primaryModel: string;
    fallbackModel: string;
    models: string[];
    rationale: string[];
}

const FLASH31 = 'gemini-3.1-flash-image-preview';
const FLASH25 = 'gemini-2.5-flash-image';

function normalizeKey(value: string): string {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
}

export function resolveEnhanceModelPolicy(input: {
    qualityScore?: number;
    metrics: ImageMetrics;
    appliedOptions: string[];
}): GeminiModelPolicy {
    const qualityScore = Number(input.qualityScore ?? 0);
    const { sharpness, stdLuma, width, height } = input.metrics;
    const applied = new Set(input.appliedOptions.map(normalizeKey));
    const rationale: string[] = [];

    let risk = 0;
    if (qualityScore < 0.82) {
        risk += 1;
        rationale.push('input score below 82');
    }
    if (sharpness < 0.011) {
        risk += 1;
        rationale.push('lower sharpness');
    }
    if (stdLuma < 0.08) {
        risk += 1;
        rationale.push('lower contrast');
    }
    if (Math.min(width, height) < 1280) {
        risk += 1;
        rationale.push('moderate source resolution');
    }
    if (applied.has('privacy') || applied.has('sky') || applied.has('twilight')) {
        risk += 1;
        rationale.push('effect-specific enhancement set');
    }

    if (risk <= 1 && qualityScore >= 0.88) {
        return {
            difficulty: 'easy',
            primaryModel: FLASH25,
            fallbackModel: FLASH31,
            models: [FLASH25, FLASH31],
            rationale: rationale.length > 0 ? rationale : ['clean enhancement case'],
        };
    }

    return {
        difficulty: risk >= 3 ? 'hard' : 'medium',
        primaryModel: FLASH31,
        fallbackModel: FLASH31,
        models: [FLASH31],
        rationale: rationale.length > 0 ? rationale : ['default enhancement case'],
    };
}

export function resolveRemoveObjectModelPolicy(input: {
    mode: 'all' | 'prompt';
    qualityScore?: number;
    metrics: ImageMetrics;
    userPrompt?: string;
}): GeminiModelPolicy {
    const qualityScore = Number(input.qualityScore ?? 0);
    const { sharpness, stdLuma, width, height, aspect } = input.metrics;
    const text = String(input.userPrompt || '').toLowerCase();
    const rationale: string[] = [];

    let risk = input.mode === 'all' ? 2 : 0;
    if (qualityScore < 0.84) {
        risk += 1;
        rationale.push('input score below 84');
    }
    if (sharpness < 0.011) {
        risk += 1;
        rationale.push('lower sharpness');
    }
    if (stdLuma < 0.08) {
        risk += 1;
        rationale.push('lower contrast');
    }
    if (Math.min(width, height) < 1280) {
        risk += 1;
        rationale.push('moderate source resolution');
    }
    if (aspect > 1.8 || aspect < 0.68) {
        risk += 1;
        rationale.push('challenging framing');
    }
    if (/(sofa|couch|bed|table|koltuk|masa|yatak|tv|ünite|dolap|wardrobe|shelf|raft)/i.test(text)) {
        risk += 1;
        rationale.push('larger object removal request');
    }

    if (risk <= 1 && input.mode === 'prompt' && qualityScore >= 0.9) {
        return {
            difficulty: 'easy',
            primaryModel: FLASH25,
            fallbackModel: FLASH31,
            models: [FLASH25, FLASH31],
            rationale: rationale.length > 0 ? rationale : ['small targeted removal case'],
        };
    }

    return {
        difficulty: risk >= 4 ? 'hard' : 'medium',
        primaryModel: FLASH31,
        fallbackModel: FLASH31,
        models: [FLASH31],
        rationale: rationale.length > 0 ? rationale : ['default object-removal case'],
    };
}
