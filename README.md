# SEO-template (Astro 7, static, 0 KB client-JS)

Content-agnostisch website-template waarvan de technische SEO-structuur per build wordt gecontroleerd. Gebouwd op basis van een analyse van zeven snel geïndexeerde referentiesites (zie `ANALYSE.md`); alle keuzes staan in `DECISIONS.md`; de vergelijking met de referentiesites in `VERGELIJKING.md`; de controlelijst in `SEO-CHECKLIST.md`.

Wat je krijgt: home, hubs (pillar-pagina's), artikelen, auteurspagina's, over/contact/juridische pagina's, HTML-sitemap en 404; één `<head>`-component; één gekoppelde JSON-LD-`@graph` per pagina; sitemap-index met echte lastmod; robots.txt; RSS; IndexNow-ping; optionele llms.txt; automatische breadcrumbs, hub ↔ detail-links en gerelateerde artikelen; AVIF/WebP-beelden; self-hosted gesubset font met fallback-metrics; Speculation Rules; dark mode; kant-en-klare configs voor Vercel, Netlify en Cloudflare Pages; een SEO-check en Lighthouse CI die de build laten falen.

## In 10 minuten een nieuwe site

Vereist: Node 22 of nieuwer.

```bash
npm install
```

**1. Config invullen (3 min).** Open `site.config.ts` en vul in: `name`, `tagline`, `url` (zonder trailing slash), `lang`/`locale`, `description`, `organization` (naam, logo, e-mail, adres, social-profielen), eventueel `twitterSite`, `routes` (padsegmenten voor auteurs en sitemap) en `theme`. De UI-teksten onder `strings` zijn Nederlands; vertaal ze als de site een andere taal heeft.

**2. Content toevoegen (5 min).** Markdown met frontmatter in `src/content/`:

```
src/content/
  hubs/        één bestand per onderwerp (pillar): title, navLabel, description, order, datePublished, dateModified, image, imageAlt
  articles/    title, description, category (hub-id), author (auteur-id), datePublished, dateModified, image, imageAlt, [slug], [canonical], [noindex], [draft]
  authors/     name, title, description, jobTitle, sameAs[], image, dateModified
  pages/       title, navLabel, slug, kind (about|contact|legal|generic), order, description, datePublished, dateModified
```

De bestandsnaam is standaard de slug (`mijn-artikel.md` → `/hub/mijn-artikel/`). Beelden zet je in `src/assets/images/` en verwijs je relatief (`../../assets/images/foto.jpg`); Astro maakt er AVIF/WebP met `srcset` van. Vervang de placeholder-bestanden; de titel- en descriptiegrenzen staan in `site.config.ts → seo`.

Vervang ook `public/logo.png`, `public/og-default.png`, de favicons en iconen (of genereer neutrale placeholders met `npm run placeholders`).

**3. Bouwen en controleren (1 min).**

```bash
npm run build        # astro build + SEO-check (faalt bij fouten)
npm run preview      # lokaal bekijken op http://localhost:4321/
npm run lighthouse   # Lighthouse CI tegen dist/ (faalt onder 95 of boven het CWV-budget)
```

**4. Deployen (1 min).**

- **Vercel**: importeer de repo; `vercel.json` regelt build, output, trailing slash, headers en redirects. Zet `INDEXNOW_KEY` als environment variable.
- **Netlify**: importeer de repo; `netlify.toml` regelt build en publish; headers/redirects komen uit `public/_headers` en `public/_redirects`.
- **Cloudflare Pages**: build `npm run build`, output `dist` (of `wrangler pages deploy dist`); `_headers`/`_redirects` werken hetzelfde.

Daarna: dien `https://jouwdomein/sitemap-index.xml` in bij Google Search Console en Bing Webmaster Tools.

## Scripts

| Script | Doel |
|---|---|
| `npm run dev` | Dev-server met hot reload |
| `npm run build` | `prebuild` (redirects genereren) → `astro build` → `scripts/seo-check.mjs` |
| `npm run build:only` | Alleen `astro build` |
| `npm run seo:check` / `seo:check:strict` | SEO-check los draaien; `--strict` laat ook waarschuwingen falen |
| `npm run lighthouse` | Lighthouse CI (`lighthouserc.cjs`) |
| `npm run verify` | build + lighthouse |
| `npm run check` | Astro/TypeScript-typecheck |
| `npm run redirects` | `redirects.config.mjs` → `vercel.json` + `public/_redirects` |
| `npm run indexnow` / `indexnow:key` | IndexNow-ping van gewijzigde URL's / nieuwe sleutel genereren |
| `npm run font:subset` | Inter opnieuw subsetten uit `@fontsource-variable/inter` |
| `npm run placeholders` | Placeholder-beelden, logo, iconen en favicon genereren |

Omgevingsvariabelen (zie `.env.example`): `INDEXNOW_KEY` (8–128 hex-tekens; `npm run indexnow:key`), optioneel `SEO_CHECK_BASE_URL` voor een live 200-controle van alle canonicals.

## Structuur

```
site.config.ts              alle sitegegevens (naam, domein, taal, organisatie, routes, strings, SEO-grenzen)
redirects.config.mjs        301-map (oud → nieuw)
astro.config.mjs            static output, trailing slash, inline CSS, image-defaults, Fonts API
src/content.config.ts       collecties + Zod-schema's (slugregels, verplichte velden)
src/content/                hubs/ articles/ authors/ pages/
src/lib/site.ts             routetabel, URL-helpers, content-cache, gerelateerde artikelen
src/lib/schema.ts           JSON-LD @graph-builders (Organization, WebSite, WebPage, BreadcrumbList, Article, Person, ItemList)
src/lib/images.ts           og:image en Article-beelden (16:9, 4:3, 1:1)
src/layouts/Base.astro      <head> (Seo, Font, JsonLd, SpeculationRules), skip-link, header, main, footer
src/components/             Seo, JsonLd, Breadcrumbs, Header, Footer, ArticleCard, HubCard, ArticleGrid, AuthorBox, views/*
src/pages/                  index, [...path] (alle content-routes), 404, robots.txt, sitemap-index.xml, sitemap-pages.xml, rss.xml, llms.txt, manifest.webmanifest, [key].txt
src/styles/                 tokens.css (design tokens, dark mode), base.css
scripts/                    seo-check, gen-redirects, indexnow, indexnow-key, font-subset, gen-placeholders
lighthouserc.cjs            Lighthouse-budgetten
vercel.json · netlify.toml · wrangler.toml · public/_headers · public/_redirects
.github/workflows/          ci.yml (typecheck, build + check, Lighthouse), indexnow.yml (ping na deploy)
docs/analyse/               de zeven volledige analyserapporten
```

## Veelgestelde vragen

**Een pagina moet van URL veranderen.** Pas de slug aan, voeg `{ from: '/oud/pad/', to: '/nieuw/pad/' }` toe aan `redirects.config.mjs` en bouw. De check faalt als iets nog naar het oude pad linkt.

**Ik wil een extra paginatype.** Voeg een collectie toe in `src/content.config.ts`, een `kind` in `src/lib/site.ts → buildRoutes()` en een view in `src/components/views/`. De sitemap, feed, HTML-sitemap en checks volgen de routetabel automatisch.

**Mag ik wél een LocalBusiness of Product toevoegen?** Ja, als er een echt adres respectievelijk echte `offers` zijn. Voeg een node toe in `src/lib/schema.ts` en koppel hem via `@id`. FAQPage en HowTo laat de check bewust falen (Google toont ze niet meer).

**De build faalt op titel- of descriptielengte.** Pas de tekst aan, of verruim de grenzen in `site.config.ts → seo`. De grenzen gelden voor de gerenderde `<title>` (inclusief ` | sitenaam`).

**Meertalig?** Vul `site.alternates` (andere taalversies van dezelfde site) of per pagina `alternates` in de frontmatter; hreflang inclusief `x-default` en de `xhtml:link`-extensie in de sitemap volgen automatisch.
