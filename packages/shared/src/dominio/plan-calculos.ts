import type { RespuestasPlan } from './plan-preguntas';

/**
 * Cálculos de la pantalla de resultados. Funciones puras: se pueden probar sin
 * React y sin navegador.
 *
 * Todo son aproximaciones y se presentan como tales ("aproximadamente",
 * "curva orientativa"). Una cifra exacta sobre datos redondeados sería una
 * mentira con decimales.
 */

export function horasPorAnio(r: RespuestasPlan): number {
  const freq = r.frecuencia_semana ?? 0;
  const min = r.minutos_sesion ?? 0;
  return Math.round((freq * min * 52) / 60);
}

export function horasEnTotal(r: RespuestasPlan): number {
  return Math.round(horasPorAnio(r) * (r.anios_habito ?? 0));
}

export interface Equivalencia {
  cantidad: number;
  etiqueta: string;
  detalle: string;
}

/**
 * En qué se traduce ese tiempo. Solo tiempo, y solo cosas que encajan con la
 * marca: entrenar, leer, días enteros. Se ocultan las que dan cero.
 */
export function equivalencias(horasAnio: number, horasTotal: number): Equivalencia[] {
  const lista: Equivalencia[] = [
    {
      cantidad: Math.floor(horasAnio),
      etiqueta: 'entrenamientos',
      detalle: 'de una hora, este año',
    },
    {
      cantidad: Math.floor(horasAnio / 6),
      etiqueta: 'libros',
      detalle: 'leídos de principio a fin',
    },
    {
      cantidad: Math.floor(horasAnio / 24),
      etiqueta: 'días enteros',
      detalle: 'de 24 horas, este año',
    },
    {
      cantidad: Math.floor(horasTotal / 40),
      etiqueta: 'semanas de trabajo',
      detalle: 'a jornada completa, desde que empezó',
    },
  ];
  return lista.filter((e) => e.cantidad > 0);
}

/**
 * Curva de mejora orientativa: sube rápido al principio y se estabiliza. Es la
 * forma que describe casi toda la literatura sobre abstinencia de dopamina;
 * los valores no pretenden ser una medida, solo la forma.
 */
export function mejora(dia: number): number {
  return Math.round(100 * (1 - Math.exp(-dia / 35)));
}

export const HITOS_MEJORA: ReadonlyArray<{ dia: number; texto: string }> = [
  { dia: 30, texto: 'Más energía y claridad' },
  { dia: 60, texto: 'Control ante el deseo' },
  { dia: 90, texto: 'Nueva identidad' },
];

export function fechaObjetivo(desde = new Date()): Date {
  const d = new Date(desde);
  d.setDate(d.getDate() + 90);
  return d;
}

export function formatearFecha(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** Frase de la pantalla de resultados según el objetivo elegido. */
export function fraseObjetivo(objetivo: string | undefined): string {
  switch (objetivo) {
    case 'disciplina':
      return 'La disciplina no se tiene: se construye un día cada vez.';
    case 'energia':
      return 'La energía que se va por ahí es la misma que te falta por la mañana.';
    case 'relacion':
      return 'Lo que das a una pantalla se lo quitas a alguien real.';
    case 'confianza':
      return 'La confianza es la suma de las veces que cumpliste lo que te dijiste.';
    case 'libertad':
      return 'Libre no es quien hace lo que quiere; es quien no hace lo que no quiere.';
    default:
      return 'Tu potencial es mayor que este hábito.';
  }
}
