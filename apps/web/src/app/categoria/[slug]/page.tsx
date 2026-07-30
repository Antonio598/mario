import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listarArticulos, listarCategorias, obtenerCategoria } from '@/lib/articulos';
import { publicEnv } from '@/lib/env';

export const revalidate = 3600;

export async function generateStaticParams() {
  const categorias = await listarCategorias();
  return categorias.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = await obtenerCategoria(slug);

  if (categoria === null) return { title: 'Categoria no encontrada' };

  return {
    title: categoria.nombre,
    description: categoria.meta_description ?? categoria.descripcion ?? undefined,
    alternates: { canonical: `${publicEnv.siteUrl}/categoria/${categoria.slug}` },
  };
}

/**
 * Pagina de categoria.
 *
 * No es un filtro: es una pagina con entidad propia, URL estable y canonica.
 * Cada una compite en Google por su propio grupo de busquedas y multiplica la
 * superficie indexable del sitio, que es exactamente de lo que vive el modelo
 * publicitario.
 */
export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoria = await obtenerCategoria(slug);

  if (categoria === null) notFound();

  const { articulos } = await listarArticulos({ categoria: slug, porPagina: 50 });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-mg-gris-tenue">
        <Link href="/articulos" className="hover:text-mg-blanco">
          Articulos
        </Link>
        {' / '}
        <span>{categoria.nombre}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl">{categoria.nombre}</h1>

      {categoria.descripcion !== null && (
        <p className="mt-4 text-lg text-mg-gris-texto">{categoria.descripcion}</p>
      )}

      {articulos.length === 0 ? (
        <p className="mt-12 text-mg-gris-texto">Todavia no hay articulos en esta categoria.</p>
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
