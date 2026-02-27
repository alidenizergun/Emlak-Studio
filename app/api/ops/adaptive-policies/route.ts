import { NextResponse } from 'next/server';
import { getAllToolAdaptivePolicies } from '@/lib/tool-adaptive';
import { getStageAdaptivePolicy } from '@/lib/stage-runtime';
import { getAiTourAdaptivePolicy } from '@/lib/ai-tour-runtime';
import { getListingAdaptivePolicy } from '@/lib/listing-text-runtime';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            stage: getStageAdaptivePolicy(),
            tools: getAllToolAdaptivePolicies(),
            aiTourGuide: getAiTourAdaptivePolicy(),
            listingText: getListingAdaptivePolicy(),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
