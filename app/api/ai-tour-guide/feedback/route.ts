import { NextRequest, NextResponse } from 'next/server';
import { requireAuthPhone } from '@/lib/auth-guard';
import { clampText } from '@/lib/upload-guard';
import { getAiTourRunForFeedback, recordAiTourFeedback } from '@/lib/ai-tour-runtime';

export async function POST(request: NextRequest) {
    try {
        const { runId, phone, verdict, note } = await request.json();
        const normalizedRunId = String(runId || '').trim();
        const normalizedPhone = String(phone || '').replace(/\D/g, '');
        const normalizedVerdict = String(verdict || '').trim() as 'good' | 'bad';
        const normalizedNote = clampText(String(note || ''), 400);

        if (!normalizedRunId || !normalizedPhone || !['good', 'bad'].includes(normalizedVerdict)) {
            return NextResponse.json({ success: false, error: 'Geçersiz geri bildirim verisi' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, normalizedPhone);
        if (authError) return authError;

        const run = getAiTourRunForFeedback(normalizedRunId, normalizedPhone);
        if (!run) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 });
        }

        recordAiTourFeedback(normalizedRunId, normalizedPhone, normalizedVerdict, normalizedNote);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
