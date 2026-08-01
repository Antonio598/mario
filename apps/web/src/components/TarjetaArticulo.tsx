import Link from 'next/link';
import type { ArticuloCompleto } from '@/lib/articulos';

interface Props {
  articulo: ArticuloCompleto;
  /** Destaca el primero de una lista con un tratamiento mayor. */
  destacado?: boolean;
}

/**
 * Tarjeta de artículo. Es el elemento que más se repite en el sitio.
 *
 * El enlace envuelve toda la tarjeta y no solo el titular: en móvil, obligar a
 * acertar sobre el texto del título pierde toques y visitas.
 *
 * La altura no depende del largo del resumen —`line-clamp` lo recorta a tres
 * líneas— para que una rejilla de tarjetas no quede dentada y, sobre todo, para
 * que no haya desplazamiento de layout al cargar.
 */
export function TarjetaArticulo({ articulo, destacado = false }: Props) {
  const fecha =
    articulo.fecha_publicacion !== null
      ? new Date(articulo.fecha_publicacion).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

  return (
    <article
      className={`mg-card mg-card-link group relative overflow-hidden ${
        destacado ? 'sm:col-span-2 lg:col-span-2' : ''
      }`}
    >
      <div className="p-6">
        {articulo.categorias !== null && (
          <span className="mg-kicker">{articulo.categorias.nombre}</span>
        )}

        <h3
          className={`mt-3 text-mg-blanco ${destacado ? 'text-2xl sm:text-3xl' : 'text-xl'}`}
        >
          {/*
            `after:absolute inset-0` extiende el área pulsable a toda la
            tarjeta manteniendo un único enlace en el árbol de accesibilidad.
            Anidar enlaces o envolver el <article> entero produce marcado
            inválido y un lector de pantalla lee la tarjeta dos veces.
          */}
          <Link href={`/articulos/${articulo.slug}`} className="after:absolute after:inset-0">
            {articulo.titulo}
          </Link>
        </h3>

        {articulo.meta_description !== null && (
          <p className="mt-3 line-clamp-3 text-sm text-mg-gris-texto">
            {articulo.meta_description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-3 text-xs text-mg-gris-tenue">
          {fecha !== null && <time dateTime={articulo.fecha_publicacion ?? undefined}>{fecha}</time>}
          {articulo.tiempo_lectura !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{articulo.tiempo_lectura} min</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
