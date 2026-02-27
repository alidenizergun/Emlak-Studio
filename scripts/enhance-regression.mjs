import path from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const CASES = [
  { before: 'public/images/examples/living-empty.png', after: 'public/images/examples/living-furnished.png', name: 'living' },
  { before: 'public/images/examples/bedroom-empty.png', after: 'public/images/examples/bedroom-furnished.png', name: 'bedroom' },
  { before: 'public/images/examples/kitchen-empty.png', after: 'public/images/examples/kitchen-furnished.png', name: 'kitchen' },
];

function toMetrics(raw, width, height) {
  const gray = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < raw.length; i += 4, p += 1) {
    const l = (0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]) / 255;
    gray[p] = l;
    sum += l;
  }
  const mean = sum / gray.length;
  let variance = 0;
  for (let i = 0; i < gray.length; i += 1) variance += (gray[i] - mean) ** 2;
  const std = Math.sqrt(variance / gray.length);
  let lap = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      const v = gray[idx - width] + gray[idx + width] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
      lap += v * v;
      count += 1;
    }
  }
  return { mean, std, sharpness: count > 0 ? lap / count : 0 };
}

async function loadMetrics(fp) {
  const img = await Jimp.read(fp);
  img.resize({ w: 256, h: 256 });
  return toMetrics(img.bitmap.data, 256, 256);
}

function scoreEnhance(before, after) {
  const sharpRatio = after.sharpness / Math.max(before.sharpness, 0.0001);
  const contrastRatio = after.std / Math.max(before.std, 0.0001);
  const exposure = 1 - Math.abs(after.mean - 0.5) * 2;
  return Math.max(0, Math.min(1, 0.45 * Math.min(1.3, sharpRatio) + 0.35 * Math.min(1.3, contrastRatio) + 0.2 * exposure));
}

async function run() {
  const threshold = Number(process.env.ENHANCE_REGRESSION_THRESHOLD || 0.52);
  let failed = 0;
  for (const c of CASES) {
    const before = path.join(root, c.before);
    const after = path.join(root, c.after);
    const [mBefore, mAfter] = await Promise.all([loadMetrics(before), loadMetrics(after)]);
    const score = scoreEnhance(mBefore, mAfter);
    const ok = score >= threshold;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${c.name} enhanceScore=${score.toFixed(3)} threshold=${threshold}`);
  }
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error('enhance regression failed:', error?.message || error);
  process.exit(1);
});
