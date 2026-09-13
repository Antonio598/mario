'use client';

import { useBloqueoScroll } from '@/lib/app/useBloqueoScroll';
import type { ClaveHito } from '@/lib/app/hitos';
import { HitoLanding } from './HitoLanding';
import { Portal } from './Portal';

/**
 * La landing de hito a pantalla completa, por encima de Inicio.
 *
 * Va por portal como todos los modales: dentro de <main> quedaria atrapada
 * por la animacion de entrada y no cubriria la cabecera ni la barra.
 */
export function HitoInterstitial({ clave, esPremium }: { clave: ClaveHito; esPremium: boolean }) {
  useBloqueoScroll(true);

  return (
    <Portal>
      <div className="ra-hoja fixed inset-0 z-[60] overflow-y-auto bg-ra-fondo">
        <HitoLanding clave={clave} esPremium={esPremium} modo="interstitial" />
      </div>
    </Portal>
  );
}
