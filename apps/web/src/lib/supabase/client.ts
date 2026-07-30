import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@reset-alfa/shared';
import { publicEnv } from '../env';

/**
 * Cliente para componentes de navegador.
 *
 * Usa la anon key, que es publica por diseno: no concede ningun permiso por si
 * misma. Todo lo que este cliente puede leer o escribir lo determinan las
 * politicas RLS de supabase/migrations, no esta clave.
 */
export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
