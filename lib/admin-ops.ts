import { getDb, normalizePhone } from '@/lib/db';
import {
  ensurePersistentSchema,
  getPersistentSql,
  hasPersistentDb,
  isSqliteDevFallbackEnabled,
} from '@/lib/persistent-db';
import { getOrCreateSubscription, type SubscriptionInfo } from '@/lib/subscriptions';

export type AdminSubscriptionFilter = 'all' | 'active' | 'cancelled' | 'none';
export type AdminCreditFilter = 'all' | 'positive' | 'zero';

export interface AdminOverviewMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  totalCredits: number;
  recentRuns24h: number;
}

export interface UserListItem {
  userId: string;
  email: string;
  createdAt: number;
  credits: number;
  subscriptionStatus: 'active' | 'cancelled' | 'none';
  subscriptionPlanName: string | null;
  lastActivityAt: number | null;
  totalUsedCredits: number;
}

export interface CreditLedgerEntry {
  id: number;
  delta: number;
  reason: string;
  createdAt: number;
}

export interface AdminToolRunEntry {
  entryId: string;
  runId: string;
  toolId: string;
  status: string;
  failCode: string | null;
  usedCredits: number;
  refunded: boolean;
  createdAt: number;
  title: string | null;
  detail: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  roomType: string | null;
  style: string | null;
}

export interface ToolBreakdownItem {
  toolId: string;
  runCount: number;
  usedCredits: number;
}

export interface AdminUserDetail {
  userId: string;
  email: string;
  createdAt: number;
  credits: number;
  subscriptionStatus: 'active' | 'cancelled' | 'none';
  lastActivityAt: number | null;
  totalCreditsUsed: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  recent30dRuns: number;
  recent30dCreditsUsed: number;
  subscription: SubscriptionInfo | null;
  ledger: CreditLedgerEntry[];
  runs: AdminToolRunEntry[];
  toolBreakdown: ToolBreakdownItem[];
}

export interface AdminListResponse {
  overview: AdminOverviewMetrics;
  users: UserListItem[];
  total: number;
  limit: number;
  offset: number;
}

const MAX_LEDGER = 120;
const MAX_RUNS = 120;
const MAX_LIST_LIMIT = 100;
const MAX_URL_LENGTH = 4096;

function toAdminHistoryImageUrl(userId: string, entryId: string, kind: 'before' | 'after'): string {
  return `/api/admin/history-image?userId=${encodeURIComponent(userId)}&entryId=${encodeURIComponent(entryId)}&kind=${kind}`;
}

function sanitizeHistoryUrl(
  value: string | null | undefined,
  userId: string,
  entryId: string,
  kind: 'before' | 'after'
): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.startsWith('data:')) return toAdminHistoryImageUrl(userId, entryId, kind);
  if (normalized.length > MAX_URL_LENGTH) return toAdminHistoryImageUrl(userId, entryId, kind);
  return normalized;
}

function normalizeSearchTerm(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function parseListRow(row: Record<string, unknown>): UserListItem {
  const subscriptionStatusRaw = String(row.subscription_status || 'none');
  const subscriptionStatus = subscriptionStatusRaw === 'active' || subscriptionStatusRaw === 'cancelled'
    ? subscriptionStatusRaw
    : 'none';

  return {
    userId: String(row.user_id || row.phone || ''),
    email: String(row.email || row.user_id || row.phone || ''),
    createdAt: Number(row.created_at || 0),
    credits: Number(row.credits || 0),
    subscriptionStatus,
    subscriptionPlanName: row.subscription_plan_name ? String(row.subscription_plan_name) : null,
    lastActivityAt: row.last_activity_at ? Number(row.last_activity_at) : null,
    totalUsedCredits: Number(row.total_used_credits || 0),
  };
}

function mapLedgerRow(row: Record<string, unknown>): CreditLedgerEntry {
  return {
    id: Number(row.id || 0),
    delta: Number(row.delta || 0),
    reason: String(row.reason || ''),
    createdAt: Number(row.created_at || 0),
  };
}

function mapRunRow(row: Record<string, unknown>, userId: string): AdminToolRunEntry {
  const toolId = String(row.tool_id || 'unknown');
  const runId = String(row.run_id || '');
  const entryId = `${toolId}:${runId}`;
  return {
    entryId,
    runId,
    toolId,
    status: String(row.status || 'unknown'),
    failCode: row.fail_code ? String(row.fail_code) : null,
    usedCredits: Number(row.used_credits || 0),
    refunded: Number(row.refunded || 0) > 0,
    createdAt: Number(row.created_at || 0),
    title: row.title ? String(row.title) : null,
    detail: row.detail ? String(row.detail) : null,
    beforeImageUrl: sanitizeHistoryUrl(row.before_image_url ? String(row.before_image_url) : null, userId, entryId, 'before'),
    afterImageUrl: sanitizeHistoryUrl(row.after_image_url ? String(row.after_image_url) : null, userId, entryId, 'after'),
    roomType: row.room_type ? String(row.room_type) : null,
    style: row.style ? String(row.style) : null,
  };
}

function mapBreakdownRow(row: Record<string, unknown>): ToolBreakdownItem {
  return {
    toolId: String(row.tool_id || 'unknown'),
    runCount: Number(row.run_count || 0),
    usedCredits: Number(row.used_credits || 0),
  };
}

function getSqliteOverview(): AdminOverviewMetrics {
  const db = getDb();
  const totalUsers = Number((db.prepare(`SELECT COUNT(*) as value FROM users`).get() as { value?: number } | undefined)?.value || 0);
  const activeSubscriptions = Number((db.prepare(`SELECT COUNT(*) as value FROM subscriptions WHERE status = 'active'`).get() as { value?: number } | undefined)?.value || 0);
  const cancelledSubscriptions = Number((db.prepare(`SELECT COUNT(*) as value FROM subscriptions WHERE status = 'cancelled'`).get() as { value?: number } | undefined)?.value || 0);
  const totalCredits = Number((db.prepare(`SELECT COALESCE(SUM(balance), 0) as value FROM credits`).get() as { value?: number } | undefined)?.value || 0);
  const since = Date.now() - (24 * 60 * 60 * 1000);
  const recentRuns24h = Number((db.prepare(`
      SELECT (
          SELECT COUNT(*) FROM stage_runs WHERE created_at >= @since
      ) + (
          SELECT COUNT(*) FROM tool_runs WHERE created_at >= @since
      ) + (
          SELECT COUNT(*) FROM listing_text_runs WHERE created_at >= @since
      ) + (
          SELECT COUNT(*) FROM ai_tour_runs WHERE created_at >= @since
      ) as value
    `).get({ since }) as { value?: number } | undefined)?.value || 0);

  return { totalUsers, activeSubscriptions, cancelledSubscriptions, totalCredits, recentRuns24h };
}

function getSqliteUserList(input: {
  query: string;
  subscriptionStatus: AdminSubscriptionFilter;
  creditFilter: AdminCreditFilter;
  limit: number;
  offset: number;
}): { users: UserListItem[]; total: number } {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = { limit: input.limit, offset: input.offset };

  if (input.query) {
    where.push(`(LOWER(COALESCE(u.email, u.phone)) LIKE @query OR LOWER(u.phone) LIKE @query)`);
    params.query = `%${input.query}%`;
  }
  if (input.subscriptionStatus === 'active') where.push(`COALESCE(s.status, 'none') = 'active'`);
  if (input.subscriptionStatus === 'cancelled') where.push(`COALESCE(s.status, 'none') = 'cancelled'`);
  if (input.subscriptionStatus === 'none') where.push(`s.phone IS NULL`);
  if (input.creditFilter === 'positive') where.push(`COALESCE(c.balance, 0) > 0`);
  if (input.creditFilter === 'zero') where.push(`COALESCE(c.balance, 0) = 0`);

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const baseSql = `
    FROM users u
    LEFT JOIN credits c ON c.phone = u.phone
    LEFT JOIN subscriptions s ON s.phone = u.phone
    ${whereSql}
  `;

  const total = Number((db.prepare(`SELECT COUNT(*) as value ${baseSql}`).get(params) as { value?: number } | undefined)?.value || 0);

  const rows = db.prepare(`
    SELECT
      u.phone as user_id,
      COALESCE(u.email, u.phone) as email,
      u.created_at,
      COALESCE(c.balance, 0) as credits,
      COALESCE(s.status, 'none') as subscription_status,
      s.plan_name as subscription_plan_name,
      COALESCE((
        SELECT MAX(created_at) FROM (
          SELECT MAX(created_at) as created_at FROM stage_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM tool_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM listing_text_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM ai_tour_runs WHERE phone = u.phone
        )
      ), u.created_at) as last_activity_at,
      COALESCE((
        SELECT SUM(used_credits) FROM (
          SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM stage_runs WHERE phone = u.phone
          UNION ALL SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM tool_runs WHERE phone = u.phone
          UNION ALL SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM listing_text_runs WHERE phone = u.phone
          UNION ALL SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM ai_tour_runs WHERE phone = u.phone
        )
      ), 0) as total_used_credits
    ${baseSql}
    ORDER BY last_activity_at DESC, u.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all(params) as Array<Record<string, unknown>>;

  return { users: rows.map(parseListRow), total };
}

function getSqliteDetail(userIdRaw: string): AdminUserDetail | null {
  const db = getDb();
  const userId = normalizePhone(userIdRaw);
  if (!userId) return null;

  const summary = db.prepare(`
    SELECT
      u.phone as user_id,
      COALESCE(u.email, u.phone) as email,
      u.created_at,
      COALESCE(c.balance, 0) as credits,
      COALESCE(s.status, 'none') as subscription_status,
      COALESCE((
        SELECT MAX(created_at) FROM (
          SELECT MAX(created_at) as created_at FROM stage_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM tool_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM listing_text_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM ai_tour_runs WHERE phone = u.phone
        )
      ), u.created_at) as last_activity_at
    FROM users u
    LEFT JOIN credits c ON c.phone = u.phone
    LEFT JOIN subscriptions s ON s.phone = u.phone
    WHERE u.phone = ? OR u.email = ?
    LIMIT 1
  `).get(userId, userId) as Record<string, unknown> | undefined;

  if (!summary) return null;

  const ledger = db.prepare(`
    SELECT id, delta, reason, created_at
    FROM credit_ledger
    WHERE phone = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(userId, MAX_LEDGER) as Array<Record<string, unknown>>;

  const runs = db.prepare(`
    SELECT * FROM (
      SELECT
        run_id,
        'stage' as tool_id,
        status,
        fail_code,
        used_credits,
        refunded,
        created_at,
        'Sanal Dekorasyon' as title,
        NULL as detail,
        before_image_url,
        after_image_url,
        room_type,
        style
      FROM stage_runs
      WHERE phone = ?
      UNION ALL
      SELECT
        run_id,
        tool_id,
        status,
        NULL as fail_code,
        used_credits,
        0 as refunded,
        created_at,
        title,
        detail,
        before_image_url,
        after_image_url,
        NULL as room_type,
        NULL as style
      FROM tool_runs
      WHERE phone = ?
      UNION ALL
      SELECT
        run_id,
        'listing-text' as tool_id,
        status,
        fail_code,
        used_credits,
        0 as refunded,
        created_at,
        'İlan Metni' as title,
        output_text as detail,
        NULL as before_image_url,
        NULL as after_image_url,
        NULL as room_type,
        NULL as style
      FROM listing_text_runs
      WHERE phone = ?
      UNION ALL
      SELECT
        run_id,
        'ai-tour-guide' as tool_id,
        status,
        fail_code,
        used_credits,
        0 as refunded,
        created_at,
        'Sanal Sunucu' as title,
        CASE WHEN video_url IS NOT NULL AND TRIM(video_url) <> '' THEN video_url ELSE script_output END as detail,
        NULL as before_image_url,
        NULL as after_image_url,
        NULL as room_type,
        NULL as style
      FROM ai_tour_runs
      WHERE phone = ?
    )
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, userId, userId, userId, MAX_RUNS) as Array<Record<string, unknown>>;

  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(used_credits), 0) as total_credits_used,
      COUNT(*) as total_runs,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
      SUM(CASE WHEN status <> 'success' THEN 1 ELSE 0 END) as failed_runs,
      SUM(CASE WHEN created_at >= @recent THEN 1 ELSE 0 END) as recent_30d_runs,
      COALESCE(SUM(CASE WHEN created_at >= @recent THEN used_credits ELSE 0 END), 0) as recent_30d_credits_used
    FROM (
      SELECT status, created_at, used_credits FROM stage_runs WHERE phone = @userId
      UNION ALL SELECT status, created_at, used_credits FROM tool_runs WHERE phone = @userId
      UNION ALL SELECT status, created_at, used_credits FROM listing_text_runs WHERE phone = @userId
      UNION ALL SELECT status, created_at, used_credits FROM ai_tour_runs WHERE phone = @userId
    )
  `).get({ userId, recent: Date.now() - (30 * 24 * 60 * 60 * 1000) }) as Record<string, unknown> | undefined;

  const breakdown = db.prepare(`
    SELECT tool_id, COUNT(*) as run_count, COALESCE(SUM(used_credits), 0) as used_credits
    FROM (
      SELECT 'stage' as tool_id, used_credits FROM stage_runs WHERE phone = ?
      UNION ALL SELECT tool_id, used_credits FROM tool_runs WHERE phone = ?
      UNION ALL SELECT 'listing-text' as tool_id, used_credits FROM listing_text_runs WHERE phone = ?
      UNION ALL SELECT 'ai-tour-guide' as tool_id, used_credits FROM ai_tour_runs WHERE phone = ?
    )
    GROUP BY tool_id
    ORDER BY used_credits DESC, run_count DESC, tool_id ASC
  `).all(userId, userId, userId, userId) as Array<Record<string, unknown>>;

  const subscriptionStatusRaw = String(summary.subscription_status || 'none');
  const subscriptionStatus = subscriptionStatusRaw === 'active' || subscriptionStatusRaw === 'cancelled'
    ? subscriptionStatusRaw
    : 'none';

  return {
    userId: String(summary.user_id || userId),
    email: String(summary.email || userId),
    createdAt: Number(summary.created_at || 0),
    credits: Number(summary.credits || 0),
    subscriptionStatus,
    lastActivityAt: summary.last_activity_at ? Number(summary.last_activity_at) : null,
    totalCreditsUsed: Number(stats?.total_credits_used || 0),
    totalRuns: Number(stats?.total_runs || 0),
    successfulRuns: Number(stats?.successful_runs || 0),
    failedRuns: Number(stats?.failed_runs || 0),
    recent30dRuns: Number(stats?.recent_30d_runs || 0),
    recent30dCreditsUsed: Number(stats?.recent_30d_credits_used || 0),
    subscription: subscriptionStatus === 'none' ? null : null,
    ledger: ledger.map(mapLedgerRow),
    runs: runs.map((row) => mapRunRow(row, userId)),
    toolBreakdown: breakdown.map(mapBreakdownRow),
  };
}

async function getPersistentOverview(): Promise<AdminOverviewMetrics> {
  await ensurePersistentSchema();
  const sql = getPersistentSql();
  const since = Date.now() - (24 * 60 * 60 * 1000);
  const rows = await sql.unsafe(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') AS active_subscriptions,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled') AS cancelled_subscriptions,
      (SELECT COALESCE(SUM(balance), 0) FROM credits) AS total_credits,
      (
        (SELECT COUNT(*) FROM stage_runs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM tool_runs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM listing_text_runs WHERE created_at >= $1) +
        (SELECT COUNT(*) FROM ai_tour_runs WHERE created_at >= $1)
      ) AS recent_runs_24h
  `, [since]) as Array<Record<string, unknown>>;
  const row = rows[0] || {};
  return {
    totalUsers: Number(row.total_users || 0),
    activeSubscriptions: Number(row.active_subscriptions || 0),
    cancelledSubscriptions: Number(row.cancelled_subscriptions || 0),
    totalCredits: Number(row.total_credits || 0),
    recentRuns24h: Number(row.recent_runs_24h || 0),
  };
}

async function getPersistentUserList(input: {
  query: string;
  subscriptionStatus: AdminSubscriptionFilter;
  creditFilter: AdminCreditFilter;
  limit: number;
  offset: number;
}): Promise<{ users: UserListItem[]; total: number }> {
  await ensurePersistentSchema();
  const sql = getPersistentSql();
  const params: Array<string | number> = [];
  const where: string[] = [];

  if (input.query) {
    params.push(`%${input.query}%`);
    const idx = params.length;
    where.push(`(LOWER(COALESCE(u.email, u.phone)) LIKE $${idx} OR LOWER(u.phone) LIKE $${idx})`);
  }
  if (input.subscriptionStatus === 'active') where.push(`COALESCE(s.status, 'none') = 'active'`);
  if (input.subscriptionStatus === 'cancelled') where.push(`COALESCE(s.status, 'none') = 'cancelled'`);
  if (input.subscriptionStatus === 'none') where.push(`s.phone IS NULL`);
  if (input.creditFilter === 'positive') where.push(`COALESCE(c.balance, 0) > 0`);
  if (input.creditFilter === 'zero') where.push(`COALESCE(c.balance, 0) = 0`);

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const fromSql = `
    FROM users u
    LEFT JOIN credits c ON c.phone = u.phone
    LEFT JOIN subscriptions s ON s.phone = u.phone
    ${whereSql}
  `;

  const totalRows = await sql.unsafe(`SELECT COUNT(*) as value ${fromSql}`, params) as Array<Record<string, unknown>>;
  const total = Number(totalRows[0]?.value || 0);

  params.push(input.limit);
  const limitIdx = params.length;
  params.push(input.offset);
  const offsetIdx = params.length;

  const rows = await sql.unsafe(`
    SELECT
      u.phone as user_id,
      COALESCE(u.email, u.phone) as email,
      u.created_at,
      COALESCE(c.balance, 0) as credits,
      COALESCE(s.status, 'none') as subscription_status,
      s.plan_name as subscription_plan_name,
      COALESCE((
        SELECT MAX(created_at) FROM (
          SELECT MAX(created_at) as created_at FROM stage_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM tool_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM listing_text_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM ai_tour_runs WHERE phone = u.phone
        ) activity
      ), u.created_at) as last_activity_at,
      COALESCE((
        SELECT SUM(used_credits) FROM (
          SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM stage_runs WHERE phone = u.phone
          UNION ALL SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM tool_runs WHERE phone = u.phone
          UNION ALL SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM listing_text_runs WHERE phone = u.phone
          UNION ALL SELECT COALESCE(SUM(used_credits), 0) as used_credits FROM ai_tour_runs WHERE phone = u.phone
        ) credits_union
      ), 0) as total_used_credits
      ${fromSql}
    ORDER BY last_activity_at DESC, u.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, params) as Array<Record<string, unknown>>;

  return { users: rows.map(parseListRow), total };
}

async function getPersistentDetail(userIdRaw: string): Promise<AdminUserDetail | null> {
  await ensurePersistentSchema();
  const sql = getPersistentSql();
  const userId = normalizePhone(userIdRaw);
  if (!userId) return null;

  const summaryRows = await sql.unsafe(`
    SELECT
      u.phone as user_id,
      COALESCE(u.email, u.phone) as email,
      u.created_at,
      COALESCE(c.balance, 0) as credits,
      COALESCE(s.status, 'none') as subscription_status,
      COALESCE((
        SELECT MAX(created_at) FROM (
          SELECT MAX(created_at) as created_at FROM stage_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM tool_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM listing_text_runs WHERE phone = u.phone
          UNION ALL SELECT MAX(created_at) as created_at FROM ai_tour_runs WHERE phone = u.phone
        ) activity
      ), u.created_at) as last_activity_at
    FROM users u
    LEFT JOIN credits c ON c.phone = u.phone
    LEFT JOIN subscriptions s ON s.phone = u.phone
    WHERE u.phone = $1 OR u.email = $1
    LIMIT 1
  `, [userId]) as Array<Record<string, unknown>>;

  const summary = summaryRows[0];
  if (!summary) return null;

  const [ledgerRows, runRows, statsRows, breakdownRows] = await Promise.all([
    sql.unsafe(`
      SELECT id, delta, reason, created_at
      FROM credit_ledger
      WHERE phone = $1
      ORDER BY created_at DESC, id DESC
      LIMIT ${MAX_LEDGER}
    `, [userId]) as Promise<Array<Record<string, unknown>>>,
    sql.unsafe(`
      SELECT * FROM (
        SELECT run_id, 'stage' as tool_id, status, fail_code, used_credits, refunded, created_at,
               'Sanal Dekorasyon' as title, NULL as detail, before_image_url, after_image_url, room_type, style
        FROM stage_runs WHERE phone = $1
        UNION ALL
        SELECT run_id, tool_id, status, NULL as fail_code, used_credits, 0 as refunded, created_at,
               title, detail, before_image_url, after_image_url, NULL as room_type, NULL as style
        FROM tool_runs WHERE phone = $1
        UNION ALL
        SELECT run_id, 'listing-text' as tool_id, status, fail_code, used_credits, 0 as refunded, created_at,
               'İlan Metni' as title, output_text as detail, NULL as before_image_url, NULL as after_image_url, NULL as room_type, NULL as style
        FROM listing_text_runs WHERE phone = $1
        UNION ALL
        SELECT run_id, 'ai-tour-guide' as tool_id, status, fail_code, used_credits, 0 as refunded, created_at,
               'Sanal Sunucu' as title,
               CASE WHEN video_url IS NOT NULL AND BTRIM(video_url) <> '' THEN video_url ELSE script_output END as detail,
               NULL as before_image_url, NULL as after_image_url, NULL as room_type, NULL as style
        FROM ai_tour_runs WHERE phone = $1
      ) runs
      ORDER BY created_at DESC
      LIMIT ${MAX_RUNS}
    `, [userId]) as Promise<Array<Record<string, unknown>>>,
    sql.unsafe(`
      SELECT
        COALESCE(SUM(used_credits), 0) as total_credits_used,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
        SUM(CASE WHEN status <> 'success' THEN 1 ELSE 0 END) as failed_runs,
        SUM(CASE WHEN created_at >= $2 THEN 1 ELSE 0 END) as recent_30d_runs,
        COALESCE(SUM(CASE WHEN created_at >= $2 THEN used_credits ELSE 0 END), 0) as recent_30d_credits_used
      FROM (
        SELECT status, created_at, used_credits FROM stage_runs WHERE phone = $1
        UNION ALL SELECT status, created_at, used_credits FROM tool_runs WHERE phone = $1
        UNION ALL SELECT status, created_at, used_credits FROM listing_text_runs WHERE phone = $1
        UNION ALL SELECT status, created_at, used_credits FROM ai_tour_runs WHERE phone = $1
      ) stats
    `, [userId, Date.now() - (30 * 24 * 60 * 60 * 1000)]) as Promise<Array<Record<string, unknown>>>,
    sql.unsafe(`
      SELECT tool_id, COUNT(*) as run_count, COALESCE(SUM(used_credits), 0) as used_credits
      FROM (
        SELECT 'stage' as tool_id, used_credits FROM stage_runs WHERE phone = $1
        UNION ALL SELECT tool_id, used_credits FROM tool_runs WHERE phone = $1
        UNION ALL SELECT 'listing-text' as tool_id, used_credits FROM listing_text_runs WHERE phone = $1
        UNION ALL SELECT 'ai-tour-guide' as tool_id, used_credits FROM ai_tour_runs WHERE phone = $1
      ) grouped
      GROUP BY tool_id
      ORDER BY used_credits DESC, run_count DESC, tool_id ASC
    `, [userId]) as Promise<Array<Record<string, unknown>>>,
  ]);

  const subscriptionStatusRaw = String(summary.subscription_status || 'none');
  const subscriptionStatus = subscriptionStatusRaw === 'active' || subscriptionStatusRaw === 'cancelled'
    ? subscriptionStatusRaw
    : 'none';
  const stats = statsRows[0] || {};

  return {
    userId: String(summary.user_id || userId),
    email: String(summary.email || userId),
    createdAt: Number(summary.created_at || 0),
    credits: Number(summary.credits || 0),
    subscriptionStatus,
    lastActivityAt: summary.last_activity_at ? Number(summary.last_activity_at) : null,
    totalCreditsUsed: Number(stats.total_credits_used || 0),
    totalRuns: Number(stats.total_runs || 0),
    successfulRuns: Number(stats.successful_runs || 0),
    failedRuns: Number(stats.failed_runs || 0),
    recent30dRuns: Number(stats.recent_30d_runs || 0),
    recent30dCreditsUsed: Number(stats.recent_30d_credits_used || 0),
    subscription: subscriptionStatus === 'none' ? null : null,
    ledger: ledgerRows.map(mapLedgerRow),
    runs: runRows.map((row) => mapRunRow(row, userId)),
    toolBreakdown: breakdownRows.map(mapBreakdownRow),
  };
}

export async function getAdminUserList(input: {
  query?: string | null;
  subscriptionStatus?: AdminSubscriptionFilter;
  creditFilter?: AdminCreditFilter;
  limit?: number;
  offset?: number;
}): Promise<AdminListResponse> {
  const limit = Math.max(1, Math.min(MAX_LIST_LIMIT, Number(input.limit) || 30));
  const offset = Math.max(0, Math.floor(Number(input.offset) || 0));
  const query = normalizeSearchTerm(input.query);
  const subscriptionStatus = input.subscriptionStatus === 'active' || input.subscriptionStatus === 'cancelled' || input.subscriptionStatus === 'none'
    ? input.subscriptionStatus
    : 'all';
  const creditFilter = input.creditFilter === 'positive' || input.creditFilter === 'zero'
    ? input.creditFilter
    : 'all';

  const overview = hasPersistentDb() ? await getPersistentOverview() : getSqliteOverview();
  const list = hasPersistentDb()
    ? await getPersistentUserList({ query, subscriptionStatus, creditFilter, limit, offset })
    : getSqliteUserList({ query, subscriptionStatus, creditFilter, limit, offset });

  return {
    overview,
    users: list.users,
    total: list.total,
    limit,
    offset,
  };
}

export async function getAdminUserDetail(userIdRaw: string): Promise<AdminUserDetail | null> {
  const userId = normalizePhone(userIdRaw);
  if (!userId) return null;

  const detail = hasPersistentDb()
    ? await getPersistentDetail(userId)
    : getSqliteDetail(userId);

  if (!detail) return null;

  if (detail.subscriptionStatus !== 'none') {
    detail.subscription = await getOrCreateSubscription(userId);
  }

  return detail;
}
