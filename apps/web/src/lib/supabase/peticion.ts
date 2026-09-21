import 'server-only';

import type { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';
import { createClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';

/**
 * Cliente de Supabase para una ruta de API que sirve a la web Y a la app.
 *
 * La web manda la sesion en la cookie; la app nativa no tiene cookies y la
 * manda en `Authorization: Bearer <access_token>`. Con la cabecera se crea un
 * cliente que la reenvia tal cual: la RLS y `auth.getUser()` funcionan igual
 * que con la cookie, porque el token es el mismo.
 */
export async function clienteDePeticion(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== null && auth.startsWith('Bearer ')) {
    return createSupabaseClient<Database, EsquemaSupabase>(
      publicEnv.supabaseUrl,
      publicEnv.supabaseAnonKey,
      {
        db: { schema: publicEnv.supabaseSchema },
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: auth } },
      },
    );
  }
  return createClient();
}
