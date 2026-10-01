/**
 * Que proveedores de acceso social se ensenan.
 *
 * NO es una preferencia de diseno: un boton de "Continuar con Google" que no
 * funciona porque el proveedor no esta configurado en Supabase pierde el
 * registro -el usuario no suele reintentar por correo- y, en la app nativa, es
 * motivo de rechazo en la revision de Apple.
 *
 * Por eso la lista por defecto esta VACIA y los botones no aparecen. Cuando el
 * proveedor este configurado de verdad en GoTrue, se anade a la variable:
 *
 *   NEXT_PUBLIC_LOGIN_SOCIAL=google,apple   (web)
 *   EXPO_PUBLIC_LOGIN_SOCIAL=google,apple   (app)
 *
 * Apple exige que, si se ofrece cualquier proveedor de terceros en iOS, se
 * ofrezca tambien Sign in with Apple. De ahi `listaValida`: pedir solo google
 * en nativo seria un rechazo, asi que se ignora.
 */
export type ProveedorSocial = 'google' | 'apple';

const PROVEEDORES: readonly ProveedorSocial[] = ['google', 'apple'];

/** Lee la lista de una variable de entorno. Vacia o ausente: ninguno. */
export function proveedoresSociales(valor: string | undefined | null): ProveedorSocial[] {
  if (valor === undefined || valor === null) return [];
  const pedidos = valor
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is ProveedorSocial => (PROVEEDORES as readonly string[]).includes(p));
  return [...new Set(pedidos)];
}

/**
 * Los proveedores que se pueden ensenar en una plataforma dada.
 *
 * En iOS, si hay algun proveedor de terceros debe estar tambien Apple; si no
 * esta, no se ensena ninguno antes que arriesgar el rechazo.
 */
export function proveedoresVisibles(
  pedidos: readonly ProveedorSocial[],
  esIOS: boolean,
): ProveedorSocial[] {
  if (pedidos.length === 0) return [];
  if (esIOS && !pedidos.includes('apple')) return [];
  return esIOS ? [...pedidos] : pedidos.filter((p) => p !== 'apple');
}
