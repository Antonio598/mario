import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { AVISO_NO_TERAPEUTICO, RECURSOS_AYUDA } from '@reset-alfa/shared';
import { colors, fontSize, spacing, theme } from '../../theme';

interface Props {
  rachaAnterior: number;
  detalleGuardado: boolean;
  onCerrar: () => void;
}

/**
 * Pantalla final del protocolo.
 *
 * REENCUADRE, NO CASTIGO. Es el momento de mayor riesgo de abandono: si la app
 * te trata como a un fracasado justo aqui, se desinstala. El mensaje reconoce
 * lo que si se construyo, senala que ya hay una accion concreta anotada y
 * devuelve al usuario al presente.
 *
 * Los recursos de ayuda profesional van discretos pero siempre presentes, como
 * exige el brief. Protegen legalmente al cliente y son lo correcto.
 */
export function Cierre({ rachaAnterior, detalleGuardado, onCerrar }: Props) {
  return (
    <ScrollView
      style={theme.pantalla}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing['2xl'] }}
    >
      <Text style={[theme.titulo, { fontSize: fontSize['2xl'] }]}>Registrado.</Text>

      <Text style={[theme.texto, { marginTop: spacing.lg }]}>
        {rachaAnterior > 0
          ? `Aguantaste ${rachaAnterior} ${rachaAnterior === 1 ? 'dia' : 'dias'}. Eso ya lo sabes hacer: no se ha borrado.`
          : 'Has vuelto a empezar. Eso tambien cuenta.'}
      </Text>

      <Text style={[theme.texto, { marginTop: spacing.md }]}>
        {detalleGuardado
          ? 'Tienes por escrito que lo disparo y que vas a cambiar. Manana empieza la cuenta otra vez.'
          : 'Manana empieza la cuenta otra vez.'}
      </Text>

      <View
        style={{
          marginTop: spacing.xl,
          borderLeftWidth: 2,
          borderLeftColor: colors.rojo,
          paddingLeft: spacing.md,
        }}
      >
        <Text style={[theme.texto, { fontWeight: '700', color: colors.blanco }]}>
          Una sola cosa ahora
        </Text>
        <Text style={[theme.textoTenue, { marginTop: spacing.xs }]}>
          Aplica la accion que acabas de escribir. Hoy, no manana.
        </Text>
      </View>

      <Pressable
        style={[theme.botonPrimario, { marginTop: spacing.xl }]}
        onPress={onCerrar}
        accessibilityRole="button"
      >
        <Text style={theme.textoBoton}>Volver al inicio</Text>
      </Pressable>

      {/* Recursos de ayuda. Discretos, nunca ausentes. */}
      <View style={{ marginTop: spacing['2xl'], paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.negroBorde }}>
        <Text style={theme.textoTenue}>
          Si esto te desborda, hablarlo con un profesional ayuda:
        </Text>

        {RECURSOS_AYUDA.map((r) => (
          <Pressable
            key={r.nombre}
            onPress={() => void Linking.openURL(r.url)}
            accessibilityRole="link"
            style={{ marginTop: spacing.md }}
          >
            <Text style={{ color: colors.grisTexto, fontSize: fontSize.sm }}>
              {r.nombre}
              {r.telefono !== null ? ` · ${r.telefono}` : ''}
            </Text>
            <Text style={{ color: colors.grisTenue, fontSize: fontSize.xs }}>{r.descripcion}</Text>
          </Pressable>
        ))}

        <Text style={[theme.textoTenue, { marginTop: spacing.lg, fontSize: fontSize.xs }]}>
          {AVISO_NO_TERAPEUTICO}
        </Text>
      </View>
    </ScrollView>
  );
}
