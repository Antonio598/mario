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
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const total = diasDelMes(anio, mes);
  const primerDiaISO = `${anio}-${String(mes).padStart(2, '0')}-01`;
  // Huecos antes del día 1 para que caiga en su columna de la semana.
  const desplazamiento = diaSemanaLunes(primerDiaISO);

  // No se navega al futuro: un mes que aún no ha llegado siempre estará vacío.
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;

  return (
    <section>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => moverMes(-1)}
          aria-label="Mes anterior"
          className="mg-pulsable min-h-[44px] px-3 text-xl text-ra-rojo"
        >
          ‹
        </button>

        <h2 className="font-titular text-base font-bold tracking-wider text-ra-texto uppercase">
          {nombreMes(mes)} {anio}
        </h2>

        <button
          type="button"
          onClick={() => moverMes(1)}
          disabled={esMesActual}
          aria-label="Mes siguiente"
          className="mg-pulsable min-h-[44px] px-3 text-xl text-ra-rojo disabled:opacity-25"
        >
          ›
        </button>
      </div>

      <div
        className={`mt-3 grid grid-cols-7 gap-1.5 transition-opacity ${
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
            'flex aspect-square flex-col items-center justify-center rounded-lg text-xs tabular-nums';

          if (registro?.estado === 'en_racha') {
            return (
              <div
                key={iso}
                title={`${dia} · día completado`}
                className={`${base} font-semibold text-ra-texto`}
              >
                {dia}
                <span aria-hidden="true" className="text-[13px] leading-none text-ra-exito">
                  ✓
                </span>
              </div>
            );
          }

          if (registro?.estado === 'recaida') {
            // Botón y no div: tocar un día de recaída abre su ficha, y un
            // elemento pulsable debe serlo también para el teclado y para un
            // lector de pantalla.
            return (
              <button
                type="button"
                key={iso}
                onClick={() => setAbierta(iso)}
                title={`${dia} · recaída. Ver detalle`}
                aria-label={`Ver el detalle de la recaída del día ${dia}`}
                className={`${base} mg-pulsable font-semibold text-ra-rojo`}
              >
                {dia}
                <span aria-hidden="true" className="text-[13px] leading-none">
                  ✕
                </span>
              </button>
            );
          }

          return (
            <div
              key={iso}
              title={`${dia} · sin registro`}
              className={`${base} ${esFuturo ? 'text-ra-texto-tenue/40' : 'text-ra-texto-tenue'}`}
            >
              {dia}
              <span aria-hidden="true" className="text-[13px] leading-none opacity-40">
                ○
              </span>
            </div>
          );
        })}
      </div>

      <ul className="mt-6 space-y-2 text-xs">
        {[
          { i: '✓', c: 'text-ra-exito', t: 'Día completado', s: 'Sin porno' },
          { i: '✕', c: 'text-ra-rojo', t: 'Recaída', s: 'Aprende y sigue' },
          { i: '○', c: 'text-ra-texto-tenue', t: 'Sin registro', s: 'Registra tu día' },
        ].map((l) => (
          <li key={l.t} className="flex items-center gap-3">
            <span aria-hidden="true" className={`w-4 text-center ${l.c}`}>
              {l.i}
            </span>
            <span className="text-ra-texto">{l.t}</span>
            <span className="text-ra-texto-tenue">· {l.s}</span>
          </li>
        ))}
      </ul>

      {abierta !== null && (
        <DetalleRecaida fecha={abierta} onCerrar={() => setAbierta(null)} />
      )}
    </section>
  );
}
