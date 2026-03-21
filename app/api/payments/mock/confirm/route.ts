import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        success: false,
        code: 'MANUAL_ACTIVATION_ONLY',
        error: 'Odeme entegrasyonu MVP kapsamindan cikarildi. Lutfen manuel aktivasyon icin iletisime gecin.',
    });
}
