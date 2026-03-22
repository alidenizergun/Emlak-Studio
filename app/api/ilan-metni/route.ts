import { NextRequest, NextResponse } from 'next/server';
import { addCredits, deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import { getGeminiClient, getGeminiTextModel } from '@/lib/gemini';
import {
    buildAdaptiveListingPrompt,
    createListingRunId,
    evaluateListingTextQuality,
    getListingAdaptivePolicy,
    recordListingRun,
    updateListingAdaptiveOutcome,
} from '@/lib/listing-text-runtime';
import { recordToolRun } from '@/lib/work-history';
import { getRequestLanguage, type Language, translateText } from '@/lib/i18n';

interface IlanBilgileri {
    lokasyon?: string;
    metrekare?: string;
    odaSayisi?: string;
    banyoSayisi?: string;
    kat?: string;
    binaYasi?: string;
    isitma?: string;
    kullanim?: string;
    fiyat?: string;
    ekNotlar?: string;
}

const GEMINI_MODEL = getGeminiTextModel();
const LISTING_TEXT_COST = TOOL_CREDIT_COSTS.listingText;

function buildListingPrompt(info: IlanBilgileri, lang: Language): string {
    const listingTypeLabel = info.kullanim === 'kiralik' ? 'For Rent' : 'For Sale';
    const languageInstruction =
        lang === 'en'
            ? 'Final output must be in English.'
            : 'Final output must be in Turkish.';
    const featuresHeading =
        lang === 'en'
            ? '"Key Features"'
            : '"Öne Çıkan Özellikler"';
    return `
You are a senior real-estate listing copywriter.
Analyze the user's listing details together with the uploaded property photo and produce high-quality listing copy.

Goal:
- Write trustworthy, professional copy that improves click-through and inquiry intent.
- Do not use exaggerated, unrealistic, or misleading claims.

Language and style:
- ${languageInstruction}
- Keep tone natural, fluent, and sales-oriented.
- Avoid excessive emoji, all-caps spam style, and filler.
- Keep it concise but persuasive.

Required output format (exact order):
1) Single-line title
2) Short intro paragraph (2-3 sentences)
3) Section titled ${featuresHeading} with 5-8 bullets
4) Short closing paragraph with a call to contact

Rules:
- Prioritize user-provided details.
- Integrate visual strengths seen in the photo naturally into the copy.
- Never invent unknown facts.
- If available, include price, location, and m² details explicitly.
- Do not wrap the output in markdown code blocks.

User data:
- Listing Type: ${listingTypeLabel}
- Location: ${info.lokasyon || 'Not specified'}
- Square Meters: ${info.metrekare || 'Not specified'}
- Room Count: ${info.odaSayisi || 'Not specified'}
- Bathroom Count: ${info.banyoSayisi || 'Not specified'}
- Floor: ${info.kat || 'Not specified'}
- Building Age: ${info.binaYasi || 'Not specified'}
- Heating: ${info.isitma || 'Not specified'}
- Price: ${info.fiyat || 'Not specified'}
- Additional Notes: ${info.ekNotlar || 'None'}
`.trim();
}

function cleanModelOutput(text: string): string {
    let out = text.trim();
    out = out.replace(/^```[a-zA-Z]*\n?/, '');
    out = out.replace(/\n?```$/, '');
    return out.trim();
}

/** Fallback: API anahtarı yoksa veya model hata verirse yine metin üret. */
function generateFallbackListingText(info: IlanBilgileri, lang: Language): string {
    const isEnglish = lang === 'en';
    const kullanimLabel = isEnglish
        ? info.kullanim === 'kiralik' ? 'For Rent' : 'For Sale'
        : info.kullanim === 'kiralik' ? 'Kiralık' : 'Satılık';
    const parts: string[] = [];

    parts.push(
        isEnglish ? `${kullanimLabel} Residence` : `${kullanimLabel} Konut`
    );
    parts.push('');

    if (info.lokasyon) {
        parts.push(`${isEnglish ? 'Location' : 'Konum'}: ${info.lokasyon}`);
        parts.push('');
    }

    const ozellikler: string[] = [];
    if (info.metrekare) ozellikler.push(`${info.metrekare} m²`);
    if (info.odaSayisi) ozellikler.push(isEnglish ? `${info.odaSayisi} rooms` : `${info.odaSayisi} oda`);
    if (info.banyoSayisi) ozellikler.push(isEnglish ? `${info.banyoSayisi} bathrooms` : `${info.banyoSayisi} banyo`);
    if (info.kat) ozellikler.push(info.kat);
    if (info.binaYasi) ozellikler.push(`${isEnglish ? 'Building age' : 'Bina yaşı'}: ${info.binaYasi}`);
    if (info.isitma) ozellikler.push(`${isEnglish ? 'Heating' : 'Isınma'}: ${info.isitma}`);

    if (ozellikler.length > 0) {
        parts.push(isEnglish ? 'Features:' : 'Özellikler:');
        parts.push(ozellikler.join(' • '));
        parts.push('');
    }

    if (info.fiyat) {
        parts.push(`${isEnglish ? 'Price' : 'Fiyat'}: ${info.fiyat}`);
        parts.push('');
    }

    parts.push(isEnglish ? 'Description:' : 'Açıklama:');
    parts.push(
        isEnglish
            ? 'This is a draft listing prepared from the details you provided and the uploaded photos. The text can be further enriched with room usage and standout details inferred from the visuals.'
            : 'Bu mülk, verdiğiniz bilgiler ve yüklediğiniz fotoğraflara göre hazırlanmış bir ilan taslağıdır. Yapay zeka entegrasyonu ile fotoğraflardan oda kullanımları ve öne çıkan detaylar otomatik eklenerek metin zenginleştirilecektir.'
    );

    if (info.ekNotlar) {
        parts.push('');
        parts.push(isEnglish ? 'Additional notes:' : 'Ek bilgiler:');
        parts.push(info.ekNotlar);
    }

    return parts.join('\n');
}

export async function POST(request: NextRequest) {
    const lang = getRequestLanguage(request);
    return NextResponse.json(
        { success: false, code: 'FEATURE_DISABLED', error: translateText(lang, 'İlan metni özelliği şu anda kullanılamıyor.') },
        { status: 410 }
    );

    /*
    let chargedPhone = '';
    let chargedCredits = 0;
    let infoForFailure: IlanBilgileri = {};
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const ilanBilgileriRaw = formData.get('ilanBilgileri') as string | null;
        const phone = String(formData.get('phone') || '');
        chargedPhone = phone;

        if (!image) {
            return NextResponse.json(
                { success: false, error: translateText(lang, 'Görsel gerekli') },
                { status: 400 }
            );
        }
        if (!phone) {
            return NextResponse.json(
                { success: false, error: translateText(lang, 'İşlem için giriş yapmanız gerekiyor') },
                { status: 401 }
            );
        }
        const authError = requireAuthPhone(request, phone);
        if (authError) return authError;

        let info: IlanBilgileri = {};
        if (ilanBilgileriRaw) {
            try {
                info = JSON.parse(ilanBilgileriRaw) as IlanBilgileri;
            } catch {
                // ignore
            }
        }
        infoForFailure = info;

        let text = '';
        let provider: 'gemini' | 'fallback' = 'fallback';
        const runId = createListingRunId();
        const adaptivePolicy = getListingAdaptivePolicy();

        try {
            const model = getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });
            const mimeType = image.type || 'image/jpeg';
            const bytes = await image.arrayBuffer();
            const base64Data = Buffer.from(bytes).toString('base64');
            const prompt = buildAdaptiveListingPrompt(buildListingPrompt(info, lang), adaptivePolicy, false);

            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: base64Data } },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: adaptivePolicy.temperature,
                    topP: 0.9,
                    maxOutputTokens: adaptivePolicy.maxOutputTokens,
                },
            });

            const generated = result.response.text() || '';
            text = cleanModelOutput(generated);
            if (text) provider = 'gemini';

            const firstQuality = evaluateListingTextQuality(text, info, adaptivePolicy);
            if (!firstQuality.ok && adaptivePolicy.retryEnabled) {
                const retryPrompt = buildAdaptiveListingPrompt(buildListingPrompt(info, lang), adaptivePolicy, true);
                const retryResult = await model.generateContent({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: retryPrompt },
                                { inlineData: { mimeType, data: base64Data } },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: Math.max(0.35, adaptivePolicy.temperature - 0.08),
                        topP: 0.88,
                        maxOutputTokens: Math.max(700, adaptivePolicy.maxOutputTokens),
                    },
                });
                const retryText = cleanModelOutput(retryResult.response.text() || '');
                const retryQuality = evaluateListingTextQuality(retryText, info, adaptivePolicy);
                if (retryQuality.score >= firstQuality.score && retryText) {
                    text = retryText;
                }
            }
        } catch (aiError) {
            console.error('Ilan-metni Gemini generation failed, using fallback:', aiError);
        }

        if (!text) {
            text = generateFallbackListingText(info, lang);
            provider = 'fallback';
        }

        const quality = evaluateListingTextQuality(text, info, adaptivePolicy);

        const creditResult = await deductCredits(phone, LISTING_TEXT_COST, 'tool_listing_text');
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: translateText(lang, 'Yetersiz kredi'), credits: creditResult.credits },
                { status: 402 }
            );
        }
        chargedCredits = LISTING_TEXT_COST;

        recordListingRun({
            runId,
            phone,
            status: 'success',
            provider,
            info,
            outputText: text,
            qualityScore: quality.score,
            reason: quality.ok ? undefined : quality.reason,
            usedCredits: LISTING_TEXT_COST,
        });
        const beforeImageUrl = await fileToDataUrl(image);
        recordToolRun({
            runId,
            phone,
            toolId: 'listing-text',
            beforeImageUrl,
            afterImageUrl: null,
            title: 'İlan Metni Oluşturucu',
            detail: text.slice(0, 500),
            usedCredits: LISTING_TEXT_COST,
        });
        updateListingAdaptiveOutcome(quality.ok, quality.reason);

        return NextResponse.json({
            success: true,
            runId,
            text,
            provider,
            qualityScore: quality.score,
            qualityIssues: quality.issues,
            credits: creditResult.credits,
            usedCredits: LISTING_TEXT_COST
        });
    } catch (error: unknown) {
        if (chargedCredits > 0 && chargedPhone) {
            try {
                await addCredits(chargedPhone, chargedCredits, 'auto_refund_listing_text_error');
            } catch (refundError) {
                console.error('Listing-text auto refund failed:', refundError);
            }
        }
        if (chargedPhone) {
            recordListingRun({
                runId: createListingRunId(),
                phone: chargedPhone,
                status: 'failed',
                provider: 'fallback',
                info: infoForFailure,
                outputText: '',
                qualityScore: 0,
                reason: 'provider',
                usedCredits: 0,
            });
            updateListingAdaptiveOutcome(false, 'provider');
        }
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
    */
}

async function fileToDataUrl(file: File): Promise<string> {
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mime = file.type || 'image/jpeg';
    return `data:${mime};base64,${bytes}`;
}
