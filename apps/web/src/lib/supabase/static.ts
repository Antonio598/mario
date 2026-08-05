import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';
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
  return createSupabaseClient<Database, EsquemaSupabase>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      /**
       * El esquema NO puede omitirse aqui.
       *
       * Este cliente lee todo el contenido publico: articulos, categorias y el
       * sitemap. Si apunta a `public` mientras las tablas viven en
       * `reset_alfa`, las consultas no fallan de forma ruidosa: devuelven vacio.
       * El resultado es una web que se despliega correctamente y no muestra un
       * solo articulo, con 404 en cada ficha, sin ningun error a la vista.
       */
      db: { schema: publicEnv.supabaseSchema },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
