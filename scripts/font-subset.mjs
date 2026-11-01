#!/usr/bin/env node
/**
 * Maakt een gesubsette variable woff2 van Inter (latin, wght 400–700) uit het
 * Fontsource-pakket. Resultaat: src/assets/fonts/inter-latin-subset.woff2.
 * Draait één keer bij setup (npm run font:subset); de output staat in git.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const subsetFont = (await import('subset-font')).default;

const srcPath = require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const outDir = path.resolve('src/assets/fonts');
const outPath = path.join(outDir, 'inter-latin-subset.woff2');

// Tekens die op een West-Europese site voorkomen: Latin-1, Latin Extended-A (deels),
// algemene leestekens, euro, aanhalingstekens, streepjes, pijlen.
const ranges = [
  [0x0020, 0x007e], // basic latin
  [0x00a0, 0x00ff], // latin-1 supplement
  [0x0100, 0x017f], // latin extended-A (ĳ, œ, š, ž, …)
  [0x02bb, 0x02bc], [0x02c6, 0x02c6], [0x02da, 0x02da], [0x02dc, 0x02dc],
  [0x2000, 0x206f], // general punctuation (– — ‘ ’ “ ” … ‰ ‹ ›)
  [0x20ac, 0x20ac], // €
  [0x2122, 0x2122], // ™
  [0x2190, 0x2193], // pijlen
  [0x2212, 0x2212], [0x2215, 0x2215], // − ∕
  [0xfeff, 0xfeff], [0xfffd, 0xfffd],
];
let text = '';
for (const [a, b] of ranges) for (let c = a; c <= b; c++) text += String.fromCodePoint(c);

const input = await readFile(srcPath);
const out = await subsetFont(input, text, {
  targetFormat: 'woff2',
  // Beperk de gewichtsas tot wat het design gebruikt (400 regular – 700 bold).
  variationAxes: { wght: { min: 400, max: 700 } },
});
await mkdir(outDir, { recursive: true });
await writeFile(outPath, out);
console.log(`font-subset: ${path.relative(process.cwd(), srcPath)} (${input.length} B) → ${path.relative(process.cwd(), outPath)} (${out.length} B)`);
