import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'API anahtarı ayarlanmamış' },
                { status: 500 }
            );
        }

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

        // Convert image to base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        // Generate prompt based on selected options
        const prompt = generateEnhancePrompt(options);

        console.log('Processing enhance request:', options);

        // Call Gemini API
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: image.type,
                    data: base64Image
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // For now, return the base64 image (in production, Gemini would return enhanced image)
        return NextResponse.json({
            success: true,
            imageUrl: `data:${image.type};base64,${base64Image}`,
            prompt: prompt // Include prompt for debugging
        });

    } catch (error: any) {
        console.error('Enhance API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'İşlem başarısız oldu' },
            { status: 500 }
        );
    }
}

function generateEnhancePrompt(options: Record<string, boolean>): string {
    // Auto mode - AI decides all enhancements
    if (options.auto) {
        return `Analyze this real estate photograph and automatically enhance it to professional, magazine-quality standards:

AUTOMATIC ENHANCEMENTS TO APPLY:
1. Lighting & Exposure:
   - Correct overall exposure and brightness
   - Balance light across the entire image
   - Brighten dark shadows without losing detail
   - Reduce overexposed highlights
   - Enhance natural light from windows

2. Color Correction:
   - Fix any color casts (yellowing, blue tints)
   - Enhance color vibrancy naturally
   - Make the sky bluer if visible through windows
   - Enhance greens in plants and landscaping
   - Ensure realistic, appealing colors

3. Sharpness & Clarity:
   - Increase overall image sharpness
   - Enhance edge definition and details
   - Improve clarity and texture visibility
   - Upscale to 4K resolution if needed
   - Reduce any blur or soft focus

4. Cleaning & Refinement:
   - Remove dust spots and minor dirt marks
   - Clean windows and glass surfaces
   - Remove small scratches or artifacts
   - Fix minor wall imperfections
   - Reduce image noise

CRITICAL RULES:
- Do NOT add or remove furniture, objects, or major elements
- Do NOT change the room's structure or architecture  
- Maintain photorealistic appearance (no cartoon/artistic effects)
- Keep all enhancements subtle and natural-looking
- The result should look like a professional real estate photo

Goal: Transform this into a stunning, magazine-quality real estate photograph that will attract buyers.`;
    }

    // Build custom prompt based on selected options
    const enhancements: string[] = [];

    if (options.lighting) {
        enhancements.push(`1. LIGHTING ENHANCEMENT:
   - Balance exposure across the entire image
   - Brighten dark areas without overexposing bright areas
   - Enhance natural light sources (windows, skylights)
   - Create even, professional lighting throughout
   - Maintain natural color temperature
   - Fix any underexposed or overexposed regions`);
    }

    if (options.color) {
        enhancements.push(`2. COLOR ENHANCEMENT:
   - Increase color vibrancy and saturation naturally
   - Correct any color casts (yellowing from old bulbs, bluish tints)
   - Make the sky appear bluer if visible through windows
   - Enhance greens in plants, grass, and landscaping
   - Ensure all colors look realistic, vibrant, and appealing
   - Balance white balance for natural-looking results`);
    }

    if (options.sharpness) {
        enhancements.push(`3. SHARPNESS & CLARITY:
   - Enhance edge definition and fine details
   - Improve overall image sharpness significantly
   - Upscale to higher resolution (4K) if current resolution is low
   - Reduce any blur or soft focus
   - Improve texture visibility (wood grain, fabric, surfaces)
   - Maintain natural appearance without over-sharpening`);
    }

    if (options.clean) {
        enhancements.push(`4. CLEANING & IMPERFECTION REMOVAL:
   - Remove visible dust spots, dirt marks, and minor stains
   - Clean windows and reflective surfaces
   - Remove small scratches, artifacts, or image noise
   - Fix minor wall imperfections (small marks, smudges)
   - Improve overall cleanliness of the image
   - Do NOT remove furniture or major objects`);
    }

    if (enhancements.length === 0) {
        return 'Slightly enhance this real estate photograph to improve its professional appearance.';
    }

    return `Enhance this real estate photograph with the following specific improvements:

${enhancements.join('\n\n')}

CRITICAL RULES:
- Do NOT add or remove furniture, objects, or major elements
- Do NOT change the room's structure, walls, floors, or architecture
- Maintain photorealistic appearance (no cartoon/artistic effects)
- All enhancements should look natural and professional
- The result should look like a premium real estate photograph

Apply ONLY the enhancements listed above. Work harmoniously to create a cohesive, professional result.`;
}
