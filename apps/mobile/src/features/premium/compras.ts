import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { siteUrl, supabase } from '../../lib/supabase';

/**
 * Compra de Premium DENTRO de la app, con el sistema de pago de la tienda.
 *
 * Apple (3.1.1) y Google exigen que el contenido digital vendido en la app se
 * cobre con su sistema: nada de Stripe ni de enlaces a la web para pagar.
 * RevenueCat es la capa que habla con los dos (StoreKit y Google Play
 * Billing), valida el recibo y avisa al servidor por webhook. La app no toca
 * recibos ni decide accesos: el acceso lo sigue diciendo `entitlements` en la
 * base, que escribe el servidor.
 *
 * CLAVES. Las claves publicas de RevenueCat (una por plataforma) viajan en el
 * binario, como la anon key de Supabase: son publicas por diseno. Sin clave
 * para la plataforma actual la compra queda desactivada y la app dice, como
 * antes, que Premium se gestiona desde la web.
 *
 * IDENTIDAD. El id de usuario en RevenueCat es el id de Supabase: asi el
 * webhook sabe a quien conceder el acceso sin tabla de correspondencia.
 */

const ENTITLEMENT = String(Constants.expoConfig?.extra?.['revenueCatEntitlement'] ?? 'premium');

function claveDePlataforma(): string | null {
  const extra = Constants.expoConfig?.extra ?? {};
  const clave =
    Platform.OS === 'ios'
      ? extra['revenueCatIosKey']
      : Platform.OS === 'android'
        ? extra['revenueCatAndroidKey']
        : undefined;
  return typeof clave === 'string' && clave.trim() !== '' ? clave.trim() : null;
}

/** True si en esta plataforma se puede comprar Premium dentro de la app. */
export function comprasDisponibles(): boolean {
  return claveDePlataforma() !== null;
}

let configurado = false;
let usuarioActual: string | null = null;

/**
 * Alinea RevenueCat con la sesion de Supabase. Se llama cada vez que cambia
 * la sesion: con usuario hace logIn, sin usuario logOut. Idempotente y nunca
 * lanza: un fallo aqui no puede impedir usar la app.
 */
export async function sincronizarIdentidadCompras(userId: string | null): Promise<void> {
  const apiKey = claveDePlataforma();
  if (apiKey === null) return;

  try {
    if (!configurado) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: userId });
      configurado = true;
      usuarioActual = userId;
      return;
    }
    if (userId === usuarioActual) return;
    if (userId === null) {
      await Purchases.logOut();
    } else {
      await Purchases.logIn(userId);
    }
    usuarioActual = userId;
  } catch (e) {
    console.warn('[compras] no se pudo alinear la identidad', e instanceof Error ? e.message : e);
  }
}

export interface OfertaPremium {
  paquete: PurchasesPackage;
  /** Precio ya formateado por la tienda, en la moneda del usuario: "9,99 €". */
  precio: string;
}

/**
 * La oferta actual configurada en el panel de RevenueCat. Se prefiere el
 * paquete mensual; si no lo hay, el primero. Null si no hay nada que vender
 * (sin oferta en el panel, o los productos aun no aprobados en la tienda).
 */
export async function obtenerOferta(): Promise<OfertaPremium | null> {
  if (!configurado) return null;
  const ofertas = await Purchases.getOfferings();
  const actual = ofertas.current;
  if (actual === null) return null;
  const paquete = actual.monthly ?? actual.availablePackages[0] ?? null;
  if (paquete === null) return null;
  return { paquete, precio: paquete.product.priceString };
}

export type ResultadoCompra = 'activo' | 'cancelado' | 'pendiente';

function cancelada(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const err = e as { code?: unknown; userCancelled?: unknown };
  return (
    err.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || err.userCancelled === true
  );
}

/**
 * Abre la hoja de pago de la tienda. Al volver con el entitlement activo,
 * pide al servidor que copie el estado (asi "Premium activo" aparece al
 * instante, sin esperar al webhook).
 *
 * 'cancelado' es el usuario cerrando la hoja: no es un error y no se ensena
 * como tal. Cualquier otro fallo se lanza con el mensaje de la tienda.
 */
export async function comprarPremium(paquete: PurchasesPackage): Promise<ResultadoCompra> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(paquete);
    const activo = customerInfo.entitlements.active[ENTITLEMENT] !== undefined;
    await sincronizarConServidor();
    return activo ? 'activo' : 'pendiente';
  } catch (e) {
    if (cancelada(e)) return 'cancelado';
    throw new Error(e instanceof Error ? e.message : 'La tienda no ha completado la compra.');
  }
}

/**
 * Restaurar compras: obligatorio en iOS (3.1.1) para quien reinstala o cambia
 * de telefono. Devuelve si tras restaurar hay entitlement activo.
 */
export async function restaurarCompras(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  const activo = info.entitlements.active[ENTITLEMENT] !== undefined;
  await sincronizarConServidor();
  return activo;
}

/**
 * Pide al servidor que copie el estado de RevenueCat a `entitlements`. El
 * webhook hara lo mismo por su cuenta; esto solo adelanta el resultado. Por
 * eso no lanza: si falla, el acceso llega igual en unos segundos.
 */
export async function sincronizarConServidor(): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session === null) return;
    await fetch(`${siteUrl}/api/tiendas/sincronizar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  } catch {
    // El webhook lo arregla.
  }
}

/**
 * Pagina de gestion de la suscripcion en la tienda. Apple pide que el usuario
 * pueda llegar a ella; RevenueCat da la URL correcta para su cuenta.
 */
export async function urlGestionSuscripcion(): Promise<string | null> {
  if (!configurado) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.managementURL;
  } catch {
    return null;
  }
}
