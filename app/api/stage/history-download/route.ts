import { NextRequest, NextResponse } from 'next/server';
import { getSessionPhone } from '@/lib/session';
import { buildHistoryDownload } from '@/lib/history-download';

export async function GET(request: NextRequest) {
    try {
        const phone = getSessionPhone(request);
        if (!phone) {
            return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
        }

        const entryId = String(request.nextUrl.searchParams.get('entryId') || '').trim();
        const kindParam = String(request.nextUrl.searchParams.get('kind') || '').trim();
        const kind = kindParam === 'before' ? 'before' : 'after';

        if (!entryId.includes(':')) {
            return NextResponse.json({ success: false, error: 'Geçersiz kayıt kimliği' }, { status: 400 });
        }

        const result = await buildHistoryDownload(phone, entryId, kind);
        return new NextResponse(new Uint8Array(result.bytes), {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': `attachment; filename="${result.filename}"`,
                'Cache-Control': 'private, no-store',
                'X-Export-Resolution': result.planLabel,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        const status = message.includes('bulunamadı') ? 404 : 500;
        return NextResponse.json({ success: false, error: message }, { status });
    }
}
