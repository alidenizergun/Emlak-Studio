import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.join(__dirname, '../public/logo.png');
const outputPath = path.join(__dirname, '../app/icon.png');

async function createFavicon() {
    try {
        const image = await Jimp.read(inputPath);
        // Resize to 64x64 for favicon
        image.resize({ w: 64, h: 64 });
        await image.write(outputPath);
        console.log('Favicon updated at:', outputPath);
    } catch (err) {
        console.error('Error creating favicon:', err);
    }
}

createFavicon();
