import { Jimp } from 'jimp';
import { parseDataUrl as parseUrl } from '@/lib/data-url';

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } {
    const parsed = parseUrl(dataUrl);
    return { mimeType: parsed.mimeType, buffer: Buffer.from(parsed.base64, 'base64') };
}

function buildArchitectureWeight(x: number, y: number, width: number, height: number): number {
    const nx = x / width;
    const ny = y / height;
    const fixtureEditableZone = nx >= 0.38 && nx <= 0.62 && ny >= 0.03 && ny <= 0.3;

    let w = 0;
    if (ny <= 0.26) w = Math.max(w, 0.9); // ceiling/cornice band must stay locked
    if (nx <= 0.18 && ny <= 0.98) w = Math.max(w, 0.88); // left wall + corner continuity
    if (nx >= 0.8 && ny <= 0.98) w = Math.max(w, 0.9); // right wall/partition area gets strongest lock
    if (nx >= 0.15 && nx <= 0.85 && ny >= 0.14 && ny <= 0.62) w = Math.max(w, 0.74); // central structural zone
    if (ny >= 0.72) w = Math.max(w, 0.08); // floor remains editable but minimally anchored
    if (fixtureEditableZone) w = Math.min(w, 0.18); // let chandelier/pendant styling change while preserving ceiling geometry around it
    return w;
}

function computeEdgeConfidence(gray: Float32Array, x: number, y: number, width: number, height: number): number {
    if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;
    const idx = y * width + x;
    const gx = gray[idx + 1] - gray[idx - 1];
    const gy = gray[idx + width] - gray[idx - width];
    const edge = Math.abs(gx) + Math.abs(gy);
    return Math.max(0, Math.min(1, edge * 2.4));
}

function toGray(raw: Buffer, width: number, height: number): Float32Array {
    const gray = new Float32Array(width * height);
    for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
        gray[p] = (0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]) / 255;
    }
    return gray;
}

function colorDistance(beforeRaw: Buffer, afterRaw: Buffer, idx: number): number {
    const dr = beforeRaw[idx] - afterRaw[idx];
    const dg = beforeRaw[idx + 1] - afterRaw[idx + 1];
    const db = beforeRaw[idx + 2] - afterRaw[idx + 2];
    return Math.sqrt(dr * dr + dg * dg + db * db) / 441.67295593;
}

export async function applyArchitectureStructureLock(
    inputImage: File,
    outputImageDataUrl: string,
    strength = 1
): Promise<string> {
    const inputBuffer = Buffer.from(await inputImage.arrayBuffer());
    const output = parseDataUrl(outputImageDataUrl);

    const afterImg = await Jimp.read(output.buffer);
    const width = afterImg.bitmap.width || 1280;
    const height = afterImg.bitmap.height || 960;
    const beforeImg = await Jimp.read(inputBuffer);
    beforeImg.resize({ w: width, h: height });
    afterImg.resize({ w: width, h: height });
    const beforeRaw = beforeImg.bitmap.data;
    const afterRaw = afterImg.bitmap.data;
    const grayBefore = toGray(beforeRaw, width, height);
    const grayAfter = toGray(afterRaw, width, height);

    const merged = Buffer.alloc(width * height * 4);
    const s = Math.max(0, Math.min(1, strength));
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const idx = (y * width + x) * 4;
            const baseW = buildArchitectureWeight(x, y, width, height);
            const edgeBefore = computeEdgeConfidence(grayBefore, x, y, width, height);
            const edgeAfter = computeEdgeConfidence(grayAfter, x, y, width, height);
            const edgeAgreement = Math.min(edgeBefore, edgeAfter);
            const diff = colorDistance(beforeRaw, afterRaw, idx);
            const lockSignal = baseW * s;
            const isStructuralPixel = lockSignal >= 0.56 && edgeBefore >= 0.15;
            const isStableStructuralPixel = diff <= 0.14 && (edgeBefore >= 0.22 || edgeAgreement >= 0.18);
            const keepInputPixel = isStructuralPixel && isStableStructuralPixel;
            for (let c = 0; c < 3; c += 1) {
                const b = beforeRaw[idx + c];
                const a = afterRaw[idx + c];
                // No alpha-blending between before/after: pick one source pixel to eliminate ghost/seam artifacts.
                merged[idx + c] = keepInputPixel ? b : a;
            }
            merged[idx + 3] = 255;
        }
    }

    const encoded = await new Jimp({ data: merged, width, height }).getBuffer('image/jpeg');
    return `data:image/jpeg;base64,${encoded.toString('base64')}`;
}
