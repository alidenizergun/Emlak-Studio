import { NextRequest, NextResponse } from 'next/server';
import { deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';

/** Placeholder: returns same image until renovation AI is integrated */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const instructions = (formData.get('instructions') as string) || '';
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
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mime = image.type || 'image/jpeg';
        const imageUrl = `data:${mime};base64,${base64}`;
        if (instructions) console.log('Sanal tadilat talimatı:', instructions);

        const creditResult = await deductCredits(phone, TOOL_CREDIT_COSTS.virtualRenovation, 'tool_virtual_renovation');
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }

        return NextResponse.json({
            success: true,
            imageUrl,
            credits: creditResult.credits,
            usedCredits: TOOL_CREDIT_COSTS.virtualRenovation,
            note: 'Sanal tadilat AI entegrasyonu yakında eklenecek. Placeholder şu an orijinal görseli döndürür.',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
