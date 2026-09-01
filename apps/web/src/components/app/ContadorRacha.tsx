'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  dias: number;
  record: number;
  diasTotales: number;
}

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
 * Contador de racha — tarjeta rectangular con casco espartano.
 *
 * Diseño inspirado en la referencia de Reset Alfa: número grande a la izquierda
 * con etiqueta "RACHA ACTUAL", y casco espartano decorativo a la derecha.
 */
export function ContadorRacha({ dias, record, diasTotales }: Props) {
  const mostrado = useCuentaAtras(dias);

  const siguienteHito = HITOS.find((h) => h > dias) ?? null;

  return (
    <div className="mg-entrada space-y-4">
      {/* Tarjeta principal de racha */}
      <div className="ra-card relative overflow-hidden px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-titular text-[11px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
              Racha actual
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              {/*
                `tabular-nums` fija el ancho de los dígitos. Sin ello, mientras el
                número sube de 9 a 10 el texto se desplaza y la animación parece un
                fallo de renderizado.
              */}
              <span className="font-titular text-6xl leading-none font-bold tabular-nums text-ra-texto">
                {mostrado}
              </span>
              <span className="font-titular text-xl font-medium text-ra-texto-sec">
                {dias === 1 ? 'día' : 'días'}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ra-texto-tenue">Sin porno</p>
          </div>

          {/* Casco espartano decorativo */}
          <div className="relative -mr-2 shrink-0 opacity-25">
            <Image
              src="/casco-espartano.svg"
              alt=""
              width={120}
              height={132}
              className="h-28 w-auto"
              priority
            />
          </div>
        </div>

        {/* Barra de progreso hacia el siguiente hito */}
        {siguienteHito !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-ra-texto-tenue">
              <span>Siguiente hito: {siguienteHito} días</span>
              <span className="font-medium tabular-nums text-ra-rojo">
                {siguienteHito - dias} {siguienteHito - dias === 1 ? 'día' : 'días'} más
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ra-borde">
              <div
                className="h-full rounded-full bg-ra-rojo transition-all duration-700"
                style={{
                  width: `${Math.min(100, (dias / siguienteHito) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas: récord y totales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ra-card px-4 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Récord
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-texto">
            {record}
          </p>
        </div>
        <div className="ra-card px-4 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Días totales
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-texto">
            {diasTotales}
          </p>
        </div>
      </div>
    </div>
  );
}
