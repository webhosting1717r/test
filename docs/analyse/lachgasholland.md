# Analyse repo `lachgasholland` — technische SEO, architectuur en front-end

Repo: `/home/user/lachgasholland` (git, 11 commits, 2026-10-13 t/m 2026-10-27). Statische site (181 HTML-bestanden) + Python-generator in `_build/`. Analyse van zowel de gegenereerde output als de generator. Alle cijfers zijn gemeten met grep/find/wc en het meetscript `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/measure_holland.py` (uitvoer in `measure_output.txt` in dezelfde map); contrastwaarden met `contrast.py`.

---

## 1. Stack & rendering

**Generator.** Eigen Python-SSG zonder externe dependencies (alleen stdlib): `_build/build.py` (98 regels), `_build/common.py` (344 regels: config, componenten, schema's, renderer), `_build/pages.py` (~330 regels: paginabouwers per type), content als Python-modules in `_build/content/*.py` (5.340 regels in 22 bestanden). Geen `package.json`, geen Tailwind, geen templating-engine: HTML wordt opgebouwd met `%`-stringformatting (`common.py:325-335`, functie `render()`).

**Vier bouwpassen** (`build.py:45-94`):
1. `P.Site(**c).build_all()` → lijst pagina-dicts (`path`, `title`, `description`, `body`, `schemas`, `robots`, `priority`, `changefreq`) → `C.render()` schrijft `pad/index.html` (`build.py:59-63`).
2. `sitemap.xml`, `robots.txt`, `CNAME`, `favicon.svg`, `manifest.webmanifest`, IndexNow-keybestand, `llms.txt`, `llms-full.txt` (`build.py:64-83`).
3. `_build/speed/apply_speed.py` ("snelheidslaag"): fonts van gstatic naar self-hosted, `font-display:swap`→`optional`, preconnect weg, preload toegevoegd, Speculation Rules verwijderd, `/js/site.js` + `/js/nav.js` ingevoegd vóór `</body>`, `sw.js` met hash-versie (`apply_speed.py:23-91`). Roept eerst `levertijd.py` aan, dat tekstuele tijdsbanden in alle HTML/TXT/XML/JSON herschrijft (`levertijd.py:5-9`).
4. `_build/master/seo_master.py` ("master-standaard", 30 KB): parseert elke `<head>` en bouwt die opnieuw in vaste volgorde, herschrijft titels volgens conventie, trimt descriptions op 160, herbouwt alle JSON-LD, voegt master-CSS toe, overschrijft `vercel.json`, `.vercelignore`, sitemap-lastmod, llms-titels en sw-versie (`seo_master.py:402-470`, `apply_cfg`).

**Rendering: 100% SSG, nul hydration.** Elke pagina is volledig server-side klaar. JS raakt de inhoud niet aan (alleen reveal-animatie, menu sluiten, SW-registratie, soft navigation).

**Meetwaarden output (181 HTML-bestanden, excl. `_build/`):**

| meting | waarde |
|---|---|
| HTML-bestanden | 181 (180 `…/index.html` + `404.html`) |
| totaal HTML-bytes | 8.498.865 |
| gemiddelde / mediaan | 46.955 / 46.495 bytes |
| min / max | 37.116 (`/404.html`) / 69.762 (`/`) |
| gzip gemiddeld per pagina | 10.613 bytes (22–24% van raw) |
| woorden in `<main>` gem. / mediaan | 751 / 698 |
| `/` | 1.704 woorden, 69.762 bytes |
| `/lachgas-bezorgen/amsterdam/` | 671 woorden, 46.700 bytes |
| `/informatie/wat-is-lachgas/` | 1.036 woorden, 46.657 bytes |
| `/bezorggebied/utrecht/` | 924 woorden |
| `/404.html` | 63 woorden (enige pagina < 300 woorden) |

Opbouw homepage: head 23.537 bytes (waarvan inline CSS 16.952 en JSON-LD 4.024), body 46.218 bytes waarvan **19.192 bytes inline SVG-iconen** (het WhatsApp-icoonpad wordt ~10× per pagina herhaald; 6.915 `<svg>` in de hele site = 38 per pagina) en **9.815 bytes mobiel menu** (`<details class="menu">` met 34 links, op elke pagina in de DOM, ook desktop).

**JS (totaal 12.173 bytes raw, 4.822 gzip):**

| bestand | bytes | gzip | functie |
|---|---|---|---|
| `js/nav.js` | 6.950 | 2.550 | Soft-navigation router: prefetch bij `pointerdown`/`touchstart`/`mouseover` (65 ms) en bij in-beeld-komen (IntersectionObserver, max 16 links, `requestIdleCallback`), `fetch` + `DOMParser`, vervangt `<main>`, `header`, `footer`, synct `title`, `description`, `robots`, `canonical`, `og:url`; eigen LRU-cache van 60 pagina's; progress-bar; respecteert `saveData`/2g (`nav.js:5-7, 44-68, 89-111`). |
| `js/site.js` | 2.931 | 1.319 | Scroll-reveal (`.rv`/`.in`, uit bij `prefers-reduced-motion`, vangnet na 8 s), `details.menu` sluiten na navigatie, SW-registratie alleen op https (`site.js:5-53`). |
| `sw.js` | 2.292 | 953 | Service worker (zie §8). |

Beide scripts staan `defer` vlak vóór `</body>` (`apply_speed.py:50`). Geen inline scripts behalve JSON-LD (521 blokken). Geen `<noscript>`. Identiek aan de bronnen in `_build/speed/` (gecontroleerd met `cmp`).

**Service worker:** aanwezig (`/sw.js`, versie `c75bd16862` = sha1-hash van alle html/js/css/woff2, `apply_speed.py:81-90`).

---

## 2. URL-architectuur

- **Slugs:** uitsluitend lowercase, koppeltekens, geen datums, ID's, underscores of hoofdletters (0 afwijkingen gemeten). Voorbeelden: `/lachgas-bezorgen/alphen-aan-den-rijn/`, `/lachgas-bezorgen/s-hertogenbosch/`, `/informatie/is-lachgas-legaal-in-nederland/`.
- **Diepte:** max 2 segmenten. Verdeling: 1 × 0 segmenten (`/`), 11 × 1 segment (hubs: `/bezorggebied/`, `/lachgas-tanks/`, `/informatie/`, `/service/`, `/veelgestelde-vragen/`, `/over-ons/`, `/contact/`, `/algemene-voorwaarden/`, `/privacy/`, `/sitemap/`, `/404.html`), 169 × 2 segmenten. Detailpagina's hangen onder zes directories: `/lachgas-bezorgen/` (112), `/bezorggebied/` (12), `/informatie/` (25), `/service/` (12), `/veelgestelde-vragen/` (5), `/lachgas-tanks/` (3).
- **Opvallend:** provincie-hubs staan onder `/bezorggebied/<slug>/` maar plaatsen onder `/lachgas-bezorgen/<slug>/` (`pages.py:6`, `AREA_DIR`) — de URL-boom volgt dus niet de breadcrumb-hiërarchie (Home › Bezorggebied › Noord-Holland › Amsterdam). Dit is bewust (keyword in pad) maar betekent dat `/bezorggebied/utrecht/` en `/lachgas-bezorgen/utrecht/` beide bestaan (provincie vs. stad).
- **Trailing slash:** 180/180 pagina's als `map/index.html`; `vercel.json:2` `"trailingSlash": true` → Vercel 308-redirect van `/pad` naar `/pad/`. Alle interne hrefs eindigen op `/` (0 hrefs naar `.html`). Enige losse file: `404.html`.
- **Hoofdletters:** geen.
- **Redirects:** geen `redirects`/`rewrites`/`cleanUrls` in `vercel.json`; geen `_redirects`, `netlify.toml`, meta-refresh (0 gevonden). `/pad/index.html` blijft als bestand bereikbaar (geen cleanUrls) — gedekt door self-canonical, maar niet geredirect.
- **Canonicals:** 180/180 indexeerbare pagina's hebben een absolute, self-referencing canonical (`common.py:326`, herbouwd door `seo_master.py:313`); 100% gelijk aan sitemap-`<loc>`. `404.html` heeft bewust geen canonical/hreflang (`seo_master.py:312`: `if not noindex`).
- **Paginering:** geen (hubs tonen alles op één pagina; `/informatie/` 59 KB, `/bezorggebied/` 56 KB).
- **404:** `/404.html` met `<meta name="robots" content="noindex, follow">`, titel `Pagina niet gevonden | …`, 6 chips naar hoofdsecties + CTA (`pages.py`, `not_found()`), niet in sitemap (`sitemap=False`). Vercel serveert een root-`404.html` automatisch met status 404. Geen 410-mechanisme.

---

## 3. Head & meta

**Volgorde in `<head>` (identiek op alle 181 pagina's, afgedwongen door `seo_master.py:300-345` `build_head`):** `charset` → `viewport` → `title` → `description` → `robots` → `canonical` → `hreflang nl` → `hreflang x-default` → `og:type/site_name/locale/title/description/url/image/image:width/image:height/image:alt` → `twitter:card/title/description/image/image:alt` → `theme-color` → `geo.region` → `geo.placename` → `icon svg` → `icon ico` → `apple-touch-icon` → `manifest` → `preload font` → `<style>` → 2–4 × `ld+json`. Charset staat op byte 37, direct na `<head>` (byte 31).

**Title** (gemeten over alle 181):

| | waarde |
|---|---|
| min / gem / max lengte | 25 / 46,6 / 60 tekens |
| > 60 tekens | 0 (master trimt: `seo_master.py:230-252`, `new_title`, grens 60) |
| < 30 tekens | 2 (`Sitemap \| Lachgas Holland`, `Contact \| Lachgas Holland`) |
| uniek | **181/181 (100%)** |
| eindigt op `\| <merk>` | 144; bevat merk 147; 34 zonder merk (bijv. hubs `Lachgas bezorgen in Friesland \| Leeuwarden, Drachten, Sneek`, artikelen `Wat is lachgas? Uitleg over …`) |

Patroon: plaatspagina's `Lachgas <Plaats> bestellen | <merk>` (afgedwongen `seo_master.py:238-242`), provincies `Lachgas bezorgen in <Provincie> | <steden>`, artikelen `<kop> | <merk>` tenzij > 60. Home: `<merk> | Lachgas bestellen, bezorgd via WhatsApp` (`site.json:13`). H1 ≠ title-kern op 157 pagina's (bewust gevarieerd).

**Description:** min 115 / gem 148,8 / max 155; 0 boven 160 (`trim_desc`, `seo_master.py:88-100`), 0 leeg, **181/181 uniek**.

**Overig:**
- `robots`: 180 × `index, follow, max-image-preview:large`, 1 × `noindex, follow` (404).
- Open Graph compleet incl. `og:image:alt` (181), `og:url` (180, niet op 404); `og:type` 158 × `website`, 23 × `article`. Twitter `summary_large_image` compleet (5 tags). OG-afbeelding: één sitebrede `assets/og-lachgas-holland.png`, 1200×630 (gemeten), 123 KB, PNG.
- hreflang: `nl` + `x-default`, self-referencing op 180 pagina's — technisch correct maar overbodig voor een ééntalige site.
- `<html lang="nl">` 181/181; `inLanguage` in JSON-LD `nl-NL`.
- Favicons: `favicon.svg` (168 bytes, gegenereerd `build.py:40-42`), `favicon.ico` (322 bytes, 1 icoon 16×16 PNG-in-ICO), `apple-touch-icon.png` 180×180, `manifest.webmanifest` (id/start_url/scope `/`, `display standalone`, iconen 192 + 512 aanwezig), `theme-color #1c1917`.
- `viewport` 181/181, `width=device-width, initial-scale=1`.
- **Preconnect/dns-prefetch: 0** (gstatic-preconnect verwijderd door `apply_speed.py:36`). **Preload: 181 × `/fonts/manrope.woff2` as=font crossorigin.** Geen image-preload (er is geen hero-afbeelding).
- `geo.region`/`geo.placename` (legacy meta, harmloos).
- Geen `google-site-verification`, geen `msvalidate`.

---

## 4. Structured data

**Gegenereerd** in `common.py:106-150` (schema-bouwstenen) en per paginatype in `pages.py` (`schemas=[…]`), daarna **volledig herbouwd** door `seo_master.py:160-210` (`fix_schema`, `rebuild_schemas`): vaste volgorde hoofdentiteit → ItemList → BreadcrumbList → FAQPage, `provider`/`publisher` genormaliseerd, `Product.offers` verwijderd, `WebPage` krijgt `isPartOf` + `dateModified`.

**Telling per `@type` (521 blokken op 180 pagina's, gem. 2,88 per pagina, max 4):**

| @type | aantal | waar |
|---|---|---|
| BreadcrumbList | 179 | alle pagina's behalve `/` en `/404.html` |
| FAQPage | 151 | 527 vragen totaal, gem. 3,5 per blok |
| Service | 136 | 112 plaatsen + 12 provincies + 12 servicepagina's |
| Article | 23 | `/informatie/<artikel>/` |
| ItemList | 18 | hubs (`/bezorggebied/`, provincies, `/informatie/`, thema-hubs, `/service/`, `/lachgas-tanks/`) |
| WebPage | 5 | thema-hubs, `/algemene-voorwaarden/`, `/privacy/`, `/sitemap/` |
| Product | 3 | `/lachgas-tanks/{2kg,4kg,10kg}/` |
| CollectionPage | 2 | `/informatie/`, `/service/` |
| LocalBusiness, WebSite, AboutPage, ContactPage | 1 elk | `/`, `/`, `/over-ons/`, `/contact/` |

**12 verschillende types.** Geen `@graph`; losse `<script>`-blokken. Koppeling via `@id`: `https://lachgasholland.nl/#business` (LocalBusiness) en `…/#website` (WebSite) worden gedefinieerd op `/` en gerefereerd vanuit `Service.provider` (136×, als ingebed object met `@id`+`name`+`url`+`telephone`, `seo_master.py:124`), `Article.publisher` (23×, Organization met `@id` + logo), `WebSite.publisher`, `WebPage/CollectionPage/AboutPage/ContactPage.isPartOf` (9×), `AboutPage/ContactPage.mainEntity`. Geen `aggregateRating`, geen `Review`, geen `offers` (0 gemeten). 0 JSON-parsefouten.

**Markup die Google niet (meer) als rich result toont:**
- **FAQPage op 151 pagina's** — sinds augustus 2023 toont Google FAQ-rich-results alleen voor overheids-/gezondheidssites; hier dus 151 blokken (gem. ~1,5 KB) zonder SERP-effect.
- **Service (136×)** heeft geen rich-result-type.
- **Product zonder `offers`** (verwijderd door master, `seo_master.py:179`) kwalificeert niet voor product-snippets; wel eerlijker dan lege offers.
- **Article**: `datePublished: 2026-10-12`, **`dateModified: 2026-10-03` — gewijzigd vóór gepubliceerd, op alle 23 artikelen.** Oorzaak: `common.py:138` `def article_schema(…, modified=TODAY)` bindt het default-argument aan `TODAY = "2026-10-03"` (`common.py:34`) bij import; `configure()` zet later `TODAY = "2026-10-12"` (`_site.py:27`) maar dat raakt het al gebonden default niet. `seo_master.fix_schema` corrigeert `dateModified` alleen voor `WebPage`-types (`seo_master.py:191`), niet voor `Article`.
- **Drie verschillende "vandaag"-constanten**: `common.py:34` (2026-10-03), `_site.py:27` (2026-10-12), `seo_master.py:21` (2026-10-18). Output bevat daardoor 23 × `dateModified 2026-10-03` en 9 × `2026-10-18`.

**Mogelijk misleidend / dun:**
- `LocalBusiness` zonder straatadres of `addressLocality`; `addressRegion: "Nederland"` (een land, geen regio), `areaServed Country`; `telephone +447441484283` (Brits nummer voor een NL-dienst); `openingHoursSpecification` 00:00–23:59 alle dagen; `sameAs` wijst naar `wa.me/…` (geen sociaal profiel). Voor Google's LocalBusiness-rich-results is een fysiek adres vereist; dit is feitelijk een Organization.
- `Service.areaServed` op plaatspagina's krijgt `GeoCoordinates` van de plaats (`pages.py`, `place_page`), niet van een vestiging — correct gebruikt.

**Volledig voorbeeld — `/lachgas-bezorgen/amsterdam/` (3 blokken, FAQ ingekort tot 1 van 3 vragen):**

```json
{"@context":"https://schema.org","@type":"Service",
 "name":"Lachgas bezorgen in Amsterdam",
 "description":"Lachgas bestellen in Amsterdam? Lachgastanks 2KG, 4KG en 10KG verzegeld bezorgd van Noord tot Zuidoost, meestal binnen 15 tot 25 minuten. Alleen 18+.",
 "url":"https://lachgasholland.nl/lachgas-bezorgen/amsterdam/",
 "serviceType":"Lachgas bezorgservice",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgasholland.nl/#business","name":"Lachgas Holland","url":"https://lachgasholland.nl/","telephone":"+447441484283"},
 "areaServed":{"@type":"City","name":"Amsterdam","geo":{"@type":"GeoCoordinates","latitude":52.373,"longitude":4.893}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/447441484283","name":"WhatsApp"}}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgasholland.nl/"},
 {"@type":"ListItem","position":2,"name":"Bezorggebied","item":"https://lachgasholland.nl/bezorggebied/"},
 {"@type":"ListItem","position":3,"name":"Noord-Holland","item":"https://lachgasholland.nl/bezorggebied/noord-holland/"},
 {"@type":"ListItem","position":4,"name":"Amsterdam","item":"https://lachgasholland.nl/lachgas-bezorgen/amsterdam/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Bezorgen jullie ook in Amsterdam-Noord en op IJburg?",
  "acceptedAnswer":{"@type":"Answer","text":"Ja, beide horen bij ons bezorggebied en krijgen dezelfde indicatie als de rest van de stad. …"}},
 "… (3 vragen totaal)"]}
```

Homepage `LocalBusiness` bevat verder: `alternateName ["lachgasholland.nl"]`, `logo` (ImageObject 512×512), `image` (OG-PNG), `email`, `priceRange "€€"`, `currenciesAccepted`, `paymentAccepted`, `contactPoint` (customer service, `url wa.me`, `availableLanguage ["nl"]`). `WebSite` heeft géén `potentialAction/SearchAction` (er is geen zoekfunctie — correct weggelaten).

---

## 5. Crawl & indexatie

**`robots.txt` (volledig):**
```
User-agent: *
Allow: /

Sitemap: https://lachgasholland.nl/sitemap.xml
```
Geen disallows, geen AI-bot-regels, geen `Crawl-delay`.

**`sitemap.xml`** (29.294 bytes, enkel bestand, geen index): **180 URL's**, allemaal met trailing slash en absolute `https://`-host. Per URL `<lastmod>`, `<changefreq>`, `<priority>`:
- `lastmod`: **180 × `2026-10-18`** — één waarde voor alles, gezet door `seo_master.py:449` (`re.sub` naar `TODAY`). Niet echt: `git log` toont dat 174 paginabestanden voor het laatst op **2026-10-27** zijn gewijzigd (commit `a857a88`), de sitemap zelf op 2026-10-19. Lastmod is dus zowel uniform als verouderd → zoekmachines zullen het negeren.
- `changefreq`: 126 × weekly, 54 × monthly. `priority`: 1 × 1.0 (`/`), 15 × 0.9, 131 × 0.8, 29 × 0.7, 1 × 0.6, 3 × 0.3 (`/privacy/`, `/algemene-voorwaarden/`, `/sitemap/`). Beide signalen negeert Google.
- **Consistentie:** 180/180 sitemap-URL's hebben een bestaand bestand én een identieke canonical; 0 noindex-pagina's in de sitemap; enige bestand buiten de sitemap is `/404.html` (bewust). Alle sitemap-URL's zijn ook bereikbaar via interne links (zie §6).
- Geen aparte image-/news-sitemap (niet nodig: 3 webp's).

**HTML-sitemap** `/sitemap/` (50 KB, 377 woorden, alle 180 URL's gegroepeerd, link naar `/sitemap.xml`), prioriteit 0.3.

**RSS/Atom:** geen (0 feeds, geen `<link rel="alternate" type="application/rss+xml">`).

**IndexNow:** `9c3f6a1d8e2b4057a6c1d9e3f5b7a204.txt` in de root (32 bytes, inhoud = bestandsnaam), gegenereerd uit `_site.py:31` `INDEXNOW_KEY` via `build.py:73`. **Geen ping-code**: `grep -ri indexnow _build/` vindt alleen de constante; geen aanroep naar `api.indexnow.org`/Bing. De key wordt dus nooit gebruikt.

**llms.txt** (46.723 bytes, 192 regels): kop, blurb, link naar `llms-full.txt`, 180 regels `- [title](url): description`, contactblok (`build.py:75-83`). **llms-full.txt** (856.733 bytes, 8.691 regels): platte tekst van elke `<main>` (`common.py:338-344`, `page_text`). Beide worden door de master gesynchroniseerd met de definitieve titels (`seo_master.py:451-463`).

**Google-verificatie:** geen meta-tag, geen `google*.html`-bestand. **Noindex in sitemap:** 0. **Meta robots vs. robots.txt:** consistent.

---

## 6. Interne links

**Navigatiestructuur (per pagina, identiek sitewide):**
- Header (`common.py:197-204`): logo (`/`), 5 hoofdnav-links (`NAV`, `common.py:70-71`: Bezorggebied, Lachgas tanks, Informatie, Veelgestelde vragen, Contact — **géén `/service/`**), WhatsApp-knop (extern), `<details class="menu">` met mobiel menu-paneel: 4 tegels + 1 productkaart + 4 groepen met 6/13/4/5 links + WA-knop = **34 links** (`mobile_menu`, `common.py:174-184`; `MM_GROUPS` uit `_site.py:32-35`). Header totaal **41 `<a>`**.
- Footer (`common.py:207-218`): logo, WA, mailto, 3 kolommen met **13 + 8 + 11** links (12 provincies + "Alle plaatsen"; 2 thema-hubs + 4 artikelen + 2 hubs; 4 + 4 service + tanks/over-ons/contact), 3 juridische links → **38 `<a>`**. Plus zwevende WA-knop (1).
- **43 unieke interne doelen staan op élke pagina** (header+footer). Dat is ~80 `<a>` sitewide tegenover gemiddeld **13,6 unieke interne links in `<main>`** (min 2 op `/sitemap/`-achtige, max 178 op `/sitemap/`).

**Totalen:** 17.989 `<a>` (gem. 99,4 per pagina); unieke interne links per pagina gem. 48,6 (min 43, mediaan 47, max 181 op `/sitemap/`). 0 kapotte interne links (alle 180 doelen bestaan).

**Breadcrumbs:** HTML `<nav aria-label="Kruimelpad"><ol class="crumbs">` met `aria-current="page"` op het laatste item (`common.py:221-225`) op alle 179 subpagina's, gespiegeld in `BreadcrumbList` JSON-LD (179). Plaatspagina: Home › Bezorggebied › Provincie › Plaats (4 niveaus).

**Hub ↔ detail:**
- `/bezorggebied/` → 12 provinciekoppen (`<h2><a>`) + chips naar alle 112 plaatsen (`area_index`).
- Provincie-hub → chips naar eigen plaatsen (Utrecht: 13 chips) + gemeententabel + "Andere provincies"-chips naar de 11 andere + `/bezorggebied/` (`region_page`).
- Plaatspagina → breadcrumb naar provincie, "In de buurt"-chips (3 nearby-plaatsen + "Heel <provincie>"), 3 productkaarten (`place_page`). Voorbeeld Amsterdam: amstelveen, zaandam, haarlem, noord-holland.
- Artikel → `<nav class="toc">` (bij ≥ 4 secties), "Gerelateerde onderwerpen"-chips (4 artikelen + `/informatie/`), notice-box met link naar `/contact/` (`article_page`).
- Servicepagina → FAQ + "Gerelateerde pagina's"-chips; FAQ-topic → chips naar andere topics + related.
- Home → 12 provinciekaarten, 12 stadschips, 3 producten, 6 info-kaarten, 4 servicekaarten (55 `<a>`, 46 uniek in main).

**Klikdiepte (BFS over alle interne hrefs vanaf `/`, script `measure_holland.py`):** bereikt **180/181**; verdeling **diepte 0: 1, diepte 1: 56, diepte 2: 123; max = 2**. Geen pagina op diepte ≥ 3. Enige onbereikbare: `/404.html` (bewust). BFS uitsluitend via `<main>`-links (zonder header/footer): bereikt 178, verdeling 0:1 / 1:44 / 2:132 / 3:1; alleen `/over-ons/` en `/sitemap/` hangen uitsluitend aan de footer.

**Wezen (orphans):** 0 indexeerbare pagina's zonder inkomende link; `/404.html` 0 inlinks (correct).

**Inkomende links (unieke bronpagina's):** min 3, gem 48,6, max 181. Zwakste: `/lachgas-bezorgen/dordrecht/` en `/hilversum/` (3), 10 plaatsen met 4 (tiel, delfzijl, dokkum, woerden, steenwijk, emmeloord, den-helder, urk, katwijk, …). Hub `/service/` krijgt slechts **13 inlinks** (niet in hoofdnav of footer; alleen via breadcrumbs van servicepagina's en `/sitemap/`), terwijl `/over-ons/`, `/sitemap/`, `/privacy/`, `/algemene-voorwaarden/` elk 181 krijgen via de footer. 181 pagina's linken naar 4 vaste artikelen (`footer_info`, `build.py:57`) → sterke maar willekeurige boost van `articles[:4]`.

**Ankerteksten:** beschrijvend; top: "veelgestelde vragen" (551), "lachgas tanks" (548), "contact" (546), provincienamen (383–397), "zakelijk bestellen" (372). Generieke ankers ("lees meer", "klik hier", …): **3 van 16.406** interne ankers. Kaarten (`cards()`, `common.py:241-248`) zijn één `<a class="card">` rond `<h3>` + `<p>` + `<span class="more">` → de volledige kaarttekst is ankertekst (lange, soms 40+ woorden ankers).

**nofollow:** 0. **Externe links:** 1.023 × `wa.me` (alle `target="_blank" rel="noopener"`), 28 × rijksoverheid.nl, 14 × drugsinfo.nl, 9 × jellinek.nl, 2 × trimbos.nl — zonder `rel`/`target` (zelfde tab, gevolgd). Whitelist in `_build/content/_config.py` (`external`).

---

## 7. HTML-semantiek

| meting | waarde |
|---|---|
| H1 per pagina | **181 × exact 1** (0 zonder, 0 meervoudig); 181 unieke H1-teksten |
| overgeslagen kopniveaus | **0** (body-brede volgorde h1→h2→h3 gecontroleerd per pagina) |
| totaal koppen | h1 181, h2 1.035, h3 1.004, h4–h6 0 |
| `<header>` / `<main>` / `<footer>` | 181 × precies 1 |
| `<nav>` | > 1 op alle pagina's (Hoofdmenu, Mobiel menu, Kruimelpad, optioneel Inhoud) — elk met eigen `aria-label` |
| `<aside>` | 117 pagina's (hero-card op plaats-, tank-, contactpagina's en home) |
| `<article>` | **0** (artikelen gebruiken `<div class="prose">`) |
| `<section>` | 6–10 per pagina, elk met h1/h2 (0 sections zonder kop op voorbeeldpagina) |
| skip-link | 181 × `<a class="skip" href="#inhoud">` → `<main id="inhoud">` |
| `role=` | 0 (alleen native landmarks) |
| `aria-label` | 1.111 (≈ 6/pagina: logo, menu-summary, 3–4 navs, WA-float) |
| `aria-current="page"` | 262 (nav + breadcrumb + mobiel menu) |
| `aria-hidden="true"` | 1.123 (alle decoratieve inline SVG's) |
| `<details>` | 708 (FAQ-accordeons, eerste `open`; mobiel menu) — werkt zonder JS |
| `<img>` | **184** op 181 pagina's: 0 zonder `alt`-attribuut, **181 × `alt=""`** (decoratieve productthumbnail in het mobiele menu, `common.py:181`), 3 × beschrijvende alt (productfoto op `/`, `/lachgas-tanks/`, `/lachgas-tanks/2kg/`) |
| `<table>` | 13 (12 provincie-hubs + `/lachgas-tanks/`), met `<thead>`, `<th>` zonder `scope`, geen `<caption>`, in `.tbl-wrap` (overflow-x) |
| `lang` | `nl` 181/181 |

Opmerkingen: kopvolgorde op plaatspagina: h1 → h2 (hero-card, dupliceert H1-tekst) → h2 → h3×3 → h2 → h2 → h2 (CTA) → footer h3×3. Op `/service/` en `/veelgestelde-vragen/` promoveert de master kaart-`<h3>` naar `<h2>` (`seo_master.py:395-398`, `body_prov`). `<summary aria-label="Menu openen">` zonder zichtbaar label (alleen icoon). Geen `<form>`, geen `<button>` (alles is `<a>`).

---

## 8. Performance

**CSS-strategie:** volledig **inline critical = alle CSS**. Bron `_build/site.css` 15.318 bytes (+ `fonts.css` 1.056) → geminificeerd (`_minify_css`, `common.py:61-63`) + master-blok → **16.952 bytes `<style>` per pagina, exact 1 blok op elke pagina**, 0 externe stylesheets. Over 181 pagina's = 3.068.312 bytes CSS die nooit gecached wordt (wel gzip → ~4,1 KB). Inline `style=""`-attributen: 795 totaal (4,4 per pagina; o.a. header-flexwrapper `common.py:202`, `margin-top:22px;text-align:center`).

**Fonts:**
- Self-hosted: `fonts/manrope.woff2` **22.580 bytes** (niet verder comprimeerbaar: gzip 22.617), één bestand voor 3 `@font-face`-blokken (weights 500/700/800 → variabel font), Latin-subset via `unicode-range U+0000-00FF,…` (`fonts.css`).
- `font-display: optional` (door `apply_speed.py:34` van `swap` gewijzigd) + `<link rel="preload" as="font" crossorigin>` op elke pagina → geen FOIT/FOUT, geen CLS; bij trage eerste load valt het font weg en blijft `system-ui`.
- **Geen `size-adjust`/`ascent-override` fallback-font** (gemeten: enige `size-adjust` is `-webkit-text-size-adjust`). Body-tekst gebruikt `system-ui`-stack (`site.css:5`), Manrope alleen voor koppen/logo/USP (`site.css:6,23,103,126`).
- Cache: `/fonts/(.*)` → `public, max-age=31536000, immutable` (`vercel.json:33-41`).

**Afbeeldingen:** in totaal 8 rasters/vectors in de repo: 3 × WebP (productfoto 480×640 = 20,4 KB, 300×400 = 10,8 KB, 160×160 = 3,6 KB), 4 × PNG (OG 1200×630 = 123 KB, icon-512 7 KB, icon-192 2,4 KB, apple-touch 2,3 KB), 1 × SVG favicon. **Geen AVIF, geen JPG, geen hero-afbeelding** (LCP is tekst/hero-card). Alle 184 `<img>`: `width`+`height` (184/184), `loading="lazy"` (184/184), `decoding="async"` (184/184); `srcset`+`sizes` op 3 (`300w, 480w`; `sizes="(min-width: 768px) 300px, 70vw"` resp. `200px`); `fetchpriority` 0; `<picture>` 0. Iconen zijn inline SVG (38/pagina, ~19 KB op home). Cache: `/assets/(.*)` 30 dagen + SWR 7 dagen.

**Third-party:** **geen** — 0 analytics/gtag/GTM, 0 chat-widgets, 0 maps, 0 externe scripts of stylesheets; enige externe domeinen in hrefs zijn `wa.me` en 4 overheids-/voorlichtingssites.

**Prefetch/prerender:** `<script type="speculationrules">` wordt in `common.py:309` toegevoegd en in `apply_speed.py:43` weer **verwijderd** (0 in output); `rel=prefetch/prerender` 0. In plaats daarvan doet `nav.js` intent-prefetch (hover 65 ms, touch, viewport-IO max 16) met in-memory cache van 60 pagina's en soft navigation (vervangt `<main>`/header/footer). Risico: de router synct wel `title`/`description`/`robots`/`canonical`/`og:url`, maar **niet JSON-LD of hreflang** (irrelevant voor crawlers, wel voor client-side tooling).

**Service worker (`sw.js`):** precache `["/","/js/site.js","/js/nav.js","/fonts/manrope.woff2"]`; `skipWaiting` + `clients.claim`; statische extensies (`woff2|css|js|webp|png|jpe?g|svg|ico|avif|webmanifest`) **cache-first** (`sw.js:22-29`); HTML-navigaties **stale-while-revalidate** met eigen `pages-<versie>`-cache, max 150 pagina's (`PAGE_LIMIT`, FIFO-trim), offline-fallback naar `/` (`sw.js:31-44`). Versie = hash van alle html/js/css/woff2 → oude caches worden bij activate verwijderd. `sw.js` zelf `Cache-Control: no-cache` (`vercel.json:78-86`). Consequentie: terugkerende bezoekers zien na een deploy één keer de oude HTML (SWR), en de statische cache-first-strategie zonder revalidatie betekent dat een gewijzigde `/js/nav.js` pas na een nieuwe SW-versie ververst.

**Gewicht per paginaweergave (koud):** HTML ~10,6 KB gzip + font 22,6 KB + JS 4,8 KB gzip + favicon.svg ≈ 38 KB; geen render-blocking externe resources.

---

## 9. Styling & layout

**CSS-architectuur:** eigen stylesheet, "geen framework" (`site.css:1`). Hybride: component-klassen (`.hdr`, `.hero-card`, `.phead`, `.card`, `.chips`, `.faq`, `.steps`, `.tbl`, `.pf`, `.mm-*`) + enkele utilities (`.wrap`, `.narrow`, `.sr`, `.g2/.g3/.g4`, `.two`). Geen BEM-notatie, geen utility-framework.

**Design tokens:** 14 custom properties in `:root` (`site.css:2`): `--bg --surface --ink --ink-2 --muted --line --brand --brand-2 --brand-soft --dark --wa --wa-2 --radius --max`. Merkkleuren worden per site overschreven via `COLORS` in `_site.py:30` en `configure()` (`common.py:54-57`, regex op `:root`), gecontroleerd in output: `--brand:#1e4fb8;--brand-2:#3b7ae0;--brand-soft:#e8eefb`. Typografie met `clamp()` (`h1: clamp(2rem,5vw,3.25rem)`), `system-ui`-stack voor body.

**CLS-preventie:** `width`/`height` op alle `<img>`; `img,svg{display:block;max-width:100%;height:auto}`; sticky header met vaste `min-height:66px`; `font-display:optional` (geen font-swap-shift); **geen `aspect-ratio`** (niet nodig bij vaste dimensies), **geen size-adjust-fallback**. Reveal-animatie werkt met `opacity/transform` (geen layout), alleen onder de vouw (`site.js:5-7`).

**Mobile-first:** 11 × `@media(min-width: …)` (440/640/768/800/900/960 px) tegenover 1 × `max-width` (`.toc ol{columns:1}` ≤ 640) → consistent mobile-first. Desktop-nav pas vanaf 900 px (`site.css:50`), daaronder `<details>`-menu. `100dvh`, `overscroll-behavior:contain`, `body:has(.menu[open])` (moderne CSS zonder fallback — `:has()` niet in oudere browsers, gevolg beperkt tot zichtbare WA-knop).

**Dark mode:** **geen** (`prefers-color-scheme` 0×). `theme-color` vast `#1c1917`.

**Toegankelijkheid:**
- Contrast (berekend, `contrast.py`): alle gemeten paren ≥ AA. `--muted #78716c` op `--bg` 4,60:1 (krap AA), op wit 4,80:1; `--ink-2` 9,85:1; links `--brand` op wit 7,33:1; wit op `--wa` 5,02:1; crumbs 55% wit op donker 6,07:1; footer-legal 50% wit 5,23:1; `.cta p` 95% wit op groen 4,70:1 (de master verhoogde dit van .85, `seo_master.py:50`).
- **Focus:** enige focus-regel is `.skip:focus{left:8px}`; geen `outline:none` (0×) → browser-standaard focusringen blijven intact, maar ook geen eigen `:focus-visible`-stijl op knoppen/kaarten/chips.
- `prefers-reduced-motion: reduce` schakelt reveal, pulserende WA-ring en `:active`-schaal uit (`seo_master.py:38`) en de JS-reveal (`site.js:24`); **`html{scroll-behavior:smooth}` (`site.css:4`) valt er niet onder.**
- Skip-link, landmarks, `aria-current`, `aria-hidden` op iconen (zie §7). `<summary>` alleen icoon + `aria-label`.
- `.sr`-klasse gedefinieerd maar niet gebruikt in output (0×).
- Print: alleen `.rv` reset (`@media print`), geen print-stylesheet.

**Responsive images:** alleen de productfoto (3 van 184 img's) heeft `srcset/sizes`; de menu-thumbnail is vast 56×56 met een 160 px-bron (2,9× DPR-reserve).

**Layout-patronen:** `.wrap{max-width:1180px;padding:0 20px}`, `.narrow` 800 px, `.prose` 760 px, CSS Grid overal (`.grid g2/g3/g4`, `.two`, `.hero-grid 1.1fr .9fr`, `.ftr-grid 1.4fr 1fr 1fr 1fr`, `.usp` 2→4 kolommen), `position:sticky` voor header en zijkaart (`top:84px`), `backdrop-filter` op header, `columns:2` voor toc/sitemap-lijsten.

---

## 10. Hosting / deploy

**Configbestanden:** `vercel.json` (1.931 bytes, gegenereerd door `seo_master.py:53-69` `VERCEL`-dict, `write` op regel 467), `.vercelignore` (`_build`), `CNAME` (`lachgasholland.nl`, GitHub-Pages-stijl relict, door Vercel genegeerd). Geen `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`, `.github/workflows`. Geen CI: de output-HTML is **gecommit** en wordt als statische Vercel-deploy geserveerd; de build draait lokaal.

**Headers (`vercel.json:3-32`, alle paden):**
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` (geen `preload`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'` — **geen `default-src`/`script-src`/`style-src`**; de inline `<style>` en JSON-LD zouden een strikte CSP ook bemoeilijken zonder nonces/hashes.

**Cache-Control:** fonts 1 jaar immutable; `/img/`, `/images/` (bestaan niet in deze repo), `/assets/` 30 d + SWR 7 d; `/js/` 1 d + SWR 7 d; `/sw.js` no-cache. **Geen regel voor HTML, `sitemap.xml`, `robots.txt`, `favicon.*`, `manifest.webmanifest`, `llms*.txt`** → Vercel-default (`public, max-age=0, must-revalidate` + ETag).

**Compressie/CDN:** niet geconfigureerd; Vercel levert automatisch Brotli/gzip en edge-caching. Geen `cleanUrls`; `trailingSlash: true`.

**Build-pijplijn (`python3 _build/build.py`):** content-modules → `pages.py` → `common.render` → speed-pas → master-pas (zie §1). Datamodel: dicts per paginatype (`HOME`, `HUBS`, `AREAS`, `ARTICLES`, `SERVICE_PAGES`, `FAQ_TOPICS`, `TANKS`, `TOPIC_HUBS`, …), gebundeld door `load_content()` (`build.py:16-32`). Dubbele paden worden met `assert` afgevangen (`build.py:53-55`). Idempotentie: speed- en master-pas zijn ontworpen als herhaalbaar (`/*master*/…/*master-end*/`-marker, `seo_master.py:355`).

**Reproduceerbaarheid:** de build in deze repo is **niet zelfstandig herhaalbaar** zonder waarschuwingen: `levertijd.py` verwijst naar `_build/speed/basis_fix/<domein>.json` en `levertijd_img/` (ontbreken, gracieus), `apply_speed.py` naar `site-template.js` (ontbreekt, alleen nodig voor family `stad`), `seo_master.py` naar `sites.py` (ontbreekt; fallback `site.json` aanwezig), `content/BRIEF.md` naar `../p3/BRIEF_TEMPLATE.md` (buiten repo). Drie hardgecodeerde datums (§4). `_build/content/_config.py` bevat een whitelist van toegestane interne links en externe domeinen (gebruikt door een niet-meegeleverde validator).

**Git-geschiedenis:** 11 commits, allemaal auteur `Claude <noreply@anthropic.com>`:
- `fd60086` 2026-10-13 initiële site (235 bestanden, +15.983 regels)
- `2677e43`, `dd22db5`, `c4e74f9` 2026-10-17, `64f4923` 10-20, `0c7eb27` 10-21, `4791399` 10-22, `cefa1e5`, `a857a88` 10-27: **7 commits wisselen uitsluitend het telefoonnummer** (185–187 bestanden, ±190 regels elk; heen-en-weer tussen vier nummers, uiteindelijk +44)
- `4d28c84` 2026-10-19 master-standaard (192 bestanden, +1.393/−594: `vercel.json` toegevoegd, head/schema herbouwd), `642c842` 10-19 (1 regel in `_build/master`)

Elke nummerwissel raakt ~185 gegenereerde bestanden omdat het nummer in `wa.me`-links (10×/pagina) én JSON-LD staat; `sitemap.xml` werd daarbij niet bijgewerkt.

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Pure SSG zonder hydration en met minimale JS**: 181 pagina's volledig server-side, in totaal 12,2 KB JS (4,8 KB gzip), 0 third-party scripts, 0 externe stylesheets, gem. 10,6 KB gzip per HTML-pagina; LCP is tekst.
2. **Vlakke, consistente architectuur**: max klikdiepte 2 (56 pagina's op 1, 123 op 2), 0 wezen, 0 kapotte links, 100% unieke titles/descriptions/H1, 180/180 self-referencing canonicals identiek aan de sitemap, uniforme trailing slash via `vercel.json`.
3. **Semantiek en toegankelijkheid als norm**: 181/181 exact één H1, 0 overgeslagen kopniveaus, header/main/footer/skip-link/`aria-current` op elke pagina, FAQ en menu via native `<details>` (werken zonder JS), alle gemeten kleurparen ≥ WCAG AA, `prefers-reduced-motion` gerespecteerd.
4. **Doordachte snelheidslaag**: self-hosted variabel font-subset (22,6 KB) met preload + `font-display:optional`, alle CSS inline, alle `<img>` met dimensies/lazy/async, intent-based prefetch-router met soft navigation, service worker met gehashte versie en SWR voor pagina's.
5. **"Master-standaard" als idempotente build-pas**: één script (`seo_master.py`) dwingt head-volgorde, titelconventie, description-trim, schema-normalisatie (`@id`-koppeling `#business`/`#website`), master-CSS en `vercel.json` af over meerdere sites; plus `llms.txt`/`llms-full.txt` en IndexNow-keybestand uit dezelfde pijplijn.

**Top 5 zwakke punten / fouten**
1. **Article-datumbug**: alle 23 artikelen hebben `dateModified: 2026-10-03` vóór `datePublished: 2026-10-12`, door default-argument-binding in `common.py:138` en drie verschillende `TODAY`-constanten (`common.py:34`, `_site.py:27`, `seo_master.py:21`).
2. **Sitemap-lastmod onbruikbaar**: 180 × identiek `2026-10-18`, terwijl 174 pagina's op 2026-10-27 zijn gewijzigd; IndexNow-key aanwezig maar geen ping-code; geen RSS; geen Search-Console-verificatie in de repo.
3. **Structured data zonder rendement en een dunne hoofdentiteit**: FAQPage op 151 pagina's en Service op 136 leveren geen rich results op; `LocalBusiness` zonder straat/plaats (`addressRegion: "Nederland"`), 24/7-openingstijden, `+44`-nummer en `sameAs` naar `wa.me` — feitelijk een Organization en vatbaar voor "misleading markup"-beoordeling.
4. **Linkverdunning en scheve interne autoriteit**: ~80 sitewide links per pagina (34-link mobiel menu op desktop in de DOM, 38 footerlinks) tegenover 13,6 contextuele; `/service/`-hub niet in nav/footer (13 inlinks) terwijl `/privacy/`, `/algemene-voorwaarden/`, `/sitemap/` 181 krijgen; plaatspagina's hebben maar 3–4 inlinks; 4 willekeurige artikelen (`articles[:4]`) krijgen footer-links op alle 181 pagina's.
5. **Build-/deploy-hygiëne**: 17 KB CSS en ~19 KB inline SVG per pagina (3,1 MB CSS over de site, niet cachebaar); CSP zonder `script-src`/`default-src`; geen Cache-Control voor HTML/sitemap/favicons; build verwijst naar vijf ontbrekende bestanden/mappen; 7 van 11 commits zijn telefoonnummer-wissels over ~185 bestanden; `scroll-behavior:smooth` niet achter reduced-motion; geen `:focus-visible`-stijlen; geen dark mode.

## SCORETABEL

| # | Onderdeel | Score | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **5** | Pure SSG, nul hydration, 12,2 KB JS totaal, 10,6 KB gzip per pagina, SW met gehashte versie. |
| 2 | URL-architectuur | **5** | Lowercase-koppelteken-slugs, max 2 segmenten, uniforme trailing slash, 180/180 self-canonicals gelijk aan sitemap, nette noindex-404. |
| 3 | Head & meta | **5** | Vaste head-volgorde, 100% unieke titles (25–60) en descriptions (115–155), OG/Twitter compleet met alt, iconen/manifest/preload; hreflang overbodig maar correct. |
| 4 | Structured data | **3** | Goede `@id`-koppeling en 0 parsefouten, maar dateModified < datePublished op 23 artikelen, 151 FAQPage-blokken zonder SERP-effect, LocalBusiness zonder adres met buitenlands nummer. |
| 5 | Crawl & indexatie | **4** | Robots/sitemap/llms consistent en volledig, maar lastmod uniform en verouderd, IndexNow-key ongebruikt, geen feed/verificatie. |
| 6 | Interne links | **4** | Diepte 2, 0 wezen, beschrijvende ankers (3 generieke op 16.406), breadcrumbs HTML+JSON-LD; maar ~80 sitewide vs 13,6 contextuele links en `/service/`-hub ondergelinkt. |
| 7 | HTML-semantiek | **5** | 181× exact één H1, 0 kopsprongen, landmarks + skip-link + aria op elke pagina, alt-beleid consistent; alleen `<article>` en `th scope` ontbreken. |
| 8 | Performance | **5** | Geen third-party, inline CSS, self-hosted font optional+preload, alle img's gedimensioneerd/lazy, prefetch-router + SW; kanttekening: 17 KB CSS + 19 KB SVG per pagina en SWR-staleness. |
| 9 | Styling & layout | **4** | Tokens, mobile-first (11 min-width vs 1 max-width), AA-contrast overal, reduced-motion; geen dark mode, geen `:focus-visible`, `scroll-behavior:smooth` ongeguard, geen size-adjust. |
| 10 | Hosting/deploy | **4** | Sterke security-headers en cache-regels voor assets, trailingSlash, `_build` uitgesloten; maar minimale CSP, geen HTML-cacheregel, build niet reproduceerbaar uit de repo, git-log gedomineerd door nummerwissels. |
| | **Gemiddeld** | **4,4** | |

## KERNGETALLEN

| kengetal | waarde |
|---|---|
| HTML-pagina's | **181** (180 indexeerbaar + `404.html`) |
| totale JS-bytes | **12.173** raw / 4.822 gzip (`nav.js` 6.950, `site.js` 2.931, `sw.js` 2.292) |
| totale CSS-bytes | **16.952 inline per pagina** (bron `site.css` 15.318 + `fonts.css` 1.056; ×181 = 3.068.312 in output); 0 externe CSS |
| JSON-LD @types | **12** (521 blokken; BreadcrumbList 179, FAQPage 151, Service 136, Article 23, ItemList 18, WebPage 5, Product 3, CollectionPage 2, LocalBusiness/WebSite/AboutPage/ContactPage 1) |
| max klikdiepte | **2** (0: 1 / 1: 56 / 2: 123) |
| wezen (orphans) | **0** (alleen `/404.html` bewust ongelinkt) |
| pagina's zonder / met meervoudige H1 | **0 / 0** |
| img zonder alt | **0** (184 img; 181 × `alt=""` decoratief, 3 × beschrijvend) |
| % pagina's met unieke title | **100%** (181/181; descriptions eveneens 100%) |
| sitemap-URL's / lastmod-waarden | 180 / 1 (`2026-10-18`) |
| gem. HTML-grootte / gzip | 46.955 / 10.613 bytes |
| gem. woorden in `<main>` | 751 (mediaan 698) |
| git-commits / auteurs | 11 / 1 (2026-10-13 → 2026-10-27) |

---

## Bijlage A — metingen per paginatype

| directory | pagina's | gem. HTML raw | gem. gzip | schema-combinatie (meest voorkomend) |
|---|---|---|---|---|
| `/lachgas-bezorgen/<plaats>/` | 112 | 46.508 | 10.390 (22%) | Service + BreadcrumbList + FAQPage (112×) |
| `/bezorggebied/<provincie>/` + index | 13 | 50.908 | 11.218 (22%) | Service + ItemList + BreadcrumbList + FAQPage (12×); index: ItemList + BreadcrumbList + FAQPage |
| `/informatie/<artikel>/` + hubs + index | 26 | 47.300 | 11.251 (24%) | Article + BreadcrumbList (23×); thema-hubs: WebPage + ItemList + BreadcrumbList + FAQPage (2×); index: CollectionPage + ItemList + BreadcrumbList |
| `/service/<dienst>/` + index | 13 | 45.463 | 10.647 (24%) | Service + BreadcrumbList + FAQPage (12×); index: CollectionPage + ItemList + BreadcrumbList |
| `/veelgestelde-vragen/<topic>/` + index | 6 | 48.552 | — | BreadcrumbList + FAQPage (6×) |
| `/lachgas-tanks/<maat>/` + index | 4 | 46.287 | — | Product + BreadcrumbList + FAQPage (3×); index: ItemList + BreadcrumbList + FAQPage |
| overig (`/`, `/over-ons/`, `/contact/`, `/privacy/`, `/algemene-voorwaarden/`, `/sitemap/`, `/404.html`) | 7 | 37.116–69.762 | — | home: LocalBusiness + WebSite + FAQPage; contact: ContactPage + BreadcrumbList + FAQPage; over-ons: AboutPage + BreadcrumbList; juridisch/sitemap: WebPage + BreadcrumbList; 404: geen |

Sitewide linkinventaris per pagina (uit `index.html`): header 41 `<a>` (logo 1 + nav 5 + WA 1 + mobiel menu 34), footer 38 `<a>` (logo, WA, mailto, 13 + 8 + 11 kolomlinks, 3 juridisch), zwevende WA-knop 1 → 80 `<a>`, 43 unieke interne doelen. Daarbovenop `<main>`: home 55 `<a>` (46 uniek), plaatspagina ~15–20, artikel ~20.

## Bijlage B — reproductie

Alle cijfers in dit rapport zijn te herhalen met:

```
python3 -I /tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/measure_holland.py /home/user/lachgasholland https://lachgasholland.nl
python3 -I /tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/contrast.py
```

`measure_holland.py` doet achtereenvolgens: bestandsinventaris en groottes; woorden in `<main>`; title/description-lengtes en duplicaten; head-tags; JSON-LD-parsing en typetelling (incl. `@id`-koppelingen); H1-telling en kopvolgorde; landmarks/aria; `<img>`-attributen; interne/externe links, ankerteksten, nofollow; BFS-klikdiepte vanaf `/` over alle interne hrefs én een tweede BFS die alleen `<main>`-links volgt; orphan-detectie; sitemap-vergelijking met bestanden en canonicals; inline-CSS/JS-metingen en gzip. De ruwe uitvoer staat in `measure_output.txt` naast het script.

Aanvullende losse metingen (bash): `wc -c` + `gzip -9 -c | wc -c` voor JS/CSS/font; `file` voor afbeeldingstypes; Python-header-parsing voor PNG/WebP-afmetingen; `git log --stat --date=short`; `grep -c`/`grep -o` voor tabellen, `@font-face`, `:root`, `datePublished/dateModified`, IndexNow- en RSS-verwijzingen.

Bronverwijzingen in dit rapport (pad:regel) verwijzen naar de generatorbestanden onder `/home/user/lachgasholland/_build/` en de gegenereerde HTML in de repo-root; de repo is niet gewijzigd.
