import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Jimp } from 'jimp';
import { addCredits, deductCredits, getCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { getEnhanceCreditCost } from '@/lib/tool-credit-costs';
import { buildEnhancePrompt } from '@/app/enhance/prompts';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
import { validateInputImageForProcessing, verifyOutputImageQuality } from '@/lib/image-quality-guard';
import { analyzeEnhancePreflight, resolveAutoEnhanceOptions } from '@/lib/enhance-preflight';
import { verifyEnhanceQualityContract } from '@/lib/enhance-quality-contract';
import { isDataUrlLikelyBlack, postprocessListingImage } from '@/lib/output-postprocess';
import {
    buildEnhanceRequestKey,
    consumeEnhanceRetryBudget,
    readCachedEnhanceResponse,
    withEnhanceIdempotency,
    writeCachedEnhanceResponse,
} from '@/lib/enhance-runtime';
import { validateUploadedImage } from '@/lib/upload-guard';
import { getToolAdaptivePolicy, recordToolAdaptiveOutcome } from '@/lib/tool-adaptive';
import { recordToolRun } from '@/lib/work-history';
import { parseDataUrl as parseUrl } from '@/lib/data-url';
import { recordEnhanceDiagnostic } from '@/lib/enhance-observability';

const ENABLE_ENHANCE_RETRY = process.env.ENHANCE_ENABLE_AUTO_RETRY !== '0';
const PROMPT_VERSION = process.env.ENHANCE_PROMPT_VERSION || 'A';
const ENHANCE_FALLBACK_MIN_SIDE = Math.max(480, Number(process.env.ENHANCE_FALLBACK_MIN_SIDE || 640));
const FORCE_LOCAL_FALLBACK = process.env.ENHANCE_FORCE_LOCAL_FALLBACK === '1';
const ENABLE_ENHANCE_RESULT_CACHE = false;

const MANUAL_OPTION_IDS = new Set([
    'lighting',
    'color',
    'sharpness',
    'clean',
    'privacy',
    'sky',
    'twilight',
]);

type EnhanceFailureReason = 'architecture' | 'quality' | 'black_output';
type EnhanceProcessingMode = 'ai' | 'ai_cached' | 'fallback_local';
type EnhanceFallbackReason = EnhanceFailureReason | 'provider_timeout' | 'provider_error';

interface EnhanceAttemptResult {
    ok: boolean;
    reason?: EnhanceFailureReason;
    error?: string;
    architectureScore?: number;
    qualityScore?: number;
    contractScore?: number;
    outputQualityScore?: number;
    isBlackOutput?: boolean;
    latencyMs: number;
    generation: Awaited<ReturnType<typeof generateEditedImageWithNanoBanana>>;
}

interface SourceImage {
    bytes: Buffer;
    mime: string;
    name: string;
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
    if (reason === 'quality' || reason === 'black_output') {
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
    source: SourceImage,
    prompt: string,
    options: Record<string, boolean>,
    architectureThreshold?: number
): Promise<EnhanceAttemptResult> {
    const startedAt = Date.now();
    const generation = await generateEditedImageWithNanoBanana({ image: sourceToFile(source), prompt });
    const finalizedImage = await postprocessListingImage(generation.imageUrl, {
        tool: 'enhance',
        enhanceOptions: options,
    });
    const finalizedGeneration = { ...generation, imageUrl: finalizedImage };

    const blackOutput = await isDataUrlLikelyBlack(finalizedGeneration.imageUrl);
    if (blackOutput) {
        return {
            ok: false,
            reason: 'black_output',
            error: 'Model ciktisi siyah/bozuk gorundu.',
            outputQualityScore: 0,
            isBlackOutput: true,
            latencyMs: Date.now() - startedAt,
            generation: finalizedGeneration,
        };
    }

    const outputGuard = await verifyOutputImageQuality(sourceToFile(source), finalizedGeneration.imageUrl, 'enhance');
    if (!outputGuard.ok) {
        return {
            ok: false,
            reason: 'quality',
            error: outputGuard.error || 'Cikti kalite kapisindan gecemedi.',
            outputQualityScore: outputGuard.score,
            latencyMs: Date.now() - startedAt,
            generation: finalizedGeneration,
        };
    }

    const integrity = await verifyArchitectureIntegrity(sourceToFile(source), finalizedGeneration.imageUrl, architectureThreshold);
    if (!integrity.ok) {
        return {
            ok: false,
            reason: 'architecture',
            architectureScore: integrity.score,
            outputQualityScore: outputGuard.score,
            error: `Mimari detaylar korunamadi (skor: ${integrity.score.toFixed(2)}).`,
            latencyMs: Date.now() - startedAt,
            generation: finalizedGeneration,
        };
    }

    const contract = await verifyEnhanceQualityContract(sourceToFile(source), finalizedGeneration.imageUrl, options);
    if (!contract.ok) {
        return {
            ok: false,
            reason: 'quality',
            architectureScore: integrity.score,
            qualityScore: contract.checks.baseQuality,
            contractScore: contract.score,
            outputQualityScore: outputGuard.score,
            error: contract.reason || `Cikti kalite kapisindan gecemedi (skor: ${contract.score.toFixed(2)}).`,
            latencyMs: Date.now() - startedAt,
            generation: finalizedGeneration,
        };
    }

    return {
        ok: true,
        architectureScore: integrity.score,
        qualityScore: contract.checks.baseQuality,
        contractScore: contract.score,
        outputQualityScore: outputGuard.score,
        isBlackOutput: false,
        latencyMs: Date.now() - startedAt,
        generation: finalizedGeneration,
    };
}

export async function POST(request: NextRequest) {
    let chargedPhone = '';
    let chargedCredits = 0;
    let creditCharged = false;
    const requestStartedAt = Date.now();
    let requestKey = '';
    let appliedOptionsResolved: string[] = [];
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const optionsStr = formData.get('options') as string;
        const phone = String(formData.get('phone') || '');
        const debugForceFallback =
            FORCE_LOCAL_FALLBACK ||
            (process.env.NODE_ENV !== 'production' && String(formData.get('debugForceFallback') || '') === '1');
        chargedPhone = phone;

        const uploadCheck = validateUploadedImage(image);
        if (!uploadCheck.ok) {
            return NextResponse.json({ success: false, error: uploadCheck.error, creditCharged: false }, { status: 400 });
        }
        const source = await createSourceImage(image);
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'İşlem için giriş yapmanız gerekiyor', creditCharged: false },
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
                { success: false, error: 'Lütfen en az bir geliştirme seçeneği seçin', creditCharged: false },
                { status: 400 }
            );
        }

        const inputQuality = await validateInputImageForProcessing(sourceToFile(source), 'enhance');
        if (!inputQuality.ok) {
            return NextResponse.json(
                { success: false, code: 'INPUT_QUALITY_LOW', error: inputQuality.error, creditCharged: false },
                { status: 422 }
            );
        }

        const preflight = await analyzeEnhancePreflight(sourceToFile(source), inputQuality.metrics);
        const appliedOptions = normalizedOptions.auto
            ? resolveAutoEnhanceOptions(preflight)
            : resolvedManualOptions(normalizedOptions);
        appliedOptionsResolved = Object.keys(appliedOptions);

        if (appliedOptionsResolved.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Uygulanacak geçerli geliştirme seçeneği bulunamadı.', creditCharged: false },
                { status: 400 }
            );
        }

        const prompt = buildEnhancePrompt(appliedOptions);
        requestKey = await buildEnhanceRequestKey(sourceToFile(source), appliedOptions, PROMPT_VERSION, prompt);
        if (ENABLE_ENHANCE_RESULT_CACHE) {
            const cached = readCachedEnhanceResponse(requestKey);
            if (cached) {
                const credits = await getCredits(phone);
                const payload = {
                    ...cached,
                    attemptLog: process.env.NODE_ENV === 'production' ? undefined : cached.attemptLog,
                    cached: true,
                    processingMode: 'ai_cached' as const,
                    fallbackReason: undefined,
                    usedCredits: 0,
                    creditCharged: false,
                    credits,
                    appliedOptions: appliedOptionsResolved,
                    appliedOptionsResolved: cached.appliedOptionsResolved || appliedOptionsResolved,
                    qualityMetrics: cached.qualityMetrics || {
                        architectureScore: cached.architectureScore,
                        contractScore: cached.contractScore,
                        outputScore: undefined,
                    },
                };
                recordEnhanceDiagnostic({
                    at: Date.now(),
                    requestKey,
                    model: payload.model,
                    processingMode: 'ai_cached',
                    appliedOptionsResolved: payload.appliedOptionsResolved,
                    architectureScore: payload.qualityMetrics?.architectureScore,
                    contractScore: payload.qualityMetrics?.contractScore,
                    outputQualityScore: payload.qualityMetrics?.outputScore,
                    usedCredits: 0,
                    creditCharged: false,
                    latencyMs: Date.now() - requestStartedAt,
                    totalLatencyMs: Date.now() - requestStartedAt,
                });
                return NextResponse.json(payload);
            }
        }

        return await withEnhanceIdempotency(requestKey, async () => {
            const adaptivePolicy = getToolAdaptivePolicy('enhance');
            const beforeImageUrl = sourceToDataUrl(source);
            let accepted: EnhanceAttemptResult | null = null;
            let fallbackReason: EnhanceFallbackReason | undefined;
            let processingMode: EnhanceProcessingMode = 'ai';
            let aiLatencyMs = 0;
            const fallbackValidationReasons: string[] = [];
            try {
                if (!debugForceFallback) {
                    const first = await runEnhanceAttempt(
                        source,
                        prompt,
                        appliedOptions,
                        adaptivePolicy.architectureThreshold
                    );
                    aiLatencyMs += first.latencyMs;
                    accepted = first;
                    if (!accepted.ok && ENABLE_ENHANCE_RETRY && adaptivePolicy.retryEnabled) {
                        const budget = consumeEnhanceRetryBudget(phone);
                        if (budget.allowed) {
                            const retryPrompt = buildRetryPrompt(
                                prompt,
                                accepted.reason || 'quality',
                                adaptivePolicy.retryPromptBoost || adaptivePolicy.postprocessBoost
                            );
                            const second = await runEnhanceAttempt(
                                source,
                                retryPrompt,
                                appliedOptions,
                                adaptivePolicy.architectureThreshold
                            );
                            aiLatencyMs += second.latencyMs;
                            accepted = second.ok ? second : first;
                        }
                    }
                } else {
                    accepted = null;
                    fallbackReason = 'provider_error';
                }
            } catch (providerError) {
                fallbackReason = resolveProviderFallbackReason(providerError);
                accepted = null;
            }

            const runId = randomUUID();

            if (!accepted?.ok) {
                fallbackReason = fallbackReason || accepted?.reason || 'quality';
                processingMode = 'fallback_local';
                let safeLocalImage = await postprocessListingImage(beforeImageUrl, {
                    tool: 'enhance',
                    enhanceOptions: appliedOptions,
                });
                let fallbackValidation = await validateFallbackOutputMinimal(safeLocalImage);
                if (!fallbackValidation.ok) fallbackValidationReasons.push(fallbackValidation.reason || 'initial_invalid');

                if (!fallbackValidation.ok) {
                    const strongerOptions = {
                        ...appliedOptions,
                        lighting: true,
                        color: true,
                        sharpness: true,
                    };
                    safeLocalImage = await postprocessListingImage(beforeImageUrl, {
                        tool: 'enhance',
                        enhanceOptions: strongerOptions,
                    });
                    fallbackValidation = await validateFallbackOutputMinimal(safeLocalImage);
                    if (!fallbackValidation.ok) fallbackValidationReasons.push(fallbackValidation.reason || 'stronger_invalid');
                }

                if (!fallbackValidation.ok) {
                    const emergencyOptions: Record<string, boolean> = {
                        lighting: true,
                        color: true,
                    };
                    if (appliedOptions.sharpness || appliedOptions.clean) {
                        emergencyOptions.sharpness = true;
                    }
                    if (appliedOptions.twilight) {
                        emergencyOptions.twilight = true;
                    }
                    safeLocalImage = await postprocessListingImage(beforeImageUrl, {
                        tool: 'enhance',
                        enhanceOptions: emergencyOptions,
                    });
                    fallbackValidation = await validateFallbackOutputMinimal(safeLocalImage);
                    if (!fallbackValidation.ok) fallbackValidationReasons.push(fallbackValidation.reason || 'emergency_invalid');
                }

                if (!fallbackValidation.ok) {
                    const emergencyJimpFallback = await buildJimpEmergencyEnhanceFallback(source, appliedOptions);
                    fallbackValidation = await validateFallbackOutputMinimal(emergencyJimpFallback);
                    if (fallbackValidation.ok) {
                        safeLocalImage = emergencyJimpFallback;
                        fallbackValidationReasons.push('jimp_emergency_fallback_applied');
                    } else {
                        fallbackValidationReasons.push(fallbackValidation.reason || 'jimp_emergency_fallback_invalid');
                    }
                }

                if (!fallbackValidation.ok) {
                    const originalValidation = await validateFallbackOutputMinimal(beforeImageUrl);
                    if (originalValidation.ok) {
                        safeLocalImage = beforeImageUrl;
                        fallbackValidationReasons.push('original_preserved');
                        fallbackReason = fallbackReason === 'provider_timeout' || fallbackReason === 'provider_error'
                            ? fallbackReason
                            : 'black_output';
                    } else {
                        throw new Error(`Yerel fallback cikti uretmedi (${fallbackValidation.reason || 'invalid'}).`);
                    }
                }

                accepted = {
                    ok: true,
                    architectureScore: 1,
                    qualityScore: 0.82,
                    contractScore: 0.82,
                    outputQualityScore: 0.82,
                    isBlackOutput: false,
                    latencyMs: 0,
                    generation: {
                        imageUrl: safeLocalImage,
                        model: `local-safe-enhance-${fallbackReason}`,
                        provider: 'nano-banana',
                        fallbackUsed: true,
                        attemptedModels: ['local-safe-fallback'],
                        attemptLog: [
                            {
                                model: 'local-safe-fallback',
                                attempt: 1,
                                status: 'error',
                                latencyMs: 0,
                                message: fallbackReason,
                            },
                        ],
                    },
                };
            }

            if (processingMode === 'ai') {
                recordToolAdaptiveOutcome('enhance', { ok: true });
            } else {
                recordToolAdaptiveOutcome('enhance', {
                    ok: false,
                    reason:
                        fallbackReason === 'architecture'
                            ? 'architecture'
                            : fallbackReason === 'quality' || fallbackReason === 'black_output'
                                ? 'quality'
                                : 'provider',
                });
            }

            const isLocalFallback = processingMode === 'fallback_local';
            let remainingCredits = await getCredits(phone);
            let usedCredits = 0;
            creditCharged = false;

            if (!isLocalFallback) {
                const creditResult = await deductCredits(phone, requestedCost, 'tool_enhance');
                if (!creditResult.ok) {
                    recordEnhanceDiagnostic({
                        at: Date.now(),
                        requestKey,
                        model: accepted.generation.model,
                        processingMode: 'failed',
                        fallbackReason: 'provider_error',
                        appliedOptionsResolved,
                        architectureScore: accepted.architectureScore,
                        contractScore: accepted.contractScore,
                        outputQualityScore: accepted.outputQualityScore,
                        isBlackOutput: accepted.isBlackOutput,
                        usedCredits: 0,
                        creditCharged: false,
                        latencyMs: Date.now() - requestStartedAt,
                        aiLatencyMs,
                        totalLatencyMs: Date.now() - requestStartedAt,
                    });
                    return NextResponse.json(
                        {
                            success: false,
                            code: 'INSUFFICIENT_CREDITS',
                            error: 'Yetersiz kredi',
                            credits: creditResult.credits,
                            creditCharged: false,
                        },
                        { status: 402 }
                    );
                }
                chargedCredits = requestedCost;
                creditCharged = true;
                remainingCredits = creditResult.credits;
                usedCredits = requestedCost;

                try {
                    if (ENABLE_ENHANCE_RESULT_CACHE) {
                        writeCachedEnhanceResponse(requestKey, {
                            success: true,
                            imageUrl: accepted.generation.imageUrl,
                            provider: accepted.generation.provider,
                            model: accepted.generation.model,
                            fallbackUsed: accepted.generation.fallbackUsed,
                            attemptedModels: accepted.generation.attemptedModels,
                            attemptLog: accepted.generation.attemptLog,
                            processingMode: 'ai',
                            appliedOptionsResolved,
                            architectureScore: accepted.architectureScore,
                            qualityScore: accepted.qualityScore,
                            contractScore: accepted.contractScore,
                            qualityMetrics: {
                                architectureScore: accepted.architectureScore,
                                contractScore: accepted.contractScore,
                                outputScore: accepted.outputQualityScore,
                            },
                            appliedOptions: appliedOptionsResolved,
                        });
                    }
                } catch (persistError) {
                    console.error('Enhance cache persistence warning:', persistError);
                }
            }

            try {
                recordToolRun({
                    runId,
                    phone,
                    toolId: 'enhance',
                    beforeImageUrl,
                    afterImageUrl: accepted.generation.imageUrl,
                    title: 'Fotoğraf Geliştirme',
                    detail: `Opsiyonlar: ${appliedOptionsResolved.join(', ') || 'auto'}`,
                    usedCredits,
                });
            } catch (persistError) {
                console.error('Enhance work-history warning:', persistError);
            }

            const payload = {
                success: true,
                runId,
                imageUrl: accepted.generation.imageUrl,
                provider: accepted.generation.provider,
                model: accepted.generation.model,
                fallbackUsed: accepted.generation.fallbackUsed,
                attemptedModels: accepted.generation.attemptedModels,
                attemptLog: process.env.NODE_ENV === 'production' ? undefined : accepted.generation.attemptLog,
                architectureScore: accepted.architectureScore,
                qualityScore: accepted.qualityScore,
                contractScore: accepted.contractScore,
                processingMode,
                fallbackReason: processingMode === 'fallback_local' ? fallbackReason : undefined,
                appliedOptions: appliedOptionsResolved,
                appliedOptionsResolved,
                qualityMetrics: {
                    architectureScore: accepted.architectureScore,
                    contractScore: accepted.contractScore,
                    outputScore: accepted.outputQualityScore,
                },
                preflight,
                credits: remainingCredits,
                usedCredits,
                creditCharged,
                cached: false,
                notice:
                    processingMode === 'fallback_local'
                        ? 'Yerel güvenli mod uygulandı, kredi düşmedi. Gerekli durumda güvenli çıktı için orijinal görsel korundu.'
                        : undefined,
                debugForcedLocalFallback: debugForceFallback ? true : undefined,
                debugFallbackValidationReasons:
                    process.env.NODE_ENV !== 'production' && fallbackValidationReasons.length > 0
                        ? fallbackValidationReasons
                        : undefined,
            };

            const metricSnapshot = recordEnhanceDiagnostic({
                at: Date.now(),
                requestKey,
                model: accepted.generation.model,
                processingMode,
                fallbackReason: payload.fallbackReason,
                appliedOptionsResolved,
                architectureScore: accepted.architectureScore,
                contractScore: accepted.contractScore,
                outputQualityScore: accepted.outputQualityScore,
                isBlackOutput: accepted.isBlackOutput,
                usedCredits,
                creditCharged,
                latencyMs: Date.now() - requestStartedAt,
                aiLatencyMs,
                totalLatencyMs: Date.now() - requestStartedAt,
            });
            if (metricSnapshot.total >= 10 && metricSnapshot.fallbackRateLast50 > 0.4) {
                console.warn(
                    `[enhance] fallback rate high in last ${metricSnapshot.total}: ${(metricSnapshot.fallbackRateLast50 * 100).toFixed(1)}%`
                );
            }

            return NextResponse.json(payload);
        });
    } catch (error: unknown) {
        console.error('Enhance API Error:', error);
        recordToolAdaptiveOutcome('enhance', { ok: false, reason: 'provider' });
        let refundApplied = false;
        let credits: number | undefined;
        if (chargedCredits > 0 && chargedPhone) {
            try {
                credits = await addCredits(chargedPhone, chargedCredits, 'auto_refund_enhance_error');
                refundApplied = true;
                creditCharged = false;
            } catch (refundError) {
                console.error('Enhance auto refund failed:', refundError);
            }
        }
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        recordEnhanceDiagnostic({
            at: Date.now(),
            requestKey: requestKey || undefined,
            processingMode: 'failed',
            fallbackReason: 'provider_error',
            appliedOptionsResolved,
            usedCredits: 0,
            creditCharged,
            latencyMs: Date.now() - requestStartedAt,
            totalLatencyMs: Date.now() - requestStartedAt,
        });
        return NextResponse.json({
            success: false,
            error: message,
            creditCharged,
            refundApplied,
            credits,
            refundMessage: refundApplied ? 'İşlem başarısız oldu, kesilen kredi iade edildi.' : undefined,
        }, { status: 500 });
    }
}

async function createSourceImage(file: File): Promise<SourceImage> {
    return {
        bytes: Buffer.from(await file.arrayBuffer()),
        mime: file.type || 'image/jpeg',
        name: file.name || 'upload.jpg',
    };
}

function sourceToFile(source: SourceImage): File {
    return new File([new Uint8Array(source.bytes)], source.name, { type: source.mime });
}

function sourceToDataUrl(source: SourceImage): string {
    return `data:${source.mime};base64,${source.bytes.toString('base64')}`;
}

async function buildJimpEmergencyEnhanceFallback(source: SourceImage, options: Record<string, boolean>): Promise<string> {
    try {
        const sharpModule = await import('sharp');
        const sharp = sharpModule.default;
        const meta = await sharp(source.bytes).metadata();
        const width = meta.width || 0;
        const height = meta.height || 0;
        const maxSide = Math.max(width, height);
        const maxProcessSide = Math.max(1024, Number(process.env.ENHANCE_PROCESS_MAX_SIDE || 1536));

        let pipeline = sharp(source.bytes).rotate().flatten({ background: '#ffffff' });
        if (maxSide > maxProcessSide) {
            pipeline = pipeline.resize({ width: maxProcessSide, height: maxProcessSide, fit: 'inside', withoutEnlargement: true });
        }

        let brightness = 1.03;
        let saturation = 1.04;
        let hue = 0;
        if (options.lighting || options.auto) brightness += 0.13;
        if (options.color || options.auto) saturation += 0.15;
        if (options.twilight) {
            brightness += 0.06;
            saturation += 0.1;
            hue = 10;
        }
        pipeline = pipeline.modulate({ brightness, saturation, hue });

        if (options.clean || options.auto) {
            pipeline = pipeline.median(3);
        }
        if (options.sharpness || options.clean || options.auto) {
            pipeline = pipeline.sharpen({ sigma: 1.1, m1: 1.2, m2: 1.8, x1: 2.0, y2: 10.0, y3: 20.0 });
        }
        if (options.twilight) {
            pipeline = pipeline.tint({ r: 255, g: 236, b: 214 });
        }

        const out = await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
        return `data:image/jpeg;base64,${out.toString('base64')}`;
    } catch {
        // Continue with pure-Jimp emergency fallback when sharp is unavailable.
    }

    const image = await Jimp.read(source.bytes);
    const raw = image.bitmap.data;
    for (let i = 0; i < raw.length; i += 4) {
        const a = raw[i + 3] ?? 255;
        if (a >= 255) continue;
        const alpha = a / 255;
        raw[i] = Math.round(raw[i] * alpha + 255 * (1 - alpha));
        raw[i + 1] = Math.round(raw[i + 1] * alpha + 255 * (1 - alpha));
        raw[i + 2] = Math.round(raw[i + 2] * alpha + 255 * (1 - alpha));
        raw[i + 3] = 255;
    }

    const maxSide = Math.max(image.bitmap.width, image.bitmap.height);
    const maxProcessSide = Math.max(1024, Number(process.env.ENHANCE_PROCESS_MAX_SIDE || 1536));
    if (maxSide > maxProcessSide) {
        image.resize({ w: maxProcessSide, h: maxProcessSide });
    }

    if (options.lighting || options.auto) {
        applyExposureGainLocal(image, 1.14);
    }
    if (options.color || options.auto) {
        image.color([{ apply: 'saturate', params: [12] }]);
        image.contrast(0.04);
    }
    if (options.clean || options.auto) {
        image.blur(1);
    }
    if (options.sharpness || options.auto) {
        image.convolute([
            [0, -0.16, 0],
            [-0.16, 1.64, -0.16],
            [0, -0.16, 0],
        ]);
    }
    if (options.twilight) {
        applyExposureGainLocal(image, 1.08);
        image.color([{ apply: 'saturate', params: [10] }]);
        const toneRaw = image.bitmap.data;
        for (let i = 0; i < toneRaw.length; i += 4) {
            toneRaw[i] = Math.min(255, toneRaw[i] + 14);
            toneRaw[i + 1] = Math.min(255, toneRaw[i + 1] + 7);
            toneRaw[i + 2] = Math.max(0, toneRaw[i + 2] - 4);
        }
    }

    const out = await image.getBuffer('image/jpeg');
    return `data:image/jpeg;base64,${out.toString('base64')}`;
}

function applyExposureGainLocal(image: Awaited<ReturnType<typeof Jimp.read>>, gain: number): void {
    const g = Math.max(0.6, Math.min(2.2, gain));
    const raw = image.bitmap.data;
    for (let i = 0; i < raw.length; i += 4) {
        raw[i] = Math.max(0, Math.min(255, Math.round(raw[i] * g)));
        raw[i + 1] = Math.max(0, Math.min(255, Math.round(raw[i + 1] * g)));
        raw[i + 2] = Math.max(0, Math.min(255, Math.round(raw[i + 2] * g)));
    }
}

function resolveProviderFallbackReason(error: unknown): EnhanceFallbackReason {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('deadline') ||
        message.includes('etimedout')
    ) {
        return 'provider_timeout';
    }
    return 'provider_error';
}

async function validateFallbackOutputMinimal(
    dataUrl: string
): Promise<{ ok: boolean; reason?: string; isBlackOutput?: boolean }> {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return { ok: false, reason: 'invalid_data_url' };
    }
    try {
        const parsed = parseUrl(dataUrl);
        const image = await Jimp.read(Buffer.from(parsed.base64, 'base64'));
        const minSide = Math.min(image.bitmap.width, image.bitmap.height);
        if (minSide < ENHANCE_FALLBACK_MIN_SIDE) {
            return { ok: false, reason: `low_resolution_${minSide}` };
        }
    } catch {
        return { ok: false, reason: 'invalid_image_data' };
    }
    const black = await isDataUrlLikelyBlack(dataUrl);
    if (black) {
        return { ok: false, reason: 'black_output', isBlackOutput: true };
    }
    return { ok: true, isBlackOutput: false };
}
