/** Constantes compartidas entre la web y la app. */

/** Zona horaria por defecto. El cliente y su audiencia son espanoles. */
export const TIMEZONE_POR_DEFECTO = 'Europe/Madrid';

/** Hitos que disparan insignia y notificacion (Fase 5). */
export const HITOS_RACHA = [7, 21, 30, 90, 180, 365] as const;

/**
 * Recursos de ayuda profesional.
 *
 * Aparecen en la pantalla final del protocolo post-recaida y en Ajustes. Son un
 * requisito del brief: protegen legalmente al cliente y son lo correcto.
 * Enlaces publicos y espanoles, sin promesas terapeuticas.
 */
export const RECURSOS_AYUDA = [
  {
    nombre: 'Telefono de la Esperanza',
    descripcion: 'Apoyo emocional gratuito, 24 horas.',
    url: 'https://telefonodelaesperanza.org',
    telefono: '717 003 717',
  },
  {
    nombre: 'Linea 024',
    descripcion: 'Atencion a la conducta suicida. Gratuita, confidencial, 24 horas.',
    url: 'https://www.sanidad.gob.es/linea024/home.htm',
    telefono: '024',
  },
  {
    nombre: 'Consejo General de la Psicologia de Espana',
    descripcion: 'Buscador de profesionales colegiados.',
    url: 'https://www.cop.es',
    telefono: null,
  },
] as const;

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
