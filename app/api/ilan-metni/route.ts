import { NextRequest, NextResponse } from 'next/server';

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

/** Generates listing text from form data + image. AI integration can replace this body. */
function generateListingText(info: IlanBilgileri): string {
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
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const ilanBilgileriRaw = formData.get('ilanBilgileri') as string | null;

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Görsel gerekli' },
                { status: 400 }
            );
        }

        let info: IlanBilgileri = {};
        if (ilanBilgileriRaw) {
            try {
                info = JSON.parse(ilanBilgileriRaw) as IlanBilgileri;
            } catch {
                // ignore
            }
        }

        const text = generateListingText(info);
        return NextResponse.json({ success: true, text });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'İşlem başarısız oldu';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
