/**
 * Pantallas de hito: video + llamada a la accion.
 *
 * Tres momentos en los que el usuario esta especialmente receptivo y la app
 * le habla con un video en vez de con una tarjeta:
 *
 *   7 dias    La primera semana. Se celebra y se le anima a seguir.
 *   30 dias   Un mes. Es el momento de ofrecer la sesion diagnostica.
 *   recaida   Justo despues de registrarla. Premium y el libro.
 *
 * Los dos primeros se muestran UNA vez (se recuerda en profiles.hitos_vistos).
 * El de recaida se muestra despues de cada recaida registrada: cada una es
 * el momento en que el usuario mas necesita una herramienta.
 *
 * Los videos viven en /public/videos con nombre ASCII. Son 9-16 MB: se sirven
 * con preload="metadata" para no descargar nada hasta que el usuario pulsa.
 */

export type ClaveHito = '7-dias' | '30-dias' | 'recaida';

export const CLAVES_HITO: readonly ClaveHito[] = ['7-dias', '30-dias', 'recaida'];

export function esClaveHito(v: string): v is ClaveHito {
  return (CLAVES_HITO as readonly string[]).includes(v);
}

/** Enlace de pago de Stripe para la sesion diagnostica (60 USD). */
export const ENLACE_SESION_DIAGNOSTICA = 'https://buy.stripe.com/fZu5kC5aygr49xB9wc5os2o';
export const PRECIO_SESION_DIAGNOSTICA = '60 USD';

/** Libro Energia Sexual Masculina (vol. 1), en Amazon. */
export const ENLACE_LIBRO_ENERGIA = 'https://a.co/d/0fwvO82Q';

/** Umbrales de racha que disparan cada pantalla. */
export const UMBRAL_HITO: Record<'7-dias' | '30-dias', number> = {
  '7-dias': 7,
  '30-dias': 30,
};

/**
 * Cual toca ensenar, si alguna. El mayor primero: quien llega a 30 sin haber
 * visto el de 7 (instalo la app con racha ajustada) ve el de 30, no los dos.
 */
export function hitoPendiente(racha: number, vistos: readonly string[]): '7-dias' | '30-dias' | null {
  if (racha >= UMBRAL_HITO['30-dias'] && !vistos.includes('30-dias')) return '30-dias';
  if (racha >= UMBRAL_HITO['7-dias'] && !vistos.includes('7-dias')) return '7-dias';
  return null;
}

export interface DefinicionHito {
  clave: ClaveHito;
  video: string;
  kicker: string;
  titulo: string;
  texto: string;
}

export const HITOS: Record<ClaveHito, DefinicionHito> = {
  '7-dias': {
    clave: '7-dias',
    video: '/videos/7-dias-de-racha.mp4',
    kicker: 'Siete días',
    titulo: 'Una semana entera',
    texto:
      'Lo que has hecho estos siete días es lo más difícil: empezar. Mario tiene algo que decirte.',
  },
  '30-dias': {
    clave: '30-dias',
    video: '/videos/30-dias-de-racha.mp4',
    kicker: 'Treinta días',
    titulo: 'Un mes. Ahora va en serio',
    texto:
      'A partir de aquí el problema ya no es aguantar: es construir. Mario te explica el siguiente paso.',
  },
  recaida: {
    clave: 'recaida',
    video: '/videos/recaida.mp4',
    kicker: 'Después de una recaída',
    titulo: 'Esto no borra lo anterior',
    texto:
      'Una recaída registrada es información. Antes de cerrar la app, escucha esto.',
  },
};
