import { PREGUNTAS as PREGUNTAS_COMPARTIDAS, type Pregunta as PreguntaCompartida } from '@reset-alfa/shared';

export type TipoPregunta = 'texto' | 'texto_largo' | 'hora' | 'si_no';

export interface Pregunta {
  campo: PreguntaCompartida['campo'];
  tipo: TipoPregunta;
  titulo: string;
  ayuda?: string;
  placeholder?: string;
}

/**
 * Las nueve preguntas de la Bitacora de NOFAP, tal cual las define
 * packages/shared: son las mismas que en la web y las mismas etiquetas con las
 * que se leen despues en el calendario. Aqui solo se adapta el tipo de campo
 * al control nativo: el texto libre va siempre en area multilinea.
 */
export const PREGUNTAS: readonly Pregunta[] = PREGUNTAS_COMPARTIDAS.map((p) => ({
  campo: p.campo,
  tipo: p.tipo === 'texto' ? 'texto_largo' : p.tipo,
  titulo: p.titulo,
  ...(p.ayuda !== undefined ? { ayuda: p.ayuda } : {}),
  ...(p.placeholder !== undefined ? { placeholder: p.placeholder } : {}),
}));
