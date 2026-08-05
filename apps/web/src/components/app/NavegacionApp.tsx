'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PESTANAS = [
  { href: '/app', etiqueta: 'Inicio', icono: 'llama' },
  { href: '/app/formacion', etiqueta: 'Formación', icono: 'libro' },
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
    llama: 'M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-3s3 1 3 5a7 7 0 1 1-14 0C4 8 12 8 12 3Z',
    libro: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Zm4-2v18',
    bolsa: 'M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2',
    calendario: 'M4 6h16v14H4V6Zm0 5h16M8 3v4m8-4v4',
    persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0',
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={trazos[nombre]} />
    </svg>
  );
}

/**
 * Barra de navegación inferior, las mismas cinco pestañas que la app nativa.
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-mg-negro-borde bg-mg-negro-elevado/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg">
        {PESTANAS.map((p) => {
          // `/app` solo está activo en la ruta exacta; el resto también en sus
          // subrutas. Sin esta distinción, Inicio se quedaría marcado siempre.
          const activo = p.href === '/app' ? pathname === '/app' : pathname.startsWith(p.href);

          return (
            <li key={p.href} className="flex-1">
              <Link
                href={p.href}
                aria-current={activo ? 'page' : undefined}
                className={`mg-pulsable relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors ${
                  activo
                    ? 'mg-tab-activa text-mg-rojo'
                    : 'text-mg-gris-tenue hover:text-mg-gris-texto'
                }`}
              >
                <Icono nombre={p.icono} />
                {p.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
