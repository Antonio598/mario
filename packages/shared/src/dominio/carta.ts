import type { Json } from '../types/database';

/**
 * Carta anti-recaida.
 *
 * Un mensaje que el usuario se escribe a si mismo para leerlo en el momento en
 * que aparece la tentacion. No se escribe en blanco: cinco preguntas guian la
 * respuesta, porque "escribe por que no deberias ver porno" delante de un campo
 * vacio produce dos lineas genericas, y dos lineas genericas no frenan a nadie
 * a las dos de la madrugada.
 */

export type ClaveCarta = 'motivo' | 'coste' | 'despues' | 'futuro' | 'mensaje';

export interface PreguntaCarta {
  clave: ClaveCarta;
  titulo: string;
  ayuda: string;
  placeholder: string;
  /** Encabezado con el que se pinta esa respuesta al leer la carta. */
  encabezado: string;
}

/**
 * El orden va de lo racional a lo directo. Empieza por el motivo, que es
 * facil de decir, y termina con el mensaje en segunda persona, que es el que
 * de verdad se lee en el momento critico y el que mas cuesta escribir en frio.
 */
export const PREGUNTAS_CARTA: readonly PreguntaCarta[] = [
  {
    clave: 'motivo',
    titulo: '¿Por qué quieres dejar el porno y la masturbación?',
    ayuda: 'La razón de fondo. No la que suena bien: la tuya.',
    placeholder: 'Porque quiero volver a sentir deseo real por mi pareja',
    encabezado: 'Por qué lo dejo',
  },
  {
    clave: 'coste',
    titulo: '¿Qué te ha quitado hasta ahora?',
    ayuda: 'Tiempo, energía, relaciones, respeto por ti mismo. Sé concreto.',
    placeholder: 'Horas de sueño, ganas de entrenar y la confianza para mirar a la gente a los ojos',
    encabezado: 'Lo que me ha costado',
  },
  {
    clave: 'despues',
    titulo: '¿Cómo te sientes después de una recaída?',
    ayuda: 'Los minutos de después. Esa sensación es la que la tentación te oculta.',
    placeholder: 'Vacío, con vergüenza y con la sensación de haber tirado el día',
    encabezado: 'Cómo me siento después',
  },
  {
    clave: 'futuro',
    titulo: '¿Quién quieres ser dentro de un año?',
    ayuda: 'El hombre que construyes con cada día limpio.',
    placeholder: 'Alguien con foco, con energía y que cumple lo que se propone',
    encabezado: 'Quién quiero ser',
  },
  {
    clave: 'mensaje',
    titulo: 'Escríbete un mensaje para el momento de la tentación',
    ayuda: 'En segunda persona. Lo que te dirías si pudieras verte ahora mismo.',
    placeholder: 'Sé exactamente lo que estás sintiendo. Pasa en diez minutos. Levántate y ejecuta tu P.A.D.',
    encabezado: 'Para ti, ahora mismo',
  },
];

export const MAX_RESPUESTA_CARTA = 1000;

export type RespuestasCarta = Partial<Record<ClaveCarta, string>>;

/**
 * Convierte lo que viene de la base (jsonb sin tipar) en respuestas seguras.
 * Solo pasan las claves conocidas con valor de texto no vacio: la base ya lo
 * garantiza, pero el cliente no debe fiarse del tipo de una columna Json.
 */
export function leerCarta(bruto: Json | null | undefined): RespuestasCarta | null {
  if (bruto === null || bruto === undefined || typeof bruto !== 'object' || Array.isArray(bruto)) {
    return null;
  }
  const obj = bruto as Record<string, Json | undefined>;
  const salida: RespuestasCarta = {};
  for (const p of PREGUNTAS_CARTA) {
    const v = obj[p.clave];
    if (typeof v === 'string' && v.trim() !== '') salida[p.clave] = v;
  }
  return Object.keys(salida).length === 0 ? null : salida;
}
