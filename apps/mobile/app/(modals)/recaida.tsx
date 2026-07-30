import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PREGUNTAS } from '../../src/features/relapse/preguntas';
import { BarraProgreso } from '../../src/features/relapse/BarraProgreso';
import { Paso } from '../../src/features/relapse/Paso';
import { Cierre } from '../../src/features/relapse/Cierre';
import { guardarRecaida, type RespuestasRecaida } from '../../src/features/streak/api';
import { colors, spacing, theme } from '../../src/theme';

type Valor = string | boolean | null;

/**
 * Protocolo post-recaida, estilo Typeform.
 *
 * Una pregunta por pantalla, barra de progreso y transiciones suaves. Todas las
 * preguntas se pueden saltar: son datos de categoria especial y el principio de
 * minimizacion obliga a que ninguna sea obligatoria.
 *
 * El envio ocurre en un unico RPC que registra el check-in y el detalle en la
 * misma transaccion. Si el usuario no dio consentimiento del art. 9, el
 * servidor guarda solo el check-in y descarta el detalle en silencio: la app no
 * puede quedarse bloqueada justo aqui.
 */
export default function RecaidaScreen() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, Valor>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    rachaAnterior: number;
    detalleGuardado: boolean;
  } | null>(null);

  const pregunta = PREGUNTAS[paso];
  const esUltima = paso === PREGUNTAS.length - 1;

  function establecer(valor: Valor) {
    if (pregunta === undefined) return;
    setRespuestas((prev) => ({ ...prev, [pregunta.campo]: valor }));
  }

  async function enviar() {
    setEnviando(true);
    setError(null);

    try {
      // Las cadenas vacias se envian como null: una respuesta en blanco no es
      // un dato, y guardarla contradiria la minimizacion.
      const limpias: RespuestasRecaida = {};
      for (const p of PREGUNTAS) {
        const v = respuestas[p.campo];
        if (v === undefined || v === null) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        Object.assign(limpias, { [p.campo]: typeof v === 'string' ? v.trim() : v });
      }

      const r = await guardarRecaida(limpias);
      setResultado({
        rachaAnterior: r.racha_anterior,
        detalleGuardado: r.detalle_guardado,
      });
    } catch {
      setError('No hemos podido guardar el registro. Vuelve a intentarlo.');
    } finally {
      setEnviando(false);
    }
  }

  if (resultado !== null) {
    return (
      <Cierre
        rachaAnterior={resultado.rachaAnterior}
        detalleGuardado={resultado.detalleGuardado}
        onCerrar={() => router.replace('/(tabs)')}
      />
    );
  }

  if (pregunta === undefined) return null;

  return (
    <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <BarraProgreso paso={paso} total={PREGUNTAS.length} />
          <Text style={[theme.textoTenue, { marginTop: spacing.sm }]}>
            {paso + 1} de {PREGUNTAS.length}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <Paso
            pregunta={pregunta}
            valor={respuestas[pregunta.campo] ?? null}
            onCambio={establecer}
          />
        </View>

        {error !== null && (
          <Text style={{ color: colors.rojoClaro, paddingHorizontal: spacing.lg }}>{error}</Text>
        )}

        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Pressable
            style={[theme.botonPrimario, enviando && { opacity: 0.6 }]}
            disabled={enviando}
            accessibilityRole="button"
            onPress={() => {
              if (esUltima) void enviar();
              else setPaso((p) => p + 1);
            }}
          >
            <Text style={theme.textoBoton}>
              {enviando ? 'Guardando...' : esUltima ? 'Terminar' : 'Siguiente'}
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => setPaso((p) => Math.max(p - 1, 0))}
              disabled={paso === 0}
              accessibilityRole="button"
              style={{ padding: spacing.sm, opacity: paso === 0 ? 0 : 1 }}
            >
              <Text style={theme.textoTenue}>Atras</Text>
            </Pressable>

            {/* Saltar siempre visible: ninguna pregunta es obligatoria. */}
            <Pressable
              onPress={() => {
                if (esUltima) void enviar();
                else setPaso((p) => p + 1);
              }}
              disabled={enviando}
              accessibilityRole="button"
              style={{ padding: spacing.sm }}
            >
              <Text style={theme.textoTenue}>Prefiero no responder</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
