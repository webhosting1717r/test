#!/usr/bin/env node
/**
 * Genereert neutrale placeholder-beelden (geen externe assets nodig):
 *  - src/assets/images/placeholder-{1..6}.jpg (1600×900) voor artikelen/hubs
 *  - src/assets/images/author-{1,2}.jpg (600×600)
 *  - public/og-default.png (1200×630), public/logo.png (512×512), public/icon-192.png,
 *    public/icon-512.png, public/apple-touch-icon.png (180×180), public/favicon.svg, public/favicon.ico
 * Vervang ze door echte beelden; de bestandsnamen staan in de content-frontmatter.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const palettes = [
  ['#1d4ed8', '#60a5fa'], ['#0f766e', '#5eead4'], ['#7c3aed', '#c4b5fd'],
  ['#b45309', '#fcd34d'], ['#be185d', '#f9a8d4'], ['#374151', '#9ca3af'],
];

function svgScene(w, h, [a, b], seed) {
  const shapes = [];
  for (let i = 0; i < 6; i++) {
    const r = Math.round((w / 7) * (0.4 + ((seed * 7 + i * 13) % 10) / 10));
    const cx = Math.round(((seed * 37 + i * 173) % w));
    const cy = Math.round(((seed * 53 + i * 211) % h));
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" fill-opacity="${0.06 + (i % 3) * 0.04}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>${shapes.join('')}
  <path d="M${w * 0.1} ${h * 0.8} L${w * 0.35} ${h * 0.45} L${w * 0.55} ${h * 0.65} L${w * 0.72} ${h * 0.35} L${w * 0.9} ${h * 0.8} Z" fill="#fff" fill-opacity="0.18"/>
</svg>`;
}

function logoSvg(size, bg = '#1d4ed8', fg = '#ffffff', radius = size * 0.22) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32"><rect width="32" height="32" rx="${(radius / size) * 32}" fill="${bg}"/><path d="M9 21.5 16 9l7 12.5H9Z" fill="${fg}"/></svg>`;
}

/** Minimale ICO-container met één PNG-afbeelding (ondersteund sinds Windows Vista). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); entry.writeUInt8(0, 3); entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const imgDir = path.resolve('src/assets/images');
const pub = path.resolve('public');
await mkdir(imgDir, { recursive: true });
await mkdir(pub, { recursive: true });

for (let i = 1; i <= 6; i++) {
  await sharp(Buffer.from(svgScene(1600, 900, palettes[i - 1], i))).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(imgDir, `placeholder-${i}.jpg`));
}
for (let i = 1; i <= 2; i++) {
  await sharp(Buffer.from(svgScene(600, 600, palettes[(i + 2) % 6], i + 10))).jpeg({ quality: 85, mozjpeg: true }).toFile(path.join(imgDir, `author-${i}.jpg`));
}
await sharp(Buffer.from(svgScene(1200, 630, palettes[0], 3))).png({ compressionLevel: 9, palette: true }).toFile(path.join(pub, 'og-default.png'));
await sharp(Buffer.from(logoSvg(512))).png({ compressionLevel: 9, palette: true }).toFile(path.join(pub, 'logo.png'));
await sharp(Buffer.from(logoSvg(512))).png({ compressionLevel: 9, palette: true }).toFile(path.join(pub, 'icon-512.png'));
await sharp(Buffer.from(logoSvg(192))).png({ compressionLevel: 9, palette: true }).toFile(path.join(pub, 'icon-192.png'));
await sharp(Buffer.from(logoSvg(180, '#1d4ed8', '#ffffff', 0))).png({ compressionLevel: 9, palette: true }).toFile(path.join(pub, 'apple-touch-icon.png'));
await writeFile(path.join(pub, 'favicon.svg'), logoSvg(32));
const favPng = await sharp(Buffer.from(logoSvg(32))).png({ compressionLevel: 9 }).toBuffer();
await writeFile(path.join(pub, 'favicon.ico'), pngToIco(favPng, 32));
console.log('placeholders generated in src/assets/images and public/');
