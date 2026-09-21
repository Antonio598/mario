import type { RespuestasRecaida } from './tipos';

/**
 * Nombre del producto. Antes "Protocolo post-recaida"; el formulario de nueve
 * preguntas se llama ahora asi en toda la app, en el correo y en los logros.
 * Un solo sitio para que no vuelvan a convivir dos nombres.
 */
export const NOMBRE_BITACORA = 'Bitácora de NOFAP';
export const LEMA_BITACORA = 'Registra tus recaídas y acelera tu progreso en NOFAP';

export type TipoPregunta = 'texto' | 'hora' | 'si_no';

export interface Pregunta {
  campo: keyof RespuestasRecaida;
  tipo: TipoPregunta;
  titulo: string;
  ayuda: string;
  placeholder?: string;
}

/**
 * Las nueve preguntas de la Plantilla post-recaida, en el orden del metodo.
 *
 * Viven aqui y no dentro del componente porque el correo de aviso las usa
 * tambien: si cada uno tuviera su copia, cambiar una pregunta en el formulario
 * dejaria el correo etiquetando las respuestas con el texto antiguo, y nadie se
 * daria cuenta hasta leer un aviso incoherente.
 *
 * El texto de cada `titulo` reproduce el de la plantilla en papel. Que coincidan
 * importa: el usuario que ya trabaja con el cuaderno reconoce las mismas
 * preguntas, y el registro digital y el de papel siguen siendo comparables.
 *
 * La plantilla pide "lugar exacto Y hora" en una sola linea; aqui van en dos
 * pantallas porque la hora usa un selector propio y mezclarla con texto libre
 * daria respuestas inconsistentes, imposibles de agregar para el analisis de
 * patrones.
 *
 * TODAS SON OMITIBLES. Es minimizacion del RGPD -son datos de categoria
 * especial- y tambien sentido comun: quien acaba de recaer no siempre puede
 * responderlo todo, y un formulario que bloquea es un formulario que se cierra.
 *
 * El tono interroga los hechos, nunca a la persona: eso es lo que evita que el
 * registro se convierta en un castigo y se deje de usar.
 */
export const PREGUNTAS: readonly Pregunta[] = [
  {
    campo: 'lugar',
    tipo: 'texto',
    titulo: 'Lugar exacto de la recaída',
    ayuda: 'Cuanto más concreto, más fácil será cambiarlo.',
    placeholder: 'Mi habitación, en la cama',
  },
  {
    campo: 'hora',
    tipo: 'hora',
    titulo: 'Hora de la recaída',
    ayuda: 'Los patrones aparecen solos cuando acumulas varios registros.',
  },
  {
    campo: 'trigger',
    tipo: 'texto',
    titulo: 'Trigger o disparador',
    ayuda: 'El momento exacto en que algo cambió: un pensamiento, una imagen, un estado.',
    placeholder: 'Aburrimiento mirando el móvil sin rumbo',
  },
  {
    campo: 'accion_correctiva',
    tipo: 'texto',
    titulo: 'Acción que puedo aplicar ahora para eliminar el trigger',
    ayuda: 'Una acción concreta y pequeña. No un propósito.',
    placeholder: 'Dejar el móvil cargando en la cocina por la noche',
  },
  {
    campo: 'ejecuto_pad',
    tipo: 'si_no',
    titulo: '¿Ejecuté mi P.A.D?',
    ayuda: 'Tu Protocolo Anti-Deseo.',
  },
  {
    campo: 'motivo_fallo',
    tipo: 'texto',
    titulo: 'Si lo ejecutaste, ¿por qué falló? Si no, ¿por qué no lo ejecutaste?',
    ayuda: 'Los hechos, sin juicio. Es información, no una falta.',
    placeholder: 'No me acordé en el momento',
  },
  {
    campo: 'ajuste_pad',
    tipo: 'texto',
    titulo: '¿Qué debo cambiar en mi P.A.D para hacerlo 100 % efectivo?',
    ayuda: 'Un ajuste concreto para la próxima vez.',
    placeholder: 'Añadir un paso antes: levantarme y salir de la habitación',
  },
  {
    campo: 'contexto_ambiental',
    tipo: 'texto',
    titulo: 'Contexto ambiental',
    ayuda: 'Solo o acompañado, dentro o fuera, con o sin pantallas.',
    placeholder: 'Solo en casa, de noche, sin nada planificado',
  },
  {
    campo: 'contexto_emocional',
    tipo: 'texto',
    titulo: 'Contexto psicológico y emocional',
    ayuda: 'Cansancio, estrés, soledad, euforia. Lo que hubiera.',
    placeholder: 'Cansado y con la sensación de haber perdido el día',
  },
];

/** Una respuesta guardada, con la etiqueta de la pregunta tal como se hizo. */
export interface CampoRecaida {
  etiqueta: string;
  valor: string | null;
}

/**
 * Convierte una fila de `relapses` en la lista de respuestas, con las MISMAS
 * etiquetas que el formulario. Antes la ficha del calendario tenia sus propias
 * etiquetas y ya habian divergido de las preguntas.
 */
export function camposRecaida(fila: {
  lugar: string | null;
  hora: string | null;
  trigger: string | null;
  accion_correctiva: string | null;
  ejecuto_pad: boolean | null;
  motivo_fallo: string | null;
  ajuste_pad: string | null;
  contexto_ambiental: string | null;
  contexto_emocional: string | null;
}): CampoRecaida[] {
  return PREGUNTAS.map((p) => {
    const bruto = fila[p.campo];
    const valor =
      p.campo === 'ejecuto_pad'
        ? bruto === null
          ? null
          : bruto
            ? 'Sí'
            : 'No'
        : typeof bruto === 'string' && bruto.trim() !== ''
          ? bruto
          : null;
    return { etiqueta: p.titulo, valor };
  });
}
