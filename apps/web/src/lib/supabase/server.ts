import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@reset-alfa/shared';
import { publicEnv } from '../env';

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 *
 * Sigue usando la anon key y actua en nombre del usuario que hizo la peticion,
 * asi que la RLS se aplica igual que en el navegador. Para saltarse la RLS hace
 * falta admin.ts, que es otra cosa y esta deliberadamente separado.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. Se ignora sin
          // ruido: el middleware ya refresca la sesion en cada peticion, que es
          // donde esta escritura si surte efecto.
        }
      },
    },
  });
}
