import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Slug-regels: lowercase, cijfers en koppeltekens; geen datums of ID's. */
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug moet lowercase zijn met koppeltekens (a-z, 0-9, -)')
  .refine((s) => !/^\d{4}-\d{2}/.test(s) && !/-\d{4,}$/.test(s), 'Slug mag geen datum of ID bevatten');

const alternates = z
  .array(z.object({ hreflang: z.string(), href: z.string().url() }))
  .optional();

/** Gedeelde SEO-velden voor elk paginatype. */
const seoFields = {
  title: z.string().min(10).max(120),
  description: z.string().min(50).max(220),
  slug: slug.optional(),
  /** Alleen zetten als deze pagina een kopie/variant is van een andere URL. */
  canonical: z.string().url().optional(),
  /** true = robots noindex,follow; pagina blijft bereikbaar maar komt niet in sitemap/feeds. */
  noindex: z.boolean().default(false),
  alternates,
};

const hubs = defineCollection({
  loader: glob({ base: './src/content/hubs', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      /** Korte naam voor navigatie en breadcrumbs (valt terug op title). */
      navLabel: z.string().max(40).optional(),
      order: z.number().int().default(100),
      datePublished: z.coerce.date(),
      dateModified: z.coerce.date(),
      image: image().optional(),
      imageAlt: z.string().optional(),
    }),
});

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      datePublished: z.coerce.date(),
      dateModified: z.coerce.date(),
      author: reference('authors'),
      category: reference('hubs'),
      image: image().optional(),
      imageAlt: z.string().optional(),
      /** Concept: wordt niet gebouwd. */
      draft: z.boolean().default(false),
    }),
});

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      name: z.string(),
      jobTitle: z.string().optional(),
      /** Externe profielen (LinkedIn, ORCID, eigen site) → Person.sameAs. */
      sameAs: z.array(z.string().url()).default([]),
      image: image().optional(),
      imageAlt: z.string().optional(),
      dateModified: z.coerce.date(),
    }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: () =>
    z.object({
      ...seoFields,
      /** Bepaalt schema.org-type en plaats in de footer. */
      kind: z.enum(['about', 'contact', 'legal', 'generic']).default('generic'),
      navLabel: z.string().max(40).optional(),
      order: z.number().int().default(100),
      datePublished: z.coerce.date(),
      dateModified: z.coerce.date(),
    }),
});

export const collections = { hubs, articles, authors, pages };
