# Fonts

`inter-latin-subset.woff2` is een subset van Inter (variable, wght 400–700, Latin + Latin Extended-A + algemene leestekens), gegenereerd met `npm run font:subset` uit `@fontsource-variable/inter`. Inter is gelicentieerd onder de SIL Open Font License 1.1 (zie `LICENSE-Inter.txt`); de licentie moet bij herdistributie van het fontbestand meegeleverd blijven.

Ander font gebruiken: zet het `.woff2`-bestand hier neer, pas `fonts[0].options.variants[0].src` en `name` in `astro.config.mjs` aan en controleer `fallbacks` (metric-matched fallback wordt automatisch berekend).
