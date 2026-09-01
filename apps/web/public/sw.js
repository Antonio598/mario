/**
 * Service worker de Reset Alfa.
 *
 * QUÉ CACHEA Y QUÉ NO — esto es lo importante de este fichero.
 *
 * Un service worker guarda respuestas en el disco del dispositivo. En una app
 * que trata datos de categoría especial del art. 9 RGPD, cachear la página
 * equivocada significa dejar el historial de recaídas de alguien escrito en el
 * disco de un móvil compartido, superviviente al cierre de sesión.
 *
 * Por eso la regla es explícita y restrictiva:
 *
 *   SÍ se cachea   Recursos estáticos con hash en el nombre (_next/static),
 *                  fuentes, el icono. Son idénticos para todos y no revelan
 *                  nada de nadie.
 *
 *   NO se cachea   Todo lo demás. Ninguna página HTML, ninguna llamada a la
 *                  API de Supabase, nada de /app, nada de /auth. Sin conexión
 *                  se muestra una pantalla de aviso, que es peor experiencia
 *                  pero no filtra nada.
 *
 * Sube el número de versión al cambiar este fichero: es lo que dispara la
 * limpieza de las cachés viejas.
 */

const VERSION = 'reset-alfa-v3';
const CACHE_ESTATICOS = `${VERSION}-estaticos`;

/** Mínimo para que la pantalla de sin conexión se vea con la marca puesta. */
const PRECARGA = ['/icono.svg', '/sin-conexion'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_ESTATICOS)
      // `catch` para que un 404 en un recurso opcional no aborte la
      // instalación entera y deje el service worker sin activar.
      .then((cache) => cache.addAll(PRECARGA).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves.filter((c) => !c.startsWith(VERSION)).map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Recursos inmutables: llevan hash en el nombre, así que nunca cambian. */
function esEstaticoInmutable(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/icono.svg' ||
    /\.(?:woff2?|png|jpe?g|svg|webp|avif|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (evento) => {
  const { request } = evento;

  // Solo GET. Un POST cacheado sería un error de datos, no de rendimiento.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Nada de otros orígenes: Supabase, Google Ads, analítica. No es asunto
  // nuestro y cachearlo rompería la autenticación.
  if (url.origin !== self.location.origin) return;

  /* --------------------------------------------------------------------- */
  /* Estáticos inmutables: caché primero. Es lo que hace que la app abra    */
  /* instantáneamente en la segunda visita.                                */
  /* --------------------------------------------------------------------- */
  if (esEstaticoInmutable(url)) {
    evento.respondWith(
      caches.match(request).then(
        (enCache) =>
          enCache ??
          fetch(request).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              void caches.open(CACHE_ESTATICOS).then((c) => c.put(request, copia));
            }
            return respuesta;
          }),
      ),
    );
    return;
  }

  /* --------------------------------------------------------------------- */
  /* Navegación: SIEMPRE a la red. Si falla, pantalla de sin conexión.      */
  /*                                                                       */
  /* Sin caché de HTML a propósito. Es la diferencia entre una PWA algo más */
  /* lenta y una que deja el historial de recaídas de alguien en el disco   */
  /* de un móvil prestado.                                                 */
  /* --------------------------------------------------------------------- */
  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request).catch(() =>
        caches.match('/sin-conexion').then(
          (r) =>
            r ??
            new Response('<h1>Sin conexion</h1>', {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }),
        ),
      ),
    );
  }

  // El resto —API, datos— pasa de largo sin tocar la caché.
});
