#!/usr/bin/env node
/**
 * Schrijft de redirectmap (redirects.config.mjs) naar:
 *  - vercel.json → "redirects" (permanent: true = 308; statusCode 301 expliciet)
 *  - public/_redirects → Netlify + Cloudflare Pages ("/oud/ /nieuw/ 301")
 * Basisconfig (headers, trailingSlash) blijft in vercel.json staan; alleen de key
 * "redirects" wordt vervangen. Draait automatisch vóór elke build (prebuild).
 */
import { readFile, writeFile } from 'node:fs/promises';
import redirects from '../redirects.config.mjs';

const norm = (p) => (p.endsWith('/') ? p : p + '/');
for (const r of redirects) {
  if (!r.from.startsWith('/') || !r.to.startsWith('/')) throw new Error(`Redirect moet met / beginnen: ${JSON.stringify(r)}`);
  if (r.from !== r.from.toLowerCase()) throw new Error(`Redirect-bron moet lowercase zijn: ${r.from}`);
}

const vercelPath = new URL('../vercel.json', import.meta.url);
const vercel = JSON.parse(await readFile(vercelPath, 'utf8'));
vercel.redirects = redirects.map((r) => ({ source: r.from.replace(/\/$/, ''), destination: norm(r.to), statusCode: 301 }));
await writeFile(vercelPath, JSON.stringify(vercel, null, 2) + '\n');

const lines = [
  '# Gegenereerd door scripts/gen-redirects.mjs uit redirects.config.mjs. Niet handmatig bewerken.',
  ...redirects.map((r) => `${norm(r.from)} ${norm(r.to)} 301`),
  ...redirects.map((r) => `${r.from.replace(/\/$/, '')} ${norm(r.to)} 301`).filter((l) => !l.startsWith(' ')),
];
await writeFile(new URL('../public/_redirects', import.meta.url), lines.join('\n') + '\n');
console.log(`redirects: ${redirects.length} regel(s) geschreven naar vercel.json en public/_redirects`);
