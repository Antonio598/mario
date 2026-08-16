import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/app/Logo';

export const dynamic = 'force-dynamic';

/**
 * Formación: masterclasses gratuitas y programa Reset Alfa.
 *
 * Los cursos NO se alojan aquí: viven en modoguerrero.es/escuela. Esta pantalla
 * es un índice que abre cada uno en una pestaña nueva. Duplicar el contenido
 * significaría mantenerlo en dos sitios y verlo divergir en un mes.
 *
 * DIFERENCIA CON LA APP NATIVA: aquí sí puede mostrarse el precio y llevar al
 * pago. Estamos en la web, así que no aplica la comisión del 15-30 % de Apple y
 * Google. En la app nativa esta misma pantalla solo puede abrir el navegador.
 */
export default async function FormacionPage() {
  const supabase = await createClient();

  const [{ data: cursos }, { data: permisos }, { data: productos }] = await Promise.all([
    supabase.from('courses').select('*').eq('publicado', true).order('orden'),
    supabase.from('entitlements').select('product_id, activo, expires_at'),
    supabase.from('products').select('*').eq('slug', 'programa-reset-alfa').maybeSingle(),
  ]);

  const ahora = Date.now();
  const desbloqueados = new Set(
    (permisos ?? [])
      .filter((e) => e.activo && (e.expires_at === null || new Date(e.expires_at).getTime() > ahora))
      .map((e) => e.product_id),
  );

  const lista = cursos ?? [];
  const gratis = lista.filter((c) => c.tipo === 'gratis');
  const premium = lista.filter((c) => c.tipo === 'premium');

  const programa = productos;
  const tieneAcceso = programa !== null && desbloqueados.has(programa.id);

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <p className="font-titular text-[11px] font-semibold tracking-[0.25em] text-ra-rojo uppercase">
          Programa
        </p>
        <h1 className="mt-2 font-titular text-3xl font-bold text-ra-texto">Formación</h1>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Gratis                                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-8">
        <h2 className="font-titular text-sm font-bold tracking-[0.15em] text-ra-texto-sec uppercase">
          Masterclasses gratuitas
        </h2>

        <div className="mg-escalonado mt-4 grid gap-3">
          {gratis.length === 0 ? (
            <p className="text-sm text-ra-texto-tenue">Todavía no hay contenido disponible.</p>
          ) : (
            gratis.map((c) => (
              <article key={c.id} className="ra-card px-5 py-4">
                <h3 className="font-titular text-base font-bold text-ra-texto">{c.titulo}</h3>
                {c.descripcion !== null && (
                  <p className="mt-1 text-sm text-ra-texto-sec">{c.descripcion}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {c.url_externa !== null && (
                    <a
                      href={c.url_externa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mg-pulsable flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-ra-rojo px-4 text-sm font-bold tracking-wider text-white uppercase"
                    >
                      Ver masterclass
                    </a>
                  )}
                  {c.url_protocolo !== null && (
                    <a
                      href={c.url_protocolo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mg-pulsable flex min-h-[44px] items-center justify-center rounded-md border border-ra-borde px-4 text-sm font-semibold text-ra-texto-sec"
                    >
                      Protocolo PDF
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Premium                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="font-titular text-sm font-bold tracking-[0.15em] text-ra-texto-sec uppercase">
          Reset Alfa
        </h2>

        <div className="mt-4 grid gap-3">
          {premium.map((c) => {
            const abierto = c.product_id !== null && desbloqueados.has(c.product_id);

            return (
              <article
                key={c.id}
                className={`ra-card px-5 py-4 ${abierto ? '' : 'opacity-75'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-titular text-base font-bold text-ra-texto">{c.titulo}</h3>
                    {c.descripcion !== null && (
                      <p className="mt-1 text-sm text-ra-texto-sec">{c.descripcion}</p>
                    )}
                  </div>

                  {!abierto && (
                    <span
                      aria-label="Bloqueado"
                      className="shrink-0 rounded border border-ra-borde px-2 py-1 text-[10px] font-semibold tracking-widest text-ra-texto-tenue uppercase"
                    >
                      Bloqueado
                    </span>
                  )}
                </div>

                {abierto && c.url_externa !== null && (
                  <a
                    href={c.url_externa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mg-pulsable mt-4 flex min-h-[44px] items-center justify-center rounded-md bg-ra-rojo px-4 text-sm font-bold tracking-wider text-white uppercase"
                  >
                    Entrar al curso
                  </a>
                )}
              </article>
            );
          })}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Acceso al programa                                              */}
        {/* -------------------------------------------------------------- */}
        {!tieneAcceso && programa !== null && (
          <div className="ra-card mt-6 border-ra-rojo/30 px-6 py-6 text-center">
            <p className="font-titular text-[11px] font-semibold tracking-[0.25em] text-ra-rojo uppercase">
              Programa completo
            </p>

            <div className="mt-4 flex justify-center">
              <Logo variante="programa" alto={56} />
            </div>
            <p className="mt-3 text-sm text-ra-texto-sec">
              Desencadenado, Transmutación Sexual, Liderazgo y el archivo completo de mentorías.
            </p>

            <p className="mt-5 font-titular text-3xl font-bold text-ra-texto">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: programa.moneda,
                maximumFractionDigits: 0,
              }).format(programa.precio_cents / 100)}
            </p>

            <a
              href={programa.url_web ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mg-pulsable mt-5 flex min-h-[56px] items-center justify-center rounded-lg bg-ra-rojo px-6 font-titular text-base font-bold tracking-wider text-white uppercase"
            >
              Acceder a Reset Alfa
            </a>

            {/*
              Los alumnos que ya compraron fuera de la app no tienen fila en
              `entitlements`, así que el contenido les saldría bloqueado. Este
              enlace es su vía hasta que se conecte el webhook de Stripe o se
              importen las compras existentes.
            */}
            <p className="mt-4 text-xs text-ra-texto-tenue">
              ¿Ya eres alumno?{' '}
              <a
                href="https://modoguerrero.es/escuela"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ra-rojo underline underline-offset-2"
              >
                Entra en la academia
              </a>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
