import { NextRequest, NextResponse } from 'next/server';
import { addCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import {
    canAutoRefundByFeedback,
    getStageRunForFeedback,
    markStageRunRefunded,
    recordStageFeedback,
} from '@/lib/stage-runtime';
import { clampText } from '@/lib/upload-guard';

export async function POST(request: NextRequest) {
    try {
        const { runId, phone, verdict, note } = await request.json();
        const normalizedVerdict = String(verdict || '').trim() as 'good' | 'bad';
        const normalizedRunId = String(runId || '').trim();
        const normalizedPhone = String(phone || '').replace(/\D/g, '');

        if (!normalizedRunId || !normalizedPhone || !['good', 'bad'].includes(normalizedVerdict)) {
            return NextResponse.json({ success: false, error: 'Gecersiz feedback verisi' }, { status: 400 });
        }
        const authError = requireAuthPhone(request, normalizedPhone);
        if (authError) return authError;

        const run = getStageRunForFeedback(normalizedRunId, normalizedPhone);
        if (!run) {
            return NextResponse.json({ success: false, error: 'Run bulunamadi' }, { status: 404 });
        }

        recordStageFeedback(normalizedRunId, normalizedPhone, normalizedVerdict, clampText(String(note || ''), 500));

        if (normalizedVerdict === 'good') {
            return NextResponse.json({ success: true, refunded: false });
        }
        if (run.refunded === 1 || run.usedCredits <= 0 || run.status !== 'success') {
            return NextResponse.json({ success: true, refunded: false });
        }
        if (!canAutoRefundByFeedback({ architectureScore: run.architectureScore, qualityScore: run.qualityScore })) {
            return NextResponse.json({ success: true, refunded: false });
        }

        const credits = await addCredits(normalizedPhone, run.usedCredits, `stage_feedback_refund:${normalizedRunId}`);
        markStageRunRefunded(normalizedRunId);
        return NextResponse.json({ success: true, refunded: true, credits });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
