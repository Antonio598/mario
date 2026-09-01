'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Pestañas Gratis / Premium de Formación.
 *
 * Van como cliente porque el cambio de pestaña no debe pedir nada al servidor:
 * los dos bloques ya vienen renderizados y alternar entre ellos es instantáneo.
 * Una navegación con `?tab=` daría una espera de red para mostrar contenido que
 * ya está en la página.
 *
 * La pestaña activa arranca en Gratis a propósito: quien todavía no ha comprado
 * es la mayoría, y abrir en Premium le muestra primero una pared de candados.
 */
export function FormacionTabs({ gratis, premium }: { gratis: ReactNode; premium: ReactNode }) {
  const [activa, setActiva] = useState<'gratis' | 'premium'>('gratis');

  return (
    <>
      <div
        role="tablist"
        aria-label="Tipo de contenido"
        className="mt-6 flex rounded-xl border border-ra-borde bg-ra-superficie p-1"
      >
        {/*
          Sin emojis. La pestana activa se distingue por color de fondo y peso
          tipografico, que es lo que se lee de un vistazo; un emoji delante solo
          añade ruido y cambia de forma en cada sistema operativo.
        */}
        {(
          [
            { v: 'gratis', t: 'Gratis' },
            { v: 'premium', t: 'Premium' },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            role="tab"
            aria-selected={activa === o.v}
            onClick={() => setActiva(o.v)}
            className={`mg-pulsable flex min-h-[44px] flex-1 items-center justify-center rounded-lg font-titular text-sm font-bold tracking-[0.1em] uppercase transition-colors ${
              activa === o.v
                ? 'bg-ra-rojo text-white shadow-sm'
                : 'text-ra-texto-tenue hover:text-ra-texto-sec'
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>

      {/*
        Los dos paneles se renderizan siempre y se oculta el inactivo con
        `hidden`. Desmontarlos perdería la posición de scroll y volvería a
        disparar la animación de entrada en cada cambio de pestaña.
      */}
      <div role="tabpanel" hidden={activa !== 'gratis'} className="mg-entrada">
        {gratis}
      </div>
      <div role="tabpanel" hidden={activa !== 'premium'} className="mg-entrada">
        {premium}
      </div>
    </>
  );
}
