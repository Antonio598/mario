import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ENLACE_LLAMADA_ADMISION, CTA_LLAMADA_ADMISION } from '@/lib/app/enlaces';

export const dynamic = 'force-dynamic';

/**
 * Detalle de una masterclass o curso.
 *
 * Existe porque el carrusel de Inicio enlazaba aquí y no había nada: cada
 * tarjeta llevaba a un 404.
 *
 * Se resolvió con una pantalla propia en vez de mandar la tarjeta directa a
 * YouTube por dos motivos. Uno, hay recursos que solo tienen PDF y ningún
 * vídeo: un enlace externo directo no tendría a dónde ir. Dos, salir de la app
 * al primer toque es perder al usuario en la aplicación de YouTube; desde aquí
 * vuelve con el botón de atrás.
 *
 * El contenido premium se comprueba contra `entitlements`, no contra la
 * interfaz: quien escriba la URL a mano sin haber comprado ve la misma pantalla
 * de admisión que ve en Formación.
 */
export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: curso } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('publicado', true)
    .maybeSingle();

  if (curso === null) notFound();

  let tieneAcceso = curso.tipo === 'gratis';

  if (!tieneAcceso && curso.product_id !== null) {
    const { data: permisos } = await supabase
      .from('entitlements')
      .select('activo, expires_at')
      .eq('product_id', curso.product_id);

    const ahora = Date.now();
    tieneAcceso = (permisos ?? []).some(
      (e) => e.activo && (e.expires_at === null || new Date(e.expires_at).getTime() > ahora),
    );
  }

  const { data: programa } = await supabase
    .from('products')
    .select('cta_texto')
    .eq('slug', 'programa-reset-alfa')
    .maybeSingle();

  const sinRecursos = curso.url_externa === null && curso.url_protocolo === null;

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <Link
        href="/app/formacion"
        className="text-sm font-semibold text-ra-texto-tenue transition-colors hover:text-ra-rojo"
      >
        &lt; Formación
      </Link>

      <header className="mt-5">
        {curso.tipo === 'gratis' ? (
          <span className="ra-badge relative inline-block">Gratis</span>
        ) : (
          <span className="font-titular text-[11px] font-bold tracking-[0.2em] text-ra-rojo uppercase">
            Para alumnos
          </span>
        )}

        <h1 className="mt-3 font-titular text-3xl leading-tight font-bold text-ra-texto">
          {curso.titulo}
        </h1>

        {curso.descripcion !== null && (
          <p className="mt-3 text-sm leading-relaxed text-ra-texto-sec">{curso.descripcion}</p>
        )}
      </header>

      {tieneAcceso ? (
        <div className="mt-8 grid gap-3">
          {curso.url_externa !== null && (
            <a
              href={curso.url_externa}
              target="_blank"
              rel="noopener noreferrer"
              className="mg-pulsable flex min-h-[56px] items-center justify-center rounded-lg bg-ra-rojo px-6 font-titular text-sm font-bold tracking-wider text-white uppercase"
            >
              {curso.tipo === 'gratis' ? 'Ver masterclass' : 'Entrar al curso'}
            </a>
          )}

          {curso.url_protocolo !== null && (
            <a
              href={curso.url_protocolo}
              target="_blank"
              rel="noopener noreferrer"
              className="mg-pulsable flex min-h-[52px] items-center justify-center rounded-lg border border-ra-borde px-6 text-sm font-semibold text-ra-texto-sec"
            >
              Descargar protocolo (PDF)
            </a>
          )}

          {/*
            Un recurso sin enlaces no es un error del usuario: es contenido a
            medio cargar. Se dice tal cual en vez de dejar la pantalla vacía,
            que es lo que hace pensar que la app está rota.
          */}
          {sinRecursos && (
            <p className="ra-card px-5 py-4 text-sm text-ra-texto-tenue">
              Este recurso todavía no tiene material publicado. Estará disponible en breve.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-ra-rojo px-5 py-6 text-center text-white">
          <p className="font-titular text-sm font-bold tracking-[0.12em] uppercase">
            Contenido para alumnos
          </p>
          <p className="mt-3 text-xs leading-relaxed text-white/85">
            Forma parte del Programa Online de Liderazgo Reset Alfa. El acceso se decide en una
            llamada de admisión.
          </p>

          <a
            href={ENLACE_LLAMADA_ADMISION}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-pulsable mt-5 inline-flex min-h-[48px] items-center justify-center rounded-md bg-white px-5 text-xs font-bold tracking-wider text-ra-rojo uppercase"
          >
            {programa?.cta_texto ?? CTA_LLAMADA_ADMISION}
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ra-texto-tenue">
        Se abre en una pestaña nueva. Cuando termines, vuelve aquí.
      </p>
    </div>
  );
}
