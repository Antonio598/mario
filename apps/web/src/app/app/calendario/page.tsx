import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Calendario } from '@/components/app/Calendario';
import {
  HistorialRecaidas,
  type EntradaHistorial,
} from '@/components/app/HistorialRecaidas';
import { TareaPAD, AccionesPAD } from '@/components/app/PAD';
import { TareaCarta, AccionesCarta } from '@/components/app/CartaAntiRecaida';
import { Logros } from '@/components/app/Logros';
import { leerCarta } from '@/lib/app/carta';
import { obtenerAcceso } from '@/lib/app/acceso';
import { mostrarDias } from '@/lib/app/racha';
import { Bloqueado } from '@/components/app/Bloqueado';
import { BannerPremium } from '@/components/app/BannerPremium';
import type { DiaCalendario, EstadoDiario } from '@/lib/app/tipos';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const supabase = await createClient();

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth() + 1;

  const [
    { data: estadoRaw },
    { data: diasRaw },
    { data: historialRaw },
    { data: perfil },
    { data: plantillas },
    acceso,
  ] = await Promise.all([
    supabase.rpc('estado_diario'),
    supabase.rpc('calendario_mes', { p_anio: anio, p_mes: mes }),
    supabase.rpc('historial_recaidas', { p_limite: 50 }),
    supabase.from('profiles').select('pad, carta').maybeSingle(),
    // Para el logro "plantilla rellenada": una fila en `relapses` no basta,
    // porque "registrar solo el día" también crea una fila, toda en nulo.
    // Cuenta solo las que tienen al menos una respuesta.
    supabase
      .from('relapses')
      .select('lugar, trigger, accion_correctiva, ejecuto_pad, motivo_fallo, ajuste_pad, contexto_ambiental, contexto_emocional')
      .limit(100),
    obtenerAcceso(),
  ]);

  const { esPremium } = acceso;
  const pad = perfil?.pad ?? null;
  const carta = leerCarta(perfil?.carta);
  const plantillasRellenadas = (plantillas ?? []).filter((r) =>
    Object.values(r).some((v) => v !== null && v !== ''),
  ).length;

  const estado = estadoRaw as unknown as EstadoDiario | null;
  const dias = (diasRaw ?? []) as unknown as DiaCalendario[];
  const historial = (historialRaw ?? []) as unknown as EntradaHistorial[];

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <p className="ra-kicker">Tu registro</p>
        <h1 className="ra-titulo mt-2">Calendario</h1>
        <p className="ra-entradilla">Tu racha, tu historia, tu transformación.</p>
      </header>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {/*
          Sin emoji en la primera. Tenia una llama y las otras dos no, asi que
          la fila se leia como si midieran cosas distintas cuando son la misma
          unidad; y un emoji cambia de forma en cada sistema operativo.
        */}
        {[
          { t: 'Racha actual', v: mostrarDias(estado?.racha_actual ?? 0, esPremium) },
          { t: 'Récord personal', v: mostrarDias(estado?.record_personal ?? 0, esPremium) },
          { t: 'Días totales', v: String(estado?.dias_totales ?? 0) },
        ].map((s) => (
          <div key={s.t} className="ra-card px-2 py-4 text-center">
            <dt className="text-[10px] leading-tight font-semibold tracking-wider text-ra-texto-tenue uppercase">
              {s.t}
            </dt>
            <dd className="mt-1.5">
              <span className="font-titular text-2xl font-bold tabular-nums text-ra-texto">
                {s.v}
              </span>
              <span className="ml-1 text-[10px] text-ra-texto-tenue">días</span>
            </dd>
          </div>
        ))}
      </dl>

      {/*
        El P.A.D vive también aquí porque el calendario es donde se revisan las
        recaídas, y cada ficha pregunta si se ejecutó. Con P.A.D: recordarlo y
        poder cambiarlo. Sin él: la misma tarea pendiente que en Inicio.
      */}
      <div className="mt-6">
        {pad !== null ? (
          <AccionesPAD pad={pad} bloqueado={!esPremium} />
        ) : esPremium ? (
          <TareaPAD />
        ) : (
          <Bloqueado
            titulo="Tu P.A.D"
            texto="La acción concreta que ejecutas cuando aparece el deseo."
            desde="pad"
          >
            <TareaPAD />
          </Bloqueado>
        )}
      </div>
      <div className="mt-3">
        {carta !== null ? (
          <AccionesCarta carta={carta} bloqueado={!esPremium} />
        ) : esPremium ? (
          <TareaCarta />
        ) : (
          <Bloqueado
            titulo="Tu carta anti-recaída"
            texto="Un mensaje de ti para ti, para el momento de la tentación."
            desde="carta"
          >
            <TareaCarta />
          </Bloqueado>
        )}
      </div>
      <div className="mt-3">
        <BannerPremium desde="calendario" />
      </div>

      <div className="mt-8">
        <Calendario
          diasIniciales={dias}
          anioInicial={anio}
          mesInicial={mes}
          esPremium={esPremium}
        />
      </div>

      {/*
        Con al menos una recaida, la landing de recaida queda accesible desde
        aqui: el video y las herramientas no son solo para el momento en que
        se registra.
      */}
      {historial.length > 0 && (
        <Link
          href="/app/hito/recaida"
          className="ra-card ra-card-enlace mg-pulsable mt-6 flex items-center gap-4 px-5 py-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="ra-kicker">Después de una recaída</span>
            <span className="mt-0.5 block text-sm text-ra-texto">
              Qué hacer para que la próxima no te pille sin plan.
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-ra-rojo">
            →
          </span>
        </Link>
      )}

      <Logros
        datos={{
          record: estado?.record_personal ?? 0,
          diasTotales: estado?.dias_totales ?? 0,
          tienePad: pad !== null,
          tieneCarta: carta !== null,
          plantillasRellenadas,
          esPremium,
        }}
      />

      <HistorialRecaidas entradas={historial} esPremium={esPremium} />

      {/* Cierra la pantalla reencuadrando, no contabilizando fracasos. */}
      <blockquote className="ra-card mt-10 px-5 py-5">
        <p className="text-sm leading-relaxed text-ra-texto-sec">
          <span aria-hidden="true" className="mr-1 text-lg text-ra-rojo">
            “
          </span>
          No se trata de nunca caer, sino de levantarte cada vez más fuerte.
        </p>
      </blockquote>
    </div>
  );
}
