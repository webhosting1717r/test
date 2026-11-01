# Analyse repo `lachgas-limburg` (technische SEO, architectuur, front-end)

Repo: `/home/user/lachgas-limburg` (alleen gelezen, niets gewijzigd).
Git: **1 commit** (`95e1d34`, 25 okt 2026 01:02 +0200, auteur "Claude", 181 bestanden, 12.297 regels toegevoegd). Dit is de nieuwste repo van de reeks; de commitboodschap noemt "128 pagina's, 5 regio's, 66 plaatsen" en dat de opzet is gekopieerd van twee zusterrepo's (zelfde `_build/`-generator).
Meetscript: `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/meet_limburg.py` (BFS, head/meta, JSON-LD, headings, images, links, sitemap-consistentie). Alle cijfers hieronder komen uit dat script, `grep`/`find`/`wc`/`gzip` of uit het lezen van de generatorcode.

---

## 1. Stack & rendering

**Generator.** Eigen Python-SSG zonder framework of templating-engine; HTML wordt met `%`-stringformattering opgebouwd.

| Onderdeel | Bestand | Rol |
|---|---|---|
| Entry | `_build/build.py` (98 regels) | laadt contentmodules, bouwt alle pagina's, schrijft sitemap/robots/CNAME/favicon/manifest/IndexNow-key/llms.txt, roept daarna twee na-bewerkingen aan |
| Componenten + renderer | `_build/common.py` (344 regels) | configuratie (`configure()`, r.49-58), iconen, schema-bouwers (r.106-150), header/footer/kruimelpad/CTA-componenten, `render()` (r.312-335) met de vaste head |
| Paginabouwers | `_build/pages.py` (296 regels) | `class Site` met één methode per paginatype; `build_all()` r.278-296 |
| Content | `_build/content/*.py` (3.579 regels, 15 modules) | pure Python-dicts/lijsten (geen Markdown, geen JSON, geen CMS) |
| Site-instellingen | `_build/content/_site.py` (`SITECFG`, 36 sleutels), `_build/master/site.json` (40 regels) | twee aparte configbestanden voor dezelfde site (zie §10) |
| Snelheidslaag | `_build/speed/apply_speed.py` (95 regels) + `levertijd.py`, `nav.js`, `site-brabant.js`, `sw.js`, `fonts/manrope.woff2` | regex-nabewerking van de HTML: fonts self-hosten, preload, scripts injecteren, SW genereren |
| "Master-standaard" | `_build/master/seo_master.py` (579 regels) | tweede regex-nabewerking: head herschrijven in vaste volgorde, titelconventie, JSON-LD gelijktrekken, sitemap-lastmod, vercel.json |

Pijplijn (`build.py` r.45-94): `configure(SITECFG)` → `load_content()` (alle `*.py` zonder `_`-prefix, r.16-32) → `Site.build_all()` → dubbelpad-assert (r.52-55) → `C.render()` per pagina → sitemap/robots/manifest/llms → `apply_speed.apply(ROOT, "brabant")` (r.86) → `seo_master.apply_site(ROOT, C.SITE)` (r.93). De twee na-bewerkingen parsen de zojuist geschreven HTML opnieuw met regex en overschrijven die. Er is **geen** `package.json`, Tailwind, Node, bundler of CI.

**Renderstrategie.** 100% SSG: elke pagina is volledig statische HTML, de JS is progressive enhancement. Geen hydration, geen framework-runtime, geen inline scripts behalve JSON-LD (0 inline niet-LD scripts gemeten).

**Meetbaar (128 HTML-bestanden, excl. `_build/`).**
- Grootte: min 35.262 B (`404.html`), mediaan 44.938 B, gemiddeld 45.075 B, max 64.511 B (`index.html`); totaal 5,77 MB. Gzip-steekproef: `index.html` 64.511 → 14.302 B, `lachgas-bezorgen/venlo/index.html` 45.327 → 10.470 B, `informatie/wat-is-lachgas/index.html` 43.938 → 11.170 B, `404.html` → 7.936 B.
- Per pagina zit ~16.952 B CSS inline (4.443 B gzip) en gemiddeld 2.468 B JSON-LD (max 5.247 B); de rest is HTML met herhaalde header/footer/mobiel menu (34 + 31 links).
- Woorden in `<main>`: alle pagina's min 63 / mediaan 751 / gem 776 / max 1.616, totaal 99.375. Drie voorbeelden: `/` 1.616, `/lachgas-bezorgen/venlo/` 759, `/informatie/wat-is-lachgas/` 894. Laagste: `/404.html` 63, `/sitemap/` 301, `/contact/` 438.

**JavaScript (totaal 9.881 B raw, 3.869 B gzip; plus `sw.js` 2.292 B / 953 B).**
- `js/nav.js` (6.950 B / 2.550 B gzip; bron `_build/speed/nav.js`): eigen client-side router. Feature-detectie r.4; prefetch bij `pointerdown`/`touchstart` (r.89-90), bij hover na 65 ms (r.92) en via `IntersectionObserver` voor max. 16 zichtbare links met `rootMargin` 240 px (r.93-111), uitgeschakeld bij `saveData`/2G (r.7). Bij klik (r.77-81) wordt de pagina gefetcht, met `DOMParser` geparsed en worden `<main>`, `header` en `footer` vervangen (r.54-59); `title`, `meta description`, `meta robots`, `canonical` en `og:url` worden gesynchroniseerd (r.48-52), `history.pushState` (r.60), focus naar `<main tabindex="-1">` (r.64), `scrollRestoration = "manual"` (r.88). Cache max. 60 pagina's in geheugen (r.5). Valt terug op gewone navigatie bij fout (r.75). JSON-LD en hreflang worden bij een zachte wissel niet bijgewerkt (irrelevant voor crawlers, die de volledige HTML krijgen).
- `js/site.js` (2.931 B / 1.319 B gzip; bron `_build/speed/site-brabant.js`): scroll-reveal van kaarten/sectiekoppen onder de vouw (r.7-43) met `prefers-reduced-motion`-check (r.24) en 8 s-vangnet (r.42); sluit `details.menu` na navigatie (r.47); registreert de service worker alleen op https/localhost (r.51-53).
- `sw.js` (bron `_build/speed/sw.js`, versie-hash en precache-lijst ingevuld door `apply_speed.py` r.81-90 en nogmaals door `seo_master.py` r.563-565): `VERSION = "6b62a9f6a3"`; precache `/`, beide JS-bestanden en het font (r.4); statische bestanden (regex op extensie, r.22) cache-first; HTML-navigaties stale-while-revalidate met limiet van 150 pagina's (r.5, r.31-44); offline-fallback naar `/` (r.43); `skipWaiting` + `clients.claim` (r.7, r.13). Oude caches worden bij activate opgeruimd (r.9-13).
- Speculation Rules stonden in `common.py` r.309 (`SPEC`, prerender `moderate`) maar worden door `apply_speed.py` r.44 weer verwijderd ("dubbel werk naast de router"): 0 voorkomens in de output.

---

## 2. URL-architectuur

- **Conventie:** alle paden lowercase, koppeltekens, geen underscores, geen datums of ID's, geen hoofdletters (0 afwijkingen gemeten). Cijfers alleen waar inhoudelijk (`/lachgas-tanks/2kg/`, `/lachgas-tanks/4kg/`, `/lachgas-tanks/10kg/`, `/service/leeftijdscontrole-18-plus/`, `/informatie/lachgas-en-vitamine-b12/`).
- **Diepte:** max 2 segmenten. Verdeling: 0 segmenten 1 (home), 1 segment 11 (`/bezorggebied/`, `/informatie/`, `/service/`, `/veelgestelde-vragen/`, `/lachgas-tanks/`, `/over-ons/`, `/contact/`, `/privacy/`, `/algemene-voorwaarden/`, `/sitemap/`, `/404.html`), 2 segmenten 116.
- **Trailing slash:** map + `index.html` voor alle 127 pagina's (`build.py` r.61-62); `vercel.json` r.2 `"trailingSlash": true` zorgt dat `/x` 308 naar `/x/` gaat. 100% van de interne hrefs eindigt op `/` (enige uitzondering is de font-preload `/fonts/manrope.woff2`). Alleen `/404.html` is een los bestand.
- **Twee naamruimten voor één hiërarchie:** de hubs staan onder `/bezorggebied/<regio>/`, de detailpagina's onder `/lachgas-bezorgen/<plaats>/` (`pages.py` r.6 `AREA_DIR`, r.88). Het kruimelpad zegt Home › Bezorggebied › Regio › Plaats, maar de URL van de plaats ligt buiten `/bezorggebied/`. Gevolg: de desktop-nav markeert op de 66 plaatspagina's geen actief item (`common.py` r.198 gebruikt `path.startswith(h)`; gemeten 0 `aria-current` in de desktop-nav op `/lachgas-bezorgen/venlo/`, 1 op `/bezorggebied/parkstad/`). Zelfde effect op de 12 `/service/`-pagina's omdat `/service/` niet in `NAV` zit (`common.py` r.70-71).
- **Redirects:** geen. `vercel.json` heeft geen `redirects`/`rewrites`; geen `_redirects`, geen `meta refresh` (0 gemeten). Oude URL's van zusterdomeinen worden niet afgevangen (ook niet nodig: nieuwe site).
- **Canonicals:** 127/127 indexeerbare pagina's hebben een self-referencing absolute canonical (`seo_master.py` r.342); 0 afwijkingen t.o.v. de sitemap. `/404.html` heeft bewust geen canonical, geen hreflang en geen `og:url` (`seo_master.py` r.341-346).
- **Paginering:** niet van toepassing (geen lijst > 1 pagina; `/bezorggebied/` toont alle 66 plaatsen op één pagina).
- **404/410:** `404.html` in de root (`pages.py` r.256-258): `robots` `noindex, follow`, niet in de sitemap (`sitemap=False`), eigen title/description, kruimelpad en 6 chips naar hoofdsecties. Vercel serveert `404.html` automatisch voor onbekende paden bij statische output; er is geen expliciete configuratie en geen 410.

---

## 3. Head & meta

De head wordt eerst door `common.render()` (r.325-333) geschreven en daarna door `seo_master.build_head()` (r.292-374) volledig herschreven in vaste volgorde: charset → viewport → title → description → robots → canonical → hreflang `nl` + `x-default` → `og:type/site_name/locale/title/description/url/image/image:width/image:height/image:alt` → `twitter:card/title/description/image/image:alt` → `theme-color` → `geo.region` (`NL-LI`) → `geo.placename` → icons (svg, ico, apple-touch-icon, manifest; gesorteerd r.362-366) → preloads → `<style>` → JSON-LD-scripts.

**Metingen over alle 128 pagina's.**

| Item | Resultaat |
|---|---|
| `<meta charset>` eerste element in head | 128/128 |
| viewport `width=device-width, initial-scale=1` | 128/128 |
| `<html lang="nl">` | 128/128 (`seo_master.py` r.447) |
| Title-lengte | min 25 / gem 46,0 / mediaan 45 / max 60; 0 titels > 60 |
| Unieke titels | 128/128 = **100%**; 0 dubbele |
| Description-lengte | min 115 (`404.html`) / gem 150,7 / mediaan 151 / max 160; 0 > 160, 1 < 120 |
| Unieke descriptions | 128/128; 70 eindigen op "18+." (sjabloonstaart) |
| robots | 127 × `index, follow, max-image-preview:large`, 1 × `noindex, follow` (`404.html`) |
| og:type | 105 × `website`, 23 × `article` (artikelen, `pages.py` r.156) |
| hreflang | 127 pagina's met 2 tags (`nl` + `x-default`, beide naar dezelfde URL) |
| preconnect / dns-prefetch | 0 / 0 (gstatic-preconnect uit `common.py` r.331 wordt door `apply_speed.py` r.36 verwijderd) |
| preload | 128 × `as="font"` (`/fonts/manrope.woff2`, `crossorigin`); 0 image-preloads |
| favicon / icons | `favicon.svg` (168 B, gegenereerd `build.py` r.40-42), `favicon.ico` 327 B, `apple-touch-icon.png` 180×180, `manifest.webmanifest` (`id`, `start_url`, `scope`, 192/512-icons, `theme_color #1c1917`, `background_color #fbfaf8`) |
| theme-color | `#1c1917` op alle pagina's; geen `media`-variant |

**Titel-sjabloon.** `seo_master.new_title()` (r.244-269) dwingt een conventie af: home krijgt `home_title` uit `site.json` r.14; plaatspagina's krijgen `"Lachgas <Plaats> bestellen | <Merk>"` zodra dat ≤ 60 tekens is (r.251-253) — gemeten **66/128 titels volgen exact dit sjabloon**; de oorspronkelijke content-titels (bv. `areas_noord_limburg.py` r.5) worden dus overschreven. Overige pagina's krijgen ` | <Merk>` als staart indien ≤ 60 tekens (r.257-259), anders blijft de content-titel staan (25 titels zonder merk, 4 met een `A | B`-patroon zonder merk). Patroonverdeling: 97 × `… | <Merk>`, 2 × merk elders, 4 × `A | B` zonder merk, 25 × zonder `|` en zonder merk. H1 ≠ title op alle 128 pagina's; H1's zijn 128/128 uniek, 71 volgen `"… bezorgen in <Plaats/Regio>"`.

**Opmerkingen.**
- hreflang `nl` + `x-default` naar dezelfde URL op een eentalige site is overbodig (niet schadelijk).
- `geo.region`/`geo.placename` zijn legacy-tags zonder effect bij Google.
- `og:type=article` zonder `article:published_time`/`article:modified_time` (0 gemeten).
- `og:image` is voor alle 128 pagina's hetzelfde 1200×630 PNG (64.825 B); `og:image:alt` is overal dezelfde zin (`site.json` r.39).
- `description` wordt door `trim_desc()` (`seo_master.py` r.94-105) op zinsgrens afgekapt bij > 160 — in deze build was dat nergens nodig.

---

## 4. Structured data

**Gegenereerd door:** schema-functies in `common.py` r.106-150 (LocalBusiness, WebSite, BreadcrumbList, FAQPage, Service, Article, WebPage, ItemList), Product inline in `pages.py` r.196-198, ContactPage inline in `pages.py` r.239. Daarna normaliseert `seo_master.rebuild_schemas()`/`fix_schema()` (r.162-225) ieder object en sorteert in vaste volgorde: hoofdentiteit → ItemList → BreadcrumbList → FAQPage (r.223-224). Elk object staat in een eigen `<script type="application/ld+json">` (geen `@graph`); koppeling via `@id`.

**Telling per `@type` (354 blokken, 12 verschillende types):**

| @type | blokken | op pagina's |
|---|---|---|
| BreadcrumbList | 126 | alle behalve `/` en `/404.html` |
| FAQPage | 98 | home, hubs, plaatsen, services, tanks, FAQ, contact, thema-hubs |
| Service | 83 | 66 plaatsen + 5 hubs + 12 services |
| Article | 23 | `/informatie/<artikel>/` |
| ItemList | 11 | `/bezorggebied/`, 5 hubs, `/informatie/`, `/service/`, `/lachgas-tanks/`, 2 thema-hubs |
| WebPage | 5 | 2 thema-hubs, `/privacy/`, `/algemene-voorwaarden/`, `/sitemap/` |
| Product | 3 | `/lachgas-tanks/{2kg,4kg,10kg}/` |
| CollectionPage | 2 | `/bezorggebied/`, `/informatie/` (toegevoegd door `seo_master.py` r.215-217 omdat er een ItemList is) |
| LocalBusiness | 1 | `/` |
| WebSite | 1 | `/` |
| ContactPage | 1 | `/contact/` |
| AboutPage | 1 | `/over-ons/` (WebPage → AboutPage via `seo_master.py` r.187-188) |

Type-combinaties: 78 × (Service, BreadcrumbList, FAQPage) = plaatsen+services; 23 × (Article, BreadcrumbList); 5 × (Service, ItemList, BreadcrumbList, FAQPage) = hubs; 3 × (Product, BreadcrumbList, FAQPage); 1 × (LocalBusiness, WebSite, FAQPage) = home; `/404.html` heeft 0 blokken.

**Koppeling (@id-graaf).** `LocalBusiness @id …/#business` en `WebSite @id …/#website` staan alleen op de home (`common.py` r.319-320, `seo_master.py` r.209-213). `WebSite.publisher → {@id #business}`. `Service.provider` is een ingekorte LocalBusiness met `@id #business` (`biz_ref`, r.117-118). `Article.publisher` is een `Organization` met hetzelfde `@id #business` en `logo` ImageObject 512×512 (r.121-122) — let op: hetzelfde `@id` krijgt hier type `Organization` en elders `LocalBusiness`. `WebPage/AboutPage/ContactPage/CollectionPage.isPartOf → {@id #website}` (r.197); `AboutPage/ContactPage.mainEntity → {@id #business}` (r.190). BreadcrumbList-items gebruiken absolute `item`-URL's.

**Volledig voorbeeld (detailpagina `/lachgas-bezorgen/venlo/index.html`, 3 blokken, in deze volgorde):**

```json
{"@context":"https://schema.org","@type":"Service",
 "name":"Lachgas bezorgen in Venlo",
 "description":"Lachgas bestellen in Venlo? Verzegelde lachgastanks 2KG, 4KG en 10KG thuisbezorgd van de binnenstad tot Venlo-Zuid, meestal binnen 15 tot 25 minuten. 18+.",
 "url":"https://lachgas-limburg.nl/lachgas-bezorgen/venlo/",
 "serviceType":"Lachgas bezorgservice",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgas-limburg.nl/#business","name":"Lachgas Limburg","url":"https://lachgas-limburg.nl/","telephone":"+31684626182"},
 "areaServed":{"@type":"City","name":"Venlo","geo":{"@type":"GeoCoordinates","latitude":51.37,"longitude":6.172}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/31684626182","name":"WhatsApp"}}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgas-limburg.nl/"},
 {"@type":"ListItem","position":2,"name":"Bezorggebied","item":"https://lachgas-limburg.nl/bezorggebied/"},
 {"@type":"ListItem","position":3,"name":"Noord-Limburg","item":"https://lachgas-limburg.nl/bezorggebied/noord-limburg/"},
 {"@type":"ListItem","position":4,"name":"Venlo","item":"https://lachgas-limburg.nl/lachgas-bezorgen/venlo/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"<vraag 1>","acceptedAnswer":{"@type":"Answer","text":"<antwoord 1, platte tekst, links gestript>"}},
 {"@type":"Question","name":"<vraag 2>","acceptedAnswer":{"@type":"Answer","text":"…"}},
 {"@type":"Question","name":"<vraag 3>","acceptedAnswer":{"@type":"Answer","text":"…"}}]}
```
(De FAQ-antwoorden zijn inhoudelijk weggelaten; in de bron zijn het drie vraag/antwoord-paren per plaats, `strip_tags` in `common.py` r.130 verwijdert de interne links uit de `text`.)

**Properties per type (samengevat).** LocalBusiness: `name, alternateName[2], url, logo(ImageObject), image, description, telephone, email, priceRange "€€", currenciesAccepted, paymentAccepted, areaServed(AdministrativeArea), address(PostalAddress: alleen addressRegion + addressCountry), openingHoursSpecification (ma-zo 00:00-23:59), contactPoint, sameAs[wa.me-link]`. Article: `headline, description, inLanguage nl-NL, mainEntityOfPage, url, datePublished, dateModified, author(Organization), publisher(Organization+logo), image[og-afbeelding]`. Product: `name, description, url, brand, image` — **zonder** `offers`, `sku`, `review`, `aggregateRating` (`seo_master.py` r.179 verwijdert de door `pages.py` r.198 gegenereerde `offers` met "prijs op aanvraag").

**Bevindingen / risico's.**
1. **Datumfout op alle 23 Article-blokken:** `datePublished: 2026-10-24` maar `dateModified: 2026-10-03` (gewijzigd vóór gepubliceerd). Oorzaak: `common.py` r.138 `def article_schema(title, desc, path, modified=TODAY)` bindt de default `TODAY` bij import (`2026-10-03`, r.34) en `configure()` (r.49-58) verandert later wel de globale `TODAY` (gebruikt voor `datePublished`, r.140) maar niet de reeds gebonden defaultwaarde. Op dezelfde pagina staat zichtbaar "Laatst bijgewerkt: oktober 2026".
2. **Drie verschillende "vandaag"-datums** in één build: `common.py` r.34 `2026-10-03`, `_site.py` r.27 `2026-10-24`, `seo_master.py` r.21 `2026-10-18`. WebPage/AboutPage/ContactPage/CollectionPage krijgen `dateModified 2026-10-18` (9 blokken), sitemap-lastmod wordt `2026-10-18`, Article `datePublished 2026-10-24`.
3. **FAQPage op 98 pagina's:** Google toont FAQ-rich results sinds augustus 2023 alleen nog voor overheids-/gezondheidsautoriteiten; de markup is correct maar levert geen SERP-voordeel en kost gemiddeld ~1-1,5 KB per pagina.
4. **LocalBusiness zonder straatadres/postcode/plaats** (alleen `addressRegion` + `addressCountry`) en zonder `geo`; `openingHoursSpecification` 00:00-23:59 op alle dagen. Dat is formeel toegestaan maar Google's LocalBusiness-richtlijnen verwachten een fysiek adres; dit is eerder een bezorgdienst (`Service`/`Organization` zou passender zijn). `sameAs` bevat alleen een `wa.me`-URL, geen sociale/registerprofielen. `priceRange "€€"` zonder prijzen op de site.
5. **Product zonder offers** → niet in aanmerking voor product-rich results, maar ook niet misleidend. Geen AggregateRating, geen Review → **geen fake-review-risico** (positief).
6. Zelfde `@id #business` met twee types (`LocalBusiness` op home / in Service.provider, `Organization` in Article.publisher) — Google tolereert dit, strikt genomen inconsistent.
7. `ItemList` op hubs (`pages.py` r.103) en indexen is correct opgebouwd (position, name, url); `CollectionPage` wordt alleen toegevoegd waar al een ItemList is (r.215-217) → `/bezorggebied/` en `/informatie/` wel, hubs niet (die hebben al Service als hoofdentiteit).
8. `Service.areaServed` bevat op alle 66 plaatspagina's `GeoCoordinates` (uit `lat`/`lon` in de content, `pages.py` r.125) — netjes en onderscheidend.

---

## 5. Crawl & indexatie

**robots.txt (volledig, 4 regels, `build.py` r.68):**
```
User-agent: *
Allow: /

Sitemap: https://lachgas-limburg.nl/sitemap.xml
```
Geen Disallow (ook niet voor `/404.html`, dat via meta noindex is afgedekt); `_build/` wordt niet gedeployed (`.vercelignore`), dus hoeft niet geblokkeerd.

**sitemap.xml** (`build.py` r.65-67, lastmod daarna overschreven door `seo_master.py` r.547-549):
- Eén `<urlset>`, geen index; **127 URL's**, allemaal absoluut, https, met trailing slash; 127 unieke.
- `lastmod`: **127 × `2026-10-18`** (identiek), terwijl de build-datum `2026-10-24` is (`_site.py` r.27) en de commit 25 okt. `build.py` schrijft eerst `C.TODAY` (24 okt), `seo_master.py` zet alles daarna terug naar zijn eigen hardgecodeerde `TODAY` (18 okt). Identieke en bovendien te oude lastmods worden door Google als onbetrouwbaar genegeerd.
- `changefreq`: 73 × weekly, 54 × monthly; `priority`: 1 × 1.0 (home), 8 × 0.9 (indexen + hubs), 85 × 0.8 (plaatsen, services, tanks, thema-hubs), 29 × 0.7 (artikelen, FAQ-thema's, contact), 1 × 0.6 (over-ons), 3 × 0.3 (privacy, voorwaarden, sitemap). Beide velden worden door Google genegeerd; ze kosten ruimte maar schaden niet.
- **Consistentie:** sitemap-URL zonder bestand: 0; HTML-pagina niet in sitemap: alleen `/404.html` (bewust); canonical ≠ sitemap-URL: 0; noindex-pagina's in sitemap: 0. `/sitemap/` (HTML-overzicht) staat wel in de sitemap en is indexeerbaar.
- **RSS/Atom:** geen (0 feedbestanden).
- **IndexNow:** `6c47fb0dbe62bd8da87f4e5a99c7de25.txt` in de root bevat exact die sleutel (`build.py` r.73, `_site.py` r.31) — geldig keybestand. Er is **geen ping-code** (grep op `indexnow` treft alleen de generatorbestanden), dus de sleutel wordt nooit gebruikt.
- **llms.txt** (139 regels, 33,5 KB): kop, blurb, link naar `llms-full.txt`, 127 regels `- [title](url): description` en contactblok (`build.py` r.75-83; titels later gesynchroniseerd door `seo_master.py` r.550-556). **llms-full.txt** (6.022 regels, 622 KB): per pagina `## title`, `URL:` en de platte tekst van `<main>` via `page_text()` (`common.py` r.338-344). Beide bestanden worden niet in robots.txt of HTML gelinkt.
- **Google verification:** geen `google-site-verification` meta of bestand.
- **Noindex:** alleen `/404.html`; niet in sitemap. `nav.js` synchroniseert de robots-meta bij zachte navigatie (r.50).

---

## 6. Interne links

**Navigatiestructuur (gemeten op `/lachgas-bezorgen/venlo/`, identiek sjabloon op alle pagina's):**
- Header (`common.py` r.197-204): skip-link, logo (`aria-label`), desktop-nav met 5 links (`NAV` r.70-71: Bezorggebied, Lachgas tanks, Informatie, Veelgestelde vragen, Contact), WhatsApp-knop, `<details class="menu">` met mobiel menu-paneel (`mobile_menu()` r.174-184): 4 tegels, 1 productlink, 4 groepen met in totaal 27 links (`MM_GROUPS` r.161-171) en CTA. Totaal **34 links in `<header>`**.
- Footer (`common.py` r.207-218, lijsten uit `build.py` r.56-58): logo, 3 kolommen (regio's 6, informatie 8, service 11) + juridisch (voorwaarden, privacy, sitemap) = **31 links**.
- Dus ~65 van de gemiddeld 75,8 interne links per pagina zijn sjabloonlinks; **unieke doelen in `<main>`: min 2 / gem 12,6 / mediaan 12 / max 124** (`/sitemap/`).
- Gemiddeld 41,2 unieke interne doelen per pagina (incl. sjabloon).

**Breadcrumbs:** HTML-kruimelpad (`<nav aria-label="Kruimelpad"><ol class="crumbs">`, `common.py` r.221-225) op 127 pagina's (alle behalve home), laatste item `aria-current="page"`; BreadcrumbList-JSON-LD op 126 (alle behalve home en 404). Plaatspagina's hebben 4 niveaus (Home › Bezorggebied › Regio › Plaats).

**Hub ↔ detail:**
- Home → 5 hubs (kaarten) + 12 steden (chips) + `/bezorggebied/`; `/bezorggebied/` → 5 hubs (H2-links) + alle 66 plaatsen (chips per regio).
- Hub → al haar plaatsen (chips, `pages.py` r.89/96), gemeententabel, andere hubs + `/bezorggebied/` (r.99).
- Plaats → hub (kruimelpad + chip "Heel <regio>", r.116), 3 nabije plaatsen (`nearby`), 3 producten, en vanuit intro/FAQ gemiddeld 2+ contextuele links naar artikelen/services (volgens `BRIEF.md`).
- Artikel → gerelateerde artikelen/services/plaatsen via `related` (`pages.py` r.149, `related_links()` r.28-39) + `/informatie/`; thema-hubs (2) groeperen artikelen in kaarten + ItemList.
- Service → gerelateerde pagina's (chips) als `related` gevuld is (r.163-166).
- FAQ-thema → de 4 andere thema's + `related` (r.215).

**Klikdiepte (BFS vanaf `/`, script `meet_limburg.py`):**

| Variant | max | verdeling | onbereikbaar |
|---|---|---|---|
| alle links (header/footer/menu/main) | **2** | d0: 1, d1: 49, d2: 77 | alleen `/404.html` |
| idem, zonder `/sitemap/` als bron | 2 | d0: 1, d1: 49, d2: 77 | `/404.html` |
| alleen links in `<main>`, zonder `/sitemap/` | 3 | d0: 1, d1: 38, d2: 85, d3: 1 (`/algemene-voorwaarden/`) | `/404.html`, `/over-ons/`, `/sitemap/` |

**Orphans:** 0 (alleen `/404.html`, dat per definitie geen inkomende links hoort te hebben). Zonder de HTML-sitemap als bron nog steeds 0. Kijk je alleen naar contextuele links in `<main>`, dan hangen `/over-ons/` en `/sitemap/` uitsluitend aan footer/menu, en `/algemene-voorwaarden/` heeft 1 contextuele inkomende link. Inkomende links (alle bronnen): min 3 (`/informatie/begrippenlijst-lachgas/`), daarna 4 voor o.a. `/informatie/geschiedenis-van-lachgas/`, `/informatie/lachgas-en-mentale-gezondheid/` en 9 plaatspagina's (bv. `/lachgas-bezorgen/bocholtz/`, `/lachgas-bezorgen/mook/`); max 127 (`/`). Contextueel (main, zonder sitemap): `/` 126, `/lachgas-tanks/` 83, `/bezorggebied/` 79, de drie productpagina's 70 elk, `/contact/` 31, `/informatie/` 28.

**Ankerteksten:** beschrijvend. Top-ankers zijn navigatielabels (bv. "Veelgestelde vragen" 391, "Bezorggebied" 329, regionamen 276-279, servicenamen 256-262, artikeltitels 131-138). Generieke ankers ("Lees meer", "hier", "Bekijk …"): **2 van 9.699**; de kaart-component rendert "Lees meer →" als `<span class="more">` binnen een `<a class="card">` waarvan de ankertekst het volledige kaartje (h3 + p) is (`common.py` r.247), dus de effectieve ankertekst is de titel + beschrijving. Minpunt: lange ankers (titel + 1-2 zinnen) en het logo-anker "L <Merk>" (256×).

**nofollow:** 0. `target="_blank"` komt alleen voor op `wa.me`-links (712 totaal, 4-8 per pagina) en heeft overal `rel="noopener"` (0 ontbrekend). Externe hosts: `wa.me` 712, `mailto:` 129, `www.rijksoverheid.nl` 29, `www.drugsinfo.nl` 10, `www.mondriaan.eu` 10, `www.vvgi.nl` 10, `www.trimbos.nl` 5 — exact de whitelist uit `_config.py` (`external`). **Broken interne links: 0**; enige niet-HTML doel is `/sitemap.xml` (vanaf `/sitemap/`).

---

## 7. HTML-semantiek

| Meting | Resultaat |
|---|---|
| H1 per pagina | **128 × exact 1**; 0 zonder, 0 meervoudig |
| H1 uniek | 128/128 |
| Overgeslagen kopniveaus | **0 pagina's** (bv. `/`: h1 › h2 › h2 › h3 …, 39 koppen; `/informatie/wat-is-lachgas/`: h1 › 7× h2 › 3× h3 (footer), 11 koppen) |
| Landmarks | `header` 128, `nav` 128 (2 op home, 3 op 101, 4 op 26 pagina's met inhoudsopgave), `main` 128 (`id="inhoud"`), `aside` 71 (plaatsen, tanks, contact, home: de "hero-card"), `footer` 128, `article` **0** |
| Skip-link | 128 × `<a class="skip" href="#inhoud">Direct naar inhoud</a>` als eerste body-element (`common.py` r.199) |
| `<img>` | 131 totaal, **0 zonder alt**, 128 met lege alt (decoratief productminiatuur in mobiel menu, `common.py` r.181), 3 met beschrijvende alt (productfoto), 131 met `width`+`height`, 131 `loading="lazy"`, 131 `decoding="async"` |
| aria | 1.790 attributen (gem. 14/pagina): `aria-label` op logo, Hoofdmenu, Mobiel menu, Kruimelpad, Inhoud, menu-summary, WhatsApp-float; `aria-current="page"` in kruimelpad, desktop-nav en mobiel menu; `aria-hidden="true"` op alle inline SVG's |
| `lang` | `nl` op 128/128 |
| Overig | 676 `<section>` (5,3/pagina), 481 `<details>` (FAQ + menu), 73 `<dl>`, 6 `<table>` (hubs + tankvergelijking) met `<thead>` maar **0 × `scope`** op 19 `<th>` |

**Kanttekeningen.**
- De 23 artikelen gebruiken `<div class="prose">` in een `<section>` i.p.v. `<article>`.
- De `<aside class="hero-card">` op plaatspagina's bevat een `<h2>` die vrijwel de H1 herhaalt ("… bezorgen in <Plaats>") — semantisch een extra h2 zonder eigen inhoud.
- Het kopniveau in de footer is `<h3>` (`common.py` r.214) na een `<h2>` in de CTA — correct, maar de footer-h3's zijn navigatiekoppen, geen inhoud.
- `seo_master.body_prov()` (r.435-438) repareert gericht het h1 › h3-gat op `/service/` en `/veelgestelde-vragen/` door kaart-h3 naar h2 te hertitelen; de gegenereerde HTML bevestigt dat er nu nergens niveaus worden overgeslagen.
- Desktop-nav zonder actief item op 78 pagina's (66 plaatsen + 12 services), zie §2.

---

## 8. Performance

**CSS.** Eén `<style>` per pagina met de volledige site-CSS (16.952 B, 4.443 B gzip; 128 × = 2,17 MB in de repo). Bron: `_build/site.css` (152 regels, 1 heel lange regel r.152 voor het menu-paneel) + 3 `@font-face` uit `fonts.css` + master-blok (`seo_master.py` r.28-49: reveal, pulse-ring, active-states, reduced-motion). Geen externe stylesheet, dus niets te cachen tussen pagina's (de SW cachet wel de hele HTML). Geen critical/non-critical split; bij 4,4 KB gzip is dat verdedigbaar. Minificatie: eenvoudige regex (`common.py` r.61-63).

**Fonts.** Eén self-hosted woff2 (`/fonts/manrope.woff2`, 22.580 B, magic `wOF2`), Latin-subset met `unicode-range` (3 declaraties voor gewichten 500/700/800 die **alle drie naar hetzelfde bestand** wijzen, `fonts.css`). Oorspronkelijk `font-display:swap` → door `apply_speed.py` r.34 omgezet naar **`optional`** (gemeten 384 = 3 × 128). Eén `<link rel="preload" as="font" crossorigin>` vóór de `<style>` (`apply_speed.py` r.38-42). Body-tekst gebruikt `system-ui`-stack (`site.css` r.5); alleen koppen en logo gebruiken het webfont (r.6, r.23). Geen `size-adjust`/fallback-metrics (de enige "size-adjust"-treffer is `-webkit-text-size-adjust`). Gevolg: nul font-CLS (optional + systeemfont voor body), maar bij een koude eerste load kunnen koppen in de fallback blijven staan; de SW precachet het font voor volgende bezoeken. Vercel-header `Cache-Control: public, max-age=31536000, immutable` op `/fonts/`.

**Afbeeldingen.** `assets/`: 3 × WebP productfoto (160×160 3.620 B, 300×400 10.786 B, 480×640 20.402 B), 3 × PNG icon (180/192/512), 1 × OG-PNG 1200×630 (64.825 B). Geen AVIF, geen JPG, geen hero-afbeelding (LCP is tekst → gunstig). In de HTML: 131 `<img>`, alle `.webp`, alle met `width`/`height`, `loading="lazy"`, `decoding="async"`; 3 met `srcset` (300w/480w) + `sizes` (`common.py` r.189; `pages.py` r.190 met `sizes="200px"`). 0 × `fetchpriority` en 0 image-preloads; de productfoto op `/lachgas-tanks/` en `/lachgas-tanks/2kg/` staat (op desktop) boven de vouw maar is toch `loading="lazy"`.

**Third-party.** **Nul.** Geen analytics, tag manager, chat-widget, maps, iframes, externe fonts of CDN's (grep op gtag/gtm/analytics/hotjar/clarity/facebook/matomo/plausible/cookiebot/iframe: 0 treffers buiten `_build/`). Alle externe hrefs zijn gewone links.

**Prefetch/prerender.** Speculation Rules uit de bron worden verwijderd; in plaats daarvan de eigen router in `nav.js` (hover 65 ms, pointerdown, touchstart, viewport-observer tot 16 links, respecteert `saveData`/2G). Geen `<link rel="prefetch">`/`dns-prefetch`/`preconnect`.

**Service worker.** Zie §1: statisch cache-first (extensie-regex), HTML stale-while-revalidate (limiet 150), precache van `/` + JS + font, versie-hash over alle html/js/css/woff2 (`seo_master.py` r.478-486), `Cache-Control: no-cache` op `/sw.js` (vercel.json). Nadeel van SWR op HTML: een bezoeker ziet na een deploy één keer de oude pagina.

**Totale payload eerste bezoek (plaatspagina):** HTML ≈ 10,5 KB gzip (incl. CSS + JSON-LD) + font 22,6 KB + nav.js 2,6 KB + site.js 1,3 KB + menu-miniatuur 3,6 KB ≈ **41 KB**; 1 render-blocking resource (de inline CSS), 0 render-blocking scripts (`defer`).

---

## 9. Styling & layout

- **Architectuur:** handgeschreven component-CSS (klassen als `.hdr`, `.hero-card`, `.card`, `.chips`, `.faq`, `.steps`, `.tbl`, `.mm-*`, `.pf-*`), geen utility-framework, geen BEM-notatie; `!important` 0×. 14 custom properties in `:root` (`site.css` r.2: `--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--line`, `--brand`, `--brand-2`, `--brand-soft`, `--dark`, `--wa`, `--wa-2`, `--radius`, `--max`) met 99 `var()`-gebruiken; merkkleuren worden per site via `COLORS` in `_site.py` r.30 in de CSS gesubstitueerd (`common.py` r.54-56). Daarnaast **541 inline `style=""`-attributen** (4,2/pagina) uit de generator (sticky aside `pages.py` r.113, `margin-top`/`text-align` in `pages.py` r.55/61/75, kolommen in `/sitemap/` r.251, header-flex `common.py` r.202) — een lek in de tokenaanpak.
- **Typografie:** `clamp()` voor h1/h2 (r.7-8), `rem` voor fontgroottes (88 treffers), `px` voor spacing/radius (232 treffers). Body 16px/1.6.
- **CLS-preventie:** alle `<img>` met `width`/`height`; `aspect-ratio` 0× (niet nodig door vaste afmetingen); font-CLS uitgesloten door `optional` + systeemfont; reveal-animatie werkt alleen met `opacity`/`transform` en alleen onder de vouw (`site-brabant.js` r.33); `.usp{margin-top:-28px}` overlapt de hero bewust.
- **Mobile-first:** 11 × `@media (min-width)` tegenover 1 × `max-width` (toc-kolommen, r.143). Breakpoints: 440, 640, 768, 800, 900, 960 px — zes verschillende, deels overlappend (768 vs 800, 900 vs 960); nav-switch op 900 (r.50), hero-grid op 960 (r.54), grids op 640/960 (r.92-93), footer/steps op 800 (r.117, r.136), `.two` op 900 (r.147).
- **Dark mode:** geen (`prefers-color-scheme` 0×); vaste `theme-color`.
- **Toegankelijkheid/stijl:** `prefers-reduced-motion` 1 blok (master-CSS: reveal, pulse-ring en `:active`-scale uit). `html{scroll-behavior:smooth}` (r.4) wordt **niet** teruggezet onder reduced-motion. Focus: alleen `.skip:focus`; geen `outline`-reset (browser-default focusring blijft zichtbaar, maar ook geen eigen `:focus-visible`-stijl op de donkere vlakken). Contrast (berekend): `--muted #78716c` op wit **4,80:1**, op `--bg` **4,60:1** (net AA voor normale tekst; gebruikt voor kaartteksten 15 px, `.pf-note` 12 px en `th` 12 px — krap); `--ink-2` 10,3:1; links `--brand` op wit 8,1:1; wit op `--wa` 5,0:1; kruimelpad (.55 wit op `#1c1917`) 6,1:1; footer-legal (.5) 5,2:1. `details`-menu heeft `aria-label` maar geen `aria-expanded` (native `details` regelt dat).
- **Layout-patronen:** `.wrap{max-width:1180px;padding:0 20px}`, `.narrow` 800 px, `.prose` 760 px; CSS Grid voor `.grid.g2/g3/g4`, `.two`, `.hero-grid`, `.usp`, `.steps`, `.ftr-grid`; flex voor nav/chips/CTA's; `position:sticky` header (r.21, met `backdrop-filter`) en sticky aside op desktop; `100dvh` en `:has()` in het menu-paneel (r.152) — moderne features zonder fallback (acceptabel voor een progressive-enhancement-menu). `.tbl-wrap{overflow-x:auto}` maakt tabellen horizontaal scrollbaar op mobiel.
- **Responsive images:** alleen de productfoto (3 varianten); de rest zijn SVG-iconen inline.

---

## 10. Hosting/deploy

**Configuratie.**
- `vercel.json` (gegenereerd door `seo_master.py` r.51-68 → r.566): `"trailingSlash": true`; headers op `/(.*)`: `Strict-Transport-Security: max-age=63072000; includeSubDomains` (geen `preload`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'` (geen `default-src`/`script-src`/`style-src` → beschermt alleen tegen clickjacking/base-injectie, niet tegen XSS; met volledig inline CSS zou een strikte CSP ook een nonce/hash vergen). Cache-Control: `/fonts/` 1 jaar immutable, `/assets/` 30 dagen + SWR 7 dagen, `/js/` 1 dag + SWR 7 dagen, `/sw.js` `no-cache`; **dode regels** voor `/img/` en `/images/` (mappen bestaan niet). Geen expliciete Cache-Control voor HTML (Vercel-default `public, max-age=0, must-revalidate`). Geen `cleanUrls` (niet nodig bij map/index.html), geen `redirects`, geen `rewrites`, geen `functions`.
- `.vercelignore`: `_build` (generator en content worden niet gedeployed). `.gitignore`: `__pycache__/`, `*.pyc`.
- `CNAME` (`lachgas-limburg.nl`): GitHub-Pages-artefact (`build.py` r.69); op Vercel zonder functie. Geen `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`.
- Compressie/CDN: niets geconfigureerd; Vercel comprimeert (gzip/brotli) en serveert via zijn edge automatisch.
- Geen `.github/`, geen CI; de gebouwde output staat **in de repo gecommit** naast de generator (build-artefacten en bron in dezelfde commit).

**Build-pijplijn (`_build/build.py`).** Databron = Python-modules met dicts (plaatsen: 5 `areas_*.py` met 12-14 items, sleutels `slug, name, kind, region, gemeente, title, description, h1, lead, intro, wijken, levertijd, faq, nearby, lat, lon`; hubs: `hubs.py` 5 items; artikelen 7+7+9 + 2 `TOPIC_HUBS`; services 8+4; FAQ 5 thema's; `core.py` HOME/AREA_INDEX; `tanks_legal.py` TANKS/TERMS/PRIVACY). `_build/content/BRIEF.md` (100 regels) is de redactionele briefing voor de contentmodules, `_config.py` de whitelist van toegestane interne/externe links. Templates zijn Python-functies, geen Jinja. Drie opeenvolgende passes schrijven dezelfde HTML (render → `apply_speed` → `seo_master`), elk met regex op de output; `levertijd.py` (r.5-9) herschrijft bovendien elke tijdsaanduiding van de vorm "X tot Y minuten" in alle html/txt/xml/json naar één vaste waarde en verwijst naar mappen `basis_fix/` en `levertijd_img/` die in deze repo niet bestaan (dode paden, r.20-33). `common.py` r.11-46 bevat nog de volledige defaults van de zustersite (domein, merk, e-mail, IndexNow-sleutel) die door `configure()` worden overschreven; `seo_master.py` kent een tweede configuratiepad (`sites.py`, r.496-501) dat hier niet bestaat en valt terug op `site.json`.

**Git-geschiedenis.** 1 commit op `main` (ook `origin/main`), 25 okt 2026 01:02 +0200, 181 bestanden / 12.297 insertions: hele generator, alle content, alle 128 HTML-bestanden, assets, `sitemap.xml` (130 regels), `llms.txt` (139), `llms-full.txt` (6.022), `vercel.json` (88), `sw.js` (45), `js/nav.js` (114), `js/site.js` (54). Geen latere wijzigingen, geen tags, werkboom schoon.

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Volledig statische, framework-loze output met minimale JS**: 128 pagina's, 9,9 KB JS (3,9 KB gzip) als `defer`, geen hydration, geen enkele third-party request; een plaatspagina weegt ~41 KB gzip inclusief font (§1, §8).
2. **Interne-linkarchitectuur is meetbaar uitstekend**: max. klikdiepte 2 voor alle 127 indexeerbare pagina's, 0 orphans, 0 broken links, hub ↔ detail wederzijds gekoppeld, kruimelpad in HTML én JSON-LD op 126/127 pagina's, slechts 2 generieke ankerteksten op 9.699 (§6).
3. **Head/meta en sitemap zijn volledig consistent**: 100% unieke titles (≤ 60) en descriptions (115-160), self-referencing canonicals op 127/127, sitemap = exact de indexeerbare set, noindex-404 buiten sitemap, charset als eerste element, één font-preload en geen preconnects (§3, §5).
4. **Semantiek en toegankelijkheid in de basis op orde**: precies 1 H1 op 128/128, 0 overgeslagen kopniveaus, header/nav/main/footer-landmarks + skip-link op elke pagina, 0 afbeeldingen zonder alt, SVG's `aria-hidden`, reduced-motion gerespecteerd in CSS én JS (§7, §9).
5. **Doordachte performance-laag**: self-hosted Latin-subset woff2 met `font-display:optional` + systeemfont voor body (nul font-CLS), `width`/`height` op alle `<img>`, WebP met srcset, service worker met build-hash en SWR voor HTML, intent-based prefetch-router in plaats van Speculation Rules (§8).

**Top 5 zwakke punten / fouten**
1. **Datumbug in alle 23 Article-schema's**: `dateModified 2026-10-03` ligt vóór `datePublished 2026-10-24` door een bij import gebonden defaultwaarde (`common.py` r.138 `modified=TODAY`); drie verschillende hardgecodeerde "vandaag"-datums (`common.py` r.34, `_site.py` r.27, `seo_master.py` r.21) (§4).
2. **Sitemap-lastmod waardeloos**: 127 × dezelfde datum `2026-10-18`, ouder dan de build (24 okt) en de commit (25 okt), omdat `seo_master.py` r.547-549 de door `build.py` geschreven datum overschrijft (§5).
3. **Structured data met beperkte opbrengst en een paar wringende keuzes**: FAQPage op 98 pagina's (geen rich results meer), LocalBusiness zonder straatadres/geo maar met 24/7-openingstijden en `sameAs` → wa.me, Product zonder `offers`, hetzelfde `@id` als `LocalBusiness` én `Organization` (§4).
4. **Bouwproces is fragiel**: drie regex-passes over de gegenereerde HTML, gebouwde output in git zonder CI, dubbele configuratie (`_site.py` + `site.json`), dode codepaden (`levertijd.py` basis_fix/levertijd_img, `sites.py`), dode Vercel-headers (`/img/`, `/images/`), GitHub-Pages `CNAME` op Vercel, IndexNow-sleutel zonder ping (§5, §10).
5. **Front-end-afwerking**: 541 inline `style=""`-attributen naast een tokensysteem, zes inconsistente breakpoints, `--muted` op 4,6-4,8:1 ook voor 12 px-tekst, geen `:focus-visible`-stijlen, `scroll-behavior:smooth` niet uit bij reduced-motion, desktop-nav zonder actief item op 78 pagina's omdat plaatsen onder `/lachgas-bezorgen/` en hubs onder `/bezorggebied/` staan, geen `<article>`, `<th>` zonder `scope` (§2, §7, §9).

## SCORETABEL

| # | Onderdeel | Score | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **5** | Pure SSG, 128 statische pagina's, 9,9 KB JS deferred zonder hydration, SW en router als progressive enhancement. |
| 2 | URL-architectuur | **4** | Lowercase/koppeltekens, max 2 segmenten, trailing slash consistent en afgedwongen, canonicals kloppen; minpunt: hubs en details in twee losse naamruimten en geen redirect-laag. |
| 3 | Head & meta | **4** | Vaste head-volgorde, 100% unieke titles/descriptions binnen de lengtes, OG/Twitter compleet; hreflang en geo-tags zijn ballast en 66 titels volgen één rigide sjabloon. |
| 4 | Structured data | **3** | Nette @id-koppeling en per-plaats GeoCoordinates, maar dateModified < datePublished op alle artikelen, drie conflicterende datums, 98 × FAQPage zonder opbrengst, adresloze LocalBusiness. |
| 5 | Crawl & indexatie | **4** | robots/sitemap/canonicals/noindex volledig consistent, llms.txt + llms-full.txt aanwezig; lastmod identiek en verouderd, IndexNow-sleutel zonder ping, geen feed/verificatie. |
| 6 | Interne links | **5** | Klikdiepte max 2, 0 orphans, 0 broken, gem. 12,6 unieke contextuele doelen, kruimelpad HTML+LD, beschrijvende ankers (2 generieke op 9.699). |
| 7 | HTML-semantiek | **4** | 1 H1 overal, 0 kopsprongen, landmarks en skip-link op 128/128, alt compleet; geen `<article>`, `th` zonder scope, aside-h2 herhaalt H1. |
| 8 | Performance | **5** | 4,4 KB gzip inline CSS, één gesubset font met `optional` + preload, WebP met afmetingen/srcset, nul third-party, SW met versie-hash en intent-prefetch. |
| 9 | Styling & layout | **4** | Tokens + mobile-first component-CSS zonder framework, reduced-motion en CLS goed afgedekt; 541 inline styles, 6 breakpoints, krappe muted-contrasten, geen dark mode/focus-visible. |
| 10 | Hosting/deploy | **3** | Goede security- en cache-headers via vercel.json en trailingSlash; maar dode headerregels, zwakke CSP, HSTS zonder preload, CNAME-restant, geen CI, build-artefacten gecommit, drie regex-passes met hardgecodeerde datums. |

## KERNGETALLEN

| Kengetal | Waarde |
|---|---|
| HTML-pagina's | **128** (127 indexeerbaar + `404.html`); 66 plaats, 5 hub, 25 informatie (23 artikelen + 2 thema-hubs), 12 service, 5 FAQ-thema's, 3 product, 5 indexen, 7 overige |
| Totale JS | **9.881 B** (`js/nav.js` 6.950 + `js/site.js` 2.931), gzip 3.869 B; plus `sw.js` 2.292 B (953 B gzip) |
| Totale CSS | **16.952 B inline per pagina** (4.443 B gzip); 2.169.856 B over alle 128 pagina's; 0 externe stylesheets |
| JSON-LD types | **12** verschillende (354 blokken; BreadcrumbList 126, FAQPage 98, Service 83, Article 23, ItemList 11, WebPage 5, Product 3, CollectionPage 2, LocalBusiness/WebSite/ContactPage/AboutPage 1) |
| Max. klikdiepte | **2** (alle links; 49 pagina's op diepte 1, 77 op 2); 3 bij uitsluitend `<main>`-links |
| Orphans | **0** (alleen `/404.html`, bewust noindex); 2 pagina's (`/over-ons/`, `/sitemap/`) uitsluitend via footer/menu bereikbaar |
| Pagina's zonder / met meervoudige H1 | **0 / 0** (128 × precies 1) |
| `<img>` zonder alt | **0** van 131 (128 lege alt = decoratief, 3 beschrijvend) |
| Unieke `<title>` | **100%** (128/128); 0 > 60 tekens; descriptions 100% uniek, 0 > 160 |
| Git | 1 commit (25 okt 2026), 181 bestanden, 12.297 regels |

## Bijlage: concrete reparaties (bestand + regel)

1. `_build/common.py` r.138: `def article_schema(title, desc, path, modified=None)` en in de body `modified or TODAY` gebruiken, zodat `dateModified` de geconfigureerde datum krijgt in plaats van de bij import gebonden `2026-10-03`.
2. Eén datumbron: `TODAY` alleen in `_build/content/_site.py` r.27 definiëren en vanuit `_build/master/seo_master.py` r.21 (en r.196, r.549) via `site.json`/`SITECFG` lezen; of `lastmod` per pagina afleiden uit de git-datum van het contentbestand.
3. `_build/master/seo_master.py` r.547-549: de lastmod-overschrijving schrappen (of alleen zetten als de pagina daadwerkelijk gewijzigd is), zodat de sitemap niet 127 identieke, verouderde datums krijgt.
4. `_build/pages.py` r.66/83/102/126/168/185/200/209/217/239/275: `C.faq_schema(...)` alleen behouden waar het inhoudelijk nodig is, of helemaal laten vervallen (bespaart ~1-1,5 KB per pagina zonder SERP-verlies).
5. `_build/common.py` r.106-115: `LocalBusiness` → `Organization` (of `Service`) als er geen fysiek bezoekadres is; `openingHoursSpecification` en `priceRange` weglaten; `sameAs` leeg laten tot er echte profielen zijn.
6. `_build/common.py` r.198: actieve nav-status bepalen op basis van de sectie (bv. `/lachgas-bezorgen/` → "Bezorggebied", `/service/` → eigen nav-item of "Informatie"), of plaatsen onder `/bezorggebied/<regio>/<plaats>/` plaatsen zodat URL en kruimelpad samenvallen (vereist dan wel redirects).
7. `_build/site.css` r.4: `scroll-behavior:smooth` binnen `@media (prefers-reduced-motion:no-preference)` zetten; een `:focus-visible`-stijl toevoegen voor `.btn`, `.chip`, `.card`, `.nav a`; `--muted` iets donkerder (bv. `#6b655f` ≈ 5,6:1) voor de 12 px-teksten.
8. `_build/master/seo_master.py` r.62-63: headerregels voor `/img/` en `/images/` verwijderen; HSTS `preload` toevoegen als het domein wordt aangemeld; `build.py` r.69 `CNAME` alleen schrijven als GitHub Pages echt wordt gebruikt.
9. IndexNow: na de build (of in een deploy-hook) een POST naar `https://api.indexnow.org/indexnow` met de 127 sitemap-URL's en de sleutel uit `_site.py` r.31; nu is het keybestand dood gewicht.
10. `_build/fonts.css`: de drie `@font-face`-regels samenvoegen tot één declaratie met `font-weight:500 800` als het bestand een variabel font is (zelfde URL voor alle gewichten), anders aparte bestanden per gewicht.
