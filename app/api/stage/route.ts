import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { addCredits, deductCredits, getCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
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
    isHardBlocked,
    noteHardBlockFailure,
    notePromptAttempt,
    readCachedStageResponse,
    recordStageRun,
    withStageIdempotency,
    writeCachedStageResponse,
} from '@/lib/stage-runtime';
import { validateUploadedImage } from '@/lib/upload-guard';

const STAGE_COST = TOOL_CREDIT_COSTS.stage;
const ENABLE_STAGE_RETRY = process.env.STAGE_ENABLE_AUTO_RETRY !== '0';

export async function POST(request: NextRequest) {
    const startedAt = trackStageStart();
    let chargedPhone = '';
    let chargedCredits = 0;
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const roomType = formData.get('roomType') as string;
        const style = formData.get('style') as string;
        const phone = String(formData.get('phone') || '');
        chargedPhone = phone;
        const idempotencyKey = String(formData.get('idempotencyKey') || '').trim();

        if (!image || !roomType || !style) {
            return NextResponse.json({ success: false, error: 'Gerekli alanlar eksik' }, { status: 400 });
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
        const requestKey = await buildStageRequestKey(normalizedImage, roomType, style, promptVersion);
        const operationKey = idempotencyKey
            ? createHash('sha256').update(requestKey).update(':').update(idempotencyKey).digest('hex')
            : requestKey;
        const cached = readCachedStageResponse(operationKey);
        if (cached) {
            const currentCredits = await getCredits(phone);
            return NextResponse.json({
                ...cached,
                cached: true,
                usedCredits: 0,
                credits: currentCredits,
                stageMetrics: snapshotStageMetrics(),
            });
        }

        return await withStageIdempotency(operationKey, async () => {
            const runId = randomUUID();
            const adaptivePolicy = getStageAdaptivePolicy();
            const styleIntensity = pickAutoStyleIntensity(inputQuality.metrics, adaptivePolicy.styleIntensityCap);
            const prompt = generateStagePrompt({
                roomType,
                style,
                styleIntensity,
                watermarkSuspected: normalized.watermarkSuspected,
                watermarkCropApplied: normalized.watermarkCropApplied,
                promptVersion,
                cleanupBoost: adaptivePolicy.cleanupBoost,
                antiGhostBoost: adaptivePolicy.antiGhostBoost,
            });

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
                    accepted = second.ok ? second : first;
                }
            }

            if (!accepted.ok) {
                notePromptAttempt(promptVersion, false);
                noteHardBlockFailure(roomType, style);
                trackStageFailure(accepted.reason === 'quality' ? 'output_quality' : 'architecture', startedAt);
                recordStageRun({
                    runId,
                    phone,
                    requestKey: operationKey,
                    roomType,
                    style,
                    promptVersion,
                    status: 'failed',
                    failCode: accepted.reason === 'quality' ? 'OUTPUT_QUALITY_LOW' : 'ARCHITECTURE_CHANGED',
                    architectureScore: accepted.architectureScore,
                    qualityScore: accepted.qualityScore,
                    beforeImageUrl,
                });
                return NextResponse.json(
                    {
                        success: false,
                        code: accepted.reason === 'quality' ? 'OUTPUT_QUALITY_LOW' : 'ARCHITECTURE_CHANGED',
                        error:
                            accepted.reason === 'quality'
                                ? `Cikti kalite kontrolden gecmedi (skor: ${accepted.qualityScore?.toFixed(2)}).`
                                : `Mimari detaylar korunamadi (skor: ${accepted.architectureScore?.toFixed(2)}).`,
                        runId,
                        architectureScore: accepted.architectureScore,
                        qualityScore: accepted.qualityScore,
                    },
                    { status: 422 }
                );
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
                promptVersion,
                architectureScore: accepted.architectureScore,
                qualityScore: accepted.qualityScore,
                credits: creditResult.credits,
                usedCredits: STAGE_COST,
                cached: false,
                stageMetrics: snapshotStageMetrics(),
            };
            try {
                writeCachedStageResponse(operationKey, {
                    success: true,
                    runId,
                    imageUrl: accepted.generation.imageUrl,
                    provider: accepted.generation.provider,
                    model: accepted.generation.model,
                    promptVersion,
                    architectureScore: accepted.architectureScore,
                    qualityScore: accepted.qualityScore,
                });
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

function generateStagePrompt(input: {
    roomType: string;
    style: string;
    styleIntensity: 'low' | 'medium' | 'high';
    watermarkSuspected: boolean;
    watermarkCropApplied: boolean;
    promptVersion: 'A' | 'B';
    cleanupBoost: boolean;
    antiGhostBoost: boolean;
}): string {
    const roomLabel = ROOM_LABELS[input.roomType] || 'room';
    const styleGuideline = STYLE_GUIDELINES[input.style] || 'balanced and realistic furnishing';
    const styleAnchor = STYLE_ANCHORS[input.style] || STYLE_ANCHORS.default;
    const roomLayoutGuideline = ROOM_LAYOUT_GUIDELINES[input.roomType] || ROOM_LAYOUT_GUIDELINES.default;
    const roomMustHave = ROOM_MUST_HAVE[input.roomType] || ROOM_MUST_HAVE.default;
    const watermarkRule = input.watermarkSuspected
        ? '- Input may contain watermark text. Keep text zone geometry unchanged and avoid over-editing around those pixels.'
        : '- Keep any existing text regions stable; do not hallucinate new text.';
    const cropRule = input.watermarkCropApplied
        ? '- A safe crop was applied to reduce watermark artifacts; preserve new frame geometry exactly.'
        : '';
    const versionRule =
        input.promptVersion === 'A'
            ? '- Emphasize architectural fidelity over decoration richness.'
            : '- Emphasize realistic furnishing coherence while preserving all architecture.';
    const adaptiveCleanupRule = input.cleanupBoost
        ? '- Adaptive quality rule: run stricter cleanup pass so floor/walls are visibly clean and residue-free.'
        : '';
    const adaptiveGhostRule = input.antiGhostBoost
        ? '- Adaptive quality rule: enforce zero ghosting; reject semi-transparent or partially rendered furniture.'
        : '';
    return `Task: Furnish this ${roomLabel} with ${styleGuideline}.
STRICT CONSTRAINTS:
- Keep architecture identical to the uploaded photo: room dimensions, column positions, wall lines, ceiling geometry, window and door locations must remain unchanged.
- Keep original layout, perspective, camera angle, framing, and lens feel.
- Clean floor and surfaces (remove dirt, stains, smudges, dust) while preserving original floor material and tile/texture layout.
- Remove temporary renovation/construction clutter completely (tools, bags, loose items, debris) and leave no semi-visible traces.
- Improve lighting, exposure and sharpness to premium real-estate quality without geometric changes.
- Decoration density must be ${input.styleIntensity}. Do not overfill the room.
- Place furniture with realistic interior-design logic based on room geometry:
  - Keep clear walking paths and entry circulation.
  - Respect window and door clearance; do not block openings.
  - Match furniture scale to room size; avoid oversized pieces.
  - Avoid object collisions, clipping, floating, or impossible spacing.
  - Anchor large items to plausible walls and keep visual balance.
- Room-type layout blueprint:
  - ${roomLayoutGuideline}
- Required room function signature:
  - ${roomMustHave}
- Style signature cues:
  - ${styleAnchor}
- Furniture and decor must be fully opaque and physically grounded. No transparent, ghosted, floating, or double-exposure objects.
- Every placed object must be fully rendered and physically consistent with floor/wall contact and shadows.
- For dressing room tasks, include a complete modern dressing setup (wardrobe modules, mirror, bench/ottoman, organized storage accents) while keeping architecture fixed.
- Curtains/blinds/tulle may be added on existing windows as decor, but window frame geometry and position must remain unchanged.
- Wall decor is allowed in measured amount: style-matching framed artworks and a subtle wall clock can be added if they fit scale and do not clutter walls.
- Keep wall accessories proportional and sparse; avoid excessive gallery-wall density.
${watermarkRule}
${cropRule}
${versionRule}
${adaptiveCleanupRule}
${adaptiveGhostRule}
Output: one ultra-photorealistic listing-ready image.`;
}

function buildRetryPrompt(basePrompt: string, reason: 'architecture' | 'quality'): string {
    if (reason === 'quality') {
        return `${basePrompt}

RETRY MODE (QUALITY):
- Keep architecture constraints unchanged.
- Improve local clarity, edge crispness, and balanced exposure.
- Avoid soft, hazy, low-contrast output.
- Remove any semi-transparent remnants, double-exposure artifacts, or incomplete objects.`;
    }
    return `${basePrompt}

RETRY MODE (ARCHITECTURE):
- This is a failed previous attempt.
- Keep window frame geometry, wall corners, ceiling line, and room depth exactly identical.
- Do not alter camera pose, focal perspective, or room proportions.
- Prioritize architectural fidelity over decoration density.`;
}

const ROOM_LABELS: Record<string, string> = {
    salon: 'living room',
    living_room: 'living room',
    bedroom: 'bedroom',
    child_room: 'child bedroom',
    guest_room: 'guest bedroom',
    dressing_room: 'dressing room',
    office: 'home office',
    game_room: 'game room',
    kitchen: 'kitchen',
    bathroom: 'bathroom',
    entryway: 'entryway',
    balcony: 'balcony terrace',
};

const STYLE_GUIDELINES: Record<string, string> = {
    modern: 'modern, clean-lined furniture with neutral palette and subtle accents',
    scandinavian: 'scandinavian style with light wood, soft neutrals, minimal clutter',
    industrial: 'industrial style with matte textures, black accents, and practical furniture',
    bohemian: 'bohemian style with warm textiles and curated layered accessories',
    luxury: 'luxury style with premium materials, elegant lighting, and refined symmetry',
    minimalist: 'minimalist style with low-clutter layout and functional furniture only',
    classic: 'classic style with timeless furniture forms and balanced ornament',
    rustic: 'rustic style with natural wood tones and cozy textures',
};

const STYLE_ANCHORS: Record<string, string> = {
    modern: 'clean straight silhouettes, restrained accents, clear negative space.',
    scandinavian: 'light wood tones, soft textiles, daylight-friendly airy composition.',
    industrial: 'metal/wood mix, matte black details, practical task-oriented pieces.',
    bohemian: 'warm layered textiles, handcrafted accents, controlled natural texture richness.',
    luxury: 'premium finishes, curated symmetry, elegant statement lighting.',
    minimalist: 'very low clutter, essential pieces only, crisp geometry and breathing space.',
    classic: 'timeless forms, balanced ornament, soft traditional detailing.',
    rustic: 'natural grain emphasis, cozy warm palette, handcrafted feel.',
    default: 'cohesive, restrained, realistic style expression.',
};

const ROOM_LAYOUT_GUIDELINES: Record<string, string> = {
    salon: 'establish a social focal layout (sofa + table + media/storage) with balanced spacing and open circulation.',
    living_room: 'use comfortable seating-first layout with clear TV/view direction and practical side storage.',
    bedroom: 'center composition around bed wall; keep side clearances and use minimal supporting furniture.',
    child_room: 'create safe open play zone, compact storage, and soft-edged furniture placement.',
    guest_room: 'place bed and wardrobe compactly with a clean circulation path for temporary stay comfort.',
    dressing_room: 'prioritize wardrobe modules, full-length mirror, bench/ottoman, and organized accessory storage.',
    office: 'focus on desk ergonomics, task lighting area, and uncluttered movement path.',
    game_room: 'reserve central activity space, place gaming/media units on stable walls, keep wires/storage organized.',
    kitchen: 'preserve work triangle logic and keep movement lanes open around prep and storage zones.',
    bathroom: 'keep wet/dry zones visually separated with minimal compact storage and no blocked fixtures.',
    entryway: 'maintain entry clearance, add slim console/storage, and avoid deep furniture near circulation.',
    balcony: 'use lightweight compact seating/planter composition while preserving access and railing visibility.',
    default: 'apply a balanced layout with one clear focal point and uninterrupted walking circulation.',
};

const ROOM_MUST_HAVE: Record<string, string> = {
    salon: 'sofa-centered seating composition, support table(s), and media/storage anchor.',
    living_room: 'primary seating set with clear focal direction and practical side storage.',
    bedroom: 'bed-focused composition with at least one nightstand-side support.',
    child_room: 'sleep element + child-scale storage + safe open activity zone.',
    guest_room: 'compact sleep setup with simple luggage/storage utility.',
    dressing_room: 'wardrobe/storage modules + full mirror + dressing support element.',
    office: 'ergonomic desk setup + working chair + functional storage/task-lighting support.',
    game_room: 'gaming/media focal unit + seating + organized accessory/storage support.',
    kitchen: 'prep/storage continuity and unobstructed cooking workflow lanes.',
    bathroom: 'fixture-safe circulation and compact utility storage where appropriate.',
    entryway: 'entry clearance with slim console/storage and practical arrival function.',
    balcony: 'compact outdoor seating/plant composition while preserving walkway and railing.',
    default: 'clear primary function area with scale-appropriate supporting pieces.',
};

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
    const integrity = await verifyArchitectureIntegrity(image, lockedGeneration.imageUrl, architectureThreshold);
    if (!integrity.ok) {
        return {
            ok: false,
            reason: 'architecture',
            architectureScore: integrity.score,
            generation: lockedGeneration,
        };
    }
    const quality = await verifyOutputImageQuality(image, lockedGeneration.imageUrl, 'stage');
    if (!quality.ok) {
        return {
            ok: false,
            reason: 'quality',
            architectureScore: integrity.score,
            qualityScore: quality.score,
            generation: lockedGeneration,
        };
    }
    return {
        ok: true,
        architectureScore: integrity.score,
        qualityScore: quality.score,
        generation: lockedGeneration,
    };
}
