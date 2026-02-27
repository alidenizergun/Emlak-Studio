import { Jimp } from 'jimp';

interface NormalizedImageResult {
    image: File;
    watermarkSuspected: boolean;
    watermarkCropApplied: boolean;
}

function toFile(buffer: Buffer, name = 'normalized-stage.jpg'): File {
    return new File([new Uint8Array(buffer)], name, { type: 'image/jpeg' });
}

async function computeWatermarkSuspicion(buffer: Buffer): Promise<boolean> {
    const width = 320;
    const height = 320;
    const img = await Jimp.read(buffer);
    img.resize({ w: width, h: height });
    const raw = img.bitmap.data;

    let centerEdges = 0;
    let totalEdges = 0;
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idxR = (y * width + (x + 1)) * 4;
            const idxL = (y * width + (x - 1)) * 4;
            const idxU = ((y - 1) * width + x) * 4;
            const idxD = ((y + 1) * width + x) * 4;
            const lR = (raw[idxR] + raw[idxR + 1] + raw[idxR + 2]) / 3;
            const lL = (raw[idxL] + raw[idxL + 1] + raw[idxL + 2]) / 3;
            const lU = (raw[idxU] + raw[idxU + 1] + raw[idxU + 2]) / 3;
            const lD = (raw[idxD] + raw[idxD + 1] + raw[idxD + 2]) / 3;
            const edge = Math.abs(lR - lL) + Math.abs(lD - lU);
            if (edge > 40) {
                totalEdges += 1;
                const nx = x / width;
                const ny = y / height;
                if (nx > 0.2 && nx < 0.8 && ny > 0.25 && ny < 0.8) {
                    centerEdges += 1;
                }
            }
        }
    }

    if (totalEdges === 0) return false;
    const centerRatio = centerEdges / totalEdges;
    return centerRatio > 0.62;
}

export async function normalizeImageForStage(input: File): Promise<NormalizedImageResult> {
    const src = Buffer.from(await input.arrayBuffer());
    const img = await Jimp.read(src);
    const maxSide = 1600;
    if (img.bitmap.width >= img.bitmap.height) {
        if (img.bitmap.width > maxSide) img.resize({ w: maxSide });
    } else if (img.bitmap.height > maxSide) {
        img.resize({ h: maxSide });
    }
    img.normalize();
    img.contrast(0.05);
    img.convolute([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ]);
    const processed = await img.getBuffer('image/jpeg');

    const watermarkSuspected = await computeWatermarkSuspicion(processed);
    let watermarkCropApplied = false;
    let finalBuffer = processed;
    if (watermarkSuspected && process.env.STAGE_WATERMARK_CROP_MODE === '1') {
        const tmp = await Jimp.read(processed);
        const marginW = Math.floor(tmp.bitmap.width * 0.03);
        const marginH = Math.floor(tmp.bitmap.height * 0.03);
        if (tmp.bitmap.width - marginW * 2 > 200 && tmp.bitmap.height - marginH * 2 > 200) {
            tmp.crop({
                x: marginW,
                y: marginH,
                w: tmp.bitmap.width - marginW * 2,
                h: tmp.bitmap.height - marginH * 2,
            });
            finalBuffer = await tmp.getBuffer('image/jpeg');
            watermarkCropApplied = true;
        }
    }
    return {
        image: toFile(finalBuffer),
        watermarkSuspected,
        watermarkCropApplied,
    };
}
