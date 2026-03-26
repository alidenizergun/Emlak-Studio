import { NextResponse } from 'next/server';
import { snapshotStageMetrics } from '@/lib/stage-metrics';
import { getStageOpsSummary } from '@/lib/stage-runtime';

export async function GET() {
    try {
        const realtime = snapshotStageMetrics();
        const aggregate = getStageOpsSummary();
        return NextResponse.json({
            success: true,
            realtime,
            aggregate,
            modelRouting: {
                difficultyCounts: realtime.difficultyCounts,
                guidance: {
                    easy: 'gemini-2.5-flash-image -> gemini-3.1-flash-image-preview',
                    medium: 'gemini-3.1-flash-image-preview',
                    hard: 'gemini-3.1-flash-image-preview',
                },
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
