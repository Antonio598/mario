import Link from 'next/link';

const NAVEGACION = [
  { href: '/articulos', texto: 'Artículos' },
  { href: '/categoria/disciplina', texto: 'Disciplina' },
  { href: '/categoria/autocontrol', texto: 'Autocontrol' },
  { href: '/categoria/productividad', texto: 'Productividad' },
] as const;

/**
 * Cabecera del sitio público.
 *
 * `sticky` y no `fixed`: fixed la saca del flujo y obliga a compensar la altura
 * en cada página, y cualquier olvido tapa el primer titular. Con sticky el
 * navegador se encarga.
 *
 * El botón de la app es el único elemento en rojo. Es la acción que retiene al
 * lector después de leer, así que compite con el contenido a propósito.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-mg-negro-borde bg-mg-negro/85 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="shrink-0" aria-label="Modo Guerrero, ir al inicio">
          <span className="font-titular text-lg font-bold tracking-[0.2em] uppercase">
            Modo<span className="text-mg-rojo">Guerrero</span>
          </span>
        </Link>

        <nav
          aria-label="Secciones"
          className="hidden flex-1 items-center gap-6 text-sm text-mg-gris-texto md:flex"
        >
          {NAVEGACION.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-mg-blanco">
              {item.texto}
            </Link>
          ))}
        </nav>

        <Link
          href="/app"
          className="ml-auto rounded-md bg-mg-rojo px-4 py-2 font-titular text-sm font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro md:ml-0"
        >
          Abrir la app
        </Link>
      </div>

      {/*
        Navegación de categorías en móvil. Va en una fila propia con scroll
        horizontal en lugar de un menú desplegable: son cuatro enlaces, y un
        menú que hay que abrir esconde la navegación tras un toque extra sin
        ganar nada.
      */}
      <nav
        aria-label="Secciones"
        className="flex gap-5 overflow-x-auto border-t border-mg-negro-borde-suave px-5 py-2 text-sm text-mg-gris-texto md:hidden [scrollbar-width:none]"
      >
        {NAVEGACION.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 whitespace-nowrap">
            {item.texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
