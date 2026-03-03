import crypto from 'crypto';
import { getImageGenerationPolicy } from '@/lib/image-generation-policy';
import { getGeminiClient, getGeminiImageModels } from '@/lib/gemini';

const ENABLE_MODEL_FALLBACK = process.env.NANO_BANANA_ENABLE_MODEL_FALLBACK !== '0';
const ENABLE_GENERATION_CACHE = process.env.NANO_BANANA_CACHE === '1';
const MAX_CACHE_ENTRIES = Number(process.env.NANO_BANANA_CACHE_MAX || 80);
const GENERATION_POLICY_VERSION = 'v3-gemini-only';
const NANO_BANANA_TEMPERATURE = Number(process.env.NANO_BANANA_TEMPERATURE || 0.2);
const EMPTY_IMAGE_RETRY_PER_MODEL = Math.max(0, Number(process.env.NANO_BANANA_EMPTY_RETRY_PER_MODEL || 1));
const REQUEST_TIMEOUT_MS = Math.max(12_000, Number(process.env.NANO_BANANA_REQUEST_TIMEOUT_MS || 45_000));
const TOTAL_TIMEOUT_MS = Math.max(REQUEST_TIMEOUT_MS, Number(process.env.NANO_BANANA_TOTAL_TIMEOUT_MS || 120_000));
const MAX_MODELS_TO_TRY = Math.max(1, Number(process.env.NANO_BANANA_MAX_MODELS_TO_TRY || 2));
const NANO_BANANA_DEBUG_LOG = process.env.NANO_BANANA_DEBUG_LOG === '1' || process.env.NODE_ENV !== 'production';

export type NanoBananaAttemptStatus = 'success' | 'empty' | 'timeout' | 'quota' | 'policy' | 'error';
export interface NanoBananaAttemptLog {
    model: string;
    attempt: number;
    status: NanoBananaAttemptStatus;
    latencyMs: number;
    message?: string;
}

type CachedResult = {
    imageUrl: string;
    model: string;
    provider: 'nano-banana';
    at: number;
    fallbackUsed: boolean;
    attemptedModels: string[];
    attemptLog: NanoBananaAttemptLog[];
};

const generationCache = new Map<string, CachedResult>();
const inflightRequests = new Map<string, Promise<CachedResult>>();

interface GenerateEditedImageParams {
    image: File;
    prompt: string;
    allowArchitecturalChanges?: boolean;
}

function isQuotaError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const m = message.toLowerCase();
    return (
        m.includes('429') ||
        m.includes('too many requests') ||
        m.includes('quota') ||
        m.includes('rate limit') ||
        m.includes('resource_exhausted')
    );
}

function isPolicyError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    const m = message.toLowerCase();
    return (
        m.includes('safety') ||
        m.includes('policy') ||
        m.includes('blocked') ||
        m.includes('watermark')
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
    const base = getGeminiImageModels();
    const models = ENABLE_MODEL_FALLBACK ? base : [base[0]];
    return Array.from(new Set(models)).slice(0, MAX_MODELS_TO_TRY);
}

function setCache(key: string, value: CachedResult): void {
    if (!ENABLE_GENERATION_CACHE) return;
    generationCache.set(key, value);
    if (generationCache.size <= MAX_CACHE_ENTRIES) return;
    const first = generationCache.keys().next();
    if (!first.done) generationCache.delete(first.value);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timeout (${timeoutMs}ms)`)), timeoutMs);
        }),
    ]);
}

function extractInlineImageData(result: unknown): { data: string; mimeType: string } | null {
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
        };
    };

    const candidates = response.response?.candidates || [];
    for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData?.data) {
                return {
                    data: inlineData.data,
                    mimeType: inlineData.mimeType || 'image/png',
                };
            }
        }
    }

    return null;
}

function shortError(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error || 'unknown');
    return raw.length > 220 ? `${raw.slice(0, 220)}...` : raw;
}

export async function generateEditedImageWithNanoBanana({
    image,
    prompt,
    allowArchitecturalChanges = false,
}: GenerateEditedImageParams): Promise<{
    imageUrl: string;
    model: string;
    provider: 'nano-banana';
    fallbackUsed: boolean;
    attemptedModels: string[];
    attemptLog: NanoBananaAttemptLog[];
}> {
    const genAI = getGeminiClient();

    const mimeType = image.type || 'image/jpeg';
    const bytes = await image.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');
    const safetyRules = getImageGenerationPolicy(allowArchitecturalChanges);
    const finalPrompt = `${safetyRules}\n\nTASK:\n${prompt}`;

    const cacheKey = getCacheKey(base64Data, finalPrompt);
    if (ENABLE_GENERATION_CACHE) {
        const cached = generationCache.get(cacheKey);
        if (cached) return cached;
    }

    const pending = inflightRequests.get(cacheKey);
    if (pending) return pending;

    const modelsToTry = getModelsToTry();
    const requestId = crypto.randomUUID().slice(0, 8);

    const run = (async (): Promise<CachedResult> => {
        const attemptLog: NanoBananaAttemptLog[] = [];
        const attemptedModels: string[] = [];
        let sawQuota = false;
        let sawPolicy = false;
        let sawTimeout = false;
        let sawEmpty = false;
        let lastError: unknown;

        const startedAt = Date.now();
        for (const modelName of modelsToTry) {
            attemptedModels.push(modelName);
            if (Date.now() - startedAt > TOTAL_TIMEOUT_MS) {
                sawTimeout = true;
                break;
            }

            const attempts = 1 + EMPTY_IMAGE_RETRY_PER_MODEL;
            for (let idx = 0; idx < attempts; idx += 1) {
                if (Date.now() - startedAt > TOTAL_TIMEOUT_MS) {
                    sawTimeout = true;
                    break;
                }

                const attemptStartedAt = Date.now();
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await withTimeout(
                        model.generateContent({
                            contents: [
                                {
                                    role: 'user',
                                    parts: [
                                        { text: finalPrompt },
                                        { inlineData: { mimeType, data: base64Data } },
                                    ],
                                },
                            ],
                            generationConfig: {
                                temperature: NANO_BANANA_TEMPERATURE,
                            },
                        }),
                        REQUEST_TIMEOUT_MS,
                        `Gemini image ${modelName}`
                    );

                    const output = extractInlineImageData(result);
                    if (!output) {
                        sawEmpty = true;
                        attemptLog.push({
                            model: modelName,
                            attempt: idx + 1,
                            status: 'empty',
                            latencyMs: Date.now() - attemptStartedAt,
                            message: 'Model image döndürmedi.',
                        });
                        continue;
                    }

                    const ok: CachedResult = {
                        imageUrl: `data:${output.mimeType};base64,${output.data}`,
                        model: modelName,
                        provider: 'nano-banana',
                        at: Date.now(),
                        fallbackUsed: modelName !== modelsToTry[0],
                        attemptedModels,
                        attemptLog: [
                            ...attemptLog,
                            {
                                model: modelName,
                                attempt: idx + 1,
                                status: 'success',
                                latencyMs: Date.now() - attemptStartedAt,
                            },
                        ],
                    };

                    if (NANO_BANANA_DEBUG_LOG) {
                        console.info(`[gemini-image] request=${requestId} success model=${modelName} fallback=${ok.fallbackUsed}`);
                    }

                    setCache(cacheKey, ok);
                    return ok;
                } catch (error) {
                    const message = shortError(error);
                    const latencyMs = Date.now() - attemptStartedAt;
                    const lowered = message.toLowerCase();

                    if (lowered.includes('timeout')) {
                        sawTimeout = true;
                        attemptLog.push({ model: modelName, attempt: idx + 1, status: 'timeout', latencyMs, message });
                        lastError = error;
                        continue;
                    }
                    if (isQuotaError(error)) {
                        sawQuota = true;
                        attemptLog.push({ model: modelName, attempt: idx + 1, status: 'quota', latencyMs, message });
                        lastError = error;
                        continue;
                    }
                    if (isPolicyError(error)) {
                        sawPolicy = true;
                        attemptLog.push({ model: modelName, attempt: idx + 1, status: 'policy', latencyMs, message });
                        lastError = error;
                        continue;
                    }

                    attemptLog.push({ model: modelName, attempt: idx + 1, status: 'error', latencyMs, message });
                    lastError = error;
                }
            }
        }

        if (NANO_BANANA_DEBUG_LOG) {
            const compact = attemptLog.map((x) => `${x.model}#${x.attempt}:${x.status}`).join(', ');
            console.warn(`[gemini-image] request=${requestId} failed attempts=[${compact}]`);
        }

        if (sawQuota) {
            throw new Error('Gemini görsel kotası/rate limit aşıldı. Lütfen API kotasını ve faturalandırmayı kontrol edin.');
        }
        if (sawPolicy) {
            throw new Error('Gemini görsel isteğini politika nedeniyle reddetti. Daha güvenli/temiz bir prompt ile tekrar deneyin.');
        }
        if (sawTimeout) {
            throw new Error('Gemini görsel isteği zaman aşımına uğradı. Lütfen tekrar deneyin.');
        }
        if (sawEmpty) {
            throw new Error('Gemini görsel çıktısı boş döndü. Lütfen tekrar deneyin.');
        }

        throw lastError instanceof Error ? lastError : new Error('Gemini ile görsel üretimi başarısız oldu.');
    })();

    inflightRequests.set(cacheKey, run);
    try {
        return await run;
    } finally {
        inflightRequests.delete(cacheKey);
    }
}
