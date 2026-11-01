# Technische analyse: repo `lachgasgroningen`

Repo: `/home/user/lachgasgroningen` (statische site, 9 commits, 12–22 okt 2026). Analyse alleen-lezen; meetscripts staan in `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/` (`groningen_metrics.py`, `groningen_aggregate.py`, `groningen_bfs.py`, output `groningen_metrics.json`). Alle cijfers hieronder komen uit die scripts of uit `grep/find/wc/git`.

Let op: het onderwerp van de site is voor deze analyse niet relevant; paden en bestandsnamen worden alleen geciteerd als bewijs.

---

## 1. Stack & rendering

**Framework/generator**
- Geen generator in de repo: geen `package.json`, `build.py`, `_build/`, `templates/`, `tailwind.config.*`, `postcss`, `Makefile` (gecontroleerd met `git log --all --name-only`; de enige niet-HTML-bestanden ooit gecommit zijn de assets, `js/*.js`, `sw.js`, `vercel.json`, `robots.txt`, `sitemap.xml`, `llms*.txt`, `manifest.webmanifest`, `CNAME`, `.nojekyll`, `.vercelignore`, de IndexNow-key).
- De site is wél duidelijk gegenereerd, buiten de repo om. Bewijs:
  - `.vercelignore` (regel 1) bevat `_build` → er bestaat lokaal een `_build/`-map die nooit gecommit is.
  - `sw.js:1`: "Versie wisselt per build"; `css/site.css:1`: "utility classes live in tailwind.css, compiled per site" → multi-site generator met per-site Tailwind-compilatie.
  - CSS-injectiemarkers `/*mm*/ … /*mm-end*/` (`css/site.css:38`) en `/*master*/ … /*master-end*/` (`css/site.css:39`) komen letterlijk terug in het inline `<style>`-blok van elke pagina.
  - Template-slots als `data-extra="area"` (56×), `data-extra="article"` (54×), `data-extra="home"|"hubs"|"pf"` (1× elk).
  - Elke pagina heeft een byte-identiek inline `<style>`-blok van 31.437 bytes (min = max = 31.437 over 121 pagina's).
  - Commit `32e8d21` wijzigde 129 bestanden uniform (+1747/−5451); de zeven "nummer"-commits raken telkens 123–124 bestanden met exact ±791 of ±807 regels → scripted find/replace + regeneratie.
- CSS-framework: Tailwind CSS **v3.4.17** (marker `/*! tailwindcss v3.4.17 */` in `css/tailwind.css` en in elk inline style-blok), gepurged tot 309 unieke utility-classes.

**Renderingmodel**
- Zuiver **SSG / pre-rendered HTML**: 100 % van de inhoud staat server-side klaar. Geen hydration, geen framework-runtime, geen `<template>`/JSON-payloads.
- Progressive enhancement met twee kleine scripts (beide `defer`, op alle 121 pagina's: `<script src="/js/site.js" defer><script src="/js/nav.js" defer>`), plus één inline script van 71 bytes (`document.getElementById("year").textContent = new Date().getFullYear();`) dat overigens dubbelop is met `site.js:93`.

**Meetwaarden HTML**
| Metriek | Waarde |
|---|---|
| Aantal HTML-bestanden | **121** (120 indexeerbare `…/index.html` + `404.html`) |
| Totale HTML-bytes | 8.443.805 |
| Gemiddelde grootte | 69.784 bytes (gzip ≈ 14.470) |
| Mediaan | 69.291 bytes (gzip ≈ 14.184) |
| Kleinste / grootste | `404.html` 54.614 B / `index.html` 115.805 B |
| Gem. aantal regels | 242 (de hele `<head>` staat op één fysieke regel, regel 4) |

Byte-verdeling van een representatieve detailpagina (`bezorggebied/haren/index.html`, 69.584 B):
| Onderdeel | Bytes | Aandeel |
|---|---|---|
| inline `<style>` | 31.452 | 45,2 % |
| `<main>` | 14.809 | 21,3 % |
| mobiel menu (`#mobile-overlay` + `#mobile-panel`, verborgen DOM) | 8.642 | 12,4 % |
| footer | 5.550 | 8,0 % |
| desktop header | 2.840 | 4,1 % |
| JSON-LD (3 blokken) | 2.349 | 3,4 % |
| 43 inline SVG-iconen | 9.075 | 13,0 % (verspreid) |

Woorden in `<main>` (tekst zonder script/style/svg): gemiddeld 762, mediaan 669, min 41 (`404.html`), max 1.281 (`index.html`).
- `index.html`: 1.281 woorden
- `bezorggebied/haren/index.html`: 631 woorden
- `lachgas-informatie/wat-is-lachgas/index.html`: 901 woorden
- (extra) `product/lachgas-tank-2kg/index.html`: 669; `veelgestelde-vragen/bezorgen/index.html`: 1.161
- Pagina's met < 300 woorden in main: alleen `404.html` en `contact/index.html`.

**JavaScript**
| Bestand | Raw | Gzip | Functie |
|---|---|---|---|
| `js/nav.js` | 6.950 B | 2.552 B | Soft navigation: prefetch bij `pointerdown`/`touchstart` (r. 89–90), hover na 65 ms (r. 92), IntersectionObserver op max 16 links in beeld met `rootMargin 240px` (r. 93–111), in-memory cache van 60 pagina's (r. 5); bij klik `fetch` + `DOMParser`, vervangt `<main>`, header, footer, `#site-nav`, `#mobile-panel` (r. 44–68), synchroniseert `title`, `description`, `robots`, `canonical`, `og:url` (r. 48–52), `pushState`/`popstate` met scroll-herstel (r. 60, 82–87), voortgangsbalk (r. 36–42). Respecteert `saveData`/2g (r. 7), valt terug op harde navigatie bij fouten (r. 75). |
| `js/site.js` | 6.202 B | 2.449 B | Header-schaduw bij scroll (r. 6–12), mobiel menu met `aria-expanded` en focus op sluitknop (r. 13–20), lightbox als `role="dialog"` (r. 21–41), Escape-handler (r. 50), scroll-reveal met `prefers-reduced-motion`-check (r. 70) en 8 s-vangnet (r. 88), SW-registratie alleen op https/localhost (r. 97–99). |
| `sw.js` | 2.321 B | 959 B | Service worker (zie hieronder). |
| **Totaal** | **15.473 B** | **5.960 B** | Pagina-JS excl. SW: 13.152 B raw / 5.001 B gzip |

Geen bundler, geen modules, geen third-party JS (0 externe `<script src>`; grep op gtag/gtm/analytics/pixel/hotjar/clarity/maps/chat: 0 treffers).

**Service worker** (`sw.js`)
- Versiestring `VERSION = "03248d6e11"` (r. 2), cache-namen `static-<v>` en `pages-<v>` (r. 3).
- Precache: `/`, beide JS-bestanden, beide fonts (r. 4).
- Statische assets (regex op extensie `woff2|css|js|webp|png|jpe?g|svg|ico|avif|webmanifest`, r. 22): **cache-first**.
- Pagina's (navigate of `Accept: text/html` of pad eindigend op `/`/`.html`, r. 32): **stale-while-revalidate** met maximaal 150 entries (`PAGE_LIMIT`, r. 5, `trim()` r. 14–16); offline fallback naar `/` (r. 42).
- `skipWaiting` + `clients.claim` (r. 7, 12). Oude caches worden bij activate verwijderd (r. 9–13).
- Risico: SWR betekent dat een bezoeker eerst de oude HTML ziet; de versie moet dus per deploy wisselen. In de git-historie bleef `VERSION` op `28acea1b35` staan in de eerste vijf commits, inclusief vier commits die het telefoonnummer in 123 bestanden wijzigden (`77b179c`, `7088e9e`, `012b10d`, `fafcbac`). Pas vanaf `32e8d21` wisselt de versie per commit (`1acb707bf9` → `03248d6e11` → `e29c5cd5cb` → `03248d6e11`; de herhaling van `03248d6e11` bij identieke inhoud wijst op een content-hash).

---

## 2. URL-architectuur

- **Slug-conventie**: 100 % lowercase, koppeltekens, geen datums, geen ID's, geen underscores, geen hoofdletters (gecontroleerd over alle 120 directories). Voorbeelden: `bezorggebied/eelde-paterswolde/`, `lachgas-informatie/lachgastank-2kg-4kg-of-10kg/`, `veelgestelde-vragen/bezorgen/`.
- **Diepte**: maximaal **2 padsegmenten** (`/sectie/slug/`). Verdeling: 1 homepage, 24 pagina's op niveau 1, 96 op niveau 2 (57 onder `bezorggebied/`, 29 onder `lachgas-informatie/`, 5 onder `product/`, 5 onder `veelgestelde-vragen/`).
- **Trailing slash**: overal directory + `index.html`; `vercel.json:2` zet `"trailingSlash": true` (→ `/x` 308-redirect naar `/x/`). Interne hrefs: 0 met `.html`, 0 zonder trailing slash, 0 absolute (`https://…`) interne links, 0 met `#fragment` (de TOC-ankers `#1-…` zitten in `nav[aria-label="Inhoud"]` en zijn fragment-only, geen padlinks). Sitemap-URL's: 120/120 met trailing slash.
- **Redirects**: geen `redirects`/`rewrites` in `vercel.json`, geen `_redirects`, geen `<meta http-equiv="refresh">` (0 treffers). Alleen de impliciete trailing-slash-redirect van Vercel.
- **Canonicals**: 120/120 indexeerbare pagina's hebben exact één self-referencing, absolute canonical met trailing slash (bijv. `bezorggebied/haren/index.html:4` → `https://lachgasgroningen.nl/bezorggebied/haren/`). 0 afwijkingen t.o.v. de verwachte self-URL; canonical == `og:url` == beide `hreflang`-hrefs == sitemap-`<loc>` (0 mismatches). `404.html` heeft terecht géén canonical.
- **Paginering**: niet aanwezig (geen `rel=prev/next`, geen `/page/2/`), ook niet nodig: de grootste hub (`bezorggebied/index.html`) linkt zijn 57 detailpagina's op één pagina.
- **404/410**: `404.html` in de root (54.614 B), `<meta name="robots" content="noindex, follow">` (regel 4), geen canonical, geen `og:url`, geen JSON-LD, staat niet in `sitemap.xml`. Vercel én GitHub Pages serveren een root-`404.html` automatisch bij niet-gevonden paden; er is geen 410-mechanisme (niet nodig voor een statische site zonder verwijderde URL's).
- **Hosting-conventies in conflict**: `CNAME` (`lachgasgroningen.nl`) en `.nojekyll` zijn GitHub-Pages-artefacten, terwijl `vercel.json`/`.vercelignore` op Vercel wijzen (zie §10).

---

## 3. Head & meta

**Opbouw (identiek sjabloon op 120 pagina's; `index.html:4`, `bezorggebied/haren/index.html:4`)**

Volgorde: `charset` → `viewport` → `title` → `description` → `robots` → `canonical` → `hreflang nl` → `hreflang x-default` → 10× `og:*` → 5× `twitter:*` → `theme-color` → `geo.region` → `geo.placename` → `icon` (svg) → `icon` (ico) → `apple-touch-icon` → `manifest` → `preload` ×2 (fonts; op home ×3 met hero) → `<style>` (31,4 KB) → 2–4× JSON-LD. Slechts 5 head-varianten over 121 pagina's, en die verschillen alleen in het aantal JSON-LD-blokken (84× drie, 32× twee, 3× vier) plus de 404 (geen canonical/hreflang/og:url/JSON-LD).

- `<meta charset="utf-8">` staat als eerste element in `<head>` op 121/121 pagina's (binnen de eerste 1024 bytes).
- `<html lang="nl">` op 121/121 (eerste commit had nog `lang="nl-NL"`, gecorrigeerd in `32e8d21`).
- Viewport `width=device-width, initial-scale=1` op 121/121.

**Title**
| | |
|---|---|
| Min / gem. / mediaan / max lengte | **27 / 49,3 / 48 / 60** tekens |
| > 60 tekens | 0 |
| < 30 tekens | 1 (`sitemap/index.html`) |
| Unieke titles | **121 / 121 (100 %)**, 0 duplicaten |
| Patroon | 72 eindigen op `\| <Merknaam>`; 37 hebben geen pipe (de 27 artikelen + hubs, bijv. `Werkwijze: …`-stijl met dubbele punt); 5 eindigen op `\| 18+`; 46 titles bevatten de merknaam niet |
| Locatiepagina's | vast sjabloon `<Thema> <Plaats> bestellen \| <Merknaam>` (57×) |
| Artikelen | vrije, beschrijvende titel zonder merk (bijv. `…: zo werkt het`, `…: kiezen zonder rekensom`) |
| H1 == title | slechts 2 pagina's (bewust verschillend geformuleerd) |

**Description**
| | |
|---|---|
| Ontbrekend | 0 |
| Min / gem. / mediaan / max | **104 / 148,9 / 150 / 155** tekens |
| > 160 | 0; < 70: 0 |
| Uniek | 121 / 121 |
| Meervoudige description-tags | 0 |

**Robots meta**: 120× `index, follow, max-image-preview:large`; 1× `noindex, follow` (`404.html`). Geen `max-snippet`, geen `nosnippet`, geen `googlebot`-specifieke tag.

**Open Graph / Twitter**
- OG op 120 pagina's compleet met 10 properties: `og:type`, `og:site_name`, `og:locale` (`nl_NL`), `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width` (1200), `og:image:height` (630), `og:image:alt`. `og:type`: 94× `website`, 27× `article` (de informatie-artikelen).
- Twitter op 121 pagina's: `summary_large_image`, `title`, `description`, `image`, `image:alt`. Geen `twitter:site`/`creator`.
- Zwak punt: **één en dezelfde `og:image`** (`/assets/img/og-lachgas-groningen.jpg`, 1200×630, 63,7 KB) op alle 121 pagina's; productpagina's hergebruiken niet hun eigen productafbeelding.

**hreflang**: `nl` + `x-default` op 120 pagina's, beide self-referencing. Technisch correct, maar functioneel overbodig op een eentalige site (geen alternatieve taalversies).

**Overig**
- `theme-color` `#0f766e` op 121 pagina's (= `manifest.webmanifest` `theme_color`), zonder `media`-variant voor dark mode.
- `geo.region` (`NL-GR`) en `geo.placename` op alle pagina's: legacy-tags die Google negeert; onschadelijk.
- Favicons: `favicon.svg` (172 B, `type="image/svg+xml"`), `favicon.ico` (1.138 B, `sizes="32x32 48x48"`), `apple-touch-icon.png` 180×180; manifest met 192×192 en 512×512 PNG, `display: standalone`, `lang: nl`, `id`/`scope`/`start_url` `/`.
- `preconnect`: 0; `dns-prefetch`: 0; `prefetch`/`prerender`/`modulepreload`: 0 — logisch, er zijn geen externe origins. `preload`: 2 fonts (`as="font" type="font/woff2" crossorigin`) op alle pagina's; op `index.html` extra `preload as="image" … fetchpriority="high" media="(min-width: 1024px)"` voor de hero.
- Geen Google/Bing verificatie-meta (vermoedelijk via DNS of GSC-bestand buiten de repo).

---

## 4. Structured data

**Inventaris (331 JSON-LD-blokken, 0 parse-fouten, geen `@graph`)**

Top-level `@type` (12 soorten):
| @type | Pagina's |
|---|---|
| BreadcrumbList | 119 (alles behalve home en 404) |
| FAQPage | 87 (324 Question/Answer totaal) |
| Service | 71 (57 locatiepagina's + 14 servicepagina's) |
| Article | 27 (`lachgas-informatie/*/`) |
| WebPage | 12 |
| ItemList | 5 (hubs) |
| Product | 5 (`product/*/`) |
| LocalBusiness | 1 (`index.html`) |
| WebSite | 1 (`index.html`) |
| CollectionPage | 1 (`lachgas-informatie/index.html`) |
| AboutPage | 1 (`over-ons/`) |
| ContactPage | 1 (`contact/`) |

Genest (14 extra soorten): ListItem 384, Question 324, Answer 324, City 96, LocalBusiness-als-provider 71, ServiceChannel 71, GeoCoordinates 57, Place 56, Organization 54, AdministrativeArea 33, ImageObject 28, Brand 5, PostalAddress 1, OpeningHoursSpecification 1, ContactPoint 1. **Totaal 26 verschillende @type's.**

Blokken per pagina: 85× drie, 32× twee, 3× vier, 1× nul (`404.html`).

**Koppeling via @id**
- Geen `@graph`, wel een consistente twee-knoops entiteitsgraaf:
  - `https://lachgasgroningen.nl/#business` (LocalBusiness, gedefinieerd in `index.html`) wordt 102× gerefereerd: als `provider` in alle 71 Service-blokken (`{"@type":"LocalBusiness","@id":"…#business", …}`), als `publisher` in alle 27 Article-blokken (daar als `"@type":"Organization"` met zelfde `@id` – type-wissel, maar LocalBusiness ⊂ Organization, dus consistent), en als `publisher` van WebSite.
  - `https://lachgasgroningen.nl/#website` (WebSite) wordt 16× gerefereerd: `isPartOf` in alle 15 WebPage/CollectionPage/AboutPage/ContactPage-blokken.
- Breadcrumb-items gebruiken `item` als string-URL (geen `@id`), wat Google accepteert.

**Generatie**: duidelijk sjabloonmatig — alle 27 Articles hebben exact dezelfde veldenset (`headline, description, url, mainEntityOfPage, inLanguage, datePublished, dateModified, author, publisher, image`) en **allemaal `datePublished` = `dateModified` = `2026-10-02`**, terwijl `sitemap.xml` voor dezelfde URL's `lastmod 2026-10-18` opgeeft en de WebPage-blokken `dateModified 2026-10-18`. Dat is inconsistent (artikelen zijn in `32e8d21` op 19 okt wel degelijk gewijzigd). `author` is overal de organisatie (geen persoon, geen E-E-A-T-signaal).

**Markup die Google niet (meer) toont**
- **FAQPage op 87 pagina's** (72 % van de site): sinds augustus 2023 toont Google FAQ-rich results alleen nog voor overheids-/gezondheidssites; hier dus geen zichtbaar effect, wel ~900 B extra per pagina. De FAQ staat ook in de HTML als `<details>/<summary>` (324 stuks), dus de markup klopt inhoudelijk.
- **Service** (71×) heeft geen rich-result-type bij Google; de blokken dienen hooguit entiteitsbegrip.
- **Product** (5×) zonder `offers`, `price`, `sku`, `gtin`, `aggregateRating` → komt niet in aanmerking voor product-snippets of merchant listings. Niet misleidend, wel functieloos.
- Geen HowTo, geen SpeakableSpecification, geen VideoObject.

**Mogelijk misleidend / discutabel**
- Geen `AggregateRating`, geen `Review` (0 treffers) → geen fake-reviewrisico. Positief.
- `LocalBusiness` heeft wél `address` maar alleen `addressLocality/addressRegion/addressCountry` (geen `streetAddress`/`postalCode`), `geo` op een stadscentrum-coördinaat, `openingHoursSpecification` 00:00–23:59 alle dagen, `priceRange "€€"`, `paymentAccepted`, `areaServed` met 58 City/AdministrativeArea-items. Voor een bezorgdienst zonder bezoekadres is dit het maximum haalbare; Google vraagt voor LocalBusiness-rich results wel een volledig adres.
- `sameAs` verwijst naar een `wa.me`-URL (geen socialmediaprofiel) — semantisch onjuist gebruik van `sameAs`.
- Alle Article/LocalBusiness `image`-waarden verwijzen naar dezelfde generieke OG-afbeelding.

**Volledig voorbeeld (detailpagina `product/lachgas-tank-2kg/index.html`, 3 blokken)**

```json
{"@context":"https://schema.org","@type":"Product",
 "name":"Lachgastank 2KG",
 "description":"Lachgastank 2KG: het compacte formaat voor een klein gezelschap, verzegeld aan huis bezorgd in Groningen, meestal binnen 15 tot 25 minuten. Alleen 18+.",
 "url":"https://lachgasgroningen.nl/product/lachgas-tank-2kg/",
 "brand":{"@type":"Brand","name":"Lachgas Groningen"},
 "image":"https://lachgasgroningen.nl/img/lachgastank-2kg.webp"}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgasgroningen.nl/"},
 {"@type":"ListItem","position":2,"name":"Assortiment","item":"https://lachgasgroningen.nl/assortiment/"},
 {"@type":"ListItem","position":3,"name":"Lachgastank 2KG","item":"https://lachgasgroningen.nl/product/lachgas-tank-2kg/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Is de 2KG geschikt voor een eerste bestelling?","acceptedAnswer":{"@type":"Answer","text":"Voor een klein gezelschap is het het logische beginpunt: compact, snel geleverd en eenvoudig te bewaren als er iets overblijft. Twijfel je tussen de 2KG en de 4KG, stel die vraag dan in je bericht."}},
 {"@type":"Question","name":"Hoe zwaar is de tank om te dragen?","acceptedAnswer":{"@type":"Answer","text":"Een gevulde 2KG is goed alleen te tillen en een trap op te dragen; het is het formaat dat we het meest aan bovenwoningen en studentenhuizen leveren."}},
 {"@type":"Question","name":"Kan ik de 2KG met een cracker of slagroompatronen combineren?","acceptedAnswer":{"@type":"Answer","text":"Ja, zet alles in hetzelfde bericht, dan komt het in één levering mee. Het hele aanbod staat op de assortimentspagina."}}]}
```

Ter vergelijking het Service-blok van een locatiepagina (`bezorggebied/haren/index.html`), dat de `@id`-koppeling laat zien:
```json
{"@context":"https://schema.org","@type":"Service","serviceType":"Lachgas bezorgservice",
 "name":"Lachgas bezorgen in Haren","description":"…","url":"https://lachgasgroningen.nl/bezorggebied/haren/",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgasgroningen.nl/#business","name":"Lachgas Groningen","url":"https://lachgasgroningen.nl/","telephone":"+31684626182"},
 "areaServed":{"@type":"Place","name":"Haren","geo":{"@type":"GeoCoordinates","latitude":53.171,"longitude":6.606}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/31684626182","name":"WhatsApp"}}
```

---

## 5. Crawl & indexatie

**robots.txt** (volledige inhoud, 73 bytes):
```
User-agent: *
Allow: /

Sitemap: https://lachgasgroningen.nl/sitemap.xml
```
Geen disallows, geen AI-crawler-regels, geen verwijzing naar `llms.txt`.

**sitemap.xml** (19.964 B, enkelvoudige `<urlset>`, geen sitemap-index)
- **120 `<loc>`**, 120 uniek, 120 met `<lastmod>`, 120 met `<changefreq>`, 120 met `<priority>`.
- `lastmod`: **alle 120 identiek `2026-10-18`** (de dag vóór commit `32e8d21`, 19 okt 00:25 UTC). Geen echte per-pagina datums; na de drie latere commits (20–22 okt, 124 bestanden gewijzigd) is lastmod niet bijgewerkt. Google negeert `changefreq`/`priority` en vertrouwt `lastmod` alleen als die geloofwaardig is — hier dus beperkte waarde.
- `changefreq`: 66× weekly (home, hubs, 57 locatiepagina's, 5 producten…), 54× monthly. `priority`: 1× 1.0, 3× 0.9, 62× 0.8, 51× 0.7, 3× 0.3 (voorwaarden, privacy, sitemap-pagina).
- **Consistentie**: 120/120 sitemap-URL's bestaan als bestand; 120/120 zijn gelijk aan de canonical van dat bestand; het enige bestand buiten de sitemap is `404.html` (correct); 0 noindex-pagina's in de sitemap; 0 URL's zonder trailing slash.
- Geen image-, video- of news-sitemap; `sitemap.xml` is het enige XML-bestand.

**RSS/Atom**: afwezig (0 `application/rss+xml|atom+xml`), ook niet voor de 27 artikelen.

**IndexNow**: `9f1e3c5a7b2d4e6f8a0c2e4b6d8f1a3c.txt` in de root (32 bytes), inhoud = bestandsnaam zonder `.txt` → geldig IndexNow-keybestand. **Geen ping-code** in de repo (grep `indexnow` over html/js/json/txt/xml: 0 treffers); pingen gebeurt dus handmatig of vanuit de externe generator.

**llms.txt / llms-full.txt**
- `llms.txt`: 131 regels, 31.981 B: H1, korte beschrijving, link naar `llms-full.txt`, en per pagina `- [title](url): description` voor alle 120 pagina's.
- `llms-full.txt`: 6.908 regels, 591.074 B: volledige tekstdump van alle pagina's (`## title` + `URL:` + tekst). Bevat ook header-/menutekst per pagina (`Menu`, CTA-tekst), dus niet volledig opgeschoond.
- Beide worden per commit meegegenereerd (zie `git log --stat`: `llms.txt | 4 ++--`, `llms-full.txt | 4 ++--` bij elke nummerwijziging).

**Indexatiehygiëne**: 1 noindex-pagina (`404.html`), niet in sitemap, geen canonical → correct. Geen `noindex` elders. Geen hreflang-conflicten. Geen parameters of duplicaten.

---

## 6. Interne links

**Navigatiestructuur** (gemeten op `bezorggebied/haren/index.html`, identiek sjabloon op alle pagina's)
- `<header>` → `<nav id="site-nav" aria-label="Hoofdmenu">` (regel 7): **7 links** (logo met `aria-label` → `/`, 5 hoofditems `/assortiment/`, `/bezorggebied/`, `/lachgas-informatie/`, `/over-ons/`, `/contact/`, 1 externe CTA `wa.me`).
- Mobiel paneel `#mobile-panel` (`role="dialog" aria-modal="true" aria-label="Menu"`, regel 34) met `<nav aria-label="Mobiel menu">`: **25 links**, altijd in de DOM (klasse `hidden`), dus elke pagina bevat de hoofdnavigatie dubbel.
- `<footer>` (regel 180): **23 links** in 3 kolommen met `<h3>`-kopjes (5 / 12 / 2) + onderste rij van 8 (voorwaarden, privacy, sitemap-pagina, enz.).
- `<main>`: gemiddeld ~16 interne links op een locatiepagina.
- `aria-current="page"` op 121 pagina's (breadcrumb + actief menu-item).

**Breadcrumbs**: HTML `<nav aria-label="Kruimelpad">` op 119 pagina's (`bezorggebied/haren/index.html:39–46`) — links gescheiden door `<span aria-hidden="true">/</span>`, laatste item `<span aria-current="page">`; **niet** als `<ol>/<li>` (0 treffers). JSON-LD `BreadcrumbList` op dezelfde 119 pagina's, 2–3 niveaus, consistent met de HTML.

**Hub ↔ detail**
| Hub | Detailpagina's in `<main>` gelinkt | Detail → hub (main) | Gem. sibling-links in main |
|---|---|---|---|
| `bezorggebied/index.html` | 57 / 57 (59 unieke uit main) | 57 / 57 | 4,8 |
| `lachgas-informatie/index.html` | 29 / 29 | 29 / 29 | 5,0 |
| `assortiment/index.html` | 5 / 5 (`/product/*`) | 5 / 5 via breadcrumb | 4,0 |
| `veelgestelde-vragen/index.html` | 5 / 5 | 5 / 5 | 4,0 |
| `sitemap/index.html` | 119 unieke links (HTML-sitemap) | — | — |

Gerelateerde blokken: locatiepagina's hebben een "ook hier"-sectie met 3–4 nabije locaties + hub-link (`haren/index.html` → helpman, glimmen, eelde-paterswolde, noord-nederland, hub) en een productblok (3 productlinks); artikelen hebben een `nav[aria-label="Inhoud"]`-TOC (27×, 155 items) en kruislinks naar ±5 andere artikelen.

**Klikdiepte (BFS vanaf `index.html`, script `groningen_bfs.py`)**
| Variant | Diepte 0 | 1 | 2 | 3 | Max | Onbereikbaar |
|---|---|---|---|---|---|---|
| Alle links (header/footer/main) | 1 | 92 | 27 | 0 | **2** | 1 (`404.html`) |
| Alleen `<main>`-links | 1 | 82 | 34 | 1 | 3 | 3 (`404.html`, `over-ons/`, `sitemap/`) |

**Orphans**: **1** (`404.html`, bewust). Alle 120 indexeerbare pagina's hebben ≥ 3 inkomende links. Alleen `sitemap/index.html` is uitsluitend via de footer bereikbaar (0 inbound vanuit `<main>`).

**Inbound-verdeling**: gemiddeld 36,6, mediaan 8, min 3 (`lachgas-informatie/lachgas-op-festivals-en-evenementen/`), max 120 (de 8 footer-pagina's zoals `werkwijze/`, `veelgestelde-vragen/`, `product/*`). Minst gelinkte locatiepagina's: 4 inbound (bijv. `bezorggebied/aduard/`, `bezorggebied/peize/`).

**Aantallen**: 9.079 anchors totaal; gemiddeld **66,4 interne anchors per pagina** (mediaan 65, min 54, max 172 op `sitemap/`), waarvan **36,8 unieke bestemmingen** (mediaan 34, min 31, max 120). Extern: 647 anchors (608× `wa.me`, 39× vijf overheids-/kennisdomeinen), 400 overige (`tel:`, `mailto:`, `#`). Gebroken interne links: **0** (alle 120 doelen bestaan).

**Ankertekst**: beschrijvend; **0** generieke teksten ("lees meer", "klik hier"). Meest voorkomende main-ankers: `Home` (120, breadcrumb), `Of vul het contactformulier in` (119), productnamen (63–69), `Bekijk volledig bezorggebied` (56), `veilig gebruik` (49), `Alle informatie` (42). 121 anchors zonder tekst = het logo (SVG/letter) met `aria-label` — correct. 242 anchors met `aria-label`.

**nofollow**: 39 links `rel="noopener nofollow"`, allemaal naar externe referentiebronnen (`gemeente.groningen.nl` 10, `rijksoverheid.nl` 10, `drugsinfo.nl` 10, `trimbos.nl` 5, `vnn.nl` 4). Dat is omgekeerd aan wat je wilt: juist autoritaire bronverwijzingen mogen gevolgd worden. De 608 `wa.me`-links hebben `rel="noopener"` + `target="_blank"` (647× `_blank` in totaal). Geen `sponsored`/`ugc`.

---

## 7. HTML-semantiek

**H1**: **121 / 121 pagina's exact één H1**; 0 zonder, 0 meervoudig. 121 unieke H1-teksten.

**H2–H6**: 807 H2, 612 H3, **geen H4–H6**. Gemiddeld 12,7 koppen per pagina. Niveau-sprongen: **1 pagina** (`404.html`: H1 → direct H3, omdat `<main>` daar geen H2 heeft en de footer `<h3>`-kolomkoppen gebruikt). Op alle andere pagina's: H1 → H2 (sectie) → H3 (kaarten/footer). Commit `32e8d21` zette de footer-`<h4>` om naar `<h3>` om sprongen te vermijden — dat werkt overal behalve op de 404.

**Landmarks** (per pagina): `header` 1, `nav` 3–4 (`Hoofdmenu`, `Mobiel menu`, `Kruimelpad`; op 27 artikelen extra `Inhoud`), `main` 1 (`id="inhoud"`), `footer` 1, `section` 4–8. **`article` 0, `aside` 0** — ook de 27 informatie-artikelen gebruiken `<section>` i.p.v. `<article>`. `role="dialog"` op het mobiele paneel (121×) en op de JS-lightbox.

**Skip-link**: `<a class="skip" href="#inhoud">Direct naar inhoud</a>` als eerste body-element op 121/121 pagina's (`bezorggebied/haren/index.html:7`), visueel verborgen via `.skip{left:-999px}` en zichtbaar bij `:focus` (`css/site.css:39`); `main` heeft `id="inhoud"` en krijgt na soft-navigatie `tabindex="-1"` + focus (`nav.js:64`).

**Alt-teksten**: 125 `<img>` totaal; **0 zonder `alt`-attribuut**; 122 met `alt=""` (121× het decoratieve 56×56-miniatuur in het mobiele menu, 1× de lege lightbox-placeholder op home); 3 met beschrijvende alt (hero, 2× productafbeelding). 43 inline `<svg>`-iconen per pagina, decoratief binnen gelabelde knoppen/links.

**ARIA**: gemiddeld 15 aria-attributen per pagina (min 10, max 17): `aria-label` op 4 navs, logo-link, knoppen (244 `<button … aria-*>` in totaal), `aria-expanded` op de menuknop (JS, `site.js:18`), `aria-modal`, `aria-current="page"`, `aria-hidden` op breadcrumb-scheidingstekens en voortgangsbalk. Geen aria-misbruik gevonden (geen `role` op native elementen, 1 `<dl>`, 0 tabellen, 6 `<label>` bij 8 velden in het contactformulier — 2 velden missen een `<label>` of gebruiken placeholder).

**Native semantiek**: FAQ als `<details>/<summary>` (324×, 87 pagina's), TOC als `<ol>` in `<nav>`. Kleine template-fout: 5 van de 155 TOC-items hebben dubbele nummering (`1. 1. Welke stof…`, `lachgas-informatie/wat-is-lachgas/index.html`), omdat de H2-tekst al met een cijfer begint en de generator er nog een voor zet.

**Lang**: `lang="nl"` op 121/121; geen per-element `lang`-wissels (niet nodig).

**Syntaxis**: HTML5-doctype, maar void-elementen worden XHTML-stijl zelfgesloten (`<img … />`, `<br/>`; 55× `/>` per pagina) — cosmetisch, geen parsingprobleem.

---

## 8. Performance

**CSS-strategie**
- **Alles inline, kritisch én niet-kritisch**: één `<style>` van **31.437 bytes** in de `<head>` van elke pagina (identiek op 121 pagina's; gzip-equivalent ±5–7 KB per pagina). Inhoud: 8× `@font-face` → Tailwind-reset + 309 gepurgde utilities (v3.4.17) → `/*mm*/`-blok (mobiel menu, product-factsheet `.pf*`) → `/*master*/`-blok (`.rv` reveal, `.wa-float`, `.skip`, reduced-motion).
- **0 `<link rel="stylesheet">`** en 0 `style=`-attributen op alle pagina's. De bestanden `css/tailwind.css` (23.995 B, gzip 5.167) en `css/site.css` (5.188 B, gzip 1.882) staan op schijf maar worden **nergens gerefereerd** → dode bestanden (wel door de SW gecachet als iemand ze zou opvragen).
- Gevolg: geen render-blocking request en geen FOUC, maar ook geen cross-page caching van CSS: 121 × 31,4 KB = **3,80 MB ongecomprimeerde CSS over de site** (45 % van alle HTML-bytes). De SW-paginacache (SWR, 150 pagina's) verzacht dit voor terugkerende bezoekers.

**Fonts**
- 2 self-hosted woff2: `fonts/inter.woff2` (36.272 B) en `fonts/plusjakartasans.woff2` (23.500 B); geen externe font-CDN.
- 8 `@font-face`-declaraties: Inter 400/500/600/700/800 → allemaal hetzelfde bestand; Plus Jakarta Sans 400/700/800 → hetzelfde bestand. Ofwel variabele fonts (dan zou één declaratie met `font-weight: 400 800` netter zijn), ofwel synthetische vetheden.
- `font-display: optional` op alle 8 (geen FOUT/FOIT, geen layout-shift door fontwissel; op trage verbindingen blijft de systeemfont staan).
- `unicode-range` Latin-subset op alle 8 declaraties; `preload` van beide fonts op alle 121 pagina's met `crossorigin`; SW precache (`sw.js:4`); `Cache-Control: immutable, 1 jaar` (`vercel.json`).
- Fallback `system-ui, sans-serif` zónder metrische fallback (`size-adjust`/`ascent-override`/`descent-override`: 0 treffers; het enige `size-adjust` is `-webkit-text-size-adjust:100%` uit de Tailwind-reset). Met `display: optional` is dat acceptabel, want er wordt niet geswapt.

**Afbeeldingen**
- Op schijf: 6 WebP, 1 JPG (OG-image 1200×630, 63,7 KB), 3 PNG-icons (180/192/512), `favicon.ico`, `favicon.svg`. **0 AVIF**. Totaal beeldgewicht ±195 KB. `assets/img/lachgastank-2kg-groningen.webp` (900×900, 19,8 KB) wordt nergens gebruikt.
- In HTML (125 `<img>`): **125 met `width`+`height`**, **124 `loading="lazy"`**, 1 `fetchpriority="high"` (hero), **125 `decoding="async"`**, 2 met `srcset` + `sizes` (`/img/lachgastank-2kg-300.webp 300w, /img/lachgastank-2kg.webp 480w`, `sizes="(min-width: 768px) 300px, 70vw"`), 1 `<picture>`/`<source>`.
- Hero op `index.html`: `<picture><source media="(max-width: 1023px)" srcset="data:image/svg+xml,…3×2…"><img fetchpriority="high" src="/assets/img/hero-lachgas-groningen.webp" width="1536" height="1024" …>` in een container `hidden lg:block` → op mobiel wordt het 55 KB-bestand niet geladen; op desktop wordt het gepreload met `media="(min-width: 1024px)"`. Nette LCP-optimalisatie. Kanttekening: 1536 px bron voor een kolom van ±600 px zonder srcset-varianten.
- 121× hetzelfde 160 px-miniatuur (3,6 KB) in het mobiele menu, lazy.

**Third-party**: **nul** externe scripts, geen analytics/tag manager/pixel/chat/maps/consent-banner. Enige externe afhankelijkheden: `wa.me`-links en `<form action="https://formspree.io/f/…" method="POST">` op `contact/index.html` (pas bij submit).

**Prefetch/prerender**: geen `<link rel="prefetch">`, geen Speculation Rules (0 treffers). Prefetching gebeurt volledig in `nav.js` (intentie-gestuurd + max 16 in-beeld-links per paginaweergave, `requestIdleCallback`, uit bij `saveData`/2g). Op de hub met 57 links beperkt `LIMIT = 16` (`nav.js:93`) de extra requests.

**Service-worker-caching**: zie §1 — static cache-first, pagina's SWR (150), precache 5 URL's, `sw.js` zelf `Cache-Control: no-cache` (`vercel.json`).

**Overig**: alle JS `defer`; `<head>` ±36 KB (52 % van de pagina) vooral door de inline CSS; geen inline critical-JS; Brotli/gzip komt van Vercel (gzip gemeten: pagina ±14 KB).

---

## 9. Styling & layout

**CSS-architectuur**: utility-first (Tailwind v3.4.17, 309 unieke klassen, top-5: `flex` 4.265×, `items-center` 4.020×, `text-sm` 3.939×, `text-gray-700` 3.051×, `mb-4` 2.748×) + een klein handgeschreven component-laagje met prefix `mm-*` (mobiel menu: `.mm-panel`, `.mm-tile`, `.mm-link`…) en `pf-*` (product-factsheet) in `css/site.css:38`, plus `.rv`, `.wa-float`, `.skip` in regel 39. Geen BEM, geen CSS-modules.

**Design tokens**: geen eigen custom properties; de 61 `--tw-*`-variabelen zijn Tailwind-internals. Merkkleuren zijn gecompileerd als utilities (`bg-brand-600` = `rgb(15 118 110)`, `text-brand-700` = `rgb(17 94 89)`, `bg-surface-50`, `bg-whatsapp-600`). Eén `color-mix()` in `.pf-badge` met fallback (`css/site.css:38`). Geen `@layer`, geen `@container`, geen `@supports`.

**Mobile-first**: ja — uitsluitend `min-width`-queries: `@media (min-width:640px)` (sm, 14 utilities), `768px` (md, 1 utility + 2 in site.css), `1024px` (lg, 15 utilities). Prefix-gebruik in HTML: `lg:` 15, `sm:` 14, `md:` 1, `hover:` 22, `focus:` 4, `active:` 2, `group-hover:` 2, `group-open:` 1.

**Dark mode**: **afwezig** — 0 `dark:`-klassen, 0 `prefers-color-scheme`, één `theme-color`. De footer en hero zijn vast donker (`bg-gray-900`).

**CLS-preventie**
- Alle 125 `<img>` met `width`/`height`; hero in gereserveerde container; lightbox-img met `width="1200" height="800"`.
- Fonts `display: optional` → geen reflow door fontwissel.
- Scroll-reveal (`.rv`) animeert alleen `opacity`/`transform` onder de vouw (`site.js:53–89`), niets boven de vouw; de hulpklassen worden na 1 s weer verwijderd.
- Vaste header (`fixed`) wordt gecompenseerd met `pt-28`/`lg:pt-36` op de hero-sectie.
- Geen `aspect-ratio`-utilities (0 treffers) — niet nodig door expliciete afmetingen.

**Toegankelijkheid (CSS-kant)**
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` in `css/site.css:26–29` (alle `animate-*` uit, `scroll-behavior:auto`) en regel 39 (`.rv`, `.wa-float`, `:active`-scale uit); JS-check in `site.js:70`.
- **Focus**: `.skip:focus` (site.css:39); Tailwind `focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none` op de 6 formuliervelden (`contact/`). Verder geen `focus-visible`-stijlen; links/knoppen vallen terug op de browser-outline (niet gereset, dus zichtbaar).
- **Contrast** (berekend): `text-gray-500` op wit 4,76:1 (AA; commit `32e8d21` verving hiervoor `text-gray-400` = 2,56:1 op hulptekst), `text-gray-600` 7,58:1, `brand-600` op wit en wit op `brand-600` 5,47:1, footer `text-gray-400` op `gray-900` ≈ 6,6:1. **Probleem**: breadcrumb `text-xs text-white/40` op `bg-gray-900` = **3,81:1** (119 pagina's, `haren/index.html:39`) — onder AA 4,5:1 voor kleine tekst; het actieve item `text-white/70` haalt 9,1:1. De 820 resterende `text-gray-400`-treffers zitten op donkere achtergronden of op decoratieve SVG's.
- `-webkit-tap-highlight-color: transparent` (Tailwind-reset) zonder eigen `:active`-indicatie behalve `scale(.97)`.

**Responsive images**: alleen voor de productafbeelding (2× `srcset`/`sizes`) en de hero (`<picture>` met lege mobiele bron). Geen `srcset` voor de 1536 px hero zelf.

**Layout-patronen**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` containers, grids `grid-cols-2 sm:grid-cols-4` / `lg:grid-cols-3`, kaarten `rounded-2xl border border-gray-100 shadow-card`, sticky/fixed header met backdrop-blur via JS-toggle (`site.js:9–10`). Mobiel paneel `w-80 max-w-[85vw]` met `env(safe-area-inset-bottom)` (`site.css:38`).

---

## 10. Hosting / deploy

**Configuratiebestanden**
| Bestand | Inhoud |
|---|---|
| `vercel.json` (1.931 B) | `trailingSlash: true` (r. 2); headers voor `/(.*)`: `Strict-Transport-Security: max-age=63072000; includeSubDomains` (zonder `preload`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'` (r. 4–33). Cache-Control: `/fonts/*` 1 jaar immutable; `/img/*`, `/images/*`, `/assets/*` 30 dagen + `stale-while-revalidate=604800`; `/js/*` 1 dag + SWR 7 dagen; `/sw.js` `no-cache`. Geen `cleanUrls`, geen `redirects`/`rewrites`. |
| `.vercelignore` | `_build` |
| `CNAME` | `lachgasgroningen.nl` (GitHub Pages) |
| `.nojekyll` | leeg (GitHub Pages: Jekyll uit) |
| `manifest.webmanifest` | PWA-manifest (zie §3) |
| `robots.txt`, `sitemap.xml` | zie §5 |
| Afwezig | `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`, `.htaccess`, `package.json`, CI-workflows (`.github/`) |

**Beoordeling headers**
- Sterk: HSTS 2 jaar, nosniff, XFO + `frame-ancestors`, Permissions-Policy.
- Zwak: CSP bevat geen `default-src`/`script-src`/`style-src` — inline `<style>` en inline `<script>` zouden anders nonces/hashes nodig hebben; met nul third-party is het risico klein, maar de CSP beschermt nu alleen tegen framing/base-injectie. Geen `preload`-directive voor HSTS.
- Cache: HTML-pagina's krijgen geen expliciete `Cache-Control` (Vercel-default `public, max-age=0, must-revalidate` + edge-cache met ETag) — prima voor SWR via SW. De regel voor `/images/*` wijst naar een niet-bestaande map; `/css/*` heeft geen regel (de map is ongebruikt). Compressie wordt niet geconfigureerd; Vercel levert Brotli/gzip automatisch.
- `trailingSlash: true` matcht de directory-structuur en de canonicals exact → geen redirect-ketens voor canonieke URL's.

**Dubbele hostingsporen**: `CNAME` + `.nojekyll` (GitHub Pages) naast `vercel.json`/`.vercelignore` (Vercel). Beide platforms serveren `404.html` uit de root en `index.html` per map, dus de site werkt op beide; maar de headers uit `vercel.json` gelden alleen op Vercel.

**Build-pijplijn**: niet in de repo. De HTML is gecommitte output van een externe generator (zie bewijs in §1). Reproduceerbaarheid vanuit deze repo is daardoor nihil: een inhoudelijke wijziging vereist het externe `_build`-proces, of handmatig editen van 121 bestanden.

**Git-geschiedenis** (`git log --stat`)
- **9 commits**, 12 → 22 oktober 2026, allemaal auteur `Claude <noreply@anthropic.com>` met `Co-Authored-By`-trailers (`Claude Sonnet 5.5` / `Claude Fable 5.1`) en `Claude-Session`-links → AI-gegenereerde commits.
- `9315874` (12 okt): initiële import "huidige versie", 147 bestanden, +40.428 regels (toen nog `lang="nl-NL"`, `<meta …/>`, geen `<header>`, geen skip-link, geen `vercel.json`).
- `32e8d21` (19 okt): "SEO-masterstandaard" — 129 bestanden, +1.747/−5.451: head-volgorde en titelconventie, JSON-LD `@id`-graaf, `<header>`-landmark, skip-link, `main#inhoud`, footer `h4→h3`, `text-gray-400→500`, hero desktop-only + preload, reveal-animaties, `vercel.json`, `.vercelignore`, sitemap-lastmod, SW-versie.
- **7 van 9 commits** (`77b179c`, `7088e9e`, `012b10d`, `fafcbac`, `4ab4e5f`, `37ce7af`, `a87e9e0`) wisselen alleen het telefoonnummer (WhatsApp-links + `telephone` in JSON-LD + `llms*.txt`): 123–124 bestanden, exact ±791 of ±807 regels per keer; het nummer rouleerde 7× tussen 4 nummers, soms binnen één dag (17 okt: 3 commits). Vier van die commits bumpten de SW-versie niet (zie §1).
- Geen branches, tags, PR's of CI.

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Interne linkarchitectuur is vrijwel optimaal**: max. klikdiepte 2 vanaf home (92 pagina's op diepte 1, 27 op diepte 2), 0 orphans onder de 120 indexeerbare pagina's, 100 % hub↔detail-koppeling in `<main>` (57/57, 29/29, 5/5, 5/5), ±5 sibling-links per detailpagina, 0 generieke ankerteksten, 0 gebroken interne links, breadcrumbs in HTML én JSON-LD op 119 pagina's.
2. **URL- en canonical-hygiëne is 100 % consistent**: canonical == `og:url` == hreflang == sitemap-`<loc>` op alle 120 pagina's, trailing slash afgedwongen in `vercel.json`, slugs zonder uitzondering lowercase-met-koppeltekens, max 2 segmenten, 404 noindex en buiten de sitemap.
3. **Nul third-party en minimale JS**: 13,2 KB (5,0 KB gzip) eigen JS, beide `defer`, geen analytics/tag manager/consent-scripts; soft-navigation met intentie-prefetch en meta-synchronisatie als pure progressive enhancement; service worker met SWR en versiebeheer.
4. **Head- en meta-sjabloon is strak en volledig**: 121/121 unieke titles (27–60 tekens) en descriptions (104–155 tekens), identieke head-volgorde, OG + Twitter inclusief `og:image:alt`, self-hosted fonts met `preload`, `font-display: optional` en `unicode-range`, alle 125 afbeeldingen met afmetingen, lazy/async en 0 ontbrekende alt's.
5. **Toegankelijkheidsbasis zit erin**: 1 H1 per pagina (121/121), skip-link op elke pagina, `header/nav/main/footer`-landmarks met `aria-label`, `role="dialog"`/`aria-modal`/`aria-expanded` op het menu, `aria-current`, `prefers-reduced-motion` in CSS én JS, FAQ als native `<details>`.

**Top 5 zwakke punten / fouten**
1. **31,4 KB CSS inline op elke pagina** (45 % van de HTML-bytes, 3,8 MB over de site) zonder gedeeld, cachebaar stylesheet; `css/tailwind.css` en `css/site.css` liggen ongebruikt in de repo. Plus 8,6 KB verborgen mobiel-menu-DOM per pagina.
2. **Structured data met veel volume, weinig rendement en één inconsistentie**: FAQPage op 87 pagina's (wordt niet meer getoond), 71 Service-blokken zonder rich-result, 5 Product-blokken zonder `offers`, alle 27 Articles met identieke `datePublished`/`dateModified` `2026-10-02` die botsen met sitemap-`lastmod` `2026-10-18`, `sameAs` → `wa.me`, één generieke `og:image`/schema-`image` voor alle pagina's.
3. **Sitemap-`lastmod` is één en dezelfde datum voor alle 120 URL's** en is na drie latere commits (124 bestanden gewijzigd) niet bijgewerkt; IndexNow-key aanwezig maar geen ping-automatisering.
4. **`rel="nofollow"` op alle 39 externe links naar autoritaire bronnen** (overheid/kennisinstituten) — precies de links die gevolgd mogen worden; de 608 `wa.me`-CTA's zijn wel dofollow.
5. **Build en deploy zijn niet reproduceerbaar en slordig**: generator staat buiten de repo (`.vercelignore: _build`), GitHub-Pages-restanten (`CNAME`, `.nojekyll`) naast `vercel.json`, CSP zonder `script-src`/`default-src`, 7 van 9 commits zijn telefoonnummer-rotaties waarvan 4 zonder SW-versiebump (cache-staleness), breadcrumb-contrast 3,81:1 op 119 pagina's, `404.html` met H1→H3-sprong, 5 TOC-items met dubbele nummering.

## SCORETABEL

| # | Onderdeel | Score (1–5) | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **4** | Volledig pre-rendered HTML met 13 KB progressive-enhancement-JS en SW, maar generator buiten de repo en 31 KB CSS inline per pagina. |
| 2 | URL-architectuur | **5** | Lowercase-koppelteken-slugs, max 2 segmenten, trailing slash afgedwongen, 120/120 self-canonicals gelijk aan sitemap/og:url/hreflang, 404 correct. |
| 3 | Head & meta | **4** | Identiek, compleet sjabloon met 100 % unieke titles/descriptions binnen lengtegrenzen; minpunten: één generieke og:image, overbodige hreflang, legacy geo-meta. |
| 4 | Structured data | **3** | Nette `@id`-graaf en geen fake ratings, maar FAQPage-overkill, Product zonder offers, identieke Article-datums die de sitemap tegenspreken, `sameAs` misbruikt. |
| 5 | Crawl & indexatie | **4** | Sitemap 100 % consistent met bestanden en canonicals, IndexNow-key, llms.txt/llms-full.txt; maar één lastmod voor alles, geen ping-code, geen RSS. |
| 6 | Interne links | **5** | Klikdiepte max 2, 0 orphans, 100 % hub↔detail, ±37 unieke links/pagina, beschrijvende ankers, breadcrumbs dubbel; enige smet: nofollow op bronlinks. |
| 7 | HTML-semantiek | **4** | 1 H1 overal, landmarks, skip-link, 0 alt-fouten; geen `<article>` op artikelen, breadcrumb niet als `<ol>`, H1→H3-sprong op 404, dubbele TOC-nummering. |
| 8 | Performance | **4** | Geen third-party, fonts/afbeeldingen voorbeeldig geoptimaliseerd, hero desktop-only met preload, SW; maar 31 KB niet-cachebare CSS per pagina en geen AVIF/hero-srcset. |
| 9 | Styling & layout | **3** | Mobile-first Tailwind met reduced-motion en CLS-veilige opbouw, maar geen design tokens, geen dark mode, geen focus-visible, breadcrumb-contrast 3,81:1, dode CSS-bestanden. |
| 10 | Hosting/deploy | **3** | Goede security- en cache-headers in `vercel.json`, maar geen build-pijplijn in de repo, GitHub-Pages-restanten, minimale CSP, SW-versie niet altijd gebumpt, 7/9 commits nummerwissels. |

## KERNGETALLEN

| Kerngetal | Waarde |
|---|---|
| HTML-pagina's | **121** (120 indexeerbaar + `404.html`) |
| Totale JS | **15.473 B raw / 5.960 B gzip** (`nav.js` 6.950 + `site.js` 6.202 + `sw.js` 2.321); pagina-JS zonder SW 13.152 B / 5.001 B gzip |
| Totale CSS | **31.437 B inline per pagina** (× 121 = 3.803.877 B); ongebruikt op schijf: `css/tailwind.css` 23.995 B + `css/site.css` 5.188 B = 29.183 B |
| JSON-LD | **26 verschillende @type's** (12 top-level, 14 genest) in 331 blokken; 0 parse-fouten |
| Max. klikdiepte | **2** (alle links); 3 via alleen `<main>`-links |
| Orphans | **1** (`404.html`, bewust); 0 onder indexeerbare pagina's |
| Pagina's zonder / met meervoudige H1 | **0 / 0** (121/121 exact één H1) |
| `<img>` zonder alt | **0** van 125 (122 bewust leeg/decoratief) |
| Unieke `<title>` | **100 %** (121/121); unieke descriptions 100 % |
| Gem. HTML-grootte | 69.784 B (mediaan 69.291; gzip ±14,5 KB) |
| Gem. interne links/pagina | 66,4 anchors, 36,8 unieke bestemmingen |
| Sitemap | 120 URL's, 100 % match met bestanden + canonicals, lastmod 120× `2026-10-18` |
| Commits | 9 (12–22 okt 2026), 7 daarvan telefoonnummer-rotaties |
