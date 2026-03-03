import { NextRequest, NextResponse } from 'next/server';
import { requireAuthPhone } from '@/lib/auth-guard';
import { deleteUnifiedWorkEntries, getUnifiedWorkHistory } from '@/lib/work-history';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = String(searchParams.get('phone') || '').replace(/\D/g, '');
        const limitRaw = Number(searchParams.get('limit') || 60);
        const offsetRaw = Number(searchParams.get('offset') || 0);
        const safeLimit = Number.isFinite(limitRaw) ? limitRaw : 60;
        const safeOffset = Number.isFinite(offsetRaw) ? offsetRaw : 0;
        const limit = Math.max(1, Math.min(200, Math.floor(safeLimit)));
        const offset = Math.max(0, Math.floor(safeOffset));

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarasi gerekli' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const history = getUnifiedWorkHistory(phone, limit, offset);
        return NextResponse.json({ success: true, items: history.items, hasMore: history.hasMore });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const phone = String(body?.phone || '').replace(/\D/g, '');
        const entryIds = Array.isArray(body?.entryIds)
            ? body.entryIds.map((id: unknown) => String(id || ''))
            : Array.isArray(body?.runIds)
                ? body.runIds.map((id: unknown) => `stage:${String(id || '')}`)
                : [];

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarasi gerekli' }, { status: 400 });
        }
        if (entryIds.length === 0) {
            return NextResponse.json({ success: false, error: 'Silinecek kayit secilmedi' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const result = deleteUnifiedWorkEntries(phone, entryIds);
        return NextResponse.json({ success: true, ...result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
