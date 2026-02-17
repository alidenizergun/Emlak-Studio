import { NextRequest, NextResponse } from 'next/server';

/** Placeholder: accepts upload, returns success until video/tour AI is integrated */
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
        return NextResponse.json({
            success: true,
            message: 'Yapay zeka sunucusu tur oluşturma yakında eklenecek.',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
