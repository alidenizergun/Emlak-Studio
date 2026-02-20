import { NextRequest, NextResponse } from 'next/server';
import { buildRemoveObjectPrompt, type RemoveMode } from '@/app/remove-object/prompts';
import { getCredits } from '@/lib/credits';

/**
 * Placeholder API: returns the same image as "processed" until a real
 * inpainting/object-removal model is integrated.
 */
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

        if (mode === 'prompt' && !userPrompt) {
            return NextResponse.json(
                { success: false, error: 'Belirli eşya silme için açıklama gerekli' },
                { status: 400 }
            );
        }

        const prompt = clientPrompt || buildRemoveObjectPrompt(mode, userPrompt);

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mime = image.type || 'image/jpeg';
        const imageUrl = `data:${mime};base64,${base64}`;

        const credits = await getCredits(phone);

        return NextResponse.json({
            success: true,
            imageUrl,
            mode,
            prompt,
            userPrompt: userPrompt || undefined,
            credits,
            usedCredits: 0,
            note: 'Object removal AI will be integrated here. Currently returning original image and does not consume credits.',
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
