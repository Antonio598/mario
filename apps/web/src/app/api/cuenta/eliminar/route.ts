import { NextResponse, type NextRequest } from 'next/server';
import { clienteDePeticion } from '@/lib/supabase/peticion';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';
import { PRODUCTO_PREMIUM_ID } from '@/lib/app/enlaces';
import { obtenerStripe } from '@/lib/stripe/suscripciones';
import { borrarSuscriptorRevenueCat } from '@/lib/tiendas/revenuecat';

export const runtime = 'nodejs';

/**
 * Eliminacion de cuenta (art. 17 RGPD; Apple 5.1.1(v) y Google Play).
 *
 * Las tiendas exigen que el usuario pueda borrar SU CUENTA desde la app, no
 * solo sus datos. Por defecto se borra todo: los datos de Reset Alfa (RPC
 * borrar_mis_datos) y despues la identidad en auth.users con la service_role.
 *
 * La base esta compartida con el CRM del propietario, y borrar la identidad la
 * borra tambien alli. Si en algun momento hiciera falta conservarla,
 * BORRAR_IDENTIDAD_AL_ELIMINAR=false deja solo el borrado de datos; pero con
 * eso la app deja de cumplir el requisito de las tiendas.
 *
 * ANTES DE BORRAR, EL DINERO:
 *   - Suscripcion de Stripe: se cancela. Un usuario borrado no puede seguir
 *     pagando por una cuenta que ya no existe.
 *   - Suscripcion de App Store / Google Play: NO se puede cancelar desde el
 *     servidor; solo el usuario en los ajustes de la tienda. La app se lo
 *     advierte antes de confirmar. Aqui se borra su ficha en RevenueCat.
 *
 * Acepta la sesion por cookie (web) o por Authorization: Bearer (app).
 */
export async function POST(request: NextRequest) {
  const supabase = await clienteDePeticion(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: 'sesion_requerida' }, { status: 401 });
  }

  const esquemaAislado = publicEnv.supabaseSchema === 'reset_alfa';

  // 0. Suscripciones. Se lee con el cliente administrativo porque despues del
  //    borrado la fila ya no existe. Ningun fallo aqui bloquea el borrado: el
  //    derecho de supresion no depende de que Stripe responda.
  if (esquemaAislado) {
    try {
      const admin = createAdminClient();
      const { data: fila } = await admin
        .from('entitlements')
        .select('origen, activo, stripe_subscription_id')
        .eq('user_id', user.id)
        .eq('product_id', PRODUCTO_PREMIUM_ID)
        .maybeSingle();

      if (fila?.stripe_subscription_id && fila.activo && fila.origen === 'stripe') {
        try {
          await obtenerStripe().subscriptions.cancel(fila.stripe_subscription_id);
        } catch (e) {
          console.error('[cuenta] no se pudo cancelar la suscripcion de Stripe', e instanceof Error ? e.message : e);
        }
      }
      await borrarSuscriptorRevenueCat(user.id);
    } catch (e) {
      console.error('[cuenta] no se pudieron revisar las suscripciones', e instanceof Error ? e.message : e);
    }
  }

  // 1. Datos de Reset Alfa, como el propio usuario (RLS + security definer).
  const rpc = esquemaAislado ? 'borrar_mis_datos' : 'delete_my_account';
  const { error } = await supabase.rpc(rpc);
  if (error) {
    console.error('[cuenta] fallo al borrar datos', error.message);
    return NextResponse.json({ error: 'fallo_datos' }, { status: 500 });
  }

  // En proyecto dedicado, delete_my_account ya elimina la identidad.
  if (rpc === 'delete_my_account') {
    return NextResponse.json({ eliminado: true, identidad: true });
  }

  // 2. Identidad. Se borra salvo que el propietario lo haya desactivado.
  const conservarIdentidad =
    process.env['BORRAR_IDENTIDAD_AL_ELIMINAR']?.trim().toLowerCase() === 'false';

  if (conservarIdentidad) {
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
