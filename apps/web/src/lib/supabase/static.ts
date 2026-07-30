import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@reset-alfa/shared';
import { publicEnv } from '../env';

/**
 * Cliente para leer CONTENIDO PUBLICO en tiempo de compilacion y de ISR.
 *
 * Por que no vale `server.ts` aqui:
 *
 * 1. `generateStaticParams` y la regeneracion de ISR se ejecutan FUERA de una
 *    peticion HTTP. Ahi `cookies()` de Next lanza un error, y el build falla.
 *
 * 2. Aunque funcionara, leer cookies marcaria la ruta como dinamica y Next
 *    dejaria de generarla estaticamente. Las paginas de articulo pasarian a
 *    renderizarse en cada visita: adios al LCP por debajo de 2,5 s y adios a
 *    aguantar un pico de trafico desde Google sin sudar.
 *
 * Usa la anon key sin sesion, asi que actua como `anon`: la RLS solo le
 * entrega articulos con `estado = 'publicado'`. Los borradores siguen siendo
 * invisibles, y eso lo garantiza la base de datos, no esta funcion.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
