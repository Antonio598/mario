import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sincronizarSuscripcion } from '@/lib/stripe/suscripciones';

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

  /* --------------------------------------------------------------------- */
  /* SUSCRIPCION PREMIUM                                                    */
  /*                                                                       */
  /* Todos los eventos acaban en sincronizarSuscripcion, que copia el       */
  /* estado real de Stripe. No se interpreta el evento: es lo que hace que  */
  /* una entrega duplicada o fuera de orden no pueda romper nada.           */
  /* --------------------------------------------------------------------- */

  const sincronizar = async (subId: string, userId?: string | null, sessionId?: string) => {
    try {
      const r = await sincronizarSuscripcion(
        stripe,
        subId,
        userId,
        sessionId === undefined ? undefined : { stripeCheckoutSessionId: sessionId },
      );
      // Usuario irresoluble: reintentar no lo arregla. 200 con aviso.
      if (!r.ok) return NextResponse.json({ recibido: true, aviso: r.motivo });
      return NextResponse.json({ recibido: true, activo: r.activo });
    } catch (e) {
      // Fallo de base o de la API de Stripe: transitorio, que reintente.
      console.error('[stripe] fallo al sincronizar', subId, e instanceof Error ? e.message : e);
      return NextResponse.json({ error: 'fallo_sincronizacion' }, { status: 500 });
    }
  };

  if (evento.type === 'checkout.session.completed' && evento.data.object.mode === 'subscription') {
    const sesion = evento.data.object;
    const subId = typeof sesion.subscription === 'string' ? sesion.subscription : sesion.subscription?.id;
    if (subId === undefined || subId === null) {
      console.error('[stripe] sesión de suscripción sin subscription', sesion.id);
      return NextResponse.json({ recibido: true, aviso: 'sin_suscripcion' });
    }
    return sincronizar(subId, sesion.metadata?.['user_id'] ?? sesion.client_reference_id, sesion.id);
  }

  if (evento.type === 'customer.subscription.updated' || evento.type === 'customer.subscription.deleted') {
    return sincronizar(evento.data.object.id);
  }

  if (evento.type === 'invoice.paid' || evento.type === 'invoice.payment_failed') {
    const factura = evento.data.object;
    const ref = factura.parent?.subscription_details?.subscription;
    const subId = typeof ref === 'string' ? ref : (ref?.id ?? null);
    // Una factura sin suscripción es una compra única: no es asunto de aquí.
    if (subId === null) return NextResponse.json({ recibido: true });
    return sincronizar(subId);
  }

  /* --------------------------------------------------------------------- */
  /* COMPRA UNICA                                                           */
  /* --------------------------------------------------------------------- */

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
