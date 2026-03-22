import { Jimp } from 'jimp';
import { getDb, normalizePhone } from '@/lib/db';
import { parseDataUrl } from '@/lib/data-url';
import { getOrCreateSubscription, type SubscriptionInfo } from '@/lib/subscriptions';

type HistoryKind = 'before' | 'after';

interface HistoryImageRecord {
    imageUrl: string;
    toolId: string;
    runId: string;
}

function getHistoryImageRecord(userIdRaw: string, entryId: string, kind: HistoryKind): HistoryImageRecord | null {
    const userId = normalizePhone(userIdRaw);
    if (!userId || !entryId.includes(':')) return null;

    const separatorIndex = entryId.indexOf(':');
    const toolId = entryId.slice(0, separatorIndex);
    const runId = entryId.slice(separatorIndex + 1);
    if (!toolId || !runId) return null;

    const column = kind === 'after' ? 'after_image_url' : 'before_image_url';
    const db = getDb();
    const row = toolId === 'stage'
        ? db.prepare(`SELECT ${column} as image_url FROM stage_runs WHERE phone = ? AND run_id = ? LIMIT 1`).get(userId, runId) as { image_url?: string | null } | undefined
        : db.prepare(`SELECT ${column} as image_url FROM tool_runs WHERE phone = ? AND tool_id = ? AND run_id = ? LIMIT 1`).get(userId, toolId, runId) as { image_url?: string | null } | undefined;

    const imageUrl = String(row?.image_url || '').trim();
    if (!imageUrl) return null;
    return { imageUrl, toolId, runId };
}

async function readImageBytes(imageUrl: string): Promise<Buffer> {
    if (imageUrl.startsWith('data:')) {
        const parsed = parseDataUrl(imageUrl);
        return Buffer.from(parsed.base64, 'base64');
    }

    if (/^https?:\/\//i.test(imageUrl)) {
        const response = await fetch(imageUrl, { redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`Kaynak görsel alınamadı (HTTP ${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    throw new Error('Desteklenmeyen görsel adresi');
}

function getExportSpec(subscription: SubscriptionInfo): { maxSide: number; label: '2k' | '4k' } {
    if (subscription.planId === 'kurumsal') {
        return { maxSide: 4096, label: '4k' };
    }
    return { maxSide: 2048, label: '2k' };
}

export async function buildHistoryDownload(userIdRaw: string, entryId: string, kind: HistoryKind): Promise<{
    bytes: Buffer;
    filename: string;
    planLabel: '2k' | '4k';
}> {
    const userId = normalizePhone(userIdRaw);
    if (!userId) {
        throw new Error('Hesap bilgisi gerekli');
    }

    const record = getHistoryImageRecord(userId, entryId, kind);
    if (!record) {
        throw new Error('Görsel bulunamadı');
    }

    const subscription = await getOrCreateSubscription(userId);
    const exportSpec = getExportSpec(subscription);
    const source = await readImageBytes(record.imageUrl);

    const image = await Jimp.read(source);
    const width = Number(image.bitmap.width || 0);
    const height = Number(image.bitmap.height || 0);
    const longestSide = Math.max(width, height, 1);
    const upscaleRatio = exportSpec.maxSide / longestSide;
    const needsUpscale = upscaleRatio > 1.01;
    const targetWidth = width >= height ? exportSpec.maxSide : Math.max(1, Math.round((width / Math.max(height, 1)) * exportSpec.maxSide));
    const targetHeight = height > width ? exportSpec.maxSide : Math.max(1, Math.round((height / Math.max(width, 1)) * exportSpec.maxSide));

    image.resize({ w: targetWidth, h: targetHeight });

    const bytes = Buffer.from(await image.getBuffer('image/jpeg'));

    const filename = `${kind === 'before' ? 'yuklenen' : 'islenmis'}-${record.toolId}-${record.runId}-${exportSpec.label}.jpg`;
    return {
        bytes,
        filename,
        planLabel: exportSpec.label,
    };
}
