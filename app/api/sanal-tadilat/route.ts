import { NextRequest, NextResponse } from 'next/server';
import { deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const instructions = (formData.get('instructions') as string) || '';
        const phone = String(formData.get('phone') || '');
        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Görsel gerekli' },
                { status: 400 }
            );
        }
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'İşlem için giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;
        const allowArchitecturalChanges = hasExplicitArchitectureChangeRequest(instructions);
        const prompt = buildVirtualRenovationPrompt(instructions, allowArchitecturalChanges);
        const generation = await generateEditedImageWithNanoBanana({
            image,
            prompt,
            allowArchitecturalChanges,
        });

        const creditResult = await deductCredits(phone, TOOL_CREDIT_COSTS.virtualRenovation, 'tool_virtual_renovation');
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }

        return NextResponse.json({
            success: true,
            imageUrl: generation.imageUrl,
            provider: generation.provider,
            model: generation.model,
            credits: creditResult.credits,
            usedCredits: TOOL_CREDIT_COSTS.virtualRenovation,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

function hasExplicitArchitectureChangeRequest(instructions: string): boolean {
    const text = instructions.toLowerCase();
    if (!text.trim()) return false;
    const architectureChangeKeywords = [
        'duvar',
        'kolon',
        'kiriş',
        'tavanı yükselt',
        'tavanı alçalt',
        'pencere',
        'kapı',
        'odayı büyüt',
        'odayı küçült',
        'metrekare',
        'm2',
        'm²',
        'genişlet',
        'daralt',
        'layout',
        'floor plan',
        'window',
        'door',
        'ceiling',
        'column',
        'wall',
    ];
    return architectureChangeKeywords.some((keyword) => text.includes(keyword));
}

function buildVirtualRenovationPrompt(instructions: string, allowArchitecturalChanges: boolean): string {
    const task = instructions.trim() || 'Modern ve sade bir tadilat uygula.';
    const architectureRule = allowArchitecturalChanges
        ? 'User explicitly requested architectural edits. Apply only those requested architectural changes; keep all other architecture unchanged.'
        : 'Do not change architecture, room dimensions, columns, ceilings, window/door positions, or structural geometry.';
    return `
Task: Apply a realistic virtual renovation to this real-estate photo.

User renovation request:
${task}

Rules:
- ${architectureRule}
- Preserve original perspective, camera framing, and lens feel.
- Remove visible logos/watermarks naturally.
- Improve lighting and sharpness to premium listing quality.
- Do not add people, logos, text, or watermarks.
- Output must be photorealistic and listing-ready.
`.trim();
}
