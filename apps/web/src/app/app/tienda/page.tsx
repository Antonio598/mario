import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

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

  /**
   * Los precios de la web son rangos porque hay varias ediciones. Se muestra
   * "desde": prometer el precio bajo y cobrar el alto en el checkout es la
   * forma más rápida de perder la venta en el último paso.
   */
  const precio = (cents: number, moneda: string) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <p className="font-titular text-[11px] font-semibold tracking-[0.25em] text-ra-rojo uppercase">
          Catálogo
        </p>
        <h1 className="mt-2 font-titular text-3xl font-bold text-ra-texto">Tienda</h1>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Programa                                                          */}
      {/* ---------------------------------------------------------------- */}
      {programa.map((p) => (
        <section key={p.id} className="ra-card mt-8 border-ra-rojo/30 px-6 py-6 text-center">
          <p className="font-titular text-[11px] font-semibold tracking-[0.25em] text-ra-rojo uppercase">
            Programa completo
          </p>
          <h2 className="mt-3 font-titular text-2xl font-bold text-ra-texto">{p.nombre}</h2>
          {p.descripcion !== null && (
            <p className="mt-3 text-sm text-ra-texto-sec">{p.descripcion}</p>
          )}
          <p className="mt-5 font-titular text-3xl font-bold text-ra-texto">
            {precio(p.precio_cents, p.moneda)}
          </p>
          <a
            href={p.url_web ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-pulsable mt-5 flex min-h-[56px] items-center justify-center rounded-lg bg-ra-rojo px-6 font-titular text-base font-bold tracking-wider text-white uppercase"
          >
            Acceder a Reset Alfa
          </a>
        </section>
      ))}

      {/* ---------------------------------------------------------------- */}
      {/* Libros                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-titular text-sm font-bold tracking-[0.15em] text-ra-texto-sec uppercase">
          Libros
        </h2>

        <div className="mg-escalonado mt-4 grid gap-3">
          {libros.length === 0 ? (
            <p className="text-sm text-ra-texto-tenue">Todavía no hay libros disponibles.</p>
          ) : (
            libros.map((p) => (
              <a
                key={p.id}
                href={p.url_web ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="ra-card mg-pulsable flex gap-4 p-4"
              >
                {p.imagen_url !== null ? (
                  <Image
                    src={p.imagen_url}
                    alt={p.nombre}
                    width={88}
                    height={88}
                    className="h-22 w-22 shrink-0 rounded-md object-cover"
                    // Las portadas vienen de modoguerrero.es. `unoptimized` evita
                    // que el servidor tenga que descargar y reprocesar cada
                    // imagen: son estáticas y ya vienen a 300 px.
                    unoptimized
                  />
                ) : (
                  <div className="h-22 w-22 shrink-0 rounded-md bg-ra-borde-suave" />
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-titular text-base font-bold text-ra-texto">{p.nombre}</h3>
                  {p.descripcion !== null && (
                    <p className="mt-1 line-clamp-2 text-xs text-ra-texto-sec">{p.descripcion}</p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-ra-rojo">
                    desde {precio(p.precio_cents, p.moneda)}
                  </p>
                </div>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
