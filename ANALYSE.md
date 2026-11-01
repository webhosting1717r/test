# ANALYSE.md: zeven referentie-repos onder de loep

Datum: 1 november 2026. Onderzocht: `lachgasholland`, `lachgasbreda`, `lachgasantwerpen`, `lachgasbrabant`, `lachgasgelderland`, `lachgasgroningen`, `lachgas-limburg` (allemaal `github.com/webhosting1717r/…`, lokaal gekloond). De inhoud van de sites is buiten beschouwing gelaten. Alles hieronder gaat over techniek, SEO-architectuur en front-end.

Werkwijze: zeven parallelle analyses met één identieke checklist van tien punten (zie `SEO-CHECKLIST.md`, sectie "Analysechecklist"). Elke analist mat met `grep`/`find`/`wc`/`gzip` en een eigen BFS-script (klikdiepte, wezen, kapotte links) en legde bevindingen vast met bestands- en regelverwijzingen. De volledige rapporten (337–463 regels per repo) staan in `docs/analyse/`.

---

## 1. Twee families, één hand

De zeven repos zijn geen zeven onafhankelijke sites. Ze vallen uiteen in twee families die door dezelfde maker met dezelfde "SEO-masterstandaard" zijn nabewerkt:

| Familie | Repos | Kenmerk | Bewijs |
|---|---|---|---|
| **A: Python-generator in repo** | holland, brabant, gelderland, limburg | `_build/build.py` + `common.py` + `pages.py` + `content/*.py`; drie bouwpassen (render → `speed/apply_speed.py` → `master/seo_master.py`); eigen CSS zonder framework | `lachgasholland/_build/build.py:45-94`, `_build/master/seo_master.py:402-470` |
| **B: Tailwind-output zonder generator** | breda, antwerpen, groningen | Gecompileerde Tailwind 3.4.17 volledig inline (±31 KB per pagina); generator staat in `.vercelignore` (`_build`) en is nooit gecommit | `lachgasantwerpen/.vercelignore`, `css/tailwind.css` (ongebruikt), `sw.js:1-2` (VERSION-hash per build) |

Gedeeld door alle zeven: dezelfde `js/nav.js` (6.950 B, intent-prefetch-router met soft navigation), dezelfde `sw.js`-strategie (static cache-first, pagina's stale-while-revalidate), identieke `vercel.json`-headers, dezelfde head-volgorde, IndexNow-sleutelbestand in de root, `llms.txt` + `llms-full.txt`, en dezelfde datumconstante `2026-10-18` in elke sitemap.

---

## 2. Vergelijkingsmatrix

Scores 1–5 per checklistpunt, zoals toegekend door de analisten (motivatie in de rapporten).

| # | Onderdeel | holland | breda | antwerpen | brabant | gelderland | groningen | limburg |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | Stack & rendering | 5 | 4 | 4 | 5 | 5 | 4 | 5 |
| 2 | URL-architectuur | 5 | 5 | 4 | 4 | 5 | 5 | 4 |
| 3 | Head & meta | 5 | 4 | 5 | 4 | 4 | 4 | 4 |
| 4 | Structured data | 3 | 3 | 4 | 3 | 3 | 3 | 3 |
| 5 | Crawl & indexatie | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 6 | Interne links | 4 | 5 | 5 | 4 | 4 | 5 | 5 |
| 7 | HTML-semantiek | 5 | 4 | 4 | 4 | 4 | 4 | 4 |
| 8 | Performance | 5 | 4 | 4 | 5 | 4 | 4 | 5 |
| 9 | Styling & layout | 4 | 3 | 3 | 4 | 3 | 3 | 4 |
| 10 | Hosting/deploy | 4 | 3 | 3 | 3 | 4 | 3 | 3 |
| | **Gemiddeld** | **4,4** | **3,9** | **4,0** | **4,0** | **4,0** | **3,9** | **4,1** |

### Kerngetallen

| Kengetal | holland | breda | antwerpen | brabant | gelderland | groningen | limburg |
|---|---|---|---|---|---|---|---|
| HTML-pagina's (indexeerbaar + 404) | 181 | 118 | 125 | 131 | 142 | 121 | 128 |
| Gem. HTML-grootte (raw / gzip) | 47,0 / 10,6 KB | 69,6 / ±14 KB | 68,4 / 14,2 KB | 44,1 / ±10 KB | 44,6 / 10,4 KB | 69,8 / ±14,5 KB | ±45 / ±10 KB |
| Inline CSS per pagina | 16.952 B | 31.434 B | 31.168 B | 16.952 B | 16.952 B | 31.437 B | 16.952 B |
| Externe stylesheets | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| JS totaal (raw / gzip) | 12,2 / 4,8 KB | 15,5 / 5,0 KB | 15,5 / 6,0 KB | 12,2 / 4,3 KB | 12,2 / 4,8 KB | 15,5 / 6,0 KB | 12,2 / 3,9 KB |
| Third-party scripts | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Font | 1 variabel woff2, 22,6 KB, `optional` | 2 woff2, `optional` | 2 woff2 (36 + 23 KB), `optional` | 1 woff2 22,6 KB, `optional` | 1 woff2, `optional` | 2 woff2, `optional` | 1 woff2, `optional` |
| JSON-LD @types (blokken) | 12 (521) | 12 (349) | 12 (342) | 12 (363) | 12 (397) | 12 (331) | 12 (354) |
| FAQPage-blokken | 151 | 84 | 90 | 101 | 112 | 87 | 98 |
| Max klikdiepte (alle links) | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Wezen | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Pagina's met ≠ 1 H1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| img zonder alt | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Unieke titles / descriptions | 100 % / 100 % | 100 % / 100 % | 100 % / 100 % | 100 % / 100 % | 100 % / 100 % | 100 % / 100 % | 100 % / 100 % |
| Title-lengte (min–max) | 25–60 | 23–60 | 27–60 | 25–60 | 28–60 | 27–60 | ≤60 |
| Description-lengte (min–max) | 115–155 | 100–155 | 104–158 | 115–155 | 118–155 | 104–155 | 115–160 |
| Sitemap-URL's / unieke lastmod | 180 / **1** | 117 / **1** | 124 / **1** | 130 / **1** | 141 / **1** | 120 / **1** | 127 / **1** |
| Article dateModified < datePublished | 23/23 | gelijk (bulk) | gelijk (bulk) | gelijk (bulk) | 23/23 | gelijk (bulk) | 23/23 |
| IndexNow-sleutel / ping-code | ja / **nee** | ja / nee | ja / nee | ja / nee | ja / nee | ja / nee | ja / nee |
| RSS/Atom | nee | nee | nee | nee | nee | nee | nee |
| Dark mode / `:focus-visible` | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee |
| Commits (waarvan nummerwissels) | 11 (7) | 9 (7) | 23 (11) | 11 (7) | 9 (6) | 9 (7) | 1 (0) |

### Detailmatrix per checklistpunt

**1. Stack & rendering.** Alle zeven: 100 % pre-rendered HTML, nul hydration, geen framework in de browser. JS is progressive enhancement (`defer`, onderaan `<body>`): scroll-reveal, menu, service worker en een eigen prefetch-router die `<main>`/header/footer vervangt en `title`/`description`/`canonical`/`og:url` synct, maar niet de JSON-LD (`lachgasantwerpen/js/nav.js:44-68`). Familie A heeft de generator in de repo; familie B niet (niet reproduceerbaar).

**2. URL-architectuur.** Overal lowercase-koppelteken-slugs, maximaal 2 segmenten, map-per-pagina met trailing slash, `vercel.json` `"trailingSlash": true` (308 van `/x` naar `/x/`), absolute self-referencing canonicals op 100 % van de indexeerbare pagina's die 1-op-1 gelijk zijn aan de sitemap-`<loc>`. Geen paginering (hubs tonen alles). `404.html` met `noindex, follow`, buiten de sitemap. Nergens een redirect-laag (`redirects`/`_redirects`/`cleanUrls` ontbreken). Familie A splitst hub- en detail-URL's over twee naamruimten (`/bezorggebied/<regio>/` vs `/lachgas-bezorgen/<plaats>/`), zodat de URL-boom niet de breadcrumb-hiërarchie volgt (`lachgasholland/_build/pages.py:6`).

**3. Head & meta.** Vaste head-volgorde op alle pagina's: charset → viewport → title → description → robots → canonical → hreflang (self + x-default) → og:* (incl. `image:alt`) → twitter:* → theme-color → geo.* → icons → manifest → preload font → `<style>` → JSON-LD. Afgedwongen door `seo_master.py:300-345` (`build_head`): titels worden op 60 tekens getrimd (`seo_master.py:230-252`), descriptions op 160 (`trim_desc`, r. 88-100). Alle sites hebben 100 % unieke titles en descriptions. Zwak: één sitebrede `og:image` voor alle pagina's (6 van 7), self-hreflang op ééntalige sites, legacy `geo.*`-meta's, 25–35 titels zonder merknaam in familie A.

**4. Structured data.** Twaalf types per site, losse `<script>`-blokken zonder `@graph`, gekoppeld via twee `@id`'s (`#business`, `#website`) die alleen op de homepage gedefinieerd worden en elders als ingebedde subset herhaald worden. Overal: BreadcrumbList (HTML en JSON-LD 1-op-1), FAQPage op 65–85 % van de pagina's, Service, Article, ItemList, Product zonder `offers`, LocalBusiness zonder straatadres met 24/7-openingstijden en `sameAs` naar een chat-URL. Geen AggregateRating/Review (goed). Datumfouten in alle zeven: zie §4.

**5. Crawl & indexatie.** `robots.txt` overal identiek (`Allow: /` + sitemap). Eén `sitemap.xml` (geen index) met `lastmod`, `changefreq` en `priority`; lastmod is op elke site één constante (`2026-10-18`) die niet bij latere commits is bijgewerkt. Sitemap = exact de indexeerbare set (0 afwijkingen op alle zeven). HTML-sitemap aanwezig. IndexNow-sleutelbestand aanwezig, maar in geen enkele repo ping-code. Geen RSS/Atom. `llms.txt` + `llms-full.txt` (de laatste met menu/footer-ruis in familie B).

**6. Interne links.** Overal: max klikdiepte 2, 0 wezen, 0 kapotte links, hub → 100 % van de kinderen, kind → hub + 3–9 siblings, breadcrumbs HTML+JSON-LD, 0–3 generieke ankers op ~10.000. Keerzijde: 65–80 sitewide links per pagina (34-link mobiel menu altijd in de DOM + 25–38 footerlinks) tegenover 13–15 contextuele links; enkele hubs alleen via breadcrumbs bereikbaar (`/service/` in holland: 13 inlinks tegenover 181 voor `/privacy/`). Groningen zet `rel="nofollow"` op alle 39 links naar autoritaire bronnen.

**7. HTML-semantiek.** Exact één H1 op 100 % van de pagina's, 0 overgeslagen kopniveaus (behalve 404 in familie B: H1 → H3 footer), `header`/`main`/`footer` precies één keer, meerdere `<nav>` met `aria-label`, skip-link overal, `<details>` voor FAQ en mobiel menu (werkt zonder JS), `aria-current` op breadcrumb en nav. Ontbreekt overal: `<article>`, `<time>`, `th scope`. Antwerpen heeft een template-bug waardoor op 58 pagina's twee menu-items actief lijken; gelderland herhaalt op 71 pagina's de H1 letterlijk als H2.

**8. Performance.** Alle CSS inline (familie A 17 KB, familie B 31 KB per pagina; 2,2–3,9 MB over de site, niet cachebaar als bestand). Self-hosted, gesubsette woff2 met `preload` + `font-display: optional` (geen CLS, maar ook geen metric-matched fallback). Alle `<img>` met `width`/`height`, `loading="lazy"`, `decoding="async"`; WebP, geen AVIF, `srcset` alleen op 2–3 productfoto's; hero zonder srcset (familie B). Nul third-party. Speculation Rules worden in de generator toegevoegd en in de speed-pas weer verwijderd (`apply_speed.py:43`), ten gunste van de eigen router. Service worker met build-hash.

**9. Styling & layout.** Familie A: 14 custom properties in `:root`, component-klassen, mobile-first (11 `min-width` vs 1 `max-width`), `clamp()`-typografie; maar 541–795 inline `style=""`-attributen en 55 hardcoded kleuren (gelderland). Familie B: Tailwind-utilities zonder eigen custom properties (alleen `--tw-*`). Overal: geen dark mode, geen `:focus-visible`, `scroll-behavior: smooth` niet achter `prefers-reduced-motion`, enkele contrasten op het randje (`--muted` 4,6:1; breadcrumb 3,8:1 in groningen; `text-gray-400` ≈ 2,9:1 in breda).

**10. Hosting/deploy.** Overal dezelfde `vercel.json`: HSTS (zonder `preload`), nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, CSP met alleen `frame-ancestors`/`base-uri`/`object-src`; cache 1 jaar voor fonts, 30 dagen voor assets, 1 dag voor JS, `no-cache` voor `sw.js`; geen regel voor HTML/sitemap/robots. GitHub-Pages-restanten (`CNAME`, `.nojekyll`) naast Vercel. Geen CI, geen tests, gebouwde output gecommit. 6–11 van de commits per repo zijn telefoonnummer-wissels over 120–190 gegenereerde bestanden, omdat het nummer hard in HTML, JSON-LD, `llms*.txt` en manifest staat.

---

## 3. Patronen die in alle of de meeste repos terugkomen

1. **Statische HTML, nul hydration, nul third-party.** Elke pagina is compleet in de eerste response; JS is optioneel. Gemiddeld 10–14 KB gzip per pagina.
2. **Vlakke boom met volledige verbinding.** Elke pagina staat op maximaal 2 klikken van de home, elke hub linkt al zijn kinderen, elk kind linkt terug en naar siblings, er zijn geen wezen en geen kapotte links. Breadcrumbs in HTML én JSON-LD.
3. **Mechanisch afgedwongen metadata.** Eén nabewerkingsscript herbouwt elke `<head>` in vaste volgorde, trimt titels op 60 en descriptions op 160 en garandeert zo 100 % unieke, maatvaste titels en descriptions.
4. **Self-referencing canonicals = sitemap = bestanden.** Nul afwijkingen op zeven sites, trailing slash overal consequent.
5. **Semantische basis als standaard.** Eén H1, geen kopsprongen, landmarks, skip-link, `aria-current`, `<details>` zonder JS, alt op alle afbeeldingen.
6. **Font- en CSS-strategie gericht op LCP en CLS.** Inline CSS, één gepreload gesubset woff2 met `optional`, afbeeldingen met vaste dimensies, LCP is meestal tekst.
7. **Dezelfde zwaktes zeven keer.** Bulk-lastmod, FAQPage-overkill, datumbugs, ongebruikte IndexNow-sleutel, geen feed, geen redirect-laag, geen dark mode, geen `:focus-visible`, zwakke CSP, configwaarden (telefoonnummer) hard in 120+ bestanden.

## 4. Fouten die in de code zijn aangetoond

| Fout | Waar | Bewijs |
|---|---|---|
| `Article.dateModified` ligt vóór `datePublished` op alle 23 artikelen | holland, gelderland, limburg | `_build/common.py:138` bindt default-argument `modified=TODAY` aan `TODAY = "2026-10-03"` (`common.py:34`) vóór `configure()` de datum overschrijft; `seo_master.fix_schema` repareert alleen WebPage-types (`seo_master.py:191`) |
| Drie verschillende hardgecodeerde "vandaag"-datums | familie A | `common.py:34`, `content/_site.py:27`, `master/seo_master.py:21` |
| Alle `Article`-datums identiek (`2026-10-02`) ondanks latere wijzigingen | breda, antwerpen, groningen, brabant | git-historie: artikelen toegevoegd 10-05/06, herzien 10-19, datum ongewijzigd |
| Sitemap-`lastmod` één constante voor alle URL's, ouder dan latere commits | alle zeven | `seo_master.py:449` (`re.sub` naar `TODAY`); 3–7 commits daarna zonder sitemap-update |
| `#business` wisselt van `@type` (LocalBusiness op home, Organization in `Article.publisher`) | alle zeven | o.a. `lachgasantwerpen/lachgas-informatie/*/index.html` regel 4 |
| Actieve-staat-bug in desktopmenu op 58 pagina's | antwerpen | diff tussen headervarianten `e1b52181` en `330ad07b` |
| Ongebruikt 155 KB PNG in de root publiek gedeployed | brabant | `IMG_5577.png`, 0 referenties |
| 784 KB JPG als `Product.image` terwijl WebP bestaat | antwerpen | `assets/img/*-infographic.jpg` |
| `rel="nofollow"` op alle links naar overheids-/kennisbronnen | groningen | 39 externe bronlinks |
| Build verwijst naar 5 ontbrekende bestanden/mappen | familie A | `levertijd.py` (`basis_fix/`, `levertijd_img/`), `apply_speed.py` (`site-template.js`), `seo_master.py` (`sites.py`), `BRIEF.md` |
| Dode cache-regels voor niet-bestaande mappen `/img/`, `/images/` | familie A | `vercel.json` |
| `scroll-behavior: smooth` zonder `prefers-reduced-motion`-gate | alle zeven | `site.css:4` resp. Tailwind-blok |

## 5. Unieke sterke punten per repo

- **holland:** de meest complete "master-standaard": idempotente nabewerking met markers (`/*master*/…/*master-end*/`), `Service.areaServed` met `GeoCoordinates` per plaats, CTA-contrast door de master verhoogd naar AA (`seo_master.py:50`), 0 pagina's < 300 woorden behalve 404.
- **breda:** hero-afbeelding wordt op mobiel via een `<picture>`-truc (lege SVG-source < 1024 px) niet gedownload; 100 % bidirectionele hubs met 5–9 sibling-links.
- **antwerpen:** langste git-historie (23 commits, 3 auteurs) die de evolutie laat zien van Tailwind-CDN + Google Fonts naar inline-CSS + self-hosted fonts + router + SW; FAQ-markup 1-op-1 met zichtbare `<details>` (331 = 331); `nofollow` alleen extern.
- **brabant:** titelconventie in code afgedwongen (`seo_master.py:94-105`, `244-269`) en reproduceerbare build; SW met build-hash en max 150 pagina's.
- **gelderland:** `@id`-graaf met 123 verwijzingen naar `#business`; FAQ-schema 1-op-1 met zichtbare vragen; hub ↔ detail ↔ nearby-koppelingen; 4,6 contextuele links per artikel.
- **groningen:** vrijwel optimale linkgraaf (92 pagina's op diepte 1), `role="dialog"`/`aria-modal`/`aria-expanded` op het menu, canonical = og:url = hreflang = sitemap op 120/120.
- **limburg:** schoonste single-commit-oplevering (generator + content + output in één commit), body op systeemfont met webfont alleen voor koppen (nul font-CLS), reduced-motion in CSS én JS.

## 6. Zwakke punten die het template moet vermijden

1. Sitemap-`lastmod` als constante; `priority`/`changefreq` meesturen (Google negeert ze).
2. `datePublished`/`dateModified` als hardgecodeerde constanten; `dateModified` vóór `datePublished`.
3. `FAQPage`/`HowTo`/`Product`-zonder-offers/`LocalBusiness`-zonder-adres: markup zonder rendement of met risico op "misleading structured data".
4. Losse JSON-LD-blokken zonder `@graph`; entiteiten die op detailpagina's als subset herhaald worden en van `@type` wisselen.
5. 17–31 KB CSS inline op elke pagina zonder enige cachebare laag; 4.900 inline SVG's zonder `aria-hidden`; 8–10 KB verborgen menu-DOM per pagina.
6. 65–80 boilerplate-links per pagina tegenover 13–15 contextuele; hubs die alleen via de footer bereikbaar zijn.
7. IndexNow-sleutel zonder ping; geen feed; geen redirect-laag; geen CI.
8. Configwaarden (telefoonnummer, datums, kleuren) hard in honderden gegenereerde bestanden.
9. Eén `og:image` voor de hele site; `Article.author` als Organization zonder eigen pagina (zwak E-E-A-T-signaal).
10. Geen dark mode, geen `:focus-visible`, `scroll-behavior: smooth` zonder motion-gate, contrasten op het randje, `size-adjust`-fallback ontbreekt.
11. CSP zonder `default-src`/`script-src`; HSTS zonder `preload`; geen Cache-Control voor HTML/sitemap/robots; GitHub-Pages-restanten naast Vercel.
12. Generator buiten de repo (familie B): elke wijziging is een 125-bestanden-edit.

---

## 7. Fase 2: synthese. Wat verklaart de snelle indexatie en stijging?

### 7.1 Wat de code aantoont (feiten)

- **Volledige, kleine HTML-responses.** Elke URL levert 10–14 KB gzip complete HTML zonder render-blocking externe resources. Googlebot hoeft niets te renderen om alle inhoud, links, canonicals en structured data te zien. Dit is het sterkst gedocumenteerde crawl-/indexatievoordeel: Google's JavaScript-SEO-documentatie adviseert canonical, robots en inhoud in de initiële HTML te zetten omdat canonicalisatie vóór én na rendering gebeurt (Search Central "JavaScript SEO basics", update dec. 2025: canonical in de originele HTML moet gelijk zijn aan die na rendering).
- **Volledige ontdekbaarheid in één hop.** Max klikdiepte 2, 0 wezen, sitemap = canonicals = bestanden, HTML-sitemap, 100 % hub → kind → hub. Elke nieuwe pagina is binnen één crawl van de homepage of de sitemap vindbaar.
- **Geen tegenstrijdige signalen.** Self-canonical, `og:url`, hreflang en sitemap-`loc` zijn byte-identiek; trailing slash is afgedwongen op hostingniveau; 404 is `noindex` en buiten de sitemap. Er is dus geen duplicate-content-ruis en geen "canonical gekozen door Google"-situatie.
- **Unieke, maatvaste titels en descriptions op 100 % van de pagina's,** mechanisch afgedwongen. Dat levert geen rankingbonus op, maar voorkomt wel dat Google titels herschrijft en vergroot de kans op een bruikbare snippet (Search Central "Title links": beschrijvend en beknopt, geen boilerplate; "Snippets": unieke description per pagina, geen vaste lengte).
- **Consistente semantiek** (één H1, kopvolgorde, landmarks, breadcrumbs in HTML en JSON-LD) die Google's parsers precies geven wat ze verwachten.

### 7.2 Wat plausibel bijdraagt (hypothese, niet uit de code af te leiden)

- **Veel pagina's tegelijk met een volledig verbonden linkgraaf** (118–181 pagina's in één deploy) kan de ontdekkingssnelheid verhogen: één crawl van de homepage of sitemap levert de hele site. De keerzijde (dunne, sjabloonmatige pagina's) valt onder Google's "scaled content abuse"-beleid; de analisten maten 600–1.300 woorden per pagina en unieke FAQ's, dus de sites zijn niet "dun" in de klassieke zin. Hoe Google de kwaliteit weegt, is uit de code niet af te leiden.
- **Hoge snelheid (LCP = tekst, CLS ≈ 0)** draagt bij aan page experience, maar Google stelt zelf dat Core Web Vitals geen zwaar rankingsignaal zijn (Search Central, "page experience", april 2023: geen aparte "page experience"-ranking; CWV zijn één van vele signalen). Het effect op indexatiesnelheid is indirect (crawlbudget: snelle, kleine responses = meer URL's per crawl-sessie).
- **IndexNow** kan in deze repos geen rol hebben gespeeld: de sleutel staat er, maar nergens is een ping geïmplementeerd. Google doet bovendien niet mee aan IndexNow (stand 2026). Als de maker extern pingde, is dat niet in de repo zichtbaar.
- **`llms.txt`** speelt voor Google geen rol (John Mueller, 2025–2026: Google gebruikt het niet; "purely speculative").
- **Structured data** verklaart de stijging niet: FAQPage toont Google sinds mei 2026 voor niemand meer, Service en ItemList leveren geen rich result, Product mist `offers`, LocalBusiness mist een adres. De schema's hebben hooguit bijgedragen aan entiteitsbegrip (Organization/WebSite/Breadcrumb).
- **De eigen prefetch-router en service worker** verbeteren de ervaring van terugkerende bezoekers, maar zijn voor Googlebot onzichtbaar (Googlebot voert geen soft navigation uit en registreert geen SW).

### 7.3 Toetsing aan Google Search Central (stand november 2026)

De documentatie zelf kon vanuit deze omgeving niet rechtstreeks worden opgehaald (netwerkbeleid blokkeert `developers.google.com`); de toetsing is gedaan via gerichte zoekopdrachten met citaten uit de officiële pagina's en de "Latest documentation updates"-pagina. Waar een bewering alleen uit secundaire bronnen komt, staat dat erbij.

| Onderwerp | Wat Google zegt | Repos | Template |
|---|---|---|---|
| **FAQ rich results** | Updates-pagina: deprecatie-notitie mei 2026; FAQ rich results verdwijnen vanaf 7 mei 2026, Search Console-rapport en Rich Results Test-ondersteuning vervallen juni 2026, API augustus 2026. (Al sinds aug. 2023 alleen voor overheids-/gezondheidssites.) | 84–151 FAQPage-blokken per site: dode markup | Geen FAQPage; de check faalt de build erop |
| **HowTo** | Verwijderd uit de documentatie sept. 2023; wordt niet meer getoond | Niet aanwezig | Niet aanwezig; check faalt erop |
| **Sitelinks search box (SearchAction)** | Verwijderd per 21 nov. 2024; markup mag blijven maar wordt genegeerd | Correct weggelaten | Weggelaten |
| **Practice problems** e.a. niche-types | Deprecatie nov. 2025 → jan. 2026 | n.v.t. | n.v.t. |
| **Article** | Geen verplichte properties; aanbevolen: `headline`, `image` (liefst 16:9, 4:3, 1:1), `datePublished`, `dateModified`, `author` met `name` en `url` | Eén generieke image; datums fout; author = Organization zonder url | Drie beeldverhoudingen, echte datums uit frontmatter, `Person` met eigen pagina (`url`, `sameAs`) |
| **Breadcrumb** | `itemListElement` met `position`, `name`, `item` | Correct | Correct, 1-op-1 met HTML-breadcrumb (check) |
| **Organization** | Documentatie nov. 2023 samengevoegd met Logo; aanbevolen: `name`, `url`, `logo`, `sameAs`, contactgegevens, `address` | LocalBusiness zonder adres, `sameAs` naar chat-URL | `Organization` met `legalName`, `logo` (ImageObject), `address`, `email`, `telephone`, `sameAs` naar echte profielen; LocalBusiness alleen als er een fysiek adres is (niet standaard) |
| **ProfilePage** | Nov. 2023 geïntroduceerd; `mainEntity` = Person; `dateModified` aanbevolen | Geen auteurspagina's | ProfilePage + Person per auteur |
| **Sitemaps** | `priority` en `changefreq` worden niet gebruikt; `lastmod` alleen als die consistent en verifieerbaar klopt; bij twijfel weglaten; alleen canonieke URL's | `priority`/`changefreq` wel, `lastmod` één constante | Alleen `loc` + `lastmod` uit echte `dateModified`; hubs = max van kinderen; sitemap-index; image-extensie |
| **Canonicals** | Absoluut, één per pagina, consistent vóór en na rendering, in de initiële HTML | Correct | Correct, plus build-check op 200 en op gelijkheid met `og:url` en sitemap |
| **Title links** | Beschrijvend en beknopt, geen boilerplate, merk voor of achter met scheidingsteken; geen harde lengtelimiet (afgekapt op schermbreedte) | Conform; 25–35 titels zonder merk | `titel | sitenaam`; configureerbare lengtegrens (standaard 50–60) als praktische proxy voor afkapping |
| **Meta description** | Geen lengtelimiet, wel uniek per pagina en geen keyword-strings | Conform | Conform; grens 120–160 configureerbaar |
| **Core Web Vitals** | LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 (75e percentiel); INP verving FID op 12 maart 2024; CWV zijn één signaal binnen de kernsystemen, geen aparte ranking | Vrijwel zeker goed (tekst-LCP, geen CLS); niet gemeten | Lab: LCP, CLS en TBT met Lighthouse CI afgedwongen (zie VERGELIJKING.md) |
| **Spam policies** | Cloaking, doorway-pagina's, scaled content abuse (ongeacht productiemethode), site reputation abuse (EEA-wijziging aug. 2026), hidden text, expired domain abuse | Sjabloonmatige plaatspagina's balanceren op de grens van "scaled content"; geen cloaking/hidden text | Geen automatische archief-/tagpagina's; elke pagina heeft een redactionele bron (Markdown) |
| **JavaScript SEO** | Canonical/robots/noindex in de initiële HTML; noindex kan rendering blokkeren | Alles in de initiële HTML | Idem, en 0 KB JS |
| **IndexNow** | Google doet niet mee (stand 2026); Bing, Yandex, Naver, Seznam wel | Sleutel zonder ping | Sleutel + ping na deploy (Bing c.s.); voor Google blijft sitemap-lastmod het signaal |
| **llms.txt** | Google gebruikt het niet (Mueller, jul. 2026); hooguit nuttig voor agents die al op de site zijn | Aanwezig | Optioneel (`site.llmsTxt`), standaard aan maar zonder verwachtingen |

### 7.4 Conclusie voor het template

De snelle indexatie laat zich het best verklaren door de combinatie van (a) complete, kleine, JS-vrije HTML, (b) een volledig verbonden, vlakke linkgraaf met sitemap die exact de canonieke set dekt, en (c) nul tegenstrijdige signalen. Structured data, IndexNow en `llms.txt` dragen daar aantoonbaar niet aan bij. Het template behoudt daarom (a), (b) en (c) als harde, automatisch gecontroleerde garanties en repareert de twaalf aangetoonde fouten: echte datums en lastmod, één `@graph` met stabiele `@id`'s en alleen nog ondersteunde types, auteurs als Person met eigen pagina, redirect-laag, IndexNow-ping, feed, cachebare assets, dark mode en focus-stijlen, strikte CSP en één configbestand voor alle sitegegevens.
