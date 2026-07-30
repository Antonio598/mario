import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Crea una sesión de pago de Stripe.
 *
 * TODA LA VENTA OCURRE AQUÍ, EN LA WEB. La app móvil nunca abre un checkout:
 * eso obligaría a usar el sistema de compra de Apple y Google, con su comisión
 * del 15-30 %. La app se limita a abrir la ficha del producto en el navegador
 * externo, y ese enlace acaba en este endpoint.
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
    .select('id, nombre, stripe_price_id, activo')
    .eq('slug', slug)
    .maybeSingle();

  if (producto === null || !producto.activo) {
    return NextResponse.json({ error: 'producto_no_disponible' }, { status: 404 });
  }

  if (producto.stripe_price_id === null) {
    return NextResponse.json({ error: 'producto_sin_precio' }, { status: 409 });
  }

  // Si ya lo tiene, no se le cobra otra vez. Sin esta comprobación, un usuario
  // que vuelve a la ficha desde un enlace antiguo paga dos veces por lo mismo,
  // y eso acaba en una devolución y en una queja.
  const { data: yaLoTiene } = await admin
    .from('entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', producto.id)
    .eq('activo', true)
    .maybeSingle();

  if (yaLoTiene !== null) {
    return NextResponse.json({ error: 'ya_adquirido' }, { status: 409 });
  }

  const stripe = new Stripe(claveStripe);

  const sesion = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: producto.stripe_price_id, quantity: 1 }],

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

    success_url: `${publicEnv.siteUrl}/compra/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicEnv.siteUrl}/producto/${slug}`,

    // Requisito fiscal en España para productos digitales.
    automatic_tax: { enabled: true },
  });

  return NextResponse.json({ url: sesion.url });
}
