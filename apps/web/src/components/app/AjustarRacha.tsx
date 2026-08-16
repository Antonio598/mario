'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Ajuste manual de los días de racha.
 *
 * Quien lleva meses sin porno no empieza en cero al instalar la app. Sin esto,
 * el primer contacto con el producto es perder su progreso real, y la app se
 * desinstala el mismo día.
 *
 * El servidor no escribe el contador: recalcula `fecha_inicio` hacia atrás. Así
 * el número sigue siendo una diferencia de fechas y no puede desincronizarse
 * después.
 */
export function AjustarRacha({ diasActuales }: { diasActuales: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState(String(diasActuales));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    const n = Number(dias);

    if (!Number.isInteger(n) || n < 0 || n > 3650) {
      setError('Introduce un número entre 0 y 3650.');
      return;
    }

    setError(null);
    setGuardando(true);

    const supabase = createClient();
    const { error: err } = await supabase.rpc('ajustar_racha', { p_dias: n });

    setGuardando(false);

    if (err) {
      setError('No hemos podido guardarlo. Inténtalo de nuevo.');
      return;
    }

    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-3 w-full text-center text-xs text-ra-texto-tenue underline underline-offset-4"
      >
        Ajustar mis días de racha
      </button>
    );
  }

  return (
    <div className="ra-card mg-entrada mt-4 px-5 py-5">
      <h3 className="font-titular text-base font-bold text-ra-texto">Ajustar la racha</h3>
      <p className="mt-1.5 text-xs text-ra-texto-sec">
        ¿Cuántos días llevas ya? Si empezaste antes de instalar la app, ponlo aquí.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={3650}
          value={dias}
          onChange={(e) => setDias(e.target.value)}
          aria-label="Días de racha"
          className="w-28 rounded-md border border-ra-borde bg-ra-fondo px-4 py-3 text-center font-titular text-2xl font-bold tabular-nums text-ra-texto"
        />
        <span className="text-sm text-ra-texto-sec">días</span>
      </div>

      {error !== null && <p className="mt-3 text-xs text-ra-rojo">{error}</p>}

      <p className="mt-3 text-xs text-ra-texto-tenue">
        Tu récord y tus días totales se recalculan solos.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setDias(String(diasActuales));
            setError(null);
          }}
          className="mg-pulsable min-h-[44px] flex-1 rounded-md border border-ra-borde text-sm text-ra-texto-sec"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          className="mg-pulsable min-h-[44px] flex-1 rounded-md bg-ra-rojo text-sm font-bold tracking-wider text-white uppercase disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
