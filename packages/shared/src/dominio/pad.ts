/**
 * P.A.D - Protocolo Anti-Deseo.
 *
 * La accion concreta que el usuario ejecuta en el momento en que aparece el
 * deseo. Es el nucleo del metodo: el formulario post-recaida pregunta si se
 * ejecuto y por que fallo, y sin un P.A.D definido esas preguntas no tienen
 * sentido. Por eso crearlo es la primera tarea pendiente de un usuario nuevo.
 */

/** Video que explica que es el P.A.D. Se abre en YouTube. */
export const VIDEO_PAD = 'https://youtu.be/lICXM0DI76E?si=S9G1pIyPkN_0FSjI';

/**
 * Las cuatro caracteristicas que tiene que cumplir. Se ensenan en el momento
 * de crearlo, no antes: es cuando el usuario esta decidiendo y las necesita.
 */
export const CARACTERISTICAS_PAD = [
  { titulo: 'Simple', detalle: 'Que puedas hacerlo sin pensarlo.' },
  { titulo: 'No negociable', detalle: 'Se ejecuta siempre. No se discute con el deseo.' },
  {
    titulo: 'Cambia tu postura, posicion o estado',
    detalle: 'Rompe fisicamente el momento en que estas.',
  },
  { titulo: 'Siempre el mismo', detalle: 'La repeticion es lo que lo convierte en reflejo.' },
] as const;

/**
 * Opciones para quien no tenga ideas. Todas cumplen las cuatro caracteristicas
 * y todas implican moverse: ninguna se puede hacer desde la cama con el movil
 * en la mano, que es donde suele aparecer el deseo.
 */
export const OPCIONES_PAD = [
  'Meditar',
  '30 flexiones en el suelo',
  'Salir a caminar',
  'Hacer una llamada a un familiar',
  'Hacer una serie de respiraciones',
] as const;

export const MAX_PAD = 200;
