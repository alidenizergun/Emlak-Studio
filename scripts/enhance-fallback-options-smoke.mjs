import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const BASE_URL = process.env.ENHANCE_TEST_BASE_URL || 'http://127.0.0.1:3010';
const PHONE = (process.env.ENHANCE_TEST_PHONE || '5322168292').replace(/\D/g, '');
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.OTP_SECRET || 'dev-session-secret-change-me';
const IMAGE_PATH = process.env.ENHANCE_TEST_IMAGE || path.join(root, 'public/images/examples/living-empty.png');

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createSessionToken(phone) {
  const payload = base64UrlEncode(
    JSON.stringify({
      phone,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })
  );
  const signature = base64UrlEncode(crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest());
  return `${payload}.${signature}`;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function metricsFromImageBuffer(buffer) {
  const img = await Jimp.read(buffer);
  img.resize({ w: 256, h: 256 });
  const raw = img.bitmap.data;
  const width = 256;
  const height = 256;
  let lumaSum = 0;
  let warmthSum = 0;
  let satSum = 0;
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
    const r = raw[i] / 255;
    const g = raw[i + 1] / 255;
    const b = raw[i + 2] / 255;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    gray[p] = l;
    lumaSum += l;
    warmthSum += (r - b);
    satSum += max > 0 ? (max - min) / max : 0;
  }
  let lapSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      const lap = gray[idx - width] + gray[idx + width] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
      lapSq += lap * lap;
      count += 1;
    }
  }
  return {
    luma: lumaSum / gray.length,
    warmth: warmthSum / gray.length,
    saturation: satSum / gray.length,
    sharpness: count > 0 ? lapSq / count : 0,
  };
}

async function callEnhance(options, token, imageBuffer) {
  console.log('CALL', JSON.stringify(options));
  const file = new File([imageBuffer], 'test.png', { type: 'image/png' });
  const form = new FormData();
  form.append('image', file);
  form.append('options', JSON.stringify(options));
  form.append('phone', PHONE);
  form.append('debugForceFallback', '1');

  const res = await fetch(`${BASE_URL}/api/enhance`, {
    method: 'POST',
    headers: {
      cookie: `emlak_session=${token}`,
    },
    signal: AbortSignal.timeout(30000),
    body: form,
  });
  const json = await res.json();
  if (!json?.success) {
    throw new Error(`enhance failed (${res.status}): ${json?.error || 'unknown'}`);
  }
  if (json.processingMode !== 'fallback_local') {
    throw new Error(`expected fallback_local but got ${json.processingMode || 'undefined'}`);
  }
  if (json.creditCharged !== false) {
    throw new Error('creditCharged must be false in fallback mode');
  }
  return json;
}

async function run() {
  console.log('START', BASE_URL, IMAGE_PATH);
  const imageBuffer = await fs.readFile(IMAGE_PATH);
  const token = createSessionToken(PHONE);
  const beforeMetrics = await metricsFromImageBuffer(imageBuffer);

  const lighting = await callEnhance({ lighting: true }, token, imageBuffer);
  const twilight = await callEnhance({ twilight: true }, token, imageBuffer);
  const cleanTwilight = await callEnhance({ clean: true, twilight: true }, token, imageBuffer);

  const lightingMetrics = await metricsFromImageBuffer(parseDataUrl(lighting.imageUrl).buffer);
  const twilightMetrics = await metricsFromImageBuffer(parseDataUrl(twilight.imageUrl).buffer);
  const cleanTwilightMetrics = await metricsFromImageBuffer(parseDataUrl(cleanTwilight.imageUrl).buffer);

  const lumaDelta = lightingMetrics.luma - beforeMetrics.luma;
  const warmthDelta = twilightMetrics.warmth - beforeMetrics.warmth;
  const cleanSharpnessDelta = cleanTwilightMetrics.sharpness - beforeMetrics.sharpness;

  const results = [
    { name: 'lighting_luma_delta', value: lumaDelta, min: 0.02 },
    { name: 'twilight_warmth_delta', value: warmthDelta, min: 0.015 },
    { name: 'clean_twilight_sharpness_delta', value: cleanSharpnessDelta, min: 0.0015 },
  ];

  let failed = 0;
  for (const r of results) {
    const ok = r.value >= r.min;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${r.name}=${r.value.toFixed(4)} min=${r.min}`);
  }

  const imageHashes = [
    crypto.createHash('sha256').update(parseDataUrl(lighting.imageUrl).buffer).digest('hex'),
    crypto.createHash('sha256').update(parseDataUrl(twilight.imageUrl).buffer).digest('hex'),
    crypto.createHash('sha256').update(parseDataUrl(cleanTwilight.imageUrl).buffer).digest('hex'),
  ];
  const uniqueHashCount = new Set(imageHashes).size;
  const uniqueOk = uniqueHashCount >= 2;
  console.log(`${uniqueOk ? 'PASS' : 'FAIL'} unique_output_hashes=${uniqueHashCount}`);
  if (!uniqueOk) failed += 1;

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('enhance fallback options smoke failed:', err?.message || err);
  process.exit(1);
});
