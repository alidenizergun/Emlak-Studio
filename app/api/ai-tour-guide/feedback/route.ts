import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        success: false,
        code: 'COMING_SOON',
        error: 'Sanal Sunucu araci henuz aktif degil.',
    });
}
