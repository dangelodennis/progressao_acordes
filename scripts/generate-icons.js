import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sourceImage = path.resolve('src/assets/images/chord_app_icon_1788372863126.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function run() {
  console.log('Generating PWA icons from:', sourceImage);

  // 1. 192x192 PNG
  await sharp(sourceImage)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. 512x512 PNG
  await sharp(sourceImage)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. 512x512 Maskable with 15% safe-zone margin (410x410 centered on 512x512 #15171e canvas)
  const innerResized = await sharp(sourceImage)
    .resize(410, 410)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 21, g: 23, b: 30, alpha: 1 }, // #15171e
    },
  })
    .composite([{ input: innerResized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(sourceImage)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 5. favicon.ico / png (64x64)
  await sharp(sourceImage)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  // 6. icon.svg
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#15171e"/>
  <rect x="72" y="72" width="368" height="368" fill="#1a1d26" stroke="#4f46e5" stroke-width="8"/>
  <rect x="100" y="100" width="80" height="240" fill="#f8fafc"/>
  <rect x="180" y="100" width="80" height="240" fill="#f8fafc"/>
  <rect x="260" y="100" width="80" height="240" fill="#f8fafc"/>
  <rect x="340" y="100" width="72" height="240" fill="#f8fafc"/>
  <rect x="156" y="100" width="48" height="150" fill="#181b24"/>
  <rect x="236" y="100" width="48" height="150" fill="#4f46e5"/>
  <rect x="316" y="100" width="48" height="150" fill="#181b24"/>
  <circle cx="200" cy="380" r="18" fill="#fbbf24"/>
  <circle cx="280" cy="380" r="18" fill="#4f46e5"/>
  <circle cx="360" cy="380" r="18" fill="#fbbf24"/>
  <line x1="200" y1="380" x2="280" y2="380" stroke="#94a3b8" stroke-width="4"/>
  <line x1="280" y1="380" x2="360" y2="380" stroke="#94a3b8" stroke-width="4"/>
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  console.log('Generated icon.svg');

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
