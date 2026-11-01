import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { site } from '@config';
import { buildRoutes } from '@lib/site';

export const GET: APIRoute = async (context) => {
  if (!site.feeds.rss) return new Response(null, { status: 404 });
  const routes = (await buildRoutes()).filter((r) => r.kind === 'article' && r.indexable);
  const items = routes
    .sort((a, b) => (b.datePublished?.getTime() ?? 0) - (a.datePublished?.getTime() ?? 0))
    .slice(0, site.feeds.rssLimit);
  return rss({
    title: site.name,
    description: site.description,
    site: context.site ?? site.url,
    trailingSlash: true,
    items: items.map((r) => ({
      title: r.article!.data.title,
      description: r.article!.data.description,
      link: r.url,
      pubDate: r.article!.data.datePublished,
      categories: [r.hub!.data.title],
    })),
    customData: `<language>${site.lang}</language><lastBuildDate>${new Date(Math.max(...items.map((r) => r.lastmod.getTime()))).toUTCString()}</lastBuildDate>`,
  });
};
