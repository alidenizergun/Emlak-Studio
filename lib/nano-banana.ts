import { GoogleGenerativeAI } from '@google/generative-ai';
import { getImageGenerationPolicy } from '@/lib/image-generation-policy';

const GOOGLE_API_KEY =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    '';

export const NANO_BANANA_MODEL =
    process.env.NANO_BANANA_MODEL ||
    process.env.GEMINI_IMAGE_MODEL ||
    'gemini-3.1-flash-image-preview';

const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

interface GenerateEditedImageParams {
    image: File;
    prompt: string;
    allowArchitecturalChanges?: boolean;
}

function isQuotaError(error: unknown): boolean {
    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const m = message.toLowerCase();
    return (
        m.includes('429') ||
        m.includes('too many requests') ||
        m.includes('quota') ||
        m.includes('rate limit') ||
        m.includes('free_tier') ||
        m.includes('resource_exhausted')
    );
}

function isWatermarkPolicyRefusal(error: unknown): boolean {
    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const m = message.toLowerCase();
    return (
        m.includes('watermark') &&
        (m.includes('cannot fulfill') ||
            m.includes('cannot') ||
            m.includes('violation of intellectual property') ||
            m.includes('misrepresent the origin'))
    );
}

function extractInlineImageData(result: unknown): { data: string; mimeType: string } {
    const response = result as {
        response?: {
            candidates?: Array<{
                content?: {
                    parts?: Array<{
                        inlineData?: { data?: string; mimeType?: string };
                        inline_data?: { data?: string; mimeType?: string };
                    }>;
                };
            }>;
            text?: () => string;
        };
    };

    const candidates = response.response?.candidates || [];
    for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
            const inlineData = part.inlineData || part.inline_data;
            const data = inlineData?.data;
            const mimeType = inlineData?.mimeType || 'image/png';
            if (data) return { data, mimeType };
        }
    }

    throw new Error(
        `Nano Banana görüntü döndürmedi. Model yanıtı: ${response.response?.text?.() || 'boş'}`
    );
}

export async function generateEditedImageWithNanoBanana({
    image,
    prompt,
    allowArchitecturalChanges = false,
}: GenerateEditedImageParams): Promise<{ imageUrl: string; model: string; provider: 'nano-banana' }> {
    if (!genAI) {
        throw new Error('Gemini API anahtarı eksik. GOOGLE_API_KEY veya GEMINI_API_KEY tanımlayın.');
    }

    const mimeType = image.type || 'image/jpeg';
    const bytes = await image.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    const safetyRules = getImageGenerationPolicy(allowArchitecturalChanges);
    const finalPrompt = `${safetyRules}\n\nTASK:\n${prompt}`;
    const modelsToTry = Array.from(
        new Set([
            NANO_BANANA_MODEL,
            'gemini-3.1-flash-image-preview',
            'gemini-2.5-flash-image',
        ])
    );

    let lastError: unknown;
    let sawQuotaError = false;
    let sawWatermarkRefusal = false;
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: finalPrompt },
                            { inlineData: { mimeType, data: base64Data } },
                        ],
                    },
                ],
            });

            const output = extractInlineImageData(result);
            return {
                imageUrl: `data:${output.mimeType};base64,${output.data}`,
                model: modelName,
                provider: 'nano-banana',
            };
        } catch (error) {
            if (isQuotaError(error)) sawQuotaError = true;
            if (isWatermarkPolicyRefusal(error)) sawWatermarkRefusal = true;
            lastError = error;
        }
    }

    if (sawQuotaError) {
        throw new Error(
            'Nano Banana kotasi asildi. Google AI Studio/Cloud tarafinda Gemini Image modeli icin billing ve quota tanimlaman gerekiyor.'
        );
    }
    if (sawWatermarkRefusal) {
        throw new Error(
            'Model, watermark kaldirma istegini politika nedeniyle reddetti. Bu gorselde watermark alanina dokunmadan mimari koruma ve kalite iyilestirme uygulaniyor.'
        );
    }

    throw lastError instanceof Error
        ? lastError
        : new Error('Nano Banana modeli ile görsel üretimi başarısız oldu.');
}
