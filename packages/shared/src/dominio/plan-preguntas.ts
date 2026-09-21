/**
 * Cuestionario de entrada.
 *
 * Ocho preguntas de una sola pantalla cada una. Las cuatro primeras alimentan
 * los cálculos de la pantalla de resultados (horas perdidas, equivalencias);
 * las otras cuatro no calculan nada: sirven para que el usuario se vea
 * descrito, que es lo que convierte un test en "mi plan".
 *
 * No hay pregunta de dinero. La marca vende disciplina, no ahorro, y una
 * cifra en euros invita a la sospecha de estadística inventada. Las
 * equivalencias se hacen solo en tiempo.
 */

export type ClavePlan =
  | 'edad'
  | 'anios_habito'
  | 'frecuencia_semana'
  | 'minutos_sesion'
  | 'disparador'
  | 'coste'
  | 'objetivo'
  | 'intentos';

export interface OpcionPlan {
  /** Lo que se guarda. Para las numéricas, el valor con el que se calcula. */
  valor: string | number;
  etiqueta: string;
}

export interface PreguntaPlan {
  clave: ClavePlan;
  titulo: string;
  ayuda?: string;
  opciones: readonly OpcionPlan[];
  /** Varias respuestas a la vez. Se guarda una lista. */
  multiple?: boolean;
}

export const PREGUNTAS_PLAN: readonly PreguntaPlan[] = [
  {
    clave: 'edad',
    titulo: '¿Cuántos años tienes?',
    opciones: [
      { valor: '<18', etiqueta: 'Menos de 18' },
      { valor: '18-24', etiqueta: '18 a 24' },
      { valor: '25-34', etiqueta: '25 a 34' },
      { valor: '35-44', etiqueta: '35 a 44' },
      { valor: '45+', etiqueta: '45 o más' },
    ],
  },
  {
    clave: 'anios_habito',
    titulo: '¿Cuánto tiempo llevas con el hábito?',
    ayuda: 'Desde la primera vez que sentiste que no lo controlabas.',
    opciones: [
      { valor: 0.5, etiqueta: 'Menos de un año' },
      { valor: 2, etiqueta: '1 a 3 años' },
      { valor: 5.5, etiqueta: '4 a 7 años' },
      { valor: 11, etiqueta: '8 a 15 años' },
      { valor: 18, etiqueta: 'Más de 15 años' },
    ],
  },
  {
    clave: 'frecuencia_semana',
    titulo: '¿Con qué frecuencia ves porno?',
    ayuda: 'Una semana normal, sin adornar.',
    opciones: [
      { valor: 1, etiqueta: 'Una vez a la semana' },
      { valor: 2.5, etiqueta: '2 o 3 veces' },
      { valor: 4.5, etiqueta: '4 o 5 veces' },
      { valor: 7, etiqueta: 'Cada día' },
      { valor: 14, etiqueta: 'Varias veces al día' },
    ],
  },
  {
    clave: 'minutos_sesion',
    titulo: '¿Cuánto dura cada vez?',
    ayuda: 'Incluye lo de antes y lo de después: buscar, mirar, quedarse.',
    opciones: [
      { valor: 10, etiqueta: 'Menos de 15 minutos' },
      { valor: 22, etiqueta: '15 a 30 minutos' },
      { valor: 45, etiqueta: '30 minutos a 1 hora' },
      { valor: 90, etiqueta: 'Más de una hora' },
    ],
  },
  {
    clave: 'disparador',
    titulo: '¿Cuándo aparece con más fuerza?',
    opciones: [
      { valor: 'aburrimiento', etiqueta: 'Cuando me aburro' },
      { valor: 'estres', etiqueta: 'Cuando estoy estresado' },
      { valor: 'soledad', etiqueta: 'Cuando me siento solo' },
      { valor: 'noche', etiqueta: 'Por la noche, en la cama' },
      { valor: 'redes', etiqueta: 'Después de las redes sociales' },
      { valor: 'otro', etiqueta: 'En otro momento' },
    ],
  },
  {
    clave: 'coste',
    titulo: '¿Qué te está costando?',
    ayuda: 'Marca todo lo que se aplique.',
    multiple: true,
    opciones: [
      { valor: 'energia', etiqueta: 'Energía' },
      { valor: 'concentracion', etiqueta: 'Concentración' },
      { valor: 'relaciones', etiqueta: 'Relaciones' },
      { valor: 'autoestima', etiqueta: 'Respeto por mí mismo' },
      { valor: 'tiempo', etiqueta: 'Tiempo' },
      { valor: 'sexualidad', etiqueta: 'Mi vida sexual real' },
    ],
  },
  {
    clave: 'objetivo',
    titulo: '¿Qué quieres recuperar?',
    ayuda: 'Lo que más. Solo uno.',
    opciones: [
      { valor: 'disciplina', etiqueta: 'Disciplina' },
      { valor: 'energia', etiqueta: 'Energía y claridad' },
      { valor: 'relacion', etiqueta: 'Mi relación' },
      { valor: 'confianza', etiqueta: 'Confianza' },
      { valor: 'libertad', etiqueta: 'Libertad' },
    ],
  },
  {
    clave: 'intentos',
    titulo: '¿Has intentado dejarlo antes?',
    opciones: [
      { valor: 'nunca', etiqueta: 'Nunca en serio' },
      { valor: 'alguna', etiqueta: 'Alguna vez' },
      { valor: 'muchas', etiqueta: 'Muchas veces' },
    ],
  },
];

/** Lo que se guarda en localStorage y después en profiles.plan. */
export interface RespuestasPlan {
  edad?: string;
  anios_habito?: number;
  frecuencia_semana?: number;
  minutos_sesion?: number;
  disparador?: string;
  coste?: string[];
  objetivo?: string;
  intentos?: string;
  /** ISO de la fecha objetivo (hoy + 90 días), fijada al terminar. */
  fecha_objetivo?: string;
}

export const CLAVE_ALMACEN = 'ra_plan_v1';

export function planCompleto(r: RespuestasPlan): boolean {
  return PREGUNTAS_PLAN.every((p) => {
    const v = r[p.clave];
    return p.multiple ? Array.isArray(v) && v.length > 0 : v !== undefined;
  });
}
