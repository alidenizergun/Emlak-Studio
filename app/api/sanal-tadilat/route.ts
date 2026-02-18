import { NextRequest, NextResponse } from 'next/server';

/** Placeholder: returns same image until renovation AI is integrated */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const instructions = (formData.get('instructions') as string) || '';
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
        if (instructions) console.log('Sanal tadilat talimatı:', instructions);
        return NextResponse.json({
            success: true,
            imageUrl,
            note: 'Sanal tadilat AI entegrasyonu yakında eklenecek.',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
