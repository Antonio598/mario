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
    <div className="mx-auto max-w-md px-5 py-10">
      <header>
        <p className="mg-kicker">Historial</p>
        <h1 className="mt-2 text-3xl">Calendario</h1>
      </header>

      <dl className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-mg-negro-borde bg-mg-negro-borde">
        <div className="bg-mg-negro-elevado px-3 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Racha</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{estado?.racha_actual ?? 0}</dd>
        </div>
        <div className="bg-mg-negro-elevado px-3 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Récord</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">
            {estado?.record_personal ?? 0}
          </dd>
        </div>
        <div className="bg-mg-negro-elevado px-3 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Totales</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{estado?.dias_totales ?? 0}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <Calendario dias={dias} />
      </div>
    </div>
  );
}
