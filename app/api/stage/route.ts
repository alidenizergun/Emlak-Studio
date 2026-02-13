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
        const roomType = formData.get('roomType') as string;
        const style = formData.get('style') as string;

        if (!image || !roomType || !style) {
            return NextResponse.json(
                { success: false, error: 'Gerekli alanlar eksik' },
                { status: 400 }
            );
        }

        // Convert image to base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');

        // Generate prompt based on room type and style
        const prompt = generateStagePrompt(roomType, style);

        console.log('Processing stage request:', { roomType, style });

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

        // For now, return the base64 image (in production, Gemini would return generated image)
        return NextResponse.json({
            success: true,
            imageUrl: `data:${image.type};base64,${base64Image}`,
            prompt: prompt // Include prompt for debugging
        });

    } catch (error: any) {
        console.error('Stage API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'İşlem başarısız oldu' },
            { status: 500 }
        );
    }
}

function generateStagePrompt(roomType: string, style: string): string {
    const roomInstructions: Record<string, string> = {
        living_room: 'Add: modern sofa, coffee table, TV unit, side tables, area rug, floor lamp, wall art, decorative plants. Focus on comfort and entertainment space.',
        bedroom: 'Add: bed with premium linens, nightstands, dresser, wardrobe, bedside lamps, window curtains, area rug. Create cozy, relaxing sleeping atmosphere.',
        kitchen: 'Add: modern cabinets, granite/marble countertops, stainless appliances (refrigerator, stove, oven, sink), dining table or bar stools, pendant lighting. Emphasize functionality and cleanliness.',
        dining_room: 'Add: elegant dining table with 6-8 chairs, sideboard/buffet, statement chandelier, table centerpiece, wall art or mirror. Create sophisticated dining atmosphere.',
        office: 'Add: executive desk, ergonomic office chair, bookshelves, filing cabinet, desk lamp, computer setup, indoor plants, wall organizers. Professional and organized workspace.'
    };

    const styleAesthetics: Record<string, string> = {
        modern: 'Clean lines, minimalist design, neutral color palette (white, gray, black, beige), glass and metal finishes, contemporary furniture with geometric shapes, simple but elegant.',
        scandinavian: 'Light wood tones (oak, birch), white walls, natural textures, cozy hygge atmosphere, simple functional furniture with Nordic design, lots of natural light, plants.',
        industrial: 'Exposed brick or concrete walls, metal fixtures and pipes, dark wood, leather furniture, Edison bulb lighting, raw materials, urban loft aesthetic with vintage industrial pieces.',
        bohemian: 'Eclectic mix of patterns and textures, vibrant warm colors, global ethnic influences, layered textiles and rugs, lots of plants, macramé wall hangings, vintage and handcrafted pieces.',
        luxury: 'Rich premium materials (velvet, silk, marble, brass), sophisticated color palette (deep blues, emerald, gold accents), high-end designer furniture, dramatic lighting fixtures, opulent decorative details.'
    };

    const roomName = roomType.replace('_', ' ');
    const roomInstruction = roomInstructions[roomType] || '';
    const styleAesthetic = styleAesthetics[style] || '';

    return `Transform this empty room into a beautifully furnished ${roomName} with ${style} interior design style.

CRITICAL REQUIREMENTS:
- Maintain EXACTLY the original room's architecture, windows, doors, walls, and all structural elements
- Keep the same room dimensions, ceiling height, and floor material
- Preserve natural lighting direction and intensity
- Add appropriate furniture and decor ONLY (do not modify structure)

ROOM TYPE SPECIFICATIONS (${roomName}):
${roomInstruction}

STYLE AESTHETICS (${style.charAt(0).toUpperCase() + style.slice(1)}):
${styleAesthetic}

QUALITY REQUIREMENTS:
- Ultra-photorealistic rendering (4K quality)
- Professional interior design photography look
- Proper shadows, reflections, and lighting
- Natural material textures
- Harmonious color coordination
- Magazine-quality presentation

Remember: Only ADD furniture and decor. Do NOT change walls, floors, windows, doors, or room structure.`;
}
