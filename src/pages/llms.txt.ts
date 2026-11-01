import type { APIRoute } from 'astro';
import { site } from '@config';
import { buildRoutes } from '@lib/site';

/**
 * llms.txt (optioneel, site.llmsTxt). Let op: Google gebruikt dit bestand niet
 * (John Mueller, 2025-2026); het is een experimenteel formaat voor AI-agents.
 */
export const GET: APIRoute = async () => {
  if (!site.llmsTxt) return new Response(null, { status: 404 });
  const routes = (await buildRoutes()).filter((r) => r.indexable);
  const hubs = routes.filter((r) => r.kind === 'hub');
  const lines: string[] = [`# ${site.name}`, '', `> ${site.description}`, ''];
  for (const h of hubs) {
    lines.push(`## ${h.hub!.data.title}`, '', `- [${h.hub!.data.title}](${h.url}): ${h.description}`);
    for (const a of routes.filter((r) => r.kind === 'article' && r.hub?.id === h.hub!.id)) {
      lines.push(`- [${a.article!.data.title}](${a.url}): ${a.description}`);
    }
    lines.push('');
  }
  lines.push('## Overig', '');
  for (const r of routes.filter((r) => r.kind === 'page' || r.kind === 'author')) lines.push(`- [${r.title}](${r.url}): ${r.description}`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
