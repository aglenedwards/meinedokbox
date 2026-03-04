import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const iconPath = join(rootDir, 'client/public/icons/icon-512x512.png');
const outputDir = join(rootDir, 'client/public/splashscreens');

mkdirSync(outputDir, { recursive: true });

const ICON_SIZE = 180;
const BG_COLOR = { r: 255, g: 255, b: 255, alpha: 1 };
const TEXT_COLOR = '#1e3a5f';

const splashSizes = [
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },
  { width: 1284, height: 2778, name: 'splash-1284x2778.png' },
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },
  { width: 1080, height: 2340, name: 'splash-1080x2340.png' },
  { width: 828,  height: 1792, name: 'splash-828x1792.png'  },
  { width: 750,  height: 1334, name: 'splash-750x1334.png'  },
];

const iconBuffer = await sharp(iconPath)
  .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

for (const { width, height, name } of splashSizes) {
  const iconX = Math.round((width - ICON_SIZE) / 2);
  const iconY = Math.round((height - ICON_SIZE) / 2) - 40;

  const textSvg = `<svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${width / 2}"
      y="52"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      font-size="38"
      font-weight="600"
      fill="${TEXT_COLOR}"
      text-anchor="middle"
      dominant-baseline="auto"
    >MeineDokBox</text>
  </svg>`;

  const textBuffer = await sharp(Buffer.from(textSvg)).png().toBuffer();

  const textY = iconY + ICON_SIZE + 24;

  await sharp({
    create: { width, height, channels: 4, background: BG_COLOR },
  })
    .composite([
      { input: iconBuffer, left: iconX, top: iconY },
      { input: textBuffer, left: 0, top: textY },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(outputDir, name));

  console.log(`✓ ${name} (${width}×${height})`);
}

console.log(`\nDone! Generated ${splashSizes.length} splash screens in client/public/splashscreens/`);
