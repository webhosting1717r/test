// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import { site } from './site.config.ts';

export default defineConfig({
  // Absolute basis voor canonicals, sitemap en feeds.
  site: site.url,
  output: 'static',

  // URL-conventie: map-per-pagina met vaste trailing slash (/hub/artikel/).
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Alle CSS inline in <style>: één request minder en geen render-blocking stylesheet.
    inlineStylesheets: 'always',
  },

  // Verlieloze whitespace-compressie (v7-default 'jsx' kan spaties tussen inline-elementen weghalen).
  compressHTML: true,

  integrations: [mdx()],

  // Beelden: automatisch srcset/sizes, width/height en object-fit, geen upscaling.
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [400, 640, 800, 1024, 1280, 1600],
  },

  // Self-hosted, gesubsette variable font met gepreloade woff2 en metric-matched fallback
  // (Astro genereert size-adjust/ascent-override voor de sans-serif fallback → geen CLS).
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-sans',
      fallbacks: ['Arial', 'sans-serif'],
      optimizedFallbacks: true,
      options: {
        variants: [
          {
            weight: '400 700',
            style: 'normal',
            display: 'optional',
            src: ['./src/assets/fonts/inter-latin-subset.woff2'],
            unicodeRange: ['U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD'],
          },
        ],
      },
    },
  ],

  // Geen client-side JS: geen prefetch-script, geen view transitions. Prefetch gebeurt
  // declaratief via Speculation Rules in <head> (zie src/layouts/Base.astro).
  prefetch: false,

  markdown: {
    gfm: true,
    smartypants: true,
    syntaxHighlight: false,
  },

  devToolbar: { enabled: false },
});
