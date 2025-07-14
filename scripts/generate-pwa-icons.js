#!/usr/bin/env node

/**
 * Generate PWA icons from SVG favicon
 * This script creates the required PWA icons in different sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG content for BetSightly logo
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1A1A27;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2A2A37;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FBBF24;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bgGradient)"/>
  
  <!-- Main circle -->
  <circle cx="256" cy="256" r="180" fill="url(#logoGradient)" opacity="0.1"/>
  <circle cx="256" cy="256" r="140" fill="url(#logoGradient)" opacity="0.2"/>
  
  <!-- Football/Soccer ball design -->
  <circle cx="256" cy="256" r="100" fill="url(#logoGradient)"/>
  
  <!-- Pentagon pattern (simplified football design) -->
  <polygon points="256,180 280,200 270,230 242,230 232,200" fill="#1A1A27" opacity="0.3"/>
  <polygon points="256,332 232,312 242,282 270,282 280,312" fill="#1A1A27" opacity="0.3"/>
  <polygon points="180,256 200,232 230,242 230,270 200,280" fill="#1A1A27" opacity="0.3"/>
  <polygon points="332,256 312,280 282,270 282,242 312,232" fill="#1A1A27" opacity="0.3"/>
  
  <!-- Center pentagon -->
  <polygon points="256,220 285,235 275,270 237,270 227,235" fill="#1A1A27" opacity="0.4"/>
  
  <!-- Text -->
  <text x="256" y="400" text-anchor="middle" fill="url(#logoGradient)" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
    BetSightly
  </text>
</svg>
`;

// Create the public directory if it doesn't exist
const publicDir = path.join(path.resolve(path.dirname(__dirname)), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate different sized icons
const iconSizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' }
];

// For now, we'll create SVG versions since we don't have a PNG converter
// In a real project, you'd use a library like sharp or canvas to convert SVG to PNG
iconSizes.forEach(({ size, name }) => {
  const scaledSvg = svgContent.replace(/width="512" height="512"/, `width="${size}" height="${size}"`);
  const svgName = name.replace('.png', '.svg');
  const svgPath = path.join(publicDir, svgName);
  
  fs.writeFileSync(svgPath, scaledSvg);
  console.log(`✅ Generated ${svgName}`);
});

// Also create the main favicon.ico equivalent as SVG
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
console.log('✅ Updated favicon.svg');

// Create a simple PNG fallback message
const pngFallbackContent = `
<!-- 
  PWA Icons Generated as SVG
  
  For production, convert these SVG files to PNG using:
  - Online converters
  - Sharp library: npm install sharp
  - ImageMagick: convert favicon.svg favicon.png
  
  Required PNG files:
  - pwa-192x192.png
  - pwa-512x512.png
  - apple-touch-icon.png
  - favicon-32x32.png
  - favicon-16x16.png
-->
`;

fs.writeFileSync(path.join(publicDir, 'PWA_ICONS_README.txt'), pngFallbackContent);

console.log('\n🎉 PWA icons generated successfully!');
console.log('📝 Note: SVG versions created. Convert to PNG for full browser support.');
console.log('🔧 Run: npm run generate-pwa-icons to regenerate');
