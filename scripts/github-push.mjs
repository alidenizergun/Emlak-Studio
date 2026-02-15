#!/usr/bin/env node
/**
 * GitHub'a Git CLI kullanmadan push yapar (GitHub API).
 * Sadece son gönderimden sonra değişen dosyaları gönderir.
 * Kullanım: GITHUB_TOKEN=xxx node scripts/github-push.mjs
 * Token: https://github.com/settings/tokens (repo yetkisi)
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const OWNER = 'alidenizergun';
const REPO = 'Emlak-Studio';
const BRANCH = 'main';

const IGNORE = [
  /^\/?node_modules\//,
  /^\/?\.next\//,
  /^\/?out\//,
  /^\/?build\//,
  /^\/?\.git\//,
  /^\/?\.vercel\//,
  /^\.env$/,
  /\.env\.local$/,
  /\.DS_Store/,
  /\.pem$/,
  /next-env\.d\.ts$/,
  /\.tsbuildinfo$/,
  /^\/?coverage\//,
];

function shouldIgnore(relPath) {
  const n = relPath.replace(/\\/g, '/');
  return IGNORE.some((re) => re.test(n));
}

/** Git blob SHA: sha1("blob " + size + "\0" + content) */
function gitBlobSha(content) {
  const len = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
  const prefix = `blob ${len}\0`;
  const h = createHash('sha1');
  h.update(prefix);
  h.update(content);
  return h.digest('hex');
}

function* walkDir(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (rel === 'node_modules' || rel === '.git' || rel === '.next' || rel === 'out' || rel === 'build') continue;
      yield* walkDir(path.join(dir, e.name), rel);
    } else if (e.isFile() && !shouldIgnore(rel)) {
      yield rel;
    }
  }
}

async function api(token, method, urlPath, body = null) {
  const url = `https://api.github.com${urlPath}`;
  const opts = {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub API ${res.status}: ${t}`);
  }
  return res.json();
}

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*GITHUB_TOKEN\s*=\s*(.+)\s*$/);
      if (m) process.env.GITHUB_TOKEN = m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
}

async function main() {
  loadEnv();
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Hata: GITHUB_TOKEN ortam değişkeni gerekli.');
    console.error('Örnek: GITHUB_TOKEN=ghp_xxx node scripts/github-push.mjs');
    process.exit(1);
  }

  const files = [...walkDir(ROOT)];
  let parentSha = null;
  let baseTreeSha = null;
  const basePathToSha = Object.create(null);

  try {
    const ref = await api(token, 'GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    parentSha = ref.object?.sha;
    const commit = await api(token, 'GET', `/repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
    baseTreeSha = commit.tree?.sha;
    const treeRes = await api(token, 'GET', `/repos/${OWNER}/${REPO}/git/trees/${baseTreeSha}?recursive=1`);
    for (const node of treeRes.tree || []) {
      if (node.type === 'blob') basePathToSha[node.path] = node.sha;
    }
  } catch { /* ignore tree fetch */ }

  const localPaths = new Set(files);
  const treeEntries = [];
  let changedCount = 0;

  for (const rel of files) {
    const full = path.join(ROOT, rel);
    const content = fs.readFileSync(full);
    const newSha = gitBlobSha(content);
    if (basePathToSha[rel] === newSha) continue;

    changedCount++;
    const blob = await api(token, 'POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    treeEntries.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha });
  }

  for (const p of Object.keys(basePathToSha)) {
    if (!localPaths.has(p)) {
      treeEntries.push({ path: p, mode: '100644', type: 'blob', sha: null });
      changedCount++;
    }
  }

  if (changedCount === 0 && parentSha) {
    console.log('Değişiklik yok, gönderim atlandı.');
    return;
  }

  const treeBody = baseTreeSha ? { base_tree: baseTreeSha, tree: treeEntries } : { tree: treeEntries };
  const treeRes = await api(token, 'POST', `/repos/${OWNER}/${REPO}/git/trees`, treeBody);
  const treeSha = treeRes.sha;

  const commitMsg = process.env.GITHUB_COMMIT_MSG || `Güncelleme ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
  const commitBody = { message: commitMsg, tree: treeSha };
  if (parentSha) commitBody.parents = [parentSha];

  const commit = await api(token, 'POST', `/repos/${OWNER}/${REPO}/git/commits`, commitBody);
  await api(token, 'PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, { sha: commit.sha });

  console.log(`${changedCount} değişiklik gönderildi. Commit:`, commit.sha);
  console.log('https://github.com/' + OWNER + '/' + REPO);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
