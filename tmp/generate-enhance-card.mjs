import { readFile, writeFile } from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Jimp } from 'jimp';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing Gemini key');

const sourcePath = new URL('../public/images/home-cards/enhance-source.png', import.meta.url);
const beforePath = new URL('../public/images/home-cards/enhance-before.png', import.meta.url);
const afterPath = new URL('../public/images/home-cards/enhance-after.png', import.meta.url);

const sourceBuffer = await readFile(sourcePath);
const sourceImage = await Jimp.read(sourceBuffer);
sourceImage
  .brightness(-0.28)
  .contrast(-0.14)
  .color([{ apply: 'desaturate', params: [18] }])
  .blur(2);

const degradedBuffer = await sourceImage.getBuffer('image/png');

await writeFile(beforePath, degradedBuffer);

const models = String(process.env.GEMINI_IMAGE_MODELS || 'gemini-3-pro-image-preview')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const genAI = new GoogleGenerativeAI(apiKey);

const prompt = `Task: Enhance this real-estate interior photo only.

Rules:
- Preserve the exact same room, architecture, furniture layout, decor, crop, camera angle, and perspective.
- Do not add, remove, or move any objects.
- Improve only photographic quality: brighten exposure moderately, balance white balance, increase clarity, restore crisp detail, and make the image look professionally shot for a real-estate listing.
- Keep lighting natural and believable. No HDR halo, no oversharpening, no artificial glow, no new shadows.
- The result must look like the same photo after professional light, color, and clarity correction.
- No staging, no renovation, no object removal, no style changes, no ghosting, no seams.`;

let lastError = null;
let output = null;
for (const modelName of models) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: degradedBuffer.toString('base64') } }
        ]
      }],
      generationConfig: { temperature: 0.08 }
    });

    const candidates = result.response?.candidates || [];
    for (const candidate of candidates) {
      for (const part of candidate.content?.parts || []) {
        const inlineData = part.inlineData || part.inline_data;
        if (inlineData?.data) {
          output = inlineData;
          break;
        }
      }
      if (output) break;
    }
    if (output) break;
  } catch (error) {
    lastError = error;
  }
}

if (!output) {
  throw lastError || new Error('No image returned from Gemini');
}

await writeFile(afterPath, Buffer.from(output.data, 'base64'));
console.log(JSON.stringify({
  before: beforePath.pathname,
  after: afterPath.pathname,
}, null, 2));
