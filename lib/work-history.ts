import { getDb, normalizePhone, ensureUser } from '@/lib/db';

export type WorkToolId = string;

export interface UnifiedWorkHistoryItem {
    entryId: string;
    runId: string;
    toolId: WorkToolId;
    createdAt: number;
    beforeImageUrl: string | null;
    afterImageUrl: string | null;
    roomType?: string;
    style?: string;
    title?: string | null;
    detail?: string | null;
}

const MAX_HISTORY_URL_LENGTH = 4096;

function toHistoryImageUrl(entryId: string, kind: 'before' | 'after'): string {
    return `/api/stage/history-image?entryId=${encodeURIComponent(entryId)}&kind=${kind}`;
}

function sanitizeHistoryUrl(
    value: string | null | undefined,
    entryId: string,
    kind: 'before' | 'after'
): string | null {
    if (!value) return null;
    const normalized = String(value).trim();
    if (!normalized) return null;
    // Some legacy rows keep huge inline data URLs; sending those in history payload
    // can blow up JSON serialization and break the Works page.
    if (normalized.startsWith('data:')) return toHistoryImageUrl(entryId, kind);
    if (normalized.length > MAX_HISTORY_URL_LENGTH) return toHistoryImageUrl(entryId, kind);
    return normalized;
}

export function recordToolRun(input: {
    runId: string;
    phone: string;
    toolId: string;
    status?: 'success' | 'failed';
    beforeImageUrl?: string | null;
    afterImageUrl?: string | null;
    title?: string;
    detail?: string;
    usedCredits?: number;
}): void {
    const db = getDb();
    const phone = normalizePhone(input.phone);
    if (!phone || !input.runId) return;
    ensureUser(phone);
    db.prepare(
        `INSERT INTO tool_runs (
            run_id, phone, tool_id, status, before_image_url, after_image_url, title, detail, used_credits, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(run_id) DO UPDATE SET
            status = excluded.status,
            before_image_url = COALESCE(excluded.before_image_url, tool_runs.before_image_url),
            after_image_url = COALESCE(excluded.after_image_url, tool_runs.after_image_url),
            title = COALESCE(excluded.title, tool_runs.title),
            detail = COALESCE(excluded.detail, tool_runs.detail),
            used_credits = excluded.used_credits`
    ).run(
        input.runId,
        phone,
        input.toolId,
        input.status || 'success',
        input.beforeImageUrl || null,
        input.afterImageUrl || null,
        input.title || null,
        input.detail || null,
        Number(input.usedCredits || 0),
        Date.now()
    );
}

export function getUnifiedWorkHistory(
    phoneRaw: string,
    limit = 120,
    offset = 0
): { items: UnifiedWorkHistoryItem[]; hasMore: boolean } {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const cappedLimit = Math.max(1, Math.min(300, Number(limit) || 120));
    const safeOffset = Math.max(0, Math.floor(Number(offset) || 0));
    const fetchWindow = Math.min(5000, safeOffset + cappedLimit + 1);

    const stageRows = db
        .prepare(
            `SELECT run_id, room_type, style, created_at, before_image_url, after_image_url
             FROM stage_runs
             WHERE phone = ? AND status='success'
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(phone, fetchWindow) as Array<{
        run_id: string;
        room_type: string;
        style: string;
        created_at: number;
        before_image_url: string | null;
        after_image_url: string | null;
    }>;

    const toolRows = db
        .prepare(
            `SELECT run_id, tool_id, created_at, before_image_url, after_image_url, title, detail
             FROM tool_runs
             WHERE phone = ? AND status='success'
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(phone, fetchWindow) as Array<{
        run_id: string;
        tool_id: WorkToolId;
        created_at: number;
        before_image_url: string | null;
        after_image_url: string | null;
        title: string | null;
        detail: string | null;
    }>;

    const listingFallbackRows = db
        .prepare(
            `SELECT run_id, created_at, output_text
             FROM listing_text_runs
             WHERE phone = ? AND status='success'
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(phone, fetchWindow) as Array<{
        run_id: string;
        created_at: number;
        output_text: string | null;
    }>;

    const aiTourFallbackRows = db
        .prepare(
            `SELECT run_id, created_at, script_output, video_url
             FROM ai_tour_runs
             WHERE phone = ? AND status='success'
             ORDER BY created_at DESC
             LIMIT ?`
        )
        .all(phone, fetchWindow) as Array<{
        run_id: string;
        created_at: number;
        script_output: string | null;
        video_url: string | null;
    }>;

    const items: UnifiedWorkHistoryItem[] = [
        ...stageRows.map((row) => ({
            entryId: `stage:${row.run_id}`,
            runId: row.run_id,
            toolId: 'stage' as const,
            createdAt: Number(row.created_at || 0),
            beforeImageUrl: sanitizeHistoryUrl(row.before_image_url, `stage:${row.run_id}`, 'before'),
            afterImageUrl: sanitizeHistoryUrl(row.after_image_url, `stage:${row.run_id}`, 'after'),
            roomType: row.room_type,
            style: row.style,
            title: 'Dekorasyon',
            detail: null,
        })),
        ...toolRows.map((row) => ({
            entryId: `${row.tool_id}:${row.run_id}`,
            runId: row.run_id,
            toolId: row.tool_id,
            createdAt: Number(row.created_at || 0),
            beforeImageUrl: sanitizeHistoryUrl(row.before_image_url, `${row.tool_id}:${row.run_id}`, 'before'),
            afterImageUrl: sanitizeHistoryUrl(row.after_image_url, `${row.tool_id}:${row.run_id}`, 'after'),
            title: row.title || null,
            detail: row.detail || null,
        })),
    ];

    const toolRunIds = new Set(toolRows.map((row) => row.run_id));
    for (const row of listingFallbackRows) {
        if (toolRunIds.has(row.run_id)) continue;
        items.push({
            entryId: `listing-text:${row.run_id}`,
            runId: row.run_id,
            toolId: 'listing-text',
            createdAt: Number(row.created_at || 0),
            beforeImageUrl: null,
            afterImageUrl: null,
            title: 'İlan Metni Oluşturucu',
            detail: row.output_text || null,
        });
    }
    for (const row of aiTourFallbackRows) {
        if (toolRunIds.has(row.run_id)) continue;
        items.push({
            entryId: `ai-tour-guide:${row.run_id}`,
            runId: row.run_id,
            toolId: 'ai-tour-guide',
            createdAt: Number(row.created_at || 0),
            beforeImageUrl: null,
            afterImageUrl: null,
            title: 'Sanal Sunucu',
            detail: row.video_url
                ? JSON.stringify({ videoUrl: row.video_url, script: row.script_output || '' })
                : row.script_output || null,
        });
    }

    items.sort((a, b) => b.createdAt - a.createdAt);
    const start = safeOffset;
    const end = safeOffset + cappedLimit;
    return {
        items: items.slice(start, end),
        hasMore: items.length > end,
    };
}

export function deleteUnifiedWorkEntries(phoneRaw: string, entryIds: string[]): { requested: number; deleted: number } {
    const db = getDb();
    const phone = normalizePhone(phoneRaw);
    const uniqueEntryIds = Array.from(new Set(entryIds.map((id) => String(id || '').trim()).filter(Boolean)));
    if (!phone || uniqueEntryIds.length === 0) return { requested: uniqueEntryIds.length, deleted: 0 };

    const deleteStageStmt = db.prepare(`DELETE FROM stage_runs WHERE phone = ? AND run_id = ?`);
    const deleteToolStmt = db.prepare(`DELETE FROM tool_runs WHERE phone = ? AND tool_id = ? AND run_id = ?`);

    const tx = db.transaction((ids: string[]) => {
        let deleted = 0;
        for (const entryId of ids) {
            const [toolId, runId] = entryId.split(':');
            if (!toolId || !runId) continue;
            if (toolId === 'stage') {
                deleted += Number(deleteStageStmt.run(phone, runId).changes || 0);
                continue;
            }
            deleted += Number(deleteToolStmt.run(phone, toolId, runId).changes || 0);
        }
        return deleted;
    });

    return { requested: uniqueEntryIds.length, deleted: tx(uniqueEntryIds) };
}
