import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { site } from '@config';
import { indexableRoutes, absoluteUrl } from '@lib/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Pagina-sitemap: alleen indexeerbare, canonieke URL's; lastmod uit echte dateModified
 * (hubs: max van hub + artikelen). Geen priority/changefreq (Google negeert ze).
 * Artikelbeelden gaan mee als image-sitemap-extensie.
 */
export const GET: APIRoute = async () => {
  const routes = await indexableRoutes();
  const entries: string[] = [];
  for (const r of routes) {
    let image = '';
    const img = r.article?.data.image ?? r.hub?.data.image;
    if (img) {
      const opt = await getImage({ src: img, width: 1200, format: 'jpg', quality: 80 });
      image = `\n    <image:image><image:loc>${esc(absoluteUrl(opt.src))}</image:loc></image:image>`;
    }
    const alternates = (site.alternates ?? [])
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(new URL(r.path, a.url + '/').toString())}"/>`)
      .join('');
    entries.push(`  <url>\n    <loc>${esc(r.url)}</loc>\n    <lastmod>${r.lastmod.toISOString()}</lastmod>${alternates}${image}\n  </url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
