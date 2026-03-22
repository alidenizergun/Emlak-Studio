import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { addCredits, deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
import { validateInputImageForProcessing, verifyOutputImageQuality } from '@/lib/image-quality-guard';
import { postprocessListingImage } from '@/lib/output-postprocess';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';
import { getToolAdaptivePolicy, recordToolAdaptiveOutcome } from '@/lib/tool-adaptive';
import { recordToolRun } from '@/lib/work-history';

const ENABLE_RENOVATION_RETRY = process.env.RENOVATION_ENABLE_AUTO_RETRY !== '0';

export async function POST(request: NextRequest) {
    let chargedPhone = '';
    let chargedCredits = 0;
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const instructions = clampText((formData.get('instructions') as string) || '', 800);
        const phone = String(formData.get('phone') || '');
        chargedPhone = phone;
        const uploadCheck = validateUploadedImage(image);
        if (!uploadCheck.ok) {
            return NextResponse.json(
                { success: false, error: uploadCheck.error },
                { status: 400 }
            );
        }
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'İşlem için giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;
        const inputQuality = await validateInputImageForProcessing(image, 'virtual-renovation');
        if (!inputQuality.ok) {
            return NextResponse.json(
                { success: false, code: 'INPUT_QUALITY_LOW', error: inputQuality.error },
                { status: 422 }
            );
        }
        const adaptivePolicy = getToolAdaptivePolicy('virtual-renovation');
        const allowArchitecturalChanges = hasExplicitArchitectureChangeRequest(instructions);
        const prompt = buildVirtualRenovationPrompt(instructions, allowArchitecturalChanges);
        let generation = await generateEditedImageWithNanoBanana({
            image,
            prompt,
            allowArchitecturalChanges,
        });
        let finalizedImageUrl = await postprocessListingImage(generation.imageUrl, { tool: 'virtual-renovation' });

        let integrity = allowArchitecturalChanges
            ? { ok: true, score: 1 }
            : await verifyArchitectureIntegrity(image, finalizedImageUrl, adaptivePolicy.architectureThreshold);
        let quality = await verifyOutputImageQuality(image, finalizedImageUrl, 'virtual-renovation');

        if ((!integrity.ok || !quality.ok) && ENABLE_RENOVATION_RETRY && adaptivePolicy.retryEnabled) {
            const retryPrompt = `${prompt}

RETRY MODE:
- Keep perspective and camera framing unchanged.
- Keep structural geometry stable unless explicitly requested by user.
- Increase clarity, realism, and listing quality; avoid blur/haze.
${adaptivePolicy.retryPromptBoost || adaptivePolicy.postprocessBoost
    ? '- Adaptive rule: clean artifacts and avoid semi-transparent/unfinished rendered furniture or finishes.'
    : ''}`;
            const retry = await generateEditedImageWithNanoBanana({
                image,
                prompt: retryPrompt,
                allowArchitecturalChanges,
            });
            const retryFinal = await postprocessListingImage(retry.imageUrl, { tool: 'virtual-renovation' });
            const retryIntegrity = allowArchitecturalChanges
                ? { ok: true, score: 1 }
                : await verifyArchitectureIntegrity(image, retryFinal, adaptivePolicy.architectureThreshold);
            const retryQuality = await verifyOutputImageQuality(image, retryFinal, 'virtual-renovation');
            if (retryIntegrity.ok && retryQuality.ok) {
                generation = retry;
                finalizedImageUrl = retryFinal;
                integrity = retryIntegrity;
                quality = retryQuality;
            }
        }

        if (!allowArchitecturalChanges) {
            if (!integrity.ok) {
                recordToolAdaptiveOutcome('virtual-renovation', { ok: false, reason: 'architecture' });
                return NextResponse.json(
                    {
                        success: false,
                        code: 'ARCHITECTURE_CHANGED',
                        error: `Mimari detaylar korunamadi (skor: ${integrity.score.toFixed(2)}). Lutfen tekrar deneyin.`,
                        architectureScore: integrity.score,
                    },
                    { status: 422 }
                );
            }
        }
        if (!quality.ok) {
            recordToolAdaptiveOutcome('virtual-renovation', { ok: false, reason: 'quality' });
            return NextResponse.json(
                {
                    success: false,
                    code: 'OUTPUT_QUALITY_LOW',
                    error: quality.error || 'Cikti kalite kontrolden gecemedi.',
                    qualityScore: quality.score,
                },
                { status: 422 }
            );
        }

        const creditResult = await deductCredits(phone, TOOL_CREDIT_COSTS.virtualRenovation, 'tool_virtual_renovation');
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }
        chargedCredits = TOOL_CREDIT_COSTS.virtualRenovation;
        recordToolAdaptiveOutcome('virtual-renovation', { ok: true });
        const runId = randomUUID();
        const beforeImageUrl = await fileToDataUrl(image);
        recordToolRun({
            runId,
            phone,
            toolId: 'virtual-renovation',
            beforeImageUrl,
            afterImageUrl: finalizedImageUrl,
            title: 'Sanal Tadilat',
            detail: instructions || 'Genel tadilat uygulandı',
            usedCredits: TOOL_CREDIT_COSTS.virtualRenovation,
        });

        return NextResponse.json({
            success: true,
            runId,
            imageUrl: finalizedImageUrl,
            provider: generation.provider,
            model: generation.model,
            fallbackUsed: generation.fallbackUsed,
            attemptedModels: generation.attemptedModels,
            attemptLog: process.env.NODE_ENV === 'production' ? undefined : generation.attemptLog,
            architectureScore: allowArchitecturalChanges ? undefined : integrity.score,
            qualityScore: quality.score,
            credits: creditResult.credits,
            usedCredits: TOOL_CREDIT_COSTS.virtualRenovation,
        });
    } catch (error: unknown) {
        recordToolAdaptiveOutcome('virtual-renovation', { ok: false, reason: 'provider' });
        if (chargedCredits > 0 && chargedPhone) {
            try {
                await addCredits(chargedPhone, chargedCredits, 'auto_refund_renovation_error');
            } catch (refundError) {
                console.error('Renovation auto refund failed:', refundError);
            }
        }
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

async function fileToDataUrl(file: File): Promise<string> {
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mime = file.type || 'image/jpeg';
    return `data:${mime};base64,${bytes}`;
}

function hasExplicitArchitectureChangeRequest(instructions: string): boolean {
    const text = instructions.toLowerCase();
    if (!text.trim()) return false;
    const architectureChangeKeywords = [
        'duvar',
        'kolon',
        'kiriş',
        'tavanı yükselt',
        'tavanı alçalt',
        'pencere',
        'kapı',
        'odayı büyüt',
        'odayı küçült',
        'metrekare',
        'm2',
        'm²',
        'genişlet',
        'daralt',
        'layout',
        'floor plan',
        'window',
        'door',
        'ceiling',
        'column',
        'wall',
    ];
    return architectureChangeKeywords.some((keyword) => text.includes(keyword));
}

function buildVirtualRenovationPrompt(instructions: string, allowArchitecturalChanges: boolean): string {
    const task = instructions.trim() || 'Apply a modern and clean virtual renovation.';
    const architectureRule = allowArchitecturalChanges
        ? 'User explicitly requested architectural edits. Apply only those requested architectural changes; keep all other architecture unchanged.'
        : 'Do not change architecture, room dimensions, columns, ceilings, window/door positions, or structural geometry.';
    return `
Task: Apply a realistic virtual renovation to this real-estate photo.

User renovation request:
${task}

Rules:
- ${architectureRule}
- Preserve original perspective, camera framing, and lens feel.
- If the floor is dirty in the uploaded image, clean it completely (remove all visible dirt/stain/dust marks) while preserving floor material, seams/patterns, and geometry.
- Remove visible logos/watermarks naturally.
- Improve lighting and sharpness to premium listing quality.
- Do not add people, logos, text, or watermarks.
- Output must be photorealistic and listing-ready.
`.trim();
}
