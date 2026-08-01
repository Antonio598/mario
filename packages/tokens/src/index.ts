/**
 * Identidad visual de Modo Guerrero.
 *
 * VALORES PROVISIONALES. Los assets de marca no estaban disponibles al crear el
 * proyecto. Todo lo visual de la web y de la app deriva de este fichero, asi que
 * cuando lleguen la guia de color y las tipograficas reales solo hay que
 * sustituir los valores de aqui y de `tokens.css`.
 *
 * No se comparten COMPONENTES entre web y app: hacerlo obligaria a
 * react-native-web, que penaliza el bundle y el LCP de la web, que es
 * justamente de donde sale el ingreso publicitario. Se comparten los tokens.
 *
 * Los colores de marca son tres: negro, rojo y blanco. El resto de la paleta
 * son derivados neutros para dar profundidad. Sin escala intermedia, todo queda
 * plano y con el mismo peso visual.
 */

export const colors = {
  /**
   * Fondo principal. Negro con un punto de calidez, no #000 puro: en pantallas
   * OLED el negro absoluto contra texto blanco produce halo y cansa en lecturas
   * largas, que es exactamente lo que hace el usuario en los articulos.
   */
  negro: '#0A0A0A',
  /** Superficies elevadas: tarjetas, campos, cabecera fija. */
  negroElevado: '#141414',
  /** Segundo nivel, para superponer algo sobre una tarjeta. */
  negroAlto: '#1C1C1C',
  negroBorde: '#252525',
  negroBordeSuave: '#1A1A1A',

  /** Rojo de marca. Reservado a acentos y acciones, nunca como fondo amplio. */
  rojo: '#D32F2F',
  rojoClaro: '#EF5350',
  rojoOscuro: '#9A0007',
  /** Rojo al 12 %, para fondos de aviso y estados sutiles. */
  rojoTenue: 'rgba(211, 47, 47, 0.12)',

  /** Blanco roto: el #FFF puro sobre negro vibra y dificulta la lectura. */
  blanco: '#F7F7F7',
  blancoPuro: '#FFFFFF',
  grisTexto: '#B4B4B4',
  grisTenue: '#7A7A7A',
  grisApagado: '#4A4A4A',

  /**
   * Estados del calendario.
   *
   * NUNCA se codifican solo por color: cada estado lleva ademas forma y
   * etiqueta. Cerca del 8 % de los hombres tiene alguna deficiencia en la
   * vision del rojo y el verde, y esta app es para hombres.
   */
  exito: '#3E9E45',
  exitoTenue: 'rgba(62, 158, 69, 0.14)',
  recaida: '#D32F2F',
  sinRegistro: '#2E2E2E',
  aviso: '#E08A1E',
} as const;

export const fonts = {
  /** Titulares: condensada y contundente. Provisional hasta recibir la real. */
  titular: 'Oswald',
  cuerpo: 'Inter',
} as const;

/** Escala tipografica. En React Native son puntos; en web se convierten a rem. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
  /** Contador de racha de la pantalla de Inicio. */
  contador: 88,
} as const;

/** Espaciado en multiplos de 4. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 18,
  full: 9999,
} as const;

/**
 * Profundidad.
 *
 * Sobre fondo negro una sombra oscura no se ve. La elevacion se consigue
 * aclarando el fondo de la superficie y marcando su borde, no oscureciendo lo
 * que hay debajo.
 */
export const elevacion = {
  tarjeta: 'rgba(0, 0, 0, 0.4)',
  modal: 'rgba(0, 0, 0, 0.7)',
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type FontSizeToken = keyof typeof fontSize;
