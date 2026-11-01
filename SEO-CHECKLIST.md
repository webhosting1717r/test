# SEO-CHECKLIST.md

Twee lijsten: (A) wat het template automatisch garandeert of controleert, met de plek waar dat gebeurt, en (B) wat jij bij elke nieuwe site of elk nieuw artikel zelf nakijkt. Onderaan (C) de analysechecklist waarmee de zeven referentie-repos zijn beoordeeld.

Legenda: ✅ automatisch afgedwongen (build faalt) · ⚠️ automatisch gewaarschuwd · 🧑 handmatig

## A. Technische basis

| Punt | Status | Waar |
|---|---|---|
| Volledige HTML server-side, 0 KB client-JS | ✅ | Astro static; geen `client:`-directives; Lighthouse TBT-budget |
| Eén `<title>`, één description, één canonical, één robots-meta | ✅ | `Seo.astro`, `seo-check` |
| Title uniek en 50–60 tekens (configureerbaar) | ✅ | `site.config.ts → seo`, `seo-check` |
| Description uniek en 120–160 tekens (configureerbaar) | ✅ | idem |
| Canonical absoluut, self-referencing, zelfde host, doel bestaat (200) | ✅ | `src/lib/site.ts`, `seo-check` (optioneel live via `SEO_CHECK_BASE_URL`) |
| `og:url` = canonical; sitemap-`loc` = canonical | ✅ | `seo-check` |
| Robots: `index, follow, max-image-preview:large, max-snippet:-1` of `noindex, follow` | ✅ | `Seo.astro` |
| `<html lang>` = `site.lang` | ✅ | `Base.astro`, `seo-check` |
| Open Graph + Twitter compleet, pagina-specifiek beeld 1200×630 | ✅ | `Seo.astro`, `lib/images.ts` |
| Hreflang alleen als er alternates zijn, dan incl. `x-default` | ✅ | `Seo.astro` |
| Favicon (ico + svg), apple-touch-icon, manifest, theme-color (light/dark) | ✅ | `Seo.astro`, `manifest.webmanifest.ts` |

## B. URL's en links

| Punt | Status | Waar |
|---|---|---|
| Slugs lowercase, koppeltekens, geen datums/ID's | ✅ | Zod-regex in `content.config.ts` |
| Trailing slash overal; links zonder slash of met hoofdletters falen | ✅ | `astro.config.mjs`, `seo-check` |
| URL-botsingen tussen hubs/pagina's/vaste segmenten | ✅ | `loadContent()` gooit een fout |
| Redirect-map gesynchroniseerd (vercel.json, `_redirects`), bronnen bestaan niet meer als pagina, niemand linkt naar een bron | ✅ | `redirects.config.mjs`, `gen-redirects.mjs`, `seo-check` |
| Geen kapotte interne links | ✅ | `seo-check` |
| Geen wezen (elke pagina ≥ 1 inkomende link) | ✅ | `seo-check` |
| Klikdiepte ≤ 3 vanaf de home | ✅ | `seo-check` (BFS) |
| Breadcrumbs HTML = JSON-LD | ✅ | `seo-check` |
| Hub → alle artikelen, artikel → hub, gerelateerd, auteur ↔ artikelen, footer, HTML-sitemap | ✅ | views in `src/components/views/` |
| Generieke ankerteksten ("lees meer", "hier") | ⚠️ | `seo-check` |
| Links zonder tekst of aria-label | ✅ | `seo-check` |

## C. Structured data

| Punt | Status | Waar |
|---|---|---|
| Eén `@graph` per pagina, alle `@id`-verwijzingen lossen op | ✅ | `lib/schema.ts`, `seo-check` |
| Organization + WebSite op elke pagina; WebPage/CollectionPage/ProfilePage/AboutPage/ContactPage per type | ✅ | views |
| Article: headline ≤ 110, image 16:9/4:3/1:1, datePublished ≤ dateModified, author = Person met url, publisher | ✅ | `ArticleView.astro`, `seo-check` |
| Geen FAQPage, HowTo, SearchAction (niet meer getoond door Google) | ✅ | `seo-check` faalt erop |
| Review/AggregateRating alleen met echte, zichtbare beoordelingen | ⚠️ | `seo-check` waarschuwt |
| JSON-LD veilig geserialiseerd (`<`/`>`/`&` escaped) | ✅ | `serializeJsonLd()` |
| Valideer na deploy in Google's Rich Results Test en Schema.org-validator | 🧑 | – |

## D. Crawl & indexatie

| Punt | Status | Waar |
|---|---|---|
| `sitemap-index.xml` → `sitemap-pages.xml`, alleen indexeerbare canonieke URL's | ✅ | endpoints + `seo-check` |
| `lastmod` = echte `dateModified` (hubs: maximum van kinderen), geen priority/changefreq | ✅ | `src/lib/site.ts` |
| Alle identieke lastmods | ⚠️ | `seo-check` |
| robots.txt met Sitemap-regel, geen site-brede Disallow | ✅ | `robots.txt.ts`, `seo-check` |
| RSS geldig, links absoluut en bestaand | ✅ | `rss.xml.ts`, `seo-check` |
| IndexNow-sleutelbestand gebouwd uit `INDEXNOW_KEY`; ping na deploy | ✅ | `[key].txt.ts`, `scripts/indexnow.mjs`, workflow |
| llms.txt (optioneel) | ✅ | `llms.txt.ts` |
| 404 noindex en buiten de sitemap | ✅ | `404.astro`, `seo-check` |
| Sitemap indienen in Google Search Console en Bing Webmaster Tools | 🧑 | – |
| Domeinverificatie (DNS of HTML-bestand in `public/`) | 🧑 | – |

## E. Semantiek & toegankelijkheid

| Punt | Status | Waar |
|---|---|---|
| Precies één H1 per pagina | ✅ | `seo-check` |
| Geen overgeslagen kopniveaus | ⚠️ | `seo-check` |
| header/nav(aria-label)/main/article/aside/footer, skip-link | ✅ | `Base.astro`, views, `seo-check` |
| Alle `img` met alt en width/height | ✅ | `seo-check` |
| Lazy loading behalve LCP-beeld; max 1 `fetchpriority="high"` | ⚠️ | `seo-check` |
| Focus zichtbaar (`:focus-visible`), reduced motion (incl. smooth scroll), contrast ≥ 4,5:1 in light én dark | ✅ (Lighthouse a11y ≥ 95) | `base.css`, `tokens.css`, `lighthouserc.cjs` |
| Handmatige WCAG 2.2 AA-controle met screenreader en toetsenbord | 🧑 | – |

## F. Performance

| Punt | Status | Waar |
|---|---|---|
| Lighthouse ≥ 95 op Performance, Accessibility, Best Practices, SEO (doel 100) | ✅ | `lighthouserc.cjs` |
| LCP < 2,5 s, CLS < 0,1, TBT < 200 ms (lab, mobiel) | ✅ | `lighthouserc.cjs` |
| Critical CSS inline | ✅ | `build.inlineStylesheets: 'always'` |
| Font self-hosted, gesubset, gepreload, metric-matched fallback | ✅ | `astro.config.mjs → fonts`, `scripts/font-subset.mjs` |
| AVIF/WebP, srcset/sizes, width/height | ✅ | `<Picture>`/`<Image>` |
| Speculation Rules prefetch | ✅ | `SpeculationRules.astro` |
| Geen third-party scripts | ✅ | CSP `script-src 'self'` |
| Veldmetingen (CrUX/Search Console) na 28 dagen controleren | 🧑 | – |

## G. Deploy

| Punt | Status | Waar |
|---|---|---|
| HSTS (preload), nosniff, Referrer-Policy, Permissions-Policy, COOP, CSP | ✅ | `vercel.json`, `public/_headers` |
| `Cache-Control: immutable` voor `/_astro/*`; HTML `max-age=0, must-revalidate` | ✅ | idem |
| Compressie en CDN | ✅ (platformstandaard) | Vercel/Netlify/Cloudflare |
| CI: typecheck → build + SEO-check → Lighthouse | ✅ | `.github/workflows/ci.yml` |

## H. Redactionele checklist per artikel (handmatig)

1. `title` 34–44 tekens (zodat `titel | sitenaam` op 50–60 uitkomt); de check zegt het als het niet klopt.
2. `description` 120–160 tekens, uniek, geen opsomming van zoekwoorden.
3. `slug` lowercase met koppeltekens; wijzigt hij later, voeg dan een regel toe aan `redirects.config.mjs`.
4. `datePublished` en `dateModified` kloppen; werk `dateModified` bij bij elke inhoudelijke wijziging (sitemap-lastmod en Article-schema volgen automatisch).
5. `author` en `category` verwijzen naar bestaande bestanden in `authors/` en `hubs/`.
6. `image` ≥ 1600×900 met een beschrijvende `imageAlt`; geen tekst in het beeld.
7. Eén gedachte per artikel; H2's als vragen of stappen; link in de tekst naar gerelateerde artikelen met de titel als ankertekst.
8. Externe bronnen noemen en linken (geen `nofollow` op betrouwbare bronnen).
9. `noindex: true` alleen voor pagina's die bewust niet in de zoekresultaten horen; `canonical` alleen als deze pagina een variant van een andere URL is.

## I. Analysechecklist referentie-repos

De tien punten waarmee elke repo is beoordeeld (volledige tekst in `docs/analyse/00-checklist.md`): 1 stack & rendering · 2 URL-architectuur · 3 head & meta · 4 structured data · 5 crawl & indexatie · 6 interne links · 7 HTML-semantiek · 8 performance · 9 styling & layout · 10 hosting/deploy. Per punt: bevindingen met bestand:regel, score 1–5, kerngetallen.
