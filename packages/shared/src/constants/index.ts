/** Constantes compartidas entre la web y la app. */

/** Zona horaria por defecto. El cliente y su audiencia son espanoles. */
export const TIMEZONE_POR_DEFECTO = 'Europe/Madrid';

/** Hitos que disparan insignia y notificacion (Fase 5). */
export const HITOS_RACHA = [7, 21, 30, 90, 180, 365] as const;



/**
 * Aviso que acompana a los recursos de ayuda.
 *
 * Reset Alfa es una herramienta de habitos y disciplina. No es un tratamiento
 * ni sustituye atencion profesional, y decirlo explicitamente importa tanto
 * legalmente como de cara a la ficha de las tiendas de aplicaciones.
 */
export const AVISO_NO_TERAPEUTICO =
  'Reset Alfa es una herramienta de seguimiento de habitos. No es un tratamiento ' +
  'medico ni psicologico, y no sustituye la atencion de un profesional.';
