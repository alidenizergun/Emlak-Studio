import { NextRequest, NextResponse } from 'next/server';
import { Jimp } from 'jimp';
import Replicate from 'replicate';
import { deductCredits } from '@/lib/credits';

const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;
const STAGE_COST = 2;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const roomType = formData.get('roomType') as string;
        const style = formData.get('style') as string;
        const phone = String(formData.get('phone') || '');

        if (!image || !roomType || !style) {
            return NextResponse.json(
                { success: false, error: 'Gerekli alanlar eksik' },
                { status: 400 }
            );
        }
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'İşlem için giriş yapmanız gerekiyor' },
                { status: 401 }
            );
        }

        const creditResult = await deductCredits(phone, STAGE_COST);
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('Processing real stage request (Jimp):', { roomType, style });

        let finalImageUrl: string;

        // 1. IF REPLICATE TOKEN IS PRESENT - Use True AI Furniture Staging
        if (replicate) {
            try {
                const output = await replicate.run(
                    "jagadeesh-k/furniture_styler:9ef04d23250adb34c9f957df487e35b7e2d93e9f45d5a71383505c879d762e58",
                    {
                        input: {
                            image: `data:${image.type};base64,${buffer.toString('base64')}`,
                            room_type: roomType,
                            style: style,
                            prompt: generateStagePrompt(roomType, style)
                        }
                    }
                );

                console.log('Replicate Stage Output:', output);

                // Handle different output types
                if (typeof output === 'string') {
                    finalImageUrl = output;
                } else if (Array.isArray(output) && output.length > 0) {
                    finalImageUrl = output[0] as string;
                } else if (typeof output === 'object') {
                    finalImageUrl = String(output);
                } else {
                    throw new Error('Unexpected Replicate output format');
                }

                return NextResponse.json({
                    success: true,
                    imageUrl: finalImageUrl,
                    credits: creditResult.credits,
                    usedCredits: STAGE_COST
                });
            } catch (aiError) {
                console.error('Replicate AI Error (Stage), falling back to Jimp:', aiError);
            }
        }

        // 2. FALLBACK - Apply some photographic enhancement to original image using Jimp
        const jimpImage = await Jimp.read(buffer);
        jimpImage.brightness(0.1).contrast(0.1);

        const outputBuffer = await jimpImage.getBuffer("image/jpeg");
        finalImageUrl = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

        return NextResponse.json({
            success: true,
            imageUrl: finalImageUrl,
            processed: true,
            note: 'AI Staging requires REPLICATE_API_TOKEN. This is a photorealistic enhancement fallback.',
            credits: creditResult.credits,
            usedCredits: STAGE_COST
        });

    } catch (error: unknown) {
        console.error('Stage API Error:', error);
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

function generateStagePrompt(roomType: string, style: string): string {
    return `Transform this empty room into a beautifully furnished ${roomType} with ${style} interior design style.
Maintain original architecture. Ultra-photorealistic rendering.`;
}
