import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';
import { publicEnv } from '../env';

type Cliente = SupabaseClient<Database, EsquemaSupabase>;

export type TipoConsentimiento = 'datos_sensibles' | 'marketing_email' | 'push' | 'analitica';

export interface ResultadoConsentimiento {
  ok: boolean;
  /** Mensaje tecnico del servidor. Solo para diagnostico, nunca para el usuario. */
  detalle?: string;
}

/**
 * Registra una decision de consentimiento.
 *
 * Dos caminos a proposito. El principal es el RPC `dar_consentimiento`, que es
 * SECURITY DEFINER: crea el perfil si falta y no depende de que el rol
 * `authenticated` conserve el INSERT sobre la tabla. El segundo es la insercion
 * directa, que es lo que habia antes y sigue funcionando en las instalaciones
 * donde todavia no se ha ejecutado supabase/arreglo-consentimiento.sql.
 *
 * Se intenta el RPC primero y se cae al INSERT solo si la funcion no existe.
 * Que un despliegue quede a medias no puede dejar al usuario atrapado en la
 * pantalla de consentimiento, que es justo la puerta del registro de recaida.
 *
 * En los dos casos se INSERTA una fila nueva; nunca se modifica la anterior. El
 * historial completo es la prueba que exige el art. 7.1 RGPD.
 */
export async function registrarConsentimiento(
  supabase: Cliente,
  opciones: { userId: string; tipo: TipoConsentimiento; concedido: boolean },
): Promise<ResultadoConsentimiento> {
  const { userId, tipo, concedido } = opciones;

  const { error: errorRpc } = await supabase.rpc('dar_consentimiento', {
    p_tipo: tipo,
    p_concedido: concedido,
    p_version: publicEnv.privacyPolicyVersion,
    p_origen: 'web',
  });

  if (errorRpc === null) return { ok: true };

  // PGRST202 = la funcion no esta en el esquema expuesto. Es el unico error que
  // justifica reintentar por el otro camino: cualquier otro (sesion caducada,
  // RLS, restriccion) volveria a fallar igual y solo enmascararia la causa.
  const faltaLaFuncion =
    errorRpc.code === 'PGRST202' || /could not find the function/i.test(errorRpc.message);

  if (!faltaLaFuncion) {
    return { ok: false, detalle: `${errorRpc.code ?? 'sin codigo'}: ${errorRpc.message}` };
  }

  const { error: errorInsert } = await supabase.from('consents').insert({
    user_id: userId,
    tipo,
    concedido,
    version_politica: publicEnv.privacyPolicyVersion,
    origen: 'web',
  });

  if (errorInsert === null) return { ok: true };

  return { ok: false, detalle: `${errorInsert.code ?? 'sin codigo'}: ${errorInsert.message}` };
}
