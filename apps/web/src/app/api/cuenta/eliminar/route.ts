import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Eliminacion de cuenta (art. 17 RGPD; Apple 5.1.1(v) y Google Play).
 *
 * Las tiendas exigen que el usuario pueda borrar SU CUENTA desde la app, no
 * solo sus datos. En este proyecto la base esta compartida con el CRM del
 * propietario, y borrar la identidad de auth.users la borra tambien alli.
 *
 * Por eso hay dos comportamientos y los decide una variable de entorno:
 *
 *   BORRAR_IDENTIDAD_AL_ELIMINAR=true
 *     Borra los datos de Reset Alfa (RPC borrar_mis_datos) y despues la
 *     identidad en auth.users con la service_role. Es lo que exigen las
 *     tiendas. El usuario desaparece tambien del CRM.
 *
 *   sin definir (por defecto)
 *     Borra solo los datos de Reset Alfa. La identidad sobrevive. Cumple el
 *     art. 17 respecto a esta app pero NO el requisito de las tiendas.
 *
 * La decision es del propietario (ver docs/app-store-paso-a-paso.md). Este
 * endpoint es la unica pieza que la app nativa necesita para cumplir: la web
 * tambien puede llamarlo, pero conserva su boton actual.
 *
 * Acepta la sesion por cookie (web) o por Authorization: Bearer (app).
 */
async function clientePara(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  const supabase = await clientePara(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: 'sesion_requerida' }, { status: 401 });
  }

  // 1. Datos de Reset Alfa, como el propio usuario (RLS + security definer).
  const rpc = publicEnv.supabaseSchema === 'reset_alfa' ? 'borrar_mis_datos' : 'delete_my_account';
  const { error } = await supabase.rpc(rpc);
  if (error) {
    console.error('[cuenta] fallo al borrar datos', error.message);
    return NextResponse.json({ error: 'fallo_datos' }, { status: 500 });
  }

  // En proyecto dedicado, delete_my_account ya elimina la identidad.
  if (rpc === 'delete_my_account') {
    return NextResponse.json({ eliminado: true, identidad: true });
  }

  // 2. Identidad, solo si el propietario lo ha decidido.
  const borrarIdentidad =
    process.env['BORRAR_IDENTIDAD_AL_ELIMINAR']?.trim().toLowerCase() === 'true';

  if (!borrarIdentidad) {
    return NextResponse.json({ eliminado: true, identidad: false });
  }

  try {
    const admin = createAdminClient();
    const { error: errAuth } = await admin.auth.admin.deleteUser(user.id);
    if (errAuth) {
      console.error('[cuenta] datos borrados pero la identidad no', errAuth.message);
      return NextResponse.json({ eliminado: true, identidad: false, aviso: 'identidad_no_borrada' });
    }
  } catch (e) {
    console.error('[cuenta] sin cliente administrativo', e);
    return NextResponse.json({ eliminado: true, identidad: false, aviso: 'sin_service_role' });
  }

  return NextResponse.json({ eliminado: true, identidad: true });
}
