import 'server-only';

import { marked } from 'marked';
import { createStaticClient } from './supabase/static';
import type { Tables } from '@reset-alfa/shared';

export type Articulo = Tables<'articles'>;
export type Categoria = Tables<'categorias'>;
export type Autor = Tables<'autores'>;

export interface ArticuloCompleto extends Articulo {
  autores: Autor | null;
  categorias: Categoria | null;
}

/**
 * Lectura de contenido publicado.
 *
 * Se usa el cliente ANONIMO SIN COOKIES, no el administrativo ni el de sesion:
 *
 *   · La politica RLS de `articles` ya filtra por
 *     `estado = 'publicado' and fecha_publicacion <= now()`. Apoyarse en ella y
 *     no en un `where` del lado del codigo significa que un borrador no puede
 *     filtrarse por un descuido en una consulta futura.
 *
 *   · Sin cookies, estas rutas siguen siendo estaticas. En cuanto una pagina
 *     lee cookies, Next la marca como dinamica y deja de prerenderizarla: los
 *     articulos pasarian a generarse en cada visita.
 */

export async function obtenerArticulo(slug: string): Promise<ArticuloCompleto | null> {
  const supabase = createStaticClient();

  const { data } = await supabase
    .from('articles')
    .select('*, autores(*), categorias(*)')
    .eq('slug', slug)
    .maybeSingle();

  return (data as ArticuloCompleto | null) ?? null;
}

export async function listarArticulos(opciones?: {
  categoria?: string;
  pagina?: number;
  porPagina?: number;
}): Promise<{ articulos: ArticuloCompleto[]; total: number }> {
  const supabase = createStaticClient();
  const porPagina = opciones?.porPagina ?? 12;
  const pagina = Math.max(opciones?.pagina ?? 1, 1);
  const desde = (pagina - 1) * porPagina;

  let consulta = supabase
    .from('articles')
    .select('*, autores(*), categorias(*)', { count: 'exact' })
    .order('fecha_publicacion', { ascending: false })
    .range(desde, desde + porPagina - 1);

  if (opciones?.categoria !== undefined) {
    consulta = consulta.eq('categoria', opciones.categoria);
  }

  const { data, count } = await consulta;

  return {
    articulos: (data as ArticuloCompleto[] | null) ?? [],
    total: count ?? 0,
  };
}

export async function listarSlugs(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data } = await supabase.from('articles').select('slug');
  return (data ?? []).map((a) => a.slug);
}

export async function listarCategorias(): Promise<Categoria[]> {
  const supabase = createStaticClient();
  const { data } = await supabase.from('categorias').select('*').order('orden');
  return (data as Categoria[] | null) ?? [];
}

export async function obtenerCategoria(slug: string): Promise<Categoria | null> {
  const supabase = createStaticClient();
  const { data } = await supabase.from('categorias').select('*').eq('slug', slug).maybeSingle();
  return (data as Categoria | null) ?? null;
}

/**
 * Markdown a HTML, partido en dos mitades por un salto de parrafo.
 *
 * Esto es lo que permite insertar el bloque de anuncio de mitad de articulo
 * ENTRE dos parrafos completos, y no cortando uno por dentro. Insertarlo dentro
 * de un parrafo rompe el marcado y perjudica la lectura.
 *
 * `marked` se ejecuta solo en el servidor y sobre contenido que ha pasado por
 * aprobacion humana, asi que no hay superficie de XSS desde fuera.
 */
export function renderizarMarkdown(md: string): {
  primerParrafo: string;
  resto: string;
  segundaMitad: string;
} {
  const bloques = md.split(/\n{2,}/).filter((b) => b.trim() !== '');
  const mitad = Math.ceil(bloques.length / 2);

  const html = (partes: string[]): string =>
    partes.length === 0 ? '' : (marked.parse(partes.join('\n\n'), { async: false }) as string);

  return {
    primerParrafo: html(bloques.slice(0, 1)),
    resto: html(bloques.slice(1, mitad)),
    segundaMitad: html(bloques.slice(mitad)),
  };
}

/** Palabras por minuto de un lector medio en espanol. */
const PPM = 200;

export function calcularTiempoLectura(md: string): number {
  return Math.max(1, Math.round(md.trim().split(/\s+/).length / PPM));
}
