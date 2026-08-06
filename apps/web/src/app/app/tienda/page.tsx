import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Tienda de la app web — Reset Alfa tema claro.
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
    <div className="mx-auto max-w-md px-5 py-6">
      <header>
        <p className="font-titular text-xs font-semibold tracking-[0.2em] text-ra-rojo uppercase">
          Catálogo
        </p>
        <h1 className="mt-2 font-titular text-3xl font-bold text-ra-negro uppercase">
          Tienda
        </h1>
      </header>

      <div className="mt-6 grid gap-3">
        {(productos ?? []).length === 0 ? (
          <p className="text-sm text-ra-texto-tenue">Todavía no hay productos disponibles.</p>
        ) : (
          (productos ?? []).map((p) => (
            <article key={p.id} className="ra-card px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-titular text-sm font-bold tracking-wider text-ra-negro uppercase">
                  {p.nombre}
                </h2>
                <span className="shrink-0 font-titular text-lg font-bold text-ra-rojo">
                  {precio(p.precio_cents, p.moneda)}
                </span>
              </div>

              {p.descripcion !== null && (
                <p className="mt-2 text-sm text-ra-texto-sec">{p.descripcion}</p>
              )}

              <a
                href={`/producto/${p.slug}`}
                className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl bg-ra-rojo px-5 font-titular text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-ra-rojo-oscuro"
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
