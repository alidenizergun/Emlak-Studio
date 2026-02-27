import { GoogleGenerativeAI } from '@google/generative-ai';
import { getImageGenerationPolicy } from '@/lib/image-generation-policy';
import crypto from 'crypto';

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
const ENABLE_MODEL_FALLBACK = process.env.NANO_BANANA_ENABLE_MODEL_FALLBACK === '1';
const MAX_CACHE_ENTRIES = Number(process.env.NANO_BANANA_CACHE_MAX || 100);
const GENERATION_POLICY_VERSION = 'v2';
const NANO_BANANA_TEMPERATURE = Number(process.env.NANO_BANANA_TEMPERATURE || 0.2);
const EMPTY_IMAGE_RETRY_PER_MODEL = Math.max(0, Number(process.env.NANO_BANANA_EMPTY_RETRY_PER_MODEL || 1));

type CachedResult = { imageUrl: string; model: string; provider: 'nano-banana'; at: number };
const generationCache = new Map<string, CachedResult>();
const inflightRequests = new Map<string, Promise<CachedResult>>();

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

function getCacheKey(base64Data: string, finalPrompt: string): string {
    return crypto
        .createHash('sha256')
        .update(GENERATION_POLICY_VERSION)
        .update('\n')
        .update(base64Data)
        .update('\n')
        .update(finalPrompt)
        .digest('hex');
}

function getModelsToTry(): string[] {
    if (!ENABLE_MODEL_FALLBACK) {
        return [NANO_BANANA_MODEL];
    }
    return Array.from(
        new Set([
            NANO_BANANA_MODEL,
            'gemini-3.1-flash-image-preview',
            'gemini-2.5-flash-image',
        ])
    );
}

function setCache(key: string, value: CachedResult): void {
    generationCache.set(key, value);
    if (generationCache.size <= MAX_CACHE_ENTRIES) return;
    const first = generationCache.keys().next();
    if (!first.done) generationCache.delete(first.value);
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

function isEmptyImageResponseError(error: unknown): boolean {
    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const m = message.toLowerCase();
    return (
        m.includes('görüntü döndürmedi') ||
        m.includes('goruntu dondurmedi') ||
        (m.includes('model yanıtı') && m.includes('boş')) ||
        (m.includes('model yaniti') && m.includes('bos'))
    );
}

function buildAttemptPrompt(finalPrompt: string, attempt: number): string {
    if (attempt <= 0) return finalPrompt;
    return `${finalPrompt}

OUTPUT REQUIREMENT (RETRY ${attempt}):
- Return exactly one edited IMAGE output.
- Do not return empty response.
- Do not return text-only answer.`;
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
    const cacheKey = getCacheKey(base64Data, finalPrompt);
    const cached = generationCache.get(cacheKey);
    if (cached) return cached;
    const pending = inflightRequests.get(cacheKey);
    if (pending) return pending;

    const modelsToTry = getModelsToTry();
    const run = (async (): Promise<CachedResult> => {
        let lastError: unknown;
        let sawQuotaError = false;
        let sawWatermarkRefusal = false;
        let sawEmptyImageResponse = false;
        for (const modelName of modelsToTry) {
            const attempts = 1 + EMPTY_IMAGE_RETRY_PER_MODEL;
            for (let attempt = 0; attempt < attempts; attempt += 1) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent({
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    { text: buildAttemptPrompt(finalPrompt, attempt) },
                                    { inlineData: { mimeType, data: base64Data } },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: NANO_BANANA_TEMPERATURE,
                        },
                    });

                    const output = extractInlineImageData(result);
                    const success: CachedResult = {
                        imageUrl: `data:${output.mimeType};base64,${output.data}`,
                        model: modelName,
                        provider: 'nano-banana',
                        at: Date.now(),
                    };
                    setCache(cacheKey, success);
                    return success;
                } catch (error) {
                    if (isQuotaError(error)) sawQuotaError = true;
                    if (isWatermarkPolicyRefusal(error)) sawWatermarkRefusal = true;
                    if (isEmptyImageResponseError(error)) {
                        sawEmptyImageResponse = true;
                        lastError = error;
                        continue;
                    }
                    lastError = error;
                    break;
                }
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
        if (sawEmptyImageResponse) {
            throw new Error(
                'Nano Banana bu denemede gorsel uretmedi (bos yanit). Lutfen ayni ayarla tekrar deneyin veya farkli stil secin.'
            );
        }

        throw lastError instanceof Error
            ? lastError
            : new Error('Nano Banana modeli ile görsel üretimi başarısız oldu.');
    })();

    inflightRequests.set(cacheKey, run);
    try {
        const response = await run;
        return response;
    } finally {
        inflightRequests.delete(cacheKey);
    }
}
