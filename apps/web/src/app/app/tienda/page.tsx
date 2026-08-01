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

  const precio = (cents: number, moneda: string) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: moneda }).format(cents / 100);

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <header>
        <p className="mg-kicker">Catálogo</p>
        <h1 className="mt-2 text-3xl">Tienda</h1>
      </header>

      <div className="mt-8 grid gap-3">
        {(productos ?? []).length === 0 ? (
          <p className="text-sm text-mg-gris-tenue">Todavía no hay productos disponibles.</p>
        ) : (
          (productos ?? []).map((p) => (
            <article key={p.id} className="mg-card px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-base text-mg-blanco">{p.nombre}</h2>
                <span className="shrink-0 font-titular text-lg text-mg-rojo">
                  {precio(p.precio_cents, p.moneda)}
                </span>
              </div>

              {p.descripcion !== null && (
                <p className="mt-2 text-sm text-mg-gris-texto">{p.descripcion}</p>
              )}

              <a
                href={`/producto/${p.slug}`}
                className="mt-4 flex min-h-[48px] items-center justify-center rounded-md bg-mg-rojo px-5 font-titular text-sm font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro"
              >
                Ver ficha
              </a>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
