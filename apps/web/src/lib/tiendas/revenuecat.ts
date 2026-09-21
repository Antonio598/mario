import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { GRACIA_HORAS, PRODUCTO_PREMIUM_ID } from '@/lib/app/enlaces';
import type { EntitlementOrigen } from '@reset-alfa/shared';

/**
 * Suscripción Premium comprada DENTRO de la app (App Store y Google Play).
 *
 * Apple obliga a vender el contenido digital con su sistema de compra, y
 * Google igual. RevenueCat se sienta delante de los dos: la app le compra a
 * él, él valida el recibo con la tienda y nos avisa por webhook. Nosotros no
 * tocamos recibos.
 *
 * Misma filosofía que lib/stripe/suscripciones.ts: cada evento acaba en la
 * misma función, que pide a RevenueCat el estado ACTUAL del suscriptor y lo
 * copia. No se interpreta el evento; se copia la realidad. Eso da
 * idempotencia y tolerancia al desorden gratis.
 *
 * El identificador del suscriptor en RevenueCat es el id del usuario en
 * Supabase (la app hace `Purchases.logIn(user.id)`), así que no hace falta
 * ninguna tabla de correspondencia.
 */

const API = 'https://api.revenuecat.com/v1';

export function claveRevenueCat(): string | null {
  const clave = process.env['REVENUECAT_SECRET_KEY']?.trim();
  return clave === undefined || clave === '' ? null : clave;
}

/** Identificador del entitlement en el panel de RevenueCat. */
export function entitlementPremium(): string {
  const id = process.env['REVENUECAT_ENTITLEMENT_ID']?.trim();
  return id === undefined || id === '' ? 'premium' : id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Solo los ids que son usuarios nuestros; RevenueCat también genera anónimos ($RCAnonymousID). */
export function esUsuarioNuestro(id: unknown): id is string {
  return typeof id === 'string' && UUID.test(id);
}

interface EntitlementRC {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
}

interface SuscripcionRC {
  expires_date: string | null;
  store: string;
  unsubscribe_detected_at: string | null;
  billing_issues_detected_at?: string | null;
}

interface SuscriptorRC {
  subscriber: {
    entitlements: Record<string, EntitlementRC>;
    subscriptions: Record<string, SuscripcionRC>;
  };
}

function origenDesdeTienda(store: string | undefined): EntitlementOrigen {
  switch (store) {
    case 'app_store':
    case 'mac_app_store':
      return 'apple';
    case 'play_store':
    case 'amazon':
      return 'google';
    case 'stripe':
      return 'stripe';
    default:
      // Promocional o desconocido: concedido a mano desde el panel.
      return 'manual';
  }
}

const ORIGENES_TIENDA: ReadonlySet<EntitlementOrigen> = new Set(['apple', 'google']);

export type ResultadoTienda =
  | { ok: true; activo: boolean; origen: EntitlementOrigen | null }
  | { ok: false; motivo: 'no_configurado' | 'usuario_invalido' };

/**
 * Copia el estado del suscriptor de RevenueCat a `entitlements`.
 *
 * Regla de convivencia con Stripe: una fila activa de Stripe nunca se
 * desactiva desde aquí. Si la tienda dice "sin suscripción" y la fila es de
 * Stripe, se deja como está: la web cobra por su cuenta y su webhook manda.
 * Si la tienda dice "activa", se escribe: es un pago real y el acceso se
 * concede. En la práctica el paywall de la app impide comprar cuando ya se es
 * Premium, así que el caso doble no debería darse.
 */
export async function sincronizarDesdeRevenueCat(userId: string): Promise<ResultadoTienda> {
  const clave = claveRevenueCat();
  if (clave === null) return { ok: false, motivo: 'no_configurado' };
  if (!esUsuarioNuestro(userId)) return { ok: false, motivo: 'usuario_invalido' };

  const res = await fetch(`${API}/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${clave}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    // Se propaga: el webhook responde 500 y RevenueCat reintenta.
    throw new Error(`[revenuecat] GET subscriber ${res.status}`);
  }
  const datos = (await res.json()) as SuscriptorRC;

  const admin = createAdminClient();
  const { data: existente } = await admin
    .from('entitlements')
    .select('origen, activo, expires_at')
    .eq('user_id', userId)
    .eq('product_id', PRODUCTO_PREMIUM_ID)
    .maybeSingle();

  const ent = datos.subscriber.entitlements[entitlementPremium()];

  // Sin entitlement en la tienda: solo se toca una fila que fuera de tienda.
  if (ent === undefined) {
    if (existente !== null && ORIGENES_TIENDA.has(existente.origen) && existente.activo) {
      const { error } = await admin
        .from('entitlements')
        .update({ activo: false, expires_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('product_id', PRODUCTO_PREMIUM_ID);
      if (error) throw new Error(`[revenuecat] fallo al desactivar: ${error.message}`);
    }
    return { ok: true, activo: false, origen: null };
  }

  const sub = datos.subscriber.subscriptions[ent.product_identifier];
  const origen = origenDesdeTienda(sub?.store);

  // Fin real del acceso: la fecha de caducidad o, si la tienda concede
  // periodo de gracia por un cobro fallido, el fin de esa gracia.
  const fechas = [ent.expires_date, ent.grace_period_expires_date ?? null]
    .filter((f): f is string => typeof f === 'string')
    .map((f) => new Date(f).getTime());
  const fin = fechas.length === 0 ? null : Math.max(...fechas);
  const activo = fin === null || fin > Date.now();

  // Inactivo en la tienda y la fila es de Stripe: no es asunto de aquí.
  if (!activo && existente !== null && !ORIGENES_TIENDA.has(existente.origen)) {
    return { ok: true, activo: false, origen: existente.origen };
  }

  const expiresAt = activo
    ? fin === null
      ? null
      : new Date(fin + GRACIA_HORAS * 3_600_000).toISOString()
    : new Date(fin ?? Date.now()).toISOString();

  const { error } = await admin.from('entitlements').upsert(
    {
      user_id: userId,
      product_id: PRODUCTO_PREMIUM_ID,
      origen,
      activo,
      expires_at: expiresAt,
      cancel_at_period_end: activo && (sub?.unsubscribe_detected_at ?? null) !== null,
    },
    { onConflict: 'user_id,product_id' },
  );

  if (error) {
    throw new Error(`[revenuecat] fallo al escribir entitlements: ${error.message}`);
  }

  return { ok: true, activo, origen };
}

/**
 * Borra al suscriptor en RevenueCat (art. 17 RGPD). Lo llama la eliminación
 * de cuenta. La suscripción en la tienda NO se cancela desde aquí: eso solo
 * puede hacerlo el usuario en los ajustes de su Apple ID o de Google Play, y
 * la app se lo dice antes de borrar.
 */
export async function borrarSuscriptorRevenueCat(userId: string): Promise<void> {
  const clave = claveRevenueCat();
  if (clave === null || !esUsuarioNuestro(userId)) return;
  const res = await fetch(`${API}/subscribers/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${clave}` },
  });
  // 404: nunca compró nada. Cualquier otro fallo se anota, no se bloquea el borrado.
  if (!res.ok && res.status !== 404) {
    console.error('[revenuecat] no se pudo borrar el suscriptor', userId, res.status);
  }
}
