import { Jimp } from 'jimp';
import { verifyOutputImageQuality } from '@/lib/image-quality-guard';
import { analyzeOutputColorfulness } from '@/lib/enhance-preflight';

export interface EnhanceContractResult {
    ok: boolean;
    score: number;
    reason?: string;
    checks: {
        baseQuality: number;
        colorQuality: number;
        sharpnessQuality: number;
    };
}

interface MiniMetrics {
    meanLuma: number;
    stdLuma: number;
    sharpness: number;
}

async function miniMetricsFromFile(file: File): Promise<MiniMetrics> {
    const img = await Jimp.read(Buffer.from(await file.arrayBuffer()));
    img.resize({ w: 256, h: 256 });
    return miniMetricsFromBitmap(img.bitmap.data, 256, 256);
}

async function miniMetricsFromDataUrl(dataUrl: string): Promise<MiniMetrics> {
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error('Gecersiz cikti formati.');
    const img = await Jimp.read(Buffer.from(match[1], 'base64'));
    img.resize({ w: 256, h: 256 });
    return miniMetricsFromBitmap(img.bitmap.data, 256, 256);
}

function miniMetricsFromBitmap(raw: Buffer, width: number, height: number): MiniMetrics {
    const gray = new Float32Array(width * height);
    let sum = 0;
    for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
        const l = (0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]) / 255;
        gray[p] = l;
        sum += l;
    }
    const mean = sum / gray.length;
    let variance = 0;
    for (let i = 0; i < gray.length; i += 1) variance += (gray[i] - mean) ** 2;
    const std = Math.sqrt(variance / gray.length);

    let lapSq = 0;
    let count = 0;
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            const lap = gray[idx - width] + gray[idx + width] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
            lapSq += lap * lap;
            count += 1;
        }
    }
    return {
        meanLuma: mean,
        stdLuma: std,
        sharpness: count > 0 ? lapSq / count : 0,
    };
}

function hasOption(options: Record<string, boolean>, id: string): boolean {
    return options.auto || options[id];
}

export async function verifyEnhanceQualityContract(
    inputImage: File,
    outputDataUrl: string,
    options: Record<string, boolean>
): Promise<EnhanceContractResult> {
    const base = await verifyOutputImageQuality(inputImage, outputDataUrl, 'enhance');
    const [inMini, outMini, inColorfulness, outColorfulness] = await Promise.all([
        miniMetricsFromFile(inputImage),
        miniMetricsFromDataUrl(outputDataUrl),
        analyzeOutputColorfulness(`data:image/jpeg;base64,${Buffer.from(await inputImage.arrayBuffer()).toString('base64')}`),
        analyzeOutputColorfulness(outputDataUrl),
    ]);

    const baseQuality = base.score ?? 0;
    const sharpnessRatio = outMini.sharpness / Math.max(inMini.sharpness, 0.0001);
    const colorRatio = outColorfulness / Math.max(inColorfulness, 1);
    const exposurePenalty = Math.abs(outMini.meanLuma - 0.52);

    let sharpnessQuality = Math.min(1.2, sharpnessRatio);
    let colorQuality = Math.min(1.2, colorRatio);
    if (hasOption(options, 'sharpness') && sharpnessRatio < 1.02) {
        sharpnessQuality -= 0.18;
    }
    if (hasOption(options, 'color') && colorRatio < 0.95) {
        colorQuality -= 0.16;
    }
    if (hasOption(options, 'lighting') && exposurePenalty > 0.3) {
        colorQuality -= 0.08;
    }
    if (colorRatio > 2.2) {
        colorQuality -= 0.15;
    }

    const score = Math.max(
        0,
        Math.min(
            1,
            0.55 * Math.min(1, baseQuality) +
                0.25 * Math.max(0, Math.min(1, sharpnessQuality)) +
                0.2 * Math.max(0, Math.min(1, colorQuality))
        )
    );
    const minScore = Number(process.env.ENHANCE_CONTRACT_MIN_SCORE || 0.56);
    if (!base.ok) {
        return {
            ok: false,
            score,
            reason: base.error || 'Cikti kalite kapisindan gecemedi.',
            checks: { baseQuality, colorQuality, sharpnessQuality },
        };
    }
    if (score < minScore) {
        return {
            ok: false,
            score,
            reason: `Enhance kalite sozlesmesi saglanamadi (${score.toFixed(2)}).`,
            checks: { baseQuality, colorQuality, sharpnessQuality },
        };
    }
    return { ok: true, score, checks: { baseQuality, colorQuality, sharpnessQuality } };
}
