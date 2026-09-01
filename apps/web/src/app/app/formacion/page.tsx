import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/app/Logo';
import { FormacionTabs } from '@/components/app/FormacionTabs';
import { ENLACE_LLAMADA_ADMISION, CTA_LLAMADA_ADMISION } from '@/lib/app/enlaces';

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

  const [{ data: cursos }, { data: permisos }, { data: programa }] = await Promise.all([
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

  const tieneAcceso = programa !== null && desbloqueados.has(programa.id);

  /* ------------------------------------------------------------------ */
  /* Panel gratuito                                                     */
  /* ------------------------------------------------------------------ */
  const panelGratis = (
    <section className="mt-6">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">
          🎁
        </span>
        <div>
          <h2 className="font-titular text-base font-bold text-ra-texto">Recursos gratuitos</h2>
          <p className="text-xs text-ra-texto-tenue">Masterclasses y protocolos para empezar.</p>
        </div>
      </div>

      <div className="mg-escalonado mt-4 grid gap-3">
        {gratis.length === 0 ? (
          <p className="text-sm text-ra-texto-tenue">Todavía no hay contenido disponible.</p>
        ) : (
          gratis.map((c) => (
            <article key={c.id} className="ra-card relative overflow-hidden px-5 py-4">
              <span className="ra-badge absolute top-0 left-0">Gratis</span>

              <h3 className="mt-3 font-titular text-base font-bold text-ra-texto">{c.titulo}</h3>
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
  );

  /* ------------------------------------------------------------------ */
  /* Panel premium                                                      */
  /* ------------------------------------------------------------------ */
  const panelPremium = (
    <section className="mt-6">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">
          👑
        </span>
        <div>
          <h2 className="font-titular text-base font-bold text-ra-texto">
            Formación para alumnos
          </h2>
          <p className="text-xs text-ra-texto-tenue">Contenido exclusivo de pago.</p>
        </div>
      </div>

      {/*
        Destacado del programa. Antes decía "Mastermind"; el nombre real del
        producto es Programa Online de Liderazgo Reset Alfa.

        No lleva precio ni enlace de pago: el acceso pasa por una llamada de
        admisión. Efecto secundario útil, y no menor: sin precio ni compra
        externa dentro de la app, la guideline 3.1.1 de Apple deja de aplicar.
      */}
      {programa !== null && !tieneAcceso && (
        <div className="mt-4 rounded-xl bg-ra-rojo px-5 py-6 text-center text-white">
          <p className="font-titular text-sm font-bold tracking-[0.12em] uppercase">
            Programa Online de
            <br />
            Liderazgo Reset Alfa
          </p>

          {programa.descripcion !== null && (
            <p className="mt-3 text-xs leading-relaxed text-white/85">{programa.descripcion}</p>
          )}

          <a
            href={ENLACE_LLAMADA_ADMISION}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-pulsable mt-5 inline-flex min-h-[48px] items-center justify-center rounded-md bg-white px-5 text-xs font-bold tracking-wider text-ra-rojo uppercase"
          >
            {programa.cta_texto ?? CTA_LLAMADA_ADMISION}
          </a>
        </div>
      )}

      <div className="mg-escalonado mt-4 grid gap-3">
        {premium.map((c) => {
          const abierto = c.product_id !== null && desbloqueados.has(c.product_id);

          return (
            <article key={c.id} className={`ra-card px-5 py-4 ${abierto ? '' : 'opacity-75'}`}>
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
                    className="shrink-0 rounded border border-ra-borde px-2 py-1 text-xs"
                  >
                    🔒
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

      {!tieneAcceso && programa !== null && (
        <div className="ra-card mt-6 border-ra-rojo/30 px-6 py-6 text-center">
          <div className="flex justify-center">
            <Logo variante="programa" alto={52} />
          </div>

          {programa.descripcion !== null && (
            <p className="mt-4 text-sm text-ra-texto-sec">{programa.descripcion}</p>
          )}

          {/*
            El precio solo se pinta si `mostrar_precio` es true. Ahora mismo no
            lo es: el programa se vende por llamada, no por enlace. El dato
            sigue en la tabla para poder volver a venderlo directo cambiando un
            booleano.
          */}
          {programa.mostrar_precio && (
            <p className="mt-5 font-titular text-3xl font-bold text-ra-texto">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: programa.moneda,
                maximumFractionDigits: 0,
              }).format(programa.precio_cents / 100)}
            </p>
          )}

          <a
            href={ENLACE_LLAMADA_ADMISION}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-pulsable mt-5 flex min-h-[56px] items-center justify-center rounded-lg bg-ra-rojo px-6 font-titular text-base font-bold tracking-wider text-white uppercase"
          >
            {programa.cta_texto ?? CTA_LLAMADA_ADMISION}
          </a>

          {/*
            Los alumnos que ya compraron fuera de la app no tienen fila en
            `entitlements`, así que el contenido les saldría bloqueado. Este
            enlace es su vía hasta que se conecte el webhook de Stripe.
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
  );

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <h1 className="font-titular text-3xl font-bold text-ra-texto">Formación</h1>
        <p className="mt-1 text-sm text-ra-texto-tenue">
          Aprende con recursos gratuitos y contenido premium.
        </p>
      </header>

      <FormacionTabs gratis={panelGratis} premium={panelPremium} />
    </div>
  );
}
