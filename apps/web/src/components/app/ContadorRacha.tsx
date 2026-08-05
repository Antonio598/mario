'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  dias: number;
  record: number;
  diasTotales: number;
}

/** Circunferencia del anillo. r = 88, así que 2·π·88 ≈ 553. */
const CIRCUNFERENCIA = 553;

const HITOS = [7, 21, 30, 90, 180, 365] as const;

/**
 * Cuenta desde cero hasta el valor final al montar.
 *
 * Usa `requestAnimationFrame` y no un `setInterval`: el navegador sincroniza
 * cada paso con el refresco de pantalla, así que no hay saltos ni fotogramas
 * perdidos, y se detiene solo cuando la pestaña pasa a segundo plano.
 *
 * Respeta `prefers-reduced-motion`: quien lo tenga activado ve el número final
 * directamente, sin animación.
 */
function useCuentaAtras(destino: number, duracion = 900): number {
  const [valor, setValor] = useState(destino);
  const yaAnimado = useRef(false);

  useEffect(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido || yaAnimado.current || destino === 0) {
      setValor(destino);
      return;
    }
    yaAnimado.current = true;

    let frame = 0;
    const inicio = performance.now();

    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / duracion, 1);
      // Desaceleración cúbica: arranca rápido y frena al final, que es como se
      // percibe natural un contador.
      const suave = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(destino * suave));
      if (t < 1) frame = requestAnimationFrame(paso);
    };

    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [destino, duracion]);

  return valor;
}

/**
 * Contador de racha: el elemento central de la app.
 *
 * El anillo avanza hacia el siguiente hito (7, 21, 30, 90, 180, 365 días) en
 * vez de hacia una meta fija. Una barra hacia "365" pasaría tres semanas sin
 * moverse de forma perceptible, que es justo cuando más falta hace ver avance.
 */
export function ContadorRacha({ dias, record, diasTotales }: Props) {
  const mostrado = useCuentaAtras(dias);

  const siguienteHito = HITOS.find((h) => h > dias) ?? null;
  const hitoAnterior = [...HITOS].reverse().find((h) => h <= dias) ?? 0;

  const progreso =
    siguienteHito === null ? 1 : (dias - hitoAnterior) / (siguienteHito - hitoAnterior);

  return (
    <div className="mg-entrada flex flex-col items-center">
      <div className="relative">
        {/* Halo que respira, detrás del anillo. Da vida sin reclamar atención. */}
        <div
          aria-hidden="true"
          className="mg-halo absolute inset-0 rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(211,47,47,0.35), transparent 65%)',
          }}
        />

        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true" className="relative">
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke="var(--color-mg-negro-borde)"
            strokeWidth="6"
          />
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke="var(--color-mg-rojo)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
            className="mg-anillo"
            // Empieza arriba, no a las tres en punto, que es donde SVG sitúa el
            // ángulo cero.
            transform="rotate(-90 110 110)"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/*
            `tabular-nums` fija el ancho de los dígitos. Sin ello, mientras el
            número sube de 9 a 10 el texto se desplaza y la animación parece un
            fallo de renderizado.
          */}
          <span className="font-titular text-6xl leading-none font-bold tabular-nums sm:text-7xl">
            {mostrado}
          </span>
          <span className="mt-1 text-xs tracking-[0.2em] text-mg-gris-tenue uppercase">
            {dias === 1 ? 'día' : 'días'}
          </span>
        </div>
      </div>

      {siguienteHito !== null && (
        <p className="mg-aparecer mt-5 text-sm text-mg-gris-texto">
          <span className="text-mg-blanco">{siguienteHito - dias}</span>{' '}
          {siguienteHito - dias === 1 ? 'día' : 'días'} para los {siguienteHito}
        </p>
      )}

      <dl className="mg-escalonado mt-8 grid w-full max-w-xs grid-cols-2 gap-px overflow-hidden rounded-lg border border-mg-negro-borde bg-mg-negro-borde">
        <div className="bg-mg-negro-elevado px-4 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Récord</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{record}</dd>
        </div>
        <div className="bg-mg-negro-elevado px-4 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Totales</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{diasTotales}</dd>
        </div>
      </dl>
    </div>
  );
}
