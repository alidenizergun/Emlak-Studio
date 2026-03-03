import { GoogleGenerativeAI } from '@google/generative-ai';

const PLACEHOLDER_KEYS = new Set([
    'your_gemini_api_key_here',
    'replace_me',
    'changeme',
    'test',
]);

function readKey(): string {
    const key =
        process.env.GOOGLE_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        '';
    return String(key).trim();
}

function isPlaceholderKey(key: string): boolean {
    if (!key) return true;
    const normalized = key.trim().toLowerCase();
    if (PLACEHOLDER_KEYS.has(normalized)) return true;
    if (normalized.includes('your_gemini_api_key')) return true;
    return false;
}

export function getGeminiApiKey(): string {
    const key = readKey();
    if (isPlaceholderKey(key)) {
        throw new Error('Gemini API anahtarı eksik veya geçersiz. Lütfen yeni bir GEMINI_API_KEY/GOOGLE_API_KEY girin.');
    }
    return key;
}

const globalForGemini = globalThis as unknown as {
    geminiClient?: GoogleGenerativeAI;
};

export function getGeminiClient(): GoogleGenerativeAI {
    if (!globalForGemini.geminiClient) {
        globalForGemini.geminiClient = new GoogleGenerativeAI(getGeminiApiKey());
    }
    return globalForGemini.geminiClient;
}

export function getGeminiTextModel(): string {
    return process.env.GEMINI_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
}

export function getGeminiImageModels(): string[] {
    const explicit = String(
        process.env.GEMINI_IMAGE_MODELS || process.env.NANO_BANANA_MODELS || ''
    )
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    if (explicit.length > 0) return Array.from(new Set(explicit));

    const primary = process.env.NANO_BANANA_MODEL || process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    return Array.from(new Set([primary, 'gemini-3.1-flash-image-preview']));
}

