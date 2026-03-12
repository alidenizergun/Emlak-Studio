import { Jimp } from 'jimp';
import { parseDataUrl } from '@/lib/data-url';

interface StageArtifactResult {
    ok: boolean;
    score: number;
    details: {
        horizontalBandRatio: number;
        verticalBandRatio: number;
        midDiffCoverage: number;
    };
    error?: string;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

async function readResized(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
    const img = await Jimp.read(imageBuffer);
    img.resize({ w: width, h: height });
    return img.bitmap.data;
}

function colorDistance(rawA: Buffer, rawB: Buffer, idx: number): number {
    const dr = rawA[idx] - rawB[idx];
    const dg = rawA[idx + 1] - rawB[idx + 1];
    const db = rawA[idx + 2] - rawB[idx + 2];
    return Math.sqrt(dr * dr + dg * dg + db * db) / 441.67295593;
}

function longestRun(values: number[], threshold: number): number {
    let best = 0;
    let cur = 0;
    for (const v of values) {
        if (v >= threshold) {
            cur += 1;
            if (cur > best) best = cur;
        } else {
            cur = 0;
        }
    }
    return best;
}

export async function verifyStageArtifacts(
    inputImage: File,
    outputImageDataUrl: string
): Promise<StageArtifactResult> {
    const inBuffer = Buffer.from(await inputImage.arrayBuffer());
    const outParsed = parseDataUrl(outputImageDataUrl);
    const outBuffer = Buffer.from(outParsed.base64, 'base64');

    const width = 320;
    const height = 320;
    const [beforeRaw, afterRaw] = await Promise.all([
        readResized(inBuffer, width, height),
        readResized(outBuffer, width, height),
    ]);

    const rowMidRatios = new Array<number>(height).fill(0);
    const colMidRatios = new Array<number>(width).fill(0);
    let midDiffPixels = 0;
    const totalPixels = width * height;

    for (let y = 0; y < height; y += 1) {
        let rowMid = 0;
        for (let x = 0; x < width; x += 1) {
            const idx = (y * width + x) * 4;
            const d = colorDistance(beforeRaw, afterRaw, idx);
            const isMid = d >= 0.06 && d <= 0.23;
            if (isMid) {
                rowMid += 1;
                colMidRatios[x] += 1;
                midDiffPixels += 1;
            }
        }
        rowMidRatios[y] = rowMid / width;
    }

    for (let x = 0; x < width; x += 1) {
        colMidRatios[x] /= height;
    }

    const horizontalRun = longestRun(rowMidRatios, 0.58);
    const verticalRun = longestRun(colMidRatios, 0.58);
    const horizontalBandRatio = horizontalRun / height;
    const verticalBandRatio = verticalRun / width;
    const midDiffCoverage = midDiffPixels / totalPixels;

    const artifactScore = clamp(
        0.52 * horizontalBandRatio + 0.28 * verticalBandRatio + 0.2 * Math.max(0, midDiffCoverage - 0.34),
        0,
        1
    );

    const strictThreshold = Number(process.env.STAGE_ARTIFACT_MAX_SCORE || 0.14);
    const ok = artifactScore <= strictThreshold;

    return {
        ok,
        score: artifactScore,
        details: {
            horizontalBandRatio,
            verticalBandRatio,
            midDiffCoverage,
        },
        error: ok ? undefined : `Ghost/seam artefakti tespit edildi (skor: ${artifactScore.toFixed(2)}).`,
    };
}
