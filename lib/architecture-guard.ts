import { Jimp } from 'jimp';
import { parseDataUrl } from '@/lib/data-url';

const DEFAULT_THRESHOLD = Number(process.env.ARCH_GUARD_THRESHOLD || 0.58);

interface IntegrityResult {
    ok: boolean;
    score: number;
    threshold: number;
    edgeScore?: number;
    keypointScore?: number;
    perspectiveScore?: number;
}

function parseOutputDataUrlToBuffer(dataUrl: string): Buffer {
    const parsed = parseDataUrl(dataUrl);
    return Buffer.from(parsed.base64, 'base64');
}

async function toGray(input: Buffer, width: number, height: number): Promise<Float32Array> {
    const img = await Jimp.read(input);
    img.resize({ w: width, h: height });
    const raw = img.bitmap.data;
    const out = new Float32Array(width * height);
    for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
        const r = raw[i] / 255;
        const g = raw[i + 1] / 255;
        const b = raw[i + 2] / 255;
        out[p] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return out;
}

function edgeMap(gray: Float32Array, width: number, height: number): Float32Array {
    const edges = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            const gx = gray[idx + 1] - gray[idx - 1];
            const gy = gray[idx + width] - gray[idx - width];
            edges[idx] = Math.min(1, Math.abs(gx) + Math.abs(gy));
        }
    }
    return edges;
}

function inArchitectureMask(x: number, y: number, width: number, height: number): boolean {
    const nx = x / width;
    const ny = y / height;

    const topBand = ny <= 0.24;
    const leftBand = nx <= 0.16 && ny <= 0.82;
    const rightBand = nx >= 0.84 && ny <= 0.82;
    const upperWindowZone = nx >= 0.16 && nx <= 0.84 && ny >= 0.16 && ny <= 0.62;

    return topBand || leftBand || rightBand || upperWindowZone;
}

function architectureSimilarity(
    beforeEdges: Float32Array,
    afterEdges: Float32Array,
    width: number,
    height: number
): number {
    let numerator = 0;
    let denominator = 0;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (!inArchitectureMask(x, y, width, height)) continue;
            const idx = y * width + x;
            const a = beforeEdges[idx];
            const b = afterEdges[idx];
            numerator += Math.abs(a - b);
            denominator += Math.max(a, b, 0.05);
        }
    }

    if (denominator <= 0) return 1;
    return 1 - numerator / denominator;
}

function keypointSimilarity(
    beforeEdges: Float32Array,
    afterEdges: Float32Array,
    width: number,
    height: number
): number {
    const points: Array<[number, number]> = [
        [0.18, 0.2],
        [0.5, 0.2],
        [0.82, 0.2],
        [0.18, 0.5],
        [0.82, 0.5],
        [0.18, 0.72],
        [0.5, 0.72],
        [0.82, 0.72],
    ];
    let diff = 0;
    for (const [nx, ny] of points) {
        const x = Math.max(0, Math.min(width - 1, Math.floor(nx * width)));
        const y = Math.max(0, Math.min(height - 1, Math.floor(ny * height)));
        const idx = y * width + x;
        diff += Math.abs(beforeEdges[idx] - afterEdges[idx]);
    }
    const avg = diff / Math.max(points.length, 1);
    return Math.max(0, 1 - avg * 1.7);
}

function perspectiveSimilarity(
    beforeEdges: Float32Array,
    afterEdges: Float32Array,
    width: number,
    height: number
): number {
    let beforeVertical = 0;
    let beforeHorizontal = 0;
    let afterVertical = 0;
    let afterHorizontal = 0;
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            const bV = Math.abs(beforeEdges[idx + width] - beforeEdges[idx - width]);
            const bH = Math.abs(beforeEdges[idx + 1] - beforeEdges[idx - 1]);
            const aV = Math.abs(afterEdges[idx + width] - afterEdges[idx - width]);
            const aH = Math.abs(afterEdges[idx + 1] - afterEdges[idx - 1]);
            beforeVertical += bV;
            beforeHorizontal += bH;
            afterVertical += aV;
            afterHorizontal += aH;
        }
    }
    const bRatio = beforeVertical / Math.max(beforeHorizontal, 1e-6);
    const aRatio = afterVertical / Math.max(afterHorizontal, 1e-6);
    const delta = Math.abs(bRatio - aRatio);
    return Math.max(0, 1 - Math.min(1, delta));
}

export async function verifyArchitectureIntegrity(
    inputImage: File,
    outputImageDataUrl: string,
    threshold: number = DEFAULT_THRESHOLD
): Promise<IntegrityResult> {
    const inputBuffer = Buffer.from(await inputImage.arrayBuffer());
    const outputBuffer = parseOutputDataUrlToBuffer(outputImageDataUrl);

    const width = 192;
    const height = 192;

    const [beforeGray, afterGray] = await Promise.all([
        toGray(inputBuffer, width, height),
        toGray(outputBuffer, width, height),
    ]);
    const beforeEdges = edgeMap(beforeGray, width, height);
    const afterEdges = edgeMap(afterGray, width, height);
    const edgeScore = architectureSimilarity(beforeEdges, afterEdges, width, height);
    const keypointScore = keypointSimilarity(beforeEdges, afterEdges, width, height);
    const perspectiveScore = perspectiveSimilarity(beforeEdges, afterEdges, width, height);
    const score = edgeScore * 0.6 + keypointScore * 0.25 + perspectiveScore * 0.15;

    return {
        ok: score >= threshold,
        score,
        threshold,
        edgeScore,
        keypointScore,
        perspectiveScore,
    };
}
