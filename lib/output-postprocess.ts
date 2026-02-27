import { Jimp } from 'jimp';
import { parseDataUrl as parseUrl } from '@/lib/data-url';

interface PostprocessOptions {
    tool: 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation';
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

function getPostprocessStrength(tool: 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation'): { contrast: number; sharpen: number; saturation: number } {
    if (tool === 'stage') {
        return { contrast: 0.06, sharpen: 0.35, saturation: 0.04 };
    }
    if (tool === 'remove-object') {
        return { contrast: 0.05, sharpen: 0.3, saturation: 0.03 };
    }
    if (tool === 'virtual-renovation') {
        return { contrast: 0.06, sharpen: 0.32, saturation: 0.04 };
    }
    return { contrast: 0.05, sharpen: 0.3, saturation: 0.03 };
}

function applySharpenWithKernel(image: Jimp, amount: number): void {
    const a = Math.max(0, Math.min(0.45, amount));
    if (a <= 0) return;
    image.convolute([
        [0, -a, 0],
        [-a, 1 + 4 * a, -a],
        [0, -a, 0],
    ]);
}

export async function postprocessListingImage(dataUrl: string, options: PostprocessOptions): Promise<string> {
    const parsed = parseDataUrl(dataUrl);
    const image = await Jimp.read(parsed.data);
    const minSide = Math.max(640, getMinSideTarget(options.tool));
    const currentMin = Math.min(image.bitmap.width, image.bitmap.height);
    if (currentMin < minSide) {
        const scale = minSide / Math.max(currentMin, 1);
        image.resize({
            w: Math.round(image.bitmap.width * scale),
            h: Math.round(image.bitmap.height * scale),
        });
    }

    const strength = getPostprocessStrength(options.tool);
    image.contrast(strength.contrast);
    image.color([{ apply: 'saturate', params: [Math.round(strength.saturation * 100)] }]);
    applySharpenWithKernel(image, strength.sharpen);

    const outMime = parsed.mime === 'image/png' ? 'image/png' : 'image/jpeg';
    const outBuffer = outMime === 'image/png'
        ? await image.getBuffer('image/png')
        : await image.getBuffer('image/jpeg');
    return encodeDataUrl(outMime, outBuffer);
}
