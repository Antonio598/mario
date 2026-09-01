'use client';

import { useEffect } from 'react';

/**
 * Impide que la pagina de detras se desplace mientras hay una hoja abierta.
 *
 * En movil, un modal a pantalla completa no basta: el dedo sigue arrastrando el
 * documento de debajo, y al cerrar la hoja el usuario aparece en otro punto de
 * la pantalla sin saber por que.
 *
 * Se guarda y se restaura el valor previo de `overflow` en vez de ponerlo a
 * cadena vacia: si dos componentes se solapan, el segundo en cerrarse no puede
 * desbloquear el scroll que el primero todavia necesita bloqueado.
 */
export function useBloqueoScroll(activo: boolean): void {
  useEffect(() => {
    if (!activo) return;

    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previo;
    };
  }, [activo]);
}
