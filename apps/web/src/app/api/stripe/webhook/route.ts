import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * El cuerpo debe leerse EN CRUDO.
 *
 * La firma de Stripe se calcula sobre los bytes exactos que envió. Si Next
 * parsea el JSON y se vuelve a serializar, cambia el espaciado y la firma deja
 * de validar. `request.text()` los conserva intactos.
 */
export const dynamic = 'force-dynamic';

/**
 * Webhook de Stripe. Es la única vía por la que se concede acceso de pago.
 *
 * TRES COSAS QUE ESTE ENDPOINT TIENE QUE HACER BIEN, Y QUE SI FALLAN CUESTAN
 * DINERO O CLIENTES:
 *
 * 1. VERIFICAR LA FIRMA. Sin ella, cualquiera que descubra la URL puede
 *    enviarse a sí mismo el programa completo con un `curl`.
 *
 * 2. SER IDEMPOTENTE. Stripe reintenta las entregas ante cualquier respuesta
 *    que no sea 2xx, y a veces entrega el mismo evento dos veces sin motivo.
 *    Sin idempotencia se duplican permisos y se ensucia el histórico.
 *
 * 3. RESPONDER RÁPIDO. Stripe da 20 segundos. Lo pesado (correos, analítica)
 *    no va aquí.
 */
export async function POST(request: NextRequest) {
  const secretoWebhook = process.env['STRIPE_WEBHOOK_SECRET'];
  const claveStripe = process.env['STRIPE_SECRET_KEY'];

  if (secretoWebhook === undefined || claveStripe === undefined) {
    console.error('[stripe] faltan STRIPE_WEBHOOK_SECRET o STRIPE_SECRET_KEY');
    return NextResponse.json({ error: 'no_configurado' }, { status: 500 });
  }

  const firma = request.headers.get('stripe-signature');
  if (firma === null) {
    return NextResponse.json({ error: 'sin_firma' }, { status: 400 });
  }

  const stripe = new Stripe(claveStripe);
  const cuerpoCrudo = await request.text();

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(cuerpoCrudo, firma, secretoWebhook);
  } catch {
    // Firma inválida: o es un intento de falsificación, o el secreto del panel
    // no coincide con el del entorno. En ningún caso se procesa.
    return NextResponse.json({ error: 'firma_invalida' }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (evento.type === 'checkout.session.completed') {
    const sesion = evento.data.object;

    // Los identificadores viajan en metadata porque es lo único que Stripe
    // devuelve intacto y que podemos fijar al crear la sesión de pago.
    const userId = sesion.metadata?.['user_id'];
    const productId = sesion.metadata?.['product_id'];

    if (userId === undefined || productId === undefined) {
      // Se responde 200: reintentar no va a arreglar unos metadatos ausentes,
      // y devolver un error haría que Stripe reintentara durante días.
      console.error('[stripe] sesión sin metadata', sesion.id);
      return NextResponse.json({ recibido: true, aviso: 'sin_metadata' });
    }

    if (sesion.payment_status !== 'paid') {
      console.warn('[stripe] sesión completada sin pago confirmado', sesion.id);
      return NextResponse.json({ recibido: true });
    }

    /**
     * LA IDEMPOTENCIA VIVE AQUÍ, EN LA BASE DE DATOS.
     *
     * `entitlements` tiene UNIQUE (user_id, product_id) y UNIQUE en
     * `stripe_checkout_session_id`. Con `upsert` sobre la clave de usuario y
     * producto, una entrega repetida actualiza la misma fila en vez de crear
     * una segunda.
     *
     * Que la garantía la dé el motor y no este código significa que sigue en
     * pie aunque dos entregas lleguen a la vez a dos réplicas distintas.
     */
    const { error } = await supabase.from('entitlements').upsert(
      {
        user_id: userId,
        product_id: productId,
        origen: 'stripe',
        activo: true,
        stripe_checkout_session_id: sesion.id,
      },
      { onConflict: 'user_id,product_id' },
    );

    if (error) {
      // Aquí SÍ conviene devolver 500: es un fallo transitorio y queremos que
      // Stripe reintente. Un cliente que ha pagado y no recibe acceso es el
      // peor resultado posible.
      console.error('[stripe] fallo al conceder el permiso', error.message);
      return NextResponse.json({ error: 'fallo_bd' }, { status: 500 });
    }

    return NextResponse.json({ recibido: true, concedido: true });
  }

  /**
   * Reembolso o cargo disputado: se retira el acceso.
   *
   * Se desactiva en lugar de borrar, para conservar el histórico de que la
   * compra existió: hace falta para la contabilidad y para atención al cliente.
   */
  if (evento.type === 'charge.refunded' || evento.type === 'charge.dispute.created') {
    const cargo = evento.data.object;
    const sesionId = typeof cargo.metadata['checkout_session_id'] === 'string'
      ? cargo.metadata['checkout_session_id']
      : null;

    if (sesionId !== null) {
      await supabase
        .from('entitlements')
        .update({ activo: false })
        .eq('stripe_checkout_session_id', sesionId);
    }

    return NextResponse.json({ recibido: true });
  }

  // Cualquier otro evento se acepta sin más. Devolver un error haría que Stripe
  // reintentara indefinidamente eventos que no nos interesan.
  return NextResponse.json({ recibido: true });
}
