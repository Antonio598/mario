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
 */

export const colors = {
  /** Fondo principal. Negro con un punto de calidez: el #000 puro produce halo en OLED. */
  negro: '#0A0A0A',
  negroElevado: '#141414',
  negroBorde: '#242424',

  /** Rojo de marca. */
  rojo: '#D32F2F',
  rojoClaro: '#EF5350',
  rojoOscuro: '#9A0007',

  blanco: '#FFFFFF',
  grisTexto: '#B8B8B8',
  grisTenue: '#6E6E6E',

  /** Estados del calendario. Nunca se codifican solo por color: */
  /** cada estado lleva ademas icono y etiqueta, porque cerca del 8 % de los */
  /** hombres tiene alguna deficiencia en la vision del rojo y el verde, y esta */
  /** app es para hombres. */
  exito: '#2E7D32',
  recaida: '#D32F2F',
  sinRegistro: '#3A3A3A',

  aviso: '#ED6C02',
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
  /** Contador de racha de la pantalla de Inicio. */
  contador: 72,
} as const;

/** Espaciado en multiplos de 4. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type FontSizeToken = keyof typeof fontSize;
