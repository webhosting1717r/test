# VERGELIJKING.md: het template tegenover de zeven referentie-repos

Per checklistpunt uit fase 1: hoe het template scoort, hoe elk van de zeven repos scoort, en waarom het template beter is. Repo-scores komen uit de analyses (1–5, zie ANALYSE.md). Template-cijfers zijn gemeten op de gebouwde placeholder-site (21 pagina's, waarvan 20 indexeerbaar) met `scripts/seo-check.mjs`, Lighthouse CI 13.6 (mobiele emulatie, 3 runs, mediaan) en een meetscript over `dist/`.

## Kerngetallen naast elkaar

| Kengetal | Template | holland | breda | antwerpen | brabant | gelderland | groningen | limburg |
|---|---|---|---|---|---|---|---|---|
| Client-side JS (bytes) | **0** | 12.173 | 15.473 | 15.473 | 12.173 | 12.173 | 15.473 | 12.173 |
| Third-party scripts | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Gem. HTML raw / gzip | **29,0 / 7,4 KB** | 47,0 / 10,6 | 69,6 / ±14 | 68,4 / 14,2 | 44,1 / ±10 | 44,6 / 10,4 | 69,8 / ±14,5 | ±45 / ±10 |
| Inline CSS per pagina | **12,9 KB** | 17,0 KB | 31,4 KB | 31,2 KB | 17,0 KB | 17,0 KB | 31,4 KB | 17,0 KB |
| Webfont (bytes), display, fallback-metrics | 28.700, optional, **ja** | 22.580, optional, nee | 2 bestanden, optional, nee | 59.772, optional, nee | 22.580, optional, nee | 22.580, optional, nee | 2 bestanden, optional, nee | 22.580, optional, nee |
| Beeldformaten | **AVIF + WebP + JPG, srcset op 100 %** | WebP, srcset op 3 | WebP, srcset op 2 | WebP, srcset op 2 | WebP | WebP | WebP | WebP |
| `fetchpriority="high"` op LCP-beeld | 1 per pagina met beeld | 0 | 1 (home) | 1 (home) | 0 | 0 | 1 (home) | 0 |
| JSON-LD: blokken per pagina / @graph / @id-koppeling | **1 / ja / 100 % gecontroleerd** | 2,9 / nee / deels | 3 / nee / deels | 2,8 / nee / deels | 2,8 / nee / deels | 2,8 / nee / deels | 2,7 / nee / deels | 2,8 / nee / deels |
| Gedeprecieerde types (FAQPage/HowTo) | **0** | 151 | 84 | 90 | 101 | 112 | 87 | 98 |
| Article-datums correct | **ja (build faalt anders)** | nee (23×) | bulk | bulk | bulk | nee (23×) | bulk | nee (23×) |
| Sitemap: unieke lastmod-waarden | **13 van 20 (echte datums)** | 1 van 180 | 1 van 117 | 1 van 124 | 1 van 130 | 1 van 141 | 1 van 120 | 1 van 127 |
| priority/changefreq in sitemap | nee | ja | ja | ja | ja | ja | ja | ja |
| Sitemap-index / image-extensie | ja / ja | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee |
| RSS | **ja** | nee | nee | nee | nee | nee | nee | nee |
| IndexNow: sleutel / ping | ja / **ja** | ja / nee | ja / nee | ja / nee | ja / nee | ja / nee | ja / nee | ja / nee |
| Redirect-laag (301) | **ja, gecontroleerd** | nee | nee | nee | nee | nee | nee | nee |
| Max klikdiepte / wezen | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 | 2 / 0 |
| Interne links per pagina (gem.) | **29** | 99 | 66 | 70 | 82 | 76 | 66 | ±70 |
| ≠ 1 H1 / img zonder alt | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| `<article>` / `<time>` / `aria-hidden` op SVG | ja / ja / ja | nee / nee / ja | nee / nee / ? | nee / nee / nee (4.890) | nee / nee / ? | nee / nee / 20 % | nee / nee / ? | nee / nee / ? |
| Dark mode / `:focus-visible` / smooth-scroll gegate | **ja / ja / ja** | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee |
| CSP met `default-src`/`script-src` | **ja** | nee | nee | nee | nee | nee | nee | nee |
| HSTS preload / Cache-Control voor HTML | ja / ja | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee | nee / nee |
| Build-time SEO-check / Lighthouse CI / CI | **ja / ja / ja** | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee | nee / nee / nee |
| Generator reproduceerbaar in repo | ja | ja (met 5 ontbrekende bestanden) | **nee** | **nee** | ja | ja | **nee** | ja |
| Configwaarden op één plek | **ja** | nee (3 datums, nummer in 185 bestanden) | nee | nee | nee | nee | nee | nee |

Niet vergelijkbaar: woorden per pagina (template bevat placeholder-tekst, gem. 317 woorden in `<main>`; de repos 600–1.300). De structuur, niet de inhoud, is het onderwerp van deze vergelijking.

## Lighthouse (template, mobiel, mediaan van 3 runs)

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Gewicht |
|---|:-:|:-:|:-:|:-:|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 0.83 s | 0.000 | 0 ms | 0.83 s | 49 KB |
| `/basiskennis/` | 100 | 100 | 100 | 100 | 1.27 s | 0.000 | 0 ms | 0.82 s | 49 KB |
| `/basiskennis/wat-is-het-onderwerp-een-eerste-kennismaking/` | 100 | 100 | 100 | 100 | 1.27 s | 0.000 | 0 ms | 0.84 s | 48 KB |
| `/auteurs/anna-jansen/` | 100 | 100 | 100 | 100 | 0.83 s | 0.000 | 0 ms | 0.83 s | 54 KB |
| `/sitemap/` | 100 | 100 | 100 | 100 | 0.84 s | 0.000 | 0 ms | 0.84 s | 36 KB |
| `/contact/` | 100 | 100 | 100 | 100 | 0.82 s | 0.000 | 0 ms | 0.82 s | 36 KB |

Budget (`lighthouserc.cjs`): categorie ≥ 95 (fout), LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms. Lighthouse 13.6, Chrome 153, mobiele emulatie met netwerk-/CPU-throttling, 3 runs per URL, mediaan. Eerste run met `font-display: swap` gaf CLS 0,06–0,09 op tekstzware pagina’s (reflow door regelafbreking na font-swap); na overschakelen op `optional` is CLS 0 op alle pagina’s.

De zeven repos zijn niet met Lighthouse gemeten (geen live URL in deze omgeving); op basis van hun opbouw (tekst-LCP, inline CSS, `optional`-font, 10–14 KB gzip HTML) zouden zij vergelijkbaar scoren op Performance. Het verschil zit in Best Practices (CSP, geen console-fouten door ontbrekende bestanden) en Accessibility (focusstijlen, contrasten op het randje, `aria-hidden`), en vooral in het feit dat het template deze scores bij elke build afdwingt.

## Per checklistpunt

### 1. Stack & rendering
- **Template:** Astro 7 static, 0 bytes client-JS, geen service worker, geen router. Alles wat Googlebot ziet is de HTML; er is geen tweede pad (soft navigation) dat uit de pas kan lopen met de server-HTML.
- **Repos (4–5):** 100 % pre-rendered, maar wel 12–15 KB JS (router + SW) die voor crawlers niets toevoegt en voor bezoekers SWR-staleness introduceert; familie B heeft de generator niet in de repo.
- **Waarom beter:** gelijkwaardige rendering met minder bewegende delen; reproduceerbaar via `npm run build`; getypeerde content (Zod) in plaats van Python-dicts met drie regex-nabewerkingen.

### 2. URL-architectuur
- **Template:** `/hub/artikel/`, trailing slash afgedwongen in Astro én hosting, slugregels in het schema, URL = breadcrumb, botsingsdetectie, 301-redirectmap voor Vercel/Netlify/Cloudflare met synchronisatiecheck, 404 noindex.
- **Repos (4–5):** zelfde slug- en slash-discipline, 100 % self-canonicals; maar geen redirect-laag en in familie A twee naamruimten voor hub en detail.
- **Waarom beter:** redirects zijn er vanaf dag één (slugwijzigingen zijn in de repos onmogelijk zonder 404's), en de URL-boom volgt de inhoudelijke hiërarchie.

### 3. Head & meta
- **Template:** één component; title/description uniek en binnen configureerbare grenzen (build faalt); canonical = og:url = sitemap (gecontroleerd); pagina-specifieke og:image (1200×630); hreflang alleen bij echte alternates; theme-color light/dark; geen ruis (`geo.*`, self-hreflang).
- **Repos (4–5):** vrijwel foutloos en consistent, maar één og:image voor de hele site, self-hreflang en geo-meta's als ballast, 25–35 titels zonder merk in familie A.
- **Waarom beter:** zelfde discipline, nu afgedwongen door een check in plaats van een nabewerkingsscript, plus betere social previews.

### 4. Structured data
- **Template:** één `@graph` per pagina met Organization, WebSite, WebPage-subtype, BreadcrumbList en per type Article + Person, CollectionPage + ItemList of ProfilePage + Person; alle `@id`-verwijzingen lossen op (check); echte datums (check: dateModified ≥ datePublished); Article-beelden in 16:9/4:3/1:1; auteur als Person met eigen URL en sameAs; geen gedeprecieerde types (check faalt).
- **Repos (3–4):** 12 types in losse blokken; `#business` wisselt van type; FAQPage op 65–85 % van de pagina's (per mei 2026 nergens meer getoond); LocalBusiness zonder adres; Product zonder offers; Article-datums fout of bulk; author = Organization.
- **Waarom beter:** alleen markup die Google (nov. 2026) ondersteunt, met een consistente entiteitsgraaf en E-E-A-T-signalen (ProfilePage/Person), en zonder de datumfouten.

### 5. Crawl & indexatie
- **Template:** sitemap-index → pagina-sitemap met alleen indexeerbare canonieke URL's, lastmod uit echte `dateModified` (hubs = max van kinderen), image-extensie; robots.txt; RSS; IndexNow-sleutel uit env én ping na deploy; llms.txt optioneel; check op noindex-in-sitemap, ontbrekende pagina's, ongeldige/toekomstige lastmod.
- **Repos (4):** sitemap exact gelijk aan indexeerbare set (sterk), maar lastmod één constante (door Google genegeerd), priority/changefreq (genegeerd), IndexNow-sleutel zonder ping, geen feed.
- **Waarom beter:** lastmod is bruikbaar als crawl-signaal, IndexNow doet wat de sleutel belooft, en de feed geeft een extra ontdekkingspad.

### 6. Interne links
- **Template:** breadcrumbs HTML = JSON-LD (check), hub → alle artikelen, artikel → hub/auteur/gerelateerd, footer, HTML-sitemap; 29 links per pagina waarvan het merendeel contextueel; klikdiepte en wezen per build gecontroleerd.
- **Repos (4–5):** zelfde volledige graaf (diepte 2, 0 wezen), maar 65–99 links per pagina waarvan 50–80 boilerplate (mobiel menu in DOM + grote footer); sommige hubs alleen via footer.
- **Waarom beter:** gelijke bereikbaarheid met minder linkverdunning, en de garanties zijn geautomatiseerd.

### 7. HTML-semantiek
- **Template:** één H1 (check), kopvolgorde (waarschuwing), `header`/`nav[aria-label]`/`main`/`article`/`aside`/`footer`, skip-link, `<time datetime>`, `aria-current`, SVG's `aria-hidden` + `focusable="false"`, alt + width/height op alle `img` (check).
- **Repos (4–5):** één H1, landmarks, skip-link, `<details>` zonder JS; maar geen `<article>`/`<time>`, `th` zonder scope, 4.890 SVG's zonder `aria-hidden` (antwerpen), actieve-staat-bug (antwerpen), H1 herhaald als H2 (gelderland).
- **Waarom beter:** vollediger semantisch model en geen van de gevonden bugs.

### 8. Performance
- **Template:** Lighthouse Performance 100 (zie tabel), LCP 0,8–1,3 s, CLS 0, TBT 0 ms; 12,9 KB inline CSS; één gepreload gesubset variabel font (28,7 KB) met `optional` én metric-fallback; AVIF/WebP met srcset op elk beeld, `priority` op het LCP-beeld; Speculation Rules (0 KB JS).
- **Repos (4–5):** zeer snel (tekst-LCP, inline CSS, optional-font), maar 17–31 KB CSS per pagina, geen AVIF, srcset op 2–3 beelden, hero zonder srcset, geen fallback-metrics, 12–15 KB JS.
- **Waarom beter:** minder bytes per pagina (7,4 vs 10–14 KB gzip HTML), moderne beeldformaten overal, nul JS, en de budgetten worden door Lighthouse CI bewaakt.

### 9. Styling & layout
- **Template:** tokens als custom properties, dark mode, mobile-first, `clamp()`-typografie, `aspect-ratio` op media, `:focus-visible`, reduced motion incl. smooth scroll, contrast ≥ 4,5:1 in beide modi, geen inline `style`-attributen.
- **Repos (3–4):** familie A tokens + 541–795 inline styles en kleurlekken; familie B Tailwind zonder eigen tokens; nergens dark mode of focus-visible; smooth scroll ongegate; enkele contrasten onder AA (2,9:1, 3,8:1).
- **Waarom beter:** klein, consistent systeem dat zonder aanpassing elk onderwerp draagt en WCAG 2.2 AA-contrast in light én dark haalt.

### 10. Hosting/deploy
- **Template:** `vercel.json`, `netlify.toml` + `_headers`/`_redirects`, `wrangler.toml`; HSTS preload, nosniff, Referrer-Policy, Permissions-Policy, COOP, CSP met `default-src 'self'`; immutable cache voor `/_astro/*`, revalidate voor HTML; CI met typecheck, SEO-check en Lighthouse; IndexNow-workflow na deploy.
- **Repos (3–4):** goede basis-headers op Vercel, maar CSP zonder script-src, HSTS zonder preload, geen HTML-cacheregel, dode cache-regels, GitHub-Pages-restanten, geen CI, output gecommit, 6–11 nummerwissel-commits per repo.
- **Waarom beter:** drie platforms kant-en-klaar, striktere security-headers, en een pijplijn die fouten tegenhoudt vóór ze live gaan.

## Samenvattend

Op de punten waar de referentiesites al sterk waren (volledige HTML, vlakke graaf, canonical-discipline, semantiek, snelheid) evenaart het template ze en maakt het de garanties controleerbaar per build. Op de punten waar alle zeven dezelfde fouten maakten (lastmod, Article-datums, dode FAQ-markup, LocalBusiness zonder adres, ongebruikte IndexNow-sleutel, geen feed, geen redirects, geen dark mode/focus, zwakke CSP, config verspreid over honderden bestanden) is het template aantoonbaar beter, met bewijs in `dist/` en in de uitvoer van `npm run build` en `npm run lighthouse`.
