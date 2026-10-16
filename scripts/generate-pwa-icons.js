#!/usr/bin/env node
// Option B PWA assets — source of truth: public/brand-icon.svg.
// Never regenerate the deprecated gold football artwork or overwrite favicon.svg.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(root, 'public');
const source = path.join(publicDir, 'brand-icon.svg');
const jobs = [
  ['apple-touch-icon-v2.png', 180, false],
  ['pwa-192x192-v2.png', 192, false],
  ['pwa-512x512-v2.png', 512, false],
  ['pwa-maskable-512x512-v2.png', 512, true],
];
const svg = fs.readFileSync(source);
if (!svg.toString('utf8').includes('#0FC982')) {
  throw new Error('Expected the approved Option B emerald SVG source.');
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  // Keep npm run optimize usable without optional native dependencies.
}
if (sharp) {
  for (const [name, size, maskable] of jobs) {
    const target = path.join(publicDir, name);
    if (maskable) {
      const inner = await sharp(svg, { density: 384 }).resize(384, 384).png().toBuffer();
      await sharp({ create: { width: 512, height: 512, channels: 4, background: '#051713' } })
        .composite([{ input: inner, left: 64, top: 64 }])
        .png().toFile(target);
    } else {
      await sharp(svg, { density: 384 }).resize(size, size)
        .flatten({ background: '#051713' }).png().toFile(target);
    }
    console.log('Generated', name);
  }
} else {
  // All four branded PNGs are checked into Git for builds without sharp.
  for (const [name, size] of jobs) {
    const filename = path.join(publicDir, name);
    if (!fs.existsSync(filename)) throw new Error('Missing Option B icon: ' + name);
    const buf = fs.readFileSync(filename);
    if (buf.length < 24 || buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
      || buf.readUInt32BE(16) !== size || buf.readUInt32BE(20) !== size) {
      throw new Error('Invalid ' + size + 'px PNG icon: ' + name);
    }
    console.log('Verified', name);
  }
  console.log('Install optional sharp to regenerate the icons from brand-icon.svg.');
}
