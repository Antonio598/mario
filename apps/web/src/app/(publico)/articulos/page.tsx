import type { Metadata } from 'next';
import Link from 'next/link';
import { TarjetaArticulo } from '@/components/TarjetaArticulo';
import { listarArticulos, listarCategorias } from '@/lib/articulos';
import { publicEnv } from '@/lib/env';

export const revalidate = 3600;

const POR_PAGINA = 12;

export const metadata: Metadata = {
  title: 'Articulos',
  description:
    'Disciplina, autocontrol, foco y habitos. Todos los articulos de Modo Guerrero.',
  alternates: { canonical: `${publicEnv.siteUrl}/articulos` },
};

/**
 * Indice paginado.
 *
 * Cada pagina es indexable y enlaza a la siguiente con un enlace real (no con
 * JavaScript): asi Googlebot puede recorrer el archivo entero y descubrir todos
 * los articulos. Un indice con scroll infinito deja la mayor parte del catalogo
 * fuera del indice, que es justo lo contrario de lo que interesa aqui.
 */
export default async function ArticulosPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina: paginaParam } = await searchParams;
  const pagina = Math.max(Number(paginaParam ?? '1') || 1, 1);

  const [{ articulos, total }, categorias] = await Promise.all([
    listarArticulos({ pagina, porPagina: POR_PAGINA }),
    listarCategorias(),
  ]);

  const totalPaginas = Math.max(Math.ceil(total / POR_PAGINA), 1);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header>
        <p className="mg-kicker">Todo el archivo</p>
        <h1 className="mg-rule mt-3 text-4xl sm:text-5xl">Artículos</h1>
      </header>

      {/* Filtro por categoría. Cada una es una página indexable propia. */}
      <nav aria-label="Categorías" className="mt-8 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className="rounded-full border border-mg-negro-borde px-4 py-1.5 text-sm text-mg-gris-texto transition-colors hover:border-mg-rojo hover:text-mg-blanco"
          >
            {c.nombre}
          </Link>
        ))}
      </nav>

      {articulos.length === 0 ? (
        <p className="mt-14 text-mg-gris-tenue">
          Todavía no hay artículos publicados. Vuelve en unos días.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articulos.map((a) => (
            <TarjetaArticulo key={a.id} articulo={a} />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <nav
          aria-label="Paginación"
          className="mt-14 flex items-center justify-between border-t border-mg-negro-borde pt-6 text-sm"
        >
          {pagina > 1 ? (
            <Link
              href={`/articulos?pagina=${pagina - 1}`}
              rel="prev"
              className="rounded-md border border-mg-negro-borde px-4 py-2 hover:border-mg-gris-tenue"
            >
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}

          <span className="text-mg-gris-tenue">
            Página {pagina} de {totalPaginas}
          </span>

          {pagina < totalPaginas ? (
            <Link
              href={`/articulos?pagina=${pagina + 1}`}
              rel="next"
              className="rounded-md border border-mg-negro-borde px-4 py-2 hover:border-mg-gris-tenue"
            >
              Siguientes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
