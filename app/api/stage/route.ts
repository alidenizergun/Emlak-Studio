import { NextRequest, NextResponse } from 'next/server';
import { deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
const STAGE_COST = TOOL_CREDIT_COSTS.stage;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const roomType = formData.get('roomType') as string;
        const style = formData.get('style') as string;
        const phone = String(formData.get('phone') || '');

        if (!image || !roomType || !style) {
            return NextResponse.json(
                { success: false, error: 'Gerekli alanlar eksik' },
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

        const prompt = generateStagePrompt(roomType, style);
        const generation = await generateEditedImageWithNanoBanana({ image, prompt });

        const creditResult = await deductCredits(phone, STAGE_COST, 'tool_stage');
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
            usedCredits: STAGE_COST
        });

    } catch (error: unknown) {
        console.error('Stage API Error:', error);
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

function generateStagePrompt(roomType: string, style: string): string {
    return `Transform this room into a beautifully furnished ${roomType} with ${style} interior design style.
STRICT CONSTRAINTS:
- Keep architecture identical to the uploaded photo: room dimensions, column positions, wall lines, ceiling geometry, window and door locations must remain unchanged.
- Keep original layout, perspective, camera angle, framing, and lens feel.
- Clean floor and surfaces (remove dirt, stains, smudges, dust) while preserving original floor material and tile/texture layout.
- Improve lighting, exposure and sharpness to premium real-estate quality without geometric changes.
Ultra-photorealistic rendering only.`;
}
