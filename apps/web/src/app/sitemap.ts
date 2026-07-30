import type { MetadataRoute } from 'next';
import { listarArticulos, listarCategorias } from '@/lib/articulos';
import { publicEnv } from '@/lib/env';

/**
 * Sitemap dinamico.
 *
 * Se regenera con el mismo ciclo que los articulos: un sitemap que no incluye
 * lo publicado hoy retrasa dias la indexacion, y en un sitio que publica a
 * diario eso es trafico perdido de forma acumulativa.
 *
 * `lastModified` sale de `updated_at` real, no de la fecha de generacion. Un
 * sitemap que dice que todo cambio hoy no aporta informacion y Google acaba
 * ignorando el campo.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;

  const [{ articulos }, categorias] = await Promise.all([
    listarArticulos({ porPagina: 5000 }),
    listarCategorias(),
  ]);

  const estaticas: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/articulos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/acerca-de`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/contacto`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [
    ...estaticas,
    ...categorias.map((c) => ({
      url: `${base}/categoria/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...articulos.map((a) => ({
      url: `${base}/articulos/${a.slug}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
