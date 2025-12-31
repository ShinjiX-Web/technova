import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Use the existing logo.png as source
const sourceLogo = join(publicDir, 'logo.png');

if (!existsSync(sourceLogo)) {
  console.error('Source logo not found at:', sourceLogo);
  process.exit(1);
}

const sizes = [192, 512];

async function generateIcons() {
  console.log('Generating PWA icons from:', sourceLogo);
  
  for (const size of sizes) {
    const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
    
    await sharp(sourceLogo)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      })
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: pwa-${size}x${size}.png`);
  }
  
  console.log('PWA icons generated successfully!');
}

generateIcons().catch(console.error);

