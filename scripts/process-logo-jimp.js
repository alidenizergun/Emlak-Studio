
import { Jimp } from 'jimp';
import path from 'path';

const inputPath = '/Users/alidenizergun/.gemini/antigravity/brain/329afccd-21b4-4af9-b85f-c8cfc151863a/final_logo_v1_no_text_1771311481415.png';
const outputPath = '/Users/alidenizergun/Desktop/Vibe Coding Projects /Emlak-Studio/public/logo-new.png';

async function processLogo() {
    try {
        const image = await Jimp.read(inputPath);

        // Jimp doesn't have an auto-trim like sharp, but we can autocrop
        image.autocrop();

        // Resize to a larger resolution for "enlarging" while keeping it crisp
        image.resize({ w: 980, h: 980 }); // Resize to a larger resolution while keeping it crisp

        // Add a small padding
        const padding = 22;
        const newWidth = 1024;
        const newHeight = 1024;

        // Create a new white background
        const finalImage = new Jimp({ width: newWidth, height: newHeight, color: 0xffffffff });
        finalImage.composite(image, padding, padding);

        await finalImage.write(outputPath);
        console.log('Logo processed with Jimp and saved to:', outputPath);
    } catch (err) {
        console.error('Error processing logo with Jimp:', err);
    }
}

processLogo();
