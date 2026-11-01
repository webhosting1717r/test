#!/usr/bin/env node
/**
 * IndexNow-ping na deploy. Leest dist/sitemap-pages.xml, vergelijkt met de vorige
 * snapshot (.indexnow-state.json, optioneel gecached tussen builds) en meldt nieuwe
 * of gewijzigde URL's (op basis van lastmod) aan api.indexnow.org. Eén POST bereikt
 * alle deelnemende zoekmachines (Bing, Yandex, Naver, Seznam, …). Google doet niet mee
 * aan IndexNow; voor Google zijn sitemap-lastmod en interne links de signalen.
 *
 * Gebruik:  INDEXNOW_KEY=… node scripts/indexnow.mjs [--all] [--dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { site } from '../site.config.ts';

const key = (process.env.INDEXNOW_KEY ?? '').trim();
const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run');

if (!site.indexNow.enabled) { console.log('indexnow: uitgeschakeld in site.config.ts'); process.exit(0); }
if (!/^[a-f0-9]{8,128}$/i.test(key)) { console.log('indexnow: geen geldige INDEXNOW_KEY in omgeving, overgeslagen'); process.exit(0); }

const xml = await readFile('dist/sitemap-pages.xml', 'utf8');
const urls = new Map();
for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) urls.set(m[1], m[2]);

const statePath = '.indexnow-state.json';
const prev = existsSync(statePath) ? JSON.parse(await readFile(statePath, 'utf8')) : {};
const changed = args.has('--all') ? [...urls.keys()] : [...urls].filter(([u, m]) => prev[u] !== m).map(([u]) => u);

if (!changed.length) { console.log('indexnow: geen gewijzigde URL\'s'); process.exit(0); }
const host = new URL(site.url).host;
const body = { host, key, keyLocation: `${site.url}/${key}.txt`, urlList: changed.slice(0, 10000) };
console.log(`indexnow: ${changed.length} URL('s) → api.indexnow.org${dry ? ' (dry-run)' : ''}`);
if (!dry) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`indexnow: HTTP ${res.status} ${res.statusText}`);
  if (res.status >= 400) process.exit(1);
}
await writeFile(statePath, JSON.stringify(Object.fromEntries(urls), null, 2) + '\n');
