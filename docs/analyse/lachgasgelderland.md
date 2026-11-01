# Analyse repo `lachgasgelderland` (technische SEO-structuur, architectuur, front-end)

Geanalyseerd: `/home/user/lachgasgelderland` (git `main`, HEAD `57269ce`, 9 commits, 196 getrackte bestanden). Onderwerp van de site is buiten beschouwing gelaten; paden/slugs worden alleen geciteerd als bewijs. Alle cijfers zijn gemeten met grep/find/wc en twee kleine Python-scripts in de scratchpad (`meet_gelderland.py`, `bfs_gelderland.py`).

---

## 1. Stack & rendering

**Generator.** Eigen Python-SSG zonder framework, in `_build/`:

| Bestand | Regels | Rol |
|---|---|---|
| `_build/build.py` | 98 | Orkestratie: content laden, pagina's renderen, sitemap/robots/llms/manifest/favicon/IndexNow-key schrijven, daarna twee post-passes |
| `_build/common.py` | 344 | Config-defaults (voor een zustersite, zie `common.py:11-46`), componenten (header, footer, cards, chips, faq, steps), schema-builders, `render()` (`common.py:312-335`) |
| `_build/pages.py` | 296 | `class Site` met paginabouwers per type (`home_page`, `region_page`, `place_page`, `article_page`, `service_page`, `tank_page`, `faq_topic_page`, `simple_page`, `sitemap_page`, `not_found`) |
| `_build/content/*.py` | 4.107 regels / 638 KB (20 modules) | Data als Python-dicts (`HOME`, `HUBS`, `AREAS`, `ARTICLES`, `SERVICE_PAGES`, `FAQ_TOPICS`, `TANKS`, …); `_site.py` = site-instellingen (`SITECFG`), `_config.py` = toegestane paden/slugs, `BRIEF.md` = redactiebrief |
| `_build/speed/apply_speed.py` | 95 | Post-pass 1: fonts self-hosten, preconnect verwijderen, speculation rules verwijderen, scripts injecteren, `sw.js` met build-hash schrijven |
| `_build/speed/levertijd.py` | 46 | Post-pass 1a: regex-normalisatie van tijdsbanden in alle HTML/TXT/XML/JSON |
| `_build/master/seo_master.py` | 579 | Post-pass 2: head herbouwen in vaste volgorde, JSON-LD gelijktrekken, titelconventie, sitemap-lastmod, llms-titels, `vercel.json` + `.vercelignore` schrijven |
| `_build/master/site.json` | 39 | Config voor de master-pas (brand, host, geo_region, og, logo, …) |
| `_build/site.css` / `_build/fonts.css` | 152 regels (15.318 B) / 1.056 B | Bron-CSS, wordt geminificeerd inline gezet (`common.py:61-68`) |

Pipeline (`build.py:45-94`): `configure(SITECFG)` → `Site.build_all()` → `render()` per pagina → `apply_speed.apply(ROOT, "brabant")` (roept intern `levertijd.apply_dir`) → `seo_master.apply_site(ROOT, SITE)`. Het is dus een renderer plus **twee regex-gebaseerde HTML-herschrijfpassen** over de output (idempotent ontworpen, maar fragiel: zie §10).

**Renderingmodel.** 100 % statisch (SSG). Geen hydration, geen framework, geen templating-engine (Python string-formatting). Elke pagina is één regel HTML zonder newlines (`wc -l index.html` = 1).

**Metingen output (142 HTML-bestanden, `_build/` bevat er 0):**

| Maat | Waarde |
|---|---|
| Aantal HTML | 142 (141 indexeerbaar + `404.html`) |
| Totale HTML | 6.339.405 B |
| Gemiddelde / mediaan | 44.643 B / 44.268 B |
| Min / max | 35.270 B (`/404.html`) / 64.156 B (`/`) |
| Gzip gem. / mediaan | 10.392 B / 10.215 B |
| Woorden in `<main>`: `/` | 1.582 |
| Woorden in `<main>`: `/lachgas-bezorgen/arnhem/` | 667 |
| Woorden in `<main>`: `/informatie/wat-is-lachgas/` | 894 |
| Woorden in `<main>` alle pagina's | gem. 717, mediaan 649, min 63 (404), max 1.582 |
| Pagina's < 300 woorden | 1 (alleen `/404.html`) |

Verdeling per sectie (gem. woorden in main): `informatie` 896, `bezorggebied` 881, `service` 793, `veelgestelde-vragen` 754, `lachgas-tanks` 714, `lachgas-bezorgen` 638, `contact` 429, `sitemap` 318.

Opbouw van één plaatspagina (`lachgas-bezorgen/arnhem/index.html`, 44.862 B): `<head>` 22.306 B (50 %; waarvan inline CSS 16.967 B en JSON-LD 2.832 B), header + mobiel menu 10.073 B (22 %), `<main>` 8.427 B (19 %), footer 2.775 B (6 %). Inline SVG totaal 8.890 B. Tekst-/HTML-ratio: 4.153 B tekst in main = **9,3 %** van de pagina. De "echte" content is dus een vijfde van de bytes; de rest is boilerplate die op alle 142 pagina's herhaald wordt.

**JavaScript (alles first-party, `defer`, onderaan `<body>`):**

| Bestand | Raw | Gzip | Functie |
|---|---|---|---|
| `js/site.js` | 2.931 B | 1.319 B | Scroll-reveal (`.rv`/`.in`), mobiel menu sluiten na navigatie, `serviceWorker.register("/sw.js")` (`site.js:51-53`); respecteert `prefers-reduced-motion` (`site.js:24`) |
| `js/nav.js` | 6.950 B | 2.550 B | Eigen soft-navigation router: prefetch bij `mouseover` (65 ms), `pointerdown`, `touchstart` en via `IntersectionObserver` (max 16 links, `rootMargin 240px`, `requestIdleCallback`), respecteert `saveData`/2g (`nav.js:6-7`); vervangt `<main>`, header en footer via `DOMParser`, `pushState`, voortgangsbalk; synchroniseert alleen `title`, `description`, `robots`, `canonical`, `og:url` (`nav.js:48-52`), niet JSON-LD/hreflang/og:title |
| `sw.js` | 2.292 B | 952 B | Service worker: statische extensies cache-first (`sw.js:22-30`), HTML stale-while-revalidate met cap 150 pagina's (`sw.js:31-44`), versie = SHA1-hash van alle html/js/css/woff2 (`apply_speed.py:81-87`, nu `83bbddd07e`) |
| **Totaal geserveerd** | **12.173 B** | **4.821 B** | Per paginaweergave: 9.881 B (site.js + nav.js) |

Bronnen staan in `_build/speed/` en zijn byte-identiek aan de output (`diff` leeg), behalve `sw.js` waar `__BUILD__`/`__PRECACHE__` zijn ingevuld. `apply_speed.py:79` verwijst naar `site-template.js` dat niet in de repo zit (alleen gebruikt voor `kind == "template"`, hier `"brabant"`).

**Service worker — details.** `PRECACHE = ["/","/js/site.js","/js/nav.js","/fonts/manrope.woff2"]` wordt in de `STATIC`-cache gezet (`sw.js:4,7`), maar de fetch-handler raadpleegt `STATIC` alleen voor paden die op een statische extensie eindigen (`sw.js:22`); `/` valt in de `PAGES`-tak en wordt daar met `c.match("/")` als offline-fallback gezocht (`sw.js:42`) — de precache van `/` in `STATIC` is dus dode opslag. Overige logica is correct (origin-check, GET-only, content-type-check, `skipWaiting`+`clients.claim`, oude caches opruimen).

Speculation Rules worden in `common.py:309` wél gegenereerd en in `apply_speed.py:43` weer verwijderd ("dubbel werk naast de router") — dode codepad in de renderer. In de output: 0/142 pagina's met `speculationrules`.

---

## 2. URL-architectuur

- **Slug-conventie:** uitsluitend `[a-z0-9-]`; 0 paden met hoofdletters, underscores of andere tekens. Geen datums of ID's; cijfers alleen functioneel (`/lachgas-tanks/2kg/`, `/4kg/`, `/10kg/`, `/informatie/lachgas-en-vitamine-b12/`, `/service/leeftijdscontrole-18-plus/`). Langste slug: 56 tekens (`/informatie/betrouwbare-lachgas-bezorgservice-herkennen/`). Apostrof-plaatsnaam netjes afgevlakt naar `s-heerenberg`.
- **Diepte:** max **2 segmenten**. Verdeling: 1 pagina op 0 (`/`), 11 op 1, 130 op 2. Secties: `/lachgas-bezorgen/<80 plaatsen>/`, `/bezorggebied/<5 regio's>/`, `/informatie/<25>/`, `/service/<12>/`, `/veelgestelde-vragen/<5>/`, `/lachgas-tanks/<3>/`, plus `/over-ons/`, `/contact/`, `/privacy/`, `/algemene-voorwaarden/`, `/sitemap/`.
- **Trailing slash:** overal `directory/index.html`; `build.py:62` zet `index.html` achter elk pad dat op `/` eindigt. `vercel.json:2` → `"trailingSlash": true` (Vercel 308-redirect van `/pad` naar `/pad/`). Enige `.html`-pad: `/404.html`.
- **Redirects:** geen `redirects`/`rewrites`/`cleanUrls` in `vercel.json`; geen `_redirects`, geen `meta http-equiv="refresh"` (0 treffers). `/pad/index.html` blijft daardoor als duplicaat opvraagbaar; de self-canonical vangt dat op.
- **Canonicals:** 141/142 absoluut, self-referencing, met trailing slash (`seo_master.py:342`); 0 afwijkingen (`canonical != self: []`). Set canonicals is **identiek** aan de sitemap-set. `404.html` heeft bewust geen canonical/hreflang/og:url (`seo_master.py:341-346`).
- **Paginering:** niet aanwezig (hubs tonen alle items op één pagina; `/bezorggebied/` lijst alle 80 plaatsen als chips).
- **404/410:** `404.html` in de root (Vercel serveert die automatisch voor statische deploys), `<meta name="robots" content="noindex, follow">`, eigen titel, 63 woorden met 6 chips naar hoofdsecties + CTA. Niet in sitemap (`pages.py:258` `sitemap=False`). Geen 410-mechanisme (niet nodig voor statisch).

---

## 3. Head & meta

**Volgorde (identiek op alle 142 pagina's, afgedwongen door `seo_master.build_head`, `seo_master.py:292-374`):**
`charset` → `viewport` → `title` → `description` → `robots` → `canonical` → `hreflang nl` → `hreflang x-default` → `og:type/site_name/locale/title/description/url/image/image:width/image:height/image:alt` → `twitter:card/title/description/image/image:alt` → `theme-color` → `geo.region` (`NL-GE`) → `geo.placename` → `icon svg` → `icon ico` → `apple-touch-icon` → `manifest` → `preload font` → `<style>` → JSON-LD-blokken. Scripts staan niet in de head.

**Title (alle 142):** min 28, gem. 48,1, mediaan 47, max 60; **0 titles > 60 tekens**, 3 < 30 (`Contact | …`, `Sitemap | …`, `Over ons | …`). **142/142 uniek (100 %)**. `title == H1`: 0/142 (titels zijn altijd anders geformuleerd dan de H1).

Titelpatronen:
- 80/80 plaatspagina's: `Lachgas <Plaats> bestellen | Lachgas Gelderland` (gegenereerd door `seo_master.new_title`, `seo_master.py:250-254`, op basis van `Service.areaServed.name`).
- Service (13), FAQ (6), tanks (4), juridisch, contact, over-ons, sitemap, 404: `<onderwerp> | Lachgas Gelderland`.
- Regio-hubs (6): `Lachgas bezorgen in <Regio> | <plaatsnamen>` — zonder merk.
- **25 van 26 informatiepagina's hebben geen merknaam** in de title (bijv. `Wat is lachgas (N2O)? Uitleg over stof, gebruik en werking`), omdat `new_title` het merk alleen toevoegt als het binnen 60 tekens past en de staart "generiek" is (`seo_master.py:255-269`). Totaal 30 titles zonder merk. Inconsistent binnen de site, maar inhoudelijk verdedigbaar (lengte-budget).

**Description:** min 118 (404), gem. 149,5, mediaan 150, max 155; **0 > 160** (`trim_desc`, `seo_master.py:94-105`, knipt op zinsgrens tussen 120-160), 0 < 70. **142/142 uniek**. Alle 80 plaats-descriptions beginnen met hetzelfde sjabloon `Lachgas bestellen in <Plaats>?` maar zijn verder uniek (wijken/kernen).

**Overige head-elementen (aantal pagina's):**

| Element | Aantal |
|---|---|
| `charset` als eerste in head | 142/142 |
| `viewport width=device-width, initial-scale=1` | 142 |
| `robots index, follow, max-image-preview:large` | 141 |
| `robots noindex, follow` | 1 (404) |
| canonical | 141 |
| `hreflang="nl"` + `x-default` (beide self) | 141 |
| OG compleet incl. `og:image:alt` | 142 |
| Twitter `summary_large_image` incl. `twitter:image:alt` | 142 |
| `og:type=article` / `website` | 23 / 119 |
| `theme-color #1c1917` | 142 |
| `geo.region NL-GE` + `geo.placename` | 142 |
| favicon SVG + ICO (`sizes="32x32 48x48"`) + apple-touch-icon (180×180) | 142 |
| `manifest.webmanifest` | 142 |
| `<html lang="nl">` | 142 |
| `preconnect` / `dns-prefetch` | 0 / 0 (gstatic-preconnect door `apply_speed.py:36` verwijderd) |
| `preload` font `/fonts/manrope.woff2` (`as=font crossorigin`) | 142 |
| `preload as=image` / `fetchpriority` | 0 / 0 |
| externe stylesheet / extern script | 0 / 0 |

Opmerkingen: hreflang `nl` + `x-default` die beide naar dezelfde URL wijzen is redundant op een eentalige site (niet schadelijk). Eén OG-afbeelding voor alle 142 pagina's (`/assets/og-lachgas-gelderland.png`, 1200×630 gedeclareerd én werkelijk, 121.099 B PNG). Manifest heeft `id`, `start_url`, `scope`, `display: standalone`, 192/512-iconen maar geen `purpose: maskable`.

---

## 4. Structured data

**Alle `@type`'s (397 blokken, 12 types, 0 parse-fouten):**

| @type | Aantal | Waar |
|---|---|---|
| BreadcrumbList | 140 | alle behalve `/` en `/404.html` |
| FAQPage | 112 | home, hubs, plaatsen, services, tanks, FAQ-pagina's, contact |
| Service | 97 | 80 plaatsen + 5 regio's + 12 services |
| Article | 23 | `/informatie/<artikel>/` |
| ItemList | 11 | overzichtspagina's (bezorggebied, regio's, tanks, informatie, service, thema-hubs) |
| WebPage | 5 | thema-hubs (2), privacy, voorwaarden, sitemap |
| Product | 3 | tanks |
| CollectionPage | 2 | `/service/`, `/veelgestelde-vragen/` (toegevoegd door `seo_master.py:215-217`) |
| LocalBusiness, WebSite, AboutPage, ContactPage | 1 elk | home, home, `/over-ons/`, `/contact/` |

Blokken per pagina: 3 op 101 pagina's, 2 op 33, 4 op 7, 0 op 1 (404). Elk object in een eigen `<script type="application/ld+json">`; **geen `@graph`**. Volgorde afgedwongen: hoofdentiteit → ItemList → BreadcrumbList → FAQPage (`seo_master.py:223-224`).

**Koppeling via `@id`:** twee top-level `@id`'s (`…/#business` op LocalBusiness, `…/#website` op WebSite). Geneste referenties: `#business` **123×** (als `Service.provider`, `Article.publisher`, `WebSite.publisher`, `AboutPage/ContactPage.mainEntity`), `#website` **9×** (`isPartOf` op WebPage/AboutPage/ContactPage/CollectionPage). De graaf is dus consistent gekoppeld, al worden de referenties deels als volledig object herhaald (`Service.provider` bevat `@type`, `name`, `url`, `telephone` naast `@id`; `seo_master.py:117-118`).

**Generatie:** basis in `common.py:106-150` (`business_schema`, `website_schema`, `crumbs_schema`, `faq_schema`, `service_schema`, `article_schema`, `webpage_schema`, `itemlist_schema`), per paginatype samengesteld in `pages.py`, daarna genormaliseerd door `seo_master.fix_schema` (`seo_master.py:162-198`): Article krijgt `image`, `url`, `publisher` met logo; Product verliest `offers` (`seo_master.py:180` `o.pop("offers")`) en krijgt `brand`/`image`; WebPage-achtigen krijgen `isPartOf`, `inLanguage`, `dateModified`.

**Properties per type:** Service = `name, description, url, serviceType, provider, areaServed, availableChannel` (plaatspagina's: `areaServed.@type=City` met `geo.GeoCoordinates`, `pages.py:125`). Article = `headline, description, inLanguage, mainEntityOfPage, datePublished, dateModified, author(Organization), publisher(+logo ImageObject 512×512), url, image[]`. Product = `name, description, url, brand, image` (geen offers, geen reviews). LocalBusiness = 19 properties incl. `priceRange "€€"`, `paymentAccepted`, `openingHoursSpecification` ma-zo 00:00-23:59, `contactPoint`, `sameAs` (alleen een wa.me-link), `address` met **alleen** `addressRegion` + `addressCountry`.

**Markup die Google niet (meer) toont:** FAQPage op **112 pagina's** met 395 vragen (gem. 3,5; min 3; max 11). Sinds augustus 2023 toont Google FAQ-rich results alleen voor overheids-/gezondheidsautoriteiten; voor deze site is dat dus vooral kosmetisch/LLM-voer. Positief: alle 395 vragen zijn uniek over de site, en op 0 pagina's bevat het schema meer vragen dan er zichtbare `<details>` zijn (1-op-1 met de HTML). Geen HowTo, geen Speakable, geen VideoObject.

**Mogelijk misleidend / zwak:**
- **AggregateRating/Review: 0** — geen nep-beoordelingen. Goed.
- **LocalBusiness zonder adres** (geen `streetAddress`, `addressLocality`, `postalCode`, geen `geo`), met 24/7-openingstijden en `sameAs` dat alleen naar WhatsApp wijst. Voor een LocalBusiness is dat dun; Google vereist voor Local-rich-results een fysiek adres. Eerder een `Organization`-profiel dat als `LocalBusiness` is getypeerd.
- **Product zonder `offers`**: eerlijk (prijs op aanvraag), maar daarmee komt geen Product-rich-result in aanmerking; het blok levert vooral entiteitscontext.
- **Datum-bug in Article:** alle 23 artikelen hebben `datePublished: 2026-10-12` en `dateModified: 2026-10-03` — **gewijzigd vóór gepubliceerd**. Oorzaak: `common.py:138` `def article_schema(..., modified=TODAY)` — de default-waarde wordt bij import geëvalueerd met de zustersite-default `TODAY = "2026-10-03"` (`common.py:34`), vóórdat `configure()` `TODAY` op `2026-10-12` zet (`_site.py:27`). Daarnaast zet `seo_master` `dateModified: 2026-10-18` op WebPage-types en `lastmod 2026-10-18` in de sitemap (`seo_master.py:21`). Drie verschillende "datums" uit drie constanten, geen daarvan is een echte wijzigingsdatum.

**Volledig voorbeeld — JSON-LD van `/lachgas-bezorgen/arnhem/` (3 blokken, exact zoals in de HTML, hier ingesprongen):**

```json
{"@context":"https://schema.org","@type":"Service",
 "name":"Lachgas bezorgen in Arnhem",
 "description":"Lachgas bestellen in Arnhem? Verzegelde lachgastanks thuisbezorgd van het Spijkerkwartier tot Schuytgraaf, meestal binnen 15 tot 25 minuten. 18+.",
 "url":"https://lachgasgelderland.nl/lachgas-bezorgen/arnhem/",
 "serviceType":"Lachgas bezorgservice",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgasgelderland.nl/#business","name":"Lachgas Gelderland","url":"https://lachgasgelderland.nl/","telephone":"+31684626182"},
 "areaServed":{"@type":"City","name":"Arnhem","geo":{"@type":"GeoCoordinates","latitude":51.985,"longitude":5.899}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/31684626182","name":"WhatsApp"}}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgasgelderland.nl/"},
 {"@type":"ListItem","position":2,"name":"Bezorggebied","item":"https://lachgasgelderland.nl/bezorggebied/"},
 {"@type":"ListItem","position":3,"name":"Arnhem en de Liemers","item":"https://lachgasgelderland.nl/bezorggebied/arnhem-liemers/"},
 {"@type":"ListItem","position":4,"name":"Arnhem","item":"https://lachgasgelderland.nl/lachgas-bezorgen/arnhem/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Bezorgen jullie ook in Arnhem-Zuid en Elden?","acceptedAnswer":{"@type":"Answer","text":"Ja, Malburgen, Elderveld, De Laar, Rijkerswoerd, Schuytgraaf en het dorp Elden vallen gewoon onder Arnhem. (…)"}},
 {"@type":"Question","name":"Kunnen jullie leveren op de Korenmarkt of bij station Arnhem Centraal?","acceptedAnswer":{"@type":"Answer","text":"Nee, wij leveren alleen op een privéadres (…)"}},
 {"@type":"Question","name":"Tot hoe laat kan ik in Arnhem een lachgastank laten bezorgen?","acceptedAnswer":{"@type":"Answer","text":"Onze WhatsApp is dag en nacht bereikbaar (…)"}}]}
```
(Antwoordteksten ingekort met "(…)"; in de bron staan ze volledig, 2.832 B JSON-LD op deze pagina.)

Ter vergelijking de home-`LocalBusiness` (ingekort): `@id #business`, `alternateName ["lachgasgelderland.nl"]`, `logo {ImageObject 512×512}`, `image og.png`, `telephone`, `email`, `priceRange "€€"`, `currenciesAccepted "EUR"`, `paymentAccepted "Contant, Tikkie"`, `areaServed {AdministrativeArea Gelderland}`, `address {PostalAddress, addressRegion Gelderland, addressCountry NL}`, `openingHoursSpecification [ma-zo 00:00-23:59]`, `contactPoint {customer service, telephone, email, url wa.me, availableLanguage ["nl"]}`, `sameAs ["https://wa.me/…"]`.

---

## 5. Crawl & indexatie

**`robots.txt` (volledig, 74 B):**
```
User-agent: *
Allow: /

Sitemap: https://lachgasgelderland.nl/sitemap.xml
```
Geen `Disallow`, geen AI-bot-regels, geen verwijzing naar `llms.txt`. Gegenereerd in `build.py:68`.

**`sitemap.xml`:** enkelvoudige urlset, **141 URL's** (alle indexeerbare pagina's; `404.html` ontbreekt terecht). Elke `<url>` heeft `loc`, `lastmod`, `changefreq`, `priority`.
- `lastmod`: **141× exact `2026-10-18`** — één hardgecodeerde constante (`seo_master.py:21`, overschrijft `build.py:65` dat `C.TODAY` = `2026-10-12` gebruikte). Geen echte wijzigingsdatums; Google negeert `lastmod` zodra die aantoonbaar niet klopt.
- `changefreq`: weekly 87, monthly 54. `priority`: 1.0 ×1, 0.9 ×8, 0.8 ×99, 0.7 ×29, 0.6 ×1, 0.3 ×3 (beide velden worden door Google genegeerd).
- **Consistentie:** sitemap-URL's == canonicals (0 verschil) == bestaande `index.html`-bestanden (alleen `404.html` buiten de sitemap). 141/141 met trailing slash. 0 noindex-pagina's in de sitemap.
- Geen sitemap-index, geen image-/news-sitemap (niet nodig bij deze omvang).
- HTML-sitemap `/sitemap/` (142 unieke interne links) linkt ook naar `/sitemap.xml`.

**RSS/Atom:** niet aanwezig (geen feed voor de 23 artikelen).

**IndexNow:** `4b7d2e91c6a04f3e8d5b1a2c9e7f6038.txt` in de root (32 B, inhoud = bestandsnaam = `INDEXNOW_KEY` in `_site.py:31`; geschreven door `build.py:73`). **Geen ping-code**: `grep -ri indexnow` in `_build/*.py`, js, html levert alleen de twee key-regels op. De sleutel ligt klaar, maar er wordt nooit gesubmit.

**llms.txt:** `llms.txt` (37.435 B, 153 regels: één regel per pagina met `[title](url): description`, plus contact) en `llms-full.txt` (638.294 B, 6.707 regels, platte tekst van alle 141 pagina's via `common.page_text`). Titels worden door `seo_master.py:550-562` gesynchroniseerd met de definitieve `<title>`s. Niet gerefereerd vanuit `robots.txt` of HTML (alleen `llms.txt` verwijst zelf naar `llms-full.txt`).

**Google verification / analytics:** 0 pagina's met `google-site-verification`, gtag, GTM, Plausible, Hotjar, Clarity, Facebook-pixel. Externe hosts in `index.html`: alleen `lachgasgelderland.nl`, `wa.me`, `schema.org`, `w3.org` (SVG-namespace).

**Noindex:** alleen `404.html`; niet in sitemap; geen canonical. Correct.

---

## 6. Interne links

**Navigatiestructuur per pagina (identiek op alle 142):**
- Header (`common.py:197-204`): logo (`aria-label="…, naar de homepage"`) + 5 hoofdmenu-links (`<nav class="nav" aria-label="Hoofdmenu">`) + WhatsApp-knop + `<details class="menu">` met mobiel menu (`<nav class="menu-panel" aria-label="Mobiel menu">`, **27 links**: 4 tegels, 1 productkaart, 4 groepen à 4-6 links, WA-knop). Het mobiele menu staat op desktop in de DOM (`display:none` ≥ 900 px) en telt dus op elke pagina mee als 27 extra links.
- Footer (`common.py:207-218`): logo + 3 kolommen (Bezorggebied 6, Informatie 8, Service 11) + legal (voorwaarden, privacy, sitemap) = **31 links**.
- Boilerplate totaal (header + menu + footer): **~65 links/pagina**, tegenover gem. **14,7 links in `<main>`** (min 2, max 140 op `/bezorggebied/`).

**Totalen (BFS-script):** 10.752 interne links, **75,7 per pagina**, 41,5 unieke per pagina. 0 kapotte interne links. **0 `nofollow`/`sponsored`/`ugc`.** Alle 796 `wa.me`-links en externe links hebben `target="_blank" rel="noopener"` (0 zonder). Externe domeinen: `wa.me` 796, `rijksoverheid.nl` 29, `drugsinfo.nl` 10, `iriszorg.nl` 9, `trimbos.nl` 5 — allemaal uit de whitelist in `_config.py` ("external").

**Breadcrumbs:** HTML op 141 pagina's (`<nav aria-label="Kruimelpad"><ol class="crumbs">`, laatste item `<li aria-current="page">`, `common.py:221-225`) + `BreadcrumbList`-JSON-LD op 140 (home heeft geen kruimelpad, 404 geen schema). Diepte: Home › Sectie › (Regio ›) Pagina, max 4 niveaus op plaatspagina's.

**Hub ↔ detail:**
- Regio-hub → plaatsen: alle plaatsen van de regio als chips (`/bezorggebied/veluwe/` → 21 unieke plaatslinks) + gemeententabel (`pages.py:92-94`, `<table class="tbl">` op 5 hubs + tanks-index = 6 tabellen).
- Plaats → hub: kruimelpad + sticky `<aside>` + chip "Heel <Regio>" (4 links naar eigen hub, 2 naar elke andere hub via footer/menu).
- Plaats → plaats: 3 `nearby`-chips (`pages.py:116`, bijv. `apeldoorn` → `eerbeek`, `twello`, `vaassen`).
- Informatie-index → artikelen gegroepeerd + 2 thema-hubs (`pages.py:129-144`); artikel → gerelateerd: gem. **4,6 contextuele links in de lopende tekst** (`.prose`) + ~5 "Verder lezen"-chips + "Alle informatie".
- Service/FAQ: index-cards + chips naar zusterpagina's + `related_links` (`pages.py:28-39`).

**Klikdiepte vanaf `/` (BFS over alle interne hrefs):**

| Diepte | Pagina's |
|---|---|
| 0 | 1 |
| 1 | 49 |
| 2 | 91 |
| **max** | **2** |

Onbereikbaar: alleen `/404.html` (by design). Alleen via `<main>`-links (zonder header/footer/menu): diepte 0:1, 1:38, 2:99, 3:1 (`/algemene-voorwaarden/`); 3 pagina's zijn alleen via footer/menu bereikbaar (`/sitemap/`, `/over-ons/`, `/404.html`). De platte structuur komt dus niet alleen door de 65 boilerplate-links: 99 % is ook via content binnen 2 klikken.

**Wezen (orphans, 0 inbound links):** **0** — alleen `/404.html`, dat per definitie geen inbound hoort te hebben. Inbound-verdeling: mediaan 7, min 3 (`/informatie/begrippenlijst-lachgas/`), daarna 4 (`geschiedenis-van-lachgas`, `lachgas-en-mentale-gezondheid`, plaatsen `beneden-leeuwen`, `berg-en-dal`, `doesburg`, `overasselt`), max 141 (hoofdsecties via boilerplate).

**Ankertekst:** overwegend beschrijvend. Top-ankers zijn navigatielabels (`veelgestelde vragen` 435, `lachgas tanks` 431, `contact` 428, `bezorggebied` 374, regionamen 305-312, servicenamen 286-309). In kaarten staat een secundaire `.more`-span: `Bekijk de tank →` 246, `Lees meer →` 69, `Bekijk de vragen/regio/thema →` 14, 3 specifieke varianten — maar de kaart zelf is de `<a>` en bevat ook de `<h3>`-titel, dus de effectieve ankertekst is titel + tekst + "Lees meer". Generieke losse ankers ("lees meer", "klik hier", "hier"): **3 van 10.752**. Logo-link in footer heeft geen `aria-label`, waardoor de toegankelijke naam `L Lachgas Gelderland` wordt (de `<b>L</b>` + `<span>`); in de header is dat wel opgelost.

---

## 7. HTML-semantiek

**Koppen:**
- H1: **142/142 pagina's exact 1 H1** (0 zonder, 0 met meerdere).
- Totaal H2 821, H3 760, geen H4-H6. **0 pagina's met overgeslagen niveau** (H1→H2→H3). Footer-kolomkoppen zijn `<h3>` (142×) en volgen altijd op een H2 in de CTA-sectie.
- **71 pagina's waar de H1-tekst letterlijk als H2 terugkomt**: 68 plaatspagina's (sticky aside `<h2>Lachgas bezorgen in <Plaats></h2>` = H1, `pages.py:113`) en 3 tankpagina's (aside `<h2>` = H1, `pages.py:191`). Niet fout, wel redundant.
- 33 `<h2>`'s dragen inline `style="font-size:…"`/`margin` (`pages.py:75,93,96,133,138,141,251`) — presentatie in markup.
- Artikelen (26) hebben een `<nav class="toc" aria-label="Inhoud">` met `<ol>` naar `<h2 id="…">`-ankers (`common.py:284-297`, alleen bij ≥ 4 secties).

**Landmarks per pagina:** `<header>` 1 (142), `<nav>` 3 op 115 pagina's (hoofdmenu, mobiel menu, kruimelpad), 4 op 26 (+toc), 2 op 1 (home zonder kruimelpad), `<main id="inhoud">` 1 (142), `<aside>` 1 op 85 (plaatsen, tanks, contact, home), `<footer>` 1 (142), `<article>` **0** (artikelen gebruiken `<div class="prose">`), `<section>` 2-10 per pagina (mediaan 6). Alle `aria-label`s op nav-landmarks aanwezig en uniek per type.

**Skip-link:** `<a class="skip" href="#inhoud">Direct naar inhoud</a>` als eerste body-element op 142/142 (`common.py:199`), zichtbaar op focus (`site.css:18-19`).

**Afbeeldingen:** 145 `<img>` totaal (139 pagina's met 1, 3 met 2). **0 zonder `alt`-attribuut**, 142 met leeg `alt=""` (de 56×56-thumbnail in het mobiele menu, decoratief naast tekst — correct), 3 met beschrijvende alt (`Verzegelde lachgastank 2KG van …`). 145/145 met `width`+`height`, `loading="lazy"`, `decoding="async"`; 3/145 met `srcset` + `sizes`. Geen `<picture>`, geen `fetchpriority`.

**SVG:** 4.436 inline SVG's (31,2 per pagina), 886 met `aria-hidden="true"` (20 %). De `ICON`-set (`common.py:92-102`) heeft `aria-hidden`, de `MM_ICON`-set van het mobiele menu (`common.py:153-159`, tegels + chevrons) niet; die staan in links met tekst, dus de impact is beperkt maar inconsistent.

**ARIA-gebruik:** `aria-hidden=true` 886, `aria-current="page"` 209, `aria-label` op logo/hoofdmenu/menu-knop/mobiel menu/WA-float/kruimelpad/toc. **Misbruik van `aria-current="page"`:** in het hoofdmenu krijgt de sectielink `aria-current="page"` zodra het pad met die sectie begint (`common.py:198` `path.startswith(h)`); op 38 van de 43 gevallen is dat een hub-link en niet de huidige pagina (hoort `aria-current="true"`/`"location"` te zijn). Geen `role`-attributen (native elementen). Menu via `<details>/<summary>` (toegankelijk zonder JS). FAQ via `<details>` met eerste item `open` (112 pagina's).

**Inline styles:** 597 `style="…"`-attributen (gem. 4,2/pagina), o.a. `display:flex;gap:10px` op de header-knoppengroep, `position:sticky;top:84px` op asides, `color:#fff` op footer-links.

**`lang`:** `<html lang="nl">` 142/142; geen `lang`-wissels in de content.

---

## 8. Performance

**CSS-strategie:** volledig inline, één `<style>` per pagina, **16.952 B** op elke pagina (min = max), samengesteld uit `_build/fonts.css` (1.056 B, 3 `@font-face`) + geminificeerd `_build/site.css` (15.318 B bron, comments/newlines gestript door `common._minify_css`) + master-blok `/*master*/…/*master-end*/` (1.025 B, `seo_master.py:28-48`). Geen externe stylesheet, geen Tailwind/framework, 82 unieke klassen, 0 `!important`. Over de site: 16.952 × 142 = **2.407.184 B CSS** die per pagina opnieuw wordt gedownload (gzip-deel ~4,1 KB van de 10,4 KB gzip per pagina). Dat is de klassieke inline-trade-off: geen render-blocking request, maar niets cachebaar tussen pagina's — deels gecompenseerd door de SW (pagina's SWR) en de router (prefetch). Geen critical/non-critical splitsing.

**Fonts:**
- Self-hosted: `/fonts/manrope.woff2`, **22.580 B**, één bestand voor gewichten 500/700/800 (drie `@font-face`-declaraties met dezelfde `src`); de woff2 bevat `HVAR`- en `STAT`-tabellen → **variabel font**. `apply_speed.py:13-31` herschrijft de gstatic-URL's uit `fonts.css` naar het lokale pad en kopieert het bestand uit `_build/speed/fonts/`.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` op 142/142, vóór de `<style>`.
- `font-display: optional` (door `apply_speed.py:34` van `swap` gewijzigd) — met preload de juiste CLS-vrije keuze: óf het font is er binnen ~100 ms, óf de fallback blijft.
- `unicode-range` latin-subset gedeclareerd (`fonts.css`), maar het bestand zelf is één subset; ok.
- **Geen `size-adjust`/`ascent-override`/`descent-override`** voor de fallback (het enige grep-treffer `size-adjust` is `-webkit-text-size-adjust:100%` op `html`). Omdat Manrope alleen voor `h1-h4`, `.logo`, `.usp b`, `.products .size` wordt gebruikt en body-tekst op `system-ui` draait (`site.css:5`), is het CLS-risico beperkt tot koppen — en `optional` voorkomt een swap na first paint.
- `preconnect fonts.gstatic.com` wordt in `common.py:331` nog uitgestuurd en door `apply_speed.py:36` weer verwijderd (0 in output).

**Afbeeldingen:** 3 WebP (`lachgastank-2kg.webp` 20.402 B 480×640, `-300.webp` 10.786 B, `-160.webp` 3.620 B; VP8X-container), 4 PNG (icon-512 7.076 B, icon-192 2.453 B, apple-touch 2.365 B, OG 121.099 B 1200×630), 1 SVG-favicon (168 B), 1 ICO (327 B). **Geen AVIF, geen JPG.** `srcset`/`sizes` alleen op de 3 productfoto's (`common.py:189`, `pages.py:190`: `300w, 480w`, `sizes="(min-width: 768px) 300px, 70vw"`). Alle `<img>` met `width`/`height`, `loading="lazy"`, `decoding="async"`. Er is **geen hero-afbeelding**: LCP op elke pagina is tekst (H1/lead) in de `.hero`/`.phead`-sectie, met inline CSS en gepreloade font → LCP zou zeer snel moeten zijn. `fetchpriority` en `<picture>` komen niet voor (niet nodig). De OG-PNG van 121 KB is het enige "zware" asset en wordt alleen door social-crawlers opgehaald.

**Third-party scripts:** **0** (geen analytics, tag manager, chat-widget, maps, fonts-CDN, consent-banner). Alle requests gaan naar de eigen origin (+ `wa.me` als uitgaande link).

**Prefetch / prerender:** geen `<link rel="prefetch|prerender">`, geen Speculation Rules (bewust verwijderd). In plaats daarvan de eigen `nav.js`-router: prefetch bij hover (65 ms debounce), `pointerdown`, `touchstart` en zichtbaarheid (IO, max 16 links/pagina, `requestIdleCallback`), gecachet in een in-memory `Map` (max 60), uit bij `saveData`/2g. Soft-navigation vervangt `<main>`, en header/footer alleen als hun `outerHTML` verschilt (bij `aria-current`-wissel). Fallback op `location.href` bij fouten (`nav.js:75`). Focus wordt naar `<main tabindex=-1>` verplaatst na navigatie (`nav.js:63-64`) — goed voor toegankelijkheid.

**Service worker (caching-strategie):**
- `STATIC-<hash>`: cache-first voor `woff2|css|js|webp|png|jpe?g|svg|ico|avif|webmanifest`, netwerk-respons wordt bijgeschreven als `res.ok`.
- `PAGES-<hash>`: stale-while-revalidate voor navigaties/`text/html`, sleutel `pathname+search`, cap 150 entries (FIFO-trim), offline-fallback naar `/`.
- Versiehash over alle html/js/css/woff2 → elke build invalideert beide caches (activate wist oude). `sw.js` wordt met `Cache-Control: no-cache` geserveerd (`vercel.json:78-85`).
- Minpunt: SWR op HTML betekent dat een terugkerende bezoeker na een deploy nog één keer de oude pagina ziet; de hash-versie beperkt dat tot één navigatie. Dode `/`-precache (zie §1).

**Cache-headers (`vercel.json`):** `/fonts/*` 1 jaar immutable; `/assets/*`, `/img/*`, `/images/*` 30 dagen + SWR 7 dagen (de mappen `img/` en `images/` bestaan niet); `/js/*` 1 dag + SWR 7 dagen (bestandsnamen zijn niet gehasht, vandaar kort); `/sw.js` no-cache; HTML geen expliciete regel → Vercel-default (`public, max-age=0, must-revalidate` + edge-cache).

---

## 9. Styling & layout

**CSS-architectuur:** eigen component-CSS met korte semantische klassen (`.hdr`, `.nav`, `.btn/.btn-wa/.btn-dark/.btn-ghost/.btn-light/.btn-sm`, `.card`, `.chip`, `.faq`, `.steps`, `.usp`, `.pf`, `.mm-*` voor het mobiele menu, `.phead`, `.sec/.sec-alt`, `.prose`, `.tbl`, `.toc`, `.cta`, `.ftr`). Geen BEM, geen utilities (op `.narrow`, `.two`, `.g2/.g3/.g4`, `.sr` na). Kaarten zijn `<a class="card">` met geneste `<h3>/<p>` (geen interactive-in-interactive). Eén bronbestand `_build/site.css` (152 regels; het mobiele menu en de productfeature zijn aan regel 152 als één lange geminificeerde regel toegevoegd — mengsel van leesbare en reeds geminificeerde CSS).

**Design tokens:** 14 custom properties op `:root` (`--bg --surface --ink --ink-2 --muted --line --brand --brand-2 --brand-soft --dark --wa --wa-2 --radius --max`), **99× `var()`-gebruik**. Theming per site via `COLORS` in `_site.py:30` → `common.configure()` vervangt de hex-waarden in `:root` met een regex (`common.py:55-56`). Resultaat voor deze site: `--brand:#1d6f42; --brand-2:#2e9e5f; --brand-soft:#e6f4ec` (groen) terwijl de bron (`site.css:2`) oranje is.

**Token-lekken (bewijs in output-CSS van `index.html`):** 55 hardgecodeerde hex-kleuren buiten `:root`, waaronder restanten van het oranje palet van de bron-site die **niet** door de `COLORS`-override worden geraakt:
- `.notice{…border:1px solid #f6c8b4…}` (`site.css:120`) — oranje rand op een groene `--brand-soft`-achtergrond;
- `.hero-card::after{…radial-gradient(circle,rgba(226,86,42,.5),…)}` (`site.css:63`) en `.phead::before{…rgba(226,86,42,.45)…}` (`site.css:71`) — `rgb(226,86,42)` = `#e2562a`, de oude `--brand-2`; de decoratieve gloed op elke paginakop en de hero-kaart is dus oranje in een groene huisstijl;
- `.cta .btn-light:hover{background:#f0fdf4}`, `.mm-dot{background:#22c55e}`, `#nav-progress` `#22c55e` in `nav.js:38` (ander groen dan `--wa`).
Het token-systeem dekt dus ~2/3 van de kleuren; de rest is per site niet aanpasbaar zonder de bron te wijzigen.

**CLS-preventie:** alle `<img>` met dimensies (145/145); `font-display: optional` + preload; sticky header met vaste `min-height:66px`; `.menu-panel` is `position:fixed` (geen layoutverschuiving bij openen); scroll-reveal animeert alleen `opacity`/`transform` (`seo_master.py:30-31`) en wordt alleen op elementen onder de vouw gezet (`site.js:33`). **Geen `aspect-ratio`** (0×) — niet nodig bij `width/height`. `body:has(.menu[open]) .wa-float{display:none}` verbergt de zwevende knop als het menu open is.

**Mobile-first:** ja — 11 `min-width`-queries tegenover 1 `max-width` (`.toc ol{columns:1}` ≤ 640 px). Breakpoints: 440, 640, 768, 800, 900, 960 px — zes verschillende waarden zonder vaste schaal (`.steps` 800, `.ftr-grid` 800, `.nav` 900, `.two` 900, `.usp` 900, `.hero-grid` 960, `.g3/.g4` 960, `.pf` 768). `clamp()` voor `h1`/`h2` (`site.css:7-8`), `100dvh` voor de menu-hoogte, `columns:2` voor toc/sitemap. Containers: `.wrap{max-width:1180px;padding:0 20px}`, `.narrow{max-width:800px}`, `.prose{max-width:760px}`; CSS Grid voor alle layouts (`.hero-grid 1.1fr .9fr`, `.two 1fr 1fr`, `.g4 repeat(4,1fr)`, `.ftr-grid 1.4fr 1fr 1fr 1fr`).

**Dark mode:** **niet aanwezig** (0× `prefers-color-scheme`); `theme-color` is wel donker (`#1c1917`), gelijk aan de donkere paginakoppen/footers.

**Toegankelijkheid in CSS:**
- Contrast (berekend op tokens): `--muted #78716c` op `--bg #fbfaf8` **4,60:1** (AA, krap), op wit 4,80:1; `--ink-2` 9,85:1; `--brand` op wit 6,17:1; `--brand` op `--brand-soft` 5,44:1 (actieve nav); wit op `--wa #15803d` 5,02:1 (knoppen); kruimelpad `rgba(255,255,255,.55)` op `#1c1917` 6,07:1; footer-legal `.5` alpha 5,23:1. Alle gemeten combinaties ≥ 4,5:1. Het master-blok verhoogt `.cta p` naar `.95` alpha en onderstreept links in lopende tekst (`seo_master.py:46-47`).
- **Focus-styles:** alleen `.skip:focus{left:8px}`; geen `:focus-visible`-regels voor knoppen/links/chips/`summary`. Er is ook geen `outline:none` (0×), dus de browser-default outline blijft — functioneel maar niet ontworpen.
- `prefers-reduced-motion`: 1 query (master-blok) die `.rv`, de `.wa-float`-pulse (`@keyframes mring`, oneindig) en `:active`-scale uitzet; `html{scroll-behavior:smooth}` (`site.css:4`) valt daar **niet** onder.
- `backdrop-filter` op de sticky header (`site.css:21`), `-webkit-font-smoothing:antialiased`.

**Responsive images:** alleen de 3 productfoto's (`srcset 300w/480w`); de menu-thumbnail is een vaste 160 px-variant op 56×56 (2,9× DPR-marge).

---

## 10. Hosting / deploy

**Config-bestanden:** `vercel.json` (88 regels, gegenereerd door `seo_master.py:51-68,566`), `.vercelignore` (`_build`), `CNAME` (`lachgasgelderland.nl` — GitHub-Pages-conventie, door Vercel genegeerd; `build.py:69`). Geen `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`, `.github/`, `package.json`, `.well-known/`.

**Headers (`/(.*)`):**
| Header | Waarde | Beoordeling |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | 2 jaar, geen `preload` |
| `X-Content-Type-Options` | `nosniff` | ok |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ok |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | ok |
| `X-Frame-Options` | `DENY` | ok (dubbel met CSP) |
| `Content-Security-Policy` | `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` | **minimaal**: geen `default-src`/`script-src`/`style-src`; inline CSS en inline JSON-LD zouden `'unsafe-inline'` of nonces vragen, dus dit is een bewuste keuze, maar XSS-bescherming via CSP ontbreekt |
| `Cache-Control` | per pad (zie §8) | `img/`+`images/` regels verwijzen naar niet-bestaande mappen |

**Compressie / CDN:** geen eigen instelling; Vercel comprimeert (brotli/gzip) en cachet op de edge standaard. Geen `Vary`/`ETag`-tuning nodig voor statisch.

**trailingSlash/cleanUrls:** `trailingSlash: true`, geen `cleanUrls` (niet nodig met `index.html`-mappen).

**Build-pijplijn (hoe het werkt):**
1. `python3 _build/build.py` vanuit de repo-root. `common.configure(SITECFG)` zet 30+ module-globals om van de zustersite-defaults (`common.py:11-46`, "Brabant") naar deze site (`_site.py`) en herbouwt CSS + menu-groepen.
2. `load_content()` importeert alle `content/*.py` (behalve `_`-bestanden) en verzamelt `HUBS`, `AREAS`, `ARTICLES`, `SERVICE_PAGES`, `FAQ_TOPICS`, `TOPIC_HUBS`; `first()` voor singletons (`HOME`, `TANKS`, `AREA_INDEX`, …). Datastructuur per plaats: `slug, name, kind, region, gemeente, title, description, h1, lead, intro[], wijken/kernen, levertijd, faq[], nearby[], lat, lon`.
3. `Site.build_all()` → lijst van page-dicts (`path, title, description, body, schemas, robots, priority, changefreq, og_type`); `build.py:53-55` controleert op dubbele paden met `assert`.
4. `C.render()` schrijft head+body als één string; `write()` naar `<pad>/index.html`.
5. Sitemap, robots, CNAME, favicon.svg, manifest, IndexNow-key, llms.txt, llms-full.txt.
6. `apply_speed.apply(ROOT, "brabant")`: eerst `levertijd.apply_dir()` — regex `\b(\d{1,2})( ?)(tot|en|-|–)( ?)(\d{2,3})( ?)(minuten|min)\b` vervangt **elke** tijdsband in alle `.html/.txt/.xml/.json/.webmanifest` door 15-25 (`levertijd.py:5-7`). Getest: `"na 30 tot 60 minuten verdwijnt"` → `"na 15 tot 25 minuten verdwijnt"`, `"5-10 min"` → `"15-25 min"`. De regex kent geen context; in de output komt `15 tot 25 minuten` 804× voor en geen enkele andere band meer. Verwijst naar `basis_fix/<domein>.json` en `levertijd_img/<domein>/` die niet bestaan (faalt stil). Daarna fonts, scripts, SW.
7. `seo_master.apply_site()`: per HTML-bestand head parsen en herbouwen, titels normaliseren, schema's normaliseren, CSS-masterblok toevoegen, dan `sitemap.xml` lastmod → `2026-10-18`, `llms*.txt`-titels, `sw.js`-versie, `vercel.json`, `.vercelignore`.

Sterk: deterministisch, idempotent, één commando, output + generator in één repo, geen dependencies buiten de Python-stdlib. Zwak: drie lagen die elkaar corrigeren (renderer zet preconnect/speculation rules neer, speed-laag haalt ze weg; renderer bouwt een head, master-pas bouwt hem opnieuw); hardgecodeerde datums op drie plekken (`common.py:34`, `_site.py:27`, `seo_master.py:21`); default-argument-bug (§4); globale regex-herschrijving van content.

**Git-geschiedenis:** 9 commits, 2026-10-13 02:55 → 2026-10-22 10:51 UTC, één auteur (`Claude <noreply@anthropic.com>`, Co-Authored-By-trailers), branch `main` + `origin/main`.

| Commit | Datum | Bestanden | Inhoud |
|---|---|---|---|
| `b52b37a` | 10-13 | 192, +12.790 | Initiële site (142 pagina's) incl. generator en output |
| `a55b14c`, `db0e1e2`, `6014dc7` | 10-17 | 3× 146 (+149/−149) | Telefoonnummer gewisseld, teruggezet, opnieuw gewisseld (zelfde dag) |
| `8bfa8a0` | 10-19 | 153 (+1.245/−446) | Master-pas: `seo_master.py` (578 regels), `site.json`, `site.js`, `vercel.json`, `.vercelignore`, sitemap/llms herschreven |
| `f9a5850` | 10-19 | 1 (+1) | Tabelkoppen-contrast in master |
| `34da8fe`, `fefeaa7`, `57269ce` | 10-20, 10-21, 10-22 | 3× 148 (+151/−151) | Nummer opnieuw gewisseld, gewisseld, teruggezet |

Zes van de negen commits zijn een nummerwissel die elk 146-148 gegenereerde bestanden raakt (omdat de output in git staat); het nummer wisselde 6× in 6 dagen tussen drie waarden en staat nu weer op de oorspronkelijke. Elke wissel vernieuwde ook de SW-versie (commit-bericht `57269ce`).

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Volledig statische, framework-loze output met minimale JS**: 142 pagina's, 100 % server-ready HTML, 9,9 KB first-party JS (defer), 0 third-party requests, 0 externe stylesheets; LCP is tekst met inline CSS en gepreload variabel font (`font-display: optional`).
2. **Extreem consistente head/meta-laag, afgedwongen door een herbouw-pas**: identieke elementvolgorde op 142/142, titles 28-60 tekens (0 te lang), descriptions 118-155 (0 te lang), **100 % unieke titles én descriptions**, self-canonicals == sitemap == bestanden (0 afwijkingen).
3. **Platte, volledig doorlinkte architectuur**: max 2 URL-segmenten, max klikdiepte 2 (99 % ook via content ≤ 2), **0 orphans**, 0 kapotte links, breadcrumbs in HTML én JSON-LD op 140 pagina's, hub↔detail↔nearby-koppelingen, gem. 4,6 contextuele links per artikel, 3 generieke ankers op 10.752.
4. **Schone semantiek**: exact 1 H1 op 142/142, 0 overgeslagen kopniveaus, header/nav/main/aside/footer-landmarks met labels, skip-link overal, 0 `<img>` zonder alt, alle afbeeldingen met dimensies, `<details>`-menu en -FAQ werken zonder JS.
5. **Eerlijke structured data en een complete "discoverability-laag"**: 12 JSON-LD-types via `@id` aan elkaar gekoppeld (123 verwijzingen naar `#business`), 0 AggregateRating/Review, FAQ-schema 1-op-1 met zichtbare vragen; plus `llms.txt` + `llms-full.txt`, IndexNow-key, HTML-sitemap, SW met SWR, sterke security-headers (HSTS, nosniff, Referrer-Policy, Permissions-Policy, XFO).

**Top 5 zwakke punten / fouten**
1. **Datum-bug in alle 23 Article-schema's**: `dateModified 2026-10-03` ligt vóór `datePublished 2026-10-12` (default-argument in `common.py:138` geëvalueerd vóór `configure()`); daarnaast 141× identieke sitemap-`lastmod 2026-10-18` uit een constante (`seo_master.py:21`) en WebPage-`dateModified` uit dezelfde constante — drie fictieve datums.
2. **17 KB CSS inline op elke pagina (2,4 MB over de site) zonder cachebare externe variant**, plus ~65 boilerplate-links (header + 27-link mobiel menu in de DOM + footer) tegenover 14,7 content-links: 50 % van elke pagina is `<head>`, slechts 9,3 % is tekst.
3. **Design-token-lekken uit de bron-huisstijl**: oranje restkleuren (`#f6c8b4` op `.notice`, `rgba(226,86,42,…)` in `.hero-card::after`/`.phead::before`-gloed, `site.css:63,71,120`) in een groene site; 55 hardgecodeerde hex-waarden buiten `:root`; geen dark mode; geen `:focus-visible`-styling; `scroll-behavior:smooth` niet onder reduced-motion; zes verschillende breakpoints.
4. **Structured-data-keuzes met weinig rendement**: FAQPage op 112 pagina's (Google toont dit niet meer voor commerciële sites), LocalBusiness zonder straat/plaats/geo met 24/7-openingstijden, Product zonder `offers`, 25/26 informatie-titles zonder merknaam (inconsistent met de rest), `aria-current="page"` op 38 sectielinks die niet de huidige pagina zijn, 71× H1 letterlijk herhaald als H2.
5. **Fragiele build-pijplijn en repo-hygiëne**: twee regex-herschrijfpassen die de renderer corrigeren (dode preconnect/speculation-rules-code), een contextblinde regex die élke "NN tot NN minuten" in alle bestanden herschrijft (804×), verwijzingen naar niet-bestaande bronnen (`site-template.js`, `basis_fix/`, `levertijd_img/`), IndexNow-key zonder ping-code, dode `/`-precache in de SW, cache-regels voor niet-bestaande mappen; 6 van 9 commits zijn telefoonnummer-wissels over 146-148 gegenereerde bestanden.

## SCORETABEL

| # | Onderdeel | Score | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **5** | Pure SSG, 100 % HTML klaar, 9,9 KB JS defer, geen framework, geen third-party; alleen de SW+router-combinatie is meer dan een statische site nodig heeft. |
| 2 | URL-architectuur | **5** | Lowercase-koppelteken-slugs, max 2 segmenten, consistente trailing slash (vercel.json), 141 self-canonicals identiek aan sitemap, nette noindex-404. |
| 3 | Head & meta | **4** | Vaste volgorde, OG/Twitter compleet met alt, 100 % unieke titles/descriptions binnen lengtes; minpunten: 30 titles zonder merk (inconsistent), redundante hreflang, één OG-beeld voor alles. |
| 4 | Structured data | **3** | Goede `@id`-graaf en geen nep-ratings, maar Article-datums omgekeerd, dunne LocalBusiness, Product zonder offers, FAQPage ×112 zonder rich-result-rendement, drie verschillende fictieve datums. |
| 5 | Crawl & indexatie | **4** | Sitemap/canonical/bestanden 100 % consistent, robots ok, llms.txt + IndexNow-key aanwezig; minpunten: alle lastmod identiek en fictief, geen IndexNow-ping, geen feed. |
| 6 | Interne links | **4** | Diepte ≤ 2, 0 orphans, 0 kapot, beschrijvende ankers, breadcrumbs HTML+LD, hub/detail/nearby; minpunt: 65 boilerplate-links per pagina domineren, drie pagina's alleen via footer. |
| 7 | HTML-semantiek | **4** | 1 H1 overal, geen niveau-sprongen, landmarks + skip-link, alt compleet; minpunten: 71 H1=H2-duplicaten, `aria-current`-misbruik (38), 80 % SVG zonder aria-hidden, geen `<article>`, 597 inline styles. |
| 8 | Performance | **4** | 0 third-party, 9,9 KB JS, self-hosted variabel font met preload+optional, SW + intentie-prefetch, alle img met dimensies; minpunten: 17 KB CSS per pagina niet cachebaar, geen fallback-fontmetrics, OG-PNG 121 KB, dode precache. |
| 9 | Styling & layout | **3** | Tokens met 99× var(), mobile-first, AA-contrast overal gemeten, reduced-motion deels; minpunten: oranje token-lekken in groene site, 55 hardcoded kleuren, geen dark mode, geen focus-visible, inconsistente breakpoints, inline styles op koppen. |
| 10 | Hosting/deploy | **4** | Vercel met sterke security-headers, cache-regels per pad, trailingSlash, één build-commando zonder dependencies; minpunten: CSP zonder script-src, HSTS zonder preload, dode cache-regels, fragiele regex-passen, gegenereerde output + 6 nummer-flipflop-commits in git. |

## KERNGETALLEN

| Kengetal | Waarde |
|---|---|
| Aantal HTML-pagina's | **142** (141 indexeerbaar + `404.html`) |
| Totale JS | **12.173 B raw / 4.821 B gzip** (`js/site.js` 2.931 + `js/nav.js` 6.950 + `sw.js` 2.292); per paginaweergave 9.881 B |
| Totale CSS | **16.952 B inline per pagina** (bron `site.css` 15.318 + `fonts.css` 1.056 + master-blok 1.025, geminificeerd); 142 × 16.952 = 2.407.184 B over de site; 0 externe CSS |
| Aantal JSON-LD-types | **12** (397 blokken; BreadcrumbList 140, FAQPage 112, Service 97, Article 23, ItemList 11, WebPage 5, Product 3, CollectionPage 2, LocalBusiness/WebSite/AboutPage/ContactPage 1) |
| Max klikdiepte vanaf home | **2** (alle links); 3 via alleen `<main>`-links |
| Aantal orphans | **0** (alleen `404.html` zonder inbound, by design) |
| Pagina's zonder H1 / met meerdere H1 | **0 / 0** (142/142 exact 1) |
| `<img>` zonder alt-attribuut | **0** van 145 (142 bewust leeg `alt=""`, 3 beschrijvend) |
| % pagina's met unieke title | **100 %** (142/142; descriptions ook 100 %) |
| Gem. interne links per pagina | 75,7 (41,5 uniek; 14,7 in `<main>`) |
| Title-lengte min/gem/max | 28 / 48,1 / 60 |
| Description-lengte min/gem/max | 118 / 149,5 / 155 |
| HTML-grootte gem./mediaan | 44.643 B / 44.268 B (gzip 10.392 B) |
| Woorden in `<main>` gem./mediaan | 717 / 649 |
| Sitemap-URL's | 141, lastmod 141× `2026-10-18` |
| Git | 9 commits, 2026-10-13 → 2026-10-22, 1 auteur |
