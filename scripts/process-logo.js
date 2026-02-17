
import sharp from 'sharp';
import path from 'path';

const inputPath = '/Users/alidenizergun/.gemini/antigravity/brain/329afccd-21b4-4af9-b85f-c8cfc151863a/final_logo_v1_no_text_1771311481415.png';
const outputPath = '/Users/alidenizergun/Desktop/Vibe Coding Projects /Emlak-Studio/public/logo-new.png';

async function processLogo() {
  try {
    await sharp(inputPath)
      .trim() // Removes surrounding whitespace
      .extend({
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Optional: add a small transparent padding
      })
      .toFile(outputPath);
    console.log('Logo processed and saved to:', outputPath);
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();
