import type { Metadata } from 'next';
import Link from 'next/link';
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl sm:text-4xl">Articulos</h1>

      <nav aria-label="Categorias" className="mt-6 flex flex-wrap gap-3">
        {categorias.map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className="border border-mg-negro-borde px-3 py-1 text-sm text-mg-gris-texto hover:border-mg-rojo hover:text-mg-blanco"
          >
            {c.nombre}
          </Link>
        ))}
      </nav>

      {articulos.length === 0 ? (
        <p className="mt-12 text-mg-gris-texto">Todavia no hay articulos publicados.</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {articulos.map((a) => (
            <li key={a.id} className="border-b border-mg-negro-borde pb-8">
              <Link href={`/articulos/${a.slug}`} className="group">
                <h2 className="text-xl group-hover:text-mg-rojo sm:text-2xl">{a.titulo}</h2>
              </Link>
              {a.meta_description !== null && (
                <p className="mt-2 text-mg-gris-texto">{a.meta_description}</p>
              )}
              <p className="mt-3 text-sm text-mg-gris-tenue">
                {a.categorias?.nombre}
                {a.tiempo_lectura !== null && ` · ${a.tiempo_lectura} min`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {totalPaginas > 1 && (
        <nav aria-label="Paginacion" className="mt-10 flex justify-between text-sm">
          {pagina > 1 ? (
            <Link href={`/articulos?pagina=${pagina - 1}`} className="text-mg-rojo hover:underline">
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="text-mg-gris-tenue">
            Pagina {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={`/articulos?pagina=${pagina + 1}`} className="text-mg-rojo hover:underline">
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
