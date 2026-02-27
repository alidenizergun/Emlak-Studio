import { NextRequest, NextResponse } from 'next/server';
import { addCredits, deductCredits, getCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { getEnhanceCreditCost } from '@/lib/tool-credit-costs';
import { buildEnhancePrompt } from '@/app/enhance/prompts';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
import { validateInputImageQuality } from '@/lib/image-quality-guard';
import { analyzeEnhancePreflight, resolveAutoEnhanceOptions } from '@/lib/enhance-preflight';
import { verifyEnhanceQualityContract } from '@/lib/enhance-quality-contract';
import { postprocessListingImage } from '@/lib/output-postprocess';
import {
    buildEnhanceRequestKey,
    consumeEnhanceRetryBudget,
    readCachedEnhanceResponse,
    withEnhanceIdempotency,
    writeCachedEnhanceResponse,
} from '@/lib/enhance-runtime';
import { validateUploadedImage } from '@/lib/upload-guard';
import { getToolAdaptivePolicy, recordToolAdaptiveOutcome } from '@/lib/tool-adaptive';

const ENABLE_ENHANCE_RETRY = process.env.ENHANCE_ENABLE_AUTO_RETRY !== '0';
const PROMPT_VERSION = process.env.ENHANCE_PROMPT_VERSION || 'A';

const MANUAL_OPTION_IDS = new Set([
    'lighting',
    'color',
    'sharpness',
    'clean',
    'privacy',
    'sky',
    'twilight',
]);

type EnhanceFailureReason = 'architecture' | 'quality';

interface EnhanceAttemptResult {
    ok: boolean;
    reason?: EnhanceFailureReason;
    error?: string;
    architectureScore?: number;
    qualityScore?: number;
    contractScore?: number;
    generation: Awaited<ReturnType<typeof generateEditedImageWithNanoBanana>>;
}

function normalizeOptions(raw: unknown): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    if (!raw || typeof raw !== 'object') return result;
    const obj = raw as Record<string, unknown>;
    if (obj.auto === true) {
        result.auto = true;
        return result;
    }
    for (const id of MANUAL_OPTION_IDS) {
        if (obj[id] === true) result[id] = true;
    }
    return result;
}

function resolvedManualOptions(options: Record<string, boolean>): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const id of MANUAL_OPTION_IDS) {
        if (options[id]) out[id] = true;
    }
    return out;
}

function buildRetryPrompt(basePrompt: string, reason: EnhanceFailureReason, boost = false): string {
    if (reason === 'quality') {
        return `${basePrompt}

RETRY MODE (QUALITY):
- Keep all geometry, lens perspective and room scale identical.
- Increase clarity, micro-contrast and texture realism.
- Avoid over-saturation, halos, watercolor or plastic skin/fabric look.
- Keep photorealistic listing quality.
${boost ? '- Adaptive rule: enforce stronger anti-haze and anti-ghost cleanup; reject semi-transparent artifacts.' : ''}`;
    }
    return `${basePrompt}

RETRY MODE (ARCHITECTURE):
- Preserve room geometry strictly; do not move any wall/window/door/column.
- Keep camera pose and perspective exactly unchanged.
- Prefer conservative enhancement over aggressive edits.
${boost ? '- Adaptive rule: lock architectural lines and corners more strictly than previous attempt.' : ''}`;
}

async function runEnhanceAttempt(
    image: File,
    prompt: string,
    options: Record<string, boolean>,
    architectureThreshold?: number
): Promise<EnhanceAttemptResult> {
    const generation = await generateEditedImageWithNanoBanana({ image, prompt });
    const finalizedImage = await postprocessListingImage(generation.imageUrl, { tool: 'enhance' });
    const finalizedGeneration = { ...generation, imageUrl: finalizedImage };
    const integrity = await verifyArchitectureIntegrity(image, finalizedGeneration.imageUrl, architectureThreshold);
    if (!integrity.ok) {
        return {
            ok: false,
            reason: 'architecture',
            architectureScore: integrity.score,
            error: `Mimari detaylar korunamadi (skor: ${integrity.score.toFixed(2)}).`,
            generation: finalizedGeneration,
        };
    }
    const contract = await verifyEnhanceQualityContract(image, finalizedGeneration.imageUrl, options);
    if (!contract.ok) {
        return {
            ok: false,
            reason: 'quality',
            architectureScore: integrity.score,
            qualityScore: contract.checks.baseQuality,
            contractScore: contract.score,
            error: contract.reason || `Cikti kalite kapisindan gecemedi (skor: ${contract.score.toFixed(2)}).`,
            generation: finalizedGeneration,
        };
    }
    return {
        ok: true,
        architectureScore: integrity.score,
        qualityScore: contract.checks.baseQuality,
        contractScore: contract.score,
        generation: finalizedGeneration,
    };
}

export async function POST(request: NextRequest) {
    let chargedPhone = '';
    let chargedCredits = 0;
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const optionsStr = formData.get('options') as string;
        const phone = String(formData.get('phone') || '');
        chargedPhone = phone;

        const uploadCheck = validateUploadedImage(image);
        if (!uploadCheck.ok) {
            return NextResponse.json({ success: false, error: uploadCheck.error }, { status: 400 });
        }
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'İşlem için giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        let parsedOptions: unknown = {};
        try {
            parsedOptions = JSON.parse(optionsStr || '{}');
        } catch {
            parsedOptions = {};
        }
        const normalizedOptions = normalizeOptions(parsedOptions);
        const requestedCost = getEnhanceCreditCost(normalizedOptions);
        if (requestedCost <= 0) {
            return NextResponse.json(
                { success: false, error: 'Lütfen en az bir geliştirme seçeneği seçin' },
                { status: 400 }
            );
        }

        const inputQuality = await validateInputImageQuality(image, 'enhance');
        if (!inputQuality.ok) {
            return NextResponse.json(
                { success: false, code: 'INPUT_QUALITY_LOW', error: inputQuality.error },
                { status: 422 }
            );
        }

        const preflight = await analyzeEnhancePreflight(image, inputQuality.metrics);
        const appliedOptions = normalizedOptions.auto
            ? resolveAutoEnhanceOptions(preflight)
            : resolvedManualOptions(normalizedOptions);

        if (Object.keys(appliedOptions).length === 0) {
            return NextResponse.json(
                { success: false, error: 'Uygulanacak geçerli geliştirme seçeneği bulunamadı.' },
                { status: 400 }
            );
        }

        const prompt = buildEnhancePrompt(appliedOptions);
        const requestKey = await buildEnhanceRequestKey(image, appliedOptions, PROMPT_VERSION);
        const cached = readCachedEnhanceResponse(requestKey);
        if (cached) {
            const credits = await getCredits(phone);
            return NextResponse.json({
                ...cached,
                cached: true,
                usedCredits: 0,
                credits,
                appliedOptions: Object.keys(appliedOptions),
            });
        }

        return await withEnhanceIdempotency(requestKey, async () => {
            const adaptivePolicy = getToolAdaptivePolicy('enhance');
            const first = await runEnhanceAttempt(
                image,
                prompt,
                appliedOptions,
                adaptivePolicy.architectureThreshold
            );
            let accepted = first;
            if (!accepted.ok && ENABLE_ENHANCE_RETRY && adaptivePolicy.retryEnabled) {
                const budget = consumeEnhanceRetryBudget(phone);
                if (budget.allowed) {
                    const retryPrompt = buildRetryPrompt(
                        prompt,
                        accepted.reason || 'quality',
                        adaptivePolicy.retryPromptBoost || adaptivePolicy.postprocessBoost
                    );
                    const second = await runEnhanceAttempt(
                        image,
                        retryPrompt,
                        appliedOptions,
                        adaptivePolicy.architectureThreshold
                    );
                    accepted = second.ok ? second : first;
                }
            }

            if (!accepted.ok) {
                recordToolAdaptiveOutcome('enhance', {
                    ok: false,
                    reason: accepted.reason || 'other',
                });
                return NextResponse.json(
                    {
                        success: false,
                        code: accepted.reason === 'architecture' ? 'ARCHITECTURE_CHANGED' : 'OUTPUT_QUALITY_LOW',
                        error: accepted.error || 'Cikti kalite kontrolden gecemedi.',
                        architectureScore: accepted.architectureScore,
                        qualityScore: accepted.qualityScore,
                        contractScore: accepted.contractScore,
                    },
                    { status: 422 }
                );
            }
            recordToolAdaptiveOutcome('enhance', { ok: true });

            const creditResult = await deductCredits(phone, requestedCost, 'tool_enhance');
            if (!creditResult.ok) {
                return NextResponse.json(
                    {
                        success: false,
                        code: 'INSUFFICIENT_CREDITS',
                        error: 'Yetersiz kredi',
                        credits: creditResult.credits,
                    },
                    { status: 402 }
                );
            }
            chargedCredits = requestedCost;

            try {
                writeCachedEnhanceResponse(requestKey, {
                    success: true,
                    imageUrl: accepted.generation.imageUrl,
                    provider: accepted.generation.provider,
                    model: accepted.generation.model,
                    architectureScore: accepted.architectureScore,
                    qualityScore: accepted.qualityScore,
                    contractScore: accepted.contractScore,
                    appliedOptions: Object.keys(appliedOptions),
                });
            } catch (persistError) {
                console.error('Enhance persistence warning:', persistError);
            }

            return NextResponse.json({
                success: true,
                imageUrl: accepted.generation.imageUrl,
                provider: accepted.generation.provider,
                model: accepted.generation.model,
                architectureScore: accepted.architectureScore,
                qualityScore: accepted.qualityScore,
                contractScore: accepted.contractScore,
                appliedOptions: Object.keys(appliedOptions),
                preflight,
                credits: creditResult.credits,
                usedCredits: requestedCost,
                cached: false,
            });
        });
    } catch (error: unknown) {
        console.error('Enhance API Error:', error);
        recordToolAdaptiveOutcome('enhance', { ok: false, reason: 'provider' });
        if (chargedCredits > 0 && chargedPhone) {
            try {
                await addCredits(chargedPhone, chargedCredits, 'auto_refund_enhance_error');
            } catch (refundError) {
                console.error('Enhance auto refund failed:', refundError);
            }
        }
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
