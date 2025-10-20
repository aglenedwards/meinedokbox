import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A8A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0F172A;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <g transform="translate(106, 106)">
    <rect x="30" y="30" width="240" height="300" rx="12" fill="white" opacity="0.95"/>
    <rect x="60" y="80" width="180" height="12" rx="6" fill="#1E3A8A" opacity="0.3"/>
    <rect x="60" y="120" width="180" height="12" rx="6" fill="#1E3A8A" opacity="0.3"/>
    <rect x="60" y="160" width="140" height="12" rx="6" fill="#1E3A8A" opacity="0.3"/>
    <rect x="60" y="200" width="180" height="12" rx="6" fill="#1E3A8A" opacity="0.3"/>
    <rect x="60" y="240" width="160" height="12" rx="6" fill="#1E3A8A" opacity="0.3"/>
    <rect x="60" y="280" width="120" height="12" rx="6" fill="#1E3A8A" opacity="0.3"/>
  </g>
</svg>`;

async function generateIcons() {
  const iconsDir = join(process.cwd(), 'public', 'icons');
  
  for (const size of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));
    
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }
  
  console.log('\n✅ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
