'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fechaLarga } from '@reset-alfa/shared';
import type { Tables } from '@reset-alfa/shared';

type Relapse = Tables<'relapses'>;

/**
 * Ficha de una recaída, abierta desde el calendario.
 *
 * Es el "archivo" que queda guardado: lo que el usuario respondió ese día,
 * consultable meses después. Ahí está el valor real del registro — un contador
 * dice cuánto llevas, esto dice por qué se rompió la vez anterior.
 *
 * Se carga bajo demanda y no con el calendario entero: son datos del art. 9
 * RGPD y no tiene sentido traer treinta fichas para que el usuario mire una.
 */
export function DetalleRecaida({ fecha, onCerrar }: { fecha: string; onCerrar: () => void }) {
  const [datos, setDatos] = useState<Relapse | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc('detalle_recaida', { p_fecha: fecha });
      if (!vivo) return;
      setDatos((data as unknown as Relapse | null) ?? null);
      setCargando(false);
    })();

    return () => {
      vivo = false;
    };
  }, [fecha]);

  const campos: { etiqueta: string; valor: string | null }[] =
    datos === null
      ? []
      : [
          { etiqueta: 'Dónde', valor: datos.lugar },
          { etiqueta: 'Hora', valor: datos.hora },
          { etiqueta: 'Disparador', valor: datos.trigger },
          { etiqueta: 'Acción correctiva', valor: datos.accion_correctiva },
          {
            etiqueta: '¿Ejecutó su P.A.D?',
            valor: datos.ejecuto_pad === null ? null : datos.ejecuto_pad ? 'Sí' : 'No',
          },
          { etiqueta: 'Qué falló', valor: datos.motivo_fallo },
          { etiqueta: 'Ajuste del P.A.D', valor: datos.ajuste_pad },
          { etiqueta: 'Entorno', valor: datos.contexto_ambiental },
          { etiqueta: 'Estado', valor: datos.contexto_emocional },
        ].filter((c) => c.valor !== null && c.valor !== '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Recaída del ${fechaLarga(fecha)}`}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onCerrar}
    >
      {/*
        `stopPropagation` para que un toque dentro de la ficha no la cierre.
        El cierre por toque en el fondo es lo que espera cualquier usuario de
        móvil ante una hoja que sube desde abajo.
      */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mg-subir max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-ra-superficie p-6 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-titular text-[11px] font-semibold tracking-[0.25em] text-ra-rojo uppercase">
              Recaída
            </p>
            <h2 className="mt-1.5 font-titular text-xl font-bold text-ra-texto">
              {fechaLarga(fecha)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="mg-pulsable -mt-1 shrink-0 rounded-md px-3 py-2 text-lg text-ra-texto-tenue"
          >
            ✕
          </button>
        </div>

        {cargando ? (
          <div className="mt-6 space-y-3">
            <div className="mg-esqueleto h-4 w-3/4 rounded" />
            <div className="mg-esqueleto h-4 w-1/2 rounded" />
            <div className="mg-esqueleto h-4 w-2/3 rounded" />
          </div>
        ) : campos.length === 0 ? (
          <p className="mt-6 text-sm text-ra-texto-sec">
            Ese día quedó registrado como recaída, pero no se guardó el detalle del protocolo.
          </p>
        ) : (
          <dl className="mt-6 space-y-4">
            {campos.map((c) => (
              <div key={c.etiqueta}>
                <dt className="text-[11px] font-semibold tracking-widest text-ra-texto-tenue uppercase">
                  {c.etiqueta}
                </dt>
                <dd className="mt-1 text-sm text-ra-texto">{c.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
