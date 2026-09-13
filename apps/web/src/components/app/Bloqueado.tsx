import Link from 'next/link';
import type { ReactNode } from 'react';

/*
  Sin imports de servidor a proposito. Este modulo lo usan tanto paginas de
  servidor como componentes de cliente (el modal de arranque, el registro de
  recaida libre): si importara `obtenerAcceso`, arrastraria `next/headers` al
  bundle del navegador y el build fallaria.
*/

export function IconoCandado({ tamano = 14 }: { tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** Origen del clic, para saber desde qué pantalla se convierte más. */
export type OrigenPremium =
  | 'inicio'
  | 'formacion'
  | 'calendario'
  | 'tienda'
  | 'perfil'
  | 'protocolo'
  | 'pad'
  | 'carta'
  | 'racha'
  | 'logros'
  | 'recaida'
  | 'hito';

export function enlacePremium(desde: OrigenPremium): string {
  return `/app/premium?desde=${desde}`;
}

/* -------------------------------------------------------------------------- */
/* Bloqueado: vista previa desenfocada + candado + CTA                         */
/* -------------------------------------------------------------------------- */

interface PropsBloqueado {
  titulo: string;
  texto: string;
  desde: OrigenPremium;
  /**
   * Vista previa ESTÁTICA de lo que hay detrás. Nunca datos reales del
   * usuario: se ven a través del desenfoque y, en un móvil prestado, eso es
   * una filtración.
   */
  children: ReactNode;
}

/**
 * Envuelve una zona Premium para un usuario gratuito.
 *
 * Se ve lo que hay detrás, desenfocado: el candado sobre una caja vacía no
 * vende nada, y el candado sobre algo que se intuye vende justo eso. Los hijos
 * van con `inert` para que no reciban foco ni toques: un botón desenfocado
 * que además funciona es un fallo de acceso.
 */
export function Bloqueado({ titulo, texto, desde, children }: PropsBloqueado) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ border: '1px solid color-mix(in srgb, var(--color-ra-rojo) 45%, transparent)' }}
    >
      <div aria-hidden="true" inert className="pointer-events-none blur-[5px] opacity-50 select-none">
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ra-rojo text-white shadow-lg">
          <IconoCandado tamano={18} />
        </span>
        <p className="ra-kicker mt-4 justify-center">Premium</p>
        <h3 className="mt-1.5 font-titular text-lg leading-tight font-bold text-ra-texto uppercase">
          {titulo}
        </h3>
        <p className="mt-1.5 max-w-xs text-sm text-ra-texto-sec">{texto}</p>
        <Link href={enlacePremium(desde)} className="ra-boton ra-boton-auto mt-5">
          Desbloquear con Premium
        </Link>
      </div>
    </div>
  );
}
