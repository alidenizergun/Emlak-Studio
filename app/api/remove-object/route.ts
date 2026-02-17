import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder API: returns the same image as "processed" until a real
 * inpainting/object-removal model is integrated.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Görsel gerekli' },
                { status: 400 }
            );
        }

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mime = image.type || 'image/jpeg';
        const imageUrl = `data:${mime};base64,${base64}`;

        return NextResponse.json({
            success: true,
            imageUrl,
            note: 'Object removal AI will be integrated here. Currently returning original image.',
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
