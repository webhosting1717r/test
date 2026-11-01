import type { APIRoute } from 'astro';
import { site } from '@config';

export const GET: APIRoute = () => {
  const manifest = {
    name: site.name,
    short_name: site.name.slice(0, 12),
    description: site.description,
    lang: site.lang,
    start_url: '/',
    display: 'browser',
    background_color: site.theme.background,
    theme_color: site.theme.light,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
};
