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
