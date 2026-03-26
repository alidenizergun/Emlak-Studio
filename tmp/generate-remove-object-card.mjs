import { readFile, writeFile } from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing Gemini key');
const modelName = String(process.env.GEMINI_IMAGE_MODELS || 'gemini-3-pro-image-preview').split(',')[0].trim();
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

const inputPath = new URL('../public/images/examples/mudroom-after.png', import.meta.url);
const outputPath = new URL('../public/images/home-cards/remove-object-after.png', import.meta.url);
const bytes = await readFile(inputPath);
const base64Data = bytes.toString('base64');
const prompt = `Task: Remove all movable items and clutter from this mudroom photo while preserving architecture exactly.

Rules:
- Remove coats, baskets, boots, shoes, rug, floor lamp, pillows, textiles, and all small accessories.
- Keep built-in cabinetry, shelves, wall paneling, doors, windows, ceiling, pendant anchor point, and floor layout unchanged.
- The result must look like a clean, tidy, empty entry space suitable for real-estate listing photography.
- Preserve the same camera angle, crop, perspective, and natural lighting direction.
- No ghosting, no transparent traces, no added furniture, no extra decor, no new architectural surfaces.`;

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [
      { text: prompt },
      { inlineData: { mimeType: 'image/png', data: base64Data } }
    ]
  }],
  generationConfig: { temperature: 0.12 }
});

const candidates = result.response?.candidates || [];
let output = null;
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
if (!output) throw new Error('No image returned from Gemini');
await writeFile(outputPath, Buffer.from(output.data, 'base64'));
console.log(outputPath.pathname);
