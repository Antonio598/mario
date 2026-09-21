import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';
import { impuestoAutomatico, precioPremium } from '@/lib/stripe/suscripciones';

export const runtime = 'nodejs';

/**
 * Crea una sesión de pago de Stripe.
 *
 * ES LA VENTA DE LA WEB. La app móvil nunca abre este checkout: Apple y
 * Google exigen su propio sistema de compra para el contenido digital, así
 * que la app vende Premium con compras integradas (ver lib/tiendas). Los dos
 * caminos escriben en la misma fila de `entitlements`.
 */
export async function POST(request: NextRequest) {
  const claveStripe = process.env['STRIPE_SECRET_KEY'];
  if (claveStripe === undefined) {
    return NextResponse.json({ error: 'no_configurado' }, { status: 500 });
  }

  // Sesión del usuario. El precio NUNCA viene del cliente: se lee de la base de
  // datos por slug. Si el importe llegara en la petición, cualquiera podría
  // comprar el programa por un céntimo editando el JavaScript.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: 'sesion_requerida' }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'peticion_invalida' }, { status: 400 });
  }

  const { slug } = (cuerpo ?? {}) as { slug?: unknown };
  if (typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug_invalido' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: producto } = await admin
    .from('products')
    .select('id, nombre, tipo, stripe_price_id, activo')
    .eq('slug', slug)
    .maybeSingle();

  if (producto === null || !producto.activo) {
    return NextResponse.json({ error: 'producto_no_disponible' }, { status: 404 });
  }

  const esSuscripcion = producto.tipo === 'suscripcion';

  /*
    El precio de la suscripción no está en la tabla: es distinto en pruebas y
    en producción y el seed es público. Vive en STRIPE_PREMIUM_PRICE_ID.
  */
  const priceId = esSuscripcion ? precioPremium() : producto.stripe_price_id;
  if (priceId === null) {
    return NextResponse.json({ error: 'producto_sin_precio' }, { status: 409 });
  }

  // Si ya lo tiene, no se le cobra otra vez. Sin esta comprobación, un usuario
  // que vuelve a la ficha desde un enlace antiguo paga dos veces por lo mismo,
  // y eso acaba en una devolución y en una queja.
  //
  // Para la suscripción cuenta también `expires_at`: una fila cancelada o
  // caducada sigue existiendo, y quien vuelve tiene que poder suscribirse.
  const { data: existente } = await admin
    .from('entitlements')
    .select('id, activo, expires_at, stripe_customer_id')
    .eq('user_id', user.id)
    .eq('product_id', producto.id)
    .maybeSingle();

  const vigente =
    existente !== null &&
    existente.activo &&
    (existente.expires_at === null || new Date(existente.expires_at).getTime() > Date.now());

  if (vigente) {
    return NextResponse.json({ error: 'ya_adquirido' }, { status: 409 });
  }

  const stripe = new Stripe(claveStripe);

  if (esSuscripcion) {
    /*
      `client_reference_id` y `subscription_data.metadata` llevan el usuario
      por dos vías. La primera la lee la página de éxito desde la sesión; la
      segunda viaja EN la suscripción, que es lo que traen todos los eventos
      posteriores (renovación, cancelación). Sin ella, un `invoice.paid` seis
      meses después no sabría de quién es.

      Si ya hubo cliente en Stripe se reutiliza: un usuario, un cliente. Es lo
      que hace que el portal de facturación muestre todo su historial.
    */
    const sesion = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existente?.stripe_customer_id
        ? { customer: existente.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      metadata: { user_id: user.id, product_id: producto.id },
      subscription_data: { metadata: { user_id: user.id, product_id: producto.id } },
      allow_promotion_codes: true,
      success_url: `${publicEnv.siteUrl}/app/premium?estado=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicEnv.siteUrl}/app/premium?estado=cancelado`,
      automatic_tax: { enabled: impuestoAutomatico() },
    });

    return NextResponse.json({ url: sesion.url });
  }

  const sesion = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],

    // El correo de la cuenta va precargado: un correo distinto en Stripe
    // complica el soporte cuando hay que cruzar un pago con un usuario.
    customer_email: user.email ?? undefined,

    /**
     * `metadata` es lo único que el webhook recibirá de vuelta intacto. Es lo
     * que permite saber a QUIÉN y QUÉ conceder. Sin esto el pago llega sin
     * forma de asociarlo a nadie.
     */
    metadata: {
      user_id: user.id,
      product_id: producto.id,
    },

    success_url: `${publicEnv.siteUrl}/app/formacion?compra=ok`,
    cancel_url: `${publicEnv.siteUrl}/app/formacion`,

    automatic_tax: { enabled: impuestoAutomatico() },
  });

  return NextResponse.json({ url: sesion.url });
}
