import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Genera .next/standalone: un servidor autocontenido con solo las
   * dependencias que realmente se usan. Reduce la imagen Docker de ~1,2 GB a
   * ~180 MB, lo que en un VPS de 8 GB compartido con n8n no es un detalle.
   */
  output: 'standalone',

  /**
   * En un monorepo, el trazado de ficheros de `standalone` debe partir de la
   * raiz del workspace: si no, deja fuera packages/shared y packages/tokens y
   * el contenedor arranca con un error de modulo no encontrado.
   *
   * Se resuelve con fileURLToPath y no con URL.pathname: en Windows, pathname
   * devuelve "/C:/dev/..." —con barra inicial— que Next interpreta como ruta
   * relativa y acaba escribiendo la salida en un directorio inventado.
   */
  outputFileTracingRoot: join(dirname(fileURLToPath(import.meta.url)), '../..'),

  /** Los paquetes internos se compilan desde su fuente TypeScript. */
  transpilePackages: ['@reset-alfa/shared', '@reset-alfa/tokens'],

  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Barras finales coherentes. Google trata /articulos/x y /articulos/x/ como
   * URLs distintas; fijar el criterio evita contenido duplicado.
   */
  trailingSlash: false,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    const seguridad = {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
    };

    /**
     * El service worker NUNCA debe cachearse.
     *
     * Si el navegador guarda una copia de sw.js, sigue ejecutando el service
     * worker viejo aunque se despliegue uno nuevo, y con el la cache vieja. El
     * sintoma es que los cambios se ven en otro navegador pero no en el propio.
     * Con no-cache, el navegador comprueba siempre si hay version nueva.
     */
    const swSinCache = {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    };

    /**
     * El entorno de staging no debe indexarse jamas. Si Google lo indexa,
     * compite con produccion por las mismas palabras clave y canibaliza el
     * trafico que sostiene el ingreso publicitario.
     *
     * El bloque entero es condicional: Next rechaza una regla con la lista de
     * cabeceras vacia.
     */
    if (process.env['NEXT_PUBLIC_ENVIRONMENT'] !== 'production') {
      return [
        seguridad,
        swSinCache,
        {
          source: '/:path*',
          headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
        },
      ];
    }

    return [seguridad, swSinCache];
  },
};

export default nextConfig;
