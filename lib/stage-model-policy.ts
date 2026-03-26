import type { ImageMetrics } from '@/lib/image-quality-guard';

export type StageSceneDifficulty = 'easy' | 'medium' | 'hard';

export interface StageModelPolicyInput {
    roomType: string;
    style: string;
    qualityScore?: number;
    metrics: ImageMetrics;
    styleIntensity: 'low' | 'medium' | 'high';
}

export interface StageModelPolicy {
    difficulty: StageSceneDifficulty;
    primaryModel: string;
    fallbackModel: string;
    models: string[];
    rationale: string[];
}

const FLASH31 = 'gemini-3.1-flash-image-preview';
const FLASH25 = 'gemini-2.5-flash-image';

const HIGH_RISK_STYLES = new Set(['luxury', 'classic', 'industrial', 'rustic', 'custom']);
const HIGH_RISK_ROOMS = new Set(['salon', 'oturma-odasi', 'mutfak', 'balkon-teras']);

function normalizeKey(value: string): string {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
}

export function resolveStageModelPolicy(input: StageModelPolicyInput): StageModelPolicy {
    const style = normalizeKey(input.style);
    const roomType = normalizeKey(input.roomType);
    const qualityScore = Number(input.qualityScore ?? 0);
    const { sharpness, stdLuma, width, height, aspect } = input.metrics;
    const rationale: string[] = [];

    let risk = 0;

    if (qualityScore < 0.85) {
        risk += 2;
        rationale.push('input score below 85');
    }
    if (sharpness < 0.012) {
        risk += 1;
        rationale.push('lower sharpness');
    }
    if (stdLuma < 0.085) {
        risk += 1;
        rationale.push('lower contrast');
    }
    if (Math.min(width, height) < 1200) {
        risk += 1;
        rationale.push('moderate source resolution');
    }
    if (aspect > 1.7 || aspect < 0.7) {
        risk += 1;
        rationale.push('wide or narrow framing');
    }
    if (HIGH_RISK_STYLES.has(style)) {
        risk += 2;
        rationale.push('style requires stronger restyling');
    }
    if (HIGH_RISK_ROOMS.has(roomType)) {
        risk += 1;
        rationale.push('room type tends to have more layout complexity');
    }
    if (input.styleIntensity === 'high') {
        risk += 1;
        rationale.push('high style intensity');
    }

    if (risk <= 1 && qualityScore >= 0.9) {
        return {
            difficulty: 'easy',
            primaryModel: FLASH25,
            fallbackModel: FLASH31,
            models: [FLASH25, FLASH31],
            rationale: rationale.length > 0 ? rationale : ['clean input and low scene complexity'],
        };
    }

    if (risk <= 4) {
        return {
            difficulty: 'medium',
            primaryModel: FLASH31,
            fallbackModel: FLASH31,
            models: [FLASH31],
            rationale: rationale.length > 0 ? [...rationale, 'single-model flash routing to reduce timeout risk'] : ['balanced default stage case', 'single-model flash routing to reduce timeout risk'],
        };
    }

    return {
        difficulty: 'hard',
        primaryModel: FLASH31,
        fallbackModel: FLASH31,
        models: [FLASH31],
        rationale: rationale.length > 0 ? [...rationale, 'single-model flash routing to reduce timeout risk'] : ['high scene complexity', 'single-model flash routing to reduce timeout risk'],
    };
}
