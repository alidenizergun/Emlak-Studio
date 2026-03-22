import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { buildRemoveObjectPrompt, type RemoveMode } from '@/app/remove-object/prompts';
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

const ENABLE_REMOVE_RETRY = process.env.REMOVE_OBJECT_ENABLE_AUTO_RETRY !== '0';

export async function POST(request: NextRequest) {
    let chargedPhone = '';
    let chargedCredits = 0;
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const mode = ((formData.get('mode') as string) || 'all') as RemoveMode;
        const userPrompt = clampText((formData.get('userPrompt') as string) || '', 320);
        const clientPrompt = clampText((formData.get('prompt') as string) || '', 600);
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

        if (!['all', 'prompt'].includes(mode)) {
            return NextResponse.json(
                { success: false, error: 'Gecersiz silme modu' },
                { status: 400 }
            );
        }

        if (mode === 'prompt' && !userPrompt) {
            return NextResponse.json(
                { success: false, error: 'Belirli eşya silme için açıklama gerekli' },
                { status: 400 }
            );
        }

        const prompt = clientPrompt || buildRemoveObjectPrompt(mode, userPrompt);
        const adaptivePolicy = getToolAdaptivePolicy('remove-object');

        const inputQuality = await validateInputImageForProcessing(image, 'remove-object');
        if (!inputQuality.ok) {
            return NextResponse.json(
                { success: false, code: 'INPUT_QUALITY_LOW', error: inputQuality.error },
                { status: 422 }
            );
        }

        let generation = await generateEditedImageWithNanoBanana({ image, prompt });
        let finalizedImageUrl = await postprocessListingImage(generation.imageUrl, { tool: 'remove-object' });
        let integrity = await verifyArchitectureIntegrity(image, finalizedImageUrl, adaptivePolicy.architectureThreshold);
        let quality = await verifyOutputImageQuality(image, finalizedImageUrl, 'remove-object');

        if ((!integrity.ok || !quality.ok) && ENABLE_REMOVE_RETRY && adaptivePolicy.retryEnabled) {
            const retryPrompt = `${prompt}

RETRY MODE:
- Keep architecture, perspective, and room geometry strictly unchanged.
- Remove only requested objects; do not alter structural lines.
- Improve clarity and avoid blurry or low-contrast output.
- Enforce clean inpainting: no ghost traces, no semi-transparent leftovers, no black patches, no double edges.
- If mode is "all", output must look like a truly empty room (all movable items removed).
- If mode is "all", also remove visible decorative lighting fixtures such as chandeliers, pendant lights, sconces, and hanging lamps, while keeping ceiling geometry and fixture connection point architecture intact.
- If lighting is dark/flat, rebalance exposure and shadows for a bright natural listing look.
- Rebuild removed regions with continuous floor/wall texture direction and realistic contact shadows.
- Return one complete edited image only (no partial/failed output).
${adaptivePolicy.retryPromptBoost || adaptivePolicy.postprocessBoost
    ? '- Adaptive rule: remove semi-transparent traces and double-exposure artifacts around removed zones.'
    : ''}`;
            const retry = await generateEditedImageWithNanoBanana({ image, prompt: retryPrompt });
            const retryFinal = await postprocessListingImage(retry.imageUrl, { tool: 'remove-object' });
            const retryIntegrity = await verifyArchitectureIntegrity(image, retryFinal, adaptivePolicy.architectureThreshold);
            const retryQuality = await verifyOutputImageQuality(image, retryFinal, 'remove-object');
            if (retryIntegrity.ok && retryQuality.ok) {
                generation = retry;
                finalizedImageUrl = retryFinal;
                integrity = retryIntegrity;
                quality = retryQuality;
            }
        }

        if (!integrity.ok) {
            recordToolAdaptiveOutcome('remove-object', { ok: false, reason: 'architecture' });
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
        if (!quality.ok) {
            recordToolAdaptiveOutcome('remove-object', { ok: false, reason: 'quality' });
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

        const cost = mode === 'all' ? TOOL_CREDIT_COSTS.removeObjectAll : TOOL_CREDIT_COSTS.removeObjectPrompt;
        const creditResult = await deductCredits(phone, cost, `tool_remove_object_${mode}`);
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }
        chargedCredits = cost;
        recordToolAdaptiveOutcome('remove-object', { ok: true });
        const runId = randomUUID();
        const beforeImageUrl = await fileToDataUrl(image);
        recordToolRun({
            runId,
            phone,
            toolId: 'remove-object',
            beforeImageUrl,
            afterImageUrl: finalizedImageUrl,
            title: 'Akıllı Eşya Silme',
            detail: mode === 'all' ? 'Tüm eşyalar silindi' : `İstek: ${userPrompt || 'Belirli eşya silme'}`,
            usedCredits: cost,
        });

        return NextResponse.json({
            success: true,
            runId,
            imageUrl: finalizedImageUrl,
            mode,
            prompt,
            userPrompt: userPrompt || undefined,
            provider: generation.provider,
            model: generation.model,
            fallbackUsed: generation.fallbackUsed,
            attemptedModels: generation.attemptedModels,
            attemptLog: process.env.NODE_ENV === 'production' ? undefined : generation.attemptLog,
            architectureScore: integrity.score,
            qualityScore: quality.score,
            credits: creditResult.credits,
            usedCredits: cost,
        });
    } catch (error: unknown) {
        console.error('Remove-object API error:', error);
        recordToolAdaptiveOutcome('remove-object', { ok: false, reason: 'provider' });
        if (chargedCredits > 0 && chargedPhone) {
            try {
                await addCredits(chargedPhone, chargedCredits, 'auto_refund_remove_object_error');
            } catch (refundError) {
                console.error('Remove-object auto refund failed:', refundError);
            }
        }
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

async function fileToDataUrl(file: File): Promise<string> {
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mime = file.type || 'image/jpeg';
    return `data:${mime};base64,${bytes}`;
}
