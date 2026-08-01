import { StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radius } from '@reset-alfa/tokens';

export { colors, fontSize, spacing, radius };

/**
 * Estilos comunes de la app nativa.
 *
 * Los componentes no se comparten con la web —eso obligaria a react-native-web
 * y penalizaria el LCP de la web publicitaria— pero los valores si vienen del
 * mismo paquete de tokens, de modo que ambas superficies no puedan divergir.
 *
 * Todo lo pulsable mide al menos 48 dp de alto. Es el umbral de las guias de
 * accesibilidad de Apple y Google; por debajo, los toques fallidos se disparan
 * en pantallas grandes usadas con una mano.
 */
export const theme = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.negro,
  },

  contenido: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  /* ------------------------------------------------------------------ */
  /* Tipografia                                                         */
  /* ------------------------------------------------------------------ */

  /** Etiqueta roja en versalitas. Va sobre casi todos los titulos. */
  kicker: {
    color: colors.rojo,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },

  titulo: {
    color: colors.blanco,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  subtitulo: {
    color: colors.blanco,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },

  texto: {
    color: colors.grisTexto,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.55,
  },

  textoTenue: {
    color: colors.grisTenue,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },

  /* ------------------------------------------------------------------ */
  /* Superficies                                                        */
  /* ------------------------------------------------------------------ */

  tarjeta: {
    backgroundColor: colors.negroElevado,
    borderWidth: 1,
    borderColor: colors.negroBorde,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  /**
   * Separador de un pixel real.
   *
   * `hairlineWidth` vale 0,5 en pantallas de densidad alta. Un borde de 1 dp
   * se ve como una linea gruesa y sucia junto a texto fino.
   */
  separador: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.negroBorde,
  },

  /* ------------------------------------------------------------------ */
  /* Controles                                                          */
  /* ------------------------------------------------------------------ */

  botonPrimario: {
    backgroundColor: colors.rojo,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },

  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.negroBorde,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },

  textoBoton: {
    color: colors.blancoPuro,
    fontSize: fontSize.base,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  textoBotonSecundario: {
    color: colors.grisTexto,
    fontSize: fontSize.base,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  campo: {
    backgroundColor: colors.negroElevado,
    borderWidth: 1,
    borderColor: colors.negroBorde,
    borderRadius: radius.sm,
    color: colors.blanco,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    minHeight: 52,
  },

  /* ------------------------------------------------------------------ */
  /* Estadisticas                                                       */
  /* ------------------------------------------------------------------ */

  filaEstadisticas: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.negroBorde,
    borderRadius: radius.md,
    overflow: 'hidden',
  },

  celdaEstadistica: {
    flex: 1,
    backgroundColor: colors.negroElevado,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  etiquetaEstadistica: {
    color: colors.grisTenue,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  valorEstadistica: {
    color: colors.blanco,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
    /**
     * Digitos de ancho fijo: sin esto, al pasar de 9 a 10 dias el numero se
     * desplaza y parece un fallo de renderizado.
     */
    fontVariant: ['tabular-nums'],
  },
});
