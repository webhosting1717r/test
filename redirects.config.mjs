/**
 * 301-redirectmap. Voeg hier oude → nieuwe paden toe als een slug verandert.
 * `npm run redirects` schrijft deze map naar vercel.json, public/_redirects (Netlify
 * en Cloudflare Pages) en de SEO-check controleert dat alles synchroon is.
 * Regels: paden met leading én trailing slash; doel bestaat in de build.
 */
export default [
  // { from: '/oude-hub/oud-artikel/', to: '/basiskennis/wat-is-het-onderwerp-een-eerste-kennismaking/' },
];
