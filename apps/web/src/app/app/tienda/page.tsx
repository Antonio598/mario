import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/app/Logo';
import Link from 'next/link';
import {
  ENLACE_LLAMADA_ADMISION,
  CTA_LLAMADA_ADMISION,
  PRECIO_PREMIUM_TEXTO,
} from '@/lib/app/enlaces';
import { obtenerAcceso } from '@/lib/app/acceso';
import { IconoCandado, enlacePremium } from '@/components/app/Bloqueado';

export const dynamic = 'force-dynamic';

/**
 * Tienda de la app web.
 *
 * SIN PRECIOS, por decisión de negocio. Cada producto se compra fuera —Amazon,
 * la tienda de modoguerrero.es, la llamada de admisión— y el precio que
 * manda es el de allí: mostrarlo aquí obliga a mantenerlo sincronizado a mano
 * y, cuando diverge, el usuario ve dos precios y no compra ninguno.
 *
 * `precio_cents` sigue en la tabla para cuando haga falta volver a enseñarlo.
 */
export default async function TiendaPage() {
  const supabase = await createClient();
  const [{ data: productos }, acceso] = await Promise.all([
    supabase.from('products').select('*').eq('activo', true).order('orden'),
    obtenerAcceso(),
  ]);

  const lista = productos ?? [];
  const programa = lista.filter((p) => p.tipo === 'programa');
  const libros = lista.filter((p) => p.tipo === 'libro');
  const suscripcion = lista.find((p) => p.tipo === 'suscripcion') ?? null;

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <p className="ra-kicker">Recursos</p>
        <h1 className="ra-titulo mt-2">Tienda</h1>
        <p className="ra-entradilla">Libros y programas para sostener el cambio.</p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Suscripción Premium. Es el único producto con precio a la vista: */}
      {/* se paga aquí, no fuera.                                          */}
      {/* ---------------------------------------------------------------- */}
      {suscripcion !== null && !acceso.esPremium && (
        <Link
          href={enlacePremium('tienda')}
          className="ra-card ra-card-enlace mg-pulsable mt-6 block px-6 py-6"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 55%, transparent)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="ra-kicker">Suscripción</p>
              <h2 className="mt-2 font-titular text-2xl leading-tight font-bold text-ra-texto uppercase">
                {suscripcion.nombre}
              </h2>
              {suscripcion.descripcion !== null && (
                <p className="mt-2 text-sm text-ra-texto-sec">{suscripcion.descripcion}</p>
              )}
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white">
              <IconoCandado tamano={18} />
            </span>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="font-titular text-xl font-bold text-ra-texto">{PRECIO_PREMIUM_TEXTO}</span>
            <span className="font-semibold text-ra-rojo">Ver Premium →</span>
          </div>
        </Link>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Programa destacado                                                */}
      {/* ---------------------------------------------------------------- */}
      {programa.map((p) => (
        <section
          key={p.id}
          className="ra-card mt-6 px-6 py-6 text-center"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 35%, transparent)' }}
        >
          <div className="flex justify-center">
            <Logo variante="programa" alto={48} />
          </div>

          {p.descripcion !== null && (
            <p className="mt-4 text-sm text-ra-texto-sec">{p.descripcion}</p>
          )}

          <a
            href={ENLACE_LLAMADA_ADMISION}
            target="_blank"
            rel="noopener noreferrer"
            className="ra-boton mt-5"
          >
            {p.cta_texto ?? CTA_LLAMADA_ADMISION}
          </a>
        </section>
      ))}

      {/* ---------------------------------------------------------------- */}
      {/* Libros                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-10">
        <div className="ra-seccion">
          <h2>Libros</h2>
          {libros.length > 0 && <span className="ra-chip">{libros.length} títulos</span>}
        </div>

        <div className="mg-escalonado mt-4 grid gap-4">
          {libros.length === 0 ? (
            <p className="text-sm text-ra-texto-tenue">Todavía no hay libros disponibles.</p>
          ) : (
            libros.map((p) => (
              <article key={p.id} className="ra-card p-4">
                <div className="flex gap-4">
                  {p.imagen_url !== null ? (
                    <Image
                      src={p.imagen_url}
                      alt={p.nombre}
                      width={80}
                      height={80}
                      className="h-20 w-20 shrink-0 rounded-md object-cover"
                      // Las portadas vienen del WordPress de la marca, ya a
                      // 300 px. `unoptimized` evita que el servidor las
                      // descargue y reprocese en cada despliegue.
                      unoptimized
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 rounded-md bg-ra-borde-suave" />
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-titular text-base leading-tight font-bold text-ra-texto">
                      {p.nombre}
                    </h3>
                  </div>
                </div>

                {p.descripcion !== null && (
                  <p className="mt-3 text-xs leading-relaxed text-ra-texto-sec">
                    {p.descripcion}
                  </p>
                )}

                <a
                  href={p.url_web ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ra-boton-sec mt-4 border-ra-rojo text-ra-rojo"
                >
                  Conseguir el libro
                </a>
              </article>
            ))
          )}
        </div>
      </section>

      {/*
        Banda de confianza. En una tienda que redirige a otro dominio para
        pagar, el momento de mayor abandono es justo antes de tocar el botón:
        estos tres mensajes responden a las dudas que aparecen ahí.
      */}
      {/*
        Banda de confianza. Los emojis se sustituyen por trazos: un emoji cambia
        de forma en cada sistema operativo y rompe la unica pantalla donde el
        usuario esta a punto de pagar.
      */}
      <ul className="ra-card mt-8 grid grid-cols-3 divide-x divide-ra-borde px-1 py-4 text-center">
        {[
          { d: 'M4 11h16v10H4V11Zm4 0V7a4 4 0 0 1 8 0v4', t: 'Pago seguro', s: 'Datos protegidos' },
          { d: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z', t: 'Acceso inmediato', s: 'Al instante' },
          { d: 'M20 6 9 17l-5-5', t: 'Garantía', s: 'Si no es para ti' },
        ].map((b) => (
          <li key={b.t} className="px-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-ra-rojo)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
              aria-hidden="true"
            >
              <path d={b.d} />
            </svg>
            <p className="mt-1.5 text-[10px] font-semibold text-ra-texto">{b.t}</p>
            <p className="text-[10px] leading-tight text-ra-texto-tenue">{b.s}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
