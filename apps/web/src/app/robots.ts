import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';

/**
 * robots.txt
 *
 * En cualquier entorno que no sea produccion se bloquea el rastreo COMPLETO.
 * Si Google indexa staging, ese dominio compite con produccion por las mismas
 * palabras clave: el trafico se parte en dos y la mitad va a un sitio sin
 * anuncios. Es una de las formas mas silenciosas de perder ingresos.
 */
export default function robots(): MetadataRoute.Robots {
  if (publicEnv.environment !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Rutas sin valor de busqueda. Mantenerlas fuera del rastreo concentra
        // el presupuesto de rastreo en los articulos, que es lo que importa.
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
    host: publicEnv.siteUrl,
  };
}
