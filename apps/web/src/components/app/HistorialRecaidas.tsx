'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fechaLarga } from '@reset-alfa/shared';
import type { Tables } from '@reset-alfa/shared';
import { createClient } from '@/lib/supabase/client';
import {
  LEMA_BITACORA,
  NOMBRE_BITACORA,
  camposRecaida,
  type CampoRecaida,
} from '@/lib/app/preguntas-recaida';
import { IconoCandado } from './Bloqueado';

export interface EntradaHistorial {
  fecha: string;
  relapse_id: string | null;
  racha_anterior: number;
}

type Relapse = Tables<'relapses'>;

/**
 * Bitácora de NOFAP en el calendario.
 *
 * Cada entrada muestra la longitud de la racha que se rompió ese día. Es el
 * dato que da contexto: "20 de mayo · racha anterior de 11 días" cuenta una
 * historia que una fecha suelta no cuenta.
 *
 * PREMIUM: cada entrada se despliega y muestra las nueve respuestas debajo,
 * en la misma pantalla. La ficha en hoja aparte se queda para el calendario;
 * aquí el valor está en leer varias seguidas y ver el patrón.
 *
 * GRATIS: se ve la lista —son sus días, no se esconden— pero las respuestas
 * son de la bitácora, que es Premium. La entrada lleva candado y lleva al
 * paywall.
 *
 * Se muestran cinco y el resto queda tras "Ver todas". Una lista larga de
 * fracasos nada más abrir el calendario es justo lo contrario del tono que
 * busca la app.
 */
export function HistorialRecaidas({
  entradas,
  esPremium,
}: {
  entradas: EntradaHistorial[];
  esPremium: boolean;
}) {
  const [todas, setTodas] = useState(false);

  if (entradas.length === 0) {
    return (
      <section className="mt-10">
        <div className="ra-seccion">
          <h2>{NOMBRE_BITACORA}</h2>
        </div>
        <p className="mt-1 text-xs text-ra-texto-tenue">{LEMA_BITACORA}.</p>
        <p className="ra-card mt-4 px-5 py-6 text-center text-sm text-ra-texto-tenue">
          Todavía no has registrado ninguna recaída. Sigue así.
        </p>
      </section>
    );
  }

  const visibles = todas ? entradas : entradas.slice(0, 5);

  return (
    <section className="mt-10">
      <div className="ra-seccion">
        <h2>{NOMBRE_BITACORA}</h2>

        {entradas.length > 5 && (
          <button
            type="button"
            onClick={() => setTodas((v) => !v)}
            className="shrink-0 text-sm font-semibold text-ra-rojo"
          >
            {todas ? 'Ver menos' : `Ver todas (${entradas.length})`}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-ra-texto-tenue">{LEMA_BITACORA}.</p>

      <ul className="mg-escalonado mt-4 grid gap-2">
        {visibles.map((e) =>
          esPremium ? (
            <EntradaPremium key={e.fecha} entrada={e} />
          ) : (
            <EntradaBloqueada key={e.fecha} entrada={e} />
          ),
        )}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Premium: entrada desplegable con las respuestas                             */
/* -------------------------------------------------------------------------- */

function EntradaPremium({ entrada }: { entrada: EntradaHistorial }) {
  const [abierta, setAbierta] = useState(false);
  const [campos, setCampos] = useState<CampoRecaida[] | null>(null);
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    const siguiente = !abierta;
    setAbierta(siguiente);
    if (!siguiente || campos !== null) return;

    // Las respuestas se cargan al abrir y no con la lista: son datos del
    // art. 9 RGPD y no tiene sentido traer treinta fichas para leer una.
    setCargando(true);
    const supabase = createClient();
    const { data } = await supabase.rpc('detalle_recaida', { p_fecha: entrada.fecha });
    const fila = (data as unknown as Relapse | null) ?? null;
    setCampos(fila === null ? [] : camposRecaida(fila));
    setCargando(false);
  }

  const contestadas = campos?.filter((c) => c.valor !== null) ?? [];

  return (
    <li className="ra-card overflow-hidden">
      <button
        type="button"
        onClick={() => void alternar()}
        aria-expanded={abierta}
        className="mg-pulsable flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-ra-rojo" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ra-texto">{fechaLarga(entrada.fecha)}</span>
          <span className="block text-xs text-ra-texto-tenue">
            Racha anterior: {entrada.racha_anterior}{' '}
            {entrada.racha_anterior === 1 ? 'día' : 'días'}
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-ra-rojo transition-transform ${abierta ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierta && (
        <div className="mg-entrada border-t border-ra-borde-suave px-4 py-4">
          {cargando ? (
            <div className="space-y-3">
              <div className="mg-esqueleto h-4 w-3/4 rounded" />
              <div className="mg-esqueleto h-4 w-1/2 rounded" />
            </div>
          ) : contestadas.length === 0 ? (
            <p className="text-sm text-ra-texto-tenue">
              Ese día se registró la recaída sin rellenar la bitácora.
            </p>
          ) : (
            <dl className="space-y-4">
              {contestadas.map((c) => (
                <div key={c.etiqueta} className="border-l-2 border-ra-borde pl-3">
                  <dt className="text-[11px] font-semibold tracking-widest text-ra-texto-tenue uppercase">
                    {c.etiqueta}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ra-texto">
                    {c.valor}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Gratis: la fecha se ve, las respuestas son Premium                          */
/* -------------------------------------------------------------------------- */

function EntradaBloqueada({ entrada }: { entrada: EntradaHistorial }) {
  return (
    <li>
      <Link
        href="/app/premium?desde=protocolo"
        className="ra-card ra-card-enlace mg-pulsable flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-ra-rojo" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ra-texto">{fechaLarga(entrada.fecha)}</span>
          <span className="block text-xs text-ra-texto-tenue">
            Racha anterior: {entrada.racha_anterior}{' '}
            {entrada.racha_anterior === 1 ? 'día' : 'días'}
          </span>
        </span>
        <span className="ra-chip shrink-0 text-ra-rojo">
          <IconoCandado tamano={11} />
          Premium
        </span>
      </Link>
    </li>
  );
}
