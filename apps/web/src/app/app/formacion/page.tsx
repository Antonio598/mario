import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Formación: masterclasses gratuitas y programa premium.
 *
 * DIFERENCIA IMPORTANTE CON LA APP NATIVA: aquí SÍ se puede mostrar el precio
 * y llevar al checkout. Estamos en la web, así que no aplica la comisión del
 * 15-30 % de Apple y Google. En la app nativa esta misma pantalla solo puede
 * decir que el contenido requiere acceso y abrir el navegador externo.
 *
 * El bloqueo real no está aquí: la política RLS de `lessons` impide que las
 * lecciones premium salgan de la base de datos sin un permiso vigente. Esta
 * pantalla solo decide qué se pinta.
 */
export default async function FormacionPage() {
  const supabase = await createClient();

  const [{ data: cursos }, { data: permisos }] = await Promise.all([
    supabase.from('courses').select('*').eq('publicado', true).order('orden'),
    supabase.from('entitlements').select('product_id, activo, expires_at'),
  ]);

  const ahora = Date.now();
  const desbloqueados = new Set(
    (permisos ?? [])
      .filter((e) => e.activo && (e.expires_at === null || new Date(e.expires_at).getTime() > ahora))
      .map((e) => e.product_id),
  );

  const gratis = (cursos ?? []).filter((c) => c.tipo === 'gratis');
  const premium = (cursos ?? []).filter((c) => c.tipo === 'premium');

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <header>
        <p className="font-titular text-xs font-semibold tracking-[0.2em] text-ra-rojo uppercase">
          Programa
        </p>
        <h1 className="mt-2 font-titular text-3xl font-bold text-ra-negro uppercase">
          Formación
        </h1>
      </header>

      <section className="mt-8">
        <h2 className="font-titular text-lg font-bold tracking-wider text-ra-negro uppercase after:mt-2 after:block after:h-[3px] after:w-11 after:bg-ra-rojo">
          Gratis
        </h2>
        <div className="mt-5 grid gap-3">
          {gratis.length === 0 ? (
            <p className="text-sm text-ra-texto-tenue">Todavía no hay contenido disponible.</p>
          ) : (
            gratis.map((c) => (
              <Link
                key={c.id}
                href={`/app/formacion/${c.slug}`}
                className="ra-card block px-5 py-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="ra-badge">Gratis</span>
                  <h3 className="font-titular text-sm font-bold tracking-wider text-ra-negro uppercase">
                    {c.titulo}
                  </h3>
                </div>
                {c.descripcion !== null && (
                  <p className="mt-2 line-clamp-2 text-sm text-ra-texto-sec">{c.descripcion}</p>
                )}
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-titular text-lg font-bold tracking-wider text-ra-negro uppercase after:mt-2 after:block after:h-[3px] after:w-11 after:bg-ra-rojo">
          Premium
        </h2>
        <div className="mt-5 grid gap-3">
          {premium.map((c) => {
            const abierto = c.product_id !== null && desbloqueados.has(c.product_id);

            return abierto ? (
              <Link
                key={c.id}
                href={`/app/formacion/${c.slug}`}
                className="ra-card block px-5 py-4 transition-shadow hover:shadow-md"
              >
                <h3 className="font-titular text-sm font-bold tracking-wider text-ra-negro uppercase">
                  {c.titulo}
                </h3>
                {c.descripcion !== null && (
                  <p className="mt-2 line-clamp-2 text-sm text-ra-texto-sec">{c.descripcion}</p>
                )}
              </Link>
            ) : (
              <div key={c.id} className="ra-card relative px-5 py-4 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-titular text-sm font-bold tracking-wider text-ra-texto-tenue uppercase">
                      {c.titulo}
                    </h3>
                    {c.descripcion !== null && (
                      <p className="mt-1 line-clamp-2 text-sm text-ra-texto-tenue">
                        {c.descripcion}
                      </p>
                    )}
                  </div>
                  <span
                    aria-label="Bloqueado"
                    className="shrink-0 rounded border border-ra-borde px-2 py-1 text-[10px] font-semibold tracking-widest text-ra-texto-tenue uppercase"
                  >
                    Bloqueado
                  </span>
                </div>

                {c.product_id !== null && (
                  <Link
                    href={`/producto/${c.product_id}`}
                    className="mt-3 inline-block text-sm font-medium text-ra-rojo underline underline-offset-2"
                  >
                    Ver cómo conseguirlo
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
