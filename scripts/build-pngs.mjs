import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function main() {
  try {
    const faviconSvg = fs.readFileSync(path.join(process.cwd(), 'public', 'favicon.svg'));
    await sharp(faviconSvg).resize(180, 180).png().toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));
    
    const lockupSvg = fs.readFileSync(path.join(process.cwd(), 'public', 'brand', 'yourstylist-lockup.svg'));
    const ogDir = path.join(process.cwd(), 'public', 'og');
    if (!fs.existsSync(ogDir)) fs.mkdirSync(ogDir, { recursive: true });
    await sharp(lockupSvg).resize(1200, 630, { fit: 'contain', background: '#FAF9F6' }).png().toFile(path.join(ogDir, 'yourstylist-og.png'));
    console.log('PNGs created');
  } catch (e) {
    console.error(e);
  }
}
main();
