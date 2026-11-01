# Technische analyse — repo `lachgasantwerpen`

- Repo: `/home/user/lachgasantwerpen` (git, branch `main`, remote `github.com/webhosting1717r/lachgasantwerpen`, 23 commits, 2026-09-03 t/m 2026-10-22)
- Analysedatum: 2026-11-01; alleen gelezen, niets gewijzigd.
- Methode: `find`/`grep`/`wc`/`gzip` plus twee meetscripts in het scratchpad:
  `metrics_lachgasantwerpen.py` (head/meta/semantiek/JSON-LD/links/afbeeldingen over alle 125 HTML-bestanden) en
  `bfs_lachgasantwerpen.py` (BFS-klikdiepte, orphans, kapotte links, hub-dekking).
- Let op: alle HTML is geminifieerd; de volledige `<head>` (incl. inline CSS en alle JSON-LD-blokken) staat per pagina op **regel 4**. Regelverwijzingen naar HTML zijn daardoor grof; naar `.js`/`.json`/`.css` zijn ze exact.

---

## 0. Inventaris

| Onderdeel | Meting |
|---|---|
| Bestanden (excl. `.git`) | 153 |
| HTML-bestanden | 125 (124 `*/index.html` + `/404.html`) |
| Mappen met pagina's | `bezorggebied/` (1 hub + 60 detail), `lachgas-informatie/` (1 hub + 30 detail), `veelgestelde-vragen/` (1 hub + 5), `product/` (5), 21 losse pagina's op niveau 1, `index.html`, `sitemap/` |
| JS | `js/nav.js` 6.950 B, `js/site.js` 6.202 B, `sw.js` 2.321 B |
| CSS in repo | `css/tailwind.css` 23.936 B, `css/site.css` 4.951 B — **door geen enkele HTML gerefereerd** (0 `<link rel="stylesheet">` in 125 pagina's) |
| Fonts | `fonts/inter.woff2` 36.272 B, `fonts/plusjakartasans.woff2` 23.500 B |
| Afbeeldingen | `img/*.webp` (3: 160×160 / 300×400 / 480×640), `assets/img/*-infographic.webp` 1536×1024 (193.632 B), `assets/img/*-infographic.jpg` 1536×1024 (784.353 B), `assets/img/og-*.jpg` 1200×630 (62.253 B) |
| Config/overig | `vercel.json`, `.vercelignore` (inhoud: `_build`), `.nojekyll` (0 B), `CNAME`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `llms.txt` (32.831 B), `llms-full.txt` (601.511 B), `2c4e6a8b0d1f3a5c7e9b1d3f5a7c9e2b.txt` (IndexNow-sleutel), favicons/iconen |
| Totaal HTML | 8.549.067 B ruw; 1.769.768 B gzip (gem. 14.158 B gzip per pagina) |
| Totaal niet-HTML | 1.849.856 B |

---

## 1. Stack & rendering

**Bevindingen**

- **Puur statische site, geen generator in de repo.** Er is geen `package.json`, `build.py`, `Makefile`, templates-map of CI-workflow (`ls .github` → geen). `.vercelignore` bevat uitsluitend `_build` (toegevoegd in commit `16ff513`, 2026-10-19), wat aangeeft dat er lokaal een buildmap `_build/` bestaat die bewust niet wordt gedeployed en **nooit is gecommit** (`git log --all -S'_build'` → alleen die ene regel in `.vercelignore`).
- Indirect bewijs voor een externe generator die meerdere "stadssites" bedient:
  - `sw.js` regel 1: `/* … Versie wisselt per build. */`, regel 2 `var VERSION = "f6fde9c356";` — de VERSION-hash veranderde in 8 commits (`e5123b3401` → `1a87f64c2c` → `c67be91b28` → `1de02346c3` → `e7ee8dba9f` → `f6fde9c356` → `a8e2ae6702` → `f6fde9c356`; de laatste is identiek aan die van 2 commits eerder, dus het is een inhoudshash, geen tijdstempel).
  - Commit `620631b`: "9 nieuwe kennisbankartikelen (Rotterdam 7)… (Rotterdam 3)… in dezelfde volgorde als de zustersites"; commit `16ff513`: "infographic-hero gelijkgetrokken met de andere stadssites".
  - Elke "nummerwissel"-commit raakt 127–128 bestanden met exact 444–460 regels +/−: gegenereerde output, geen handwerk.
  - Header en footer zijn byte-identiek op resp. 83 en 122 pagina's (md5 over `<header>…</header>`/`<footer>…</footer>`); de 8 headervarianten verschillen alleen in actieve-staat-klassen (zie §7).
- **Rendering: 100% SSG/pre-rendered, geen hydration, geen framework.** Alle inhoud staat in de HTML; JS is progressive enhancement.
  - HTML-grootte: gem. 68.393 B, mediaan 68.272 B, min 54.549 B (`/404.html`), max 116.385 B (`/index.html`). Hiervan is per pagina exact **31.168 B inline CSS** (`<style>` op regel 4), dus de "echte" HTML is ~37 KB (bv. `/bezorggebied/berchem/index.html`: 68.661 B → 37.478 B zonder `<style>`; gzip 13.973 B → 7.485 B).
  - Woorden in `<main>` (tekst, zonder scripts): min 41 (`/404.html`), gem. 738, mediaan 675, max 1.294. Drie voorbeelden: `/index.html` 1.294, `/bezorggebied/berchem/` 637, `/product/lachgas-tank-2kg/` 695 (extra: `/lachgas-informatie/wat-is-lachgas/` 836, `/veelgestelde-vragen/bezorgen/` 890).
- **JavaScript** (totaal 15.473 B ruw, 5.962 B gzip; beide pagina-scripts `defer`, onderaan `<body>`: `index.html` regel 555, `berchem/index.html` regel 239):
  - `js/site.js` (6.202 B / 2.448 B gzip): header-schaduw bij scroll (r. 6-12), mobiel menu met `aria-expanded` en focus op sluitknop (r. 13-20), lazy aangemaakte lightbox met `role="dialog" aria-modal` (r. 21-41), event-delegatie zodat alles na een soft-navigatie blijft werken (r. 42-50), "reveal"-animatie met IntersectionObserver die **uitstaat bij `prefers-reduced-motion`** (r. 69-70) en een vangnet na 8 s (r. 88), jaartal-vulling, en registratie van de service worker alleen op https/localhost (r. 97-99).
  - `js/nav.js` (6.950 B / 2.550 B gzip): eigen client-side router: prefetch bij `pointerdown`/`touchstart`/`mouseover` (65 ms) en bij in-beeld-komen (max 16 links, `requestIdleCallback`, r. 89-111), LRU-cache van 60 pagina's (r. 5, 21), `fetch` + `DOMParser` en vervanging van `<main>`, header, footer, `#site-nav`, `#mobile-panel` (r. 44-68); synct `title`, `meta description`, `robots`, `canonical` en `og:url` (r. 48-52). Respecteert `saveData`/2g (r. 6-7), modifier-keys en `target` (r. 12, 78). **Niet gesynct: de JSON-LD-blokken in `<head>`** (irrelevant voor crawlers, die de router niet draaien).
  - Inline script: op alle 125 pagina's exact één 71-byte inline script (`document.getElementById("year").textContent = new Date().getFullYear();`), hoewel `site.js` r. 93 dit ook al doet (dubbel).
- **Service worker** `sw.js`: precache van `/`, beide JS-bestanden en beide fonts (r. 4); statische extensies cache-first (r. 22-30); HTML stale-while-revalidate met limiet 150 pagina's (r. 5, 31-44); offline-fallback naar `/` (r. 42); `skipWaiting` + `clients.claim` (r. 7, 12). Versie-bump per build ruimt oude caches op (r. 9-13).
- Geen `<noscript>`, geen third-party scripts (grep op gtm/gtag/analytics/hotjar/clarity/plausible/… → 0 treffers; de enige hit "intercom" is het woord "intercommunale" in lopende tekst).

**Oordeel:** uitstekende output-kwaliteit voor een statische site, maar de bron (generator, templates, data) ontbreekt volledig in de repo — de site is in deze vorm niet reproduceerbaar.

---

## 2. URL-architectuur

- **Slug-conventie:** 100% lowercase, koppeltekens, geen datums of ID's, geen uppercase (BFS-script: 0 paden met hoofdletters over 9.555 `<a href>`), geen underscores. Voorbeelden: `/bezorggebied/antwerpen-centrum/`, `/lachgas-informatie/lachgaswet-belgie-2024/` (het jaartal is onderdeel van het onderwerp, geen datumstempel).
- **Diepte:** max **2 segmenten** (`/sectie/slug/`); 97 URL's op niveau 2 (60 + 30 + 5 + 5 − hubs… concreet: 60 `bezorggebied/*`, 30 `lachgas-informatie/*`, 5 `product/*`, 5 `veelgestelde-vragen/*`), 27 op niveau 1, 1 root.
- **Trailing slash:** directory-per-pagina (`*/index.html`), alle interne hrefs eindigen op `/` (0 interne hrefs zonder slash), `sitemap.xml` idem (0 locs zonder slash), `vercel.json` regel 2 `"trailingSlash": true` (308 van `/x` naar `/x/`). Geen `cleanUrls`, dus `/pad/index.html` blijft technisch opvraagbaar; canonical dekt dit af.
- **Absolute vs relatieve links:** 0 absolute interne hrefs, 0 relatieve zonder leading slash; alles root-relatief (`/…/`).
- **Redirects:** geen `redirects`/`rewrites` in `vercel.json`, geen `_redirects`, geen `<meta http-equiv="refresh">` (0). Er zijn in de git-geschiedenis geen verwijderde of hernoemde pagina's (`git log --diff-filter=D` → leeg), dus er zijn ook geen legacy-URL's die een redirect nodig hebben. Geen www→apex-regel in de repo (dat regelt Vercel op domeinniveau).
- **Canonicals:** 124/124 indexeerbare pagina's hebben een absolute, **self-referencing** canonical (`https://lachgasantwerpen.be/<pad>/`); 0 afwijkingen; `/404.html` heeft er terecht geen. Canonicals zijn 1-op-1 gelijk aan de `<loc>`'s in `sitemap.xml` (0 mismatches).
- **Paginering:** geen (`rel="next"/"prev"` 0×); hubs tonen alle kinderen op één pagina (bv. `/bezorggebied/` linkt alle 60 kinderen).
- **404:** `/404.html` in de root (54.549 B), `<meta name="robots" content="noindex, follow">`, geen canonical/og:url/hreflang, één `<h1>`, 5 interne links in `<main>` (`/`, `/assortiment/`, `/bezorggebied/`, `/lachgas-informatie/`, `/contact/`), 0 JSON-LD. Vercel serveert `404.html` uit de root automatisch met status 404 — er is geen expliciete configuratie nodig en ook geen aanwezig. Geen 410-mechanisme (niet nodig: niets verwijderd).

---

## 3. Head & meta

Gemeten over alle 125 HTML-bestanden (`metrics_lachgasantwerpen.py`):

| Element | Meting |
|---|---|
| `<title>` lengte | min 27 (`/sitemap/`: "Sitemap \| Lachgas Antwerpen"), gem. 48,6, mediaan 48, max 60 (`/lachgas-nachtbezorging/`); 0 titels > 60; **125/125 uniek** |
| Title-patroon | 76× suffix `… \| Lachgas Antwerpen` (merk achteraan), 48× zonder suffix maar met plaatsnaam in de titel zelf (bv. "Bezorgtijden lachgas in Antwerpen en Vlaanderen") — geen hard template, wel consistente merk/locatie-aanwezigheid |
| `meta description` | min 104, gem. 148,4, mediaan 150, max 158; 0 > 160, 0 < 70, 0 leeg; **125/125 uniek** |
| Volgorde in `<head>` | identiek op alle 125: `<meta charset>` is het 1e element na `<head>`, dan viewport, title, description, robots, canonical, hreflang ×2, OG, Twitter, theme-color, geo.*, icons, manifest, preloads, `<style>`, JSON-LD ×n (index.html r. 4; pretty-printed: regels 4–40 in de uitvoer) |
| `meta robots` | 124× `index, follow, max-image-preview:large`; 1× `noindex, follow` (`/404.html`) |
| Open Graph | 125/125: `og:type` (97× `website`, 28× `article` op de `lachgas-informatie/*`-artikelen), `og:site_name`, `og:locale` `nl_BE`, `og:title`, `og:description`, `og:url`, `og:image` + `:width` 1200 + `:height` 630 + `:alt` |
| Twitter | 125/125 `summary_large_image` + title/description/image/image:alt |
| `og:image` | **één en dezelfde afbeelding op alle 125 pagina's** (`/assets/img/og-lachgas-antwerpen.jpg`) — geen pagina-specifieke social previews |
| hreflang | 124× `nl-BE` + 124× `x-default`, beide self-referencing. Eéntalige site → technisch correct maar functioneel overbodig |
| `<html lang>` | 125× `nl-BE` |
| Favicon/manifest | 125× `rel="icon"` SVG + ICO (`sizes="32x32 48x48"`), `apple-touch-icon`, `rel="manifest"` → `manifest.webmanifest` (name/short_name/id/start_url/scope/display standalone/theme `#111827`/2 PNG-iconen 192 & 512, geen `maskable` purpose) |
| `theme-color` | 125× `#111827` (gelijk aan manifest) |
| Extra | `geo.region` BE-VAN en `geo.placename` op alle pagina's (legacy-meta, door Google genegeerd) |
| preconnect / dns-prefetch | 0 / 0 — correct, want er zijn geen externe origins meer (Google Fonts verdween in commit `4645a04`) |
| preload | 250× `as="font"` (2 per pagina, `crossorigin`), 1× `as="image"` met `media="(min-width: 1024px)"` en `fetchpriority="high"` (alleen `index.html`) |
| Google/Bing verificatie-meta | 0 (kan via DNS geregeld zijn) |

**Oordeel:** vrijwel foutloos en zeer consistent; enige inhoudelijke zwakte is de identieke `og:image` voor 125 pagina's.

---

## 4. Structured data

**Telling per `@type`** (342 JSON-LD-blokken op 124 pagina's; `/404.html` heeft er 0; alle blokken valide JSON, geen `@graph`):

| @type | aantal | waar |
|---|---|---|
| BreadcrumbList | 123 | alle pagina's behalve `/` en `/404.html` |
| FAQPage | 90 | home, 61 `bezorggebied/*`, 5 `product/*`, 6 `veelgestelde-vragen/*`, 2 `lachgas-informatie/*`-hubs, 15 servicepagina's |
| Service | 74 | 61 `bezorggebied/*` + 13 servicepagina's |
| Article | 28 | `lachgas-informatie/*`-artikelen |
| WebPage | 12 | sitemap, FAQ-hub + 5 FAQ-pagina's, AV, privacy, 2 info-hubs, assortiment… |
| ItemList | 5 | `/bezorggebied/` (12 items), `/lachgas-informatie/` (5), `/assortiment/` (5, name "Ons assortiment"), + 2 |
| Product | 5 | `product/*` |
| LocalBusiness | 1 | `/` |
| WebSite | 1 | `/` |
| ContactPage / AboutPage / CollectionPage | 1 / 1 / 1 | `/contact/`, `/over-ons/`, `/lachgas-informatie/` |

Type-combinaties per pagina: 74× (Breadcrumb+FAQ+Service), 28× (Article+Breadcrumb), 6× (Breadcrumb+FAQ+WebPage), 5× (Breadcrumb+FAQ+Product), 3× (Breadcrumb+WebPage), 3× (Breadcrumb+FAQ+ItemList+WebPage), 1× (FAQ+LocalBusiness+WebSite), 1× (AboutPage+Breadcrumb), 1× (Breadcrumb+ContactPage), 1× (Breadcrumb+FAQ+ItemList), 1× (Breadcrumb+CollectionPage+ItemList), 1× leeg (404).

**Koppeling via `@id`**

- Slechts 2 entiteiten dragen een eigen `@id`: `https://lachgasantwerpen.be/#business` (LocalBusiness) en `#website` (WebSite), beide alleen op de homepage gedefinieerd.
- Er wordt wél consequent naar verwezen: `WebSite.publisher → {@id:#business}`; alle 15 WebPage-familie-blokken hebben `isPartOf → {@id:#website}`; alle 74 `Service.provider` zijn `{@type:LocalBusiness, @id:#business, name, url, telephone}`; alle 28 `Article.publisher` zijn `{@type:Organization, @id:#business, …, logo}`; `ContactPage.mainEntity → {@id:#business}`.
- Inconsistentie: `#business` is op de home `@type:LocalBusiness`, in Service `LocalBusiness`, maar in Article `Organization`. Geen `@graph`; de detailpagina's herhalen de provider-/publisher-subset in plaats van alleen de referentie.
- `Article.author` is een `Organization` zonder `@id` (geen persoon, geen auteurs-URL buiten de homepage) — zwak voor E-E-A-T-signalen.

**Properties (volledigheid)**

- `Service`: name, description, url, serviceType, provider, areaServed (`Place` met `GeoCoordinates` op de 60 gebiedspagina's; 14× alleen `{City: "Antwerpen"}` op de servicepagina's), availableChannel (`ServiceChannel` met `serviceUrl` wa.me). Geen `offers`, geen `hasOfferCatalog`.
- `Product` (5): name, description, url, brand, image — **geen `offers`, `sku`, `aggregateRating` of `review`** → geen Product-rich-result mogelijk, maar ook niets misleidends. 4 van de 5 `Product.image` verwijzen naar de **784 KB JPG** (`assets/img/lachgastank-2kg-infographic.jpg`) terwijl een WebP van 194 KB van hetzelfde beeld bestaat; alleen `product/lachgas-tank-2kg/` gebruikt een eigen productfoto (`/img/lachgastank-2kg.webp`).
- `Article` (28): headline, description, url, mainEntityOfPage, inLanguage, datePublished/dateModified (**alle 28 identiek `2026-10-02`**, terwijl deze artikelen pas in commits van 2026-10-05/06 verschenen en op 2026-10-19 zijn herzien), author, publisher (met logo 512×512), image (1 element: de generieke OG-afbeelding).
- `WebPage`-familie: name, url, description, inLanguage, `dateModified` (15× `2026-10-18`), isPartOf.
- `BreadcrumbList`: 23× diepte 2, 100× diepte 3; laatste item bevat steeds ook `item` (toegestaan).
- `LocalBusiness` (home): name, alternateName, url, logo, image, description, telephone, email, priceRange `€€`, currenciesAccepted, paymentAccepted, **areaServed met 62 entries** (City/AdministrativeArea), `address` met alleen `addressLocality/addressRegion/addressCountry` (**geen `streetAddress`/`postalCode`**), `geo`, `openingHoursSpecification` ma–zo `00:00`–`23:59`, `contactPoint`, `sameAs` (alleen een wa.me-URL — geen sociale profielen).

**Markup die Google niet (meer) toont / risico's**

- `FAQPage` op 90 pagina's (331 Questions, 2–16 per pagina, gem. 3,7): Google toont FAQ-rich-results sinds 2023 alleen nog voor overheids-/gezondheidsautoriteiten. Niet misleidend — de HTML bevat exact evenveel `<details>`-blokken als `Question`-items (331 = 331, 0 pagina's met afwijking) — maar het is grotendeels dode markup.
- Geen `HowTo`, geen `AggregateRating`/`Review` (dus geen fake-review-risico), geen `Event`, geen `SpeakableSpecification`.
- Misleidend-risico: `LocalBusiness` zonder straatadres maar mét `geo` en 24/7-openingstijden is dun; een bezorgdienst zonder bezoekadres zou beter als `Organization`/`OnlineBusiness` of met `areaServed`-only gemodelleerd worden. `priceRange "€€"` zonder enige prijs op de site is een leeg signaal.
- `Service.provider.telephone` en `LocalBusiness.telephone` wisselden 11× in 23 commits (zie §10); de huidige waarde `+31684626182` is wel overal consistent (456× zonder plus, 77× met plus; geen oud nummer meer aanwezig).

**Volledig voorbeeld — alle drie de JSON-LD-blokken van `/bezorggebied/berchem/index.html` (regel 4), FAQ-antwoorden ingekort:**

```json
{"@context":"https://schema.org","@type":"Service","serviceType":"Lachgas bezorgservice",
 "name":"Lachgas bezorgen in Berchem",
 "description":"Lachgas bestellen in Berchem? Aan huis bezorgd via WhatsApp, van Oud-Berchem en het station tot Groenenhoek, Pulhof en Nieuw Kwartier. Enkel voor 18+.",
 "url":"https://lachgasantwerpen.be/bezorggebied/berchem/",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgasantwerpen.be/#business","name":"Lachgas Antwerpen","url":"https://lachgasantwerpen.be/","telephone":"+31684626182"},
 "areaServed":{"@type":"Place","name":"Berchem","geo":{"@type":"GeoCoordinates","latitude":51.1945,"longitude":4.426}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/31684626182","name":"WhatsApp"}}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgasantwerpen.be/"},
 {"@type":"ListItem","position":2,"name":"Bezorggebied","item":"https://lachgasantwerpen.be/bezorggebied/"},
 {"@type":"ListItem","position":3,"name":"Berchem","item":"https://lachgasantwerpen.be/bezorggebied/berchem/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Hoe snel zijn jullie in Berchem buiten de Ring, bijvoorbeeld in Groenenhoek of Het Rooi?","acceptedAnswer":{"@type":"Answer","text":"Ook daar meestal binnen 15 tot 25 minuten. …"}},
 {"@type":"Question","name":"Ik kom met de trein aan in Antwerpen-Berchem. Kunnen jullie aan het station leveren?","acceptedAnswer":{"@type":"Answer","text":"Nee, wij leveren uitsluitend aan de deur van een woonadres …"}},
 {"@type":"Question","name":"Waar kan ik in Berchem een lege tank kwijt?","acceptedAnswer":{"@type":"Answer","text":"Nooit bij het restafval en nooit op straat. …"}}]}
```

Ter vergelijking het `Product`-blok van `/product/lachgas-tank-2kg/index.html` (regel 4):

```json
{"@context":"https://schema.org","@type":"Product","name":"Lachgastank 2KG",
 "description":"… verzegeld aan huis bezorgd in Antwerpen, meestal binnen 15 tot 25 minuten. Enkel 18+.",
 "url":"https://lachgasantwerpen.be/product/lachgas-tank-2kg/",
 "brand":{"@type":"Brand","name":"Lachgas Antwerpen"},
 "image":"https://lachgasantwerpen.be/img/lachgastank-2kg.webp"}
```

---

## 5. Crawl & indexatie

**`robots.txt` (volledig, 73 B):**
```
User-agent: *
Allow: /

Sitemap: https://lachgasantwerpen.be/sitemap.xml
```
Geen disallows, geen AI-bot-regels, geen verwijzing naar `llms.txt`.

**`sitemap.xml`** (20.544 B, 127 regels, één `<url>` per regel, geen index-sitemap, geen `image:`/`xhtml:`-namespaces):

- **124 URL's** = exact alle indexeerbare pagina's; 0 URL's zonder bestand, enige bestand buiten de sitemap is `/404.html` (correct, noindex). 0 dubbele locs, 0 noindex-pagina's in de sitemap.
- `<lastmod>` op 124/124, maar **allemaal `2026-10-18`** — één waarde voor de hele site (sitemap gegenereerd in commit `16ff513` van 2026-10-19). De 3 latere commits (20/21/22 okt, elk 128 bestanden gewijzigd) hebben `sitemap.xml` **niet** bijgewerkt. Daardoor is lastmod voor Google een onbetrouwbaar signaal (Google negeert lastmod als het aantoonbaar niet klopt).
- `<changefreq>`: 69× weekly, 55× monthly; `<priority>`: 1× 1.0 (home), 3× 0.9, 65× 0.8, 52× 0.7, 3× 0.3 — beide door Google genegeerd, wel netjes gedifferentieerd.
- Voorbeeld regel 31: `<url><loc>https://lachgasantwerpen.be/bezorggebied/berchem/</loc><lastmod>2026-10-18</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`.
- Sitemap-loc = canonical op alle 124 pagina's (0 mismatches).

**HTML-sitemap** `/sitemap/index.html`: 180 `<a>` totaal, 123 unieke interne links in `<main>` = alle pagina's behalve zichzelf en 404; `WebPage`-schema; in sitemap.xml met priority 0.3.

**RSS/Atom:** geen feedbestand, geen `<link rel="alternate" type="application/rss+xml">` (0 treffers).

**IndexNow:** `2c4e6a8b0d1f3a5c7e9b1d3f5a7c9e2b.txt` in de root bevat exact zijn eigen bestandsnaam als inhoud (32 hex-tekens) — geldig IndexNow-sleutelbestand (commit `b1c6db0`: "IndexNow-sleutel"). **Geen ping-code** in de repo (`grep -ri indexnow` → 0 treffers buiten de bestandsnaam); pings gebeuren dus hooguit vanuit de niet-gecommitte build.

**llms.txt / llms-full.txt:**
- `llms.txt` (135 regels): H1, samenvatting met telefoonnummer, verwijzing naar `llms-full.txt`, daarna `## Pagina's` met 125 links in het formaat `- [title](url): description` — uit dezelfde data als `<title>`/`meta description`.
- `llms-full.txt` (7.101 regels, 601 KB): 1 H1, 124 `## <title>`-secties met `URL: …`, 124 unieke site-URL's. De tekst is een ruwe strip van de volledige `<body>`: menu-items ("Menu", "WhatsApp ons nu18+ met legitimatieVerzegeld…") en footer staan er per pagina in → veel ruis per sectie. Beide bestanden zijn bij elke nummerwissel mee-geüpdatet (zie `git log --stat`).

**Noindex:** uitsluitend `/404.html`; de HTML-sitemap, AV en privacy zijn gewoon indexeerbaar (acceptabel).

---

## 6. Interne links

**Navigatiestructuur** (gemeten op `/bezorggebied/berchem/index.html`, representatief; header byte-identiek op 83 pagina's):
- `<header>` (regel 7, 2.722 B): logo-link + 5 hoofditems (`/assortiment/`, `/bezorggebied/`, `/lachgas-informatie/`, `/over-ons/`, `/contact/`) + 1 externe WhatsApp-CTA = **7 links**, op alle 125 pagina's.
- `#mobile-panel` (regel 32, buiten `<header>`, `<nav aria-label="Mobiel menu">`): **24 links** (statusregel, 4 tegels, productkaart met 56×56-thumbnail, groepen "bestellen/bezorgen/informatie/service", vertrouwensregel).
- `<footer>` (regel 178, 4.916 B): 3 kolommen met `<h3>` ("Assortiment", "Info & bezorging", "Contact") + juridische regel = **25 links** (24 intern + 1 `mailto:`) op 124 pagina's (404: 21).
- Breadcrumb `<nav aria-label="Kruimelpad">` (regel 37) op 123 pagina's; `<a>`-items, `<span aria-hidden="true">/</span>` als scheidingsteken, laatste item `<span aria-current="page">`; 1-op-1 gespiegeld in `BreadcrumbList`-JSON-LD (123/123).
- Artikelen: 28 van 30 `lachgas-informatie/*`-pagina's hebben een inhoudsopgave `<nav aria-label="Inhoud">` met anker-links naar `<h2 id="…">` (voorbeeld `wat-is-lachgas`: 5 ankers = 5 H2-id's).

**Hub ↔ detail** (`bfs_lachgasantwerpen.py`, alleen links binnen `<main>`):

| Hub | unieke interne links in `<main>` | kinderen | gelinkt | kinderen → hub | sibling-links per kind (min/gem/max) |
|---|---|---|---|---|---|
| `/bezorggebied/` | 62 | 60 | 60 (100%) | 60/60 | 3 / 4,8 / 59 |
| `/lachgas-informatie/` | 32 | 30 | 30 (100%) | 30/30 | 1 / 4,4 / 14 |
| `/assortiment/` → `/product/*` | 11 | 5 | 5 | 5/5 | 4 / 4,0 / 4 |
| `/veelgestelde-vragen/` | 14 | 5 | 5 | 5/5 | 4 / 4,0 / 4 |
| `/sitemap/` | 123 | — | 123/124 | — | — |

Gerelateerde blokken op een gebiedspagina (berchem, per voorafgaande H2): "Lachgastanks in drie formaten" → 3 productlinks; "Wij bezorgen ook hier" → 4 buurgebieden + hub; FAQ → 1 artikel; CTA → 2× `/contact/`; hero/breadcrumb → 4.

**Klikdiepte vanaf `/` (BFS over alle interne `<a href>` in `<body>`):**
- Verdeling: diepte 0: 1, **diepte 1: 95, diepte 2: 28**; **max 2**. Onbereikbaar: alleen `/404.html` (verwacht).
- Zonder de `/sitemap/`-pagina: identiek (max 2). Alleen via `<main>`-links (header/footer/mobiel menu genegeerd): max 3, verdeling {0:1, 1:83, 2:36, 3:1}; dan onbereikbaar: `/over-ons/` en `/lachgas-spoedbezorging/` (hangen volledig aan header/footer/menu).
- Diepte-2-pagina's: 20 `lachgas-informatie/*`, 5 `veelgestelde-vragen/*`, `/lachgas-studenten-antwerpen/`, `/lachgas-weekendbezorging/`, `/leeftijdscontrole-18-plus/`.

**Orphans:** **0** (buiten `/404.html`). Laagste inbound: `/lachgas-informatie/lachgas-op-festivals-en-evenementen/` en `/…/betrouwbare-lachgas-bezorgservice-herkennen/` met elk 3 inkomende pagina's; hoogste: footer-items met 124. Alleen `<main>`-links: `/lachgas-spoedbezorging/` en `/over-ons/` hebben elk maar 1 inkomende contentlink.

**Volume:** 8.725 interne links totaal, **gem. 69,8 per pagina** (min 57 `/contact/`, mediaan 69, max 180 `/sitemap/`); daarvan unieke `<main>`-links gem. 12,9 (min 2, max 123). 32 pagina's linken naar zichzelf (hub-kaarten/breadcrumb). 0 kapotte interne links, 0 links zonder trailing slash.

**Ankertekst:** beschrijvend en consistent; top-25 bestaat volledig uit navigatielabels en paginanamen ("bezorggebied" 442×, "over ons" 375×, "lachgastank 10kg" 317×, …). **0 generieke ankers** ("lees meer", "klik hier", "hier"). Enige rare: 125× "l lachgas antwerpen" = logo-badge-letter "L" + merknaam in één `<a>` (zonder `aria-label`, behalve op `/404.html`).

**nofollow:** 49×, uitsluitend op 4 externe domeinen (druglijn.be 22, belgium.be 11, vad.be 8, antwerpen.be 8) — bronverwijzingen in artikelen. Interne links: 0 nofollow. Externe links totaal 429, allemaal `target="_blank"` + `rel="noopener"` (steekproef berchem: 3/3); wa.me-links 380×, `mailto:` 128×, `tel:` 0×.

---

## 7. HTML-semantiek

| Check | Resultaat |
|---|---|
| `<!DOCTYPE html>` | 125/125 |
| H1 per pagina | **125× exact 1**; 0 zonder, 0 meervoudig; 125/125 unieke H1-teksten; H1 ≠ title op alle pagina's (geen 1-op-1 kopie) |
| Koppen totaal | H1 125, H2 812, H3 636, **geen H4–H6** |
| Overgeslagen niveaus | 1 pagina: `/404.html` (H1 → H3; de H3's zijn de footer-kolomkoppen, de pagina heeft zelf geen H2). Alle andere 124 pagina's: correcte volgorde |
| Koppen buiten `<main>` | 3 per pagina (footer `<h3>` ×3); 0 in header |
| Landmarks | `<header>` 1×, `<main id="inhoud">` 1×, `<footer>` 1× op alle 125; `<nav>`: 2× (home, 404), 3× (95 pag.: site-nav, mobiel menu, kruimelpad), 4× (28 artikelen: + inhoudsopgave). **`<article>` 0×, `<aside>` 0×** — ook de 28 artikelen gebruiken geen `<article>` |
| `aria-label` op `<nav>` | "Mobiel menu" 125×, "Kruimelpad" 123×, "Inhoud" 28×; `#site-nav` **zonder label op 124 pagina's** (alleen `/404.html` heeft `aria-label="Hoofdmenu"` en een `aria-label` op de logolink) — template-inconsistentie |
| Skip-link | 125/125: `<a class="skip" href="#inhoud">Direct naar inhoud` (regel 7), zichtbaar bij focus (`.skip:focus{left:8px}`) |
| `<img>` | 129 totaal; **0 zonder alt-attribuut**; 126 met `alt=""` (125× de 56×56-productthumbnail in het mobiele menu, binnen een link met tekst → correct decoratief; 1× lightbox-placeholder op home). 3 informatieve afbeeldingen hebben beschrijvende alt |
| Inline `<svg>` | **4.890**, waarvan **0 met `aria-hidden="true"`** of `focusable="false"`; meestal in een link/knop met tekst (geen gevolg voor naamgeving), maar niet best practice |
| `aria-*` | `aria-label` 656, `aria-hidden` 224 (breadcrumb-scheidingstekens e.d.), `aria-current` 182, `aria-expanded` 125, `aria-controls` 125, `aria-modal` 1, `role` 1 |
| Knoppen | 253 `<button>`, 252 met `aria-label` (menu open/sluit), `aria-expanded`/`aria-controls="mobile-panel"` correct gekoppeld |
| `aria-current="page"` | 123× `<span>` in breadcrumb; 59× `<a>` in header (30 info-pagina's "Lachgas Info", 6 product/assortiment "Assortiment", …) |
| Lijsten/tabellen | berchem-main: 0 `<ul>/<ol>/<dl>/<table>`; FAQ's als 3 `<details>`; geen `<time>` bij "Laatst bijgewerkt"-regel in artikelen |
| `lang` | `nl-BE` 125/125 |

**Gevonden template-bug (actieve staat):** in het desktop-menu draagt het item `/bezorggebied/` op **58 pagina's buiten `/bezorggebied/`** de "actief"-klassen (`bg-gray-50 text-gray-900`, zonder `aria-current`) — o.a. alle 30 info-artikelen, 5 productpagina's, FAQ-pagina's, `/sitemap/`, `/over-ons/`, `/werkwijze/`. Op die pagina's lijken dus twee menu-items actief (bv. "Lachgas Info" mét `aria-current` én "Bezorggebied" zonder). Alleen home, contact, 404, AV, privacy en de info-hub zijn correct. Bewijs: diff tussen headervarianten `e1b52181` (83 pag.) en `330ad07b` (home): `-<a href="/bezorggebied/" class="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900">` vs `+… text-gray-600 transition hover:bg-gray-50 …`.

---

## 8. Performance

**CSS-strategie**
- **Volledige CSS inline** in één `<style>` per pagina (regel 4): exact 31.168 B op alle 125 pagina's (= 3.896.000 B in de repo). Het is Tailwind v3.4.17 (`/*! tailwindcss v3.4.17 */`, 358 van 364 regels uit `css/tailwind.css`) + `css/site.css` (64 van 66 regels) — geen critical-CSS-splitsing, alles is "critical". Geen enkel `<link rel="stylesheet">`.
- Gevolg: 0 render-blocking requests, maar ~6,6 KB gzip CSS wordt per pagina-navigatie opnieuw gedownload en kan niet apart gecachet worden. Gemitigeerd door `nav.js` (prefetch + soft-navigatie) en `sw.js` (SWR). De bestanden `css/tailwind.css` en `css/site.css` zijn in de deploy dode bytes (28.887 B).
- Historie: commit `2a297d6` laadde `cdn.tailwindcss.com` + Google Fonts; `5862402` compileerde Tailwind naar `/css/tailwind.css`; `b1c6db0` zette CSS inline; `4645a04` verving Google Fonts door self-hosted subsets.

**Fonts**
- 2 self-hosted woff2 (36 KB + 23 KB), **gesubset (latin `unicode-range`)**, 8 `@font-face`-blokken (Inter 400/500/600/700/800 en Plus Jakarta Sans 400/700/800 verwijzen naar **hetzelfde** bestand per familie → variabele fonts), `font-display: optional` op alle 8, beide gepreload met `crossorigin`.
- `optional` + preload = geen FOUT/FOIT-shift (CLS 0), maar bij een trage eerste hit toont de browser permanent het systeemfont voor die paginaweergave. Geen `size-adjust`/`ascent-override`-fallback (`size-adjust` komt 1× voor, maar dat is `-webkit-text-size-adjust` uit Tailwind preflight) — met `optional` is een metrics-fallback minder relevant, maar het fallback-font `system-ui` wijkt metrisch wel af.

**Afbeeldingen**
- Formaten: WebP 4, JPG 2 (OG + ongebruikte bron), **AVIF 0**, PNG 3 (iconen). Geen `<img>` naar JPG.
- 129 `<img>`: **129 met `width`+`height`**, 129 `decoding="async"`, 128 `loading="lazy"`, 1 `fetchpriority="high"` (hero home), 2 met `srcset`+`sizes` (productfoto 300w/480w, `sizes="(min-width: 768px) 300px, 70vw"`), 1 `<picture>`.
- Slimme hero-truc op `index.html` regel 80: `<picture><source media="(max-width: 1023px)" srcset="data:image/svg+xml,…3×2 leeg…"><img fetchpriority="high" src="…infographic.webp" width="1536" height="1024" …>` + `<link rel="preload" as="image" media="(min-width: 1024px)">` → de 194 KB hero wordt op mobiel helemaal niet gedownload.
- Zwak: de hero-WebP is 1536×1024/194 KB zonder srcset (ook op 1024-px-schermen de volle maat); de 784 KB JPG staat in de repo en wordt alleen als `Product.image` in 4 schema's gebruikt; `icon-192.png` wordt door geen HTML gerefereerd (alleen manifest).

**Third-party:** **0** scripts/iframes/fonts van derden; geen analytics, tag manager, chat-widget of kaarten. Alle 429 externe links zijn gewone `<a>`.

**Prefetch/prerender:** geen `<link rel="prefetch">`, geen Speculation Rules (0 — in `f1f2352` toegevoegd, in `4645a04` weer verwijderd "overbodig naast de router"); prefetch volledig via `nav.js` (intentie + viewport, max 16 per pagina, LRU 60).

**Service worker (`sw.js`):** static cache-first voor `woff2|css|js|webp|png|jpe?g|svg|ico|avif|webmanifest` (r. 22), pagina's stale-while-revalidate met trim op 150 (r. 5, 14-16, 35-43), precache 5 bestanden (r. 4), offline → `/`. Vercel geeft `sw.js` `Cache-Control: no-cache` (`vercel.json` r. 73-80), zodat versiewissels direct doorkomen.

**Gewichten:** HTML gem. 14,2 KB gzip (home 20,8 KB); JS 6,0 KB gzip; fonts 60 KB (eenmalig, immutable); first view detailpagina ≈ 14 KB HTML + 6 KB JS + 60 KB fonts + 3,6 KB thumbnail ≈ 84 KB; home desktop + 194 KB hero.

---

## 9. Styling & layout

- **Architectuur:** utility-first (Tailwind 3.4.17, 345 unieke class-selectors, 451 regels, 31 responsive `sm:/md:/lg:`-varianten) + een klein handgeschreven laagje met BEM-achtige componentklassen (`.mm-*` mobiel menu, `.pf*` productfeature, `.rv`/`.in` reveal, `.wa-float`, `.skip`) in `css/site.css` regel 33–34 (geminifieerd, met `/*mm*/…/*mm-end*/` en `/*master*/…/*master-end*/`-markers → gegenereerde blokken).
- **Design tokens:** eigen Tailwind-themakleuren `brand-*` (violet: `rgb(124 58 237)` = `.bg-brand-600`), `whatsapp-*` (`rgb(37 211 102)` = `.bg-whatsapp-500`, `rgb(21 128 61)` = `.bg-whatsapp-600`), `surface-*` (`rgb(250 250 250)`), plus `gray-*`. **Geen eigen CSS custom properties** (61 gedefinieerde `--*` zijn allemaal `--tw-*`; 0 niet-Tailwind `var()`), dus tokens leven alleen in de (niet-gecommitte) `tailwind.config` en zijn niet runtime-themebaar. 0 `!important`.
- **CLS-preventie:** `width`/`height` op 129/129 afbeeldingen; `font-display: optional`; lightbox-img krijgt vaste `width="1200" height="800"`; reveal-animatie werkt met `opacity`/`transform` (geen layout) en alleen onder de vouw (`site.js` r. 51-53, 79). `aspect-ratio`: 0×; `object-fit`: 3×.
- **Mobile-first:** 7 `@media`-blokken, **alleen `min-width`** (640/768/1024), 0 `max-width`-queries in CSS (de enige `max-width` is de `<source media>` van de hero). Layout via `max-w-xl…7xl`-containers (geen `.container`), 17 grid- en 9 flex-declaraties, `backdrop-filter` 6×.
- **Dark mode:** geen (`prefers-color-scheme` 0, `.dark` 0); `theme-color` is wel donker (`#111827`).
- **Toegankelijkheid in CSS:** `@media (prefers-reduced-motion: reduce)` zet `.rv`, `.wa-float` en `:active`-scale uit (`site.css` r. 34) en `site.js` r. 70 slaat de reveal-logica dan over. Commit `16ff513` claimt "AA-contrast voor hulptekst en WhatsApp-groen"; de aanwezigheid van `whatsapp-600/700` (donkerder groen voor tekst) ondersteunt dat. **Focus-styling is het zwakke punt:** 0 `:focus-visible`-regels; 5 `:focus`-regels (4 Tailwind-utilities + `.skip:focus`); van de 10.145 interactieve elementen hebben er maar **4** een `focus:`-utility — alle andere leunen op de browser-default outline (Tailwind preflight verwijdert die niet, dus zichtbaar maar ongestileerd). `html{scroll-behavior:smooth}` (`site.css` r. 29) staat niet achter een reduced-motion-check.
- **Responsive images:** zie §8 — slechts 2 `srcset`-afbeeldingen; hero zonder srcset.
- **Print:** `@media print{.rv{opacity:1;transform:none}}` — alleen de reveal-fix.

---

## 10. Hosting / deploy / git

**Configbestanden**
- `vercel.json` (1.931 B): `trailingSlash: true` (r. 2); headers voor `/(.*)`: **HSTS** `max-age=63072000; includeSubDomains` (zonder `preload`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `X-Frame-Options: DENY`, **CSP beperkt tot `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`** (geen `default-src`/`script-src`/`style-src` — begrijpelijk gezien de inline `<style>` en het inline script, maar het biedt geen XSS-bescherming). Cache-Control: `/fonts/*` 1 jaar immutable; `/img/*`, `/images/*` (map bestaat niet), `/assets/*` 30 dagen + SWR 7 dagen; `/js/*` 1 dag + SWR 7 dagen; `/sw.js` no-cache. **Geen regel voor HTML** (Vercel-default `public, max-age=0, must-revalidate`) en geen voor `/css/*` (irrelevant: ongebruikt). Compressie (brotli/gzip) en CDN zijn Vercel-standaard; geen `cleanUrls`, geen `redirects`, geen `rewrites`.
- `.vercelignore`: `_build`. `CNAME` (`lachgasantwerpen.be`) en `.nojekyll` zijn **GitHub-Pages-restanten** (CNAME sinds het eerste commit; `.nojekyll` sinds `5862402`); `vercel.json` kwam pas op 2026-10-19 → hosting is (ook) naar Vercel verhuisd; beide configs staan nu naast elkaar.
- Geen `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`, `.github/`.

**Build-pijplijn**
- Niet aanwezig in de repo (zie §1). Uit de commits is af te leiden: een generator buiten de repo (`_build/`) rendert 125 pagina's uit gedeelde templates (identieke header/footer/CSS/JSON-LD-sjablonen), schrijft `sitemap.xml`, `llms*.txt`, en bumpt `sw.js` VERSION met een inhoudshash. Datasource onbekend (vermoedelijk per-stad config: "zustersites", "Rotterdam 7").
- Risico: zonder de generator is elke wijziging een 125-bestanden-edit (zoals de nummerwissels laten zien) en is de site niet reproduceerbaar vanuit deze repo.

**Git-geschiedenis** (23 commits, 3 auteurs: `webhosting1717` 1, `rayan` 3, `Claude` 19):

| Datum | Commit | Wat |
|---|---|---|
| 2026-09-03 | `2a297d6` | "Add files via upload": 36 bestanden, 8.026 regels — 30 pagina's, Tailwind via CDN, Google Fonts, `css/site.css` (32 regels), `js/site.js`, `robots.txt`, `sitemap.xml` (33 regels) |
| 09-20 / 09-23 | `ed8359f`, `9592a78` | wa.me-links, 18+-popup verwijderd; nummerwissel (30 bestanden) |
| 2026-09-24 | `5862402` | gecompileerde Tailwind (`css/tailwind.css`), favicon, `404.html`, `.nojekyll`, WebP-hero |
| 10-01 (2×) | `08a38df`, `ca2d688` | nummer verwijderd / nieuw nummer (31 bestanden) |
| 2026-10-02 | `8f1c476`, `b1c6db0` | iconen; +12 pagina's, **CSS inline**, manifest, hreflang, `llms.txt`, `llms-full.txt`, IndexNow-sleutel (48 bestanden, +5.781) |
| 10-04 (2×) | `b390017`, `96e7084` | nummerwissels (45 bestanden) |
| 2026-10-05 | `f1f2352` | "fase 3: 100+ pagina's" (113 bestanden, +31.707/−10.646), HTML-sitemap, Speculation Rules |
| 2026-10-05 | `4645a04` | `js/nav.js`, `sw.js`, self-hosted fonts, Speculation Rules weg (115 bestanden) |
| 2026-10-06 (3×) | `620631b`, `011902e`, `6f66c7b` | +kennisbank/hubs/servicepagina's (+7.318), productfoto + nieuw mobiel menu (−2.632), tekstuele tijdsindicatie |
| 10-13 / 10-17 (3×) | `95081f0`, `eaabe4e`, `eb0c29b`, `fffd438` | nummerwissels (127 bestanden, 444 regels elk) |
| 2026-10-19 | `16ff513` | "SEO-masterstandaard": head-volgorde, @id-graaf, a11y, `vercel.json`, `.vercelignore`, nieuwe OG (134 bestanden, +1.683/−5.019) |
| 10-20 / 10-21 / 10-22 | `bd6842e`, `e171660`, `0340ba8` | nummerwissels (128 bestanden, 460 regels elk; sitemap niet bijgewerkt) |

- **11 van de 23 commits zijn telefoonnummer-wissels** (heen en weer tussen 5 nummers), elk met 30–128 gewijzigde bestanden: het nummer staat hard in HTML, JSON-LD, `llms*.txt` en `manifest` i.p.v. in één configwaarde. Geen tags/releases, één branch, geen CI, geen tests.

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Vlakke, volledig verbonden architectuur:** max. klikdiepte 2 voor alle 124 pagina's, 0 orphans, 0 kapotte interne links, elke hub linkt 100% van zijn kinderen en elk kind linkt terug + naar gem. 4–5 siblings; breadcrumbs in HTML én JSON-LD op 123 pagina's; 0 generieke ankerteksten.
2. **Foutloze, uniforme head:** 125/125 unieke titels (27–60 tekens) en descriptions (104–158), 124/124 self-referencing canonicals = sitemap-locs, OG/Twitter compleet incl. `og:image:alt`, vaste tag-volgorde, 1 H1 per pagina, geen overgeslagen kopniveaus (behalve 404).
3. **Zero third-party, performance-by-design:** geen externe scripts/fonts; gesubsette self-hosted variabele woff2's met preload + `font-display: optional`; alle 129 `<img>` met dimensies/lazy/async; hero op mobiel via `<picture>`-truc helemaal niet geladen; 15 KB eigen JS (6 KB gzip) voor prefetch-router + SWR-service-worker.
4. **Volledige crawl-laag voor mens, bot en LLM:** `sitemap.xml` met 124 URL's die exact de indexeerbare pagina's dekt, HTML-sitemap, `robots.txt`, IndexNow-sleutelbestand, `llms.txt` + `llms-full.txt`, correcte noindex-404, `vercel.json` met HSTS/nosniff/Referrer/Permissions/X-Frame.
5. **Consistente schema-laag met entiteit-referenties:** 342 blokken, 12 typen; `#business`/`#website` worden vanuit Service (74×), Article (28×), WebPage-familie (15×) en ContactPage gerefereerd; FAQ-markup komt 1-op-1 overeen met zichtbare `<details>` (331 = 331); geen fake reviews/ratings.

**Top 5 zwakke punten / fouten**
1. **Generator en templates zitten niet in de repo** (`_build` in `.vercelignore`, nooit gecommit): de site is niet reproduceerbaar; 11 van 23 commits zijn nummerwissels die 30–128 bestanden raken omdat het nummer hard in HTML/JSON-LD/llms/manifest staat; `css/*.css` zijn dode kopieën van wat inline staat.
2. **Template-bug actieve navigatie:** op 58 pagina's buiten `/bezorggebied/` draagt het menu-item "Bezorggebied" de actief-klassen (zonder `aria-current`), zodat twee items actief lijken; `#site-nav` mist `aria-label` op 124/125 pagina's (alleen 404 heeft het).
3. **Zwakke datasignalen:** `sitemap.xml` lastmod = `2026-10-18` voor alle 124 URL's en niet bijgewerkt na 3 latere site-brede commits; alle 28 `Article.datePublished/dateModified` = `2026-10-02` hoewel de artikelen later ontstonden/wijzigden; geen `<time>`-elementen.
4. **Structured data met beperkt rendement en dunne entiteit:** `FAQPage` op 90 pagina's levert geen rich results meer op; 5 `Product` zonder `offers`; `LocalBusiness` zonder straatadres/postcode maar met 24/7-uren, `priceRange "€€"` en `sameAs` = alleen een wa.me-link; 4 `Product.image` wijzen naar een 784 KB JPG terwijl een WebP bestaat; `#business` wisselt van type (LocalBusiness ↔ Organization).
5. **Front-end-afwerking:** 31 KB CSS 125× gedupliceerd en niet cachebaar als bestand; 4.890 inline SVG's zonder `aria-hidden`; focus-styling leunt op browser-defaults (4 van 10.145 interactieve elementen met `focus:`-klasse, 0 `:focus-visible`); hero 1536 px zonder `srcset`/AVIF; identieke `og:image` op alle 125 pagina's; `llms-full.txt` bevat menu/footer-ruis per pagina; CSP zonder `script-src`.

## SCORETABEL

| # | Onderdeel | Score (1-5) | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **4** | 100% pre-rendered HTML met minimale, goed geschreven progressive-enhancement-JS en SW, maar generator/templates ontbreken in de repo. |
| 2 | URL-architectuur | **4** | Lowercase-koppelteken-slugs, max 2 niveaus, consistente trailing slash en 124/124 self-canonicals; geen redirect-laag of `cleanUrls` (nog niet nodig, maar ook niet voorbereid). |
| 3 | Head & meta | **5** | 125/125 unieke titels en descriptions binnen lengtegrenzen, vaste tag-volgorde, OG/Twitter/hreflang/manifest compleet; enige minpunt is de ene gedeelde `og:image`. |
| 4 | Structured data | **4** | 12 typen, consistente `@id`-referenties naar `#business`/`#website`, breadcrumbs 123/123, FAQ = zichtbare inhoud; maar dode FAQ-markup, Product zonder offers, dun LocalBusiness-adres en identieke artikeldatums. |
| 5 | Crawl & indexatie | **4** | Sitemap exact gelijk aan indexeerbare set en canonicals, robots/404/noindex/HTML-sitemap/llms/IndexNow-sleutel aanwezig; lastmod is één ongeldige waarde en er is geen IndexNow-ping of feed. |
| 6 | Interne links | **5** | Max diepte 2, 0 orphans, hubs 100% dekkend, siblings + terug-links, beschrijvende ankers, nofollow alleen extern; het leunt wel sterk op footer/menu voor enkele servicepagina's. |
| 7 | HTML-semantiek | **4** | 1 H1 overal, kopvolgorde klopt (op 404 na), landmarks + skip-link + gelabelde knoppen; maar geen `<article>`/`<aside>`, ongelabelde `#site-nav`, 4.890 SVG's zonder `aria-hidden`, foutieve actieve staat op 58 pagina's. |
| 8 | Performance | **4** | Geen third-party, inline CSS, gesubsette fonts met `optional`, dimensies/lazy op 129/129 img, mobiel-geen-hero-truc, prefetch-router + SWR-SW; nadelen: CSS 125× gedupliceerd, hero zonder srcset/AVIF, 784 KB ongebruikte JPG. |
| 9 | Styling & layout | **3** | Compiled Tailwind met eigen themakleuren, mobile-first (alleen min-width), reduced-motion gerespecteerd en CLS-vrij; maar geen CSS-tokens/custom properties, geen dark mode, nauwelijks focus-styling, smooth-scroll zonder motion-check. |
| 10 | Hosting/deploy | **3** | Goede security- en cache-headers in `vercel.json` en trailingSlash; maar CSP zonder script-src, GitHub-Pages-restanten naast Vercel-config, geen CI, build-pijplijn buiten de repo en 11 van 23 commits zijn mass-edits voor één telefoonnummer. |

## KERNGETALLEN

| Kengetal | Waarde |
|---|---|
| HTML-pagina's | **125** (124 indexeerbaar + `/404.html` noindex) |
| Totale JS | **15.473 B** ruw / 5.962 B gzip (`js/nav.js` 6.950 + `js/site.js` 6.202 + `sw.js` 2.321) |
| Totale CSS | **28.887 B** in `css/` (ongebruikt) ; inline **31.168 B per pagina** × 125 = 3.896.000 B (≈ 6,6 KB gzip per pagina) |
| JSON-LD-typen | **12** verschillende `@type`s, 342 blokken op 124 pagina's |
| Max klikdiepte | **2** (verdeling 1 / 95 / 28; alleen-`<main>`-links: 3) |
| Orphans | **0** (exclusief `/404.html`) |
| Pagina's zonder H1 / met >1 H1 | **0 / 0** (125× exact 1) |
| `<img>` zonder alt | **0** van 129 (126 met leeg `alt=""`, decoratief) |
| Pagina's met unieke title | **100 %** (125/125; descriptions ook 100 %) |
| Extra | gem. 69,8 interne links/pagina; HTML gem. 68.393 B (14.158 B gzip); 23 commits, 11 nummerwissels; sitemap 124 URL's, lastmod 124× `2026-10-18` |

---

### Bijlage — gebruikte scripts (scratchpad, niet in de repo)
- `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/metrics_lachgasantwerpen.py` — head/meta-lengtes, duplicaten, H1/H-hiërarchie, landmarks, img-attributen, JSON-LD-typen/props/@id, link- en ankerstatistieken, inline-CSS-metingen.
- `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/bfs_lachgasantwerpen.py` — BFS-klikdiepte vanaf `/` (alle links, zonder sitemap, alleen `<main>`), orphans, inbound-tellingen, kapotte links, trailing-slash/hoofdletter-checks, hub-dekking.

### Bijlage B — `<head>` van `index.html` (regel 4, hier per tag uitgesplitst; inline CSS en JSON-LD ingekort)

```html
<!DOCTYPE html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lachgas Antwerpen | Lachgas bestellen, bezorgd via WhatsApp</title>
<meta name="description" content="… (158 tekens)">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="https://lachgasantwerpen.be/">
<link rel="alternate" hreflang="nl-BE" href="https://lachgasantwerpen.be/">
<link rel="alternate" hreflang="x-default" href="https://lachgasantwerpen.be/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lachgas Antwerpen">
<meta property="og:locale" content="nl_BE">
<meta property="og:title" content="…">
<meta property="og:description" content="…">
<meta property="og:url" content="https://lachgasantwerpen.be/">
<meta property="og:image" content="https://lachgasantwerpen.be/assets/img/og-lachgas-antwerpen.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="…">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="…">
<meta name="twitter:description" content="…">
<meta name="twitter:image" content="https://lachgasantwerpen.be/assets/img/og-lachgas-antwerpen.jpg">
<meta name="twitter:image:alt" content="…">
<meta name="theme-color" content="#111827">
<meta name="geo.region" content="BE-VAN">
<meta name="geo.placename" content="Antwerpen">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32 48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" as="image" href="/assets/img/lachgastank-2kg-infographic.webp" type="image/webp" fetchpriority="high" media="(min-width: 1024px)">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/plusjakartasans.woff2" as="font" type="font/woff2" crossorigin>
<style>@font-face{font-family:Inter;…font-display:optional;src:url(/fonts/inter.woff2) format('woff2');unicode-range:U+0000-00FF,…} … /*! tailwindcss v3.4.17 */ … (31.168 B)</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","@id":"https://lachgasantwerpen.be/#business",…}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","@id":"https://lachgasantwerpen.be/#website",…,"publisher":{"@id":"https://lachgasantwerpen.be/#business"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[…]}</script>
</head>
```

Dezelfde volgorde geldt voor alle 124 indexeerbare pagina's (gemeten: charset op positie 1 bij 125/125, viewport/theme-color/manifest/icon bij 125/125, canonical+hreflang bij 124/124). Op detailpagina's vervangen `Service`/`Article`/`Product`/`WebPage` + `BreadcrumbList` (+ `FAQPage`) de drie home-blokken; `og:type` wordt `article` op de 28 artikelen.

### Bijlage C — observaties over `js/nav.js` met SEO-relevantie
- De router (`js/nav.js` r. 44-68) vervangt `<main>`, `header`, `footer`, `#site-nav`, `#mobile-panel` en synchroniseert `title`, `description`, `robots`, `canonical` en `og:url`, maar **niet** de JSON-LD-scripts in `<head>` en niet `hreflang`/`og:title`. Voor crawlers is dit irrelevant (zij laden elke URL vers), voor tools die DOM na navigatie inspecteren (bv. een browser-extensie voor schema-validatie) toont de pagina na een soft-navigatie de schema's van de eerst geladen pagina.
- `history.scrollRestoration = "manual"` (r. 88) met eigen scroll-herstel bij `popstate` (r. 82-87); focus gaat na navigatie naar `<main tabindex="-1">` (r. 63-64) — goed voor screenreaders.
- Links met `rel="external"`, `download`, `data-no-router` of een andere `target` worden overgeslagen (r. 12-13); bestandspaden met extensie (behalve `.html`) ook (r. 8, 16) — `sitemap.xml`/`llms.txt`-links gaan dus normaal naar de server.
- Prefetch gebeurt met `credentials: "same-origin"` en `Accept: text/html` (r. 26); non-HTML of niet-ok-responses worden niet gecachet (r. 27-28). Bij fouten valt de router terug op een harde navigatie (r. 75) — geen dode toestand mogelijk.
