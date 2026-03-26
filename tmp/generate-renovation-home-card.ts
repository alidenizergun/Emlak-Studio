import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!key) throw new Error('Missing Gemini API key');
const genAI = new GoogleGenerativeAI(key);
const modelName = process.env.NANO_BANANA_MODEL || process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
const model = genAI.getGenerativeModel({ model: modelName });

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'public/images/examples/foyer-before.png');
const outBefore = path.join(projectRoot, 'public/images/home-cards/renovation-before.png');
const outAfter = path.join(projectRoot, 'public/images/home-cards/renovation-after.png');

const baseRules = `GLOBAL IMAGE POLICY (MANDATORY):
- Never modify architecture: preserve room size perception, wall positions, column positions, ceiling height/shape, window/door positions, and all structural geometry.
- Preserve camera angle, perspective, framing, and lens character.
- Architectural stability is mandatory: keep columns, beams, walls, windows, doors, ceiling lines, and room proportions exactly the same.
- Output quality is mandatory: final image must be crisp, clean, and premium real-estate quality.
- Lighting improvement is allowed only to support realism.
- Output must remain photorealistic; no cartoon or AI-art look.
- Do not add people, new text, new logos, or new watermarks.`;

const beforePrompt = `${baseRules}

TASK:
Create a convincing pre-renovation version of this same foyer. Keep the exact architecture, doors, arches, ceiling shape, floor geometry, and camera perspective unchanged. Make it feel older and less premium for a real-estate listing: dated wall color, weaker old-style light fixture, a more tired finish palette, less refined surfaces, and a generally outdated property impression. Keep it realistic, empty, and photorealistic.`;

const afterPrompt = `${baseRules}

TASK:
Apply a realistic premium virtual renovation to this same foyer. Keep the exact architecture, doors, arches, ceiling shape, floor geometry, and camera perspective unchanged. Transform it into a bright, modern, high-end finished entrance with upgraded finishes, refined lighting, cleaner wall treatment, and a polished luxury real-estate presentation. Keep it photorealistic, elegant, and believable.`;

function extractInlineImageData(result: {
  response?: {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mimeType?: string };
        }>;
      };
    }>;
  };
}) {
  const candidates = result?.response?.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
      const inlineData = part.inlineData || part.inline_data;
      if (inlineData?.data) return inlineData;
    }
  }
  return null;
}

async function generate(prompt: string, outputPath: string) {
  const bytes = readFileSync(sourcePath);
  const data = Buffer.from(bytes).toString('base64');
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data } }] }],
    generationConfig: { temperature: 0.12 },
  });
  const out = extractInlineImageData(result);
  if (!out?.data) throw new Error('Model did not return image');
  writeFileSync(outputPath, Buffer.from(out.data, 'base64'));
}

console.log('Generating before with', modelName);
await generate(beforePrompt, outBefore);
console.log('Generating after with', modelName);
await generate(afterPrompt, outAfter);
console.log('Done');
