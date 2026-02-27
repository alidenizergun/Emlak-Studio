import { NextRequest, NextResponse } from 'next/server';
import { deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { getEnhanceCreditCost } from '@/lib/tool-credit-costs';
import { buildEnhancePrompt } from '@/app/enhance/prompts';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const optionsStr = formData.get('options') as string;
        const phone = String(formData.get('phone') || '');

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Fotoğraf yüklenmedi' },
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

        const options = JSON.parse(optionsStr || '{}');
        const cost = getEnhanceCreditCost(options);
        if (cost <= 0) {
            return NextResponse.json(
                { success: false, error: 'Lütfen en az bir geliştirme seçeneği seçin' },
                { status: 400 }
            );
        }

        const prompt = buildEnhancePrompt(options);
        const generation = await generateEditedImageWithNanoBanana({ image, prompt });

        const creditResult = await deductCredits(phone, cost, 'tool_enhance');
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }

        return NextResponse.json({
            success: true,
            imageUrl: generation.imageUrl,
            provider: generation.provider,
            model: generation.model,
            credits: creditResult.credits,
            usedCredits: cost
        });

    } catch (error: unknown) {
        console.error('Enhance API Error:', error);
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
