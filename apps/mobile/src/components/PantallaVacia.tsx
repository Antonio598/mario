import { Text, View } from 'react-native';
import { colors, spacing, theme } from '../theme';

interface Props {
  titulo: string;
  descripcion: string;
  /** Fase en la que esta pantalla se implementa de verdad. */
  fase: string;
}

/**
 * Marcador de posicion de la Fase 1.
 *
 * Indica explicitamente en que fase se construye cada pantalla, para que al
 * revisar la app quede claro que esta vacio por planificacion y no por olvido.
 */
export function PantallaVacia({ titulo, descripcion, fase }: Props) {
  return (
    <View style={[theme.pantalla, { justifyContent: 'center', padding: spacing.lg }]}>
      <Text style={theme.titulo}>{titulo}</Text>
      <Text style={[theme.texto, { marginTop: spacing.md }]}>{descripcion}</Text>
      <View
        style={{
          marginTop: spacing.lg,
          borderLeftWidth: 2,
          borderLeftColor: colors.negroBorde,
          paddingLeft: spacing.md,
        }}
      >
        <Text style={theme.textoTenue}>Se implementa en la {fase}.</Text>
      </View>
    </View>
  );
}
