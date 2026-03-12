import { Jimp } from 'jimp';
import { parseDataUrl } from '@/lib/data-url';

const DEFAULT_THRESHOLD = Number(process.env.ARCH_GUARD_THRESHOLD || 0.58);
const RIGHT_EDGE_MIN_SCORE = Number(process.env.ARCH_RIGHT_EDGE_MIN_SCORE || 0.86);

interface IntegrityResult {
    ok: boolean;
    score: number;
    threshold: number;
    edgeScore?: number;
    keypointScore?: number;
    perspectiveScore?: number;
    continuityScore?: number;
    rightEdgeScore?: number;
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
    const fixtureEditableZone = nx >= 0.38 && nx <= 0.62 && ny >= 0.03 && ny <= 0.3;

    const topBand = ny <= 0.26;
    const leftBand = nx <= 0.2 && ny <= 0.98;
    const rightBand = nx >= 0.8 && ny <= 0.98;
    const upperWindowZone = nx >= 0.16 && nx <= 0.84 && ny >= 0.16 && ny <= 0.62;
    const rightTransitionZone = nx >= 0.7 && nx <= 0.88 && ny >= 0.2 && ny <= 0.95;

    if (fixtureEditableZone) return false;
    return topBand || leftBand || rightBand || upperWindowZone || rightTransitionZone;
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
        [0.36, 0.2],
        [0.64, 0.2],
        [0.82, 0.2],
        [0.18, 0.5],
        [0.72, 0.5],
        [0.82, 0.5],
        [0.18, 0.72],
        [0.72, 0.72],
        [0.5, 0.72],
        [0.82, 0.72],
        [0.86, 0.88],
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

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function normalizeSeries(values: number[]): number[] {
    if (values.length === 0) return [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
    const std = Math.sqrt(Math.max(variance, 1e-8));
    return values.map((v) => (v - mean) / std);
}

function correlation01(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
    const an = normalizeSeries(a);
    const bn = normalizeSeries(b);
    let dot = 0;
    for (let i = 0; i < an.length; i += 1) dot += an[i] * bn[i];
    const corr = dot / Math.max(an.length, 1);
    return clamp((corr + 1) / 2, 0, 1);
}

function rowProfile(
    edges: Float32Array,
    width: number,
    height: number,
    xStartN: number,
    xEndN: number,
    yStartN: number,
    yEndN: number
): number[] {
    const xStart = Math.floor(clamp(xStartN, 0, 1) * width);
    const xEnd = Math.max(xStart + 1, Math.floor(clamp(xEndN, 0, 1) * width));
    const yStart = Math.floor(clamp(yStartN, 0, 1) * height);
    const yEnd = Math.max(yStart + 2, Math.floor(clamp(yEndN, 0, 1) * height));
    const out: number[] = [];
    for (let y = yStart; y < yEnd; y += 1) {
        let sum = 0;
        for (let x = xStart; x < xEnd; x += 1) {
            sum += edges[y * width + x];
        }
        out.push(sum / Math.max(xEnd - xStart, 1));
    }
    return out;
}

function colProfile(
    edges: Float32Array,
    width: number,
    height: number,
    xStartN: number,
    xEndN: number,
    yStartN: number,
    yEndN: number
): number[] {
    const xStart = Math.floor(clamp(xStartN, 0, 1) * width);
    const xEnd = Math.max(xStart + 2, Math.floor(clamp(xEndN, 0, 1) * width));
    const yStart = Math.floor(clamp(yStartN, 0, 1) * height);
    const yEnd = Math.max(yStart + 1, Math.floor(clamp(yEndN, 0, 1) * height));
    const out: number[] = [];
    for (let x = xStart; x < xEnd; x += 1) {
        let sum = 0;
        for (let y = yStart; y < yEnd; y += 1) {
            sum += edges[y * width + x];
        }
        out.push(sum / Math.max(yEnd - yStart, 1));
    }
    return out;
}

function continuitySimilarity(
    beforeEdges: Float32Array,
    afterEdges: Float32Array,
    width: number,
    height: number
): number {
    const topCorniceBefore = rowProfile(beforeEdges, width, height, 0.05, 0.95, 0.08, 0.32);
    const topCorniceAfter = rowProfile(afterEdges, width, height, 0.05, 0.95, 0.08, 0.32);
    const beamBefore = rowProfile(beforeEdges, width, height, 0.12, 0.95, 0.2, 0.56);
    const beamAfter = rowProfile(afterEdges, width, height, 0.12, 0.95, 0.2, 0.56);
    const leftVerticalBefore = colProfile(beforeEdges, width, height, 0.06, 0.26, 0.12, 0.95);
    const leftVerticalAfter = colProfile(afterEdges, width, height, 0.06, 0.26, 0.12, 0.95);
    const rightVerticalBefore = colProfile(beforeEdges, width, height, 0.72, 0.96, 0.12, 0.95);
    const rightVerticalAfter = colProfile(afterEdges, width, height, 0.72, 0.96, 0.12, 0.95);

    const cTop = correlation01(topCorniceBefore, topCorniceAfter);
    const cBeam = correlation01(beamBefore, beamAfter);
    const cLeft = correlation01(leftVerticalBefore, leftVerticalAfter);
    const cRight = correlation01(rightVerticalBefore, rightVerticalAfter);
    return clamp(0.32 * cTop + 0.28 * cBeam + 0.2 * cLeft + 0.2 * cRight, 0, 1);
}

function rightEdgeSimilarity(
    beforeEdges: Float32Array,
    afterEdges: Float32Array,
    width: number,
    height: number
): number {
    const edgeBandBefore = colProfile(beforeEdges, width, height, 0.82, 0.995, 0.08, 0.99);
    const edgeBandAfter = colProfile(afterEdges, width, height, 0.82, 0.995, 0.08, 0.99);
    const nearEdgeBefore = colProfile(beforeEdges, width, height, 0.72, 0.9, 0.08, 0.99);
    const nearEdgeAfter = colProfile(afterEdges, width, height, 0.72, 0.9, 0.08, 0.99);
    const strict = correlation01(edgeBandBefore, edgeBandAfter);
    const transition = correlation01(nearEdgeBefore, nearEdgeAfter);
    return clamp(0.7 * strict + 0.3 * transition, 0, 1);
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
    const continuityScore = continuitySimilarity(beforeEdges, afterEdges, width, height);
    const rightEdgeScore = rightEdgeSimilarity(beforeEdges, afterEdges, width, height);
    const score = edgeScore * 0.45 + keypointScore * 0.2 + perspectiveScore * 0.1 + continuityScore * 0.15 + rightEdgeScore * 0.1;
    const ok = score >= threshold && rightEdgeScore >= RIGHT_EDGE_MIN_SCORE;

    return {
        ok,
        score,
        threshold,
        edgeScore,
        keypointScore,
        perspectiveScore,
        continuityScore,
        rightEdgeScore,
    };
}
