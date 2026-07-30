import type { RespuestasRecaida } from '../streak/api';

export type TipoPregunta = 'texto' | 'texto_largo' | 'hora' | 'si_no';

export interface Pregunta {
  campo: keyof RespuestasRecaida;
  tipo: TipoPregunta;
  titulo: string;
  ayuda?: string;
  placeholder?: string;
}

/**
 * Las ocho preguntas del protocolo post-recaida, en el orden del brief.
 *
 * Una por pantalla, estilo Typeform. Ese formato no es estetico: obliga a
 * pensar una cosa cada vez, y un formulario largo en una sola pantalla se
 * abandona a la mitad justo en el momento en que menos ganas hay de rellenarlo.
 *
 * TODAS SON OMITIBLES. Es un requisito de minimizacion del RGPD —son datos de
 * categoria especial— y tambien de sentido comun: quien acaba de recaer no
 * siempre puede o quiere responderlo todo, y un formulario que bloquea es un
 * formulario que se cierra.
 *
 * El tono interroga los hechos, nunca a la persona. Nada de "por que has
 * fallado": eso convierte el registro en un castigo y hace que se deje de usar.
 */
export const PREGUNTAS: readonly Pregunta[] = [
  {
    campo: 'lugar',
    tipo: 'texto',
    titulo: 'Donde ha pasado?',
    ayuda: 'El sitio exacto. Cuanto mas concreto, mas facil sera cambiarlo.',
    placeholder: 'Mi habitacion, en la cama',
  },
  {
    campo: 'hora',
    tipo: 'hora',
    titulo: 'A que hora?',
    ayuda: 'Los patrones aparecen solos cuando acumulas varios registros.',
  },
  {
    campo: 'trigger',
    tipo: 'texto_largo',
    titulo: 'Que lo ha disparado?',
    ayuda: 'El momento exacto en que cambio algo: un pensamiento, una imagen, un estado.',
    placeholder: 'Aburrimiento mirando el movil sin rumbo',
  },
  {
    campo: 'accion_correctiva',
    tipo: 'texto_largo',
    titulo: 'Que puedes hacer HOY para eliminar ese disparador?',
    ayuda: 'Una accion concreta y pequena. No un proposito.',
    placeholder: 'Dejar el movil cargando en la cocina por la noche',
  },
  {
    campo: 'ejecuto_pad',
    tipo: 'si_no',
    titulo: 'Ejecutaste tu P.A.D?',
    ayuda: 'Tu Protocolo Anti-Deseo.',
  },
  {
    campo: 'motivo_fallo',
    tipo: 'texto_largo',
    titulo: 'Que fallo?',
    ayuda: 'Si no lo ejecutaste, que te lo impidio. Si lo ejecutaste, donde se rompio.',
    placeholder: 'No me acorde en el momento',
  },
  {
    campo: 'ajuste_pad',
    tipo: 'texto_largo',
    titulo: 'Que cambias en tu P.A.D?',
    ayuda: 'Un ajuste concreto para la proxima vez.',
    placeholder: 'Anadir un paso antes: levantarme y salir de la habitacion',
  },
  {
    campo: 'contexto_ambiental',
    tipo: 'texto_largo',
    titulo: 'Como era el entorno?',
    ayuda: 'Solo o acompanado, dentro o fuera, con o sin pantallas.',
    placeholder: 'Solo en casa, de noche, sin nada planificado',
  },
  {
    campo: 'contexto_emocional',
    tipo: 'texto_largo',
    titulo: 'Como estabas?',
    ayuda: 'Cansancio, estres, soledad, euforia. Lo que hubiera.',
    placeholder: 'Cansado y con la sensacion de haber perdido el dia',
  },
];
