import { NextRequest, NextResponse } from 'next/server';
import { requireAuthPhone } from '@/lib/auth-guard';
import { clampText, validateUploadedImage } from '@/lib/upload-guard';
import { createAiTourRun, recordAiTourFailure } from '@/lib/ai-tour-runtime';

export async function POST(request: NextRequest) {
    let currentPhone = '';
    let currentScript = '';
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const script = clampText((formData.get('script') as string) || '', 150);
        currentScript = script;
        const phone = String(formData.get('phone') || '');
        currentPhone = phone;
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

        const draft = createAiTourRun(phone, script);
        return NextResponse.json({
            success: true,
            code: 'DRAFT_READY',
            message: 'Video tur özelliği hazırlanıyor. Bu sırada adaptif anlatım metni üretildi.',
            runId: draft.runId,
            scriptInput: script,
            generatedScript: draft.script,
            qualityScore: draft.qualityScore,
            qualityIssues: draft.issues,
            policySnapshot: draft.policy,
            usedCredits: 0,
        });
    } catch (error: unknown) {
        if (currentPhone) recordAiTourFailure(currentPhone, currentScript, 'provider');
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
