import { NextRequest, NextResponse } from 'next/server';
import { buildRemoveObjectPrompt, type RemoveMode } from '@/app/remove-object/prompts';
import { deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const mode = ((formData.get('mode') as string) || 'all') as RemoveMode;
        const userPrompt = ((formData.get('userPrompt') as string) || '').trim();
        const clientPrompt = ((formData.get('prompt') as string) || '').trim();
        const phone = String(formData.get('phone') || '');

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Görsel gerekli' },
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

        if (mode === 'prompt' && !userPrompt) {
            return NextResponse.json(
                { success: false, error: 'Belirli eşya silme için açıklama gerekli' },
                { status: 400 }
            );
        }

        const prompt = clientPrompt || buildRemoveObjectPrompt(mode, userPrompt);

        const generation = await generateEditedImageWithNanoBanana({ image, prompt });

        const cost = mode === 'all' ? TOOL_CREDIT_COSTS.removeObjectAll : TOOL_CREDIT_COSTS.removeObjectPrompt;
        const creditResult = await deductCredits(phone, cost, `tool_remove_object_${mode}`);
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }

        return NextResponse.json({
            success: true,
            imageUrl: generation.imageUrl,
            mode,
            prompt,
            userPrompt: userPrompt || undefined,
            provider: generation.provider,
            model: generation.model,
            credits: creditResult.credits,
            usedCredits: cost,
        });
    } catch (error: unknown) {
        console.error('Remove-object API error:', error);
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
