import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionPhone } from '@/lib/session';

function parseDataUrl(value: string): { mime: string; buffer: Buffer } | null {
    const commaIndex = value.indexOf(',');
    if (commaIndex <= 0) return null;

    const meta = value.slice(5, commaIndex);
    const payload = value.slice(commaIndex + 1);
    const parts = meta.split(';').filter(Boolean);
    const mime = parts[0] || 'application/octet-stream';
    const isBase64 = parts.includes('base64');

    try {
        const buffer = isBase64
            ? Buffer.from(payload, 'base64')
            : Buffer.from(decodeURIComponent(payload), 'utf-8');
        return { mime, buffer };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const phone = getSessionPhone(request);
        if (!phone) {
            return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
        }

        const entryId = String(request.nextUrl.searchParams.get('entryId') || '').trim();
        const kindParam = String(request.nextUrl.searchParams.get('kind') || '').trim();
        const kind: 'before' | 'after' = kindParam === 'after' ? 'after' : 'before';
        const column = kind === 'after' ? 'after_image_url' : 'before_image_url';

        if (!entryId.includes(':')) {
            return NextResponse.json({ success: false, error: 'Geçersiz kayıt kimliği' }, { status: 400 });
        }

        const separatorIndex = entryId.indexOf(':');
        const toolId = entryId.slice(0, separatorIndex);
        const runId = entryId.slice(separatorIndex + 1);
        if (!toolId || !runId) {
            return NextResponse.json({ success: false, error: 'Geçersiz kayıt kimliği' }, { status: 400 });
        }

        const db = getDb();
        const row = toolId === 'stage'
            ? db.prepare(`SELECT ${column} as image_url FROM stage_runs WHERE phone = ? AND run_id = ? LIMIT 1`).get(phone, runId) as { image_url?: string | null } | undefined
            : db.prepare(`SELECT ${column} as image_url FROM tool_runs WHERE phone = ? AND tool_id = ? AND run_id = ? LIMIT 1`).get(phone, toolId, runId) as { image_url?: string | null } | undefined;

        const imageUrl = String(row?.image_url || '').trim();
        if (!imageUrl) {
            return NextResponse.json({ success: false, error: 'Görsel bulunamadı' }, { status: 404 });
        }

        if (imageUrl.startsWith('data:')) {
            const parsed = parseDataUrl(imageUrl);
            if (!parsed) {
                return NextResponse.json({ success: false, error: 'Görsel verisi okunamadı' }, { status: 422 });
            }
            const bytes = new Uint8Array(parsed.buffer);
            return new NextResponse(bytes, {
                status: 200,
                headers: {
                    'Content-Type': parsed.mime,
                    'Cache-Control': 'private, max-age=3600',
                },
            });
        }

        if (/^https?:\/\//i.test(imageUrl)) {
            return NextResponse.redirect(imageUrl, 307);
        }

        return NextResponse.json({ success: false, error: 'Desteklenmeyen görsel adresi' }, { status: 422 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatasi';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
