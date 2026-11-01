/**
 * Centrale site-configuratie. Dit is het ENIGE bestand dat je hoeft in te vullen
 * om het template op een nieuwe site te zetten. Alle pagina's, JSON-LD, sitemap,
 * feeds, robots.txt en de SEO-checks lezen hieruit.
 *
 * Content staat in src/content/** (Markdown met frontmatter).
 */

export type SocialProfile = { label: string; url: string };

export interface SiteConfig {
  /** Zichtbare sitenaam (verschijnt in titels, JSON-LD en de header). */
  name: string;
  /** Korte slogan; wordt gebruikt in de title van de homepage. */
  tagline: string;
  /** Productie-URL zonder trailing slash. Basis voor alle absolute URL's en canonicals. */
  url: string;
  /** BCP-47 taalcode voor <html lang>, hreflang en feeds. */
  lang: string;
  /** Locale voor Open Graph (bv. nl_NL, en_GB). */
  locale: string;
  /** Scheidingsteken tussen paginatitel en sitenaam in <title>. */
  titleSeparator: string;
  /** Standaardbeschrijving voor pagina's zonder eigen description (alleen home gebruikt dit). */
  description: string;
  /** Standaard social-afbeelding (1200×630) in /public. */
  defaultImage: { src: string; width: number; height: number; alt: string };
  /** Organisatie achter de site: gebruikt voor Organization-schema en publisher. */
  organization: {
    name: string;
    legalName?: string;
    /** Logo in /public; Google wil min. 112×112, liefst vierkant. */
    logo: { src: string; width: number; height: number };
    email?: string;
    telephone?: string;
    foundingDate?: string;
    address?: {
      streetAddress?: string;
      postalCode?: string;
      addressLocality?: string;
      addressRegion?: string;
      addressCountry: string;
    };
    /** Social-profielen; worden sameAs in JSON-LD en links in de footer. */
    sameAs: SocialProfile[];
  };
  /** Twitter/X-handle voor twitter:site (optioneel, met @). */
  twitterSite?: string;
  /** Padsegmenten die niet uit content komen. Lowercase, koppeltekens. */
  routes: {
    authors: string;
    sitemap: string;
  };
  /** UI-teksten (de enige plek met taalafhankelijke strings). */
  strings: Record<
    | 'home' | 'skipToContent' | 'mainNav' | 'footerNav' | 'breadcrumbs' | 'readMore'
    | 'related' | 'moreIn' | 'byAuthor' | 'published' | 'updated' | 'articlesBy'
    | 'allTopics' | 'latest' | 'htmlSitemap' | 'htmlSitemapIntro' | 'authors' | 'pages'
    | 'notFoundTitle' | 'notFoundText' | 'backHome' | 'rssFeed' | 'tableOfContents'
    | 'articlesInHub' | 'noArticles' | 'readingTime' | 'minutes' | 'legal' | 'contactIntro',
    string
  >;
  /** Lengtegrenzen voor de build-time SEO-check (gerenderde <title> en meta description). */
  seo: {
    titleMin: number;
    titleMax: number;
    descriptionMin: number;
    descriptionMax: number;
    /** Maximale klikdiepte vanaf de homepage. */
    maxClickDepth: number;
    /** Aantal gerelateerde artikelen onder een artikel. */
    relatedCount: number;
    /** Aantal recente artikelen op de homepage. */
    homeLatestCount: number;
  };
  /** Feeds en extra crawl-signalen. */
  feeds: { rss: boolean; rssLimit: number };
  llmsTxt: boolean;
  indexNow: { enabled: boolean };
  /** Optioneel: andere taalversies van deze hele site (site-breed hreflang). */
  alternates?: { hreflang: string; url: string }[];
  /** Kleuren voor theme-color en manifest. */
  theme: { light: string; dark: string; background: string };
}

export const site: SiteConfig = {
  name: 'Voorbeeldsite',
  tagline: 'Heldere uitleg over ieder onderwerp',
  url: 'https://www.voorbeeldsite.nl',
  lang: 'nl',
  locale: 'nl_NL',
  titleSeparator: ' | ',
  description:
    'Voorbeeldsite legt complexe onderwerpen helder uit in praktische artikelen, geschreven door vakmensen en regelmatig bijgewerkt.',
  defaultImage: { src: '/og-default.png', width: 1200, height: 630, alt: 'Voorbeeldsite' },
  organization: {
    name: 'Voorbeeldsite',
    legalName: 'Voorbeeldsite B.V.',
    logo: { src: '/logo.png', width: 512, height: 512 },
    email: 'info@voorbeeldsite.nl',
    telephone: '+31 10 000 0000',
    foundingDate: '2020',
    address: {
      streetAddress: 'Voorbeeldstraat 1',
      postalCode: '1234 AB',
      addressLocality: 'Amsterdam',
      addressCountry: 'NL',
    },
    sameAs: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/voorbeeldsite' },
      { label: 'X', url: 'https://x.com/voorbeeldsite' },
    ],
  },
  twitterSite: '@voorbeeldsite',
  routes: {
    authors: 'auteurs',
    sitemap: 'sitemap',
  },
  strings: {
    home: 'Home',
    skipToContent: 'Direct naar de inhoud',
    mainNav: 'Hoofdnavigatie',
    footerNav: 'Voetnavigatie',
    breadcrumbs: 'Kruimelpad',
    readMore: 'Lees het artikel',
    related: 'Gerelateerde artikelen',
    moreIn: 'Meer over',
    byAuthor: 'Door',
    published: 'Gepubliceerd op',
    updated: 'Bijgewerkt op',
    articlesBy: 'Artikelen van',
    allTopics: 'Alle onderwerpen',
    latest: 'Nieuwste artikelen',
    htmlSitemap: 'Sitemap',
    htmlSitemapIntro: 'Een overzicht van alle pagina\'s op deze site, geordend per onderwerp.',
    authors: 'Auteurs',
    pages: 'Overige pagina\'s',
    notFoundTitle: 'Pagina niet gevonden',
    notFoundText: 'De pagina die je zocht bestaat niet (meer). Gebruik de navigatie of ga terug naar de homepage.',
    backHome: 'Terug naar de homepage',
    rssFeed: 'RSS-feed',
    tableOfContents: 'Inhoud',
    articlesInHub: 'Artikelen in dit onderwerp',
    noArticles: 'Er zijn nog geen artikelen in dit onderwerp.',
    readingTime: 'Leestijd',
    minutes: 'min',
    legal: 'Juridisch',
    contactIntro: 'Neem contact op via onderstaande gegevens.',
  },
  seo: {
    titleMin: 50,
    titleMax: 60,
    descriptionMin: 120,
    descriptionMax: 160,
    maxClickDepth: 3,
    relatedCount: 3,
    homeLatestCount: 6,
  },
  feeds: { rss: true, rssLimit: 20 },
  llmsTxt: true,
  indexNow: { enabled: true },
  alternates: undefined,
  theme: { light: '#1d4ed8', dark: '#60a5fa', background: '#ffffff' },
};

export default site;
