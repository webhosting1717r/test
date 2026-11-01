# Technische analyse: repo `lachgasbrabant`

Analyse van `/home/user/lachgasbrabant` (git, branch `main`, remote `github.com/webhosting1717r/lachgasbrabant`). Alleen gelezen, niets gewijzigd. Meetscripts staan in `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/bfs_brabant.py` (klikdiepte/orphans) en `/tmp/claude-0/-home-user/60b54a9b-62f1-5075-b77c-2ef51e0779af/scratchpad/analyse/meta_brabant.py` (head/meta/JSON-LD/semantiek). Alle cijfers hieronder zijn gemeten over de 131 HTML-bestanden buiten `_build/` en `.git/`.

Opbouw van de repo in één oogopslag:

| Onderdeel | Pad | Omvang |
|---|---|---|
| Gegenereerde site (output) | root + 12 mappen | 131 HTML, 5.775.683 bytes |
| Generator | `_build/build.py`, `_build/common.py`, `_build/pages.py` | 95 + 297 + 297 regels Python |
| Content (databron) | `_build/content/*.py` (13 modules) | ~573 KB Python-dicts, ±3.850 regels |
| Nabewerking "snelheid" | `_build/speed/apply_speed.py`, `levertijd.py`, `nav.js`, `site-brabant.js`, `sw.js`, `fonts/manrope.woff2`, `basis_fix/lachgasbrabant.nl.json` | |
| Nabewerking "master" | `_build/master/seo_master.py` (579 regels), `_build/master/site.json` | |
| Stijl | `_build/site.css` (152 regels, 15.318 bytes), `_build/fonts.css` (1.056 bytes) | |
| Los bestand | `IMG_5577.png` in root | 155.356 bytes, 750×750 RGBA |

---

## 1. Stack & rendering

**Generator.** Eigen Python-SSG zonder framework en zonder `package.json`/Tailwind/templating-engine. `_build/build.py:44-91` laadt de contentmodules (`load_content`, r. 16-32), bouwt via `pages.Site.build_all()` (`_build/pages.py:279-297`) een lijst pagina-dicts en rendert elke pagina met `common.render()` (`_build/common.py:265-288`), dat de volledige HTML als één f-string samenstelt (head r. 278-286, body r. 287). Daarna volgen drie **regex-nabewerkingspassen** over de al geschreven HTML:

1. `levertijd.py` (`_build/speed/levertijd.py:34-46`): normaliseert tijdsbanden en past een vervanglijst uit `basis_fix/lachgasbrabant.nl.json` toe op `.html/.txt/.xml/.json/.webmanifest`.
2. `apply_speed.py` (`_build/speed/apply_speed.py:23-51`): vervangt Google-Fonts-URL's door `/fonts/manrope.woff2`, zet `font-display:swap` → `optional`, verwijdert `preconnect` naar gstatic, injecteert `<link rel=preload>` voor het font, **strijkt de Speculation Rules weg** (r. 43) en hangt `site.js`+`nav.js` vóór `</body>` (r. 49-50). Genereert `sw.js` met versiehash (r. 80-90).
3. `seo_master.py` (`_build/master/seo_master.py:442-475`): parseert de `<head>` opnieuw en **herbouwt** die in vaste volgorde (`build_head`, r. 292-374), herschrijft titels (`new_title`, r. 244-269), herbouwt alle JSON-LD (`rebuild_schemas`, r. 201-225), plakt een extra CSS-blok achter de inline stijl (`css_master`, r. 378-387), zet sitemap-`lastmod` (r. 547-549), llms-titels (r. 550-562), sw-versie (r. 563-565) en schrijft `vercel.json` + `.vercelignore` (r. 566-567).

Gevolg: de output wijkt af van wat `common.py` genereert (bijv. `common.py:284` schrijft nog een `preconnect` naar `fonts.gstatic.com` die in de output niet voorkomt; `common.py:262` schrijft Speculation Rules die in 0 van 131 pagina's staan). De "bron van waarheid" is dus verdeeld over generator + twee post-processors.

**Rendering.** 100% statisch (SSG). Geen hydration, geen framework-runtime. Alle HTML staat server-side klaar: `<main>` bevat de volledige inhoud.

| Meting | Waarde |
|---|---|
| HTML-bestanden | 131 (130 indexeerbaar + `404.html`) |
| Totale HTML-grootte | 5.775.683 bytes |
| Min / mediaan / gemiddeld / max | 34.912 / 43.704 / 44.089 / 62.570 bytes |
| Gzip (voorbeelden) | `index.html` 62.570 → 13.445; `lachgas-bezorgen/breda/index.html` 43.888 → 10.049; `informatie/wat-is-lachgas/index.html` 43.973 → 11.088 |
| Regels per HTML-bestand | 1 (volledig geminificeerd, geen whitespace) |
| Woorden in `<main>` (3 + 2 voorbeelden) | `/` 1.439; `/lachgas-bezorgen/breda/` 597; `/informatie/wat-is-lachgas/` 929; `/service/nachtbezorging/` 752; `/lachgas-tanks/2kg/` 713 |
| Woorden in `<main>` site-breed | min 56 (`404.html`), mediaan 612, max 1.439 |

Van de ~44 KB per pagina is ~17 KB inline CSS en ~3,8 KB JSON-LD; de rest is HTML inclusief het volledige mobiele menu (26 links) en de footer (30 links) die in elke pagina herhaald worden.

**JavaScript.** Twee bestanden, beide `defer` vóór `</body>`, geen inline scripts (0 gemeten), geen third-party:

| Bestand | Raw | Gzip | Functie |
|---|---|---|---|
| `js/nav.js` | 6.950 | 2.550 | "Zachte navigatie": prefetch bij `pointerdown`/`touchstart`/`mouseover` (65 ms) en via IntersectionObserver (max 16 links in beeld, r. 93-111); bij klik `fetch` + `DOMParser`, vervangt `<main>`, `header`, `footer` en synct `title`, `meta description`, `robots`, `canonical`, `og:url` (r. 44-68); eigen voortgangsbalk; `history.pushState`; LRU-cache van 60 pagina's (r. 5). Valt terug op gewone navigatie bij fouten (r. 75). |
| `js/site.js` | 2.931 | 1.319 | Sluit `<details class="menu">` na navigatie, scroll-reveal (`.rv`/`.in`-klassen) uitsluitend onder de vouw en uit bij `prefers-reduced-motion` (r. 24), registreert `/sw.js` alleen op https/localhost (r. 51-53). |
| `sw.js` | 2.292 | 953 | Service worker (zie §8). |
| **Totaal** | **12.173** | **4.256** | Pagina-JS zonder SW: 9.881 raw / 3.869 gzip |

Opmerking: `nav.js:56` zoekt selectors `#site-nav`, `#mobile-panel`, `#mobile-overlay` die op deze site niet bestaan (template-erfenis van zustersites; `apply_speed.py:3-9` en `seo_master.py:39-43` verraden een gedeelde codebasis voor "stad"- en "prov"-sites). Ook `site.js:7` bevat Tailwind-selectors (`main .mb-12.text-center`) die hier nergens matchen. Onschadelijk, maar dode code.

**Service worker.** Aanwezig (`sw.js`), versie `2317a296fb` = SHA1-hash van alle html/js/css/woff2 (`apply_speed.py:81-87`, opnieuw gezet door `seo_master.py:478-486`). Zie §8 voor de cachingstrategie.

---

## 2. URL-architectuur

**Slug-conventie.** Alle URL's zijn lowercase, koppeltekens, geen datums of ID's, geen hoofdletters (0 gevonden), geen tekens buiten `[a-z0-9/-]` (0 gevonden). Slugs komen letterlijk uit de content (`"slug": "breda"` in `_build/content/areas_west.py`), paden worden samengesteld in `_build/pages.py:9-10` (`/lachgas-bezorgen/<slug>/`), r. 88, 147, 162, 189, 213.

**Diepte.** Max 2 segmenten. Verdeling: 1 pagina met 0 segmenten (home), 11 met 1 segment (sectie-indexen + `over-ons`, `contact`, `privacy`, `algemene-voorwaarden`, `sitemap`), 119 met 2 segmenten.

| Sectie | Aantal HTML | Patroon |
|---|---|---|
| `/lachgas-bezorgen/<plaats>/` | 70 | detail (plaats) |
| `/informatie/<slug>/` + index | 26 | 23 artikelen + 2 thema-hubs + index |
| `/service/<slug>/` + index | 13 | 12 + index |
| `/veelgestelde-vragen/<slug>/` + index | 6 | 5 + index |
| `/bezorggebied/<regio>/` + index | 5 | 4 regio-hubs + index |
| `/lachgas-tanks/<maat>/` + index | 4 | 3 + index |
| overige root-pagina's | 6 | `/`, `/over-ons/`, `/contact/`, `/privacy/`, `/algemene-voorwaarden/`, `/sitemap/` |
| `404.html` | 1 | |

Let op de **inconsistentie in mapnaam**: regio-hubs staan onder `/bezorggebied/`, plaatspagina's onder `/lachgas-bezorgen/` (`_build/pages.py:6`). De breadcrumb (`Home › Bezorggebied › West-Brabant › Breda`) suggereert een hiërarchie die de URL niet volgt. Niet fout, wel een keuze die hub en detail in verschillende URL-takken zet.

**Trailing slash.** Consequent directory/`index.html`-conventie: alle 130 sitemap-URL's eindigen op `/` (gemeten), `build.py:58-60` voegt `index.html` toe. `vercel.json` zet `"trailingSlash": true` (regel 2) waardoor Vercel `/x` → `/x/` met 308 redirect afhandelt. Enige uitzondering: `/404.html` als bestandsnaam.

**Redirects.** Geen `redirects` in `vercel.json` (0), geen `_redirects`, geen `netlify.toml`, geen `<meta http-equiv="refresh">` (0 pagina's). Er is dus geen voorziening voor oude URL's.

**Canonicals.** 130/130 indexeerbare pagina's hebben een absolute, zelfverwijzende canonical (`https://lachgasbrabant.nl` + pad); `404.html` heeft er bewust geen (`seo_master.py:341-342` slaat canonical/hreflang over bij noindex). Canonicals komen 1-op-1 overeen met de sitemap-URL's en met bestaande bestanden (0 afwijkingen gemeten).

**Paginering.** Niet aanwezig en niet nodig; lijstpagina's tonen alles op één pagina (bijv. `/bezorggebied/` met 70 chips).

**404.** `404.html` (34.912 bytes, de kleinste pagina) wordt gegenereerd door `pages.py:257-259` met `robots="noindex,follow"`, `sitemap=False`. Volledige chrome (header/footer/menu) plus 6 chips en CTA. Vercel serveert een `404.html` in de output-root automatisch als custom 404-pagina; GitHub Pages (zie `CNAME`) doet dat ook. Geen 410-logica.

---

## 3. Head & meta

**Volgorde.** Alle 131 pagina's beginnen met `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>…` (charset eerst in head: 131/131). De volgorde wordt afgedwongen door `seo_master.py:339-373`: charset → viewport → title → description → robots → canonical → hreflang ×2 → og:* → twitter:* → theme-color → geo.region → geo.placename → icons → manifest → font-preload → `<style>` → JSON-LD-scripts.

**Title.**

| Meting | Waarde |
|---|---|
| Aantal / uniek | 131 / 131 (100%), 0 duplicaten |
| Lengte min / gem / mediaan / max | 25 / 46,2 / 45 / 60 tekens |
| > 60 tekens | 0 (hard afgedwongen in `seo_master.py:252-253, 258-259, 266-267`) |
| Eindigt op ` \| Lachgas Brabant` | 103 |
| Begint met merk (home) | 1 |
| Merk midden in titel | 2 |
| **Zonder merknaam** | **25** (21 artikelen + 4 regio-hubs) |

Patroon: plaatspagina's krijgen van de master-pas een vaste template `Lachgas <Plaats> bestellen | Lachgas Brabant` (`seo_master.py:250-254`), die de content-titel overschrijft (bron `areas_west.py`: `"Lachgas bestellen Breda | Snel bezorgd via WhatsApp"` → output `Lachgas Breda bestellen | Lachgas Brabant`). Artikel-titels zijn langer dan 60 − len(` | Lachgas Brabant`) = 43 tekens en blijven daardoor zonder merk (bijv. `informatie/lachgas-en-het-milieu/index.html`: 60 tekens mét merk, maar `informatie/wat-is-lachgas/index.html`: "Wat is lachgas? Werking, toepassingen en risico's", 49 tekens, geen merk). Dat is een bewuste afweging in de code (r. 255-269), maar levert twee titelstijlen op.

**Description.**

| Meting | Waarde |
|---|---|
| Aantal / uniek | 131 / 131 (100%) |
| Lengte min / gem / mediaan / max | 115 / 148,4 / 149 / 155 |
| > 160 tekens | 0 (`trim_desc`, `seo_master.py:94-105`, knipt op zinsgrens, nooit korter dan 120) |

**Robots meta.** 130× `index, follow, max-image-preview:large`, 1× `noindex, follow` (`404.html`). Geen `max-snippet`/`max-video-preview`.

**Open Graph / Twitter.** Op alle 131 pagina's: `og:type` (108× `website`, 23× `article` voor de artikelen via `og_type="article"` in `pages.py:157`), `og:site_name`, `og:locale` (`nl_NL`), `og:title`, `og:description`, `og:image` (altijd dezelfde `/assets/og-lachgas-brabant.png`, 1200×630, 126.832 bytes), `og:image:width/height`, `og:image:alt`; `og:url` op 130 (niet op 404). Twitter: `summary_large_image`, `twitter:title/description/image/image:alt` op 131. Geen `article:published_time`/`article:modified_time` ondanks `og:type=article`.

**hreflang.** Elke indexeerbare pagina heeft `hreflang="nl"` en `hreflang="x-default"`, beide naar zichzelf (`seo_master.py:342`). Voor een één-talige site is dat redundant (niet schadelijk).

**lang.** `<html lang="nl">` op 131/131 (`seo_master.py:447` forceert dit).

**Favicon / manifest / theme-color.** `favicon.svg` (168 bytes, `build.py:40-41`), `favicon.ico` (1.482 bytes, `sizes="32x32 48x48"`), `apple-touch-icon.png` (180×180), `manifest.webmanifest` (546 bytes, icons 192/512, `display: standalone`, `theme_color #1c1917`, `background_color #fbfaf8`, `lang nl`, `id "/"`), `<meta name="theme-color" content="#1c1917">` op 131/131. Geen `media`-variant voor dark theme-color.

**Viewport / charset.** `width=device-width, initial-scale=1` op 131/131; charset als eerste element op 131/131.

**Preconnect / preload / dns-prefetch.** 0 preconnect, 0 dns-prefetch (geen externe oorsprong meer nodig); 131× `<link rel="preload" href="/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>`, geplaatst vóór `<style>` (`apply_speed.py:37-41`). Geen image-preload (er is geen hero-afbeelding boven de vouw). Geen `modulepreload`/`prefetch`/`prerender`-links (0).

**Extra.** `<meta name="geo.region" content="NL-NB">` en `<meta name="geo.placename">` op 131 pagina's (`seo_master.py:351`); deze meta's hebben geen bekend effect bij Google.

---

## 4. Structured data

**Telling per `@type`** (363 JSON-LD-blokken, gemiddeld 2,8 per pagina, min 0 op `404.html`, max 4):

| @type | Aantal pagina's | Bron |
|---|---|---|
| BreadcrumbList | 129 | `common.py:79-81` via `crumbs_schema` (niet op `/` en `404`) |
| FAQPage | 101 | `common.py:84-86`; home, bezorggebied-index, 4 regio's, 70 plaatsen, 12 services, tanks-index, 3 tanks, FAQ-index, 5 FAQ-topics, 2 thema-hubs, contact |
| Service | 86 | `common.py:89-91`; 70 plaatsen (`areaServed` City), 4 regio's + 12 servicepagina's (`AdministrativeArea`) |
| Article | 23 | `common.py:94-97` |
| ItemList | 10 | `common.py:104-106`; indexen, regio's, thema-hubs |
| WebPage | 5 | 2 thema-hubs (`pages.py:276`), voorwaarden, privacy, en sitemap (toegevoegd door `seo_master.py:215-217`) |
| Product | 3 | `pages.py:197-199` |
| CollectionPage | 2 | `/service/` en `/informatie/` (master: ItemList zonder hoofdentiteit → CollectionPage, `seo_master.py:216`) |
| ContactPage | 1 | `pages.py:240` |
| AboutPage | 1 | `/over-ons/` (WebPage → AboutPage door `seo_master.py:187-188`) |
| LocalBusiness | 1 | alleen home (`seo_master.py:130-153`) |
| WebSite | 1 | alleen home (`seo_master.py:125-127`) |

**Generatie.** Templates in `common.py:62-106` (dicts), per paginatype samengesteld in `pages.py`, daarna genormaliseerd en herordend door `seo_master.py:162-225` (vaste volgorde: hoofdentiteit → ItemList → BreadcrumbList → FAQPage). Geserialiseerd met `ensure_ascii=False`, compacte separators en `</` → `<\/` escaping (`seo_master.py:108-109`). Alle 363 blokken parsen als geldige JSON.

**Koppeling via @id.** Geen `@graph` (0). `@id` komt alleen voor op LocalBusiness (`/#business`) en WebSite (`/#website`), beide uitsluitend op de homepage. Verwijzingen vanaf andere pagina's:
- `Service.provider` → `{"@type":"LocalBusiness","@id":".../#business","name","url","telephone"}` (`seo_master.py:117-118`), dus een cross-page referentie met minimale inline kopie.
- `Article.publisher` → `{"@type":"Organization","@id":".../#business", logo:ImageObject 512×512}` (`seo_master.py:121-122`); let op: hetzelfde `@id` krijgt hier type `Organization`, op home `LocalBusiness` (type-conflict op één identifier).
- `WebPage/AboutPage/ContactPage/CollectionPage.isPartOf` → `{"@id":".../#website"}`; `AboutPage/ContactPage.mainEntity` → `#business`.
- `WebSite.publisher` → `#business`.
- `Product.offers.seller` verwees naar `#business` in de generator (`pages.py:199`) maar `offers` wordt door de master verwijderd (`seo_master.py:179-180`).
- BreadcrumbList en FAQPage hangen los (geen `@id`, geen `isPartOf`/`mainEntityOfPage`).

**Properties en opvallende punten.**
- `LocalBusiness` (home) heeft `name`, `alternateName`, `url`, `logo` (ImageObject), `image`, `description`, `telephone`, `email`, `priceRange "€€"`, `currenciesAccepted`, `paymentAccepted`, `areaServed`, `address` met **alleen** `addressRegion` + `addressCountry` (geen `streetAddress`, `addressLocality`, `postalCode`), `openingHoursSpecification` 7 dagen 00:00-23:59, `contactPoint` (met `url` wa.me), `sameAs` met alleen een wa.me-link (geen sociale profielen). Een LocalBusiness zonder straatadres of `geo` is voor Google niet voor rich results geschikt en is zwak als entiteit.
- `Article` (23): `headline`, `description`, `inLanguage`, `mainEntityOfPage`, `url`, `image` (array met de generieke OG-afbeelding, `seo_master.py:169-170`), `author` Organization, `publisher` met logo. **Alle 23 artikelen hebben `datePublished` = `dateModified` = `2026-10-03`** (constante `TODAY` in `common.py:17`), terwijl de zichtbare tekst "Laatst bijgewerkt: oktober 2026" zegt en de sitemap `2026-10-18` claimt. Geen echte datums.
- `WebPage`-achtigen: `dateModified` = `2026-10-18` (constante in `seo_master.py:21`).
- `Service` (86): `serviceType`, `name`, `description`, `url`, `provider`, `areaServed` (City mét `geo` GeoCoordinates voor 55 plaatsen; de 15 plaatsen uit `areas_midden.py` hebben geen `lat/lon` → 0 treffers op `"lat"` in dat bestand), `availableChannel` ServiceChannel. Geen `offers`/prijs.
- `Product` (3): `name`, `description`, `url`, `brand`, `image`; `offers` bewust verwijderd door de master omdat er geen prijs is ("Product zonder lege offers", docstring r. 6). Daarmee is het geen misleidende markup, maar ook niet in aanmerking voor product-rich-results.
- `FAQPage` op 101 pagina's: sinds augustus 2023 toont Google FAQ-rich-results alleen voor overheids- en gezondheidsautoriteiten; voor deze site is dit markup "die Google niet (meer) toont". Geen `HowTo` (0).
- Geen `AggregateRating`, `Review`, `Event`, `Offer` met prijs (0) → geen misleidende reviewmarkup.
- `ItemList` (10) met absolute `url` per item; geen `numberOfItems`.

**Volledig voorbeeld — detailpagina `lachgas-bezorgen/breda/index.html` (3 blokken, in deze volgorde):**

```json
{"@context":"https://schema.org","@type":"Service",
 "name":"Lachgas bezorgen in Breda",
 "description":"Lachgas bestellen in Breda? Lachgastanks 2KG, 4KG en 10KG verzegeld bezorgd van het Centrum tot de Haagse Beemden, meestal binnen 15 tot 25 minuten. 18+.",
 "url":"https://lachgasbrabant.nl/lachgas-bezorgen/breda/",
 "serviceType":"Lachgas bezorgservice",
 "provider":{"@type":"LocalBusiness","@id":"https://lachgasbrabant.nl/#business","name":"Lachgas Brabant","url":"https://lachgasbrabant.nl/","telephone":"+31684626182"},
 "areaServed":{"@type":"City","name":"Breda","geo":{"@type":"GeoCoordinates","latitude":51.589,"longitude":4.776}},
 "availableChannel":{"@type":"ServiceChannel","serviceUrl":"https://wa.me/31684626182","name":"WhatsApp"}}
```
```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"Home","item":"https://lachgasbrabant.nl/"},
 {"@type":"ListItem","position":2,"name":"Bezorggebied","item":"https://lachgasbrabant.nl/bezorggebied/"},
 {"@type":"ListItem","position":3,"name":"West-Brabant","item":"https://lachgasbrabant.nl/bezorggebied/west-brabant/"},
 {"@type":"ListItem","position":4,"name":"Breda","item":"https://lachgasbrabant.nl/lachgas-bezorgen/breda/"}]}
```
```json
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
 {"@type":"Question","name":"Bezorgen jullie ook in Prinsenbeek, Teteringen en Bavel?","acceptedAnswer":{"@type":"Answer","text":"Ja, de dorpen die bij de gemeente Breda horen vallen onder dezelfde levertijd als de stad. …"}},
 {"@type":"Question","name":"Kan ik lachgas laten bezorgen bij station Breda of op de Grote Markt?","acceptedAnswer":{"@type":"Answer","text":"Nee, we leveren uitsluitend op een privéadres … "}},
 {"@type":"Question","name":"Hoe laat kan ik in Breda nog bestellen?","acceptedAnswer":{"@type":"Answer","text":"Onze WhatsApp staat dag en nacht aan, ook in het weekend. …"}}]}
```
(De antwoordteksten zijn ingekort met "…"; in het bestand staan ze volledig.) Opvallend: de detailpagina heeft geen `WebPage`-wrapper en geen `isPartOf`; `Service` fungeert als hoofdentiteit.

---

## 5. Crawl & indexatie

**robots.txt** (71 bytes, gegenereerd in `build.py:65`), volledige inhoud:

```
User-agent: *
Allow: /

Sitemap: https://lachgasbrabant.nl/sitemap.xml
```

Geen `Disallow`, geen AI-crawler-regels, geen `Host`.

**sitemap.xml** (21.308 bytes, één bestand, geen index): 130 `<url>`, allemaal met `<lastmod>`, `<changefreq>` en `<priority>` (`build.py:62-64`).

| Veld | Verdeling |
|---|---|
| lastmod | **130× `2026-10-18`** — één constante (`seo_master.py:21`, toegepast op r. 547-549 over de door `build.py` geschreven `common.TODAY` = `2026-10-03`). Geen echte wijzigingsdatums. |
| changefreq | 76× `weekly` (home, regio's, plaatsen, bezorggebied), 54× `monthly` |
| priority | 1× 1.0, 7× 0.9, 89× 0.8, 29× 0.7, 1× 0.6, 3× 0.3 |

Overeenkomst: 130 sitemap-URL's ⟷ 130 bestanden met canonical (0 ontbrekend, 0 extra); `404.html` zit terecht niet in de sitemap (`sitemap=False` + noindex-filter `build.py:63`). 0 noindex-pagina's in de sitemap.

**RSS/Atom.** Niet aanwezig (0 `<link rel=alternate type=application/rss+xml>`, geen `.xml` buiten de sitemap).

**IndexNow.** `7e1a9c3b5d2f4a6c8e0b1d3f5a7c9e2b.txt` (32 bytes) in de root bevat exact dezelfde hex-string → een IndexNow-key-bestand, geschreven door `build.py:70` uit `common.py:20` (`INDEXNOW_KEY`). Er is **geen ping-/submit-code**: `grep -ri indexnow` levert alleen die twee regels op; geen `api.indexnow.org`, geen deploy-hook. De key ligt dus klaar maar wordt nergens gebruikt.

**llms.txt / llms-full.txt.** Beide gegenereerd (`build.py:71-80`): `llms.txt` 33.835 bytes / 142 regels met per indexeerbare pagina `- [titel](url): description`; `llms-full.txt` 574.087 bytes / 6.189 regels met de platte tekst van elke pagina (`common.page_text`, r. 291-297). Titels worden door de master na afloop gelijkgetrokken (`seo_master.py:550-562`). Kleine fout in `page_text`: `</span>` breekt geen regel, waardoor kicker en H1 aan elkaar plakken ("…heel Noord-BrabantLachgas bestellen…", regel 9 van `llms-full.txt`). Geen `robots.txt`-verwijzing naar llms.txt (niet standaard, maar gebruikelijk).

**Google verification.** 0 `google-site-verification`-meta's; geen `google*.html`-bestand. Verificatie loopt vermoedelijk via DNS of ontbreekt.

**Noindex.** Uitsluitend `404.html`. Geen `X-Robots-Tag` in `vercel.json`.

---

## 6. Interne links

**Navigatiestructuur (gemeten op `lachgas-bezorgen/breda/index.html`, identiek op alle pagina's):**

| Blok | Links | Bron |
|---|---|---|
| Header: logo + desktop-nav (5) + WhatsApp-knop | 7 | `common.py:152-159`, `NAV` r. 27-28 |
| Header: mobiel menu in `<details>` (4 tegels + 1 productkaart + 20 groepslinks + WA-knop) | 26 | `common.py:116-139` |
| **Header totaal** | **33** | |
| Footer: logo + WA + mail + kolom Bezorggebied (5) + Informatie (8) + Service (11) + 3 juridisch | 30 | `common.py:162-173`, lijsten in `build.py:53-55` |
| Zwevende WhatsApp-knop | 1 | `common.py:172` |
| `<main>` (plaatspagina) | 16 | |

Per pagina dus ~64 boilerplate-links; totaal 10.758 `<a href>` op 131 pagina's = **82,1 per pagina**; **unieke interne doelen per pagina gemiddeld 40,1** (min 34, max 129 op `/sitemap/`). Het mobiele menu staat als volledige DOM in elke pagina (ook desktop), wat 26 links en ~5 KB per pagina kost.

**Breadcrumbs.** HTML-kruimelpad `<nav aria-label="Kruimelpad"><ol class="crumbs">` met `aria-current="page"` op het laatste item (`common.py:176-180`) op 130 pagina's (niet op home) + `BreadcrumbList`-JSON-LD op 129 (niet op home en 404). HTML en JSON-LD komen uit dezelfde itemlijst en zijn consistent.

**Hub ↔ detail.**
- Regio-hub → alle plaatsen als chips + "Andere regio's" (`pages.py:96, 99`); plaats → regio-hub via kruimelpad, sidebar ("Heel West-Brabant") en 3 "nearby"-plaatsen (`pages.py:116`); bezorggebied-index → alle 70 plaatsen gegroepeerd per regio (`pages.py:73-76`).
- Thema-hub (2) → artikelen in groepen (`pages.py:268-272`); artikel → "Gerelateerde onderwerpen" via `related`-slugs + "Alle informatie" (`pages.py:149`).
- Service-index → 12 services; service → `related`-chips (`pages.py:164-167`).
- Tanks: index ↔ 3 detailpagina's + "Vergelijk met de andere tanks" (`pages.py:196`).
- `/sitemap/` linkt naar alle 130 pagina's (`pages.py:242-255`).

**Klikdiepte (BFS vanaf `/` over interne hrefs, `bfs_brabant.py`):**

| Diepte | Pagina's |
|---|---|
| 0 | 1 (home) |
| 1 | 48 |
| 2 | 81 |
| **max** | **2** |
| onbereikbaar | 1 (`/404.html`, bedoeld) |

Alle 130 indexeerbare pagina's binnen 2 klikken. Diepte 1 wordt gedragen door header (33) + footer (30) + home-`<main>`.

**Wezen (orphans).** 0 onder de indexeerbare pagina's; alleen `/404.html` heeft geen inkomende link (correct). Minst gelinkte pagina's: 3 inkomende unieke pagina's voor o.a. `/lachgas-bezorgen/strijp/`, `/budel/`, `/werkendam/`, `/baarle-nassau/`, `/stratum/`, `/zundert/` en `/informatie/begrippenlijst-lachgas/`. Meest gelinkt (130 inkomend, via header/footer): `/bezorggebied/`, `/lachgas-tanks/`, `/service/spoedbezorging/`, `/informatie/wat-is-lachgas/`, `/informatie/is-lachgas-legaal-in-nederland/`, `/bezorggebied/zuidoost-brabant/`.

**Gebroken interne links.** 0 (alle href-doelen eindigend op `/` of `.html` bestaan als bestand).

**Ankertekst.** In `<main>`: 1.842 interne ankers, **0 met uitsluitend generieke tekst** ("lees meer", "hier"). Kaarten zijn hele-kaart-ankers (`<a class="card">` met `<h3>` + `<p>` + `<span class="more">Lees meer →</span>`, `common.py:196-203`), zodat de ankertekst de kop bevat. "Lees meer →" komt 8× voor op home als label binnen zo'n kaart; andere labels zijn specifiek ("Bekijk de regio", "Bekijk de tank", "Wat de wet zegt"). Meest voorkomende ankerteksten: "Home" (132, kruimelpad), "Bezorggebied" (76), productkaarten (72×3), regionamen, plaatsnamen, en inline tekstlinks als "bijwerkingen en eerste hulp" (18), "nachtbezorging" (13). Patroon: beschrijvend.

**nofollow / externe links.** 0 `nofollow`, 0 `sponsored`/`ugc`. Externe doelen: `wa.me` (731 hrefs, allemaal `target="_blank" rel="noopener"`), `www.rijksoverheid.nl` (23), `www.drugsinfo.nl` (10), `www.novadic-kentron.nl` (9), `www.trimbos.nl` (6). Geen `tel:`-links (0); 1 `mailto:` in de footer.

**Opmerking `aria-current`.** Desktop-nav markeert de actieve sectie via `path.startswith(h)` (`common.py:153`); op `/lachgas-bezorgen/*` matcht geen enkel nav-item (map heet anders dan `/bezorggebied/`), dus daar 0 `aria-current` in de header.

---

## 7. HTML-semantiek

| Meting | Waarde |
|---|---|
| H1 per pagina | **131× exact 1** (0 zonder, 0 meervoudig) |
| Overgeslagen kopniveaus (h1→h3 etc.) | **0 pagina's** |
| `<header>` / `<main>` / `<footer>` | 131 / 131 (`id="inhoud"`) / 131, elk precies 1 per pagina |
| `<nav>` | 418 totaal: 3 per pagina (Hoofdmenu, Mobiel menu, Kruimelpad) + "Inhoud"-TOC op 26 artikelpagina's; alle met `aria-label` |
| `<aside>` | 75 (`.hero-card` op home, plaatsen, tanks, contact) |
| `<article>` | **0** — artikelen gebruiken `<div class="prose">` (`common.py:258`) |
| `<section>` | 694 (gem. 5,3 per pagina), zonder `aria-labelledby` |
| Skip-link | 131× `<a class="skip" href="#inhoud">Direct naar inhoud</a>` als eerste element in body |
| `lang` | `nl` op 131 |

**Kopvolgorde (voorbeeld plaatspagina):** h1 "Lachgas bezorgen in Breda" → h2 (sidebar) "Lachgas bezorgen in Breda" → h2 "Lachgastanks in Breda" → h3 ×3 (producten) → h2 FAQ → h2 "Wij bezorgen ook hier" → h2 CTA → footer h3 ×3. Nette hiërarchie, maar de **H2 in de sidebar herhaalt de H1 letterlijk** (`pages.py:113`). Op `/service/` en `/veelgestelde-vragen/` promoot de master kaartkoppen van h3 naar h2 (`seo_master.py:436-438`), gecontroleerd: `service/index.html` bevat `<a class="card"…><h2>`.

**Afbeeldingen.** 134 `<img>` totaal: **0 zonder `alt`-attribuut**, 131 met `alt=""` (het decoratieve 56×56 productminiatuur in het mobiele menu, `common.py:136`, op elke pagina), 3 met beschrijvende alt ("Verzegelde lachgastank 2KG van Lachgas Brabant": home, tanks-index, 2kg). Alle 134 hebben `width`+`height`, `loading="lazy"`, `decoding="async"`. SVG-iconen (819×) dragen `aria-hidden="true"`.

**ARIA.** `aria-hidden` 819, `aria-label` 811 (logo "…, naar de homepage", `summary` "Menu openen", nav-labels, zwevende WA-knop), `aria-current` 196 (kruimelpad + nav + menu-tegels). Geen `role=`-attributen (native elementen). Mobiel menu gebruikt native `<details>/<summary>` (geen aria-expanded nodig). FAQ gebruikt `<details>`; eerste item `open` (`common.py:213`).

**Tabellen.** 5 pagina's (4 regio's + tanks-index) met `<table class="tbl">` in `<div class="tbl-wrap">` (overflow-x), met `<thead>`, maar `<th>` zonder `scope`-attribuut (16× `<th>` kaal).

**Formulieren / iframes.** 0 `<form>`, 0 `<iframe>`; conversie loopt via `wa.me`-links.

---

## 8. Performance

**CSS-strategie.** Volledig inline critical CSS: 1 `<style>`-blok per pagina, **16.952 bytes** (gzip 4.443), byte-identiek op alle 131 pagina's (bron `_build/site.css` 15.318 bytes, geminificeerd door `common.py:22-24`, + `fonts.css` + master-blok `seo_master.py:28-49`). Geen extern stylesheet, dus geen render-blocking request maar ook geen caching tussen pagina's (±4,4 KB gzip per paginaview). Geen Tailwind/framework; 0 `!important`.

**Fonts.**

| Aspect | Bevinding |
|---|---|
| Hosting | Self-hosted `/fonts/manrope.woff2` (22.580 bytes); gstatic-URL's uit `_build/fonts.css` worden vervangen door `apply_speed.py:14, 26-31` |
| Formaat | WOFF2, **variabel lettertype** (`fvar`, `HVAR`, `STAT`-tabellen aanwezig; 18 tabellen) — 3 `@font-face`-regels (500/700/800) wijzen naar hetzelfde bestand |
| Preload | `<link rel=preload as=font crossorigin>` op 131 pagina's |
| `font-display` | `optional` (3×; `swap` → `optional` in `apply_speed.py:34`) → geen FOUT/CLS, mogelijk systeemfont bij trage verbinding |
| Subset | `unicode-range` latin-basis (U+0000-00FF e.a.) op alle 3 regels |
| Fallback | Body gebruikt `system-ui`-stack (`site.css:5`), Manrope alleen voor koppen/logo/USP's; **geen `size-adjust`/`ascent-override`-fallback** (de enige "size-adjust"-treffer is `-webkit-text-size-adjust`) |
| Cache | `/fonts/(.*)` → `public, max-age=31536000, immutable` (`vercel.json`) |

**Afbeeldingen.**

| Formaat | Bestanden | Bytes | Gebruik |
|---|---|---|---|
| WebP | 3 (`lachgastank-2kg.webp` 480×640, `-300` 300×400, `-160` 160×160) | 34.808 | productfoto met `srcset` 300w/480w + `sizes` (3 plaatsen), menuminiatuur (131 pagina's) |
| PNG | 5 | 293.891 | `og-lachgas-brabant.png` 1200×630 (126.832), `icon-512` (7.004), `icon-192`, `apple-touch-icon`, **`IMG_5577.png` 750×750 RGBA (155.356)** |
| ICO/SVG | 2 | 1.650 | favicons |
| AVIF / JPG | 0 | | |

Alle `<img>` hebben `width/height` (CLS), `loading="lazy"`, `decoding="async"`; `srcset`+`sizes` op 3; **0× `fetchpriority`**, 0× `<picture>`. Omdat er geen LCP-afbeelding boven de vouw is (hero is tekst + donkere kaart), is `lazy` overal verdedigbaar; LCP is vermoedelijk de H1-tekst.

**`IMG_5577.png`.** Staat in de root sinds de eerste commit (`426dd43`), wordt **nergens** gerefereerd (grep over `.html/.py/.js/.json/.txt/.xml`: 0 treffers), valt niet onder `.vercelignore` (dat alleen `_build` uitsluit) en wordt dus publiek mee-gedeployed op `/IMG_5577.png`. Het is een onbewerkte productfoto (camerabestandsnaam, 750×750 met alfakanaal), groter dan de OG-afbeelding en 4,5× groter dan de drie WebP's samen. Dood gewicht en vermoedelijk het bronbestand voor `lachgastank-2kg*.webp`; hoort in `_build/` of buiten de repo.

**Third-party.** Geen: 0 externe scripts, 0 analytics, 0 tag manager, 0 chat-widget, 0 maps, 0 externe CSS/fonts. Enige externe hosts in de HTML zijn `wa.me` (links), `schema.org` (context), `w3.org` (SVG-namespace) en 4 informatiebronnen (links).

**Prefetch / prerender / speculation rules.** `common.py:262` genereert `<script type="speculationrules">` (prerender `/*`, eagerness moderate), maar `apply_speed.py:43` verwijdert dat weer ("dubbel werk naast de router") → 0 in output. In plaats daarvan doet `nav.js` prefetch-bij-intentie (hover 65 ms, pointerdown, touchstart, IntersectionObserver max 16 links, uit bij `saveData`/2g, r. 6-7) en een client-side paginawissel. Nadeel: bij de soft-navigatie wordt de JSON-LD niet bijgewerkt en blijft het `<style>`-blok van de eerste pagina staan (geen probleem zolang CSS identiek is, wat nu zo is).

**Service worker (`sw.js`).**

| Onderdeel | Strategie |
|---|---|
| Precache bij install | `/`, `/js/site.js`, `/js/nav.js`, `/fonts/manrope.woff2` (r. 4); `skipWaiting` (r. 7) |
| Activate | verwijdert alle caches die niet `static-<ver>`/`pages-<ver>` heten (r. 9-13), `clients.claim` |
| Statisch (`woff2|css|js|webp|png|jpe?g|svg|ico|avif|webmanifest`) | cache-first, netwerkfallback met `put` (r. 22-30) |
| Pagina's (`navigate`, `Accept: text/html`, pad eindigt op `/` of `.html`) | stale-while-revalidate, sleutel = pad+query, max 150 pagina's FIFO-trim (r. 5, 14-16, 31-44), offline-fallback naar `/` (r. 42) |
| Versie | `2317a296fb` = SHA1 van alle html/js/css/woff2 (`apply_speed.py:80-87`, `seo_master.py:478-486`) → elke build invalideert alles |
| HTTP-cache SW zelf | `Cache-Control: no-cache` (`vercel.json`) |

Consequentie van SWR: na een deploy ziet een terugkerende bezoeker één keer de oude pagina (de commitboodschappen bevestigen dit expliciet: "service worker-versie vernieuwd zodat bezoekers geen oude pagina uit de cache zien", commit `d8f8e18`).

**Paginagewicht (eerste bezoek, geschat):** HTML ~10-13 KB gzip + font 22,6 KB + JS 3,9 KB gzip + favicon/manifest ≈ 40-45 KB; geen render-blocking externe resources.

---

## 9. Styling & layout

**Architectuur.** Eén handgeschreven stylesheet (`_build/site.css`, 152 regels), klasse-gebaseerd met korte component-namen (`.hdr`, `.btn`, `.card`, `.chips`, `.faq`, `.steps`, `.pf`, `.mm-*`), geen BEM, geen utilities-framework. 14 design tokens als custom properties op `:root` (`site.css:2`): `--bg`, `--surface`, `--ink`, `--ink-2`, `--muted`, `--line`, `--brand`, `--brand-2`, `--brand-soft`, `--dark`, `--wa`, `--wa-2`, `--radius`, `--max`. Typografie via `clamp()` voor h1/h2 (`site.css:7-8`). Daarnaast inline `style=""`-attributen in de gegenereerde HTML: gemiddeld 4,2 per pagina, max 27 op `/sitemap/` (kolomlayout), 15 op `/bezorggebied/` (`pages.py:75`), 10 op home (`pages.py:55, 61-62`) — presentatie die in de stylesheet thuishoort.

**Mobile-first.** 11 `@media (min-width: …)` (440/640/768/800/900/960 px) tegen 1 `max-width` (TOC-kolommen, `site.css:143`) + `print` + `prefers-reduced-motion`. Desktop-nav verschijnt pas bij ≥900 px (`site.css:50`), `.menu` (hamburger) verdwijnt dan. Layout-patronen: `.wrap` max 1180 px met 20 px gutter, CSS Grid voor `.grid.g2/g3/g4`, `.two`, `.hero-grid`, `.ftr-grid`, `.usp`; `100dvh` voor het menupaneel (`site.css:152`).

**CLS-preventie.** `width/height` op alle 134 `<img>`; `.pf-img img{width:100%;max-width:230px;height:auto}`; scroll-reveal (`.rv{opacity:0;transform:translateY(14px)}`) wordt alleen door JS toegevoegd aan elementen die al buiten beeld zijn (`site.js:30-37`) en na 1 s weer verwijderd — geen layoutverschuiving, geen verborgen inhoud voor crawlers (klasse staat niet in de HTML-bron). `font-display:optional` voorkomt font-swap-CLS. Geen `aspect-ratio` (0), geen `content-visibility` (0); sticky header heeft vaste `min-height:66px`.

**Dark mode.** Niet aanwezig (0× `prefers-color-scheme`); `theme-color` heeft één waarde.

**Toegankelijkheid in CSS.**
- Focus: alleen `.skip:focus{left:8px}`; geen `:focus-visible`-stijlen, maar ook nergens `outline:none` → browser-standaard focusring blijft intact.
- Reduced motion: alleen in het master-blok (`seo_master.py:37`): zet `.rv`-transities, de pulserende WA-knop (`@keyframes mring`, oneindig) en `:active`-scale uit. `html{scroll-behavior:smooth}` (`site.css:4`) is **niet** gegate op reduced motion.
- Contrast (berekend, WCAG-ratio): `--muted #78716c` op `--bg #fbfaf8` **4,60:1** (AA voor normale tekst, krap; gebruikt in `.card p`, `.sec-head p`, `.usp small`, tabelkoppen); `--ink-2` op bg 9,85; links `--brand` op bg 5,82; wit op WA-groen `#15803d` 5,02; footer `.legal` (wit 50% op `#1c1917`) 5,23; kruimelpad 55% 6,07; `.phead .lead` 10,23. De master-pas noemt expliciet AA-contrast als doel (`seo_master.py:7`, en commit `eacacf3` "tabelkoppen-contrast").
- `.faq summary` en `.menu summary` verbergen de native marker maar blijven toetsenbordbedienbaar (native `<details>`).

**Responsive images.** `srcset` 300w/480w met `sizes="(min-width: 768px) 300px, 70vw"` (home, tanks-index) en `sizes="200px"` (2kg-sidebar) — correct gedimensioneerd. Geen `<picture>`/AVIF.

---

## 10. Hosting / deploy

**Configuratie.**
- `vercel.json` (1.931 bytes, gegenereerd door `seo_master.py:51-68, 566`): `trailingSlash: true`; headers op `/(.*)`: `Strict-Transport-Security: max-age=63072000; includeSubDomains` (geen `preload`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'` — **geen `default-src`/`script-src`/`style-src`**, dus de CSP beschermt niet tegen XSS/injectie (wel tegen framing). Cache-Control: `/fonts/` 1 jaar immutable, `/assets/` 30 d + SWR 7 d, `/js/` 1 d + SWR 7 d, `/sw.js` no-cache. Regels voor `/img/(.*)` en `/images/(.*)` verwijzen naar **niet-bestaande mappen** (0 referenties; template-erfenis). Geen expliciete Cache-Control voor HTML (Vercel-default `public, max-age=0, must-revalidate`) en geen `cleanUrls` (niet nodig bij directory/index.html). Geen `redirects`/`rewrites`.
- `.vercelignore`: alleen `_build`. `IMG_5577.png`, `llms-full.txt` (574 KB) en de IndexNow-key worden wél gedeployed.
- `CNAME` (`lachgasbrabant.nl`, geschreven door `build.py:66`): een GitHub-Pages-artefact naast een Vercel-config. Als de site via GitHub Pages wordt geserveerd, gelden géén van de `vercel.json`-headers (geen HSTS/nosniff/XFO) en geen 308-trailing-slash-redirects. Welk platform live is, blijkt niet uit de repo.
- Compressie: niet geconfigureerd (Vercel doet gzip/brotli automatisch; GitHub Pages gzip). Geen CDN-hints (`Vary`, `CDN-Cache-Control`).
- Geen `netlify.toml`, `_headers`, `_redirects`, `wrangler.toml`, geen CI-workflow (`.github/` ontbreekt). Deploy = commit van gegenereerde HTML.

**Build-pijplijn (`python3 _build/build.py`).**
1. `load_content()` importeert 13 contentmodules als Python-dicts (`AREAS` 70, `ARTICLES` 23, `TOPIC_HUBS` 2, `SERVICE_PAGES` 12, `FAQ_TOPICS` 5, `HUBS` 4, `TANKS`, `HOME`, indexen) — content is code, geen JSON/Markdown/CMS.
2. `Site.build_all()` → 131 pagina-dicts (`path`, `title`, `description`, `body`, `schemas`, `priority`, `changefreq`, `robots`).
3. `common.render()` → HTML; `build.py:49-52` controleert dubbele paden met een `assert`.
4. Schrijft sitemap, robots, CNAME, favicon, manifest, IndexNow-key, llms(.full).txt.
5. `apply_speed.apply(ROOT, "brabant")` → levertijd-regex, fonts, scripts, sw.
6. `seo_master.apply_site(ROOT, SITE)` → head/JSON-LD/titels/CSS/sitemap-lastmod/vercel.json.

Zwakke plekken in de pijplijn: twee **hardgecodeerde datums** (`common.py:17` `TODAY = "2026-10-03"`, `seo_master.py:21` `TODAY = "2026-10-18"`) in plaats van `date.today()` of git-datums; drie regex-passen over gerenderde HTML (fragiel, moeilijk te debuggen, bewust "idempotent" genoemd); `levertijd.py` herschrijft met een regex élke "N tot M minuten"-band naar "15 tot 25" (780 treffers in de output, 0 andere banden over) en repareert de daardoor ontstane dubbele zinnen met een handmatige vervanglijst (`basis_fix/lachgasbrabant.nl.json`, 10 items) — een inhoudelijke patch op outputniveau in plaats van in de bron. Het font staat dubbel in de repo (`_build/speed/fonts/manrope.woff2` en `fonts/manrope.woff2`, byte-identiek).

**Git-geschiedenis.** 11 commits, 2026-10-12 t/m 2026-10-22, alle met auteur "Claude" (`noreply@anthropic.com`), één branch `main`.

| Commit | Datum | Bestanden | Inhoud |
|---|---|---|---|
| `426dd43` | 10-12 | 178 | initiële import (11.824 regels), incl. `IMG_5577.png` |
| `51a31ed` | 10-13 | 134 | telefoonnummer gewijzigd |
| `643dbfd` | 10-13 | 133 | WhatsApp-icoon wit / zichtbaar |
| `c207d3f` | 10-17 | 134 | nummer gewijzigd |
| `c198bd3` | 10-17 | 134 | nummer teruggezet |
| `d33a43f` | 10-17 | 134 | nummer gewijzigd |
| `81ea39f` | 10-19 | 142 | SEO-masterstandaard (head, schema, a11y, vercel.json) |
| `eacacf3` | 10-19 | 1 | master: tabelkop-contrast |
| `324cd73` | 10-20 | 136 | nummer gewijzigd |
| `6d06c88` | 10-21 | 136 | nummer gewijzigd |
| `d8f8e18` | 10-22 | 136 | nummer teruggezet |

**7 van de 11 commits** zijn wisselingen van het telefoonnummer tussen drie nummers, elk met 134-136 gewijzigde bestanden (omdat het nummer in elke HTML én in `common.py`/`site.json` staat, en de sw-versie meewisselt). 0 verwijderde bestanden in de hele historie. Geen tags, geen CI, geen `.github/`.

---

## SAMENVATTING

**Top 5 sterke punten**
1. **Nul third-party en minimale JS**: 0 externe scripts/fonts/analytics; 9.881 bytes pagina-JS (3.869 gzip) + 2.292 bytes service worker; volledige CSS inline (4,4 KB gzip); self-hosted variabel WOFF2 van 22,6 KB met preload, `font-display:optional` en `unicode-range`.
2. **Vlakke, volledig verbonden architectuur**: max klikdiepte 2, 0 wezen, 0 gebroken interne links, 100% zelfverwijzende canonicals die 1-op-1 matchen met 130 sitemap-URL's en bestanden; consistente trailing-slash-conventie met `trailingSlash:true`.
3. **Metadata-discipline**: 131/131 unieke titels (max 60, 0 te lang) en 131/131 unieke descriptions (115-155 tekens, 0 te lang), afgedwongen in code (`seo_master.py:94-105, 244-269`); OG/Twitter compleet incl. `og:image:alt`.
4. **Semantiek en toegankelijkheid**: exact 1 H1 op 131 pagina's, 0 overgeslagen kopniveaus, header/main/footer/nav-landmarks met `aria-label`, skip-link overal, 0 afbeeldingen zonder alt, `width/height` op 100% van de `<img>`, reduced-motion-respect in reveal/animatie.
5. **Eigen snelheidslaag**: service worker met build-hash-versie (precache + cache-first statisch + SWR pagina's), prefetch-bij-intentie en soft-navigatie met meta/canonical-sync, plus `llms.txt`/`llms-full.txt` en een klaarliggende IndexNow-key.

**Top 5 zwakke punten / fouten**
1. **Nep-datums**: alle 130 sitemap-`lastmod` = `2026-10-18` en alle 23 `Article.datePublished`/`dateModified` = `2026-10-03`, beide hardgecodeerde constanten (`seo_master.py:21`, `common.py:17`) die niet met de echte wijzigingen meelopen (7 deploys daarna).
2. **Structured data zonder ruggengraat**: geen `@graph`, `@id` alleen op home; `#business` is op home `LocalBusiness` en elders `Organization`; `LocalBusiness` zonder straatadres/geo; `FAQPage` op 101 pagina's die Google voor deze site niet meer toont; `Product` zonder `offers`; detailpagina's zonder `WebPage`/`isPartOf`.
3. **`IMG_5577.png` (155 KB) ongerefereerd in de root en publiek gedeployed**, plus template-erfenis: `vercel.json`-cacheregels voor niet-bestaande `/img/` en `/images/`, dode selectors in `nav.js:56` en `site.js:7`, `CNAME` (GitHub Pages) náást `vercel.json` zodat onduidelijk is welke headers daadwerkelijk gelden.
4. **Fragiele drietraps-nabewerking**: generator → `levertijd.py` (regex over alle output, met handmatige reparatielijst `basis_fix/*.json`) → `apply_speed.py` → `seo_master.py` dat de head opnieuw parseert en herbouwt; `common.py` genereert zaken (preconnect gstatic, speculation rules, Product.offers) die later weer gestript worden. Twee bronnen van waarheid voor titels (content vs. master-template).
5. **Deploy-hygiëne**: 7 van 11 commits zijn telefoonnummer-wissels die telkens 134-136 bestanden raken; CSP mist `default-src`/`script-src`; 25 van 131 titels zonder merknaam (twee titelstijlen); mobiel menu (26 links, ~5 KB) en footer (30 links) in elke pagina → 82 links/pagina waarvan ~64 boilerplate; IndexNow-key zonder ping-code; `scroll-behavior:smooth` niet reduced-motion-gegate; `--muted`-contrast 4,60:1 op het randje.

## SCORETABEL

| # | Onderdeel | Score | Motivatie |
|---|---|---|---|
| 1 | Stack & rendering | **5** | Pure SSG, alle inhoud server-side, 9,9 KB JS zonder framework of third-party, SW aanwezig; alleen wat dode template-code. |
| 2 | URL-architectuur | **4** | Lowercase, max 2 segmenten, consequente trailing slash, zelfverwijzende canonicals, nette 404-noindex; geen redirect-voorziening en hub (`/bezorggebied/`) en detail (`/lachgas-bezorgen/`) in verschillende takken. |
| 3 | Head & meta | **4** | 100% unieke titels/descriptions binnen de limieten, volledige OG/Twitter, vaste head-volgorde; 25 titels zonder merk, redundante self-hreflang en nutteloze geo-meta's. |
| 4 | Structured data | **3** | Rijk en valide (12 types, 363 blokken, breadcrumbs HTML+LD), maar constante datums, geen @graph/isPartOf op details, type-conflict op `#business`, LocalBusiness zonder adres en 101 niet-getoonde FAQPages. |
| 5 | Crawl & indexatie | **4** | Sitemap 1-op-1 met bestanden en canonicals, correcte robots.txt, llms(.full).txt, IndexNow-key; lastmod is één constante en de key wordt nooit gepingd, geen RSS. |
| 6 | Interne links | **4** | Diepte ≤ 2, 0 wezen, 0 gebroken links, hub↔detail wederzijds, beschrijvende ankers, breadcrumbs; keerzijde: 64 boilerplate-links per pagina en plaatsen met slechts 3 inkomende links. |
| 7 | HTML-semantiek | **4** | 1 H1 overal, 0 niveau-sprongen, landmarks + skip-link + alt op 100%; geen `<article>`, H2 herhaalt H1 op plaatspagina's, `<th>` zonder `scope`. |
| 8 | Performance | **5** | Inline CSS 4,4 KB gzip, variabel self-hosted font met preload/optional/subset, geen externe requests, SW + prefetch, alle img met dimensies; alleen geen `size-adjust`-fallback en één ongebruikte 155 KB PNG gedeployed. |
| 9 | Styling & layout | **4** | Tokens, mobile-first (11 min-width vs 1 max-width), CLS-veilig, reduced-motion in animaties; geen dark mode, geen focus-visible-stijlen, smooth-scroll ongegate, `--muted` krap AA, inline `style`-attributen. |
| 10 | Hosting/deploy | **3** | Goede security- en cache-headers via `vercel.json`, build reproduceerbaar in één commando; maar zwakke CSP, CNAME/Vercel-ambiguïteit, hardgecodeerde datums, drie regex-passen, 7/11 commits nummerwissels van 136 bestanden, dood bestand in root. |

## KERNGETALLEN

| Kengetal | Waarde |
|---|---|
| HTML-pagina's | 131 (130 indexeerbaar + `404.html`); 5.775.683 bytes totaal, mediaan 43.704 |
| Totale JS | 12.173 bytes raw / 4.256 gzip (`nav.js` 6.950 + `site.js` 2.931 + `sw.js` 2.292); pagina-JS zonder SW 9.881 / 3.869 |
| Totale CSS | 16.952 bytes inline per pagina (gzip 4.443), identiek op 131 pagina's; bron `site.css` 15.318 + `fonts.css` 1.056 + master-blok |
| JSON-LD-types | 12 (363 blokken): BreadcrumbList 129, FAQPage 101, Service 86, Article 23, ItemList 10, WebPage 5, Product 3, CollectionPage 2, ContactPage 1, AboutPage 1, LocalBusiness 1, WebSite 1 |
| Max klikdiepte | 2 (verdeling 1 / 48 / 81) |
| Wezen (orphans) | 0 (alleen `/404.html` ongelinkt, bedoeld) |
| Pagina's zonder / met meerdere H1 | 0 / 0 (131× exact 1) |
| `<img>` zonder alt | 0 van 134 (131× `alt=""` decoratief, 3× beschrijvend) |
| % unieke titles | 100% (131/131); descriptions eveneens 100% |
| Overig | sitemap 130 URL's, lastmod 130× identiek; 0 third-party scripts; font 22.580 bytes variabel WOFF2; `IMG_5577.png` 155.356 bytes ongebruikt; 11 commits (12-22 okt 2026), 7 nummerwissels |
