import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { buildRemoveObjectPrompt, type RemoveMode } from '@/app/remove-object/prompts';
import { addCredits, deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { validateInputImageForProcessing } from '@/lib/image-quality-guard';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';
import { getToolAdaptivePolicy, recordToolAdaptiveOutcome } from '@/lib/tool-adaptive';
import { recordToolRun } from '@/lib/work-history';
import { resolveRemoveObjectModelPolicy } from '@/lib/gemini-tool-policy';
import { orchestrateVisualGeneration } from '@/lib/gemini-orchestrator';

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

        const modelPolicy = resolveRemoveObjectModelPolicy({
            mode,
            qualityScore: inputQuality.score,
            metrics: inputQuality.metrics,
            userPrompt,
        });
        const result = await orchestrateVisualGeneration({
            image,
            prompt,
            preferredModels: modelPolicy.models,
            tool: 'remove-object',
            policyClass: modelPolicy.difficulty,
            policyRationale: modelPolicy.rationale,
            architectureThreshold: adaptivePolicy.architectureThreshold,
            retryPrompt:
                ENABLE_REMOVE_RETRY && adaptivePolicy.retryEnabled
                    ? (basePrompt) => `${basePrompt}

RETRY MODE:
- Keep architecture, perspective, and room geometry strictly unchanged.
- Remove only requested objects; do not alter structural lines.
- Improve clarity and avoid blur, haze, dark patches, ghost traces, semi-transparent leftovers, and double edges.
- If mode is "all", output must read as a truly empty room.
- Rebuild removed regions with continuous texture and realistic contact shadows.
${adaptivePolicy.retryPromptBoost || adaptivePolicy.postprocessBoost
    ? '- Stronger cleanup on semi-transparent traces and double-exposure artifacts.'
    : ''}`
                    : undefined,
            fastRetryPrompt: (basePrompt) => `${basePrompt}

FAST RETRY MODE:
- Keep architecture unchanged.
- Remove only the requested items.
- Prefer a clean completed result over aggressive cleanup detail.`,
        });

        if (!result.ok && result.reason === 'architecture') {
            recordToolAdaptiveOutcome('remove-object', { ok: false, reason: 'architecture' });
            return NextResponse.json(
                {
                    success: false,
                    code: 'ARCHITECTURE_CHANGED',
                    error: result.error || 'Mimari detaylar korunamadı.',
                    architectureScore: result.architectureScore,
                    selectedModel: result.telemetry.selectedModel,
                    selectedModelClass: result.telemetry.selectedPolicyClass,
                    retryCount: result.telemetry.retryCount,
                    fallbackUsed: result.telemetry.fallbackUsed,
                    timing: result.telemetry.timing,
                },
                { status: 422 }
            );
        }
        if (!result.ok) {
            recordToolAdaptiveOutcome('remove-object', { ok: false, reason: 'quality' });
            return NextResponse.json(
                {
                    success: false,
                    code: 'OUTPUT_QUALITY_LOW',
                    error: result.error || 'Cikti kalite kontrolden gecemedi.',
                    qualityScore: result.qualityScore,
                    artifactScore: result.artifactScore,
                    selectedModel: result.telemetry.selectedModel,
                    selectedModelClass: result.telemetry.selectedPolicyClass,
                    retryCount: result.telemetry.retryCount,
                    fallbackUsed: result.telemetry.fallbackUsed,
                    timing: result.telemetry.timing,
                },
                { status: result.reason === 'timeout' ? 504 : 422 }
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
        let responseImageUrl = result.imageUrl;
        try {
            recordToolRun({
                runId,
                phone,
                toolId: 'remove-object',
                beforeImageUrl,
                afterImageUrl: result.imageUrl!,
                title: 'Akıllı Eşya Silme',
                detail: mode === 'all' ? 'Tüm eşyalar silindi' : `İstek: ${userPrompt || 'Belirli eşya silme'}`,
                usedCredits: cost,
            });
            const historyEntryId = `remove-object:${runId}`;
            responseImageUrl = `/api/stage/history-image?entryId=${encodeURIComponent(historyEntryId)}&kind=after`;
        } catch (persistError) {
            console.error('Remove-object work-history warning:', persistError);
        }

        return NextResponse.json({
            success: true,
            runId,
            imageUrl: responseImageUrl,
            mode,
            prompt,
            userPrompt: userPrompt || undefined,
            provider: result.generation?.provider,
            model: result.generation?.model,
            selectedModel: result.telemetry.selectedModel,
            fallbackUsed: result.telemetry.fallbackUsed,
            attemptedModels: result.generation?.attemptedModels,
            attemptLog: process.env.NODE_ENV === 'production' ? undefined : result.generation?.attemptLog,
            architectureScore: result.architectureScore,
            qualityScore: result.qualityScore,
            artifactScore: result.artifactScore,
            selectedModelClass: result.telemetry.selectedPolicyClass,
            selectedModelRationale: process.env.NODE_ENV === 'production' ? undefined : modelPolicy.rationale,
            retryCount: result.telemetry.retryCount,
            timing: result.telemetry.timing,
            acceptanceReason: result.telemetry.acceptanceReason,
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
