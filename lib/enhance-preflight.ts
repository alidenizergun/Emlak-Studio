import { Jimp } from 'jimp';
import type { ImageMetrics } from '@/lib/image-quality-guard';
import { parseDataUrl as parseUrl } from '@/lib/data-url';

export interface EnhancePreflightAnalysis {
    darkScene: boolean;
    lowContrast: boolean;
    blurry: boolean;
    lowColor: boolean;
    outdoorLikely: boolean;
    colorfulness: number;
}

function parseDataUrl(dataUrl: string): Buffer {
    const parsed = parseUrl(dataUrl);
    return Buffer.from(parsed.base64, 'base64');
}

async function computeColorfulnessFromBuffer(buffer: Buffer): Promise<number> {
    const img = await Jimp.read(buffer);
    img.resize({ w: 256, h: 256 });
    const raw = img.bitmap.data;
    let rgMean = 0;
    let rgVar = 0;
    let ybMean = 0;
    let ybVar = 0;
    const n = raw.length / 4;
    for (let i = 0; i < raw.length; i += 4) {
        const r = raw[i];
        const g = raw[i + 1];
        const b = raw[i + 2];
        const rg = r - g;
        const yb = 0.5 * (r + g) - b;
        rgMean += rg;
        ybMean += yb;
    }
    rgMean /= n;
    ybMean /= n;
    for (let i = 0; i < raw.length; i += 4) {
        const r = raw[i];
        const g = raw[i + 1];
        const b = raw[i + 2];
        const rg = r - g;
        const yb = 0.5 * (r + g) - b;
        rgVar += (rg - rgMean) ** 2;
        ybVar += (yb - ybMean) ** 2;
    }
    const rgStd = Math.sqrt(rgVar / n);
    const ybStd = Math.sqrt(ybVar / n);
    return Math.sqrt(rgStd ** 2 + ybStd ** 2) + 0.3 * Math.sqrt(rgMean ** 2 + ybMean ** 2);
}

async function computeOutdoorLikelihood(buffer: Buffer): Promise<boolean> {
    const img = await Jimp.read(buffer);
    img.resize({ w: 200, h: 120 });
    const raw = img.bitmap.data;
    const w = 200;
    const h = 120;
    const skyBandMaxY = Math.floor(h * 0.38);
    let bluePixels = 0;
    let total = 0;
    for (let y = 0; y < skyBandMaxY; y += 1) {
        for (let x = 0; x < w; x += 1) {
            const i = (y * w + x) * 4;
            const r = raw[i];
            const g = raw[i + 1];
            const b = raw[i + 2];
            if (b > g + 8 && g > r - 6) bluePixels += 1;
            total += 1;
        }
    }
    return total > 0 && bluePixels / total >= 0.19;
}

export async function analyzeEnhancePreflight(
    image: File,
    metrics: ImageMetrics
): Promise<EnhancePreflightAnalysis> {
    const buffer = Buffer.from(await image.arrayBuffer());
    const colorfulness = await computeColorfulnessFromBuffer(buffer);
    const outdoorLikely = await computeOutdoorLikelihood(buffer);
    return {
        darkScene: metrics.meanLuma < 0.34,
        lowContrast: metrics.stdLuma < 0.11,
        blurry: metrics.sharpness < 0.012,
        lowColor: colorfulness < Number(process.env.ENHANCE_LOW_COLOR_THRESHOLD || 34),
        outdoorLikely,
        colorfulness,
    };
}

export function resolveAutoEnhanceOptions(analysis: EnhancePreflightAnalysis): Record<string, boolean> {
    const options: Record<string, boolean> = {};
    if (analysis.darkScene || analysis.lowContrast) options.lighting = true;
    if (analysis.lowColor) options.color = true;
    if (analysis.blurry) options.sharpness = true;
    if (!analysis.blurry && (analysis.lowContrast || analysis.darkScene)) options.clean = true;
    if (analysis.outdoorLikely) options.sky = true;

    // Keep auto deterministic and conservative: avoid forcing twilight/privacy by default.
    if (Object.keys(options).length === 0) {
        options.lighting = true;
        options.sharpness = true;
    }
    return options;
}

export async function analyzeOutputColorfulness(outputDataUrl: string): Promise<number> {
    const buffer = parseDataUrl(outputDataUrl);
    return computeColorfulnessFromBuffer(buffer);
}
