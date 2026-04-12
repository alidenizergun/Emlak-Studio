import { NextRequest, NextResponse } from 'next/server';
import { requireAuthPhone } from '@/lib/auth-guard';
import { normalizePhone } from '@/lib/db';
import { clampText } from '@/lib/upload-guard';
import { getListingRunForFeedback, recordListingFeedback } from '@/lib/listing-text-runtime';

export async function POST(request: NextRequest) {
    try {
        const { runId, phone, verdict, note } = await request.json();
        const normalizedRunId = String(runId || '').trim();
        const normalizedPhone = normalizePhone(phone);
        const normalizedVerdict = String(verdict || '').trim() as 'good' | 'bad';
        const normalizedNote = clampText(String(note || ''), 450);

        if (!normalizedRunId || !normalizedPhone || !['good', 'bad'].includes(normalizedVerdict)) {
            return NextResponse.json({ success: false, error: 'Geçersiz geri bildirim verisi' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, normalizedPhone);
        if (authError) return authError;

        const run = getListingRunForFeedback(normalizedRunId, normalizedPhone);
        if (!run) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 });
        }

        recordListingFeedback(normalizedRunId, normalizedPhone, normalizedVerdict, normalizedNote);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
