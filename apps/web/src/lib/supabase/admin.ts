/**
 * Cliente administrativo. SALTA TODA LA RLS.
 *
 * Esta directiva es la pieza importante del fichero: si alguien importa este
 * modulo desde un componente de cliente, el build FALLA con un error explicito
 * en lugar de compilar y filtrar la service_role key dentro del bundle del
 * navegador. Un fallo de compilacion es barato; una clave publicada que da
 * acceso a los datos del art. 9 RGPD de todos los usuarios, no.
 */
import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';
import { publicEnv } from '../env';

/**
 * Usar SOLO para:
 *   · el webhook de Stripe que escribe en `entitlements` (Fase 4)
 *   · el pipeline de contenido que escribe en `articles` (Fase 3)
 *   · tareas administrativas del servidor
 *
 * Nunca para atender una peticion en nombre de un usuario: para eso esta
 * server.ts, que respeta la RLS.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (serviceRoleKey === undefined || serviceRoleKey === '') {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY. Se define en el panel de EasyPanel.');
  }

  return createSupabaseClient<Database, EsquemaSupabase>(publicEnv.supabaseUrl, serviceRoleKey, {
    db: { schema: publicEnv.supabaseSchema },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
