import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registrarCheckin } from '../../src/features/streak/api';
import { colors, fontSize, spacing, theme } from '../../src/theme';

/**
 * Modal de arranque diario.
 *
 * Aparece una vez por dia natural del usuario. La decision de mostrarlo la toma
 * el servidor (`estado_diario.necesita_checkin`), no el reloj del dispositivo.
 *
 * Dos botones y nada mas. Esta pantalla se ve todos los dias durante meses: una
 * pregunta clara y dos respuestas es lo unico que sobrevive a esa repeticion.
 *
 * El boton de recaida NO se pinta en gris apagado ni se esconde. Hacerlo
 * cargaria de culpa el gesto de ser honesto, y un tracker en el que mentir es
 * mas comodo que registrar deja de servir para nada.
 */
export default function CheckinModal() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seguirEnRacha() {
    setEnviando(true);
    setError(null);
    try {
      await registrarCheckin();
      router.replace('/(tabs)');
    } catch {
      setError('No hemos podido registrar el check-in. Comprueba tu conexion.');
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ color: colors.rojo, letterSpacing: 3, marginBottom: spacing.md }}>
          MODO GUERRERO
        </Text>

        <Text style={[theme.titulo, { fontSize: fontSize['3xl'] }]}>Sigues en racha?</Text>

        <Text style={[theme.texto, { marginTop: spacing.md }]}>
          Responde con la verdad. El registro solo sirve si es real.
        </Text>

        {error !== null && (
          <Text style={{ color: colors.rojoClaro, marginTop: spacing.md }}>{error}</Text>
        )}

        <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
          <Pressable
            style={[theme.botonPrimario, enviando && { opacity: 0.6 }]}
            onPress={() => void seguirEnRacha()}
            disabled={enviando}
            accessibilityRole="button"
          >
            <Text style={theme.textoBoton}>{enviando ? 'Registrando...' : 'Si, sigo'}</Text>
          </Pressable>

          <Pressable
            style={theme.botonSecundario}
            onPress={() => router.replace('/(modals)/recaida')}
            disabled={enviando}
            accessibilityRole="button"
          >
            <Text style={theme.textoBoton}>He recaido</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
