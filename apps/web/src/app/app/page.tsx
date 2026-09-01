import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ContadorRacha } from '@/components/app/ContadorRacha';
import { CheckinDiario } from '@/components/app/CheckinDiario';
import { ModalArranque } from '@/components/app/ModalArranque';
import { AjustarRacha } from '@/components/app/AjustarRacha';
import { Logo } from '@/components/app/Logo';
import type { EstadoDiario } from '@/lib/app/tipos';

/**
 * Inicio de la app web — Reset Alfa.
 *
 * Dinámica a propósito: muestra el estado de HOY del usuario, así que no puede
 * cachearse ni prerenderizarse. Es lo contrario de las páginas de artículo, que
 * son estáticas precisamente porque son iguales para todos.
 */
export const dynamic = 'force-dynamic';

/** Mensajes del día — lista fija por ahora; se migrará a Supabase más adelante. */
const MENSAJES = [
  'Cada día que mantienes tu racha recuperas enfoque, energía y respeto por ti mismo.',
  'No estás resistiendo un impulso. Estás construyendo a alguien que ya no lo tiene.',
  'La disciplina no es un castigo. Es la prueba de que te tomas en serio.',
  'El dolor de la disciplina pesa gramos. El del arrepentimiento, toneladas.',
  'Hoy es el día que tu yo del futuro agradecerá.',
  'No se trata de ser perfecto. Se trata de no rendirse.',
  'Tu peor día en racha sigue siendo mejor que tu mejor día en recaída.',
];

function mensajeDelDia(): string {
  // Selecciona un mensaje basado en el día del año, así cambia diariamente
  // pero es consistente para todos los usuarios en el mismo día.
  const hoy = new Date();
  const inicioAnio = new Date(hoy.getFullYear(), 0, 0);
  const diaDelAnio = Math.floor((hoy.getTime() - inicioAnio.getTime()) / 86400000);
  return MENSAJES[diaDelAnio % MENSAJES.length]!;
}

export default async function AppInicioPage() {
  const supabase = await createClient();

  // El servidor calcula la fecha local del usuario a partir de la zona horaria
  // de su perfil. Nunca se usa la del navegador: cambiar el reloj del
  // dispositivo bastaría para inflar la racha.
  const [{ data, error }, { data: cursos }] = await Promise.all([
    supabase.rpc('estado_diario'),
    supabase
      .from('courses')
      .select('id, slug, titulo, descripcion, tipo')
      .eq('publicado', true)
      .eq('tipo', 'gratis')
      .order('orden')
      .limit(4),
  ]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-titular text-2xl text-ra-texto uppercase">No hemos podido cargar tu racha</h1>
        <p className="mt-3 text-sm text-ra-texto-sec">
          Revisa tu conexión y vuelve a intentarlo.
        </p>
      </div>
    );
  }

  const estado = data as unknown as EstadoDiario;
  const masterclasses = cursos ?? [];
  const mensaje = mensajeDelDia();

  // El modal cubre la pantalla mientras falte el check-in del dia. Es una
  // unica pregunta diaria y responderla es el producto: por eso no tiene boton
  // de cerrar.
  return (
    <>
      {estado.necesita_checkin && <ModalArranque estado={estado} />}

    <div className="mx-auto max-w-md px-5 py-6">
      {/* Marca, discreta: el protagonista de esta pantalla es el contador. */}
      <header className="mb-6 flex justify-center">
        <Logo variante="app" alto={44} prioridad />
      </header>

      {/* ── Tarjeta de racha ──────────────────────────────────────────── */}
      <ContadorRacha
        dias={estado.racha_actual}
        record={estado.record_personal}
        diasTotales={estado.dias_totales}
      />

      {/* ── Ajuste manual de la racha ─────────────────────────────────── */}
      <AjustarRacha diasActuales={estado.racha_actual} />

      {/* ── Check-in diario ───────────────────────────────────────────── */}
      <div className="mt-5">
        <CheckinDiario estado={estado} />
      </div>

      {/* ── Mensaje del día ───────────────────────────────────────────── */}
      <div className="ra-card mt-5 flex gap-4 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ra-fondo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M10 8c0-1 .4-3 3-4.5C16 5 16.5 7 16.5 8M7.5 12c0-1.5.6-4 4.5-6.5C16.5 8 17 10.5 17 12"
              stroke="var(--color-ra-rojo)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M5 15c0-2 .8-5 7-9 6.2 4 7 7 7 9s-.8 5-7 7c-6.2-2-7-5-7-7Z"
              stroke="var(--color-ra-rojo)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-titular text-sm font-semibold tracking-wider text-ra-texto uppercase">
            Mensaje del día
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ra-texto-sec">
            {mensaje}
          </p>
        </div>
      </div>

      {/* ── Formación (preview de masterclasses) ──────────────────────── */}
      {masterclasses.length > 0 && (
        <section className="mt-8">
          <div className="ra-seccion">
            <h2>Formación</h2>
            <Link href="/app/formacion">Ver todo →</Link>
          </div>
          <p className="mt-1 text-sm text-ra-texto-tenue">
            Masterclasses y protocolos para transformar tu vida.
          </p>

          {/* Carrusel horizontal */}
          <div className="mt-4 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-none">
            {masterclasses.map((c) => (
              <Link
                key={c.id}
                href={`/app/formacion/${c.slug}`}
                className="ra-card ra-card-enlace mg-pulsable relative flex w-[150px] shrink-0 snap-start flex-col items-center overflow-hidden px-3 pt-7 pb-4 text-center"
              >
                <span className="ra-badge absolute top-0 left-0">Gratis</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ra-fondo">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 17h16M5 17c0-3 2-5.5 7-7 5 1.5 7 4 7 7M12 10V6m0 0l3-3M12 6L9 3"
                      stroke="var(--color-ra-rojo)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="mt-3 font-titular text-xs font-bold leading-tight tracking-wider text-ra-texto uppercase">
                  {c.titulo}
                </h3>
                {c.descripcion !== null && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ra-texto-tenue">
                    {c.descripcion}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {/* Indicadores de carrusel */}
          {masterclasses.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5">
              {masterclasses.map((c, i) => (
                <span
                  key={c.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === 0 ? 'w-5 bg-ra-rojo' : 'w-1.5 bg-ra-borde'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/*
        ── Banner "Recuerda tu misión" ─────────────────────────────────
        El rojo va en hexadecimal fijo y no como token a proposito. Este
        banner llevaba `bg-ra-negro`, y ese token se invierte a #f7f7f7 en modo
        oscuro: la tarjeta se volvia blanca con el texto blanco encima y
        desaparecia. Un fondo de marca que siempre lleva texto blanco no puede
        depender de un token que cambia con el tema.
      */}
      <section className="mt-8 overflow-hidden rounded-2xl bg-[#D32F2F] p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-titular text-sm font-bold tracking-wider text-white uppercase">
              Recuerda tu misión
            </h3>
            {/*
              El negro se reserva para las palabras que sostienen la frase. Si
              se destacara la frase entera dejaria de destacar nada.
            */}
            <p className="mt-1 text-sm leading-relaxed text-white">
              No es solo dejar el porno,{' '}
              <span className="font-bold text-black">es construir al hombre que admiras.</span>
            </p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-white/70"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>
    </div>
    </>
  );
}
