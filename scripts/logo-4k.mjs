import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '../public/logo.png');
const outputPath = path.join(__dirname, '../public/logo-4k.png');

const SIZE_4K = 3840; // 4K: 3840px (birebir aynı oran, kare logo)

await sharp(inputPath)
  .resize(SIZE_4K, SIZE_4K)
  .png({ effort: 6 })
  .toFile(outputPath);

console.log('OK: logo-4k.png created at', outputPath, `(${SIZE_4K}x${SIZE_4K})`);
