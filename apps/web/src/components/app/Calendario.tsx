'use client';

import { useEffect, useState } from 'react';
import { diaSemanaLunes, diasDelMes, nombreMes } from '@reset-alfa/shared';
import { createClient } from '@/lib/supabase/client';
import { DetalleRecaida } from './DetalleRecaida';
import type { DiaCalendario } from '@/lib/app/tipos';

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const;

interface Props {
  /** Días del mes actual, ya cargados en el servidor para el primer pintado. */
  diasIniciales: DiaCalendario[];
  anioInicial: number;
  mesInicial: number;
}

/**
 * Vista mensual con tres estados: completado, recaída y sin registro.
 *
 * ACCESIBILIDAD: los estados NO se distinguen solo por color. Cada celda lleva
 * un icono propio —✓, ✕, ○— y una etiqueta legible. Cerca del 8 % de los
 * hombres tiene alguna deficiencia en la visión del rojo y el verde, y esta app
 * es para hombres: un calendario que solo se lee por color sería ilegible para
 * uno de cada doce usuarios.
 *
 * "Sin registro" es un estado con entidad propia, no un error: un día sin
 * marcar NO rompe la racha.
 */
export function Calendario({ diasIniciales, anioInicial, mesInicial }: Props) {
  const [anio, setAnio] = useState(anioInicial);
  const [mes, setMes] = useState(mesInicial);
  const [dias, setDias] = useState(diasIniciales);
  const [cargando, setCargando] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);

  // El mes inicial ya viene del servidor: solo se pide al cambiar de mes, para
  // no repetir en el cliente la consulta que ya trajo el primer pintado.
  useEffect(() => {
    if (anio === anioInicial && mes === mesInicial) {
      setDias(diasIniciales);
      return;
    }

    let vivo = true;
    setCargando(true);

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc('calendario_mes', { p_anio: anio, p_mes: mes });
      if (!vivo) return;
      setDias((data ?? []) as unknown as DiaCalendario[]);
      setCargando(false);
    })();

    return () => {
      vivo = false;
    };
  }, [anio, mes, anioInicial, mesInicial, diasIniciales]);

  function moverMes(delta: number) {
    const d = new Date(anio, mes - 1 + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth() + 1);
  }

  const hoy = new Date();
  /*
    Fecha de hoy en formato ISO local. `toISOString()` no vale: convierte a UTC,
    y a partir de las 22:00 en Espana devolveria ya el dia siguiente, marcando
    el anillo en la casilla equivocada.
  */
  const isoHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
    hoy.getDate(),
  ).padStart(2, '0')}`;
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const total = diasDelMes(anio, mes);
  const primerDiaISO = `${anio}-${String(mes).padStart(2, '0')}-01`;
  // Huecos antes del día 1 para que caiga en su columna de la semana.
  const desplazamiento = diaSemanaLunes(primerDiaISO);

  // No se navega al futuro: un mes que aún no ha llegado siempre estará vacío.
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;

  /* Flechas de mes: mismo boton redondo a los dos lados del titulo. */
  const flecha =
    'mg-pulsable flex h-10 w-10 items-center justify-center rounded-full border border-ra-borde text-ra-rojo transition-colors hover:border-ra-rojo disabled:opacity-25 disabled:hover:border-ra-borde';

  /*
    Menos margen lateral en movil. Con `px-4` y `gap-1.5`, en un telefono de 390
    px cada casilla quedaba en 40 px: por debajo del minimo de 44 que hace falta
    para acertar con el pulgar, y los dias de recaida son pulsables.
  */
  return (
    <section className="ra-card px-2 py-5 sm:px-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => moverMes(-1)}
          aria-label="Mes anterior"
          className={flecha}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18 9 12l6-6" />
          </svg>
        </button>

        <h2 className="font-titular text-base font-bold tracking-[0.12em] text-ra-texto uppercase">
          {nombreMes(mes)} {anio}
        </h2>

        <button
          type="button"
          onClick={() => moverMes(1)}
          disabled={esMesActual}
          aria-label="Mes siguiente"
          className={flecha}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        className={`mt-3 grid grid-cols-7 gap-1 transition-opacity sm:gap-1.5 ${
          cargando ? 'opacity-40' : 'opacity-100'
        }`}
      >
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            aria-hidden="true"
            className="pb-1 text-center text-[10px] font-semibold tracking-wider text-ra-texto-tenue"
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
            'relative flex aspect-square items-center justify-center rounded-xl text-xs font-semibold tabular-nums transition-colors';

          // El dia de hoy se marca con un anillo. Sin el, en un mes a medio
          // registrar no hay forma de situarse de un vistazo.
          const esHoy = iso === isoHoy;
          const anillo = esHoy ? ' ring-2 ring-ra-rojo ring-offset-2 ring-offset-ra-superficie' : '';

          if (registro?.estado === 'en_racha') {
            return (
              <div
                key={iso}
                title={`${dia} - dia completado`}
                className={`${base}${anillo} text-ra-exito`}
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-ra-exito) 16%, transparent)',
                }}
              >
                {dia}
              </div>
            );
          }

          if (registro?.estado === 'recaida') {
            // Boton y no div: tocar un dia de recaida abre su ficha, y un
            // elemento pulsable debe serlo tambien para el teclado y para un
            // lector de pantalla.
            return (
              <button
                type="button"
                key={iso}
                onClick={() => setAbierta(iso)}
                title={`${dia} - recaida. Ver detalle`}
                aria-label={`Ver el detalle de la recaída del día ${dia}`}
                className={`${base}${anillo} mg-pulsable text-white`}
                style={{ backgroundColor: 'var(--color-ra-rojo)' }}
              >
                {dia}
              </button>
            );
          }

          return (
            <div
              key={iso}
              title={`${dia} - sin registro`}
              className={`${base}${anillo} font-normal ${
                esFuturo ? 'text-ra-texto-tenue/40' : 'text-ra-texto-tenue'
              }`}
              style={
                esFuturo
                  ? undefined
                  : { backgroundColor: 'var(--color-ra-borde-suave)' }
              }
            >
              {dia}
            </div>
          );
        })}
      </div>

      <ul className="mt-6 grid grid-cols-3 gap-2 text-[11px]">
        {[
          {
            t: 'Completado',
            fondo: 'color-mix(in srgb, var(--color-ra-exito) 16%, transparent)',
            color: 'var(--color-ra-exito)',
          },
          { t: 'Recaída', fondo: 'var(--color-ra-rojo)', color: '#fff' },
          {
            t: 'Sin registro',
            fondo: 'var(--color-ra-borde-suave)',
            color: 'var(--color-ra-texto-tenue)',
          },
        ].map((l) => (
          <li key={l.t} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-5 w-5 shrink-0 rounded-md"
              style={{ backgroundColor: l.fondo, border: `1px solid ${l.color}22` }}
            />
            <span className="text-ra-texto-tenue">{l.t}</span>
          </li>
        ))}
      </ul>

      {abierta !== null && (
        <DetalleRecaida fecha={abierta} onCerrar={() => setAbierta(null)} />
      )}
    </section>
  );
}
