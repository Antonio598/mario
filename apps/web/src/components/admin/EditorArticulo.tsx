'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@reset-alfa/shared';

type Articulo = Tables<'articles'>;
type Categoria = Pick<Tables<'categorias'>, 'slug' | 'nombre'>;

interface Props {
  articulo: Articulo | null;
  categorias: Categoria[];
  autorId: string | null;
}

/** Palabras por minuto de un lector medio en espanol. */
const PPM = 200;

/**
 * Convierte un titulo en slug.
 *
 * NFD + eliminacion de diacriticos: "Rutina matinal" y "Rutiná matinál" deben
 * dar el mismo slug, y una URL con acentos se codifica en porcentajes y queda
 * ilegible en los resultados de busqueda.
 */
function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function EditorArticulo({ articulo, categorias, autorId }: Props) {
  const router = useRouter();
  const esNuevo = articulo === null;

  const [titulo, setTitulo] = useState(articulo?.titulo ?? '');
  const [slug, setSlug] = useState(articulo?.slug ?? '');
  const [slugTocado, setSlugTocado] = useState(!esNuevo);
  const [meta, setMeta] = useState(articulo?.meta_description ?? '');
  const [contenido, setContenido] = useState(articulo?.contenido_md ?? '');
  const [categoria, setCategoria] = useState(articulo?.categoria ?? categorias[0]?.slug ?? '');
  const [keywords, setKeywords] = useState((articulo?.keywords ?? []).join(', '));

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const palabras = contenido.trim() === '' ? 0 : contenido.trim().split(/\s+/).length;
  const tiempoLectura = Math.max(1, Math.round(palabras / PPM));

  function cambiarTitulo(v: string) {
    setTitulo(v);
    // El slug sigue al título mientras no se toque a mano. En un artículo ya
    // publicado no se toca nunca: cambiarlo rompe los enlaces y pierde el
    // posicionamiento ganado.
    if (!slugTocado) setSlug(aSlug(v));
  }

  async function guardar(estado: 'draft' | 'publicado') {
    setError(null);
    setAviso(null);

    if (titulo.trim() === '' || contenido.trim() === '') {
      setError('El título y el contenido son obligatorios.');
      return;
    }
    if (estado === 'publicado' && meta.trim() === '') {
      setError('La meta description es obligatoria para publicar: es lo que Google enseña.');
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const datos = {
      slug: slug === '' ? aSlug(titulo) : slug,
      titulo: titulo.trim(),
      meta_description: meta.trim() === '' ? null : meta.trim(),
      contenido_md: contenido,
      categoria,
      autor_id: autorId,
      estado,
      // Un artículo publicado sin fecha rompe el sitemap y el orden del índice.
      fecha_publicacion:
        estado === 'publicado'
          ? (articulo?.fecha_publicacion ?? new Date().toISOString())
          : articulo?.fecha_publicacion ?? null,
      tiempo_lectura: tiempoLectura,
      keywords: keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k !== ''),
    };

    const { data, error: err } = esNuevo
      ? await supabase.from('articles').insert(datos).select('id').single()
      : await supabase.from('articles').update(datos).eq('id', articulo.id).select('id').single();

    setGuardando(false);

    if (err) {
      setError(
        err.code === '23505'
          ? 'Ya existe un artículo con ese slug. Cámbialo.'
          : `No se ha podido guardar: ${err.message}`,
      );
      return;
    }

    setAviso(estado === 'publicado' ? 'Publicado.' : 'Guardado como borrador.');

    if (esNuevo && data !== null) {
      router.replace(`/admin/${data.id}`);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* ---------------------------------------------------------------- */}
      {/* Contenido                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-5">
        <div>
          <label htmlFor="titulo" className="mb-2 block text-xs tracking-widest text-mg-gris-tenue uppercase">
            Título
          </label>
          <input
            id="titulo"
            value={titulo}
            onChange={(e) => cambiarTitulo(e.target.value)}
            placeholder="La rutina matinal que aguanta los días malos"
            className="w-full rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 py-3 text-xl placeholder:text-mg-gris-apagado"
          />
        </div>

        <div>
          <label htmlFor="contenido" className="mb-2 block text-xs tracking-widest text-mg-gris-tenue uppercase">
            Contenido · Markdown
          </label>
          <textarea
            id="contenido"
            rows={22}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder={'## Un subtítulo\n\nEl primer párrafo va antes del primer anuncio.\n\n> Una cita destacada.\n\n- Punto uno\n- Punto dos'}
            className="w-full resize-y rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 py-3 font-mono text-sm leading-relaxed placeholder:text-mg-gris-apagado"
          />
          <p className="mt-2 text-xs text-mg-gris-tenue">
            {palabras} palabras · {tiempoLectura} min de lectura. Los bloques de anuncio se
            insertan solos: tras el primer párrafo, a mitad y al final.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Metadatos                                                        */}
      {/* ---------------------------------------------------------------- */}
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="mg-card space-y-4 p-5">
          <div>
            <label htmlFor="slug" className="mb-2 block text-xs tracking-widest text-mg-gris-tenue uppercase">
              Slug · la URL
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTocado(true);
                setSlug(aSlug(e.target.value));
              }}
              className="w-full rounded-md border border-mg-negro-borde bg-mg-negro px-3 py-2 font-mono text-sm"
            />
            {!esNuevo && (
              <p className="mt-2 text-xs text-mg-aviso">
                Ya está publicado: cambiar el slug rompe los enlaces y pierde el posicionamiento.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="meta" className="mb-2 block text-xs tracking-widest text-mg-gris-tenue uppercase">
              Meta description
            </label>
            <textarea
              id="meta"
              rows={3}
              maxLength={160}
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Lo que Google enseña bajo el título en los resultados."
              className="w-full resize-none rounded-md border border-mg-negro-borde bg-mg-negro px-3 py-2 text-sm placeholder:text-mg-gris-apagado"
            />
            <p className={`mt-1 text-xs ${meta.length > 155 ? 'text-mg-aviso' : 'text-mg-gris-tenue'}`}>
              {meta.length}/160 · Google trunca por encima de 160
            </p>
          </div>

          <div>
            <label htmlFor="categoria" className="mb-2 block text-xs tracking-widest text-mg-gris-tenue uppercase">
              Categoría
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-md border border-mg-negro-borde bg-mg-negro px-3 py-2 text-sm"
            >
              {categorias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="keywords" className="mb-2 block text-xs tracking-widest text-mg-gris-tenue uppercase">
              Palabras clave
            </label>
            <input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="rutina matinal, disciplina"
              className="w-full rounded-md border border-mg-negro-borde bg-mg-negro px-3 py-2 text-sm placeholder:text-mg-gris-apagado"
            />
          </div>
        </div>

        {error !== null && (
          <p className="rounded-md border border-mg-rojo/40 bg-mg-rojo/10 px-4 py-3 text-sm text-mg-rojo-claro">
            {error}
          </p>
        )}
        {aviso !== null && (
          <p className="rounded-md border border-mg-exito/40 bg-mg-exito/10 px-4 py-3 text-sm text-mg-exito">
            {aviso}
          </p>
        )}

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => void guardar('publicado')}
            disabled={guardando}
            className="min-h-[48px] rounded-md bg-mg-rojo font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Publicar'}
          </button>
          <button
            type="button"
            onClick={() => void guardar('draft')}
            disabled={guardando}
            className="min-h-[48px] rounded-md border border-mg-negro-borde text-sm text-mg-gris-texto disabled:opacity-60"
          >
            Guardar como borrador
          </button>
        </div>

        <p className="text-xs leading-relaxed text-mg-gris-apagado">
          Recuerda las reglas de contenido: registro de disciplina, sin lenguaje explícito y sin
          afirmaciones médicas o fisiológicas. La cuenta de AdSense depende de ello.
        </p>
      </aside>
    </div>
  );
}
