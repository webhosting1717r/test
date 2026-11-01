/**
 * Afgeleide beelden voor social (og:image) en JSON-LD. Google adviseert voor Article
 * meerdere beeldverhoudingen (16:9, 4:3, 1:1); we leveren ze als JPG (breedst ondersteund).
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { absoluteUrl } from './site';
import type { ImageInfo } from './schema';

export async function socialImage(src: ImageMetadata, alt?: string): Promise<ImageInfo> {
  const img = await getImage({ src, width: 1200, height: 630, format: 'jpg', quality: 80, fit: 'cover' });
  return { url: absoluteUrl(img.src), width: 1200, height: 630, alt };
}

export async function schemaImages(src: ImageMetadata): Promise<string[]> {
  const variants: [number, number][] = [
    [1200, 675], // 16:9
    [1200, 900], // 4:3
    [1200, 1200], // 1:1
  ];
  const out: string[] = [];
  for (const [w, h] of variants) {
    const img = await getImage({ src, width: w, height: h, format: 'jpg', quality: 80, fit: 'cover' });
    out.push(absoluteUrl(img.src));
  }
  return out;
}
