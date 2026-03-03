import { getGeminiClient, getGeminiTextModel } from '@/lib/gemini';

function cleanText(text: string): string {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

async function polishNarration(script: string): Promise<string> {
    const base = cleanText(script);
    if (!base) return '';

    const model = getGeminiClient().getGenerativeModel({ model: getGeminiTextModel() });
    const prompt = [
        'Türkçe emlak sunumu için kısa ve doğal bir anlatım metni düzenle.',
        'Kurallar:',
        '- 2-3 cümle, toplam 280 karakteri geçme.',
        '- Abartılı iddia ve yanıltıcı ifade kullanma.',
        '- Akıcı, profesyonel ve net bir ton kullan.',
        '',
        `Girdi metni: "${base}"`,
        '',
        'Sadece düzenlenmiş metni döndür.'
    ].join('\n');

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.45, maxOutputTokens: 180 },
    });

    const output = cleanText(result.response.text() || '');
    return output || base;
}

export interface GenerateAiTourVideoInput {
    imageDataUrl: string;
    narrationScript: string;
    durationSeconds?: number;
}

export interface GenerateAiTourVideoResult {
    videoUrl: string;
    model: string;
    provider: 'gemini';
    durationSeconds: number;
    prompt: string;
}

export async function generateAiTourVideo({
    imageDataUrl,
    narrationScript,
    durationSeconds = 9,
}: GenerateAiTourVideoInput): Promise<GenerateAiTourVideoResult> {
    const duration = Math.max(8, Math.min(10, Math.round(durationSeconds)));
    const polished = await polishNarration(narrationScript);

    // Gemini-only geçiş modunda dış video API'ı kullanılmıyor.
    // UI tarafı data:image URL'i render edebilecek şekilde uyarlanır.
    return {
        videoUrl: imageDataUrl,
        model: getGeminiTextModel(),
        provider: 'gemini',
        durationSeconds: duration,
        prompt: polished || cleanText(narrationScript),
    };
}
