import type { APIRoute } from 'astro';
import { site } from '@config';
import { indexableRoutes } from '@lib/site';

/** Sitemap-index die naar de pagina-sitemap verwijst; lastmod = recentste wijziging. */
export const GET: APIRoute = async () => {
  const routes = await indexableRoutes();
  const latest = new Date(Math.max(...routes.map((r) => r.lastmod.getTime())));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${site.url}/sitemap-pages.xml</loc>
    <lastmod>${latest.toISOString()}</lastmod>
  </sitemap>
</sitemapindex>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
