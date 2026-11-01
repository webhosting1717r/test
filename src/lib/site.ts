/**
 * Routetabel en URL-helpers. Dit is de ENIGE plek die paden bepaalt; pagina's,
 * sitemap, feeds, breadcrumbs, llms.txt en interne links gebruiken allemaal deze functies.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '@config';

export type Hub = CollectionEntry<'hubs'>;
export type Article = CollectionEntry<'articles'>;
export type Author = CollectionEntry<'authors'>;
export type Page = CollectionEntry<'pages'>;

export type RouteKind = 'home' | 'hub' | 'article' | 'author' | 'page' | 'sitemap';

export interface Route {
  kind: RouteKind;
  /** Pad met leading én trailing slash, bv. /onderwerp/artikel/ */
  path: string;
  /** Absolute canonical URL. */
  url: string;
  title: string;
  description: string;
  lastmod: Date;
  datePublished?: Date;
  /** false als de pagina noindex is of een afwijkende canonical heeft. */
  indexable: boolean;
  canonical: string;
  hub?: Hub;
  article?: Article;
  author?: Author;
  page?: Page;
}

/* ---------- Basis-helpers ---------- */

export function slugOf(entry: { id: string; data: { slug?: string } }): string {
  return entry.data.slug ?? entry.id;
}

/** Normaliseert naar /pad/ (lowercase, één trailing slash). */
export function normalizePath(p: string): string {
  let out = p.trim().toLowerCase();
  if (!out.startsWith('/')) out = '/' + out;
  if (!out.endsWith('/')) out += '/';
  return out.replace(/\/{2,}/g, '/');
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url + '/').toString();
}

export const hubPath = (hub: Hub) => normalizePath(`/${slugOf(hub)}/`);
export const articlePath = (article: Article, hub: Hub) => normalizePath(`/${slugOf(hub)}/${slugOf(article)}/`);
export const authorPath = (author: Author) => normalizePath(`/${site.routes.authors}/${slugOf(author)}/`);
export const pagePath = (page: Page) => normalizePath(`/${slugOf(page)}/`);
export const sitemapPath = () => normalizePath(`/${site.routes.sitemap}/`);

export function pageTitle(title: string): string {
  return `${title}${site.titleSeparator}${site.name}`;
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(site.lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

export function isoDate(d: Date): string {
  return d.toISOString();
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').replace(/[#>*_`\[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/* ---------- Content laden (één keer per build, gecached) ---------- */

export interface SiteContent {
  hubs: Hub[];
  articles: Article[];
  authors: Author[];
  pages: Page[];
  hubById: Map<string, Hub>;
  authorById: Map<string, Author>;
  articlesByHub: Map<string, Article[]>;
  articlesByAuthor: Map<string, Article[]>;
}

let cache: Promise<SiteContent> | undefined;

export function loadContent(): Promise<SiteContent> {
  cache ??= (async () => {
    const [hubsRaw, articlesRaw, authors, pagesRaw] = await Promise.all([
      getCollection('hubs'),
      getCollection('articles', (a) => !a.data.draft),
      getCollection('authors'),
      getCollection('pages'),
    ]);
    const hubs = [...hubsRaw].sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
    const pages = [...pagesRaw].sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
    const articles = [...articlesRaw].sort((a, b) => b.data.datePublished.getTime() - a.data.datePublished.getTime());

    const hubById = new Map(hubs.map((h) => [h.id, h]));
    const authorById = new Map(authors.map((a) => [a.id, a]));
    const articlesByHub = new Map<string, Article[]>();
    const articlesByAuthor = new Map<string, Article[]>();
    for (const a of articles) {
      if (!hubById.has(a.data.category.id)) throw new Error(`Artikel "${a.id}" verwijst naar onbekende hub "${a.data.category.id}"`);
      if (!authorById.has(a.data.author.id)) throw new Error(`Artikel "${a.id}" verwijst naar onbekende auteur "${a.data.author.id}"`);
      articlesByHub.set(a.data.category.id, [...(articlesByHub.get(a.data.category.id) ?? []), a]);
      articlesByAuthor.set(a.data.author.id, [...(articlesByAuthor.get(a.data.author.id) ?? []), a]);
    }

    // Botsingen tussen top-level segmenten voorkomen (hub, pagina, auteurs-prefix, sitemap).
    const seen = new Map<string, string>();
    const claim = (seg: string, owner: string) => {
      const prev = seen.get(seg);
      if (prev) throw new Error(`URL-botsing: /${seg}/ wordt gebruikt door ${prev} én ${owner}`);
      seen.set(seg, owner);
    };
    claim(site.routes.authors, 'routes.authors');
    claim(site.routes.sitemap, 'routes.sitemap');
    for (const h of hubs) claim(slugOf(h), `hub "${h.id}"`);
    for (const p of pages) claim(slugOf(p), `pagina "${p.id}"`);
    for (const h of hubs) {
      const slugs = new Set<string>();
      for (const a of articlesByHub.get(h.id) ?? []) {
        const s = slugOf(a);
        if (slugs.has(s)) throw new Error(`Dubbele artikel-slug "${s}" binnen hub "${h.id}"`);
        slugs.add(s);
      }
    }

    return { hubs, articles, authors, pages, hubById, authorById, articlesByHub, articlesByAuthor };
  })();
  return cache;
}

/* ---------- Routetabel ---------- */

const maxDate = (dates: Date[], fallback: Date) =>
  dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : fallback;

export async function buildRoutes(): Promise<Route[]> {
  const c = await loadContent();
  const routes: Route[] = [];
  const mk = (r: Omit<Route, 'url' | 'canonical' | 'indexable'> & { noindex?: boolean; canonicalOverride?: string }): Route => {
    const url = absoluteUrl(r.path);
    const canonical = r.canonicalOverride ?? url;
    const { noindex, canonicalOverride, ...rest } = r;
    return { ...rest, url, canonical, indexable: !noindex && canonical === url };
  };

  const allMods = [
    ...c.articles.map((a) => a.data.dateModified),
    ...c.hubs.map((h) => h.data.dateModified),
    ...c.pages.map((p) => p.data.dateModified),
    ...c.authors.map((a) => a.data.dateModified),
  ];
  const siteLastmod = maxDate(allMods, new Date(0));

  routes.push(mk({ kind: 'home', path: '/', title: `${site.name}: ${site.tagline}`, description: site.description, lastmod: siteLastmod }));

  for (const hub of c.hubs) {
    const items = c.articlesByHub.get(hub.id) ?? [];
    routes.push(
      mk({
        kind: 'hub',
        path: hubPath(hub),
        title: pageTitle(hub.data.title),
        description: hub.data.description,
        datePublished: hub.data.datePublished,
        lastmod: maxDate([hub.data.dateModified, ...items.map((a) => a.data.dateModified)], hub.data.dateModified),
        noindex: hub.data.noindex,
        canonicalOverride: hub.data.canonical,
        hub,
      }),
    );
    for (const article of items) {
      routes.push(
        mk({
          kind: 'article',
          path: articlePath(article, hub),
          title: pageTitle(article.data.title),
          description: article.data.description,
          datePublished: article.data.datePublished,
          lastmod: article.data.dateModified,
          noindex: article.data.noindex,
          canonicalOverride: article.data.canonical,
          hub,
          article,
        }),
      );
    }
  }

  for (const author of c.authors) {
    const items = c.articlesByAuthor.get(author.id) ?? [];
    routes.push(
      mk({
        kind: 'author',
        path: authorPath(author),
        title: pageTitle(author.data.title),
        description: author.data.description,
        lastmod: maxDate([author.data.dateModified, ...items.map((a) => a.data.dateModified)], author.data.dateModified),
        noindex: author.data.noindex,
        canonicalOverride: author.data.canonical,
        author,
      }),
    );
  }

  for (const page of c.pages) {
    routes.push(
      mk({
        kind: 'page',
        path: pagePath(page),
        title: pageTitle(page.data.title),
        description: page.data.description,
        datePublished: page.data.datePublished,
        lastmod: page.data.dateModified,
        noindex: page.data.noindex,
        canonicalOverride: page.data.canonical,
        page,
      }),
    );
  }

  routes.push(
    mk({
      kind: 'sitemap',
      path: sitemapPath(),
      title: pageTitle(`${site.strings.htmlSitemap}: ${site.strings.allTopics.toLowerCase()} en pagina's`),
      description: `${site.strings.htmlSitemapIntro} ${site.name} telt ${c.hubs.length} onderwerpen, ${c.articles.length} artikelen en ${c.authors.length} auteurs.`,
      lastmod: siteLastmod,
    }),
  );

  return routes;
}

/** Alleen pagina's die in de XML-sitemap, feeds en llms.txt horen. */
export async function indexableRoutes(): Promise<Route[]> {
  return (await buildRoutes()).filter((r) => r.indexable);
}

/* ---------- Interne-linkhelpers ---------- */

/** Gerelateerde artikelen: zelfde hub eerst, aangevuld met recente artikelen uit andere hubs. */
export function relatedArticles(c: SiteContent, article: Article, count = site.seo.relatedCount): Article[] {
  const same = (c.articlesByHub.get(article.data.category.id) ?? []).filter((a) => a.id !== article.id);
  const others = c.articles.filter((a) => a.data.category.id !== article.data.category.id);
  return [...same, ...others].slice(0, count);
}
