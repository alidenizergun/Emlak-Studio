import { Jimp } from 'jimp';

interface RoomTypeGuardResult {
    ok: boolean;
    confidence: number;
    reason?: string;
}

async function computeSceneStats(image: File): Promise<{
    upperBrightRatio: number;
    bottomWoodLikeRatio: number;
    bottomLowSatBrightRatio: number;
}> {
    const width = 160;
    const height = 160;
    const src = Buffer.from(await image.arrayBuffer());
    const img = await Jimp.read(src);
    img.resize({ w: width, h: height });
    const raw = img.bitmap.data;

    let upperBright = 0;
    let upperTotal = 0;
    let bottomWood = 0;
    let bottomTile = 0;
    let bottomTotal = 0;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const idx = (y * width + x) * 4;
            const r = raw[idx] / 255;
            const g = raw[idx + 1] / 255;
            const b = raw[idx + 2] / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max <= 0 ? 0 : (max - min) / max;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (y < height * 0.45) {
                upperTotal += 1;
                if (lum > 0.72 && sat < 0.3) upperBright += 1;
            }

            if (y > height * 0.62) {
                bottomTotal += 1;
                const woodLike = r > g && g > b && sat > 0.18 && lum > 0.22;
                const tileLike = sat < 0.12 && lum > 0.45;
                if (woodLike) bottomWood += 1;
                if (tileLike) bottomTile += 1;
            }
        }
    }

    return {
        upperBrightRatio: upperTotal > 0 ? upperBright / upperTotal : 0,
        bottomWoodLikeRatio: bottomTotal > 0 ? bottomWood / bottomTotal : 0,
        bottomLowSatBrightRatio: bottomTotal > 0 ? bottomTile / bottomTotal : 0,
    };
}

export async function validateRoomTypeSanity(image: File, roomType: string): Promise<RoomTypeGuardResult> {
    const s = await computeSceneStats(image);

    if (roomType === 'bathroom') {
        const bathroomLike = s.bottomLowSatBrightRatio > 0.22;
        const nonBathroomSignal = s.bottomWoodLikeRatio > 0.24 && s.upperBrightRatio > 0.2;
        if (!bathroomLike && nonBathroomSignal) {
            return {
                ok: false,
                confidence: 0.93,
                reason: 'Gorsel banyo yerine yasam alani gibi gorunuyor. Oda tipini kontrol edin.',
            };
        }
    }

    if (roomType === 'balcony') {
        if (s.upperBrightRatio < 0.12) {
            return {
                ok: false,
                confidence: 0.9,
                reason: 'Gorselde balkon/teras acik dis mekan sinyali dusuk. Oda tipini kontrol edin.',
            };
        }
    }

    return { ok: true, confidence: 0.6 };
}
