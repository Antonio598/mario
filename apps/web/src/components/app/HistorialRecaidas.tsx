'use client';

import { useState } from 'react';
import { fechaLarga } from '@reset-alfa/shared';
import { DetalleRecaida } from './DetalleRecaida';

export interface EntradaHistorial {
  fecha: string;
  relapse_id: string | null;
  racha_anterior: number;
}

/**
 * Historial de recaídas.
 *
 * Cada entrada muestra la longitud de la racha que se rompió ese día. Es el
 * dato que da contexto: "20 de mayo · racha anterior de 11 días" cuenta una
 * historia que una fecha suelta no cuenta.
 *
 * Se muestran cinco y el resto queda tras "Ver todas". Una lista larga de
 * fracasos nada más abrir el calendario es justo lo contrario del tono que
 * busca la app.
 */
export function HistorialRecaidas({ entradas }: { entradas: EntradaHistorial[] }) {
  const [todas, setTodas] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);

  if (entradas.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="font-titular text-base font-bold text-ra-texto">Historial de recaídas</h2>
        <p className="mt-3 text-sm text-ra-texto-tenue">
          Todavía no has registrado ninguna. Sigue así.
        </p>
      </section>
    );
  }

  const visibles = todas ? entradas : entradas.slice(0, 5);

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <h2 className="font-titular text-base font-bold text-ra-texto">Historial de recaídas</h2>

        {entradas.length > 5 && (
          <button
            type="button"
            onClick={() => setTodas((v) => !v)}
            className="text-xs font-semibold text-ra-rojo"
          >
            {todas ? 'Ver menos' : `Ver todas (${entradas.length})`}
          </button>
        )}
      </div>

      <ul className="mg-escalonado mt-4 grid gap-2">
        {visibles.map((e) => (
          <li key={e.fecha}>
            <button
              type="button"
              onClick={() => setAbierta(e.fecha)}
              className="ra-card mg-pulsable flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span aria-hidden="true" className="text-base text-ra-rojo">
                ✕
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ra-texto">
                  {fechaLarga(e.fecha)}
                </span>
                <span className="block text-xs text-ra-texto-tenue">
                  Racha anterior: {e.racha_anterior}{' '}
                  {e.racha_anterior === 1 ? 'día' : 'días'}
                </span>
              </span>

              <span className="shrink-0 text-xs font-semibold text-ra-rojo">Ver detalles ›</span>
            </button>
          </li>
        ))}
      </ul>

      {abierta !== null && (
        <DetalleRecaida fecha={abierta} onCerrar={() => setAbierta(null)} />
      )}
    </section>
  );
}
