import { StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radius } from '@reset-alfa/tokens';

export { colors, fontSize, spacing, radius };

/**
 * Estilos comunes de la app.
 *
 * Los componentes no se comparten con la web —eso obligaria a react-native-web
 * y penalizaria el LCP de la web publicitaria— pero los valores si vienen del
 * mismo paquete de tokens, de modo que ambas superficies no puedan divergir.
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

  titulo: {
    color: colors.blanco,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  texto: {
    color: colors.grisTexto,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
  },

  textoTenue: {
    color: colors.grisTenue,
    fontSize: fontSize.sm,
  },

  botonPrimario: {
    backgroundColor: colors.rojo,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    /** 48 dp es el minimo tactil recomendado por las guias de accesibilidad. */
    minHeight: 48,
    justifyContent: 'center',
  },

  botonSecundario: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.negroBorde,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },

  textoBoton: {
    color: colors.blanco,
    fontSize: fontSize.base,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    minHeight: 48,
  },
});
