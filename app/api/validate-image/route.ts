import { NextRequest, NextResponse } from 'next/server';
import {
    extractImageMetrics,
    scoreInputImageQuality,
    validateInputImageForProcessing,
    type QualityTool,
} from '@/lib/image-quality-guard';
import { validateUploadedImage } from '@/lib/upload-guard';

const MIN_VALIDATION_SCORE = Number(process.env.MIN_VALIDATION_SCORE || 0.5);

function normalizeTool(value: string): QualityTool {
    if (value === 'enhance' || value === 'remove-object' || value === 'virtual-renovation') {
        return value;
    }
    return 'stage';
}

function buildGuidance(error: string): string {
    const text = String(error || '').toLowerCase();
    if (text.includes('cozunurlugu dusuk')) {
        return 'Lutfen daha yuksek cozumurlukte bir fotograf yukleyin. Orijinal kameradan alinmis, sikistirilmamis bir gorsel en iyi sonucu verir.';
    }
    if (text.includes('asiri karanlik') || text.includes('asiri parlak')) {
        return 'Lutfen daha dengeli isikta cekilmis bir fotograf yukleyin. Oda net gorunmeli, patlayan beyazlar veya cok koyu golgeler olmamali.';
    }
    if (text.includes('kontrasti cok dusuk')) {
        return 'Lutfen duvar, zemin ve mobilya kenarlari daha net secilen bir fotograf yukleyin. Sisli, puslu veya cok duz gorunen kareler uygun degil.';
    }
    if (text.includes('yeterince net degil')) {
        return 'Bu fotograf fazla flu. Lutfen daha net, titresimsiz ve odaklanmis bir kare yukleyin.';
    }
    if (text.includes('en-boy orani uygun degil')) {
        return 'Lutfen odayi dogal kadrajla gosteren standart bir fotograf yukleyin. Asiri dar veya asiri uzun goruntuler yerine normal kamera kadraji kullanin.';
    }
    if (text.includes('format')) {
        return 'Lutfen JPEG, PNG veya WEBP formatinda bir fotograf yukleyin.';
    }
    if (text.includes('boyutu cok buyuk')) {
        return 'Dosya boyutunu azaltip tekrar deneyin. Mumkunse kaliteyi cok dusurmeden yeniden disa aktarilmis bir gorsel kullanin.';
    }
    if (text.includes('uygunluk skoru dusuk')) {
        return 'Lutfen en az 50/100 uygunluk skoruna ulasan, daha net ve dengeli isikta bir fotograf yukleyin.';
    }
    return 'Lutfen daha net, iyi isiklandirilmis ve odayi tam gosteren bir fotograf yukleyin.';
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image');
        const tool = normalizeTool(String(formData.get('tool') || 'stage'));

        if (!(image instanceof File)) {
            return NextResponse.json(
                { success: false, error: 'Gorsel gerekli', guidance: buildGuidance('Gorsel gerekli') },
                { status: 400 }
            );
        }

        const uploadCheck = validateUploadedImage(image);
        if (!uploadCheck.ok) {
            return NextResponse.json(
                { success: false, error: uploadCheck.error, guidance: buildGuidance(uploadCheck.error) },
                { status: 200 }
            );
        }

        const metrics = await extractImageMetrics(image);
        const score = scoreInputImageQuality(metrics, tool);

        const qualityCheck = await validateInputImageForProcessing(image, tool);
        if (score < MIN_VALIDATION_SCORE) {
            const qualityError = !qualityCheck.ok ? String(qualityCheck.error || '') : '';
            const error = qualityError || `Fotograf uygunluk skoru dusuk (min ${Math.round(MIN_VALIDATION_SCORE * 100)}/100).`;
            return NextResponse.json(
                {
                    success: false,
                    error,
                    guidance: buildGuidance(error),
                    metrics,
                    score,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            success: true,
            metrics,
            score,
            advisory: !qualityCheck.ok ? String(qualityCheck.error || '') : '',
            guidance: !qualityCheck.ok ? buildGuidance(String(qualityCheck.error || '')) : '',
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gorsel dogrulanamadi';
        return NextResponse.json({ success: false, error: message, guidance: buildGuidance(message) }, { status: 500 });
    }
}
