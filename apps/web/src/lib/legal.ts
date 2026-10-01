import 'server-only';

/**
 * Identidad del responsable del tratamiento.
 *
 * NO va escrita en el codigo: este repositorio es publico y el historial de
 * git es permanente, asi que un domicilio escrito aqui no se puede retirar
 * nunca, ni cambiando de casa. Vive en el entorno del servidor, igual que
 * RESEND_TO.
 *
 * Es dato PUBLICO en la pagina -lo exigen el aviso de privacidad (LFPDPPP
 * art. 16 en Mexico), la LSSI-CE art. 10 para el publico espanol y el RGPD
 * art. 13 para los usuarios de la UE-, pero publicarlo en la web no es lo
 * mismo que dejarlo en un repositorio clonable.
 *
 * Si falta alguna, la pagina lo dice en vez de inventarlo: una identidad a
 * medias es peor que una ausencia declarada.
 */
function leer(nombre: string): string | null {
  const v = process.env[nombre]?.trim();
  return v === undefined || v === '' ? null : v;
}

export const titular = {
  nombre: leer('TITULAR_NOMBRE'),
  domicilio: leer('TITULAR_DOMICILIO'),
  /** RFC en Mexico, NIF en Espana. Opcional: el RGPD no lo exige. */
  identificacion: leer('TITULAR_IDENTIFICACION'),
  correo: leer('TITULAR_CORREO') ?? 'hola@modoguerrero.es',
} as const;

/** True cuando hay lo minimo para cumplir: quien es y donde esta. */
export const titularCompleto = titular.nombre !== null && titular.domicilio !== null;
