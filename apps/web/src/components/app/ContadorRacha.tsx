'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LIMITE_RACHA_GRATIS } from '@/lib/app/enlaces';
import { mostrarDias, rachaRecortada } from '@/lib/app/racha';
import { enlacePremium } from './Bloqueado';

interface Props {
  dias: number;
  record: number;
  diasTotales: number;
  esPremium: boolean;
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
export function ContadorRacha({ dias, record, diasTotales, esPremium }: Props) {
  /*
    En gratis el contador se detiene en 30. La racha REAL sigue contando en el
    servidor —no se toca ningún dato—, y ese número real es precisamente el
    argumento de venta de abajo: "tu racha real es de 47 días" solo funciona si
    esos 47 existen.
  */
  const recortada = rachaRecortada(dias, esPremium);
  const visibles = recortada ? LIMITE_RACHA_GRATIS : dias;
  const mostrado = useCuentaAtras(visibles);

  // Sin Premium no hay hitos por encima del tope: prometer el de 90 a quien
  // no puede verlo es una promesa falsa.
  const hitos = esPremium ? HITOS : HITOS.filter((h) => h <= LIMITE_RACHA_GRATIS);
  const siguienteHito = hitos.find((h) => h > visibles) ?? null;

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
                {recortada && <span className="text-3xl text-ra-rojo">+</span>}
              </span>
              <span className="font-titular text-xl font-medium text-ra-texto-sec">
                {visibles === 1 ? 'día' : 'días'}
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

        {/* Tope del plan gratuito: el dato real, como argumento. */}
        {recortada && (
          <Link
            href={enlacePremium('racha')}
            className="mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-ra-rojo) 10%, transparent)' }}
          >
            <span className="text-ra-texto">
              Tu racha real es de <strong>{dias} días</strong>. Sigue contando.
            </span>
            <span className="shrink-0 font-semibold text-ra-rojo">Verla entera →</span>
          </Link>
        )}

        {/* Barra de progreso hacia el siguiente hito */}
        {siguienteHito !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-ra-texto-tenue">
              <span>Siguiente hito: {siguienteHito} días</span>
              <span className="font-medium tabular-nums text-ra-rojo">
                {siguienteHito - visibles} {siguienteHito - visibles === 1 ? 'día' : 'días'} más
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ra-borde">
              <div
                className="h-full rounded-full bg-ra-rojo transition-all duration-700"
                style={{
                  width: `${Math.min(100, (visibles / siguienteHito) * 100)}%`,
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
            {mostrarDias(record, esPremium)}
          </p>
        </div>
        <div className="ra-card px-4 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Días totales
          </p>
          {/* Sin tope: es la suma de todos los días limpios, no una racha. */}
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-texto">
            {diasTotales}
          </p>
        </div>
      </div>
    </div>
  );
}
