# DECISIONS.md: ontwerpkeuzes en hun verantwoording

Elke keuze verwijst naar de analyse (ANALYSE.md) of naar Google Search Central. Waar ik moest kiezen zonder eenduidig bewijs, staat dat erbij.

## 1. Framework: Astro 7.4 (static output, 0 KB client-JS)

**Besluit.** Astro 7.4.4, `output: 'static'`, geen adapter, geen client-islands in het template.

**Waarom.** De analyse levert geen "winnend framework" op: alle zeven referentiesites zijn met een eigen Python-generator gebouwd en danken hun kwaliteit aan de output (complete HTML, 10–14 KB gzip, nul third-party), niet aan de tool. De opdracht schrijft in dat geval een static-first framework voor dat standaard nul client-side JS uitlevert. Astro voldoet daaraan en biedt bovendien wat de Python-generators misten: getypeerde content collections met schema-validatie (Zod), een ingebouwde image-pipeline (sharp → AVIF/WebP, `srcset`, `width`/`height`), een stabiele Fonts API met metric-matched fallbacks, en één toolchain (npm) die op Vercel, Netlify en Cloudflare zonder extra configuratie draait.

**Afgewezen alternatieven.** Eleventy (uitstekend, maar geen ingebouwde image/fonts-pipeline met dezelfde garanties); Next.js/Nuxt static export (hydration en framework-runtime per pagina, precies wat de referentiesites vermijden); een eigen generator zoals de referentiesites (niet onderhoudbaar, zie de drie regex-nabewerkingspassen en vijf ontbrekende bestanden in familie A).

**Versie-specifieke keuzes.** Astro 7 heeft `compressHTML: 'jsx'` als default, wat spaties tussen inline-elementen kan weghalen; ik zet `compressHTML: true` (verliesloos). De Markdown-pipeline is in v7 Sätteri (GFM + SmartyPants) zonder remark/rehype; het template gebruikt geen plugins, dus dat is geen beperking. Node ≥ 22 is vereist (v6-wijziging). De Astro-documentatie is uit de GitHub-bron van `withastro/docs` gelezen omdat `docs.astro.build` vanuit de bouwomgeving niet bereikbaar was.

## 2. Eén configbestand: `site.config.ts`

Alle zeven repos hebben het telefoonnummer hard in 120–190 bestanden staan; 6–11 commits per repo zijn nummerwissels. Daarom staan naam, domein, taal, organisatie, social, routesegmenten, UI-strings, SEO-grenzen, feeds en IndexNow in één getypeerd bestand. Pagina's, JSON-LD, sitemap, robots, feed, manifest én de SEO-check lezen hieruit (Node 22 importeert `.ts` native).

## 3. URL-architectuur

- **`/hub/artikel/`** met vaste trailing slash (`trailingSlash: 'always'`, `build.format: 'directory'`, op Vercel `trailingSlash: true`). De referentiesites doen hetzelfde en hebben 0 canonical-afwijkingen; familie A splitst hub en detail echter over twee naamruimten zodat URL en breadcrumb niet overeenkomen. In het template volgt de URL de breadcrumb exact.
- **Slugregels in het schema** (`src/content.config.ts`): lowercase, cijfers, koppeltekens; geen datums of ID's. Een fout slug breekt de build.
- **Padsegmenten uit config** (`routes.authors`, `routes.sitemap`): daarom één catch-all route `src/pages/[...path].astro` die de routetabel uit `src/lib/site.ts` rendert. Bestandsnamen bepalen geen URL's meer.
- **Botsingen** tussen hubs, pagina's en vaste segmenten worden bij het laden gedetecteerd en breken de build.
- **Redirects** in `redirects.config.mjs` → `vercel.json` (301) en `public/_redirects` (Netlify/Cloudflare). Astro's eigen `redirects` geeft in een static build alleen meta-refresh, dus ongeschikt. De check faalt als de map niet gesynchroniseerd is, als een bron nog als pagina bestaat of als een pagina naar een redirect-bron linkt.
- **Geen paginering, tag- of archiefpagina's.** Hubs tonen al hun artikelen (zoals de referentiesites). Auteurs hebben een eigen pagina (E-E-A-T), maar geen auteurs-index.

## 4. `<head>`: één component

`src/components/Seo.astro` schrijft title, description, canonical, robots, hreflang, OG, Twitter, icons, manifest, theme-color, sitemap- en feed-link. Keuzes:

- **Title = `titel | sitenaam`**, home = `sitenaam: tagline`. Google heeft geen lengtelimiet (title wordt afgekapt op schermbreedte), maar de referentiesites trimmen op 60 en dat voorkomt herschrijvingen. De grenzen (50–60 / 120–160) staan in `site.config.ts` en worden door de check afgedwongen op de gerenderde `<title>`.
- **Robots:** `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`; `noindex, follow` bij `noindex: true`. Een pagina met afwijkende `canonical` blijft indexeerbaar maar valt uit sitemap en feed.
- **Geen self-hreflang op een ééntalige site** (de referentiesites doen dat wel; het is ruis). Hreflang verschijnt alleen als `site.alternates` of frontmatter-`alternates` gevuld zijn, dan inclusief `x-default`.
- **Geen `geo.*`-meta's**, geen `keywords`.
- **Pagina-specifieke `og:image`** (1200×630 JPG uit het artikelbeeld) in plaats van één sitebreed beeld.

## 5. JSON-LD: één `@graph`, alleen ondersteunde types

- Eén `<script type="application/ld+json">` per pagina met `@graph`; nodes gekoppeld via `@id`: `Organization` ← `WebSite` ← `WebPage` → `BreadcrumbList`, `Article` → `Person`, `CollectionPage` → `ItemList`, `ProfilePage` → `Person`. De referentiesites gebruiken losse blokken en herhalen `#business` als subset met wisselend `@type`; dat is hier onmogelijk.
- **Organization, niet LocalBusiness.** LocalBusiness zonder straatadres (zoals in alle zeven repos) voldoet niet aan Google's eisen. Wie een fysiek adres heeft, vult `organization.address`; een LocalBusiness-subtype is een bewuste uitbreiding, geen default.
- **Geen FAQPage, HowTo, SearchAction, Review/AggregateRating.** FAQ rich results zijn per mei 2026 gestopt, HowTo in 2023, Sitelinks search box in 2024. De build-check faalt op deze types.
- **Article** met `headline` (≤ 110 tekens), `image` in 16:9, 4:3 en 1:1 (JPG, breedst ondersteund), echte `datePublished`/`dateModified` uit de frontmatter, `author` als `Person` met `url` naar de auteurspagina en `sameAs`, `publisher` = Organization, `articleSection`, `wordCount`. De check faalt als `dateModified < datePublished` (de bug in drie referentiesites).
- **Serialisatie** escapet `<`, `>` en `&` zodat `</script>` in content de HTML niet kan breken.

## 6. Crawl & indexatie

- **Eigen sitemap-endpoints** in plaats van `@astrojs/sitemap`, omdat de integratie geen toegang heeft tot `dateModified` per pagina. `sitemap-index.xml` → `sitemap-pages.xml` met alleen indexeerbare canonieke URL's, `lastmod` = echte `dateModified` (hubs en home: maximum van de onderliggende pagina's), image-extensie voor artikelbeelden, `xhtml:link` bij site-brede alternates. Geen `priority`/`changefreq` (Google negeert ze).
- **robots.txt** met `Sitemap:`-regel; **RSS 2.0** (`/rss.xml`) met absolute links; **llms.txt** optioneel (Google gebruikt het niet; het kost niets).
- **IndexNow**: sleutelbestand `/<key>.txt` wordt uit `INDEXNOW_KEY` gebouwd; `scripts/indexnow.mjs` vergelijkt de nieuwe sitemap met de vorige staat en meldt alleen nieuwe/gewijzigde URL's. Draait via GitHub Action op `deployment_status: success` (dus écht na de deploy) of handmatig. Eerlijkheidshalve: Google doet niet mee aan IndexNow; voor Google blijven sitemap-lastmod en interne links de signalen.

## 7. Interne links

- Breadcrumbs (HTML `<nav><ol>` + JSON-LD, door de check op gelijkheid gecontroleerd), hub → alle artikelen, artikel → hub (kicker, breadcrumb, "Meer over …"), gerelateerde artikelen (zelfde hub eerst, aangevuld met recente uit andere hubs), artikel → auteur → artikelen, footer met hubs + pagina's + sitemap + feed, HTML-sitemap met alles.
- **Beperkte boilerplate**: de header toont alleen de hubs (geen 34-link mobiel menu in de DOM), de footer drie korte kolommen. Contextuele links krijgen daardoor relatief meer gewicht dan in de referentiesites (65–80 boilerplate-links per pagina).
- **Ankerteksten** zijn altijd de paginatitel of het navLabel; de check waarschuwt bij "lees meer"-achtige ankers.
- **Klikdiepte ≤ 3** wordt door de check afgedwongen (BFS vanaf `/`); in de placeholder-site is het maximum 2.

## 8. Performance

- **0 KB client-JS.** Geen prefetch-script, geen view transitions, geen service worker. De referentiesites hebben een 7 KB router + SW; dat is onzichtbaar voor Googlebot en voegt onderhoud en SWR-staleness toe. Prefetch gebeurt declaratief met **Speculation Rules** (`eagerness: moderate`, exclusief `.xml`/`.txt`/nofollow), 0 bytes JS.
- **Alle CSS inline** (`build.inlineStylesheets: 'always'`): ±12,7 KB per pagina, minder dan familie A (17 KB) en familie B (31 KB). Bij een site met veel pagina's en terugkerende bezoekers kan `'auto'` (externe, immutable stylesheet) gunstiger zijn; dat is één configregel.
- **Font**: Inter variable, latin-subset met `wght`-as beperkt tot 400–700 (28,7 KB, `scripts/font-subset.mjs`), via Astro's Fonts API self-hosted in `/_astro/fonts/` (immutable), gepreload, `font-display: optional` **én** een metric-matched fallback (`size-adjust`, `ascent-override`, `descent-override` op Arial, door Astro berekend uit het fontbestand). Eerste meting met `swap`: Lighthouse CLS 0,06–0,09 op tekstzware pagina's doordat regels anders afbreken na de swap, ondanks de fallback-metrics. Met `optional` is CLS 0 gegarandeerd (de browser wisselt nooit meer na de eerste paint); dankzij de preload is het font vrijwel altijd binnen de blokkeerperiode beschikbaar, en als dat niet zo is, houdt de metric-fallback de layout identiek aan die van de volgende paginaweergave. De referentiesites gebruiken ook `optional`, maar zonder fallback-metrics.
- **Beelden**: `<Picture>` met AVIF + WebP + JPG-fallback, automatische `srcset`/`sizes` (`image.layout: 'constrained'`), `width`/`height`, `loading="lazy"`; het LCP-beeld (hero, of de eerste kaart op de home) krijgt `priority` → `loading="eager" fetchpriority="high" decoding="sync"`. De check waarschuwt bij meer dan één `fetchpriority="high"` per pagina.
- **Home zonder hero-afbeelding**: LCP is tekst, net als bij de referentiesites.

## 9. Styling

- Tokens als CSS custom properties in `src/styles/tokens.css`; dark mode via `prefers-color-scheme` (geen toggle: dat zou JS vergen); `color-scheme: light dark`.
- Mobile-first (alleen `min-width`), `clamp()`-typografie, `text-wrap: balance/pretty`, `aspect-ratio` op media-containers (CLS), `:focus-visible` met 3 px outline in een contrasterende kleur, `prefers-reduced-motion` schakelt ook `scroll-behavior: smooth` uit (in alle zeven repos vergeten).
- Contrast: tekstkleuren zijn gekozen op ≥ 4,5:1 in beide modi (muted-tekst `#4b5563` op wit 7,6:1; `#aab4c4` op `#0b1220` 9,3:1).
- Geen inline `style`-attributen in templates (familie A: 541–795 per site), zodat een strikte CSP mogelijk blijft.

## 10. Toegankelijkheid

Skip-link, één `<main>` met `tabindex="-1"`, `<header>`/`<nav aria-label>`/`<article>`/`<aside aria-label>`/`<footer>`, `aria-current="page"`, lijsten als `<ul>/<ol>`, `<time datetime>`, decoratieve SVG's met `aria-hidden` en `focusable="false"`, focusstijlen, 44 px-touchdoelen in de navigatie, geen informatie alleen via kleur. Doel: WCAG 2.2 AA; Lighthouse Accessibility ≥ 95 wordt afgedwongen (zie VERGELIJKING.md voor de gemeten score).

## 11. Deploy

- **Vercel**: `vercel.json` met `trailingSlash: true`, headers (HSTS incl. `preload`, nosniff, Referrer-Policy, Permissions-Policy, COOP, CSP met `default-src 'self'`, `script-src 'self' 'inline-speculation-rules'`, `style-src 'self' 'unsafe-inline'` vanwege de inline CSS), `Cache-Control: immutable` voor `/_astro/*`, 1 uur voor sitemap/feed/robots, `max-age=0, must-revalidate` voor HTML.
- **Netlify**: `netlify.toml` (build, publish, Node 22) + `public/_headers` en `public/_redirects`.
- **Cloudflare Pages**: `wrangler.toml` (`pages_build_output_dir`) + dezelfde `_headers`/`_redirects`.
- Compressie (Brotli/gzip) en CDN zijn op alle drie platformstandaard; er is geen eigen configuratie nodig.
- **CI** (`.github/workflows/ci.yml`): typecheck → build + SEO-check → Lighthouse CI; artefacten bewaard. **IndexNow-workflow** op `deployment_status`.

## 12. Build-time SEO-check (`scripts/seo-check.mjs`)

Faalt de build bij: ontbrekende/dubbele titles of descriptions; lengte buiten de configureerbare grenzen; ≠ 1 H1; kapotte interne links, links zonder trailing slash of met hoofdletters, links naar redirect-bronnen; wezen; klikdiepte > 3; `img` zonder `alt` of zonder `width`/`height`; ongeldige JSON-LD, niet-oplosbare `@id`-verwijzingen, ontbrekende aanbevolen properties, `dateModified < datePublished`, gedeprecieerde types; sitemap met noindex- of niet-canonieke URL's, ongeldige of toekomstige lastmod, ontbrekende indexeerbare pagina's; canonical die niet absoluut is, niet naar een bestaand bestand wijst (200-proxy) of afwijkt van `og:url`; robots.txt zonder sitemap; ongeldige RSS; redirect-map niet gesynchroniseerd. Optioneel (`SEO_CHECK_BASE_URL`): live HEAD-request per canonical. Waarschuwingen (kopsprongen, generieke ankers, identieke lastmods, lazy ontbreekt) falen alleen met `--strict`.

## 13. Lighthouse CI

`lighthouserc.cjs`: mobiele emulatie (Lighthouse-default), 3 runs, zes representatieve URL's; fout bij categorie < 0,95 of LCP > 2.500 ms, CLS > 0,1, TBT > 200 ms; waarschuwing bij TTI/Speed Index/totaalgewicht. Doel blijft 100 op alle vier; de drempel 95 is de faalgrens uit de opdracht.

## 14. Wat bewust niet is gedaan

- Geen service worker, geen client-side router (zie §8).
- Geen LocalBusiness/Product/FAQ-markup als default (zie §5).
- Geen `priority`/`changefreq` in de sitemap, geen self-hreflang, geen `geo.*`.
- Geen automatische OG-beeldgeneratie met tekst (Satori): het artikelbeeld is de social preview; een default-OG-beeld vangt de rest op.
- Geen Tailwind: het lichte tokensysteem is ±12 KB inclusief alles en blijft leesbaar in de output.
- Geen `trailingSlash`-redirect in het template zelf: dat regelt de host (Vercel `trailingSlash`, Netlify/Cloudflare standaard voor map-indexen).

## 15. Beperkingen van deze oplevering

- De Google Search Central-pagina's konden niet rechtstreeks worden geladen (netwerkbeleid van de bouwomgeving); de toetsing in ANALYSE.md §7.3 steunt op zoekresultaten met citaten uit die pagina's en op de "Latest documentation updates"-pagina. Controleer bij twijfel de genoemde pagina's zelf.
- Lighthouse is in een container gedraaid (lab, mobiele emulatie); veldwaarden (CrUX) bestaan pas na publicatie.
- De placeholder-content telt 20 pagina's; de referentiesites 118–181. Klikdiepte- en orphan-garanties zijn onafhankelijk van het aantal pagina's (ze worden per build gecontroleerd), maar hub-pagina's met honderden artikelen vragen om een redactionele indeling (sub-hubs), niet om paginering.
