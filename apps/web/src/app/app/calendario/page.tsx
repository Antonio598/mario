import { createClient } from '@/lib/supabase/server';
import { Calendario } from '@/components/app/Calendario';
import type { DiaCalendario, EstadoDiario } from '@/lib/app/tipos';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [{ data: estadoRaw }, { data: diasRaw }] = await Promise.all([
    supabase.rpc('estado_diario'),
    supabase.rpc('calendario_mes', {
      p_anio: new Date().getFullYear(),
      p_mes: new Date().getMonth() + 1,
    }),
  ]);

  const estado = estadoRaw as unknown as EstadoDiario | null;
  const dias = (diasRaw ?? []) as unknown as DiaCalendario[];

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <header>
        <p className="font-titular text-xs font-semibold tracking-[0.2em] text-ra-rojo uppercase">
          Historial
        </p>
        <h1 className="mt-2 font-titular text-3xl font-bold text-ra-negro uppercase">
          Calendario
        </h1>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="ra-card px-3 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Racha
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-negro">
            {estado?.racha_actual ?? 0}
          </p>
        </div>
        <div className="ra-card px-3 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Récord
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-negro">
            {estado?.record_personal ?? 0}
          </p>
        </div>
        <div className="ra-card px-3 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Totales
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-negro">
            {estado?.dias_totales ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Calendario dias={dias} />
      </div>
    </div>
  );
}
