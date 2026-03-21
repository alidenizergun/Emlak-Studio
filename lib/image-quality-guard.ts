import { Jimp } from 'jimp';
import { parseDataUrl as parseUrl } from '@/lib/data-url';

type QualityTool = 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation';

interface QualityProfile {
    minSide: number;
    minSharpness: number;
    minContrastStd: number;
    outputMinScore: number;
}

const DEFAULT_PROFILE: QualityProfile = {
    minSide: Number(process.env.QUALITY_MIN_SIDE || 480),
    minSharpness: Number(process.env.QUALITY_MIN_SHARPNESS || 0.006),
    minContrastStd: Number(process.env.QUALITY_MIN_STD || 0.06),
    outputMinScore: Number(process.env.QUALITY_OUTPUT_MIN_SCORE || 0.55),
};

const TOOL_PROFILES: Record<QualityTool, QualityProfile> = {
    stage: {
        ...DEFAULT_PROFILE,
        outputMinScore: Number(process.env.QUALITY_STAGE_OUTPUT_MIN_SCORE || 0.56),
    },
    enhance: {
        ...DEFAULT_PROFILE,
        outputMinScore: Number(process.env.QUALITY_ENHANCE_OUTPUT_MIN_SCORE || 0.5),
    },
    'remove-object': {
        ...DEFAULT_PROFILE,
        outputMinScore: Number(process.env.QUALITY_REMOVE_OUTPUT_MIN_SCORE || 0.53),
    },
    'virtual-renovation': {
        ...DEFAULT_PROFILE,
        outputMinScore: Number(process.env.QUALITY_RENOVATION_OUTPUT_MIN_SCORE || 0.54),
    },
};

interface ImageMetrics {
    width: number;
    height: number;
    meanLuma: number;
    stdLuma: number;
    sharpness: number;
    aspect: number;
}

interface GuardResult {
    ok: boolean;
    error?: string;
    metrics: ImageMetrics;
    score?: number;
}

export type { ImageMetrics, GuardResult, QualityTool };

function parseDataUrl(dataUrl: string): Buffer {
    const parsed = parseUrl(dataUrl);
    return Buffer.from(parsed.base64, 'base64');
}

async function readRgbRaw(input: Buffer): Promise<{ raw: Buffer; width: number; height: number }> {
    const width = 256;
    const height = 256;
    const img = await Jimp.read(input);
    img.resize({ w: width, h: height });
    return { raw: img.bitmap.data, width, height };
}

function computeMetrics(raw: Buffer, width: number, height: number): ImageMetrics {
    const gray = new Float32Array(width * height);
    let sum = 0;
    for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
        const l = (0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]) / 255;
        gray[p] = l;
        sum += l;
    }
    const mean = sum / gray.length;

    let variance = 0;
    for (let i = 0; i < gray.length; i += 1) {
        const d = gray[i] - mean;
        variance += d * d;
    }
    const std = Math.sqrt(variance / gray.length);

    let lapSum = 0;
    let lapSqSum = 0;
    let count = 0;
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            const lap =
                gray[idx - width] +
                gray[idx + width] +
                gray[idx - 1] +
                gray[idx + 1] -
                4 * gray[idx];
            lapSum += lap;
            lapSqSum += lap * lap;
            count += 1;
        }
    }
    const lapMean = count > 0 ? lapSum / count : 0;
    const lapVar = count > 0 ? lapSqSum / count - lapMean * lapMean : 0;
    const sharpness = Math.max(0, lapVar);

    return {
        width,
        height,
        meanLuma: mean,
        stdLuma: std,
        sharpness,
        aspect: width / Math.max(height, 1),
    };
}

async function metricsFromFile(file: File): Promise<ImageMetrics> {
    const src = Buffer.from(await file.arrayBuffer());
    const rawInfo = await readRgbRaw(src);
    const meta = await Jimp.read(src);
    const metrics = computeMetrics(rawInfo.raw, rawInfo.width, rawInfo.height);
    return {
        ...metrics,
        width: meta.bitmap.width || metrics.width,
        height: meta.bitmap.height || metrics.height,
        aspect: (meta.bitmap.width || metrics.width) / Math.max(meta.bitmap.height || metrics.height, 1),
    };
}

async function metricsFromDataUrl(dataUrl: string): Promise<ImageMetrics> {
    const src = parseDataUrl(dataUrl);
    const rawInfo = await readRgbRaw(src);
    const meta = await Jimp.read(src);
    const metrics = computeMetrics(rawInfo.raw, rawInfo.width, rawInfo.height);
    return {
        ...metrics,
        width: meta.bitmap.width || metrics.width,
        height: meta.bitmap.height || metrics.height,
        aspect: (meta.bitmap.width || metrics.width) / Math.max(meta.bitmap.height || metrics.height, 1),
    };
}

function getProfile(tool: QualityTool = 'stage'): QualityProfile {
    return TOOL_PROFILES[tool] || DEFAULT_PROFILE;
}

export function scoreInputImageQuality(metrics: ImageMetrics, tool: QualityTool = 'stage'): number {
    const profile = getProfile(tool);
    const sizeScore = Math.min(1, Math.min(metrics.width, metrics.height) / Math.max(profile.minSide * 1.8, 1));
    const sharpnessScore = Math.min(1, metrics.sharpness / Math.max(profile.minSharpness * 3, 0.0001));
    const contrastScore = Math.min(1, metrics.stdLuma / Math.max(profile.minContrastStd * 2, 0.0001));
    const exposureCenter = 1 - Math.min(1, Math.abs(metrics.meanLuma - 0.5) / 0.5);
    const aspectPenalty = metrics.aspect < 0.45 || metrics.aspect > 2.4 ? 0.22 : 0;
    return Math.max(
        0,
        Math.min(
            1,
            0.3 * sizeScore +
            0.3 * sharpnessScore +
            0.2 * contrastScore +
            0.2 * exposureCenter -
            aspectPenalty
        )
    );
}

export async function extractImageMetrics(image: File): Promise<ImageMetrics> {
    return metricsFromFile(image);
}

export async function validateInputImageQuality(image: File, tool: QualityTool = 'stage'): Promise<GuardResult> {
    const profile = getProfile(tool);
    const m = await metricsFromFile(image);
    const score = scoreInputImageQuality(m, tool);
    if (Math.min(m.width, m.height) < profile.minSide) {
        return { ok: false, error: `Gorsel cozunurlugu dusuk (min ${profile.minSide}px).`, metrics: m, score };
    }
    if (m.meanLuma < 0.08 || m.meanLuma > 0.92) {
        return { ok: false, error: 'Gorsel asiri karanlik veya asiri parlak.', metrics: m, score };
    }
    if (m.stdLuma < profile.minContrastStd) {
        return { ok: false, error: 'Gorsel kontrasti cok dusuk.', metrics: m, score };
    }
    if (m.sharpness < profile.minSharpness) {
        return { ok: false, error: 'Gorsel yeterince net degil.', metrics: m, score };
    }
    if (m.aspect < 0.45 || m.aspect > 2.4) {
        return { ok: false, error: 'Gorsel en-boy orani uygun degil.', metrics: m, score };
    }
    return { ok: true, metrics: m, score };
}

export async function verifyOutputImageQuality(
    inputImage: File,
    outputDataUrl: string,
    tool: QualityTool = 'stage'
): Promise<GuardResult> {
    const profile = getProfile(tool);
    const [input, output] = await Promise.all([
        metricsFromFile(inputImage),
        metricsFromDataUrl(outputDataUrl),
    ]);

    const sharpnessRatio = output.sharpness / Math.max(input.sharpness, 0.0001);
    const contrastRatio = output.stdLuma / Math.max(input.stdLuma, 0.0001);
    const exposureBalance = 1 - Math.abs(output.meanLuma - 0.5) * 2;
    const geometryPenalty = Math.abs(input.aspect - output.aspect) > 0.08 ? 0.25 : 0;
    const score = Math.max(
        0,
        Math.min(
            1,
            0.45 * Math.min(1.3, sharpnessRatio) +
                0.35 * Math.min(1.3, contrastRatio) +
                0.2 * Math.max(0, exposureBalance) -
                geometryPenalty
        )
    );

    if (score < profile.outputMinScore) {
        return {
            ok: false,
            error: `Cikti kalite skoru dusuk (${score.toFixed(2)}).`,
            metrics: output,
            score,
        };
    }
    return { ok: true, metrics: output, score };
}
