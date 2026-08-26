import { createClient } from '@/lib/supabase/server';
import { Calendario } from '@/components/app/Calendario';
import {
  HistorialRecaidas,
  type EntradaHistorial,
} from '@/components/app/HistorialRecaidas';
import type { DiaCalendario, EstadoDiario } from '@/lib/app/tipos';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const supabase = await createClient();

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth() + 1;

  const [{ data: estadoRaw }, { data: diasRaw }, { data: historialRaw }] = await Promise.all([
    supabase.rpc('estado_diario'),
    supabase.rpc('calendario_mes', { p_anio: anio, p_mes: mes }),
    supabase.rpc('historial_recaidas', { p_limite: 50 }),
  ]);

  const estado = estadoRaw as unknown as EstadoDiario | null;
  const dias = (diasRaw ?? []) as unknown as DiaCalendario[];
  const historial = (historialRaw ?? []) as unknown as EntradaHistorial[];

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <header>
        <h1 className="font-titular text-3xl font-bold text-ra-texto">Calendario</h1>
        <p className="mt-1 text-sm text-ra-texto-tenue">
          Tu racha, tu historia, tu transformación.
        </p>
      </header>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[
          { t: 'Racha actual', v: estado?.racha_actual ?? 0, icono: '🔥' },
          { t: 'Récord personal', v: estado?.record_personal ?? 0, icono: null },
          { t: 'Días totales', v: estado?.dias_totales ?? 0, icono: null },
        ].map((s) => (
          <div key={s.t} className="ra-card px-3 py-3 text-center">
            <dt className="text-[9px] font-semibold tracking-widest text-ra-texto-tenue uppercase">
              {s.t}
            </dt>
            <dd className="mt-1 flex items-center justify-center gap-1">
              {s.icono !== null && (
                <span aria-hidden="true" className="text-sm">
                  {s.icono}
                </span>
              )}
              <span className="font-titular text-2xl font-bold tabular-nums text-ra-texto">
                {s.v}
              </span>
              <span className="text-[10px] text-ra-texto-tenue">días</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <Calendario diasIniciales={dias} anioInicial={anio} mesInicial={mes} />
      </div>

      <HistorialRecaidas entradas={historial} />

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
