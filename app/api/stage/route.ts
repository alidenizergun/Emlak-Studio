import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { addCredits, deductCredits, getCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
import { verifyStageArtifacts } from '@/lib/stage-artifact-guard';
import {
    validateInputImageQuality,
    verifyOutputImageQuality,
} from '@/lib/image-quality-guard';
import { normalizeImageForStage } from '@/lib/image-normalization';
import { applyArchitectureStructureLock } from '@/lib/structure-lock';
import { validateRoomTypeSanity } from '@/lib/room-type-guard';
import { postprocessListingImage } from '@/lib/output-postprocess';
import {
    snapshotStageMetrics,
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
    noteHardBlockFailure,
    notePromptAttempt,
    readCachedStageResponse,
    recordStageRun,
    withStageIdempotency,
    writeCachedStageResponse,
} from '@/lib/stage-runtime';
import { generateStagePrompt, resolveStagePromptPlans } from '@/lib/stage-prompt';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';

const STAGE_COST = TOOL_CREDIT_COSTS.stage;
const ENABLE_STAGE_RETRY = process.env.STAGE_ENABLE_AUTO_RETRY !== '0';
const ENABLE_STAGE_RESULT_CACHE = false;
const STAGE_MIN_QUALITY_ACCEPT_SCORE = Number(process.env.STAGE_MIN_QUALITY_ACCEPT_SCORE || 0.44);

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
        const inputQuality = await validateInputImageQuality(normalizedImage, 'stage');
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

            const first = await runStageAttempt(
                normalizedImage,
                prompt,
                normalized.watermarkSuspected,
                adaptivePolicy.firstLockStrength,
                adaptivePolicy.architectureThreshold
            );
            let accepted = first;

            if (!accepted.ok && ENABLE_STAGE_RETRY) {
                const budget = consumeRetryBudget(phone);
                if (budget.allowed) {
                    trackStageRetry();
                    const retryPrompt = buildRetryPrompt(prompt, accepted.reason || 'architecture');
                    const retryLockStrength =
                        accepted.reason === 'quality'
                            ? adaptivePolicy.retryLockQuality
                            : adaptivePolicy.retryLockArchitecture;
                    const second = await runStageAttempt(
                        normalizedImage,
                        retryPrompt,
                        normalized.watermarkSuspected,
                        retryLockStrength,
                        adaptivePolicy.architectureThreshold
                    );
                    const firstQualityScore = Number(first.qualityScore ?? 0);
                    const secondQualityScore = Number(second.qualityScore ?? 0);
                    accepted =
                        second.ok || secondQualityScore > firstQualityScore
                            ? second
                            : first;
                }
            }
            if (!accepted.ok) {
                // Kullanıcı isteği: kalite/mimari eşik takılsa da her işlem sonuç üretsin.
                accepted = { ...accepted, ok: true, softAccepted: true };
            }

            if (first.ok) trackStageFirstPassSuccess();
            notePromptAttempt(promptVersion, true);
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
                imageUrl: accepted.generation.imageUrl,
                provider: accepted.generation.provider,
                model: accepted.generation.model,
                fallbackUsed: accepted.generation.fallbackUsed,
                attemptedModels: accepted.generation.attemptedModels,
                attemptLog: process.env.NODE_ENV === 'production' ? undefined : accepted.generation.attemptLog,
                promptVersion,
                architectureScore: accepted.architectureScore,
                qualityScore: accepted.qualityScore,
                architectureRelaxed: Boolean(accepted.softAccepted),
                credits: creditResult.credits,
                usedCredits: STAGE_COST,
                cached: false,
                stageMetrics: snapshotStageMetrics(),
                promptLearning: process.env.NODE_ENV === 'production' ? undefined : promptLearning.stats,
                resolvedRoomPlan: process.env.NODE_ENV === 'production' ? undefined : resolvedPlans.roomPlan,
                resolvedStylePlan: process.env.NODE_ENV === 'production' ? undefined : resolvedPlans.stylePlan,
                resolvedComboPlan: process.env.NODE_ENV === 'production' ? undefined : resolvedPlans.comboPlan,
            };
            try {
                if (ENABLE_STAGE_RESULT_CACHE) {
                    writeCachedStageResponse(operationKey, {
                        success: true,
                        runId,
                        imageUrl: accepted.generation.imageUrl,
                        provider: accepted.generation.provider,
                        model: accepted.generation.model,
                        fallbackUsed: accepted.generation.fallbackUsed,
                        attemptedModels: accepted.generation.attemptedModels,
                        attemptLog: accepted.generation.attemptLog,
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
                    afterImageUrl: accepted.generation.imageUrl,
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
- Keep architecture constraints unchanged.
- Improve local clarity, edge crispness, and balanced exposure.
- Avoid soft, hazy, low-contrast output.
- Remove any foggy/milky veil and restore crisp local contrast on walls, floor, and furniture.
- Remove any semi-transparent remnants, double-exposure artifacts, or incomplete objects.
- Eliminate any horizontal/vertical ghost band and seam-like overlay.
- Ensure every furniture edge is complete and fully opaque (no cut/half-rendered parts).`;
    }
    return `${basePrompt}

RETRY MODE (ARCHITECTURE):
- This is a failed previous attempt.
- Keep window frame geometry, wall corners, ceiling line, and room depth exactly identical.
- Do not move any fixed architectural/electrical anchor point.
- Do not alter camera pose, focal perspective, or room proportions.
- Do not add any new wall/partition/vertical plane. Right-side geometry and edge lines must be pixel-faithful to input.
- Prioritize architectural fidelity over decoration density.`;
}

async function runStageAttempt(
    image: File,
    prompt: string,
    watermarkSuspected: boolean,
    lockStrength = 0.82,
    architectureThreshold?: number
): Promise<{
    ok: boolean;
    reason?: 'architecture' | 'quality';
    architectureScore?: number;
    qualityScore?: number;
    softAccepted?: boolean;
    artifactScore?: number;
    generation: Awaited<ReturnType<typeof generateEditedImageWithNanoBanana>>;
}> {
    const generation = await generateEditedImageWithNanoBanana({ image, prompt });
    const safeLockStrength = Math.max(0.55, Math.min(0.9, lockStrength));
    const lockedImageUrl = await applyArchitectureStructureLock(
        image,
        generation.imageUrl,
        watermarkSuspected ? Math.min(safeLockStrength, 0.76) : safeLockStrength
    );
    const finalizedImageUrl = await postprocessListingImage(lockedImageUrl, { tool: 'stage' });
    const lockedGeneration = { ...generation, imageUrl: finalizedImageUrl };
    const threshold = Number.isFinite(Number(architectureThreshold))
        ? Number(architectureThreshold)
        : Number(process.env.ARCH_GUARD_THRESHOLD || 0.55);
    const firstIntegrity = await verifyArchitectureIntegrity(image, lockedGeneration.imageUrl, threshold);
    let chosenGeneration = lockedGeneration;
    let chosenIntegrity = firstIntegrity;

    if (!firstIntegrity.ok) {
        const aggressiveLockStrength = watermarkSuspected ? 0.9 : 0.98;
        const aggressiveLockedImageUrl = await applyArchitectureStructureLock(
            image,
            generation.imageUrl,
            aggressiveLockStrength
        );
        const aggressiveFinalized = await postprocessListingImage(aggressiveLockedImageUrl, { tool: 'stage' });
        const aggressiveGeneration = { ...generation, imageUrl: aggressiveFinalized };
        const aggressiveIntegrity = await verifyArchitectureIntegrity(image, aggressiveGeneration.imageUrl, threshold);
        if (aggressiveIntegrity.score > chosenIntegrity.score) {
            chosenGeneration = aggressiveGeneration;
            chosenIntegrity = aggressiveIntegrity;
        }
    }

    const quality = await verifyOutputImageQuality(image, chosenGeneration.imageUrl, 'stage');
    if (!quality.ok) {
        const score = Number(quality.score ?? 0);
        if (score >= STAGE_MIN_QUALITY_ACCEPT_SCORE) {
            return {
                ok: true,
                architectureScore: chosenIntegrity.score,
                qualityScore: score,
                softAccepted: true,
                generation: chosenGeneration,
            };
        }
        return {
            ok: false,
            reason: 'quality',
            architectureScore: chosenIntegrity.score,
            qualityScore: score,
            generation: chosenGeneration,
        };
    }
    const artifact = await verifyStageArtifacts(image, chosenGeneration.imageUrl);
    if (!artifact.ok) {
        return {
            ok: false,
            reason: 'quality',
            architectureScore: chosenIntegrity.score,
            qualityScore: Math.max(quality.score ?? 0, 0.35),
            artifactScore: artifact.score,
            generation: chosenGeneration,
        };
    }

    if (chosenIntegrity.ok) {
        return {
            ok: true,
            architectureScore: chosenIntegrity.score,
            qualityScore: quality.score,
            artifactScore: artifact.score,
            generation: chosenGeneration,
        };
    }

    return {
        ok: false,
        reason: 'architecture',
        architectureScore: chosenIntegrity.score,
        qualityScore: quality.score,
        artifactScore: artifact.score,
        generation: chosenGeneration,
    };
}
