import * as WebBrowser from 'expo-web-browser';
import { supabase, siteUrl } from '../../lib/supabase';
import type { Tables } from '@reset-alfa/shared';

export type Curso = Tables<'courses'>;
export type Producto = Tables<'products'>;
export type Permiso = Tables<'entitlements'>;

export async function listarCursos(): Promise<Curso[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('orden');
  if (error) throw new Error(error.message);
  return (data ?? []) as Curso[];
}

export async function misPermisos(): Promise<Permiso[]> {
  const { data, error } = await supabase.from('entitlements').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []) as Permiso[];
}

export async function listarProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('orden');
  if (error) throw new Error(error.message);
  return (data ?? []) as Producto[];
}

/**
 * Abre la ficha del producto en el NAVEGADOR EXTERNO.
 *
 * Esta función es la frontera del cumplimiento de las tiendas. Apple y Google
 * exigen su sistema de compra —comisión del 15-30 %— para contenido digital
 * vendido DENTRO de la app. Un WebView embebido con un checkout dentro cuenta
 * como "dentro de la app" y es motivo de rechazo.
 *
 * `openBrowserAsync` de expo-web-browser abre el navegador del sistema
 * (SFSafariViewController en iOS, Custom Tabs en Android). El usuario sale de
 * la app, y esa es exactamente la intención.
 *
 * NUNCA se muestra un precio antes de este salto: eso convertiría la pantalla
 * en un escaparate de venta dentro de la app.
 */
export async function abrirFichaEnWeb(producto: Pick<Producto, 'slug' | 'url_web'>): Promise<void> {
  const url = producto.url_web ?? `${siteUrl}/producto/${producto.slug}`;
  await WebBrowser.openBrowserAsync(url);
}
