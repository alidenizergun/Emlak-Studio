import { NextRequest, NextResponse } from 'next/server';
import { requireAuthPhone } from '@/lib/auth-guard';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';
import { createAiTourDraft, finalizeAiTourFailure, finalizeAiTourSuccess } from '@/lib/ai-tour-runtime';
import { recordToolRun } from '@/lib/work-history';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { addCredits, deductCredits, getCredits } from '@/lib/credits';
import { generateAiTourVideo } from '@/lib/ai-tour-video';

export async function POST(request: NextRequest) {
    let currentPhone = '';
    let currentScript = '';
    let currentRunId = '';
    let creditCharged = false;
    let creditCost = 0;

    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const script = clampText((formData.get('script') as string) || '', 280);
        currentScript = script;
        const phone = String(formData.get('phone') || '');
        currentPhone = phone;

        const uploadCheck = validateUploadedImage(image);
        if (!uploadCheck.ok) {
            return NextResponse.json({ success: false, error: uploadCheck.error }, { status: 400 });
        }
        if (!phone) {
            return NextResponse.json({ success: false, error: 'İşlem için giriş yapmanız gerekiyor' }, { status: 401 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const requiredCredits = TOOL_CREDIT_COSTS.aiTourGuide;
        creditCost = requiredCredits;
        const availableCredits = await getCredits(phone);
        if (availableCredits < requiredCredits) {
            return NextResponse.json(
                {
                    success: false,
                    code: 'INSUFFICIENT_CREDITS',
                    error: `Yetersiz kredi. Bu işlem için ${requiredCredits} kredi gerekiyor.`,
                    credits: availableCredits,
                    requiredCredits,
                },
                { status: 402 }
            );
        }

        const draft = createAiTourDraft(script);
        currentRunId = draft.runId;

        const beforeImageUrl = await fileToDataUrl(image);
        const video = await generateAiTourVideo({
            imageDataUrl: beforeImageUrl,
            narrationScript: draft.script,
            durationSeconds: 9,
        });

        const deduction = await deductCredits(phone, requiredCredits, 'ai_tour_guide');
        if (!deduction.ok) {
            return NextResponse.json(
                {
                    success: false,
                    code: 'INSUFFICIENT_CREDITS',
                    error: `Yetersiz kredi. Bu işlem için ${requiredCredits} kredi gerekiyor.`,
                    credits: deduction.credits,
                    requiredCredits,
                },
                { status: 402 }
            );
        }
        creditCharged = true;

        finalizeAiTourSuccess({
            runId: draft.runId,
            phone,
            scriptInput: script,
            scriptOutput: video.prompt || draft.script,
            qualityScore: draft.qualityScore,
            usedCredits: requiredCredits,
            provider: video.provider,
            videoUrl: video.videoUrl,
            durationSeconds: video.durationSeconds,
        });

        recordToolRun({
            runId: draft.runId,
            phone,
            toolId: 'ai-tour-guide',
            beforeImageUrl,
            afterImageUrl: beforeImageUrl,
            title: 'Sanal Sunucu Video Turu',
            detail: JSON.stringify({
                videoUrl: video.videoUrl,
                script: video.prompt || draft.script,
                durationSeconds: video.durationSeconds,
                provider: video.provider,
                model: video.model,
            }),
            usedCredits: requiredCredits,
        });

        return NextResponse.json({
            success: true,
            runId: draft.runId,
            generatedScript: video.prompt || draft.script,
            qualityScore: draft.qualityScore,
            qualityIssues: draft.issues,
            policySnapshot: draft.policy,
            videoUrl: video.videoUrl,
            durationSeconds: video.durationSeconds,
            provider: video.provider,
            model: video.model,
            usedCredits: requiredCredits,
            credits: deduction.credits,
        });
    } catch (error: unknown) {
        if (creditCharged && currentPhone && creditCost > 0) {
            try {
                await addCredits(currentPhone, creditCost, 'ai_tour_refund_after_failure');
            } catch {
                // no-op
            }
        }
        if (currentPhone && currentRunId) {
            finalizeAiTourFailure({
                runId: currentRunId,
                phone: currentPhone,
                scriptInput: currentScript,
                scriptOutput: currentScript,
                reason: 'provider',
                qualityScore: 0,
            });
            recordToolRun({
                runId: currentRunId,
                phone: currentPhone,
                toolId: 'ai-tour-guide',
                status: 'failed',
                beforeImageUrl: null,
                afterImageUrl: null,
                title: 'Sanal Sunucu Video Turu',
                detail: 'Video üretimi başarısız',
                usedCredits: 0,
            });
        }
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: `${message} Kredi düşülmedi veya otomatik iade edildi.` },
            { status: 500 }
        );
    }
}

async function fileToDataUrl(file: File): Promise<string> {
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mime = file.type || 'image/jpeg';
    return `data:${mime};base64,${bytes}`;
}
