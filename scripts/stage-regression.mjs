import path from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const CASES = [
  { before: 'public/images/examples/bedroom-empty.png', after: 'public/images/examples/bedroom-furnished.png', name: 'bedroom' },
  { before: 'public/images/examples/kitchen-empty.png', after: 'public/images/examples/kitchen-furnished.png', name: 'kitchen' },
  { before: 'public/images/examples/living-empty.png', after: 'public/images/examples/living-furnished.png', name: 'living' },
];

function architectureMask(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  return ny <= 0.24 || (nx <= 0.16 && ny <= 0.82) || (nx >= 0.84 && ny <= 0.82) || (nx >= 0.16 && nx <= 0.84 && ny >= 0.16 && ny <= 0.62);
}

async function scoreCase(beforePath, afterPath) {
  const w = 192;
  const h = 192;
  const before = await Jimp.read(beforePath);
  const after = await Jimp.read(afterPath);
  before.resize({ w, h });
  after.resize({ w, h });
  const b = before.bitmap.data;
  const a = after.bitmap.data;
  let diff = 0;
  let max = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!architectureMask(x, y, w, h)) continue;
      const i = (y * w + x) * 4;
      const db = Math.abs(b[i] - a[i]) + Math.abs(b[i + 1] - a[i + 1]) + Math.abs(b[i + 2] - a[i + 2]);
      diff += db;
      max += 255 * 3;
    }
  }
  return Math.max(0, 1 - diff / Math.max(max, 1));
}

async function run() {
  const threshold = Number(process.env.STAGE_REGRESSION_THRESHOLD || 0.42);
  let failed = 0;
  for (const c of CASES) {
    const before = path.join(root, c.before);
    const after = path.join(root, c.after);
    const score = await scoreCase(before, after);
    const ok = score >= threshold;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${c.name} architectureScore=${score.toFixed(3)} threshold=${threshold}`);
  }
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error('stage regression failed:', error?.message || error);
  process.exit(1);
});

