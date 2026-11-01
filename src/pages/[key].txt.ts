import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '@config';

/**
 * IndexNow-sleutelbestand: /<INDEXNOW_KEY>.txt met de sleutel als inhoud.
 * Wordt alleen gebouwd als INDEXNOW_KEY (8-128 hex-tekens) in de omgeving staat.
 */
const key = (process.env.INDEXNOW_KEY ?? '').trim();
const valid = site.indexNow.enabled && /^[a-f0-9]{8,128}$/i.test(key);

export const getStaticPaths = (() => (valid ? [{ params: { key } }] : [])) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(params.key ?? '', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
