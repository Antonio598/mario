import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { CapturaEmail } from '@/components/CapturaEmail';
import { obtenerArticulo, listarSlugs, renderizarMarkdown } from '@/lib/articulos';
import { publicEnv } from '@/lib/env';

/**
 * Pagina de articulo. El activo de negocio del proyecto.
 *
 * RENDERIZADO: estatico con revalidacion (ISR). Se genera una vez y se sirve
 * como HTML ya construido. Es lo que hace que el LCP baje de 2,5 s sin
 * depender de la velocidad de la base de datos en cada visita, y lo que permite
 * aguantar un pico de trafico desde Google sin tocar el servidor.
 *
 * La revalidacion es de una hora: los articulos casi no cambian tras
 * publicarse, y cuando cambian el pipeline de n8n revalida la ruta a mano.
 */
export const revalidate = 3600;

/** Un slug que no estaba en el build se genera en la primera visita. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await listarSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const articulo = await obtenerArticulo(slug);

  if (articulo === null) return { title: 'Articulo no encontrado' };

  const url = `${publicEnv.siteUrl}/articulos/${articulo.slug}`;

  return {
    title: articulo.titulo,
    description: articulo.meta_description ?? undefined,
    keywords: articulo.keywords,
    // La canonica evita que parametros de campana (?utm_source=...) creen
    // duplicados que compiten entre si en el indice de Google.
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: articulo.titulo,
      description: articulo.meta_description ?? undefined,
      url,
      publishedTime: articulo.fecha_publicacion ?? undefined,
      modifiedTime: articulo.updated_at,
      authors: articulo.autores?.nombre !== undefined ? [articulo.autores.nombre] : undefined,
      images: articulo.og_image_url !== null ? [articulo.og_image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: articulo.titulo,
      description: articulo.meta_description ?? undefined,
    },
  };
}

export default async function ArticuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articulo = await obtenerArticulo(slug);

  if (articulo === null) notFound();

  const { primerParrafo, resto, segundaMitad } = renderizarMarkdown(articulo.contenido_md);
  const url = `${publicEnv.siteUrl}/articulos/${articulo.slug}`;

  /**
   * JSON-LD de tipo Article.
   *
   * Es lo que permite a Google mostrar autor y fecha en los resultados. Junto
   * con la ficha publica de autor, es la senal E-E-A-T que separa un sitio
   * indexable de uno que AdSense rechaza.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articulo.titulo,
    description: articulo.meta_description ?? undefined,
    datePublished: articulo.fecha_publicacion,
    dateModified: articulo.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author:
      articulo.autores !== null
        ? {
            '@type': 'Person',
            name: articulo.autores.nombre,
            url: `${publicEnv.siteUrl}/acerca-de`,
          }
        : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Modo Guerrero',
      url: publicEnv.siteUrl,
    },
    image: articulo.og_image_url ?? undefined,
    articleSection: articulo.categorias?.nombre,
    keywords: articulo.keywords.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // El contenido lo genera el servidor a partir de datos ya aprobados;
        // no hay entrada de usuario en esta cadena.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-2xl px-6 py-12">
        <nav aria-label="Migas de pan" className="mb-6 text-sm text-mg-gris-tenue">
          <Link href="/articulos" className="hover:text-mg-blanco">
            Articulos
          </Link>
          {articulo.categorias !== null && (
            <>
              {' / '}
              <Link
                href={`/categoria/${articulo.categorias.slug}`}
                className="hover:text-mg-blanco"
              >
                {articulo.categorias.nombre}
              </Link>
            </>
          )}
        </nav>

        <h1 className="text-3xl sm:text-4xl">{articulo.titulo}</h1>

        <div className="mt-4 flex flex-wrap gap-x-3 text-sm text-mg-gris-tenue">
          {articulo.autores !== null && <span>Por {articulo.autores.nombre}</span>}
          {articulo.fecha_publicacion !== null && (
            <time dateTime={articulo.fecha_publicacion}>
              {new Date(articulo.fecha_publicacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          )}
          {articulo.tiempo_lectura !== null && <span>{articulo.tiempo_lectura} min de lectura</span>}
        </div>

        {/* Primer parrafo, luego el primer bloque de anuncio. */}
        <div className="prose-mg mt-8" dangerouslySetInnerHTML={{ __html: primerParrafo }} />

        <AdSlot slot="1111111111" />

        <div className="prose-mg" dangerouslySetInnerHTML={{ __html: resto }} />

        {/* Mitad de articulo: siempre entre dos parrafos completos, nunca
            partiendo uno por dentro. */}
        <AdSlot slot="2222222222" />

        <div className="prose-mg" dangerouslySetInnerHTML={{ __html: segundaMitad }} />

        <CapturaEmail origen={`articulo:${articulo.slug}`} />

        <AdSlot slot="3333333333" />

        {articulo.autores !== null && (
          <footer className="mt-12 border-t border-mg-negro-borde pt-6">
            <p className="text-sm font-semibold text-mg-blanco">{articulo.autores.nombre}</p>
            <p className="mt-2 text-sm text-mg-gris-texto">{articulo.autores.bio}</p>
          </footer>
        )}
      </article>
    </>
  );
}
