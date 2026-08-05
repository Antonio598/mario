import type { Metadata } from 'next';
import Link from 'next/link';
import { TarjetaArticulo } from '@/components/TarjetaArticulo';
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
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-mg-gris-tenue">
        <Link href="/articulos" className="hover:text-mg-blanco">
          Artículos
        </Link>
        {' / '}
        <span className="text-mg-gris-texto">{categoria.nombre}</span>
      </nav>

      <header>
        <p className="mg-kicker">Categoría</p>
        <h1 className="mg-rule mt-3 text-4xl sm:text-5xl">{categoria.nombre}</h1>
        {categoria.descripcion !== null && (
          <p className="mt-6 max-w-2xl text-lg text-mg-gris-texto">{categoria.descripcion}</p>
        )}
      </header>

      {articulos.length === 0 ? (
        <p className="mt-14 text-mg-gris-tenue">Todavía no hay artículos en esta categoría.</p>
      ) : (
        <div className="mg-escalonado mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articulos.map((a) => (
            <TarjetaArticulo key={a.id} articulo={a} />
          ))}
        </div>
      )}
    </main>
  );
}
