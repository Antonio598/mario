'use client';

import { useEffect, useState } from 'react';

type Tema = 'dark' | 'light';

/**
 * Script que fija el tema ANTES de que el navegador pinte nada.
 *
 * Va como etiqueta `<script>` en el `<head>`, no dentro de un componente de
 * React. Un componente se hidrata después del primer pintado, y para entonces
 * el usuario ya habría visto un fogonazo blanco antes de que el tema oscuro se
 * aplicara. En una app que se abre de noche, ese fogonazo es lo que hace que se
 * cierre.
 *
 * Por defecto oscuro, tanto si no hay preferencia guardada como si algo falla.
 */
export const SCRIPT_TEMA = `
(function(){
  try {
    var t = localStorage.getItem('ra-tema');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export function InterruptorTema() {
  const [tema, setTema] = useState<Tema>('dark');

  // Lee lo que el script del head ya dejó puesto, en vez de volver a decidirlo:
  // dos fuentes de verdad para lo mismo acaban discrepando.
  useEffect(() => {
    const actual = document.documentElement.getAttribute('data-theme');
    setTema(actual === 'light' ? 'light' : 'dark');
  }, []);

  function cambiar(nuevo: Tema) {
    setTema(nuevo);
    document.documentElement.setAttribute('data-theme', nuevo);
    try {
      localStorage.setItem('ra-tema', nuevo);
    } catch {
      // Modo incógnito o almacenamiento lleno: el tema se aplica igual, solo
      // que no se recuerda en la próxima visita.
    }
  }

  return (
    <div className="ra-card flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm text-ra-texto">Apariencia</p>
        <p className="mt-0.5 text-xs text-ra-texto-tenue">
          El modo oscuro cansa menos de noche.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Apariencia"
        className="flex shrink-0 overflow-hidden rounded-md border border-ra-borde"
      >
        {(
          [
            { v: 'dark', t: 'Oscuro' },
            { v: 'light', t: 'Claro' },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={tema === o.v}
            onClick={() => cambiar(o.v)}
            className={`min-h-[40px] px-4 text-xs font-semibold tracking-wider uppercase transition-colors ${
              tema === o.v
                ? 'bg-ra-rojo text-white'
                : 'text-ra-texto-tenue hover:text-ra-texto'
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}
