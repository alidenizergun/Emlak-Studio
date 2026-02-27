import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addCredits, deductCredits } from '@/lib/credits';
import { requireAuthPhone } from '@/lib/auth-guard';
import { TOOL_CREDIT_COSTS } from '@/lib/tool-credit-costs';
import {
    buildAdaptiveListingPrompt,
    createListingRunId,
    evaluateListingTextQuality,
    getListingAdaptivePolicy,
    recordListingRun,
    updateListingAdaptiveOutcome,
} from '@/lib/listing-text-runtime';

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

const GOOGLE_API_KEY =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    '';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
const LISTING_TEXT_COST = TOOL_CREDIT_COSTS.listingText;

function buildListingPrompt(info: IlanBilgileri): string {
    const kullanimLabel = info.kullanim === 'kiralik' ? 'Kiralık' : 'Satılık';
    return `
Sen Türkiye emlak sektöründe çalışan kıdemli bir ilan metni uzmanısın.
Kullanıcının verdiği ilan bilgileri ve yüklenen fotoğrafı birlikte analiz ederek güçlü bir ilan metni üret.

Amaç:
- İlanın tıklanma oranını artıracak, güven veren ve profesyonel bir metin yaz.
- Abartı, gerçek dışı vaat, yanıltıcı ifade kullanma.

Dil ve stil:
- Sadece Türkçe yaz.
- Akıcı, satış odaklı ama doğal bir ton kullan.
- Aşırı emoji, gereksiz büyük harf, spam tonu kullanma.
- Gereksiz uzatma yapma; kısa ama etkili ol.

Çıktı formatı (tam olarak bu sırayla):
1) Tek satır başlık
2) Kısa giriş paragrafı (2-3 cümle)
3) "Öne Çıkan Özellikler" başlığı altında 5-8 madde
4) Kapanış paragrafı (iletişime yönlendiren kısa çağrı)

Kurallar:
- Kullanıcının verdiği bilgileri önceliklendir.
- Fotoğrafta gördüğün güçlü noktaları metne doğal şekilde yedir.
- Bilinmeyen alanları uydurma.
- Fiyat, konum, m² gibi alanlar varsa mutlaka metinde geçir.
- Metni markdown code block içine alma.

Kullanıcı verileri:
- İlan Türü: ${kullanimLabel}
- Lokasyon: ${info.lokasyon || 'Belirtilmedi'}
- Metrekare: ${info.metrekare || 'Belirtilmedi'}
- Oda Sayısı: ${info.odaSayisi || 'Belirtilmedi'}
- Banyo Sayısı: ${info.banyoSayisi || 'Belirtilmedi'}
- Kat: ${info.kat || 'Belirtilmedi'}
- Bina Yaşı: ${info.binaYasi || 'Belirtilmedi'}
- Isıtma: ${info.isitma || 'Belirtilmedi'}
- Fiyat: ${info.fiyat || 'Belirtilmedi'}
- Ek Notlar: ${info.ekNotlar || 'Yok'}
`.trim();
}

function cleanModelOutput(text: string): string {
    let out = text.trim();
    out = out.replace(/^```[a-zA-Z]*\n?/, '');
    out = out.replace(/\n?```$/, '');
    return out.trim();
}

/** Fallback: API anahtarı yoksa veya model hata verirse yine metin üret. */
function generateFallbackListingText(info: IlanBilgileri): string {
    const kullanimLabel = info.kullanim === 'kiralik' ? 'Kiralık' : 'Satılık';
    const parts: string[] = [];

    parts.push(`${kullanimLabel} Konut`);
    parts.push('');

    if (info.lokasyon) {
        parts.push(`Konum: ${info.lokasyon}`);
        parts.push('');
    }

    const ozellikler: string[] = [];
    if (info.metrekare) ozellikler.push(`${info.metrekare} m²`);
    if (info.odaSayisi) ozellikler.push(`${info.odaSayisi} oda`);
    if (info.banyoSayisi) ozellikler.push(`${info.banyoSayisi} banyo`);
    if (info.kat) ozellikler.push(info.kat);
    if (info.binaYasi) ozellikler.push(`Bina yaşı: ${info.binaYasi}`);
    if (info.isitma) ozellikler.push(`Isınma: ${info.isitma}`);

    if (ozellikler.length > 0) {
        parts.push('Özellikler:');
        parts.push(ozellikler.join(' • '));
        parts.push('');
    }

    if (info.fiyat) {
        parts.push(`Fiyat: ${info.fiyat}`);
        parts.push('');
    }

    parts.push('Açıklama:');
    parts.push(
        `Bu mülk, verdiğiniz bilgiler ve yüklediğiniz fotoğraflara göre hazırlanmış bir ilan taslağıdır. ` +
        `Yapay zeka entegrasyonu ile fotoğraflardan oda kullanımları ve öne çıkan detaylar otomatik eklenerek metin zenginleştirilecektir.`
    );

    if (info.ekNotlar) {
        parts.push('');
        parts.push('Ek bilgiler:');
        parts.push(info.ekNotlar);
    }

    return parts.join('\n');
}

export async function POST(request: NextRequest) {
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
                { success: false, error: 'Görsel gerekli' },
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

        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                const mimeType = image.type || 'image/jpeg';
                const bytes = await image.arrayBuffer();
                const base64Data = Buffer.from(bytes).toString('base64');
                const prompt = buildAdaptiveListingPrompt(buildListingPrompt(info), adaptivePolicy, false);

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
                    const retryPrompt = buildAdaptiveListingPrompt(buildListingPrompt(info), adaptivePolicy, true);
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
        }

        if (!text) {
            text = generateFallbackListingText(info);
            provider = 'fallback';
        }

        const quality = evaluateListingTextQuality(text, info, adaptivePolicy);

        const creditResult = await deductCredits(phone, LISTING_TEXT_COST, 'tool_listing_text');
        if (!creditResult.ok) {
            return NextResponse.json(
                { success: false, code: 'INSUFFICIENT_CREDITS', error: 'Yetersiz kredi', credits: creditResult.credits },
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
}
