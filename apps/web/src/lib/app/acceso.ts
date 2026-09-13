import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { PRODUCTO_PREMIUM_ID } from './enlaces';

export interface Acceso {
  esPremium: boolean;
  /** Fin del periodo pagado (ISO), si hay suscripcion. */
  expiraEn: string | null;
  /** El usuario cancelo; conserva el acceso hasta expiraEn. */
  cancelaAlFinal: boolean;
  /** Hay cliente en Stripe: se puede abrir el portal de facturacion. */
  tieneCliente: boolean;
}

const SIN_ACCESO: Acceso = {
  esPremium: false,
  expiraEn: null,
  cancelaAlFinal: false,
  tieneCliente: false,
};

/**
 * Estado Premium del usuario de la peticion actual.
 *
 * Envuelto en `cache()` de React: el layout, la pagina y cada banner lo
 * llaman por separado y todos reciben el resultado de UNA sola consulta por
 * peticion. Sin esto, una pantalla con tres bloqueos haria cuatro viajes a la
 * base para responder la misma pregunta.
 *
 * La regla de vigencia es la misma que ya aplica formacion/page.tsx y la misma
 * que reset_alfa_priv.has_entitlement en la base: activo y sin caducar.
 *
 * Pasa por la RLS con la sesion del usuario, asi que solo puede leer sus
 * propias filas; no hace falta el cliente administrativo.
 */
export const obtenerAcceso = cache(async (): Promise<Acceso> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from('entitlements')
    .select('activo, expires_at, cancel_at_period_end, stripe_customer_id')
    .eq('product_id', PRODUCTO_PREMIUM_ID)
    .maybeSingle();

  if (data === null) return SIN_ACCESO;

  const vigente =
    data.activo && (data.expires_at === null || new Date(data.expires_at).getTime() > Date.now());

  return {
    esPremium: vigente,
    expiraEn: data.expires_at,
    cancelaAlFinal: data.cancel_at_period_end,
    tieneCliente: data.stripe_customer_id !== null,
  };
});
