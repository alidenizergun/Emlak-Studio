import { NextRequest, NextResponse } from 'next/server';
import { Jimp } from 'jimp';
import Replicate from 'replicate';
import { deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';

const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const optionsStr = formData.get('options') as string;
        const phone = String(formData.get('phone') || '');

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Fotoğraf yüklenmedi' },
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

        const options = JSON.parse(optionsStr || '{}');
        const cost = getEnhanceCreditCost(options);
        if (cost <= 0) {
            return NextResponse.json(
                { success: false, error: 'Lütfen en az bir geliştirme seçeneği seçin' },
                { status: 400 }
            );
        }

        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('Processing real enhance request (Jimp):', options);

        let finalImageUrl: string;

        // 1. IF REPLICATE TOKEN IS PRESENT - Use True AI 4K Enhancement
        if (replicate) {
            try {
                console.log('Sending request to Replicate...');
                const output = await replicate.run(
                    "nightmare-ai/real-esrgan:42fed1c4974141103ad4547c1359acffc75a93e322f9d300eaa29f017a651f1",
                    {
                        input: {
                            image: `data:${image.type};base64,${buffer.toString('base64')}`,
                            upscale: 2,
                            face_enhance: false
                        }
                    }
                );

                console.log('Replicate Output:', output);

                // Handle different output types
                if (typeof output === 'string') {
                    finalImageUrl = output;
                } else if (Array.isArray(output) && output.length > 0) {
                    finalImageUrl = output[0] as string;
                } else if (typeof output === 'object') {
                    finalImageUrl = String(output); // Fallback
                } else {
                    throw new Error('Unexpected Replicate output format');
                }

                const creditResult = await deductCredits(phone, cost);
                if (!creditResult.ok) {
                    return NextResponse.json(
                        { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                        { status: 402 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    imageUrl: finalImageUrl,
                    credits: creditResult.credits,
                    usedCredits: cost
                });
            } catch (aiError) {
                console.error('Replicate AI Error, falling back to Jimp:', aiError);
            }
        }

        // 2. FALLBACK / PROCESSED OUTPUT - Use Jimp (Pure JS, no binary issues)
        const jimpImage = await Jimp.read(buffer);

        if (options.auto || options.lighting) {
            jimpImage.brightness(0.15).contrast(0.05);
        }

        if (options.auto || options.color) {
            jimpImage.color([{ apply: 'saturate', params: [25] }] as never);
        }

        if (options.auto || options.sharpness) {
            // Jimp convolution kernel for sharpening
            jimpImage.convolute([
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0]
            ]);
        }


        const outputBuffer = await jimpImage.getBuffer("image/jpeg");
        finalImageUrl = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

        const creditResult = await deductCredits(phone, cost);
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
                { status: 402 }
            );
        }

        return NextResponse.json({
            success: true,
            imageUrl: finalImageUrl,
            processed: true,
            credits: creditResult.credits,
            usedCredits: cost
        });

    } catch (error: unknown) {
        console.error('Enhance API Error:', error);
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

function getEnhanceCreditCost(options: Record<string, boolean>): number {
    if (options?.auto) return 5;

    const manualOptionIds = ['lighting', 'color', 'sharpness', 'clean', 'privacy', 'sky', 'twilight'];
    const selectedCount = manualOptionIds.reduce((acc, key) => acc + (options?.[key] ? 1 : 0), 0);
    return selectedCount;
}
