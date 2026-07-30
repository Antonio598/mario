'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Identificador del bloque de anuncio de AdSense (data-ad-slot). */
  slot: string;
  formato?: 'auto' | 'horizontal' | 'rectangle';
  /** Altura reservada en pixeles. Debe coincidir con lo que sirva el bloque. */
  alturaMovil?: number;
  alturaEscritorio?: number;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Bloque de anuncio.
 *
 * DOS COSAS QUE ESTE COMPONENTE RESUELVE Y QUE VALEN DINERO:
 *
 * 1. RESERVA DE ESPACIO. El hueco tiene altura fija ANTES de que el anuncio
 *    cargue. Sin ella, el anuncio aparece de golpe y empuja el texto hacia
 *    abajo: eso es CLS, y por encima de 0,1 Google penaliza el posicionamiento.
 *    Perder posiciones es perder las visitas de las que vive la publicidad, asi
 *    que un anuncio mal integrado cuesta mas de lo que ingresa.
 *
 * 2. FALLO SILENCIOSO. Si AdSense no carga —bloqueador, region sin inventario,
 *    consentimiento denegado— el hueco se queda vacio y el articulo se lee con
 *    normalidad. Nada de espacios rotos ni de errores en consola.
 *
 * El anuncio SOLO se solicita si el usuario ha dado su consentimiento. El
 * script de AdSense ni siquiera se carga antes (ver ConsentBanner).
 */
export function AdSlot({
  slot,
  formato = 'auto',
  alturaMovil = 280,
  alturaEscritorio = 90,
}: Props) {
  const contenedor = useRef<HTMLModElement>(null);
  const solicitado = useRef(false);

  useEffect(() => {
    // En React 18+ el modo estricto monta dos veces en desarrollo. Sin esta
    // guarda, AdSense recibe dos peticiones para el mismo hueco y responde con
    // "adsbygoogle.push() error: All ins elements already have ads".
    if (solicitado.current) return;
    if (typeof window === 'undefined' || window.adsbygoogle === undefined) return;

    solicitado.current = true;
    try {
      window.adsbygoogle.push({});
    } catch {
      // Silencio deliberado: que no haya anuncio nunca debe romper el articulo.
    }
  }, []);

  const cliente = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <div
      className="ad-slot my-8"
      style={{
        // La altura se reserva SIEMPRE, tambien cuando no hay identificador de
        // cliente configurado: asi la maquetacion en desarrollo es idéntica a
        // la de produccion y no aparecen sorpresas de CLS al desplegar.
        minHeight: `var(--mg-ad-height, ${alturaMovil}px)`,
        ['--mg-ad-h-movil' as string]: `${alturaMovil}px`,
        ['--mg-ad-h-escritorio' as string]: `${alturaEscritorio}px`,
      }}
      aria-hidden="true"
    >
      {cliente !== undefined && cliente !== '' && (
        <ins
          ref={contenedor}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={cliente}
          data-ad-slot={slot}
          data-ad-format={formato}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
