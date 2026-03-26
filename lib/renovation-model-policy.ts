import type { ImageMetrics } from '@/lib/image-quality-guard';

export type RenovationSceneDifficulty = 'easy' | 'medium' | 'hard';

export interface RenovationModelPolicyInput {
    qualityScore?: number;
    metrics: ImageMetrics;
    instructions: string;
    allowArchitecturalChanges: boolean;
}

export interface RenovationModelPolicy {
    difficulty: RenovationSceneDifficulty;
    primaryModel: string;
    fallbackModel: string;
    models: string[];
    rationale: string[];
}

const FLASH31 = 'gemini-3.1-flash-image-preview';
const FLASH25 = 'gemini-2.5-flash-image';

export function resolveRenovationModelPolicy(input: RenovationModelPolicyInput): RenovationModelPolicy {
    const qualityScore = Number(input.qualityScore ?? 0);
    const { sharpness, stdLuma, width, height, aspect } = input.metrics;
    const text = String(input.instructions || '').toLowerCase();
    const rationale: string[] = [];
    let risk = 0;

    if (qualityScore < 0.84) {
        risk += 2;
        rationale.push('input score below 84');
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
    if (aspect > 1.75 || aspect < 0.68) {
        risk += 1;
        rationale.push('wide or narrow framing');
    }
    if (input.allowArchitecturalChanges) {
        risk += 2;
        rationale.push('explicit architectural edit request');
    }
    if (/(mutfak|banyo|kitchen|bathroom|fa[yi]ans|dolap|cabinet|ceiling|wall|floor|window|door|duvar|zemin|tavan|pencere|kapı)/i.test(text)) {
        risk += 1;
        rationale.push('surface-heavy renovation scope');
    }

    if (risk <= 1 && qualityScore >= 0.9) {
        return {
            difficulty: 'easy',
            primaryModel: FLASH25,
            fallbackModel: FLASH31,
            models: [FLASH25, FLASH31],
            rationale: rationale.length > 0 ? rationale : ['clean input and low renovation complexity'],
        };
    }

    if (risk <= 4) {
        return {
            difficulty: 'medium',
            primaryModel: FLASH31,
            fallbackModel: FLASH31,
            models: [FLASH31],
            rationale: rationale.length > 0 ? rationale : ['balanced renovation case', 'single-model flash routing'],
        };
    }

    return {
        difficulty: 'hard',
        primaryModel: FLASH31,
        fallbackModel: FLASH31,
        models: [FLASH31],
        rationale: rationale.length > 0 ? rationale : ['high renovation complexity', 'single-model flash routing'],
    };
}
