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
    <section>
      <h2 className="font-titular text-lg tracking-wider uppercase">
        {nombreMes(mes)} {anio}
      </h2>

      <div className="mg-aparecer mt-4 grid grid-cols-7 gap-1.5">
        {DIAS_SEMANA.map((d, i) => (
          <div
            key={`${d}-${i}`}
            aria-hidden="true"
            className="pb-1 text-center text-[11px] text-mg-gris-apagado"
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
            'flex aspect-square items-center justify-center rounded-md border text-sm tabular-nums';

          if (registro?.estado === 'en_racha') {
            return (
              <div
                key={iso}
                title={`${dia} · día completado`}
                className={`${base} border-mg-exito bg-mg-exito/20 font-semibold text-mg-exito`}
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
                className={`${base} relative border-mg-recaida bg-mg-recaida/15 font-semibold text-mg-recaida`}
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
              className={`${base} border-mg-negro-borde-suave ${
                esFuturo ? 'text-mg-gris-apagado/40' : 'text-mg-gris-apagado'
              }`}
            >
              {dia}
            </div>
          );
        })}
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mg-gris-tenue">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-mg-exito bg-mg-exito/20" />
          Completado
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-mg-recaida bg-mg-recaida/15" />
          Recaída
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-mg-negro-borde-suave" />
          Sin registro
        </li>
      </ul>
    </section>
  );
}
