'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PESTANAS = [
  { href: '/app', etiqueta: 'Inicio', icono: 'casa' },
  { href: '/app/formacion', etiqueta: 'Formación', icono: 'gorro' },
  { href: '/app/tienda', etiqueta: 'Tienda', icono: 'bolsa' },
  { href: '/app/calendario', etiqueta: 'Calendario', icono: 'calendario' },
  { href: '/app/perfil', etiqueta: 'Perfil', icono: 'persona' },
] as const;

type Icono = (typeof PESTANAS)[number]['icono'];

/**
 * Iconos en línea, sin librería.
 *
 * Un paquete de iconos añade decenas de kilobytes al bundle para usar cinco.
 * Estos son trazos de 24×24 con `currentColor`, así que heredan el color del
 * estado activo sin trabajo extra.
 */
function Icono({ nombre }: { nombre: Icono }) {
  const trazos: Record<Icono, string> = {
    casa: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z',
    gorro: 'M4 17h16M5 17c0-3 2-5.5 7-7 5 1.5 7 4 7 7M12 10V6m0 0l3-3M12 6L9 3',
    bolsa: 'M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
    calendario: 'M4 6h16v14H4V6Zm0 5h16M8 3v4m8-4v4',
    persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0',
  };

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={trazos[nombre]} />
    </svg>
  );
}

/**
 * Barra de navegación inferior — Reset Alfa tema claro.
 *
 * Abajo y no arriba porque en un móvil la parte alta de la pantalla no se
 * alcanza con el pulgar, y esta es una app que se abre todos los días con una
 * mano.
 *
 * `env(safe-area-inset-bottom)` deja hueco a la barra de gestos del iPhone: sin
 * él, la última fila de botones queda debajo y no se puede pulsar.
 */
export function NavegacionApp() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="ra-nav-bottom fixed inset-x-0 bottom-0 z-50"
    >
      <ul className="mx-auto flex max-w-md">
        {PESTANAS.map((p) => {
          // `/app` solo está activo en la ruta exacta; el resto también en sus
          // subrutas. Sin esta distinción, Inicio se quedaría marcado siempre.
          const activo = p.href === '/app' ? pathname === '/app' : pathname.startsWith(p.href);

          return (
            <li key={p.href} className="flex-1">
              <Link
                href={p.href}
                aria-current={activo ? 'page' : undefined}
                className={`mg-pulsable relative flex min-h-[var(--ra-nav-h)] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  activo
                    ? 'text-ra-rojo'
                    : 'text-ra-texto-tenue hover:text-ra-texto-sec'
                }`}
              >
                <Icono nombre={p.icono} />
                {p.etiqueta}
                {activo && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-full bg-ra-rojo" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
