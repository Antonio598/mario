import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { obtenerAcceso } from '@/lib/app/acceso';
import { GRACIA_HORAS, PRECIO_PREMIUM_TEXTO } from '@/lib/app/enlaces';
import { obtenerStripe, sincronizarDesdeSesion } from '@/lib/stripe/suscripciones';
import { BotonPortal, BotonSuscribirse } from '@/components/app/BotonesPremium';
import { IconoCandado } from '@/components/app/Bloqueado';

export const dynamic = 'force-dynamic';

/**
 * Paywall.
 *
 * Las dos opciones tienen el MISMO peso visual y el mismo tamaño de botón. Sin
 * cuenta atrás, sin "oferta única", sin precio tachado. Esas técnicas suben la
 * conversión del primer día y hunden la retención del segundo mes, que es
 * donde está el dinero de una suscripción; y en la UE varias son ya
 * sancionables como prácticas engañosas.
 *
 * Con `estado=ok` se sincroniza la suscripción desde la sesión de Stripe ANTES
 * de leer el acceso, así la pantalla dice "activo" al instante sin esperar al
 * webhook, que puede tardar segundos.
 */

const FILAS: ReadonlyArray<{ f: string; gratis: string | boolean; premium: string | boolean }> = [
  { f: 'Contador de racha', gratis: 'Hasta 30 días', premium: 'Sin límite' },
  { f: 'Check-in diario', gratis: true, premium: true },
  { f: 'Registrar una recaída', gratis: true, premium: true },
  { f: 'Bitácora de NOFAP (9 preguntas por recaída)', gratis: false, premium: true },
  { f: 'P.A.D — Protocolo Anti-Deseo', gratis: false, premium: true },
  { f: 'Carta anti-recaída', gratis: false, premium: true },
  { f: 'Medallas de 90, 180 y 365 días', gratis: false, premium: true },
  { f: 'Masterclasses y protocolos PDF', gratis: true, premium: true },
];

function Celda({ v }: { v: string | boolean }) {
  if (typeof v === 'string') return <span className="text-xs text-ra-texto-sec">{v}</span>;
  return v ? (
    <span aria-label="Incluido" className="font-bold text-ra-exito">
      ✓
    </span>
  ) : (
    <span aria-label="No incluido" className="text-ra-texto-tenue">
      —
    </span>
  );
}

function fechaLarga(iso: string): string {
  const sinGracia = new Date(new Date(iso).getTime() - GRACIA_HORAS * 3_600_000);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(sinGracia);
}

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; session_id?: string; bienvenida?: string }>;
}) {
  const { estado, session_id, bienvenida } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avisoSesion: string | null = null;

  if (estado === 'ok' && session_id !== undefined && user !== null) {
    try {
      const r = await sincronizarDesdeSesion(obtenerStripe(), session_id, user.id);
      if (!r.ok) avisoSesion = r.motivo;
    } catch (e) {
      // No se bloquea la pantalla: el webhook lo arreglará solo. Se anota.
      console.error('[premium] fallo al sincronizar desde la sesión', e);
      avisoSesion = 'fallo_sincronizacion';
    }
  }

  const acceso = await obtenerAcceso();

  /* ---------------------------------------------------------------- */
  /* Vista premium                                                    */
  /* ---------------------------------------------------------------- */
  if (acceso.esPremium) {
    return (
      <div className="mx-auto max-w-md px-5 py-8">
        <header>
          <p className="ra-kicker">Premium</p>
          <h1 className="ra-titulo mt-2">{estado === 'ok' ? 'Ya está' : 'Premium activo'}</h1>
          <p className="ra-entradilla">
            {estado === 'ok'
              ? 'Todas las herramientas están desbloqueadas. Gracias por confiar.'
              : 'Todas las herramientas están desbloqueadas.'}
          </p>
        </header>

        <section className="ra-card mt-6 px-5 py-5">
          <p className="text-sm text-ra-texto-sec">
            {acceso.expiraEn === null
              ? 'Acceso sin fecha de fin.'
              : acceso.cancelaAlFinal
                ? `Cancelado. Conservas el acceso hasta el ${fechaLarga(acceso.expiraEn)}.`
                : `Se renueva el ${fechaLarga(acceso.expiraEn)}.`}
          </p>
          {acceso.tieneCliente && (
            <div className="mt-4">
              <BotonPortal />
            </div>
          )}
        </section>

        <Link href="/app" className="ra-boton mt-6">
          Ir a mi racha
        </Link>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Vista gratuita: la oferta                                        */
  /* ---------------------------------------------------------------- */
  const { data: perfil } =
    bienvenida === '1' ? await supabase.from('profiles').select('plan').maybeSingle() : { data: null };
  const plan = (perfil?.plan ?? null) as { fecha_objetivo?: string } | null;
  const fechaObjetivo =
    typeof plan?.fecha_objetivo === 'string'
      ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(
          new Date(plan.fecha_objetivo),
        )
      : null;

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <p className="ra-kicker">{bienvenida === '1' ? 'Tu plan está creado' : 'Elige cómo seguir'}</p>
        <h1 className="ra-titulo mt-2">
          {bienvenida === '1' ? 'Un último paso' : 'Gratis o Premium'}
        </h1>
        <p className="ra-entradilla">
          {fechaObjetivo !== null
            ? `Objetivo: control del deseo antes del ${fechaObjetivo}. Elige con qué herramientas.`
            : 'Las dos versiones registran tu racha. La diferencia está en lo que haces con una recaída.'}
        </p>
      </header>

      {estado === 'cancelado' && (
        <p className="ra-card mt-5 px-5 py-4 text-sm text-ra-texto-sec">
          No se ha realizado ningún cargo. Puedes seguir en gratis o volver a intentarlo.
        </p>
      )}
      {avisoSesion !== null && estado === 'ok' && (
        <p className="ra-card mt-5 px-5 py-4 text-sm text-ra-texto-sec">
          El pago se ha recibido y el acceso se activará en unos segundos. Si no aparece, recarga
          esta página.
        </p>
      )}

      {/* Comparativa */}
      <section className="ra-card mt-6 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-ra-borde px-5 py-3 text-[11px] font-bold tracking-wider uppercase">
          <span className="text-ra-texto-tenue">Incluye</span>
          <span className="w-16 text-center text-ra-texto-tenue">Gratis</span>
          <span className="w-16 text-center text-ra-rojo">Premium</span>
        </div>
        <ul>
          {FILAS.map((r) => (
            <li
              key={r.f}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-ra-borde-suave px-5 py-3 last:border-0"
            >
              <span className="text-sm text-ra-texto">{r.f}</span>
              <span className="w-16 text-center">
                <Celda v={r.gratis} />
              </span>
              <span className="w-16 text-center">
                <Celda v={r.premium} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Las dos opciones, mismo peso */}
      <div className="mt-6 grid gap-3">
        <section
          className="ra-card px-5 py-5"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 55%, transparent)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ra-kicker">Premium</p>
              <p className="mt-1 font-titular text-2xl font-bold text-ra-texto">
                {PRECIO_PREMIUM_TEXTO}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ra-rojo text-white">
              <IconoCandado tamano={18} />
            </span>
          </div>
          <p className="mt-3 text-sm text-ra-texto-sec">
            Todas las herramientas del método. Sin permanencia: cancelas cuando quieras desde
            Perfil.
          </p>
          <div className="mt-5">
            <BotonSuscribirse texto="Empezar con Premium" />
          </div>
        </section>

        <section className="ra-card px-5 py-5">
          <p className="ra-kicker">Gratis</p>
          <p className="mt-1 font-titular text-2xl font-bold text-ra-texto">0 USD</p>
          <p className="mt-3 text-sm text-ra-texto-sec">
            Contador hasta 30 días, check-in, registro de recaídas y las masterclasses.
          </p>
          <Link href="/app" className="ra-boton-sec mt-5">
            Seguir con la versión gratuita
          </Link>
        </section>
      </div>

      <p className="mt-6 text-center text-xs text-ra-texto-tenue">
        Pago seguro con Stripe. Puedes cambiar de plan en cualquier momento.
      </p>
    </div>
  );
}
