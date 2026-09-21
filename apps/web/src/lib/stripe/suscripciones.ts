import 'server-only';

import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { GRACIA_HORAS, PRODUCTO_PREMIUM_ID } from '@/lib/app/enlaces';

/**
 * Suscripción Premium: la única fuente de verdad es Stripe.
 *
 * Cada evento del webhook —alta, renovación, cancelación, impago— acaba en la
 * misma función: recuperar la suscripción de Stripe y escribir la fila con SU
 * estado. No se interpreta el evento; se copia la realidad.
 *
 * Eso compra dos cosas que una máquina de estados propia no daría gratis:
 *
 *   IDEMPOTENCIA. Stripe entrega el mismo evento dos veces sin motivo, y a
 *   veces reintenta durante días. Copiar el estado actual N veces produce
 *   siempre la misma fila.
 *
 *   ORDEN. Los eventos no llegan en orden. Si `subscription.updated` llega
 *   antes que `checkout.session.completed`, no importa: los dos escriben lo
 *   que Stripe dice AHORA, no lo que decía el evento.
 */

export function obtenerStripe(): Stripe {
  const clave = process.env['STRIPE_SECRET_KEY'];
  if (clave === undefined || clave.trim() === '') {
    throw new Error('Falta STRIPE_SECRET_KEY');
  }
  return new Stripe(clave);
}

/**
 * Stripe Tax: calculo automatico del IVA.
 *
 * DESACTIVADO POR DEFECTO. Si se pide con `automatic_tax` y la cuenta no lo
 * tiene configurado, Stripe RECHAZA la creacion de la sesion y el usuario ve
 * "no hemos podido abrir el pago". Es decir: un ajuste fiscal pendiente en el
 * panel impide cobrar, y nada en la pantalla dice por que.
 *
 * Para venta de productos digitales en la UE hay que activarlo: Stripe Tax en
 * el panel y despues STRIPE_AUTOMATIC_TAX=true aqui. Dos pasos separados a
 * proposito, para que el segundo no pueda ir antes que el primero.
 */
export function impuestoAutomatico(): boolean {
  return process.env['STRIPE_AUTOMATIC_TAX']?.trim().toLowerCase() === 'true';
}

export function precioPremium(): string | null {
  const id = process.env['STRIPE_PREMIUM_PRICE_ID']?.trim();
  return id === undefined || id === '' ? null : id;
}

/**
 * Estados que conservan el acceso.
 *
 * `past_due` se mantiene a propósito: Stripe reintenta el cobro durante días y
 * el corte real lo marca `expires_at`. Quitar el acceso al primer intento
 * fallido castiga una tarjeta caducada, no una cancelación.
 */
const ESTADOS_ACTIVOS: ReadonlySet<string> = new Set(['active', 'trialing', 'past_due']);

function idDe(ref: string | { id: string } | null | undefined): string | null {
  if (ref === null || ref === undefined) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

function isoDesdeSegundos(segundos: number | null | undefined, extraHoras = 0): string | null {
  if (segundos === null || segundos === undefined) return null;
  return new Date(segundos * 1000 + extraHoras * 3_600_000).toISOString();
}

export type ResultadoSincronizacion =
  | { ok: true; activo: boolean; userId: string }
  | { ok: false; motivo: 'usuario_desconocido' | 'sin_items' };

/**
 * Copia el estado de una suscripción de Stripe a `entitlements`.
 *
 * El usuario se resuelve por este orden: metadata de la suscripción (la fija
 * el checkout), fila existente por id de suscripción, fila existente por id
 * de cliente, y por último el respaldo que pase quien llama. Si no aparece
 * por ninguna vía no se escribe nada y se avisa: crear una fila sin dueño es
 * peor que no crearla.
 */
export async function sincronizarSuscripcion(
  stripe: Stripe,
  subscriptionId: string,
  userIdRespaldo?: string | null,
  extra?: { stripeCheckoutSessionId?: string },
): Promise<ResultadoSincronizacion> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const admin = createAdminClient();

  const customerId = idDe(sub.customer);

  let userId: string | null = sub.metadata['user_id'] ?? null;

  if (userId === null) {
    const { data: porSub } = await admin
      .from('entitlements')
      .select('user_id')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle();
    userId = porSub?.user_id ?? null;
  }

  if (userId === null && customerId !== null) {
    const { data: porCliente } = await admin
      .from('entitlements')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .limit(1)
      .maybeSingle();
    userId = porCliente?.user_id ?? null;
  }

  if (userId === null) userId = userIdRespaldo ?? null;

  if (userId === null) {
    console.error('[stripe] suscripción sin usuario resoluble', sub.id);
    return { ok: false, motivo: 'usuario_desconocido' };
  }

  // En la API actual el fin de periodo vive en el item, no en la suscripción.
  const item = sub.items.data[0];
  if (item === undefined) {
    console.error('[stripe] suscripción sin items', sub.id);
    return { ok: false, motivo: 'sin_items' };
  }

  const activo = ESTADOS_ACTIVOS.has(sub.status);

  // Una suscripcion de Stripe caducada no pisa una fila viva de la App Store o
  // de Google Play: el usuario paga por la app y su acceso lo manda la tienda.
  if (!activo) {
    const { data: fila } = await admin
      .from('entitlements')
      .select('origen, activo, expires_at')
      .eq('user_id', userId)
      .eq('product_id', PRODUCTO_PREMIUM_ID)
      .maybeSingle();
    const vivaEnTienda =
      fila !== null &&
      (fila.origen === 'apple' || fila.origen === 'google') &&
      fila.activo &&
      (fila.expires_at === null || new Date(fila.expires_at).getTime() > Date.now());
    if (vivaEnTienda) return { ok: true, activo: true, userId };
  }

  // Con acceso: fin del periodo + gracia. Sin acceso: cuando terminó, o ahora.
  const expiresAt = activo
    ? isoDesdeSegundos(item.current_period_end, GRACIA_HORAS)
    : (isoDesdeSegundos(sub.ended_at) ?? new Date().toISOString());

  const { error } = await admin.from('entitlements').upsert(
    {
      user_id: userId,
      product_id: PRODUCTO_PREMIUM_ID,
      origen: 'stripe',
      activo,
      expires_at: expiresAt,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      cancel_at_period_end: sub.cancel_at_period_end,
      ...(extra?.stripeCheckoutSessionId === undefined
        ? {}
        : { stripe_checkout_session_id: extra.stripeCheckoutSessionId }),
    },
    { onConflict: 'user_id,product_id' },
  );

  if (error) {
    // Se propaga: el webhook responde 500 y Stripe reintenta. Un cliente que
    // ha pagado y no recibe acceso es el peor resultado posible.
    throw new Error(`[stripe] fallo al escribir entitlements: ${error.message}`);
  }

  return { ok: true, activo, userId };
}

/**
 * Sincroniza a partir de una sesión de checkout recién completada.
 *
 * La usa la página de éxito, para pintar "Premium activo" sin esperar al
 * webhook. Comprueba que la sesión pertenece al usuario que la reclama: la
 * URL de éxito lleva el id de sesión, y un id de sesión no es un secreto.
 */
export async function sincronizarDesdeSesion(
  stripe: Stripe,
  sessionId: string,
  userId: string,
): Promise<ResultadoSincronizacion | { ok: false; motivo: 'sesion_ajena' | 'sin_suscripcion' }> {
  const sesion = await stripe.checkout.sessions.retrieve(sessionId);

  if (sesion.client_reference_id !== userId) {
    return { ok: false, motivo: 'sesion_ajena' };
  }

  const subId = idDe(sesion.subscription);
  if (sesion.mode !== 'subscription' || subId === null) {
    return { ok: false, motivo: 'sin_suscripcion' };
  }

  return sincronizarSuscripcion(stripe, subId, userId, { stripeCheckoutSessionId: sesion.id });
}
