import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';
import { publicEnv } from '../env';

/**
 * Refresco de sesion en cada peticion.
 *
 * Los tokens de Supabase caducan en una hora. Los Server Components no pueden
 * escribir cookies, asi que sin este paso en el middleware la sesion moriria en
 * la primera navegacion posterior a la caducidad y el usuario se veria
 * desconectado sin motivo aparente.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database, EsquemaSupabase>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      db: { schema: publicEnv.supabaseSchema },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() y no getSession(): getUser valida el token contra el servidor de
  // Supabase. getSession se limita a leer la cookie, que el cliente podria
  // haber manipulado, y por tanto no sirve para decidir autorizacion.
  await supabase.auth.getUser();

  return supabaseResponse;
}
