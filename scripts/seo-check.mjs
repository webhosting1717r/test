#!/usr/bin/env node
/**
 * Build-time SEO-check over dist/. Faalt (exit 1) bij fouten; waarschuwingen tellen
 * niet mee tenzij --strict. Controleert o.a.:
 *  - titles/descriptions: aanwezig, uniek, binnen de lengtegrenzen uit site.config.ts
 *  - precies één H1, geen overgeslagen kopniveaus (warn), landmarks, lang
 *  - interne links: bestaan, trailing slash, lowercase, geen links naar redirect-bronnen
 *  - wezen (orphans) en klikdiepte vanaf de homepage
 *  - afbeeldingen: alt-attribuut, width/height, lazy (warn)
 *  - JSON-LD: geldige JSON, @id-verwijzingen lossen op, verplichte properties, datums,
 *    geen door Google niet (meer) getoonde types (FAQPage, HowTo, SearchAction)
 *  - sitemap: alleen indexeerbare canonieke URL's, geen noindex, lastmod geldig, compleet
 *  - canonicals: absoluut, zelfde host, doel bestaat (200); optioneel live via SEO_CHECK_BASE_URL
 *  - robots.txt, RSS, redirects-synchronisatie
 *
 * Gebruik: node scripts/seo-check.mjs [--dist dist] [--strict] [--base-url https://…]
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { site } from '../site.config.ts';
import redirects from '../redirects.config.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const DIST = path.resolve(opt('--dist', 'dist'));
const STRICT = argv.includes('--strict');
const BASE_URL = opt('--base-url', process.env.SEO_CHECK_BASE_URL || '');
const siteHost = new URL(site.url).host;
const { titleMin, titleMax, descriptionMin, descriptionMax, maxClickDepth } = site.seo;

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push({ page, msg });
const warn = (page, msg) => warnings.push({ page, msg });

/* ---------- Bestanden inlezen ---------- */
async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
if (!existsSync(DIST)) { console.error(`seo-check: ${DIST} bestaat niet; draai eerst de build`); process.exit(1); }
const files = await walk(DIST);
const toUrlPath = (f) => {
  const rel = '/' + path.relative(DIST, f).split(path.sep).join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

const pages = new Map(); // urlPath → info
for (const f of files) {
  const html = await readFile(f, 'utf8');
  const $ = load(html);
  const urlPath = toUrlPath(f);
  const robots = ($('meta[name="robots"]').attr('content') ?? '').toLowerCase();
  const canonical = $('link[rel="canonical"]').attr('href') ?? '';
  pages.set(urlPath, {
    file: f, html, $, urlPath,
    url: site.url + urlPath,
    noindex: robots.includes('noindex'),
    canonical,
    is404: urlPath === '/404.html',
    title: $('head > title').first().text().trim(),
    description: $('meta[name="description"]').attr('content')?.trim() ?? '',
    links: new Set(),
  });
}

/* ---------- Helpers ---------- */
const redirectSources = new Set(redirects.map((r) => r.from));
function resolveInternal(href, fromPath) {
  if (!href) return null;
  const h = href.trim();
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(h)) return null;
  let u;
  try { u = new URL(h, site.url + fromPath); } catch { return { invalid: true, href: h }; }
  if (u.host !== siteHost) return null; // extern
  return { path: u.pathname, hash: u.hash, href: h };
}
function existsInDist(p) {
  if (p.endsWith('/')) return existsSync(path.join(DIST, p, 'index.html'));
  return existsSync(path.join(DIST, p));
}
const hasExt = (p) => /\.[a-z0-9]{2,5}$/i.test(p);

/* ---------- JSON-LD-validatie ---------- */
const DEPRECATED_TYPES = new Set(['FAQPage', 'HowTo', 'SearchAction', 'SpeakableSpecification', 'CourseInfo', 'EstimatedSalary', 'ClaimReview', 'VehicleListing', 'Book', 'LearningResource', 'SpecialAnnouncement', 'PracticeProblem', 'Quiz']);
const REQUIRED = {
  Organization: ['name', 'url', 'logo'],
  WebSite: ['name', 'url'],
  WebPage: ['name', 'url'], CollectionPage: ['name', 'url'], ProfilePage: ['name', 'url', 'mainEntity'], AboutPage: ['name', 'url'], ContactPage: ['name', 'url'],
  Article: ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'image'],
  BlogPosting: ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'image'],
  NewsArticle: ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'image'],
  BreadcrumbList: ['itemListElement'],
  Person: ['name'],
  ItemList: ['itemListElement'],
  ImageObject: ['url'],
};
/* ---------- Per pagina ---------- */
const titles = new Map();
const descriptions = new Map();
const GENERIC_ANCHORS = /^(lees meer|klik hier|hier|meer|read more|click here|here|more|link)$/i;

for (const page of pages.values()) {
  const { $, urlPath } = page;
  const P = urlPath;

  // Head-basis
  if ($('head > title').length !== 1) err(P, `verwacht precies één <title>, gevonden ${$('head > title').length}`);
  if ($('meta[name="description"]').length !== 1) err(P, `verwacht precies één meta description, gevonden ${$('meta[name="description"]').length}`);
  if ($('link[rel="canonical"]').length !== 1) err(P, `verwacht precies één canonical, gevonden ${$('link[rel="canonical"]').length}`);
  if ($('meta[name="robots"]').length !== 1) err(P, 'meta robots ontbreekt of is dubbel');
  if (!$('meta[charset]').length) err(P, 'meta charset ontbreekt');
  if (!$('meta[name="viewport"]').length) err(P, 'meta viewport ontbreekt');
  if ($('html').attr('lang') !== site.lang) err(P, `<html lang> is "${$('html').attr('lang')}", verwacht "${site.lang}"`);
  for (const sel of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[property="og:url"]', 'meta[name="twitter:card"]']) {
    if (!$(sel).length) err(P, `${sel} ontbreekt`);
  }

  if (!page.is404) {
    // Titel/description
    if (!page.title) err(P, 'title ontbreekt');
    else {
      if (page.title.length < titleMin || page.title.length > titleMax) err(P, `title-lengte ${page.title.length} buiten ${titleMin}–${titleMax}: "${page.title}"`);
      titles.set(page.title, [...(titles.get(page.title) ?? []), P]);
    }
    if (!page.description) err(P, 'meta description ontbreekt');
    else {
      if (page.description.length < descriptionMin || page.description.length > descriptionMax) err(P, `description-lengte ${page.description.length} buiten ${descriptionMin}–${descriptionMax}`);
      descriptions.set(page.description, [...(descriptions.get(page.description) ?? []), P]);
    }
    // Canonical
    if (!/^https?:\/\//.test(page.canonical)) err(P, `canonical is niet absoluut: "${page.canonical}"`);
    else {
      const cu = new URL(page.canonical);
      if (cu.host !== siteHost) warn(P, `canonical wijst naar een andere host: ${page.canonical}`);
      else {
        if (!existsInDist(cu.pathname)) err(P, `canonical-doel bestaat niet in dist (geen 200): ${page.canonical}`);
        if (cu.pathname !== urlPath && !page.noindex) warn(P, `canonical wijst naar ${cu.pathname} (pagina zelf is ${urlPath}); pagina hoort niet in sitemap`);
        if (cu.pathname !== cu.pathname.toLowerCase()) err(P, `canonical bevat hoofdletters: ${page.canonical}`);
        if (!cu.pathname.endsWith('/') && !hasExt(cu.pathname)) err(P, `canonical zonder trailing slash: ${page.canonical}`);
      }
      const ogUrl = $('meta[property="og:url"]').attr('content');
      if (ogUrl && ogUrl !== page.canonical) err(P, `og:url (${ogUrl}) ≠ canonical (${page.canonical})`);
    }
  } else if (!page.noindex) err(P, '404-pagina moet noindex zijn');

  // Koppen
  const h1s = $('h1');
  if (h1s.length !== 1) err(P, `verwacht precies één H1, gevonden ${h1s.length}`);
  let prev = 0;
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const lvl = Number(el.tagName[1]);
    if (prev && lvl > prev + 1) warn(P, `kopniveau springt van H${prev} naar H${lvl} ("${$(el).text().trim().slice(0, 40)}")`);
    prev = lvl;
    if (!$(el).text().trim()) err(P, `lege kop <${el.tagName}>`);
  });

  // Landmarks
  if ($('main').length !== 1) err(P, `verwacht precies één <main>, gevonden ${$('main').length}`);
  if (!$('body > header, header').length) err(P, '<header> ontbreekt');
  if (!$('footer').length) err(P, '<footer> ontbreekt');
  if (!$('nav').length) err(P, '<nav> ontbreekt');
  $('nav').each((_, el) => { if (!$(el).attr('aria-label') && !$(el).attr('aria-labelledby')) warn(P, '<nav> zonder aria-label'); });
  if (!$('a.skip-link, a[href="#main"]').length) warn(P, 'skip-link ontbreekt');

  // Afbeeldingen
  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') ?? '';
    if ($el.attr('alt') === undefined) err(P, `img zonder alt-attribuut: ${src}`);
    if (!$el.attr('width') || !$el.attr('height')) err(P, `img zonder width/height: ${src}`);
    if ($el.attr('loading') !== 'lazy' && $el.attr('fetchpriority') !== 'high' && $el.attr('loading') !== 'eager') warn(P, `img zonder loading=lazy en zonder fetchpriority=high: ${src}`);
  });
  if ($('img[fetchpriority="high"]').length > 1) warn(P, `${$('img[fetchpriority="high"]').length} afbeeldingen met fetchpriority=high (max 1 aanbevolen)`);

  // Links
  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = ($el.text().trim() || $el.attr('aria-label') || $el.find('img[alt]').attr('alt') || '').trim();
    if (!text) err(P, `link zonder tekst of aria-label: ${href}`);
    else if (GENERIC_ANCHORS.test(text)) warn(P, `generieke ankertekst "${text}" → ${href}`);
    const r = resolveInternal(href, urlPath);
    if (!r) return;
    if (r.invalid) { err(P, `ongeldige href: ${href}`); return; }
    if (r.path !== r.path.toLowerCase()) err(P, `interne link met hoofdletters: ${href}`);
    if (!r.path.endsWith('/') && !hasExt(r.path)) err(P, `interne link zonder trailing slash: ${href}`);
    if (!existsInDist(r.path)) err(P, `kapotte interne link: ${href}`);
    if (redirectSources.has(r.path)) err(P, `link naar redirect-bron ${r.path}; link direct naar het doel`);
    if (r.path !== urlPath) page.links.add(r.path);
    if (r.hash && r.path === urlPath && r.hash.length > 1 && !$(`[id="${r.hash.slice(1)}"]`).length) warn(P, `anker ${r.hash} bestaat niet op deze pagina`);
  });

  // JSON-LD
  const scripts = $('script[type="application/ld+json"]');
  if (!scripts.length && !page.is404) err(P, 'geen JSON-LD gevonden');
  scripts.each((_, el) => {
    let doc;
    try { doc = JSON.parse($(el).text()); } catch (e) { err(P, `ongeldige JSON-LD: ${e.message}`); return; }
    checkJsonLd(P, doc, page);
  });
}

// Dubbele titels/descriptions
for (const [t, ps] of titles) if (ps.length > 1) err(ps.join(', '), `dubbele title "${t}"`);
for (const [d, ps] of descriptions) if (ps.length > 1) err(ps.join(', '), `dubbele description "${d.slice(0, 60)}…"`);

function checkJsonLd(P, doc, page) {
  const nodes = Array.isArray(doc['@graph']) ? doc['@graph'] : [doc];
  if (!doc['@context']) err(P, 'JSON-LD zonder @context');
  // @id-definities: top-level nodes én geneste objecten met @id + andere properties.
  const ids = new Set();
  const defined = [];
  const collect = (v) => {
    if (Array.isArray(v)) return v.forEach(collect);
    if (v && typeof v === 'object') {
      const keys = Object.keys(v);
      if (v['@id'] && keys.length > 1) { defined.push(v['@id']); ids.add(v['@id']); }
      for (const k of keys) collect(v[k]);
    }
  };
  collect(nodes);
  if (new Set(defined).size !== defined.length) err(P, 'dubbele @id-definitie in @graph');
  const refs = [];
  const visit = (v, ctx) => {
    if (Array.isArray(v)) return v.forEach((x) => visit(x, ctx));
    if (v && typeof v === 'object') {
      const keys = Object.keys(v);
      if (keys.length === 1 && keys[0] === '@id') refs.push({ id: v['@id'], ctx });
      for (const k of keys) visit(v[k], `${ctx}.${k}`);
    }
  };
  for (const n of nodes) {
    const types = [].concat(n['@type'] ?? []);
    if (!types.length) err(P, `JSON-LD-node zonder @type (${n['@id'] ?? '?'})`);
    for (const t of types) {
      if (DEPRECATED_TYPES.has(t)) err(P, `JSON-LD-type ${t} levert bij Google geen rich result (meer) op; verwijder het`);
      if (t === 'AggregateRating' || t === 'Review') warn(P, `JSON-LD-type ${t}: alleen gebruiken met echte, zichtbare beoordelingen`);
      for (const req of REQUIRED[t] ?? []) if (n[req] === undefined || n[req] === '' ) err(P, `${t} mist verplichte/aanbevolen property "${req}"`);
    }
    for (const k of ['datePublished', 'dateModified']) {
      if (n[k] !== undefined && Number.isNaN(Date.parse(n[k]))) err(P, `${types[0]}.${k} is geen geldige datum: ${n[k]}`);
    }
    if (n.datePublished && n.dateModified && Date.parse(n.dateModified) < Date.parse(n.datePublished)) err(P, `${types[0]}: dateModified (${n.dateModified}) ligt vóór datePublished (${n.datePublished})`);
    if (types.includes('BreadcrumbList')) {
      const items = n.itemListElement ?? [];
      items.forEach((li, i) => {
        if (li.position !== i + 1) err(P, `BreadcrumbList: position ${li.position} op index ${i}`);
        if (!li.name) err(P, 'BreadcrumbList: ListItem zonder name');
        if (i < items.length - 1 && !li.item) err(P, 'BreadcrumbList: ListItem zonder item (behalve laatste)');
      });
      const bc = page.$('nav.breadcrumbs li').length;
      if (bc && bc !== items.length) err(P, `BreadcrumbList heeft ${items.length} items, HTML-breadcrumb ${bc}`);
    }
    if (types.some((t) => /Page$/.test(t)) && n.url && n.url !== page.canonical) err(P, `${types[0]}.url (${n.url}) ≠ canonical`);
    if ((types.includes('Article') || types.includes('BlogPosting')) && n.headline && n.headline.length > 110) err(P, 'Article.headline langer dan 110 tekens');
    visit(n, types[0] ?? 'node');
  }
  for (const r of refs) if (!ids.has(r.id)) err(P, `@id-verwijzing lost niet op binnen @graph: ${r.id} (${r.ctx})`);
}

/* ---------- Wezen en klikdiepte ---------- */
const inbound = new Map([...pages.keys()].map((p) => [p, 0]));
for (const page of pages.values()) for (const l of page.links) if (inbound.has(l)) inbound.set(l, inbound.get(l) + 1);
for (const page of pages.values()) {
  if (page.is404 || page.urlPath === '/') continue;
  if (!inbound.get(page.urlPath)) err(page.urlPath, 'wees: geen enkele interne link wijst naar deze pagina');
}
const depth = new Map([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const cur = queue.shift();
  for (const l of pages.get(cur)?.links ?? []) {
    if (!depth.has(l) && pages.has(l)) { depth.set(l, depth.get(cur) + 1); queue.push(l); }
  }
}
for (const page of pages.values()) {
  if (page.is404) continue;
  const d = depth.get(page.urlPath);
  if (d === undefined) err(page.urlPath, 'niet bereikbaar vanaf de homepage');
  else if (d > maxClickDepth) err(page.urlPath, `klikdiepte ${d} > ${maxClickDepth}`);
}

/* ---------- Sitemap ---------- */
const sitemapUrls = new Map();
const indexPath = path.join(DIST, 'sitemap-index.xml');
if (!existsSync(indexPath)) err('/sitemap-index.xml', 'sitemap-index.xml ontbreekt');
else {
  const idx = load(await readFile(indexPath, 'utf8'), { xml: true });
  const children = idx('sitemap > loc').map((_, el) => idx(el).text().trim()).get();
  if (!children.length) err('/sitemap-index.xml', 'sitemap-index zonder sitemaps');
  for (const loc of children) {
    const u = new URL(loc);
    if (u.host !== siteHost) err('/sitemap-index.xml', `sitemap op andere host: ${loc}`);
    const f = path.join(DIST, u.pathname);
    if (!existsSync(f)) { err('/sitemap-index.xml', `sitemap-bestand ontbreekt: ${u.pathname}`); continue; }
    const sm = load(await readFile(f, 'utf8'), { xml: true });
    sm('url').each((_, el) => {
      const l = sm(el).find('> loc').text().trim();
      const lm = sm(el).find('> lastmod').text().trim();
      sitemapUrls.set(l, { lastmod: lm, file: u.pathname });
    });
  }
  const now = Date.now() + 86400000;
  const lastmods = new Set();
  for (const [loc, { lastmod, file }] of sitemapUrls) {
    let u;
    try { u = new URL(loc); } catch { err(file, `ongeldige loc: ${loc}`); continue; }
    if (u.host !== siteHost) { err(file, `loc op andere host: ${loc}`); continue; }
    const page = pages.get(u.pathname);
    if (!page) { err(file, `sitemap-URL bestaat niet in dist: ${loc}`); continue; }
    if (page.noindex) err(file, `noindex-pagina in sitemap: ${loc}`);
    if (page.canonical !== loc) err(file, `sitemap-URL ${loc} ≠ canonical ${page.canonical}`);
    if (!lastmod) err(file, `geen lastmod voor ${loc}`);
    else if (Number.isNaN(Date.parse(lastmod))) err(file, `ongeldige lastmod "${lastmod}" voor ${loc}`);
    else if (Date.parse(lastmod) > now) err(file, `lastmod in de toekomst voor ${loc}`);
    lastmods.add(lastmod);
  }
  if (sitemapUrls.size > 3 && lastmods.size === 1) warn('/sitemap-pages.xml', 'alle lastmod-waarden zijn identiek; Google negeert onbetrouwbare lastmod');
  for (const page of pages.values()) {
    if (page.is404 || page.noindex) continue;
    if (page.canonical !== page.url) continue; // niet-canonieke pagina hoort niet in sitemap
    if (!sitemapUrls.has(page.url)) err(page.urlPath, 'indexeerbare pagina ontbreekt in sitemap');
  }
}

/* ---------- robots.txt, RSS, redirects ---------- */
const robotsPath = path.join(DIST, 'robots.txt');
if (!existsSync(robotsPath)) err('/robots.txt', 'robots.txt ontbreekt');
else {
  const txt = await readFile(robotsPath, 'utf8');
  if (!txt.includes(`Sitemap: ${site.url}/sitemap-index.xml`)) err('/robots.txt', 'Sitemap-regel ontbreekt of wijst niet naar sitemap-index.xml');
  if (/Disallow:\s*\/\s*$/m.test(txt)) err('/robots.txt', 'robots.txt blokkeert de hele site');
}
if (site.feeds.rss) {
  const rssPath = path.join(DIST, 'rss.xml');
  if (!existsSync(rssPath)) err('/rss.xml', 'rss.xml ontbreekt');
  else {
    const rss = load(await readFile(rssPath, 'utf8'), { xml: true });
    if (!rss('rss > channel > title').length) err('/rss.xml', 'RSS zonder channel/title');
    const items = rss('item');
    if (!items.length) warn('/rss.xml', 'RSS zonder items');
    items.each((_, el) => {
      const link = rss(el).find('link').text().trim();
      if (!link.startsWith(site.url)) err('/rss.xml', `item-link niet absoluut op eigen host: ${link}`);
      else if (!existsInDist(new URL(link).pathname)) err('/rss.xml', `item-link bestaat niet: ${link}`);
    });
  }
}
// Redirect-sync (vercel.json + public/_redirects) en doelen
try {
  const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
  const vSources = new Set((vercel.redirects ?? []).map((r) => r.source.replace(/\/?$/, '/')));
  for (const r of redirects) {
    if (!vSources.has(r.from)) err('vercel.json', `redirect ${r.from} ontbreekt in vercel.json; draai npm run redirects`);
    if (!existsInDist(r.to)) err('redirects.config.mjs', `redirect-doel bestaat niet: ${r.to}`);
    if (existsInDist(r.from)) err('redirects.config.mjs', `redirect-bron bestaat nog als pagina: ${r.from}`);
  }
  if ((vercel.redirects ?? []).length !== redirects.length) err('vercel.json', 'aantal redirects wijkt af van redirects.config.mjs; draai npm run redirects');
  const nf = path.join(DIST, '_redirects');
  if (redirects.length && !existsSync(nf)) err('_redirects', 'public/_redirects ontbreekt; draai npm run redirects');
} catch (e) { warn('vercel.json', `redirect-sync niet gecontroleerd: ${e.message}`); }

/* ---------- Optioneel: live 200-check van canonicals ---------- */
if (BASE_URL) {
  const base = BASE_URL.replace(/\/$/, '');
  const unique = new Set([...pages.values()].filter((p) => !p.is404).map((p) => new URL(p.canonical).pathname));
  console.log(`seo-check: live canonical-check op ${base} (${unique.size} URL's)`);
  for (const p of unique) {
    try {
      const res = await fetch(base + p, { method: 'HEAD', redirect: 'manual' });
      if (res.status !== 200) err(p, `canonical geeft HTTP ${res.status} op ${base}`);
    } catch (e) { err(p, `canonical niet bereikbaar: ${e.message}`); }
  }
}

/* ---------- Rapport ---------- */
const indexable = [...pages.values()].filter((p) => !p.is404 && !p.noindex).length;
const maxDepth = Math.max(...[...depth.values()]);
console.log(`\nseo-check: ${pages.size} HTML-pagina's (${indexable} indexeerbaar), sitemap ${sitemapUrls.size} URL's, max klikdiepte ${maxDepth}`);
const print = (list, label) => {
  if (!list.length) return;
  console.log(`\n${label} (${list.length}):`);
  for (const { page, msg } of list) console.log(`  ${page}  ${msg}`);
};
print(warnings, 'WAARSCHUWINGEN');
print(errors, 'FOUTEN');
if (errors.length || (STRICT && warnings.length)) { console.log('\nseo-check: GEFAALD'); process.exit(1); }
console.log('\nseo-check: OK');
