/**
 * Enlaces de negocio que no dependen de la base de datos.
 *
 * El programa Reset Alfa no se compra por enlace: se accede tras una llamada de
 * admision, y esa llamada se agenda siempre en la misma direccion. Es una
 * decision de negocio estable, no un dato de catalogo.
 *
 * Esta aqui y no se lee de `products.url_web` porque ese campo llego a
 * contener el antiguo enlace de pago de Stripe, y mientras la base no se
 * actualice el boton mas importante de la app -el unico que convierte- llevaria
 * al sitio equivocado. Un CTA critico no puede quedar a merced de una fila
 * desactualizada.
 */
export const ENLACE_LLAMADA_ADMISION = 'https://marioruperezdc.youcanbook.me';

/** Texto por defecto del CTA del programa. La base puede sobreescribirlo. */
export const CTA_LLAMADA_ADMISION = 'Agendar llamada de admisión';

/* -------------------------------------------------------------------------- */
/* Premium                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Id fijo de la fila `products` de la suscripcion. Coincide con
 * supabase/premium-2-suscripcion.sql. Fijo para que el acceso se pueda
 * comprobar sin una consulta previa por slug.
 */
export const PRODUCTO_PREMIUM_ID = 'b0000000-0000-4000-8000-000000000010';
export const SLUG_PREMIUM = 'premium-mensual';

/** Precio que se muestra. El que cobra Stripe es el del Price configurado. */
export const PRECIO_PREMIUM_TEXTO = '10 USD / mes';

/**
 * Dias de racha visibles sin Premium. La racha real sigue contando por
 * debajo; solo se limita lo que se ensena.
 */
export const LIMITE_RACHA_GRATIS = 30;
