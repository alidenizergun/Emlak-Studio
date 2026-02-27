import { NextRequest, NextResponse } from 'next/server';
import { requireAuthPhone } from '@/lib/auth-guard';
import { deleteStageRuns, getStageHistory } from '@/lib/stage-runtime';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = String(searchParams.get('phone') || '').replace(/\D/g, '');
        const limitRaw = Number(searchParams.get('limit') || 60);
        const safeLimit = Number.isFinite(limitRaw) ? limitRaw : 60;
        const limit = Math.max(1, Math.min(200, Math.floor(safeLimit)));

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarasi gerekli' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const items = getStageHistory(phone, limit);
        return NextResponse.json({ success: true, items });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const phone = String(body?.phone || '').replace(/\D/g, '');
        const runIds = Array.isArray(body?.runIds) ? body.runIds.map((id: unknown) => String(id || '')) : [];

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarasi gerekli' }, { status: 400 });
        }
        if (runIds.length === 0) {
            return NextResponse.json({ success: false, error: 'Silinecek kayit secilmedi' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        const result = deleteStageRuns(phone, runIds);
        return NextResponse.json({ success: true, ...result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
