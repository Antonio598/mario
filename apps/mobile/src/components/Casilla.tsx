import { Pressable, Text, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';

interface Props {
  marcada: boolean;
  onCambio: (valor: boolean) => void;
  etiqueta: string;
  ayuda?: string;
}

/**
 * Casilla de consentimiento.
 *
 * Toda el area —casilla y texto— es pulsable: un cuadrado de 20 px es un
 * objetivo demasiado pequeno en movil y provoca aceptaciones accidentales, que
 * en materia de consentimiento no son solo un problema de usabilidad.
 *
 * Nunca se inicializa marcada. Ver el comentario de sign-up.tsx.
 */
export function Casilla({ marcada, onCambio, etiqueta, ayuda }: Props) {
  return (
    <Pressable
      onPress={() => onCambio(!marcada)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={etiqueta}
      style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.xs }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          marginTop: 2,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: marcada ? colors.rojo : colors.negroBorde,
          backgroundColor: marcada ? colors.rojo : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {marcada && (
          <Text style={{ color: colors.blanco, fontSize: fontSize.xs, fontWeight: '900' }}>
            ✓
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.grisTexto, fontSize: fontSize.sm, lineHeight: 20 }}>
          {etiqueta}
        </Text>
        {ayuda !== undefined && (
          <Text
            style={{
              color: colors.grisTenue,
              fontSize: fontSize.xs,
              lineHeight: 17,
              marginTop: spacing.xs,
            }}
          >
            {ayuda}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
