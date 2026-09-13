import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';
import { PRODUCTO_PREMIUM_ID } from '@/lib/app/enlaces';
import { obtenerStripe } from '@/lib/stripe/suscripciones';

export const runtime = 'nodejs';

/**
 * Portal de facturación de Stripe.
 *
 * Cancelar, cambiar la tarjeta y descargar facturas ocurre ALLÍ, no aquí. Una
 * pantalla propia de cancelación es código que hay que mantener, que hay que
 * ajustar a la ley de consumo de cada país y que, mal hecha, es exactamente el
 * tipo de "cancelación difícil" que esa normativa persigue. El portal de
 * Stripe cumple todo eso de serie.
 *
 * Requiere activar el Customer Portal una vez en el panel de Stripe.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: 'sesion_requerida' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: fila } = await admin
    .from('entitlements')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .eq('product_id', PRODUCTO_PREMIUM_ID)
    .maybeSingle();

  if (fila === null || fila.stripe_customer_id === null) {
    return NextResponse.json({ error: 'sin_suscripcion' }, { status: 404 });
  }

  let stripe;
  try {
    stripe = obtenerStripe();
  } catch {
    return NextResponse.json({ error: 'no_configurado' }, { status: 500 });
  }

  const sesion = await stripe.billingPortal.sessions.create({
    customer: fila.stripe_customer_id,
    return_url: `${publicEnv.siteUrl}/app/perfil`,
  });

  return NextResponse.json({ url: sesion.url });
}
