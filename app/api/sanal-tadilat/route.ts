import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { addCredits, deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { validateInputImageForProcessing } from '@/lib/image-quality-guard';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';
import { getToolAdaptivePolicy, recordToolAdaptiveOutcome } from '@/lib/tool-adaptive';
import { resolveRenovationModelPolicy } from '@/lib/renovation-model-policy';
import { recordToolRun } from '@/lib/work-history';
import { orchestrateVisualGeneration } from '@/lib/gemini-orchestrator';

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
        const renovationModelPolicy = resolveRenovationModelPolicy({
            qualityScore: inputQuality.score,
            metrics: inputQuality.metrics,
            instructions,
            allowArchitecturalChanges,
        });
        const prompt = buildVirtualRenovationPrompt(instructions, allowArchitecturalChanges);
        const result = await orchestrateVisualGeneration({
            image,
            prompt,
            preferredModels: renovationModelPolicy.models,
            tool: 'virtual-renovation',
            policyClass: renovationModelPolicy.difficulty,
            policyRationale: renovationModelPolicy.rationale,
            allowArchitecturalChanges,
            architectureThreshold: adaptivePolicy.architectureThreshold,
            skipArchitectureGuard: allowArchitecturalChanges,
            retryPrompt:
                ENABLE_RENOVATION_RETRY && adaptivePolicy.retryEnabled
                    ? (basePrompt) => `${basePrompt}

RETRY MODE:
- Keep perspective and camera framing unchanged.
- Keep structural geometry stable unless explicitly requested by user.
- Increase clarity and realism; avoid blur, haze, and unfinished surfaces.
${adaptivePolicy.retryPromptBoost || adaptivePolicy.postprocessBoost
    ? '- Stronger artifact cleanup; no semi-transparent or half-rendered finishes.'
    : ''}`
                    : undefined,
            fastRetryPrompt: (basePrompt) => `${basePrompt}

FAST RETRY MODE:
- Preserve camera framing and structure.
- Prioritize one clean completed renovation result.
- Avoid secondary decorative complexity.`,
        });

        if (!allowArchitecturalChanges && !result.ok && result.reason === 'architecture') {
            recordToolAdaptiveOutcome('virtual-renovation', { ok: false, reason: 'architecture' });
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
            recordToolAdaptiveOutcome('virtual-renovation', { ok: false, reason: 'quality' });
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

        if (!allowArchitecturalChanges) {
            if (!result.ok) {
                recordToolAdaptiveOutcome('virtual-renovation', { ok: false, reason: 'architecture' });
                return NextResponse.json({ success: false, error: 'İşlem başarısız oldu' }, { status: 422 });
            }
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
        let responseImageUrl = result.imageUrl;
        try {
            recordToolRun({
                runId,
                phone,
                toolId: 'virtual-renovation',
                beforeImageUrl,
                afterImageUrl: result.imageUrl!,
                title: 'Sanal Tadilat',
                detail: instructions || 'Genel tadilat uygulandı',
                usedCredits: TOOL_CREDIT_COSTS.virtualRenovation,
            });
            const historyEntryId = `virtual-renovation:${runId}`;
            responseImageUrl = `/api/stage/history-image?entryId=${encodeURIComponent(historyEntryId)}&kind=after`;
        } catch (persistError) {
            console.error('Virtual-renovation work-history warning:', persistError);
        }

        return NextResponse.json({
            success: true,
            runId,
            imageUrl: responseImageUrl,
            provider: result.generation?.provider,
            model: result.generation?.model,
            selectedModel: result.telemetry.selectedModel,
            fallbackUsed: result.telemetry.fallbackUsed,
            attemptedModels: result.generation?.attemptedModels,
            attemptLog: process.env.NODE_ENV === 'production' ? undefined : result.generation?.attemptLog,
            architectureScore: allowArchitecturalChanges ? undefined : result.architectureScore,
            qualityScore: result.qualityScore,
            artifactScore: result.artifactScore,
            selectedModelClass: result.telemetry.selectedPolicyClass,
            selectedModelRationale: process.env.NODE_ENV === 'production' ? undefined : renovationModelPolicy.rationale,
            retryCount: result.telemetry.retryCount,
            timing: result.telemetry.timing,
            acceptanceReason: result.telemetry.acceptanceReason,
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
- Output must be photorealistic, clean, and listing-ready.
`.trim();
}
