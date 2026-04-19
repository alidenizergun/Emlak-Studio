import Database from 'better-sqlite3';
import postgres from 'postgres';
import path from 'path';

const adaptiveTables = [
  'stage_adaptive_policy',
  'tool_adaptive_policy',
  'ai_tour_adaptive_policy',
  'listing_text_adaptive_policy',
];

function resolveSqlitePath() {
  if (process.env.SQLITE_DB_PATH) return process.env.SQLITE_DB_PATH;
  if (process.env.APP_DB_PATH) return process.env.APP_DB_PATH;
  return path.join(process.cwd(), 'data', 'app.db');
}

function asRows(value) {
  return Array.isArray(value) ? value : [];
}

function tableExists(sqlite, table) {
  const row = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
  return Boolean(row?.name);
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function tableColumns(sqlite, table) {
  if (!tableExists(sqlite, table)) {
    return null;
  }

  const rows = asRows(sqlite.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all());
  return new Set(rows.map((row) => String(row.name)));
}

function readRows(sqlite, table, columns) {
  const existingColumns = tableColumns(sqlite, table);
  if (!existingColumns) {
    return { exists: false, rows: [] };
  }

  const selectList = columns
    .map((column) => {
      const config = typeof column === 'string' ? { name: column } : column;
      const alias = quoteIdentifier(config.name);

      if (existingColumns.has(config.name)) {
        return alias;
      }

      return `${config.fallback ?? 'NULL'} AS ${alias}`;
    })
    .join(', ');

  return {
    exists: true,
    rows: asRows(sqlite.prepare(`SELECT ${selectList} FROM ${quoteIdentifier(table)}`).all()),
  };
}

async function ensureHistoryAdaptiveSchema(tx) {
  await tx`
    CREATE TABLE IF NOT EXISTS users (
      phone TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await tx`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;

  await tx`
    CREATE TABLE IF NOT EXISTS stage_runs (
      run_id TEXT PRIMARY KEY,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      request_key TEXT NOT NULL,
      room_type TEXT NOT NULL,
      style TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'blocked')),
      fail_code TEXT,
      architecture_score DOUBLE PRECISION,
      quality_score DOUBLE PRECISION,
      before_image_url TEXT,
      after_image_url TEXT,
      used_credits INTEGER NOT NULL DEFAULT 0,
      refunded INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS stage_feedback (
      id BIGSERIAL PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES stage_runs(run_id) ON DELETE CASCADE,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
      note TEXT,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS stage_adaptive_policy (
      policy_key TEXT PRIMARY KEY,
      policy_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS tool_adaptive_policy (
      policy_key TEXT PRIMARY KEY,
      policy_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS ai_tour_runs (
      run_id TEXT PRIMARY KEY,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
      fail_code TEXT,
      quality_score DOUBLE PRECISION,
      script_input TEXT,
      script_output TEXT,
      provider TEXT,
      video_url TEXT,
      duration_seconds INTEGER,
      used_credits INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS ai_tour_feedback (
      id BIGSERIAL PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES ai_tour_runs(run_id) ON DELETE CASCADE,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
      note TEXT,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS ai_tour_adaptive_policy (
      policy_key TEXT PRIMARY KEY,
      policy_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS listing_text_runs (
      run_id TEXT PRIMARY KEY,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
      fail_code TEXT,
      quality_score DOUBLE PRECISION,
      provider TEXT,
      input_json TEXT,
      output_text TEXT,
      used_credits INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS listing_text_feedback (
      id BIGSERIAL PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES listing_text_runs(run_id) ON DELETE CASCADE,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      verdict TEXT NOT NULL CHECK (verdict IN ('good', 'bad')),
      note TEXT,
      created_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS listing_text_adaptive_policy (
      policy_key TEXT PRIMARY KEY,
      policy_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
  await tx`
    CREATE TABLE IF NOT EXISTS tool_runs (
      run_id TEXT PRIMARY KEY,
      phone TEXT NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
      tool_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
      before_image_url TEXT,
      after_image_url TEXT,
      title TEXT,
      detail TEXT,
      used_credits INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;

  await tx`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_stage_runs_phone_created_at ON stage_runs(phone, created_at DESC)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_stage_runs_status_created_at ON stage_runs(status, created_at DESC)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_stage_feedback_run_id ON stage_feedback(run_id)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_ai_tour_runs_phone_created_at ON ai_tour_runs(phone, created_at DESC)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_ai_tour_feedback_run_id ON ai_tour_feedback(run_id)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_listing_text_runs_phone_created_at ON listing_text_runs(phone, created_at DESC)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_listing_text_feedback_run_id ON listing_text_feedback(run_id)`;
  await tx`CREATE INDEX IF NOT EXISTS idx_tool_runs_phone_created_at ON tool_runs(phone, created_at DESC)`;
}

async function ensureUsers(tx, sqlite, phones) {
  if (phones.size === 0) {
    console.log('users: no referenced phone rows found');
    return;
  }

  const phoneList = Array.from(phones);
  const sqliteUsers = new Map();

  if (tableExists(sqlite, 'users')) {
    const phoneSet = new Set(phoneList);
    const { rows } = readRows(
      sqlite,
      'users',
      ['phone', { name: 'email' }, { name: 'created_at' }]
    );

    for (const row of rows) {
      const phone = String(row.phone || '').trim();
      if (phoneSet.has(phone)) {
        sqliteUsers.set(phone, row);
      }
    }
  }

  for (const phone of phoneList) {
    const existing = sqliteUsers.get(phone);
    const email = existing?.email ? String(existing.email) : phone.includes('@') ? phone : null;
    const createdAt = Number(existing?.created_at ?? Date.now());

    await tx`
      INSERT INTO users (phone, email, created_at)
      VALUES (${phone}, ${email}, ${createdAt})
      ON CONFLICT (phone) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, users.email)
    `;
  }

  console.log(`users: ${phoneList.length} referenced phone(s) ensured`);
}

async function migrateAdaptivePolicies(tx, sqlite) {
  for (const table of adaptiveTables) {
    const { exists, rows } = readRows(
      sqlite,
      table,
      ['policy_key', 'policy_json', { name: 'updated_at' }]
    );

    if (!exists) {
      console.log(`${table}: skipped (table not found)`);
      continue;
    }

    for (const row of rows) {
      await tx.unsafe(
        `INSERT INTO ${table} (policy_key, policy_json, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (policy_key) DO UPDATE SET
           policy_json = EXCLUDED.policy_json,
           updated_at = EXCLUDED.updated_at`,
        [String(row.policy_key), String(row.policy_json), Number(row.updated_at ?? Date.now())]
      );
    }

    console.log(`${table}: ${rows.length} row(s) migrated`);
  }
}

async function main() {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const sqlitePath = resolveSqlitePath();
  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    console.log(`Reading SQLite from: ${sqlitePath}`);

    await sql.begin(async (tx) => {
      await ensureHistoryAdaptiveSchema(tx);

      const { exists: stageRunsExists, rows: stageRows } = readRows(
        sqlite,
        'stage_runs',
        [
          'run_id',
          'phone',
          { name: 'request_key', fallback: "''" },
          { name: 'room_type', fallback: "''" },
          { name: 'style', fallback: "''" },
          { name: 'prompt_version', fallback: "''" },
          { name: 'status', fallback: "'failed'" },
          { name: 'fail_code' },
          { name: 'architecture_score' },
          { name: 'quality_score' },
          { name: 'before_image_url' },
          { name: 'after_image_url' },
          { name: 'used_credits', fallback: '0' },
          { name: 'refunded', fallback: '0' },
          { name: 'created_at' },
        ]
      );
      const { exists: stageFeedbackExists, rows: stageFeedbackRows } = readRows(
        sqlite,
        'stage_feedback',
        [
          { name: 'id', fallback: 'rowid' },
          'run_id',
          'phone',
          { name: 'verdict', fallback: "'bad'" },
          { name: 'note' },
          { name: 'created_at' },
        ]
      );
      const { exists: toolRunsExists, rows: toolRows } = readRows(
        sqlite,
        'tool_runs',
        [
          'run_id',
          'phone',
          { name: 'tool_id', fallback: "'unknown'" },
          { name: 'status', fallback: "'failed'" },
          { name: 'before_image_url' },
          { name: 'after_image_url' },
          { name: 'title' },
          { name: 'detail' },
          { name: 'used_credits', fallback: '0' },
          { name: 'created_at' },
        ]
      );
      const { exists: aiTourRunsExists, rows: aiTourRows } = readRows(
        sqlite,
        'ai_tour_runs',
        [
          'run_id',
          'phone',
          { name: 'status', fallback: "'failed'" },
          { name: 'fail_code' },
          { name: 'quality_score' },
          { name: 'script_input' },
          { name: 'script_output' },
          { name: 'provider' },
          { name: 'video_url' },
          { name: 'duration_seconds' },
          { name: 'used_credits', fallback: '0' },
          { name: 'created_at' },
        ]
      );
      const { exists: aiTourFeedbackExists, rows: aiTourFeedbackRows } = readRows(
        sqlite,
        'ai_tour_feedback',
        [
          { name: 'id', fallback: 'rowid' },
          'run_id',
          'phone',
          { name: 'verdict', fallback: "'bad'" },
          { name: 'note' },
          { name: 'created_at' },
        ]
      );
      const { exists: listingTextRunsExists, rows: listingTextRows } = readRows(
        sqlite,
        'listing_text_runs',
        [
          'run_id',
          'phone',
          { name: 'status', fallback: "'failed'" },
          { name: 'fail_code' },
          { name: 'quality_score' },
          { name: 'provider' },
          { name: 'input_json' },
          { name: 'output_text' },
          { name: 'used_credits', fallback: '0' },
          { name: 'created_at' },
        ]
      );
      const { exists: listingTextFeedbackExists, rows: listingTextFeedbackRows } = readRows(
        sqlite,
        'listing_text_feedback',
        [
          { name: 'id', fallback: 'rowid' },
          'run_id',
          'phone',
          { name: 'verdict', fallback: "'bad'" },
          { name: 'note' },
          { name: 'created_at' },
        ]
      );

      const referencedPhones = new Set(
        [
          ...stageRows,
          ...stageFeedbackRows,
          ...toolRows,
          ...aiTourRows,
          ...aiTourFeedbackRows,
          ...listingTextRows,
          ...listingTextFeedbackRows,
        ]
          .map((row) => String(row.phone || '').trim())
          .filter(Boolean)
      );

      await ensureUsers(tx, sqlite, referencedPhones);

      if (!stageRunsExists) {
        console.log('stage_runs: skipped (table not found)');
      } else {
        for (const row of stageRows) {
          await tx`
            INSERT INTO stage_runs (
              run_id, phone, request_key, room_type, style, prompt_version, status, fail_code,
              architecture_score, quality_score, before_image_url, after_image_url, used_credits, refunded, created_at
            )
            VALUES (
              ${String(row.run_id)}, ${String(row.phone)}, ${String(row.request_key)}, ${String(row.room_type)},
              ${String(row.style)}, ${String(row.prompt_version)}, ${String(row.status)}, ${row.fail_code ? String(row.fail_code) : null},
              ${row.architecture_score ?? null}, ${row.quality_score ?? null}, ${row.before_image_url ? String(row.before_image_url) : null},
              ${row.after_image_url ? String(row.after_image_url) : null}, ${Number(row.used_credits ?? 0)}, ${Number(row.refunded ?? 0)},
              ${Number(row.created_at ?? Date.now())}
            )
            ON CONFLICT (run_id) DO UPDATE SET
              phone = EXCLUDED.phone,
              request_key = EXCLUDED.request_key,
              room_type = EXCLUDED.room_type,
              style = EXCLUDED.style,
              prompt_version = EXCLUDED.prompt_version,
              status = EXCLUDED.status,
              fail_code = EXCLUDED.fail_code,
              architecture_score = EXCLUDED.architecture_score,
              quality_score = EXCLUDED.quality_score,
              before_image_url = COALESCE(EXCLUDED.before_image_url, stage_runs.before_image_url),
              after_image_url = COALESCE(EXCLUDED.after_image_url, stage_runs.after_image_url),
              used_credits = EXCLUDED.used_credits,
              refunded = EXCLUDED.refunded,
              created_at = EXCLUDED.created_at
          `;
        }
        console.log(`stage_runs: ${stageRows.length} row(s) migrated`);
      }

      if (!stageFeedbackExists) {
        console.log('stage_feedback: skipped (table not found)');
      } else {
        for (const row of stageFeedbackRows) {
          const note = row.note ? String(row.note) : null;
          const createdAt = Number(row.created_at ?? Date.now());

          await tx`
            INSERT INTO stage_feedback (run_id, phone, verdict, note, created_at)
            SELECT ${String(row.run_id)}, ${String(row.phone)}, ${String(row.verdict)}, ${note}, ${createdAt}
            WHERE NOT EXISTS (
              SELECT 1
              FROM stage_feedback
              WHERE run_id = ${String(row.run_id)}
                AND phone = ${String(row.phone)}
                AND verdict = ${String(row.verdict)}
                AND note IS NOT DISTINCT FROM ${note}
                AND created_at = ${createdAt}
            )
          `;
        }
        console.log(`stage_feedback: ${stageFeedbackRows.length} row(s) migrated`);
      }

      if (!toolRunsExists) {
        console.log('tool_runs: skipped (table not found)');
      } else {
        for (const row of toolRows) {
          await tx`
            INSERT INTO tool_runs (
              run_id, phone, tool_id, status, before_image_url, after_image_url, title, detail, used_credits, created_at
            )
            VALUES (
              ${String(row.run_id)}, ${String(row.phone)}, ${String(row.tool_id)}, ${String(row.status)},
              ${row.before_image_url ? String(row.before_image_url) : null}, ${row.after_image_url ? String(row.after_image_url) : null},
              ${row.title ? String(row.title) : null}, ${row.detail ? String(row.detail) : null}, ${Number(row.used_credits ?? 0)},
              ${Number(row.created_at ?? Date.now())}
            )
            ON CONFLICT (run_id) DO UPDATE SET
              phone = EXCLUDED.phone,
              tool_id = EXCLUDED.tool_id,
              status = EXCLUDED.status,
              before_image_url = COALESCE(EXCLUDED.before_image_url, tool_runs.before_image_url),
              after_image_url = COALESCE(EXCLUDED.after_image_url, tool_runs.after_image_url),
              title = COALESCE(EXCLUDED.title, tool_runs.title),
              detail = COALESCE(EXCLUDED.detail, tool_runs.detail),
              used_credits = EXCLUDED.used_credits,
              created_at = EXCLUDED.created_at
          `;
        }
        console.log(`tool_runs: ${toolRows.length} row(s) migrated`);
      }

      if (!aiTourRunsExists) {
        console.log('ai_tour_runs: skipped (table not found)');
      } else {
        for (const row of aiTourRows) {
          await tx`
            INSERT INTO ai_tour_runs (
              run_id, phone, status, fail_code, quality_score, script_input, script_output, provider,
              video_url, duration_seconds, used_credits, created_at
            )
            VALUES (
              ${String(row.run_id)}, ${String(row.phone)}, ${String(row.status)}, ${row.fail_code ? String(row.fail_code) : null},
              ${row.quality_score ?? null}, ${row.script_input ? String(row.script_input) : null},
              ${row.script_output ? String(row.script_output) : null}, ${row.provider ? String(row.provider) : null},
              ${row.video_url ? String(row.video_url) : null}, ${row.duration_seconds ?? null},
              ${Number(row.used_credits ?? 0)}, ${Number(row.created_at ?? Date.now())}
            )
            ON CONFLICT (run_id) DO UPDATE SET
              phone = EXCLUDED.phone,
              status = EXCLUDED.status,
              fail_code = EXCLUDED.fail_code,
              quality_score = EXCLUDED.quality_score,
              script_input = COALESCE(EXCLUDED.script_input, ai_tour_runs.script_input),
              script_output = COALESCE(EXCLUDED.script_output, ai_tour_runs.script_output),
              provider = COALESCE(EXCLUDED.provider, ai_tour_runs.provider),
              video_url = COALESCE(EXCLUDED.video_url, ai_tour_runs.video_url),
              duration_seconds = COALESCE(EXCLUDED.duration_seconds, ai_tour_runs.duration_seconds),
              used_credits = EXCLUDED.used_credits,
              created_at = EXCLUDED.created_at
          `;
        }
        console.log(`ai_tour_runs: ${aiTourRows.length} row(s) migrated`);
      }

      if (!aiTourFeedbackExists) {
        console.log('ai_tour_feedback: skipped (table not found)');
      } else {
        for (const row of aiTourFeedbackRows) {
          const note = row.note ? String(row.note) : null;
          const createdAt = Number(row.created_at ?? Date.now());

          await tx`
            INSERT INTO ai_tour_feedback (run_id, phone, verdict, note, created_at)
            SELECT ${String(row.run_id)}, ${String(row.phone)}, ${String(row.verdict)}, ${note}, ${createdAt}
            WHERE NOT EXISTS (
              SELECT 1
              FROM ai_tour_feedback
              WHERE run_id = ${String(row.run_id)}
                AND phone = ${String(row.phone)}
                AND verdict = ${String(row.verdict)}
                AND note IS NOT DISTINCT FROM ${note}
                AND created_at = ${createdAt}
            )
          `;
        }
        console.log(`ai_tour_feedback: ${aiTourFeedbackRows.length} row(s) migrated`);
      }

      if (!listingTextRunsExists) {
        console.log('listing_text_runs: skipped (table not found)');
      } else {
        for (const row of listingTextRows) {
          await tx`
            INSERT INTO listing_text_runs (
              run_id, phone, status, fail_code, quality_score, provider, input_json, output_text, used_credits, created_at
            )
            VALUES (
              ${String(row.run_id)}, ${String(row.phone)}, ${String(row.status)}, ${row.fail_code ? String(row.fail_code) : null},
              ${row.quality_score ?? null}, ${row.provider ? String(row.provider) : null}, ${row.input_json ? String(row.input_json) : null},
              ${row.output_text ? String(row.output_text) : null}, ${Number(row.used_credits ?? 0)}, ${Number(row.created_at ?? Date.now())}
            )
            ON CONFLICT (run_id) DO UPDATE SET
              phone = EXCLUDED.phone,
              status = EXCLUDED.status,
              fail_code = EXCLUDED.fail_code,
              quality_score = EXCLUDED.quality_score,
              provider = COALESCE(EXCLUDED.provider, listing_text_runs.provider),
              input_json = COALESCE(EXCLUDED.input_json, listing_text_runs.input_json),
              output_text = COALESCE(EXCLUDED.output_text, listing_text_runs.output_text),
              used_credits = EXCLUDED.used_credits,
              created_at = EXCLUDED.created_at
          `;
        }
        console.log(`listing_text_runs: ${listingTextRows.length} row(s) migrated`);
      }

      if (!listingTextFeedbackExists) {
        console.log('listing_text_feedback: skipped (table not found)');
      } else {
        for (const row of listingTextFeedbackRows) {
          const note = row.note ? String(row.note) : null;
          const createdAt = Number(row.created_at ?? Date.now());

          await tx`
            INSERT INTO listing_text_feedback (run_id, phone, verdict, note, created_at)
            SELECT ${String(row.run_id)}, ${String(row.phone)}, ${String(row.verdict)}, ${note}, ${createdAt}
            WHERE NOT EXISTS (
              SELECT 1
              FROM listing_text_feedback
              WHERE run_id = ${String(row.run_id)}
                AND phone = ${String(row.phone)}
                AND verdict = ${String(row.verdict)}
                AND note IS NOT DISTINCT FROM ${note}
                AND created_at = ${createdAt}
            )
          `;
        }
        console.log(`listing_text_feedback: ${listingTextFeedbackRows.length} row(s) migrated`);
      }

      await migrateAdaptivePolicies(tx, sqlite);
    });

    console.log('SQLite -> Postgres migration completed.');
  } finally {
    sqlite.close();
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
