import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/app/Logo';

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
        <h1 className="font-titular text-3xl font-bold text-ra-texto">Tienda</h1>
        <p className="mt-1 text-sm text-ra-texto-tenue">Recursos para tu transformación.</p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Programa destacado                                                */}
      {/* ---------------------------------------------------------------- */}
      {programa.map((p) => (
        <section key={p.id} className="ra-card mt-6 border-ra-rojo/30 px-6 py-6 text-center">
          <div className="flex justify-center">
            <Logo variante="programa" alto={48} />
          </div>

          {p.descripcion !== null && (
            <p className="mt-4 text-sm text-ra-texto-sec">{p.descripcion}</p>
          )}

          <p className="mt-4 font-titular text-3xl font-bold text-ra-texto">
            {precio(p.precio_cents, p.moneda)}
          </p>

          <a
            href={p.url_web ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-pulsable mt-4 flex min-h-[52px] items-center justify-center rounded-lg bg-ra-rojo px-6 font-titular text-sm font-bold tracking-wider text-white uppercase"
          >
            Acceder a Reset Alfa
          </a>
        </section>
      ))}

      {/* ---------------------------------------------------------------- */}
      {/* Libros                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-titular text-sm font-bold tracking-[0.15em] text-ra-texto uppercase">
          Libros
        </h2>

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
                  className="mg-pulsable mt-4 flex min-h-[44px] items-center justify-center rounded-md border border-ra-rojo px-4 text-xs font-bold tracking-wider text-ra-rojo uppercase"
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
      <ul className="ra-card mt-8 grid grid-cols-3 gap-2 px-3 py-4 text-center">
        {[
          { i: '🔒', t: 'Pago 100 % seguro', s: 'Tus datos protegidos' },
          { i: '⚡', t: 'Acceso inmediato', s: 'Descarga al instante' },
          { i: '✓', t: 'Garantía', s: 'Si no es para ti, te devolvemos' },
        ].map((b) => (
          <li key={b.t}>
            <span aria-hidden="true" className="text-base">
              {b.i}
            </span>
            <p className="mt-1 text-[10px] font-semibold text-ra-texto">{b.t}</p>
            <p className="text-[9px] leading-tight text-ra-texto-tenue">{b.s}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
