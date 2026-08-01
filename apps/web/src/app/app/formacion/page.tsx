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
    <div className="mx-auto max-w-md px-5 py-10">
      <header>
        <p className="mg-kicker">Programa</p>
        <h1 className="mt-2 text-3xl">Formación</h1>
      </header>

      <section className="mt-9">
        <h2 className="mg-rule text-lg">Gratis</h2>
        <div className="mt-6 grid gap-3">
          {gratis.length === 0 ? (
            <p className="text-sm text-mg-gris-tenue">Todavía no hay contenido disponible.</p>
          ) : (
            gratis.map((c) => (
              <Link
                key={c.id}
                href={`/app/formacion/${c.slug}`}
                className="mg-card mg-card-link block px-5 py-4"
              >
                <h3 className="text-base text-mg-blanco">{c.titulo}</h3>
                {c.descripcion !== null && (
                  <p className="mt-1 line-clamp-2 text-sm text-mg-gris-texto">{c.descripcion}</p>
                )}
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mg-rule text-lg">Premium</h2>
        <div className="mt-6 grid gap-3">
          {premium.map((c) => {
            const abierto = c.product_id !== null && desbloqueados.has(c.product_id);

            return abierto ? (
              <Link
                key={c.id}
                href={`/app/formacion/${c.slug}`}
                className="mg-card mg-card-link block px-5 py-4"
              >
                <h3 className="text-base text-mg-blanco">{c.titulo}</h3>
                {c.descripcion !== null && (
                  <p className="mt-1 line-clamp-2 text-sm text-mg-gris-texto">{c.descripcion}</p>
                )}
              </Link>
            ) : (
              <div key={c.id} className="mg-card relative px-5 py-4 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base text-mg-gris-texto">{c.titulo}</h3>
                    {c.descripcion !== null && (
                      <p className="mt-1 line-clamp-2 text-sm text-mg-gris-tenue">
                        {c.descripcion}
                      </p>
                    )}
                  </div>
                  <span
                    aria-label="Bloqueado"
                    className="shrink-0 rounded border border-mg-negro-borde px-2 py-1 text-[10px] tracking-widest text-mg-gris-tenue uppercase"
                  >
                    Bloqueado
                  </span>
                </div>

                {c.product_id !== null && (
                  <Link
                    href={`/producto/${c.product_id}`}
                    className="mt-3 inline-block text-sm text-mg-rojo-claro underline underline-offset-2"
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
