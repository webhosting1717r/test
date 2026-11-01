# Analyse repo `lachgasbreda` (technische SEO, architectuur, front-end)

Repo: `/home/user/lachgasbreda` (git, remote `github.com/webhosting1717r/lachgasbreda`, branch `main`, HEAD `af55dc9`, 9 commits).
Analyse-datum: 2026-11-01. Alleen gelezen, niets gewijzigd. Meetscripts staan in
`/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/` (`breda_measure.py`, `breda_report.py`, `breda_bfs.py`; ruwe uitvoer in `breda_report_out.txt` en `breda_bfs_out.txt`).

Het onderwerp van de site is buiten beschouwing gelaten; paden en bestandsnamen worden alleen als bewijs geciteerd.

---

## 1. Stack & rendering

**Generator/framework.** Geen build-tooling in de repo: geen `package.json`, `build.py`, `_build/`, `tailwind.config.*`, templates of Makefile (ook niet in de git-geschiedenis: `git log --all --name-only` levert 146 paden, allemaal uitvoerbestanden). Toch is de site duidelijk gegenereerd:

- `.vercelignore` bevat alleen `_build` → er bestaat lokaal een `_build/`-map die bewust niet gecommit en niet gedeployd wordt (generator leeft buiten de repo).
- De inline `<style>` is op alle 118 pagina's **byte-voor-byte identiek** (31.434 bytes, 1 unieke hash) en bevat de banner `/*! tailwindcss v3.4.17 | MIT License */` plus markeercommentaren `/*mm*/…/*mm-end*/` en `/*master*/…/*master-end*/` (einde van de inline CSS in `index.html`), typisch voor een script dat blokken injecteert.
- De `<head>` staat per pagina op één regel in vaste volgorde (118/118 identieke eerste vier tags: `meta charset`, `meta viewport`, `title`, `meta description`).
- Elke commit raakt 121–144 bestanden tegelijk met een gelijkvormige diff (zie §10): massale her-generatie, geen handwerk.
- `css/site.css` (regel 1: "utility classes live in tailwind.css, compiled per site") bevestigt een per-site Tailwind-compilatie; `css/site.css` en `css/tailwind.css` worden door **geen enkele** HTML-pagina geladen (`grep -rl 'rel="stylesheet"'` → 0) en zijn verouderde kopieën (359 van 441 inline regels komen overeen met `tailwind.css`, 65 met `site.css`, 17 alleen inline).

**Rendering.** 100 % SSG/pre-rendered: alle inhoud staat server-side in de HTML; geen hydration, geen framework-runtime, geen `<meta name="generator">`.

| Meting (118 HTML-bestanden) | Waarde |
|---|---|
| Totale HTML | 8.217.911 bytes (gzip 1.705.509) |
| Gemiddelde / mediaan per pagina | 69.643 / 69.172 bytes (gzip gem. 14.453) |
| Kleinste / grootste | `404.html` 54.511 · `index.html` 114.823 |
| Woorden in `<main>` – `/` | 1.284 |
| Woorden in `<main>` – `/bezorggebied/bavel/` | 530 |
| Woorden in `<main>` – `/lachgas-informatie/wat-is-lachgas/` | 924 |
| Woorden in `<main>` – `/product/lachgas-tank-2kg/` | 713 |
| Woorden `<main>` alle pagina's: gem./mediaan/min/max | 784 / 685 / 41 (`404.html`) / 1.284 |

Van de ~69 KB per pagina is ~31 KB inline CSS en ~15–25 KB inline JSON-LD + navigatie (header 7 links, mobiel paneel 24 links, footer 23 links); de vaste overhead per pagina is dus ca. 45 % van de bytes.

**JavaScript.**

| Bestand | Bytes | gzip | Functie |
|---|---|---|---|
| `js/site.js` | 6.202 | 2.440 | sticky-header klassen bij scroll, mobiel menu (`aria-expanded`, focus naar sluitknop, Escape), lightbox (dynamisch `role="dialog" aria-modal`), jaartal, "reveal"-animatie via IntersectionObserver (uit bij `prefers-reduced-motion`), SW-registratie |
| `js/nav.js` | 6.950 | 2.543 | zachte paginawissel (fetch + `DOMParser`, vervangt `main`/`header`/`footer`, `pushState`), prefetch bij `pointerdown`/`touchstart`/hover (65 ms)/in beeld (max 16, `requestIdleCallback`), uit bij `saveData` of 2G; cache max 60 pagina's |
| **Totaal geladen JS** | **13.152** | **4.983** | beide `<script src defer>` op 118/118 pagina's |
| `sw.js` | 2.321 | 957 | service worker (zie onder) |
| Inline `<script>` | 1 per pagina | | `document.getElementById("year").textContent = new Date().getFullYear();` |

Aandachtspunt `nav.js` regel 47–52: bij een zachte wissel worden `title`, `meta description`, `meta robots`, `canonical` en `og:url` gesynchroniseerd, maar **niet** de JSON-LD-blokken en hreflang in `<head>` (crawlers krijgen wel de volledige HTML, dus geen SEO-impact; wel inconsistente DOM voor tools die na navigatie lezen).

**Service worker** (`sw.js`): `VERSION` per build (`"5c6abae9a1"`), precache `/`, beide JS-bestanden en beide fonts; statische assets (regex op extensie) cache-first; HTML stale-while-revalidate met `PAGE_LIMIT = 150` en offline-fallback naar `/`; oude caches opgeruimd in `activate`; `skipWaiting` + `clients.claim`. Registratie alleen op https/localhost (`site.js` laatste regels).

---

## 2. URL-architectuur

- **Slug-conventie:** uitsluitend kleine letters, cijfers en koppeltekens; `find -type d | grep -E '[A-Z_.]'` → 0 treffers. Geen datums of ID's in URL's; cijfers alleen als onderdeel van de naam (6 mappen, bv. `product/lachgas-tank-4kg`, `leeftijdscontrole-18-plus`). Gemiddelde sluglengte 14,8 tekens; langste `lachgas-informatie/betrouwbare-lachgas-bezorgservice-herkennen` (43 tekens).
- **Diepte:** maximaal 2 padsegmenten (31 mappen op niveau 1, 93 op niveau 2). Secties: `bezorggebied/` (53 kinderen), `lachgas-informatie/` (29), `veelgestelde-vragen/` (5), `product/` (5, hub is `/assortiment/`).
- **Trailing slash:** directory-per-pagina met `index.html`; `vercel.json` → `"trailingSlash": true`. Alle 117 sitemap-URL's eindigen op `/`; in de HTML komen 0 interne hrefs zonder slash voor (`href="/[a-z0-9/-]*[a-z0-9]"` → 0) en 0 hrefs naar `.html`. Interne body-links zijn allemaal root-relatief (`href="/…/"`); de 351 absolute `https://lachgasbreda.nl/…` hrefs zijn precies 117 × (canonical + 2 hreflang).
- **Redirects:** geen `redirects`/`rewrites`/`cleanUrls` in `vercel.json`, geen `_redirects`, geen `<meta http-equiv="refresh">` (0 treffers). Alleen de impliciete Vercel-redirect `/pad` → `/pad/` door `trailingSlash`.
- **Canonicals:** 117/118 pagina's hebben exact 1 absolute, zelfverwijzende canonical die 1-op-1 overeenkomt met de sitemap-URL (0 afwijkingen). `404.html` heeft geen canonical (correct bij noindex).
- **Paginering:** geen (geen `rel="next/prev"`, geen `/pagina/2/`); hubs tonen alle kinderen op één pagina (bv. `bezorggebied/index.html` linkt 53 kinderen).
- **404:** `404.html` in de root (Vercel serveert die automatisch bij een static deploy met status 404). `<title>Pagina niet gevonden | Lachgas Breda</title>`, `meta robots "noindex, follow"`, geen canonical, geen `og:url`, geen JSON-LD, H1 aanwezig, 6 links in `<main>` (home, 4 hubs, WhatsApp). Geen 410-mechanisme (niet nodig bij statische hosting).
- `CNAME` (`lachgasbreda.nl`) en `.nojekyll` wijzen op (eerdere of parallelle) GitHub Pages-hosting naast Vercel.

---

## 3. Head & meta

Gemeten over alle 118 HTML-bestanden (`breda_report_out.txt`).

| Element | min | gem. | mediaan | max | duplicaten |
|---|---|---|---|---|---|
| `<title>` | 23 (`/sitemap/`) | 46,7 | 47 | 60 (`/lachgas-carnaval-breda/`) | 0 → **118/118 uniek (100 %)**; 0 titels > 60 tekens, 2 < 30 |
| `meta description` | 100 | 147,4 | 150 | 155 | 0 → 118/118 uniek; 0 > 160, 0 ontbrekend |

**Titelpatroon** (`<title>` en `og:title` gelijk):
- 82× `X | Lachgas Breda` (bv. `bezorggebied/bavel/index.html`: `Lachgas Bavel bestellen | Lachgas Breda`, 39 tekens)
- 1× `Lachgas Breda | X` (home)
- 31× **zonder merksuffix** (bv. `lachgas-informatie/wat-is-lachgas/index.html`: `Wat is lachgas? Stof, geschiedenis en toepassingen`; `contact/index.html`: `Contact opnemen met Lachgas Breda`), 4× merk elders in de titel. De commit `a4a46a0` noemt een "vaste titelconventie", maar die is niet op alle 118 pagina's doorgevoerd.
- H1 is slechts op 1 pagina gelijk aan de title (H1 en title zijn bewust verschillend geformuleerd).

**Vaste head-volgorde** (identiek op 118/118, `index.html` regel 4): `charset` → `viewport` → `title` → `description` → `robots` → `canonical` → `hreflang nl` → `hreflang x-default` → `og:*` (type, site_name, locale, title, description, url, image, image:width, image:height, image:alt) → `twitter:*` (card, title, description, image, image:alt) → `theme-color` → `geo.region`/`geo.placename` → icons → `manifest` → `preload` → `<style>` → JSON-LD. Charset staat correct als eerste tag binnen de eerste 1024 bytes.

- **robots meta:** 117× `index, follow, max-image-preview:large`; 1× `noindex, follow` (`404.html`).
- **Open Graph / Twitter:** compleet op 118/118 incl. `og:image:alt` en `twitter:image:alt`; `og:url` ontbreekt alleen op `404.html`. `og:type`: 91× `website`, 27× `article` (de artikelpagina's). **`og:image` is op alle 118 pagina's dezelfde** `assets/img/og-lachgas-breda.jpg` (1200×630, 57 KB) – geen paginaspecifieke social-afbeeldingen. Geen `article:published_time`/`article:modified_time`.
- **hreflang:** 117 pagina's `nl` + `x-default`, beide zelfverwijzend (0 afwijkingen); eentalige site, dus functioneel overbodig maar niet fout.
- **lang:** `<html lang="nl">` op 118/118 (in commit `a4a46a0` gecorrigeerd van `nl-NL`). JSON-LD gebruikt `inLanguage: "nl-NL"`.
- **Favicon/manifest:** `favicon.svg` (172 B), `favicon.ico` (`sizes="32x32 48x48"`), `apple-touch-icon.png` (180×180), `manifest.webmanifest` (id/start_url/scope `/`, `display: standalone`, `theme_color #c2410c`, icons 192/512, `lang nl`), `meta theme-color #c2410c` consistent met manifest.
- **viewport:** `width=device-width, initial-scale=1` (geen `maximum-scale`, dus zoombaar).
- **Resource hints:** `preload` 2 fonts (`as="font" crossorigin`) op 118/118; `preload as="image"` hero met `media="(min-width: 1024px)"` en `fetchpriority="high"` alleen op `index.html`. Geen `preconnect`/`dns-prefetch`/`prefetch`/`modulepreload` (0) – er zijn ook geen third-party origins om op te warmen.
- Geen `google-site-verification`, geen `color-scheme`, geen `format-detection`, geen HTML-commentaar (0 `<!--` in de hele site).

---

## 4. Structured data

**Omvang.** 117 pagina's bevatten JSON-LD, `404.html` niet. Blokken per pagina: 82× 3, 32× 2, 3× 4. Alle 349 blokken parsen foutloos. Geen `@graph`; elk blok is een losse `<script type="application/ld+json">` met eigen `@context`.

**Top-level `@type` (aantal pagina's):**

| @type | aantal | waar |
|---|---|---|
| BreadcrumbList | 116 | alle pagina's behalve `/` en `404.html` |
| FAQPage | 84 | 316 vragen totaal, 2–16 per pagina |
| Service | 68 | 53 gebiedspagina's + 15 dienstpagina's |
| Article | 27 | `lachgas-informatie/*` detailpagina's |
| WebPage | 12 | o.a. hubs en voorwaardenpagina's |
| ItemList | 5 | hubs (`bezorggebied/`, `assortiment/`, `veelgestelde-vragen/` …) |
| Product | 5 | `product/*` |
| LocalBusiness, WebSite | 1 + 1 | alleen `index.html` |
| ContactPage, AboutPage, CollectionPage | 1 + 1 + 1 | `contact/`, `over-ons/`, `lachgas-informatie/` |

= **12 verschillende top-level typen**; inclusief geneste typen 26 (ListItem 374, Question 316, Answer 316, City 89, LocalBusiness-als-provider 68, ServiceChannel 68, Organization 54, GeoCoordinates 53, Place 52, AdministrativeArea 34, ImageObject 28, Brand 5, PostalAddress 1, OpeningHoursSpecification 1, ContactPoint 1).

Combinaties per pagina: 68× (BreadcrumbList, FAQPage, Service) · 27× (Article, BreadcrumbList) · 6× (BreadcrumbList, FAQPage, WebPage) · 5× (BreadcrumbList, FAQPage, Product) · 3× (+ItemList) · enz. Dit is duidelijk per paginatype uit een template gegenereerd (identieke property-sets per type: alle 68 Service-blokken hebben exact `name, description, url, serviceType, provider, areaServed, availableChannel`).

**Koppeling via `@id`.**
- Gedefinieerd: `https://lachgasbreda.nl/#business` (LocalBusiness, alleen op `/`) en `#website` (WebSite, alleen op `/`, `publisher → #business`).
- Verwijzingen: `isPartOf → #website` op 15 pagina's (WebPage/AboutPage/ContactPage/CollectionPage); `Service.provider` = `{ "@type": "LocalBusiness", "@id": "#business", name, url, telephone }` (68×, hybride: id + herhaalde velden); `Article.publisher` = `{ "@type": "Organization", "@id": "#business", … logo }` (27×) – **type-inconsistentie**: hetzelfde `@id` is op de home `LocalBusiness` en in artikelen `Organization`; `mainEntity → #business` op About/Contact. BreadcrumbList, FAQPage, Product en ItemList hangen nergens aan (geen `isPartOf`, geen `mainEntityOfPage` behalve bij Article, geen `WebPage.breadcrumb`).

**Properties/kwaliteit.**
- `LocalBusiness` (`index.html`): name, alternateName, url, logo (ImageObject 512²), image, description, telephone, email, priceRange `€€`, currenciesAccepted, paymentAccepted, `areaServed` (50+ items, gemengd `City`/`AdministrativeArea`, met inconsistenties zoals `City "Breda-Centrum"` én `AdministrativeArea "Breda Centrum"`), `address` = PostalAddress **zonder `streetAddress` en `postalCode`** (alleen locality/region/country), `geo`, `openingHoursSpecification` 7 dagen `00:00–23:59`, contactPoint, `sameAs` = alleen een `wa.me`-URL. Een LocalBusiness zonder straatadres is voor Google's LocalBusiness-rich-result onvolledig (adres is aanbevolen/vereist); het is geen misleiding, wel een bezorgdienst-zonder-vestiging gemodelleerd als LocalBusiness.
- `Product` (5×): alleen `name, description, url, brand, image` – **geen `offers`, `sku`, `price`, `availability`**, dus geen product-rich-result; ook geen `AggregateRating`/`Review` (0 treffers op `ratingValue`/`Review` – geen fake reviews).
- `Article` (27×): headline, description, url, mainEntityOfPage, inLanguage, `datePublished` = `dateModified` = **`2026-10-02` op alle 27**, author = Organization (geen persoon), publisher met logo, `image` = voor alle 27 dezelfde generieke OG-afbeelding. Zichtbare byline zegt "Laatst bijgewerkt: oktober 2026" en de sitemap zegt `2026-10-18` → drie verschillende "laatst gewijzigd"-signalen.
- `WebPage`-achtigen: `dateModified 2026-10-18` (12+3), wél consistent met sitemap.
- `FAQPage` (84 pagina's, 316 Q/A): HTML-tegenhanger `<details>/<summary>` komt op **alle** pagina's exact overeen met het aantal vragen (0 mismatches). Sinds augustus 2023 toont Google FAQ-rich-results alleen voor overheids-/gezondheidssites; deze 84 blokken (gemiddeld ~2–4 KB per pagina) leveren dus geen zichtbaar SERP-voordeel meer. Geen HowTo (ook uitgefaseerd), geen Speakable, geen VideoObject.
- `BreadcrumbList`: 3 niveaus max, `item` absolute URL's, consistent met de HTML-`nav aria-label="Kruimelpad"`.
- `Service`: `areaServed` als `Place` met `GeoCoordinates` per gebied; `availableChannel.serviceUrl` = WhatsApp-link.

**Volledig voorbeeld detailpagina** – `bezorggebied/bavel/index.html` (3 blokken; FAQPage ingekort tot 1 van 3 vragen):

```json
{"@context":"https://schema.org","@type":"Service","serviceType":"Lachgas bezorgservice",
 "name":"Lachgas bezorgen in Bavel",
 "description":"Lachgas bestellen in Bavel? Snel en discreet bezorgd via WhatsApp, van de Brigidastraat tot Nieuw Wolfslaar en Lijndonk-Tervoort. Alleen 18+.",
 "url":"https://lachgasbreda.nl/bezorggebied/bavel/",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgasbreda.nl/#business","name":"Lachgas Breda","url":"https://lachgasbreda.nl/","telephone":"+31684626182"},
 "areaServed":{"@type":"Place","name":"Bavel","geo":{"@type":"GeoCoordinates","latitude":51.5681,"longitude":4.8347}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/31684626182","name":"WhatsApp"}}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgasbreda.nl/"},
 {"@type":"ListItem","position":2,"name":"Bezorggebied","item":"https://lachgasbreda.nl/bezorggebied/"},
 {"@type":"ListItem","position":3,"name":"Bavel","item":"https://lachgasbreda.nl/bezorggebied/bavel/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Hoe snel zijn jullie in Bavel?",
  "acceptedAnswer":{"@type":"Answer","text":"Vanaf het centrum van Breda is Bavel een korte rit over de Bavelselaan, dus meestal zijn we er binnen 15 tot 25 minuten. …"}},
 "… (2 verdere Question-items, identieke structuur)"]}
```

---

## 5. Crawl & indexatie

**robots.txt** (volledig, 4 regels):
```
User-agent: *
Allow: /

Sitemap: https://lachgasbreda.nl/sitemap.xml
```
Geen disallows, geen AI-bot-regels, geen crawl-delay.

**sitemap.xml** (19.016 bytes, 120 regels, één `<urlset>` zonder image-/xhtml-namespace, geen sitemap-index):
- 117 URL's, 117 uniek, allemaal met trailing slash, 0 `.html`.
- `lastmod` op 117/117, maar **allemaal `2026-10-18`** (git-historie: tot commit `47ac4e7` stond overal `2026-10-02`, in `a4a46a0` overal `2026-10-18`; de drie nummer-commits daarna lieten lastmod ongemoeid). De lastmod is dus een bulk-stempel, geen echte wijzigingsdatum per URL.
- `changefreq`: 62× weekly, 55× monthly; `priority`: 1× 1.0 (`/`), 3× 0.9, 58× 0.8, 52× 0.7, 3× 0.3 (juridische pagina's). Google negeert beide velden.
- **Consistentie:** in sitemap maar geen bestand: 0; indexeerbaar bestand maar niet in sitemap: 0; sitemap-URL ≠ canonical: 0; noindex-pagina's in sitemap: 0 (`404.html` ontbreekt terecht). 100 % sluitend.

**RSS/Atom:** geen (0 `rel="alternate" type=`).

**IndexNow:** `4d2b8c6e1f9a4a7c9e3d5b1f8a2c6e4d.txt` in de root bevat exact de eigen bestandsnaam (32 hex tekens) → geldig IndexNow-sleutelbestand. Er is echter **geen ping-code** (0 treffers op `indexnow`/`IndexNow` in HTML, JS, config of git-log); de sleutel is dus alleen klaargezet voor een externe submit-stap (handmatig of vanuit de niet-gecommitte `_build`).

**llms.txt / llms-full.txt:** `llms.txt` (30.255 bytes, 128 regels) met H1, blockquote-samenvatting, verwijzing naar `llms-full.txt` en een lijst `- [title](url): description` voor alle 118 URL's (117 pagina's + de full-link). `llms-full.txt` (586.764 bytes, 6.707 regels) bevat de volledige tekst van 117 pagina's met `## title` / `URL:`-koppen, inclusief menuteksten ("Menu", header-tekst) – ruis die een betere tekstextractie zou weglaten. Beide worden bij elke nummerwijziging mee-geregenereerd (4 regels gewijzigd per nummer-commit).

**Google-verificatie:** geen meta-tag, geen `google*.html`-bestand. **Noindex:** alleen `404.html`; niet in sitemap.

---

## 6. Interne links

Gemeten met `breda_report.py` (links) en `breda_bfs.py` (BFS/orphans).

**Navigatiestructuur (identiek op alle pagina's).**
- Header (`<header><nav id="site-nav" aria-label="Hoofdmenu">`): logo + 5 hoofdlinks (`/assortiment/`, `/bezorggebied/`, `/lachgas-informatie/`, `/over-ons/`, `/contact/`) + 1 externe WhatsApp-CTA; 7 links. Knop `#mobile-menu-btn` met `aria-expanded`/`aria-controls="mobile-panel"`.
- Mobiel paneel (`div#mobile-panel role="dialog" aria-label="Menu"` → `<nav aria-label="Mobiel menu">`): 24 links (4 hubs, 3 productlinks + 1 productthumbnail, 11 dienst-/infolinks, 3 servicelinks, over ons, contact) + WhatsApp-CTA. Dit paneel staat in de HTML van alle 118 pagina's (ook als het `hidden` is) en telt dus mee in de linkgraaf.
- Breadcrumb (`<nav aria-label="Kruimelpad">`) in `<main>` op 116 pagina's (niet op `/` en `404.html`), met `aria-current="page"` op het laatste item én BreadcrumbList-JSON-LD.
- Footer: 23 links in 3 kolommen (`<h3>` Assortiment · Info & bezorging · Contact) + `mailto:` + juridisch (`/algemene-voorwaarden/`, `/privacy/`, `/sitemap/`).
- Vaste zwevende WhatsApp-knop (`aria-label="WhatsApp ons"`) buiten `<main>`.
- 27 artikelpagina's hebben bovendien een inhoudsopgave `<nav aria-label="Inhoud">` met ankers naar `<h2 id="…">` (slug-id's).

**Aantallen.**

| Meting | Waarde |
|---|---|
| Interne links per pagina (excl. `#`, `mailto:`, `tel:`, extern) | gem. **66,0**, mediaan 65, min 54, max 169 (`/sitemap/`); totaal 7.787 |
| Verdeling | header 708 · nav (mobiel paneel + kruimelpad + TOC) 2.832 · `<main>` 1.773 (≈ 15/pagina) · footer 2.474 |
| Externe links | 593× `wa.me` (één nummer, `rel="noopener" target="_blank"`), 54× naar 6 informatiedomeinen |
| `nofollow` | 54, uitsluitend op die 54 externe informatiebronnen (`rel="noopener nofollow"`); 0 interne nofollow; geen `sponsored`/`ugc` |
| `mailto:` | 121 (1 per pagina in footer + extra op contact) · `tel:` 0 (alles via WhatsApp) |
| Kapotte interne links | **0** (alle doelen bestaan als map/`index.html` of bestand) |
| Lege ankerteksten (geen tekst én geen `aria-label`) | 0 · generieke ankers ("lees meer", "klik hier" …) **0** |
| Self-links (pagina linkt naar zichzelf, bv. in nav met `aria-current`) | 51 |

**Ankertekst-patroon:** beschrijvend en consistent (`Bezorggebied` 409×, `Over ons` 354×, `Lachgastank 2KG` 298× …), productnamen en paginatitels als anker; één opvallende samengeplakte anker `Lachgastank 2KGVerzegeld geleverd · bekijk de tank` (118×, productkaart in mobiel paneel waarin twee tekstregels in één `<a>` staan).

**Hub ↔ detail.**

| Hub | kinderen | hub → kind | kind → hub | gem. sibling-links per kind |
|---|---|---|---|---|
| `/bezorggebied/` | 53 | 53/53 | 53/53 | 4,9 (blok "in de buurt": 3 buren + hub) |
| `/lachgas-informatie/` | 29 | 29/29 | 29/29 | 8,9 (inline links + "Verder lezen"-blok) |
| `/veelgestelde-vragen/` | 5 | 5/5 | 5/5 | 4,0 |
| `/assortiment/` → `/product/*` | 5 | 5/5 | 5/5 | 4,0 |

Volledig bidirectioneel; elke detailpagina heeft bovendien een vast blok met de 3 productpagina's en een CTA-blok met `/contact/`.

**Klikdiepte (BFS vanaf `/`).**
- Inclusief header/footer/mobiel-paneel: **max diepte 2**; verdeling 0: 1 · 1: 87 · 2: 29; 117/118 bereikt, alleen `404.html` niet (bewust).
- Alleen links binnen `<main>` (strengere maat): max diepte 3 (1 pagina: `/lachgas-carnaval-breda/`); 0: 1 · 1: 77 · 2: 37 · 3: 1; `/sitemap/` is alleen via de footer bereikbaar.
- **Orphans: 1** (`404.html`); onder indexeerbare pagina's 0. Inkomende links per pagina: min 3 (`/lachgas-feestdagen/`, `/lachgas-informatie/lachgas-op-festivals-en-evenementen/`), mediaan 8, max 117 (hubs/footerlinks). Omdat header+footer+paneel al ~54 links per pagina leveren, krijgen die ~45 vaste doelen elk 117 inkomende links, terwijl 2 pagina's het met 3 contextuele links moeten doen.
- HTML-sitemap `/sitemap/` linkt 118 unieke URL's (123 links) onder 7 `<h2>`-koppen.

---

## 7. HTML-semantiek

| Meting | Resultaat |
|---|---|
| H1 per pagina | **118/118 exact 1**, allemaal binnen `<main>`; 0 pagina's zonder, 0 met meerdere; 0 dubbele H1-teksten |
| H2 / H3 totaal | 782 / 587 (gem. 6,6 / 5,0 per pagina); geen H4–H6 |
| Overgeslagen niveaus | 1: `404.html` (H1 → H3 "Assortiment", er is geen H2); overige 117 pagina's foutloos |
| Landmarks | `header`, `nav`, `main`, `footer`, `section` op 118/118; **`article` 0, `aside` 0, `figure` 0, `time` 0, `address` 0** (ook de 27 Article-pagina's gebruiken `<section>`, byline-datum als platte tekst, geen `<time datetime>`) |
| `<nav>` per pagina | gem. 3,2 (Hoofdmenu, Mobiel menu, Kruimelpad; + Inhoud op 27 artikelpagina's), alle met `aria-label` |
| `<main>` | 1 per pagina, `id="inhoud"`; skip-link `<a class="skip" href="#inhoud">Direct naar inhoud</a>` als eerste element in `<body>` op 118/118 (CSS `.skip` off-screen, `.skip:focus{left:8px}`) |
| `<details>/<summary>` | op 84 pagina's (FAQ-accordeons), native en zonder JS |
| `<img>` | 122 totaal; **0 zonder `alt`-attribuut**; 119 met `alt=""` (118× de 56×56-productthumbnail naast een tekstlink in het mobiele paneel – decoratief correct – en 1× het lege lightbox-`<img src="">` op `index.html`); 3 beschrijvende alts (hero, 2 productafbeeldingen) |
| `aria-*` | 1.766 attributen (gem. 15/pagina): `aria-label` op nav/knoppen/CTA's, `aria-current="page"` 230×, `aria-hidden="true"` 209× (decoratieve inline SVG's), `aria-expanded`/`aria-controls` op menuknop, `aria-modal` op lightbox; `aria-labelledby` 0 (secties zijn niet gelabeld) |
| `role` | `dialog` 119 (mobiel paneel + lightbox); verder native elementen |
| Formulier | 1 (`contact/index.html`): `<label for>` + `autocomplete`, `required`, honeypot `_gotcha` (`tabindex="-1" aria-hidden`), POST naar `formspree.io` |
| `lang` | `nl` op `<html>` 118/118; geen `dir` |
| Inline SVG | gem. 42 per pagina (iconen), merendeel `aria-hidden` |

Beoordeling: de kopstructuur en landmarks zijn zeer consistent (resultaat van de template), maar de semantiek blijft generiek (`section`/`div`); artikelen missen `<article>`, `<time>` en een echt auteurselement.

---

## 8. Performance

**CSS-strategie.** Volledig inline: elke pagina draagt dezelfde `<style>` van 31.434 bytes (gzip 6.731) in `<head>`; 0 externe stylesheets, 0 render-blocking requests voor CSS. Keerzijde: de CSS wordt nooit door de browser gecached tussen pagina's (118 × 31 KB = 3,7 MB aan herhaalde CSS in de repo; ~6,7 KB gzip extra per paginaweergave – deels gecompenseerd door de SW-pagina-cache en de `nav.js`-prefetch). `css/site.css` (5.184 B) en `css/tailwind.css` (23.992 B) liggen ongebruikt in de deploy (wel met `/css/`-pad bereikbaar, zonder Cache-Control-regel in `vercel.json`).

**Fonts.** 2 self-hosted WOFF2 (`fonts/inter.woff2` 36.272 B, `fonts/plusjakartasans.woff2` 23.500 B), 8 `@font-face`-declaraties (4 gewichten per familie die naar hetzelfde bestand wijzen → variabele fonts), `font-display: optional` op alle 8, `unicode-range` Latin-subset op alle 8, `preload … crossorigin` op 118/118, `Cache-Control: immutable, 1 jaar`. **Geen** `size-adjust`/`ascent-override`-fallback (met `optional` is er geen swap-CLS, maar bij een koude cache wordt het systeemfont getoond en de merkletter pas bij de volgende pagina). Google Fonts of andere externe font-origins: 0.

**Afbeeldingen.** 11 bestanden, 177.759 bytes totaal: 5 WebP, 1 JPG (OG 1200×630, 57 KB), 3 PNG (icons), 1 SVG, 1 ICO; **0 AVIF**. `assets/img/lachgastank-2kg-breda.webp` (20.702 B, 900×900) wordt nergens gerefereerd (dode asset).
- 122 `<img>`: **122 met `width` én `height`**, 121 `loading="lazy"`, 122 `decoding="async"`, 1 `fetchpriority="high"` (hero), 2 met `srcset`+`sizes` (productpagina `product/lachgas-tank-2kg/index.html`: `srcset="…-300.webp 300w, ….webp 480w" sizes="(min-width: 768px) 300px, 70vw"`).
- Hero op `index.html`: `<picture><source media="(max-width: 1023px)" srcset="data:image/svg+xml,…3x2 leeg">` + `<img fetchpriority="high" width="1536" height="1024">` → op mobiel wordt de 52 KB hero **niet** gedownload (lege data-SVG met zelfde verhouding voorkomt CLS), op desktop wordt hij via `<link rel="preload" media="(min-width:1024px)">` vroeg opgehaald. Lightbox-afbeelding krijgt `width/height` en `decoding="async"`.
- Geen `loading="eager"`-misbruik; de 118 thumbnails in het verborgen mobiele paneel zijn lazy.

**Third-party.** **Nul** externe scripts: geen analytics, tag manager, pixel, chat-widget, maps of iframes (0 treffers op `gtag|googletagmanager|plausible|fathom|matomo|hotjar|clarity|fbq|maps.google|<iframe`). Enige externe afhankelijkheden: `formspree.io` als form-action (1 pagina) en uitgaande `wa.me`-links.

**Prefetch/prerender.** Geen `<link rel="prefetch">`, geen Speculation Rules (0 `speculationrules`); in plaats daarvan JS-gestuurde prefetch in `nav.js` (hover/touch/in-beeld, max 16 per pagina, uit bij `saveData`/2G) met zachte paginawissel. SW cachet pagina's stale-while-revalidate, statische assets cache-first, `sw.js` zelf `Cache-Control: no-cache`.

**Gewicht eerste bezoek (home, zonder SW):** HTML 114,8 KB (20,7 KB gzip) + JS 13,2 KB (5,0 KB gzip) + fonts 59,8 KB + hero 52,1 KB (alleen ≥1024 px) + favicon/manifest ≈ 100 KB gecomprimeerd op mobiel, ≈ 150 KB op desktop. Detailpagina: ~69 KB HTML (14 KB gzip) + gecachte JS/fonts.

---

## 9. Styling & layout

- **Architectuur:** Tailwind v3.4.17 utility-first (banner in de inline CSS), gecompileerd en gepurged per site (441 regels, waarvan 108 escaped responsive/arbitrary selectors zoals `.z-\[60\]`, `.max-h-\[92vh\]`) plus 85 eigen selectors in drie groepen: `.mm-*` (mega/mobiel menu: `.mm-panel`, `.mm-tile`, `.mm-link[aria-current]` …), `.pf-*` (productkaart: `.pf`, `.pf-img`, `.pf-facts`, `.pf-badge` met `color-mix()`), en "master"-helpers (`.rv`/`.rv.in` reveal, `.wa-float`, `.skip`, `.btn`, `.chip`). Geen BEM (0 `__`-selectors). Keyframes: `ping`, `fade-in-up`, `slide-in-right`, `pulse-ring`, `float-slow`, `mring`. 1 `!important` (reduced-motion). `body` krijgt `font-sans antialiased bg-white text-gray-900` (118/118).
- **Design tokens:** 61 custom properties, allemaal Tailwind-interne `--tw-*`; **geen eigen tokens** (kleuren staan hard gecompileerd: brand-50/600/700 = `#fff7ed`/`#c2410c`/`#9a3412`, whatsapp-500/600/700 = `#25d366`/`#15803d`/`#166534`, surface-50 = `#fafaf9`, grijs = Tailwind "stone"). Fontstack `Inter, system-ui, sans-serif` (body) en `Plus Jakarta Sans` (`.font-heading`).
- **Mobile-first:** 8 `@media`-regels: `min-width` 640/768/1024 px (Tailwind sm/md/lg; `max-width` 0×), 2× `prefers-reduced-motion: reduce`, 1× `print`. Layout met `grid` (5 declaraties) en `flex` (9) via utilities; geen container queries, geen `@layer`, geen `@supports`.
- **CLS-preventie:** alle `<img>` met dimensies; hero-placeholder met zelfde aspect; `font-display: optional` (geen swap-shift); reveal-animatie werkt alleen op elementen onder de vouw (`r.top < vh` → skip) en zet `.rv` pas via JS, dus geen verborgen content zonder JS; `0` `aspect-ratio`-declaraties, geen `size-adjust`.
- **Dark mode:** geen (0 `prefers-color-scheme`, 0 `.dark`, geen `color-scheme`); `theme-color` is één vaste kleur.
- **Toegankelijkheid in CSS:** `prefers-reduced-motion` schakelt alle keyframe-animaties, `.rv`-transities, `.wa-float` en `scroll-behavior: smooth` uit; `.skip:focus` toont de skip-link. **Geen `:focus-visible`-regels** (0); focusstijlen beperken zich tot Tailwind `focus:ring-2`/`focus:border-brand-500` op formuliervelden en `focus:outline-none` (6× gebruikt in de HTML, steeds gecombineerd met `focus:ring-2`, dus geen kale outline-verwijdering); links en knoppen vertrouwen op de browser-default outline. Contrast: `text-gray-400` (`#a8a29e`, ≈ 2,9:1 op wit) wordt 12× binnen `<main>` op lichte achtergrond gebruikt (`index.html` 4× `<p class="text-sm text-gray-400">` op `bg-surface-50`, `bezorggebied/index.html` 2× kleine uppercase labels, `404.html` 1× label, `contact/index.html` 5× als `placeholder:text-gray-400`, placeholders vallen buiten de AA-eis) → de 7 echte tekstlabels zitten onder AA voor kleine tekst; `text-gray-500` (`#78716c`, ≈ 4,8:1) en footer `text-gray-400` op `bg-gray-900` (≈ 7:1) zijn in orde. Commit `a4a46a0` noemt "AA-contrast voor hulptekst", maar deze 7 labels bleven staan.
- **Responsive images:** alleen op 2 productafbeeldingen `srcset/sizes`; hero via `<picture>`-media-switch; thumbnails vast 56×56.
- **Layout-patronen:** vaste `px-4 sm:px-6 lg:px-8` gutters, `max-w-*` containers, kaartgrids (`main .grid > *`), sticky translucent header (`bg-white/95 backdrop-blur-sm`, bij scroll `backdrop-blur-md shadow-sm`), off-canvas mobiel paneel met overlay en `body.no-scroll`.

---

## 10. Hosting / deploy

**Configuratie.**
- `vercel.json`: `"trailingSlash": true`; geen `cleanUrls`, `redirects`, `rewrites`, `framework` of `outputDirectory` → Vercel serveert de repo-root als statische site, `404.html` automatisch als 404-pagina.
- Headers voor `/(.*)`: `Strict-Transport-Security: max-age=63072000; includeSubDomains` (2 jaar, **zonder `preload`**), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'` (alleen anti-framing/anti-base; **geen `default-src`/`script-src`/`style-src`** – met 1 inline `<script>`, 1 inline `<style>` en ~350 inline JSON-LD-blokken zou een strikte CSP nonces of hashes vereisen).
- Cache-Control: `/fonts/*` 1 jaar immutable; `/img/*`, `/images/*` (bestaat niet), `/assets/*` 30 dagen + `stale-while-revalidate=604800`; `/js/*` 1 dag + SWR 7 dagen (bestandsnamen zonder hash, dus bewust kort); `/sw.js` `no-cache`. **Geen regel voor HTML** (Vercel-default `public, max-age=0, must-revalidate`) en geen voor `/css/*` (ongebruikt).
- Compressie: niets voorgecomprimeerd in de repo; Vercel levert Brotli/gzip automatisch. Geen CDN-hints (`Vary`, `CDN-Cache-Control`, `Surrogate-Control`).
- `.vercelignore` → `_build` (lokale build-map buiten de repo). `CNAME` = `lachgasbreda.nl` en `.nojekyll` = GitHub-Pages-artefacten; de repo is dus deploybaar op beide, maar alleen Vercel krijgt headers/trailing-slash-gedrag.
- Geen `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`, geen CI-workflow (`.github/` ontbreekt), geen `.gitignore`.

**Build-pijplijn.** Niet in de repo (zie §1). Afgeleid uit de output: één template met vaste head-volgorde, paginatype-specifieke JSON-LD-sjablonen (Service/Article/Product/WebPage/…), gedeelde header/paneel/footer-partials, inline Tailwind-build + "mm"- en "master"-CSS-blokken die met markeercommentaren worden ingevoegd, en afgeleide bestanden (`sitemap.xml` met bulk-`lastmod`, `llms.txt`, `llms-full.txt`, `sw.js` met content-hash `VERSION`). Databron (bv. YAML/JSON per gebied met geo-coördinaten) is niet zichtbaar.

**Git-geschiedenis** (`git log --stat`): 9 commits, 2026-10-12 t/m 2026-10-22, alle met auteur "Claude" en `Co-Authored-By`-trailers.

| Commit | Datum | Inhoud |
|---|---|---|
| `968995c` | 2026-10-12 | "huidige versie": 144 bestanden, +39.292 regels (alles in één keer, incl. `css/`, `js/`, fonts, `llms*.txt`, `sw.js`, IndexNow-key) |
| `1a47dcb`, `55f3780`, `5168d02`, `47ac4e7` | 10-13 … 10-17 | 4× telefoonnummer gewisseld/teruggezet (WhatsApp-links + `telephone` in JSON-LD); 121 bestanden per commit |
| `a4a46a0` | 2026-10-19 | "SEO-masterstandaard": 126 bestanden, +1.710/−5.318 (heads naar één regel, `lang nl`, skip-link + `<header>`, `og:image:alt`, `@id`-graaf, hero-`picture`, reveal-animaties, `vercel.json`, `.vercelignore`, sitemap-lastmod → 10-18, SW-versie) |
| `6d3fcdc`, `a04ae80`, `af55dc9` | 10-20 … 10-22 | 3× nummerwissel; 121 bestanden, telkens ±786 regels, `llms*.txt` 4 regels, `sw.js` VERSION |

Opvallend: `sw.js` `VERSION` is een content-hash – na het terugzetten van het nummer (`af55dc9`) verschijnt exact dezelfde `"5c6abae9a1"` als in `6d3fcdc`. Zeven van de negen commits zijn uitsluitend nummerwissels (het WhatsApp-nummer staat 663× hard gecodeerd in HTML + `llms*.txt`, 5–6× per pagina), wat elke wijziging tot een her-generatie van 121 bestanden maakt.

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Vlakke, volledig sluitende architectuur:** max. klikdiepte 2, 0 orphans onder indexeerbare pagina's, 0 kapotte links, alle 4 hubs 100 % bidirectioneel gekoppeld met gemiddeld 5–9 sibling-links per detailpagina, breadcrumbs in HTML én JSON-LD op 116 pagina's.
2. **Sitemap/canonical/robots 100 % consistent:** 117 sitemap-URL's = 117 zelfverwijzende canonicals = 117 bestaande `index.html`-mappen, trailing slash overal afgedwongen (`vercel.json`), 404 netjes `noindex` en buiten de sitemap.
3. **Unieke, maatvaste metadata op elke pagina:** 118/118 unieke titles (23–60 tekens) en descriptions (100–155), complete OG/Twitter-set incl. `image:alt`, vaste head-volgorde, `lang`, manifest, theme-color.
4. **Zeer lichte, third-party-vrije front-end:** 13 KB JS (5 KB gzip, `defer`), 0 trackers/iframes, self-hosted WOFF2 met `preload` + `font-display: optional` + `unicode-range`, alle 122 afbeeldingen met `width/height` + `lazy` + `decoding`, hero alleen op desktop via `<picture>`-truc, service worker met SWR en hover/viewport-prefetch.
5. **Consistente toegankelijkheidsbasis uit de template:** exact 1 H1 op 118/118, 0 heading-skips buiten de 404, skip-link + `main#inhoud`, `aria-label` op elke `<nav>`, `aria-expanded/controls` op het menu, `aria-current` in breadcrumb/nav, native `<details>` FAQ's die 1-op-1 matchen met FAQPage-markup, `prefers-reduced-motion` gerespecteerd in CSS én JS.

**Top 5 zwakke punten / fouten**
1. **Structured data zonder commerciële waarde en met inconsistenties:** `Product` 5× zonder `offers`/prijs/beschikbaarheid; 84× `FAQPage` die Google niet meer toont; `LocalBusiness` zonder straat/postcode; `Article.datePublished = dateModified = 2026-10-02` op alle 27 terwijl sitemap `2026-10-18` en byline "oktober 2026" zeggen; `#business` is afwisselend `LocalBusiness` en `Organization`; geen `@graph`, Breadcrumb/FAQ/Product hangen los.
2. **Bulk-signalen in plaats van echte data:** `lastmod` identiek (`2026-10-18`) op 117/117 URL's, één `og:image` voor alle 118 pagina's, één generieke Article-`image`, IndexNow-sleutel zonder ping.
3. **31 KB inline CSS op elke pagina zonder caching** (3,7 MB herhaald in de repo, ~6,7 KB gzip per view), terwijl `css/site.css` en `css/tailwind.css` als verouderde, ongebruikte kopieën meedeployen; geen eigen design tokens, geen dark mode, geen `:focus-visible`-stijlen.
4. **Titelconventie niet overal doorgevoerd en contrastfouten:** 35 van 118 titles volgen het `X | Lachgas Breda`-patroon van de andere 82 niet (31 zonder merknaam, 4 met merknaam elders); `text-gray-400` (≈ 2,9:1) op lichte vlakken in `index.html`, `bezorggebied/index.html`, `404.html`; `404.html` springt van H1 naar H3.
5. **Build/deploy-hygiëne:** de generator (`_build`) staat buiten de repo zodat elke wijziging een her-generatie van 121 bestanden is (7 van 9 commits zijn nummerwissels van een 663× hard gecodeerd nummer); CSP dekt alleen framing; HSTS zonder `preload`; dode asset `assets/img/lachgastank-2kg-breda.webp`; GitHub-Pages-restanten (`CNAME`, `.nojekyll`) naast Vercel-config; `llms-full.txt` bevat menuruis.

## SCORETABEL

| # | Onderdeel | Score (1–5) | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **4** | Volledig pre-rendered, 13 KB JS zonder hydration en een nette SW, maar de generator/`_build` ontbreekt in de repo en de inline CSS/nav-overhead is ~45 % van elke pagina. |
| 2 | URL-architectuur | **5** | Lowercase-koppelteken-slugs, max 2 segmenten, trailing slash 100 % consistent in HTML, sitemap, canonicals en `vercel.json`, 404 correct. |
| 3 | Head & meta | **4** | 100 % unieke titles/descriptions binnen lengtegrenzen en complete OG/Twitter, maar 35 titels buiten de merk-suffixconventie en één OG-afbeelding voor alle pagina's. |
| 4 | Structured data | **3** | Brede dekking (12 typen, 349 blokken, @id-koppelingen), maar Product zonder offers, 84 waardeloze FAQPage-blokken, adresloze LocalBusiness, tegenstrijdige datums en type-mismatch op `#business`. |
| 5 | Crawl & indexatie | **4** | robots/sitemap/canonicals sluiten 100 %, `llms.txt` aanwezig, maar `lastmod` is een bulk-stempel, IndexNow-key zonder ping, geen RSS. |
| 6 | Interne links | **5** | Diepte ≤ 2, 0 orphans/kapotte links, hubs volledig bidirectioneel, beschrijvende ankers (0 generiek), breadcrumbs HTML+LD. |
| 7 | HTML-semantiek | **4** | Foutloze H1/landmarks/skip-link/aria op 118 pagina's, maar geen `article`/`time`/`figure`, `aria-labelledby` 0 en een heading-skip op de 404. |
| 8 | Performance | **4** | Nul third-party, mini-JS, slimme hero-/font-/lazy-strategie en SW, maar 31 KB niet-cachebare inline CSS per pagina, geen AVIF, geen font-fallback-metrics. |
| 9 | Styling & layout | **3** | Mobile-first Tailwind met reduced-motion en CLS-bescherming, maar geen tokens, geen dark mode, geen focus-visible, contrastfouten met `text-gray-400` en dode CSS-bestanden. |
| 10 | Hosting/deploy | **3** | Goede security-/cache-headers en trailing-slash-config op Vercel, maar minimale CSP, geen HTML-cachebeleid, build-pijplijn buiten de repo en commits die 121 bestanden per nummerwissel herschrijven. |

**Gemiddelde: 3,9 / 5.**

## KERNGETALLEN

| Kerngetal | Waarde |
|---|---|
| HTML-pagina's | **118** (117 indexeerbaar + `404.html`); 8.217.911 bytes totaal, gem. 69.643 |
| Totale JS | **13.152 bytes** (gzip 4.983) voor `js/site.js` + `js/nav.js`; 15.473 incl. `sw.js` |
| Totale CSS | **31.434 bytes inline per pagina** (gzip 6.731; 3.709.212 bytes over alle pagina's); ongebruikt `css/` 29.176 bytes |
| JSON-LD typen | **12 top-level** (26 incl. geneste); 349 blokken; 316 FAQ-vragen |
| Max klikdiepte | **2** (incl. nav/footer); 3 met alleen `<main>`-links |
| Orphans | **1** (`404.html`); 0 onder indexeerbare pagina's |
| Pagina's zonder / met meervoudige H1 | **0 / 0** (118/118 exact 1) |
| `<img>` zonder alt-attribuut | **0** van 122 (119 bewust `alt=""`, 3 beschrijvend) |
| % pagina's met unieke title | **100 %** (118/118; descriptions ook 100 %) |
| Interne links per pagina | gem. 66,0 (≈ 15 in `<main>`); 0 kapot; 54 externe `nofollow` |
| Sitemap | 117 URL's, 100 % match met bestanden/canonicals, `lastmod` 117× `2026-10-18` |
| Git | 9 commits (2026-10-12 → 2026-10-22), 7 daarvan nummerwissels over 121 bestanden |

---

## Bijlage A – Pagina's buiten de titelconventie (35)

`X | Lachgas Breda` geldt voor 82 pagina's en `Lachgas Breda | X` voor de home; onderstaande 35 wijken af (31 zonder merknaam, 4 met merknaam op een andere positie: `/bezorgvoorwaarden/`, `/contact/`, `/leeftijdscontrole-18-plus/`, `/over-ons/`). Titellengtes blijven wel binnen 33–59 tekens.

```
/bezorgtijden-breda/                 /bezorgvoorwaarden/                  /contact/
/lachgas-nachtbezorging/             /lachgas-studenten-breda/            /leeftijdscontrole-18-plus/
/over-ons/                           /veelgestelde-vragen/                /veelgestelde-vragen/bezorgen/
/werkwijze/                          /zakelijk-bestellen/
/lachgas-informatie/begrippenlijst-lachgas/
/lachgas-informatie/betrouwbare-lachgas-bezorgservice-herkennen/
/lachgas-informatie/de-dag-na-lachgas/
/lachgas-informatie/eerste-keer-lachgas-bestellen/
/lachgas-informatie/feest-thuis-zonder-overlast/
/lachgas-informatie/hoe-werkt-een-lachgas-cracker/
/lachgas-informatie/is-lachgas-legaal-in-nederland/
/lachgas-informatie/kraan-regulator-of-cracker/
/lachgas-informatie/lachgas-bijwerkingen-en-eerste-hulp/
/lachgas-informatie/lachgas-en-alcohol/
/lachgas-informatie/lachgas-en-het-milieu/
/lachgas-informatie/lachgas-en-mentale-gezondheid/
/lachgas-informatie/lachgas-en-vitamine-b12/
/lachgas-informatie/lachgas-in-de-zorg-en-techniek/
/lachgas-informatie/lachgas-in-het-verkeer/
/lachgas-informatie/lachgas-mythes-en-feiten/
/lachgas-informatie/lachgas-op-festivals-en-evenementen/
/lachgas-informatie/lachgas-regels-breda/
/lachgas-informatie/lachgas-tank-bewaren-en-vervoeren/
/lachgas-informatie/lege-lachgastank-inleveren-breda/
/lachgas-informatie/problematisch-lachgasgebruik-hulp/
/lachgas-informatie/veilig-gebruik/
/lachgas-informatie/wat-is-lachgas/
/lachgas-informatie/welke-lachgastank-heb-ik-nodig/
```
Opvallend: 24 van de 27 Article-pagina's hebben géén merksuffix, de 5 overige informatiepagina's (`/lachgas-informatie/`, `geschiedenis-van-lachgas/`, `lachgas-voor-ouders/`, `regels-en-wetgeving/`, `veiligheid-en-gezondheid/`) wél – binnen één sectie dus twee conventies.

## Bijlage B – Klikdiepte 2 (29 pagina's, BFS incl. header/footer/paneel)

Alle overige 87 pagina's staan op diepte 1 omdat ze in header, mobiel paneel of footer staan óf direct op de home gelinkt zijn (alle 53 gebiedspagina's staan op de home). Op diepte 2:

```
/lachgas-carnaval-breda/             /lachgas-feestdagen/                 /lachgas-grensregio-belgie/
/lachgas-studenten-breda/            /leeftijdscontrole-18-plus/
/veelgestelde-vragen/bestellen/      /veelgestelde-vragen/betalen/        /veelgestelde-vragen/bezorgen/
/veelgestelde-vragen/regels/         /veelgestelde-vragen/veiligheid/
/lachgas-informatie/betrouwbare-lachgas-bezorgservice-herkennen/
/lachgas-informatie/feest-thuis-zonder-overlast/
/lachgas-informatie/geschiedenis-van-lachgas/
/lachgas-informatie/hoe-werkt-een-lachgas-cracker/
/lachgas-informatie/kraan-regulator-of-cracker/
/lachgas-informatie/lachgas-bijwerkingen-en-eerste-hulp/
/lachgas-informatie/lachgas-en-alcohol/
/lachgas-informatie/lachgas-en-het-milieu/
/lachgas-informatie/lachgas-en-mentale-gezondheid/
/lachgas-informatie/lachgas-en-vitamine-b12/
/lachgas-informatie/lachgas-in-de-zorg-en-techniek/
/lachgas-informatie/lachgas-in-het-verkeer/
/lachgas-informatie/lachgas-op-festivals-en-evenementen/
/lachgas-informatie/lachgas-regels-breda/
/lachgas-informatie/lachgas-voor-ouders/
/lachgas-informatie/lege-lachgastank-inleveren-breda/
/lachgas-informatie/problematisch-lachgasgebruik-hulp/
/lachgas-informatie/wat-is-lachgas/
/lachgas-informatie/welke-lachgastank-heb-ik-nodig/
```

Minst gelinkte pagina's (inkomende interne links): `/lachgas-feestdagen/` 3, `/lachgas-informatie/lachgas-op-festivals-en-evenementen/` 3, `/lachgas-carnaval-breda/` 4, `/lachgas-informatie/begrippenlijst-lachgas/` 4, `/lachgas-informatie/betrouwbare-lachgas-bezorgservice-herkennen/` 4; daarna een groep gebiedspagina's met 5 (o.a. `/bezorggebied/haagpoort/`, `/bezorggebied/heusdenhout/`, `/bezorggebied/hoge-vucht/`, `/bezorggebied/hoogerheide/`, `/bezorggebied/kaatsheuvel/`, `/bezorggebied/oisterwijk/`). Mediaan 8; de ~45 pagina's in header/paneel/footer krijgen elk 117.

## Bijlage C – Paginatypen en hun JSON-LD-sjabloon

| Paginatype (aantal) | Voorbeeldbestand | JSON-LD-blokken |
|---|---|---|
| Home (1) | `index.html` | LocalBusiness(@id #business) · WebSite(@id #website) · FAQPage(5) |
| Gebiedspagina (53) | `bezorggebied/bavel/index.html` | Service · BreadcrumbList · FAQPage |
| Dienstpagina (15) | `lachgas-spoedbezorging/index.html`, `zakelijk-bestellen/index.html` … | Service · BreadcrumbList · FAQPage |
| Artikel (27) | `lachgas-informatie/wat-is-lachgas/index.html` | Article · BreadcrumbList (géén FAQPage) |
| Product (5) | `product/lachgas-tank-2kg/index.html` | Product · BreadcrumbList · FAQPage |
| Hub met lijst (4) | `bezorggebied/index.html`, `assortiment/index.html`, `veelgestelde-vragen/index.html`, `lachgas-informatie/index.html` | WebPage/CollectionPage · ItemList · BreadcrumbList (· FAQPage) |
| Overige WebPage (9) | `werkwijze/index.html`, `privacy/index.html`, `sitemap/index.html` … | WebPage(isPartOf #website) · BreadcrumbList (· FAQPage) |
| About / Contact (2) | `over-ons/index.html`, `contact/index.html` | AboutPage / ContactPage (mainEntity #business) · BreadcrumbList |
| 404 (1) | `404.html` | – |

## Bijlage D – Prioriteiten (technisch, afgeleid uit de metingen)

1. **Structured data opschonen** – `Product` aanvullen met `offers` (prijs, `priceCurrency`, `availability`) of het type laten vervallen; `LocalBusiness` → overweeg `Organization`/`OnlineBusiness` met consistente `@type` voor `#business` op alle pagina's; `Article.dateModified` koppelen aan de echte wijzigingsdatum (nu overal `2026-10-02` vs sitemap `2026-10-18`); FAQPage-blokken (84 pagina's) kunnen zonder verlies weg of blijven als "ondersteunende" markup – ze kosten ~2–4 KB per pagina.
2. **Echte `lastmod`** per URL in `sitemap.xml` (nu bulk-stempel) en, als IndexNow bedoeld is, de ping toevoegen aan de build (sleutel staat al in de root).
3. **CSS extern + cachebaar maken** (of alleen een klein critical-deel inline laten): bespaart ~6,7 KB gzip per paginaweergave en 3,7 MB in de repo; verwijder de ongebruikte `css/site.css` en `css/tailwind.css` of maak ze de bron.
4. **Titelconventie** gelijktrekken (35 afwijkende pagina's, Bijlage A) en per sectie een eigen `og:image` genereren (nu 1 afbeelding voor 118 pagina's).
5. **Contrast en focus**: `text-gray-400` op lichte vlakken naar `text-gray-500`+ (7 labels in `index.html`, `bezorggebied/index.html`, `404.html`); `:focus-visible`-stijl voor links/knoppen toevoegen; `404.html` een H2-laag geven.
6. **Deploy-hygiëne**: generator in de repo (of ten minste de databron), telefoonnummer als één variabele i.p.v. 663 hard-coded voorkomens, `assets/img/lachgastank-2kg-breda.webp` verwijderen, HSTS `preload` overwegen, CSP uitbreiden met `default-src`/`script-src` (inline `<script>` en JSON-LD vereisen dan hashes/nonces of `'unsafe-inline'` enkel voor `script-src-attr`), GitHub-Pages-restanten (`CNAME`, `.nojekyll`) opruimen als Vercel de enige host is.
