import { NextResponse } from 'next/server';
import { snapshotStageMetrics } from '@/lib/stage-metrics';
import { getStageOpsSummary } from '@/lib/stage-runtime';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            realtime: snapshotStageMetrics(),
            aggregate: getStageOpsSummary(),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

