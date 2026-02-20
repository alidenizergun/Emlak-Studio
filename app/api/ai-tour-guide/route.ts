import { NextRequest, NextResponse } from 'next/server';
import { getCredits } from '@/lib/credits';

/** Placeholder: accepts upload, returns success until video/tour AI is integrated */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const script = (formData.get('script') as string)?.trim() ?? '';
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
        const credits = await getCredits(phone);
        // script: kullanıcının girdiği metin (max 150 karakter), 8 sn videoda yapay zeka sunucusu tarafından söylenecek
        return NextResponse.json({
            success: true,
            message: 'Yapay zeka sunucusu tur oluşturma yakında eklenecek.',
            script: script.slice(0, 150),
            credits,
            usedCredits: 0,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
