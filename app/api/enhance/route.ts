import { NextRequest, NextResponse } from 'next/server';
import { Jimp } from 'jimp';
import Replicate from 'replicate';
import { buildEnhancePrompt } from '@/app/enhance/prompts';

const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const optionsStr = formData.get('options') as string;

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Fotoğraf yüklenmedi' },
                { status: 400 }
            );
        }

        const options = JSON.parse(optionsStr || '{}');
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

                return NextResponse.json({ success: true, imageUrl: finalImageUrl });
            } catch (aiError) {
                console.error('Replicate AI Error, falling back to Jimp:', aiError);
            }
        }

        // 2. FALLBACK / PROCESSED OUTPUT - Use Jimp (Pure JS, no binary issues)
        const jimpImage = await Jimp.read(buffer as any);

        if (options.auto || options.lighting) {
            jimpImage.brightness(0.15).contrast(0.05);
        }

        if (options.auto || options.color) {
            jimpImage.color([{ apply: 'saturate' as any, params: [25] }]);
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

        return NextResponse.json({
            success: true,
            imageUrl: finalImageUrl,
            processed: true
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

/** Seçilen option'lara göre prompt üretir; [app/enhance/prompts.ts] tek kaynaktır. */
function generateEnhancePrompt(options: Record<string, boolean>): string {
    return buildEnhancePrompt(options);
}
