/**
 * Dominio compartido entre la web y la app nativa.
 *
 * Solo logica pura y constantes: sin React, sin Next, sin React Native. Es lo
 * que garantiza que las dos superficies hagan las mismas preguntas, calculen
 * los mismos logros y muestren los mismos textos. Con una copia en cada sitio
 * ya divergieron una vez (las etiquetas de la ficha de recaida); no se repite.
 */
export * from './tipos';
export * from './preguntas-recaida';
export * from './pad';
export * from './carta';
export * from './enlaces';
export * from './racha';
export * from './hitos';
export * from './plan-preguntas';
export * from './plan-calculos';
export * from './logros';
