/**
 * JSON-LD builders. Elke pagina krijgt één @graph waarin alle nodes via @id aan
 * elkaar hangen: Organization ← WebSite ← WebPage ← (Article | CollectionPage | ProfilePage)
 * en WebPage → BreadcrumbList. Alleen types die Google (nov 2026) nog ondersteunt
 * of die als neutrale schema.org-context gelden: geen FAQPage, HowTo, SearchAction,
 * AggregateRating of Review.
 */
import { site } from '@config';
import { absoluteUrl } from './site';

export type JsonLdNode = Record<string, unknown> & { '@type': string | string[]; '@id'?: string };

export const ids = {
  organization: () => absoluteUrl('/#organization'),
  website: () => absoluteUrl('/#website'),
  logo: () => absoluteUrl('/#logo'),
  webpage: (url: string) => `${url}#webpage`,
  breadcrumb: (url: string) => `${url}#breadcrumb`,
  article: (url: string) => `${url}#article`,
  itemlist: (url: string) => `${url}#itemlist`,
  primaryImage: (url: string) => `${url}#primaryimage`,
  person: (authorUrl: string) => `${authorUrl}#person`,
};

export function organizationNode(): JsonLdNode {
  const o = site.organization;
  const node: JsonLdNode = {
    '@type': 'Organization',
    '@id': ids.organization(),
    name: o.name,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      '@id': ids.logo(),
      url: absoluteUrl(o.logo.src),
      contentUrl: absoluteUrl(o.logo.src),
      width: o.logo.width,
      height: o.logo.height,
      caption: o.name,
    },
    image: { '@id': ids.logo() },
  };
  if (o.legalName) node.legalName = o.legalName;
  if (o.email) node.email = o.email;
  if (o.telephone) node.telephone = o.telephone;
  if (o.foundingDate) node.foundingDate = o.foundingDate;
  if (o.address) node.address = { '@type': 'PostalAddress', ...o.address };
  if (o.sameAs.length) node.sameAs = o.sameAs.map((s) => s.url);
  return node;
}

export function websiteNode(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': ids.website(),
    url: absoluteUrl('/'),
    name: site.name,
    description: site.description,
    inLanguage: site.lang,
    publisher: { '@id': ids.organization() },
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL; laatste item mag zonder url (huidige pagina). */
  url?: string;
}

export function breadcrumbNode(pageUrl: string, items: BreadcrumbItem[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(pageUrl),
    itemListElement: items.map((it, i) => {
      const li: Record<string, unknown> = { '@type': 'ListItem', position: i + 1, name: it.name };
      if (it.url) li.item = it.url;
      return li;
    }),
  };
}

export interface ImageInfo {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

export function imageNode(pageUrl: string, img: ImageInfo): JsonLdNode {
  return {
    '@type': 'ImageObject',
    '@id': ids.primaryImage(pageUrl),
    url: img.url,
    contentUrl: img.url,
    width: img.width,
    height: img.height,
    ...(img.alt ? { caption: img.alt } : {}),
  };
}

export interface WebPageOpts {
  url: string;
  title: string;
  description: string;
  type?: 'WebPage' | 'CollectionPage' | 'ProfilePage' | 'AboutPage' | 'ContactPage' | 'ItemPage';
  datePublished?: Date;
  dateModified?: Date;
  image?: ImageInfo;
  hasBreadcrumb?: boolean;
  extra?: Record<string, unknown>;
}

export function webPageNode(o: WebPageOpts): JsonLdNode {
  const node: JsonLdNode = {
    '@type': o.type ?? 'WebPage',
    '@id': ids.webpage(o.url),
    url: o.url,
    name: o.title,
    description: o.description,
    inLanguage: site.lang,
    isPartOf: { '@id': ids.website() },
    publisher: { '@id': ids.organization() },
  };
  if (o.datePublished) node.datePublished = o.datePublished.toISOString();
  if (o.dateModified) node.dateModified = o.dateModified.toISOString();
  if (o.image) {
    node.primaryImageOfPage = { '@id': ids.primaryImage(o.url) };
    node.image = { '@id': ids.primaryImage(o.url) };
    node.thumbnailUrl = o.image.url;
  }
  if (o.hasBreadcrumb !== false) node.breadcrumb = { '@id': ids.breadcrumb(o.url) };
  return { ...node, ...(o.extra ?? {}) };
}

export interface PersonOpts {
  url: string;
  name: string;
  description?: string;
  jobTitle?: string;
  image?: ImageInfo;
  sameAs?: string[];
}

export function personNode(p: PersonOpts): JsonLdNode {
  const node: JsonLdNode = {
    '@type': 'Person',
    '@id': ids.person(p.url),
    name: p.name,
    url: p.url,
    worksFor: { '@id': ids.organization() },
  };
  if (p.description) node.description = p.description;
  if (p.jobTitle) node.jobTitle = p.jobTitle;
  if (p.image) node.image = { '@type': 'ImageObject', url: p.image.url, width: p.image.width, height: p.image.height };
  if (p.sameAs?.length) node.sameAs = p.sameAs;
  return node;
}

export interface ArticleOpts {
  url: string;
  headline: string;
  description: string;
  datePublished: Date;
  dateModified: Date;
  authorUrl: string;
  image?: ImageInfo;
  section?: string;
  wordCount?: number;
  body?: string;
}

export function articleNode(a: ArticleOpts): JsonLdNode {
  const node: JsonLdNode = {
    '@type': 'Article',
    '@id': ids.article(a.url),
    headline: a.headline.slice(0, 110),
    description: a.description,
    datePublished: a.datePublished.toISOString(),
    dateModified: a.dateModified.toISOString(),
    author: { '@id': ids.person(a.authorUrl) },
    publisher: { '@id': ids.organization() },
    isPartOf: { '@id': ids.webpage(a.url) },
    mainEntityOfPage: { '@id': ids.webpage(a.url) },
    inLanguage: site.lang,
    url: a.url,
  };
  if (a.image) node.image = { '@id': ids.primaryImage(a.url) };
  if (a.section) node.articleSection = a.section;
  if (a.wordCount) node.wordCount = a.wordCount;
  return node;
}

export interface ItemListEntry {
  url: string;
  name: string;
}

export function itemListNode(pageUrl: string, items: ItemListEntry[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    '@id': ids.itemlist(pageUrl),
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: it.url, name: it.name })),
  };
}

/** Bouwt het complete @graph-document; verwijdert undefined-waarden. */
export function graph(nodes: (JsonLdNode | undefined)[]): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }),
  );
}

/** Veilig inline te zetten: voorkomt dat "</script>" of "<!--" de HTML breekt. */
export function serializeJsonLd(doc: Record<string, unknown>): string {
  return JSON.stringify(doc).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
