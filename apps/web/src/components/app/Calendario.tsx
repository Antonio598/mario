import { diaSemanaLunes, diasDelMes, nombreMes } from '@reset-alfa/shared';
import type { DiaCalendario } from '@/lib/app/tipos';

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/**
 * Vista mensual con tres estados: completado, recaída y sin registro.
 *
 * ACCESIBILIDAD: los estados NO se distinguen solo por color. Cada celda lleva
 * además una forma —relleno macizo, aspa, hueco— y un `title` legible. Cerca
 * del 8 % de los hombres tiene alguna deficiencia en la visión del rojo y el
 * verde, y esta app es para hombres: un calendario que solo se lee por color
 * sería ilegible para uno de cada doce usuarios.
 *
 * "Sin registro" es un estado con entidad propia, no un error: un día sin
 * marcar NO rompe la racha.
 *
 * Reset Alfa — tema claro.
 */
export function Calendario({ dias }: { dias: DiaCalendario[] }) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth() + 1;

  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const total = diasDelMes(anio, mes);
  const primerDiaISO = `${anio}-${String(mes).padStart(2, '0')}-01`;
  // Huecos antes del día 1 para que caiga en su columna de la semana.
  const desplazamiento = diaSemanaLunes(primerDiaISO);

  return (
    <section className="ra-card px-4 py-5">
      <h2 className="font-titular text-lg font-bold tracking-wider text-ra-negro uppercase">
        {nombreMes(mes)} {anio}
      </h2>

      <div className="mg-aparecer mt-4 grid grid-cols-7 gap-1.5">
        {DIAS_SEMANA.map((d, i) => (
          <div
            key={`${d}-${i}`}
            aria-hidden="true"
            className="pb-1 text-center text-[11px] font-semibold text-ra-texto-tenue"
          >
            {d}
          </div>
        ))}

        {Array.from({ length: desplazamiento }, (_, i) => (
          <div key={`hueco-${i}`} />
        ))}

        {Array.from({ length: total }, (_, i) => {
          const dia = i + 1;
          const iso = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const registro = porFecha.get(iso);
          const esFuturo = new Date(iso) > hoy;

          const base =
            'flex aspect-square items-center justify-center rounded-lg border text-sm tabular-nums font-medium';

          if (registro?.estado === 'en_racha') {
            return (
              <div
                key={iso}
                title={`${dia} · día completado`}
                className={`${base} border-green-200 bg-green-50 font-semibold text-ra-exito`}
              >
                {dia}
              </div>
            );
          }

          if (registro?.estado === 'recaida') {
            return (
              <div
                key={iso}
                title={`${dia} · recaída registrada`}
                className={`${base} relative border-red-200 bg-red-50 font-semibold text-ra-rojo`}
              >
                {dia}
                {/* Aspa: distingue el estado sin depender del color. */}
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-0.5 text-[10px] leading-none"
                >
                  ✕
                </span>
              </div>
            );
          }

          return (
            <div
              key={iso}
              title={`${dia} · sin registro`}
              className={`${base} border-ra-borde-suave ${
                esFuturo ? 'text-ra-texto-tenue/40' : 'text-ra-texto-sec'
              }`}
            >
              {dia}
            </div>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ra-texto-tenue">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-green-200 bg-green-50" />
          Completado
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-red-200 bg-red-50" />
          Recaída
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-ra-borde-suave" />
          Sin registro
        </li>
      </ul>
    </section>
  );
}
