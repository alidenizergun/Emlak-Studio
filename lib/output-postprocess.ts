import { Jimp } from 'jimp';
import { parseDataUrl as parseUrl } from '@/lib/data-url';

interface PostprocessOptions {
    tool: 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation';
    enhanceOptions?: Record<string, boolean>;
}
type JimpImage = Awaited<ReturnType<typeof Jimp.read>>;

function flattenTransparencyOnWhite(image: JimpImage): void {
    const raw = image.bitmap.data;
    for (let i = 0; i < raw.length; i += 4) {
        const a = raw[i + 3] ?? 255;
        if (a >= 255) continue;
        const alpha = a / 255;
        raw[i] = Math.round(raw[i] * alpha + 255 * (1 - alpha));
        raw[i + 1] = Math.round(raw[i + 1] * alpha + 255 * (1 - alpha));
        raw[i + 2] = Math.round(raw[i + 2] * alpha + 255 * (1 - alpha));
        raw[i + 3] = 255;
    }
}

function parseDataUrl(dataUrl: string): { mime: string; data: Buffer } {
    const parsed = parseUrl(dataUrl);
    return {
        mime: parsed.mimeType || 'image/jpeg',
        data: Buffer.from(parsed.base64, 'base64'),
    };
}

function encodeDataUrl(mime: string, data: Buffer): string {
    return `data:${mime};base64,${data.toString('base64')}`;
}

function getMinSideTarget(tool: 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation'): number {
    if (tool === 'stage') {
        return Number(process.env.STAGE_OUTPUT_MIN_SIDE || 1536);
    }
    if (tool === 'remove-object') {
        return Number(process.env.REMOVE_OBJECT_OUTPUT_MIN_SIDE || 1536);
    }
    if (tool === 'virtual-renovation') {
        return Number(process.env.RENOVATION_OUTPUT_MIN_SIDE || 1536);
    }
    return Number(process.env.ENHANCE_OUTPUT_MIN_SIDE || 1536);
}

function getMaxProcessSide(tool: 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation'): number {
    if (tool === 'enhance') {
        return Math.max(1024, Number(process.env.ENHANCE_PROCESS_MAX_SIDE || 1536));
    }
    if (tool === 'stage') {
        return Math.max(1024, Number(process.env.STAGE_PROCESS_MAX_SIDE || 2560));
    }
    if (tool === 'remove-object') {
        return Math.max(1024, Number(process.env.REMOVE_OBJECT_PROCESS_MAX_SIDE || 2560));
    }
    return Math.max(1024, Number(process.env.RENOVATION_PROCESS_MAX_SIDE || 2560));
}

function getPostprocessStrength(tool: 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation'): { contrast: number; sharpen: number; saturation: number } {
    if (tool === 'stage') {
        // Stage ciktisinda "puslu/tozlu" hissini azaltmak icin mikro-kontrasti ve keskinligi bir tik artir.
        return { contrast: 0.1, sharpen: 0.43, saturation: 0.05 };
    }
    if (tool === 'remove-object') {
        return { contrast: 0.05, sharpen: 0.3, saturation: 0.03 };
    }
    if (tool === 'virtual-renovation') {
        return { contrast: 0.06, sharpen: 0.32, saturation: 0.04 };
    }
    return { contrast: 0.05, sharpen: 0.3, saturation: 0.03 };
}

function applySharpenWithKernel(image: JimpImage, amount: number): void {
    const a = Math.max(0, Math.min(0.45, amount));
    if (a <= 0) return;
    image.convolute([
        [0, -a, 0],
        [-a, 1 + 4 * a, -a],
        [0, -a, 0],
    ]);
}

function applyExposureGain(image: JimpImage, gain: number): void {
    const g = Math.max(0.6, Math.min(2.2, gain));
    if (Math.abs(g - 1) < 0.001) return;
    const raw = image.bitmap.data;
    for (let i = 0; i < raw.length; i += 4) {
        raw[i] = Math.max(0, Math.min(255, Math.round(raw[i] * g)));
        raw[i + 1] = Math.max(0, Math.min(255, Math.round(raw[i + 1] * g)));
        raw[i + 2] = Math.max(0, Math.min(255, Math.round(raw[i + 2] * g)));
    }
}

function computeMeanLumaFromBitmap(image: JimpImage): number {
    const raw = image.bitmap.data;
    if (!raw || raw.length < 4) return 0.5;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < raw.length; i += 4) {
        const l = (0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]) / 255;
        sum += l;
        count += 1;
    }
    return count > 0 ? sum / count : 0.5;
}

function applyAutoRelightIfNeeded(image: JimpImage): void {
    const minTarget = Number(process.env.POSTPROCESS_MIN_MEAN_LUMA || 0.36);
    const maxBoost = Number(process.env.POSTPROCESS_MAX_BRIGHTNESS_BOOST || 0.22);
    const mean = computeMeanLumaFromBitmap(image);
    if (mean >= minTarget) return;
    const missing = minTarget - mean;
    const boost = Math.max(0, Math.min(maxBoost, missing * 1.25));
    if (boost > 0) {
        applyExposureGain(image, 1 + boost * 1.9);
        image.contrast(Math.min(0.08, boost * 0.35));
    }
}

function applyRelightToTarget(image: JimpImage, targetMean: number, maxBoost: number): void {
    const mean = computeMeanLumaFromBitmap(image);
    if (mean >= targetMean) return;
    const missing = targetMean - mean;
    const boost = Math.max(0, Math.min(maxBoost, missing * 1.35));
    if (boost > 0) {
        applyExposureGain(image, 1 + boost * 2.0);
        image.contrast(Math.min(0.12, boost * 0.5));
    }
}

function hasEnhanceOption(options: Record<string, boolean> | undefined, id: string): boolean {
    return Boolean(options?.[id]);
}

interface EnhanceDeltaMetrics {
    meanLuma: number;
    meanWarmth: number;
    saturationProxy: number;
    sharpnessProxy: number;
}

function computeEnhanceDeltaMetrics(image: JimpImage): EnhanceDeltaMetrics {
    const raw = image.bitmap.data;
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const gray = new Float32Array(width * height);
    let lumaSum = 0;
    let warmthSum = 0;
    let satSum = 0;
    for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
        const r = raw[i] / 255;
        const g = raw[i + 1] / 255;
        const b = raw[i + 2] / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[p] = l;
        lumaSum += l;
        warmthSum += (r - b);
        satSum += max > 0 ? (max - min) / max : 0;
    }

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

    const pixelCount = Math.max(1, gray.length);
    return {
        meanLuma: lumaSum / pixelCount,
        meanWarmth: warmthSum / pixelCount,
        saturationProxy: satSum / pixelCount,
        sharpnessProxy: count > 0 ? lapSq / count : 0,
    };
}

function applyWarmTwilightTint(image: JimpImage, strength: number): void {
    const raw = image.bitmap.data;
    const warm = Math.max(0, Math.min(18, strength));
    for (let i = 0; i < raw.length; i += 4) {
        raw[i] = Math.min(255, raw[i] + warm);
        raw[i + 1] = Math.min(255, raw[i + 1] + Math.round(warm * 0.45));
        raw[i + 2] = Math.max(0, raw[i + 2] - Math.round(warm * 0.25));
    }
}

function applyUpperBandSkyBoost(image: JimpImage, strength: number): void {
    const raw = image.bitmap.data;
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const topLimit = Math.floor(height * 0.38);
    const boost = Math.max(0, Math.min(20, strength));
    for (let y = 0; y < topLimit; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const idx = (y * width + x) * 4;
            const r = raw[idx];
            const g = raw[idx + 1];
            const b = raw[idx + 2];
            // Favor bright outdoor-like pixels; avoid tinting dark interior.
            const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (luma < 0.32) continue;
            raw[idx] = Math.max(0, r - Math.round(boost * 0.2));
            raw[idx + 1] = Math.min(255, g + Math.round(boost * 0.2));
            raw[idx + 2] = Math.min(255, b + boost);
        }
    }
}

function applyEnhanceOptionStack(image: JimpImage, options?: Record<string, boolean>): void {
    if (!options || Object.keys(options).length === 0) return;
    const before = computeEnhanceDeltaMetrics(image);

    const isAuto = hasEnhanceOption(options, 'auto');
    if (isAuto || hasEnhanceOption(options, 'lighting')) {
        applyRelightToTarget(image, isAuto ? 0.54 : 0.5, isAuto ? 0.34 : 0.3);
    }

    let contrastBoost = 0;
    let saturationBoost = 0;
    let sharpenBoost = 0;

    if (isAuto || hasEnhanceOption(options, 'color')) {
        contrastBoost += isAuto ? 0.08 : 0.06;
        saturationBoost += isAuto ? 14 : 12;
    }
    if (isAuto || hasEnhanceOption(options, 'sharpness')) {
        sharpenBoost += isAuto ? 0.24 : 0.2;
    }
    if (isAuto || hasEnhanceOption(options, 'clean')) {
        image.blur(1.2);
        image.contrast(0.03);
        contrastBoost += 0.03;
        sharpenBoost += isAuto ? 0.14 : 0.12;
    }
    if (hasEnhanceOption(options, 'twilight')) {
        applyExposureGain(image, 1.1);
        contrastBoost += 0.12;
        saturationBoost += 12;
        applyWarmTwilightTint(image, 14);
    }
    if (hasEnhanceOption(options, 'sky')) {
        applyExposureGain(image, 1.05);
        contrastBoost += 0.06;
        saturationBoost += 6;
        applyUpperBandSkyBoost(image, 16);
    }

    if (contrastBoost > 0) {
        image.contrast(Math.min(0.2, contrastBoost));
    }
    if (saturationBoost > 0) {
        image.color([{ apply: 'saturate', params: [Math.min(24, saturationBoost)] }]);
    }
    if (sharpenBoost > 0) {
        applySharpenWithKernel(image, Math.min(0.45, 0.28 + sharpenBoost));
    }

    const after = computeEnhanceDeltaMetrics(image);
    const lumaDelta = after.meanLuma - before.meanLuma;
    const satDelta = after.saturationProxy - before.saturationProxy;
    const sharpDelta = after.sharpnessProxy - before.sharpnessProxy;
    const warmthDelta = after.meanWarmth - before.meanWarmth;

    // Minimum visible effect guard for selected options.
    if ((isAuto || hasEnhanceOption(options, 'lighting')) && lumaDelta < 0.03) {
        applyRelightToTarget(image, isAuto ? 0.56 : 0.52, 0.34);
        applyExposureGain(image, 1.05);
    }
    if ((isAuto || hasEnhanceOption(options, 'color')) && satDelta < 0.02) {
        image.color([{ apply: 'saturate', params: [14] }]);
        image.contrast(0.06);
    }
    if ((isAuto || hasEnhanceOption(options, 'sharpness')) && sharpDelta < 0.003) {
        applySharpenWithKernel(image, 0.42);
    }
    if (hasEnhanceOption(options, 'twilight') && warmthDelta < 0.02) {
        applyWarmTwilightTint(image, 18);
        applyExposureGain(image, 1.06);
        image.contrast(0.04);
    }
    if (hasEnhanceOption(options, 'sky') && satDelta < 0.015) {
        applyUpperBandSkyBoost(image, 20);
    }
}

export async function isDataUrlLikelyBlack(dataUrl: string): Promise<boolean> {
    try {
        const parsed = parseDataUrl(dataUrl);
        const img = await Jimp.read(parsed.data);
        img.resize({ w: 128, h: 128 });
        const raw = img.bitmap.data;
        if (!raw || raw.length < 4) return true;

        let sum = 0;
        const lumas: number[] = [];
        let opaque = 0;
        let veryDark = 0;
        for (let i = 0; i < raw.length; i += 4) {
            const a = raw[i + 3] ?? 255;
            if (a < 16) continue;
            const l = (0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]) / 255;
            lumas.push(l);
            sum += l;
            opaque += 1;
            if (l < 0.02) veryDark += 1;
        }
        if (opaque === 0) return false;
        const mean = sum / lumas.length;
        let variance = 0;
        for (let i = 0; i < lumas.length; i += 1) {
            const d = lumas[i] - mean;
            variance += d * d;
        }
        const std = Math.sqrt(variance / lumas.length);
        const darkRatio = veryDark / Math.max(opaque, 1);
        return (mean < 0.06 && std < 0.02) || (mean < 0.05 && std < 0.03 && darkRatio > 0.85);
    } catch {
        // Let explicit decoder checks decide invalidity; avoid false black positives.
        return false;
    }
}

export async function postprocessListingImage(dataUrl: string, options: PostprocessOptions): Promise<string> {
    const parsed = parseDataUrl(dataUrl);
    const image = await Jimp.read(parsed.data);
    flattenTransparencyOnWhite(image);
    const minSide = Math.max(640, getMinSideTarget(options.tool));
    const currentMin = Math.min(image.bitmap.width, image.bitmap.height);
    if (currentMin < minSide) {
        const scale = minSide / Math.max(currentMin, 1);
        image.resize({
            w: Math.round(image.bitmap.width * scale),
            h: Math.round(image.bitmap.height * scale),
        });
    }
    const maxProcessSide = getMaxProcessSide(options.tool);
    const currentMax = Math.max(image.bitmap.width, image.bitmap.height);
    if (currentMax > maxProcessSide) {
        const downscale = maxProcessSide / currentMax;
        image.resize({
            w: Math.max(1, Math.round(image.bitmap.width * downscale)),
            h: Math.max(1, Math.round(image.bitmap.height * downscale)),
        });
    }

    const strength = getPostprocessStrength(options.tool);
    applyAutoRelightIfNeeded(image);
    image.contrast(strength.contrast);
    image.color([{ apply: 'saturate', params: [Math.round(strength.saturation * 100)] }]);
    applySharpenWithKernel(image, strength.sharpen);
    if (options.tool === 'enhance') {
        applyEnhanceOptionStack(image, options.enhanceOptions);
    }

    const outMime = parsed.mime === 'image/png' ? 'image/png' : 'image/jpeg';
    const outBuffer = outMime === 'image/png'
        ? await image.getBuffer('image/png')
        : await image.getBuffer('image/jpeg');
    return encodeDataUrl(outMime, outBuffer);
}
