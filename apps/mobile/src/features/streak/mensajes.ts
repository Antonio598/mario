/**
 * Mensaje del dia de la pantalla de Inicio.
 *
 * TONO: exigente, nunca humillante. Es la regla del brief y ademas es lo que
 * hace que la app se siga abriendo. Un mensaje que avergüenza funciona una
 * semana; despues se desinstala.
 *
 * Nada de afirmaciones fisiologicas —testosterona, hormonas, energia
 * "acumulada"—. No hay evidencia que las sostenga y ademas contaminarian el
 * registro de la marca, que debe ser de habitos y disciplina.
 */

const INICIO = [
  'Empieza. Lo demas es ruido.',
  'El primer dia solo pide una decision. Tomala.',
  'Hoy no tienes que ser perfecto. Solo tienes que empezar.',
] as const;

const PRIMEROS_DIAS = [
  'Los primeros dias no se ganan con fuerza, se ganan con entorno. Quita lo que te sobra.',
  'Nadie te va a ver hacer esto. Por eso cuenta.',
  'La incomodidad de hoy es informacion, no una senal de parada.',
  'Un dia mas. No pienses en el mes.',
] as const;

const CONSOLIDANDO = [
  'Ya no dependes de las ganas. Dependes del sistema que has montado.',
  'Esto empieza a ser normal. Ese es el objetivo.',
  'Lo dificil ahora es la confianza. No bajes la guardia por ir bien.',
  'Revisa tu P.A.D. Lo que te funciono la primera semana no basta ahora.',
] as const;

const LARGAS = [
  'Ya no es un reto. Es quien eres.',
  'La disciplina que has construido aqui sirve fuera de aqui. Usala.',
  'No te confies: las rachas largas caen por descuido, no por deseo.',
  'Tienes datos de sobra sobre ti mismo. Leelos de vez en cuando.',
] as const;

/**
 * Elige el mensaje segun la fase de la racha y lo rota dentro de esa fase.
 *
 * Rotar por el numero de dia y no al azar hace que el mensaje sea estable
 * durante todo el dia: cambiar de frase cada vez que se abre la app resulta
 * inquieto y le quita peso.
 */
export function mensajeDelDia(dias: number): string {
  const grupo =
    dias <= 0 ? INICIO : dias <= 7 ? PRIMEROS_DIAS : dias <= 30 ? CONSOLIDANDO : LARGAS;

  return grupo[dias % grupo.length] ?? grupo[0];
}
