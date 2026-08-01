import type { Tables } from '../types/database';

/**
 * Resolucion de acceso en cliente.
 *
 * Es un ESPEJO de app.has_entitlement() en Postgres, no la fuente de verdad.
 * Sirve para decidir que pinta la interfaz sin una ida y vuelta mas al
 * servidor. La proteccion real es la politica RLS de `lessons`: aunque esta
 * funcion devolviera true por error, la base de datos seguiria sin entregar la
 * fila.
 *
 * Si cambias la logica aqui, cambiala tambien en la migracion 0007.
 */
export function tieneAcceso(
  entitlements: readonly Tables<'entitlements'>[],
  productId: string,
  ahora: Date = new Date(),
): boolean {
  return entitlements.some(
    (e) =>
      e.product_id === productId &&
      e.activo &&
      (e.expires_at === null || new Date(e.expires_at) > ahora),
  );
}

/**
 * Un curso es accesible si es gratuito, si no cuelga de ningun producto, o si
 * el usuario tiene permiso vigente sobre el producto que lo desbloquea.
 */
export function cursoDesbloqueado(
  curso: Pick<Tables<'courses'>, 'tipo' | 'product_id'>,
  entitlements: readonly Tables<'entitlements'>[],
  ahora: Date = new Date(),
): boolean {
  if (curso.tipo === 'gratis' || curso.product_id === null) return true;
  return tieneAcceso(entitlements, curso.product_id, ahora);
}
