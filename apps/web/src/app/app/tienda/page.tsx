import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/app/Logo';
import { ENLACE_LLAMADA_ADMISION, CTA_LLAMADA_ADMISION } from '@/lib/app/enlaces';

export const dynamic = 'force-dynamic';

/**
 * Tienda de la app web.
 *
 * A diferencia de la app nativa, aquí SÍ se muestra el precio y se puede
 * comprar: estamos en la web, así que no aplica la comisión del 15-30 % de
 * Apple y Google. Ese es el motivo de negocio para tener PWA además de app.
 */
export default async function TiendaPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from('products')
    .select('*')
    .eq('activo', true)
    .order('orden');

  const lista = productos ?? [];
  const programa = lista.filter((p) => p.tipo === 'programa');
  const libros = lista.filter((p) => p.tipo === 'libro');

  const precio = (cents: number, moneda: string) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <p className="ra-kicker">Recursos</p>
        <h1 className="ra-titulo mt-2">Tienda</h1>
        <p className="ra-entradilla">Libros y programas para sostener el cambio.</p>
      </header>

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

          {/*
            El precio solo aparece si `mostrar_precio` es true. El programa se
            vende por llamada de admisión, no por enlace, así que ahora no lo
            es. El dato sigue en la tabla: volver a venderlo directo es cambiar
            un booleano.
          */}
          {p.mostrar_precio && (
            <p className="mt-4 font-titular text-3xl font-bold text-ra-texto">
              {precio(p.precio_cents, p.moneda)}
            </p>
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
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-titular text-sm font-bold text-ra-texto">{p.nombre}</h3>
                      <span className="shrink-0 font-titular text-sm font-bold text-ra-rojo">
                        {precio(p.precio_cents, p.moneda)}
                      </span>
                    </div>
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
                  Comprar ahora
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
            <p className="text-[9px] leading-tight text-ra-texto-tenue">{b.s}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
