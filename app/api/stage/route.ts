import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { addCredits, deductCredits, getCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import {
    validateInputImageForProcessing,
} from '@/lib/image-quality-guard';
import { normalizeImageForStage } from '@/lib/image-normalization';
import { applyArchitectureStructureLock } from '@/lib/structure-lock';
import { validateRoomTypeSanity } from '@/lib/room-type-guard';
import {
    snapshotStageMetrics,
    trackStageDifficulty,
    trackStageFailure,
    trackStageFirstPassSuccess,
    trackStageRetry,
    trackStageStart,
    trackStageSuccess,
} from '@/lib/stage-metrics';
import {
    buildStageRequestKey,
    choosePromptVersion,
    consumeRetryBudget,
    getStageAdaptivePolicy,
    getStagePromptLearning,
    isHardBlocked,
    notePromptAttempt,
    readCachedStageResponse,
    recordStageRun,
    withStageIdempotency,
    writeCachedStageResponse,
} from '@/lib/stage-runtime';
import { generateStagePrompt, resolveStagePromptPlans } from '@/lib/stage-prompt';
import { resolveStageModelPolicy } from '@/lib/stage-model-policy';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';
import { orchestrateVisualGeneration } from '@/lib/gemini-orchestrator';

const STAGE_COST = TOOL_CREDIT_COSTS.stage;
const ENABLE_STAGE_RETRY = process.env.STAGE_ENABLE_AUTO_RETRY !== '0';
const ENABLE_STAGE_RESULT_CACHE = false;
const STAGE_MIN_QUALITY_ACCEPT_SCORE = Number(process.env.STAGE_MIN_QUALITY_ACCEPT_SCORE || 0.5);

export async function POST(request: NextRequest) {
    const startedAt = trackStageStart();
    let chargedPhone = '';
    let chargedCredits = 0;
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const roomType = formData.get('roomType') as string;
        const style = formData.get('style') as string;
        const customStylePrompt = clampText(String(formData.get('customStylePrompt') || ''), 240);
        const phone = String(formData.get('phone') || '');
        chargedPhone = phone;
        const idempotencyKey = String(formData.get('idempotencyKey') || '').trim();

        if (!image || !roomType || !style) {
            return NextResponse.json({ success: false, error: 'Gerekli alanlar eksik' }, { status: 400 });
        }
        if (style === 'custom' && !customStylePrompt.trim()) {
            return NextResponse.json({ success: false, error: 'Özel tarz isteği gerekli' }, { status: 400 });
        }
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

        const hardBlock = isHardBlocked(roomType, style);
        if (hardBlock.blocked) {
            trackStageFailure('hard_block', startedAt);
            const runId = randomUUID();
            recordStageRun({
                runId,
                phone,
                requestKey: 'hard-block',
                roomType,
                style,
                promptVersion: 'A',
                status: 'blocked',
                failCode: 'HARD_BLOCKED_COMBO',
            });
            return NextResponse.json(
                { success: false, code: 'HARD_BLOCKED_COMBO', error: hardBlock.reason, runId },
                { status: 422 }
            );
        }

        const normalized = await normalizeImageForStage(image);
        const normalizedImage = normalized.image;
        const beforeImageUrl = await fileToDataUrl(normalizedImage);
        const inputQuality = await validateInputImageForProcessing(normalizedImage, 'stage');
        if (!inputQuality.ok) {
            trackStageFailure('input_quality', startedAt);
            return NextResponse.json(
                { success: false, code: 'INPUT_QUALITY_LOW', error: inputQuality.error },
                { status: 422 }
            );
        }

        const roomSanity = await validateRoomTypeSanity(normalizedImage, roomType);
        if (!roomSanity.ok && roomSanity.confidence >= 0.9) {
            trackStageFailure('room_type', startedAt);
            return NextResponse.json(
                { success: false, code: 'ROOM_TYPE_MISMATCH', error: roomSanity.reason },
                { status: 422 }
            );
        }

        const promptVersion = choosePromptVersion();
        const styleKey = style === 'custom' ? `custom:${customStylePrompt.trim()}` : style;
        const requestKey = await buildStageRequestKey(normalizedImage, roomType, styleKey, promptVersion);
        const operationKey = idempotencyKey
            ? createHash('sha256').update(requestKey).update(':').update(idempotencyKey).digest('hex')
            : requestKey;
        if (ENABLE_STAGE_RESULT_CACHE) {
            const cached = readCachedStageResponse(operationKey);
            if (cached) {
                const currentCredits = await getCredits(phone);
                return NextResponse.json({
                    ...cached,
                    attemptLog: process.env.NODE_ENV === 'production' ? undefined : cached.attemptLog,
                    cached: true,
                    usedCredits: 0,
                    credits: currentCredits,
                    stageMetrics: snapshotStageMetrics(),
                });
            }
        }

        return await withStageIdempotency(operationKey, async () => {
            const runId = randomUUID();
            const adaptivePolicy = getStageAdaptivePolicy();
            const promptLearning = getStagePromptLearning(roomType, style);
            const styleIntensity = pickAutoStyleIntensity(inputQuality.metrics, adaptivePolicy.styleIntensityCap);
            const promptInput = {
                roomType,
                style,
                customStylePrompt,
                styleIntensity,
                learnedDirectives: promptLearning.directives,
                watermarkSuspected: normalized.watermarkSuspected,
                watermarkCropApplied: normalized.watermarkCropApplied,
                promptVersion,
                cleanupBoost: adaptivePolicy.cleanupBoost,
                antiGhostBoost: adaptivePolicy.antiGhostBoost,
            } as const;
            const prompt = generateStagePrompt(promptInput);
            const resolvedPlans = resolveStagePromptPlans(promptInput);
            const stageModelPolicy = resolveStageModelPolicy({
                roomType,
                style,
                qualityScore: inputQuality.score,
                metrics: inputQuality.metrics,
                styleIntensity,
            });
            trackStageDifficulty(stageModelPolicy.difficulty);

            const prepareForEvaluation = async (imageUrl: string) =>
                applyArchitectureStructureLock(
                    normalizedImage,
                    imageUrl,
                    normalized.watermarkSuspected
                        ? Math.min(Math.max(0.55, Math.min(0.9, adaptivePolicy.firstLockStrength)), 0.76)
                        : Math.max(0.55, Math.min(0.9, adaptivePolicy.firstLockStrength))
                );
            let accepted = await orchestrateVisualGeneration({
                image: normalizedImage,
                prompt,
                preferredModels: stageModelPolicy.models,
                tool: 'stage',
                policyClass: stageModelPolicy.difficulty,
                policyRationale: stageModelPolicy.rationale,
                architectureThreshold: adaptivePolicy.architectureThreshold,
                enableArtifactGuard: true,
                softQualityMinScore: STAGE_MIN_QUALITY_ACCEPT_SCORE,
                fastRetryPrompt: buildFastTimeoutPrompt,
                prepareForEvaluation,
            });

            if (!accepted.ok && ENABLE_STAGE_RETRY && accepted.reason && accepted.reason !== 'timeout' && accepted.reason !== 'provider') {
                const budget = consumeRetryBudget(phone);
                if (budget.allowed) {
                    trackStageRetry();
                    const retryLockStrength =
                        accepted.reason === 'quality'
                            ? adaptivePolicy.retryLockQuality
                            : adaptivePolicy.retryLockArchitecture;
                    const retryPrepareForEvaluation = async (imageUrl: string) =>
                        applyArchitectureStructureLock(
                            normalizedImage,
                            imageUrl,
                            normalized.watermarkSuspected
                                ? Math.min(Math.max(0.55, Math.min(0.9, retryLockStrength)), 0.76)
                                : Math.max(0.55, Math.min(0.9, retryLockStrength))
                        );
                    const second = await orchestrateVisualGeneration({
                        image: normalizedImage,
                        prompt,
                        preferredModels: stageModelPolicy.models,
                        tool: 'stage',
                        policyClass: stageModelPolicy.difficulty,
                        policyRationale: stageModelPolicy.rationale,
                        architectureThreshold: adaptivePolicy.architectureThreshold,
                        enableArtifactGuard: true,
                        softQualityMinScore: STAGE_MIN_QUALITY_ACCEPT_SCORE,
                        retryPrompt: buildRetryPrompt,
                        fastRetryPrompt: buildFastTimeoutPrompt,
                        prepareForEvaluation: retryPrepareForEvaluation,
                    });
                    const firstQualityScore = Number(accepted.qualityScore ?? 0);
                    const secondQualityScore = Number(second.qualityScore ?? 0);
                    accepted =
                        second.ok || secondQualityScore > firstQualityScore
                            ? second
                            : accepted;
                }
            }

            if (!accepted.ok) {
                notePromptAttempt(promptVersion, false);
                trackStageFailure(
                    accepted.reason === 'architecture'
                        ? 'architecture'
                        : accepted.reason === 'quality'
                            ? 'output_quality'
                            : 'provider',
                    startedAt
                );
                return NextResponse.json(
                    {
                        success: false,
                        code:
                            accepted.reason === 'architecture'
                                ? 'ARCHITECTURE_CHANGED'
                                : accepted.reason === 'quality'
                                    ? 'OUTPUT_QUALITY_LOW'
                                    : 'PROVIDER_TIMEOUT',
                        error: accepted.error || 'İşlem başarısız oldu',
                        architectureScore: accepted.architectureScore,
                        qualityScore: accepted.qualityScore,
                        artifactScore: accepted.artifactScore,
                        selectedModel: accepted.telemetry.selectedModel,
                        selectedModelClass: accepted.telemetry.selectedPolicyClass,
                        retryCount: accepted.telemetry.retryCount,
                        fallbackUsed: accepted.telemetry.fallbackUsed,
                        timing: accepted.telemetry.timing,
                    },
                    { status: accepted.reason === 'timeout' ? 504 : 422 }
                );
            }

            if (accepted.telemetry.retryCount === 0) trackStageFirstPassSuccess();
            notePromptAttempt(promptVersion, true);
            const generation = accepted.generation!;
            const creditResult = await deductCredits(phone, STAGE_COST, 'tool_stage');
            if (!creditResult.ok) {
                trackStageFailure('other', startedAt);
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
            chargedCredits = STAGE_COST;

            trackStageSuccess(startedAt);
            const response = {
                success: true as const,
                runId,
                imageUrl: generation.imageUrl,
                provider: generation.provider,
                model: generation.model,
                selectedModel: accepted.telemetry.selectedModel,
                fallbackUsed: accepted.telemetry.fallbackUsed,
                attemptedModels: generation.attemptedModels,
                attemptLog: process.env.NODE_ENV === 'production' ? undefined : generation.attemptLog,
                promptVersion,
                architectureScore: accepted.architectureScore,
                qualityScore: accepted.qualityScore,
                artifactScore: accepted.artifactScore,
                selectedModelClass: accepted.telemetry.selectedPolicyClass,
                selectedModelRationale: process.env.NODE_ENV === 'production' ? undefined : accepted.telemetry.selectedModelRationale,
                retryCount: accepted.telemetry.retryCount,
                timing: accepted.telemetry.timing,
                acceptanceReason: accepted.telemetry.acceptanceReason,
                timeoutRecovered: accepted.telemetry.timeoutRecovered,
                credits: creditResult.credits,
                usedCredits: STAGE_COST,
                cached: false,
                stageMetrics: snapshotStageMetrics(),
                promptLearning: process.env.NODE_ENV === 'production' ? undefined : promptLearning.stats,
                resolvedRoomPlan: process.env.NODE_ENV === 'production' ? undefined : resolvedPlans.roomPlan,
                resolvedStylePlan: process.env.NODE_ENV === 'production' ? undefined : resolvedPlans.stylePlan,
                resolvedComboPlan: process.env.NODE_ENV === 'production' ? undefined : resolvedPlans.comboPlan,
                stageModelPolicy: process.env.NODE_ENV === 'production' ? undefined : stageModelPolicy,
            };
            try {
                if (ENABLE_STAGE_RESULT_CACHE) {
                    writeCachedStageResponse(operationKey, {
                        success: true,
                        runId,
                        imageUrl: generation.imageUrl,
                        provider: generation.provider,
                        model: generation.model,
                        fallbackUsed: generation.fallbackUsed,
                        attemptedModels: generation.attemptedModels,
                        attemptLog: generation.attemptLog,
                        promptVersion,
                        architectureScore: accepted.architectureScore,
                        qualityScore: accepted.qualityScore,
                    });
                }
                recordStageRun({
                    runId,
                    phone,
                    requestKey: operationKey,
                    roomType,
                    style,
                    promptVersion,
                    status: 'success',
                    architectureScore: accepted.architectureScore,
                    qualityScore: accepted.qualityScore,
                    usedCredits: STAGE_COST,
                    beforeImageUrl,
                    afterImageUrl: generation.imageUrl,
                });
            } catch (persistError) {
                console.error('Stage persistence warning:', persistError);
            }
            return NextResponse.json(response);
        });
    } catch (error: unknown) {
        console.error('Stage API Error:', error);
        if (chargedCredits > 0 && chargedPhone) {
            try {
                await addCredits(chargedPhone, chargedCredits, 'auto_refund_stage_error');
            } catch (refundError) {
                console.error('Stage auto refund failed:', refundError);
            }
        }
        trackStageFailure('provider', startedAt);
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

async function fileToDataUrl(file: File): Promise<string> {
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mime = file.type || 'image/jpeg';
    return `data:${mime};base64,${bytes}`;
}

function pickAutoStyleIntensity(
    metrics: { sharpness: number; stdLuma: number; meanLuma: number },
    cap: 'medium' | 'high' = 'high'
): 'low' | 'medium' | 'high' {
    const weakImage = metrics.sharpness < 0.012 || metrics.stdLuma < 0.08;
    const brightBalanced = metrics.meanLuma > 0.3 && metrics.meanLuma < 0.75;
    const picked = weakImage ? 'medium' : brightBalanced ? 'high' : 'medium';
    if (cap === 'medium' && picked === 'high') return 'medium';
    return picked;
}

function buildRetryPrompt(basePrompt: string, reason: 'architecture' | 'quality'): string {
    if (reason === 'quality') {
        return `${basePrompt}

RETRY MODE (QUALITY):
- Keep architecture unchanged.
- Improve clarity, edge crispness, and balanced exposure.
- Remove haze, ghosting, seam bands, low contrast, and incomplete objects.
- Ensure furniture edges are complete and opaque.`;
    }
    return `${basePrompt}

RETRY MODE (ARCHITECTURE):
- Keep window frame geometry, wall corners, ceiling line, and room depth exactly identical.
- Do not move any fixed architectural/electrical anchor point.
- Do not alter camera pose, focal perspective, or room proportions.
- Do not add any new wall, partition, or vertical plane.
- Prioritize architectural fidelity over decoration density.`;
}

function buildFastTimeoutPrompt(basePrompt: string): string {
    return `${basePrompt}

FAST RETRY MODE:
- Keep architecture unchanged.
- Use essential furniture only.
- Keep styling clean and restrained.
- Avoid dense decor, tiny accessories, and complex secondary edits.
- Prioritize a complete, photorealistic result quickly.`;
}
