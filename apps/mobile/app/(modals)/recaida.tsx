import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LEMA_BITACORA, NOMBRE_BITACORA } from '@reset-alfa/shared';
import { PREGUNTAS } from '../../src/features/relapse/preguntas';
import { BarraProgreso } from '../../src/features/relapse/BarraProgreso';
import { Paso } from '../../src/features/relapse/Paso';
import { guardarRecaida, obtenerEstadoDiario, type RespuestasRecaida } from '../../src/features/streak/api';
import { darConsentimiento, obtenerAcceso } from '../../src/features/perfil/api';
import { avisarRecaida } from '../../src/features/relapse/aviso';
import { Bloqueado, Boton, Kicker, MensajeError, Tarjeta } from '../../src/components/ui';
import { colors, fontSize, spacing, theme } from '../../src/theme';

type Valor = string | boolean | null;

/**
 * Bitacora de NOFAP: registra tus recaidas y acelera tu progreso en NOFAP.
 *
 * Misma logica que la web, en este orden:
 *   1. Gratis: se registra el dia y las nueve preguntas quedan tras el candado.
 *   2. Premium sin consentimiento del art. 9: se ofrece darlo aqui mismo, o
 *      registrar solo el dia.
 *   3. Premium con consentimiento: una pregunta por pantalla.
 *
 * Al terminar, siempre la landing de recaida: video y herramientas.
 */
export default function RecaidaScreen() {
  const router = useRouter();
  const [fase, setFase] = useState<'cargando' | 'libre' | 'consentimiento' | 'preguntas'>('cargando');
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, Valor>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  const versionPolitica = String(
    Constants.expoConfig?.extra?.['privacyPolicyVersion'] ?? '2026-07-30',
  );

  useEffect(() => {
    void Promise.all([obtenerAcceso(), obtenerEstadoDiario()])
      .then(([a, e]) => {
        if (!a.esPremium) setFase('libre');
        else setFase(e.consiente_sensibles ? 'preguntas' : 'consentimiento');
      })
      .catch(() => setFase('libre'));
  }, []);

  const pregunta = PREGUNTAS[paso];
  const esUltima = paso === PREGUNTAS.length - 1;

  async function enviar(datos: RespuestasRecaida) {
    setEnviando(true);
    setError(null);
    try {
      const r = await guardarRecaida(datos);
      setHecho(true);
      // Aviso por correo al equipo, sin esperar ni bloquear: el registro ya esta.
      void avisarRecaida({ ...datos, racha_anterior: r.racha_anterior });
    } catch (e) {
      setError(`No hemos podido guardarlo. ${e instanceof Error ? e.message : ''}`.trim());
    } finally {
      setEnviando(false);
    }
  }

  function enviarPreguntas() {
    const limpias: RespuestasRecaida = {};
    for (const p of PREGUNTAS) {
      const v = respuestas[p.campo];
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim() === '') continue;
      Object.assign(limpias, { [p.campo]: typeof v === 'string' ? v.trim() : v });
    }
    void enviar(limpias);
  }

  async function activarConsentimiento() {
    setEnviando(true);
    setError(null);
    try {
      await darConsentimiento(true, versionPolitica);
      setFase('preguntas');
    } catch (e) {
      setError(`No hemos podido guardar tu decisión. ${e instanceof Error ? e.message : ''}`.trim());
    } finally {
      setEnviando(false);
    }
  }

  const irALanding = () =>
    router.replace({ pathname: '/(modals)/hito/[clave]', params: { clave: 'recaida', modo: 'pagina' } });

  /* ---------------------------------------------------------------- */
  if (fase === 'cargando') {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Registrado                                                       */
  /* ---------------------------------------------------------------- */
  if (hecho) {
    return (
      <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <Kicker>Registrado</Kicker>
          <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Esto no borra lo anterior</Text>
          <Text style={[theme.texto, { marginTop: spacing.md }]}>
            Los días que ya sostuviste siguen siendo tuyos. Ahora tienes algo que antes no tenías:
            sabes dónde, cuándo y qué lo disparó.
          </Text>
          <Text style={[theme.texto, { marginTop: spacing.sm }]}>
            Mañana el contador vuelve a empezar.
          </Text>
          <Boton texto="Continuar" onPress={irALanding} style={{ marginTop: spacing['2xl'] }} />
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Gratis: el dia si, las preguntas no                              */
  /* ---------------------------------------------------------------- */
  if (fase === 'libre') {
    const primera = PREGUNTAS[0];
    return (
      <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Kicker>Recaída</Kicker>
          <Text style={theme.titulo}>Hoy cuenta como recaída</Text>
          <Text style={[theme.texto, { fontSize: fontSize.sm }]}>
            Se registra el día y la racha vuelve a empezar mañana. Es lo que hace que el contador
            sea real.
          </Text>
          <MensajeError mensaje={error} />
          <Boton
            texto={enviando ? 'Guardando…' : 'Registrar el día'}
            onPress={() => void enviar({})}
            deshabilitado={enviando}
          />
          <View style={{ marginTop: spacing.md }}>
            <Bloqueado
              titulo={NOMBRE_BITACORA}
              texto={`${LEMA_BITACORA}. Nueve preguntas que te dicen dónde, cuándo y por qué.`}
            >
              <Tarjeta>
                <Text style={theme.textoTenue}>1 de {PREGUNTAS.length}</Text>
                <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.sm }]}>
                  {primera?.titulo}
                </Text>
                <Text style={[theme.textoTenue, { marginTop: spacing.sm }]}>{primera?.ayuda}</Text>
                <View style={[theme.campo, { minHeight: 90, marginTop: spacing.md }]} />
              </Tarjeta>
            </Bloqueado>
          </View>
          <Boton texto="Salir sin registrar" variante="secundario" onPress={() => router.replace('/(tabs)')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Consentimiento del art. 9, aqui mismo                            */
  /* ---------------------------------------------------------------- */
  if (fase === 'consentimiento') {
    return (
      <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: 'center' }}>
          <Kicker>{NOMBRE_BITACORA}</Kicker>
          <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Antes de empezar</Text>
          <Text style={[theme.textoTenue, { marginTop: 4 }]}>{LEMA_BITACORA}</Text>
          <Text style={[theme.texto, { marginTop: spacing.md, fontSize: fontSize.sm }]}>
            La bitácora te va a preguntar dónde, cuándo y en qué estado ocurrió. Esa información
            describe aspectos de tu vida sexual, así que la ley exige tu permiso explícito para
            guardarla.
          </Text>
          <Text style={[theme.texto, { marginTop: spacing.sm, fontSize: fontSize.sm }]}>
            Tus respuestas se guardan en tu historial y se envían al equipo de Modo Guerrero para
            poder darte seguimiento. Nadie más las ve. Puedes exportarlas o borrarlas cuando quieras
            desde Perfil.
          </Text>
          <MensajeError mensaje={error} />
          <Boton
            texto={enviando ? 'Un momento…' : 'Acepto, empezar la bitácora'}
            onPress={() => void activarConsentimiento()}
            deshabilitado={enviando}
            style={{ marginTop: spacing.xl }}
          />
          <Boton
            texto="Registrar solo el día, sin detalle"
            variante="secundario"
            onPress={() => void enviar({})}
            deshabilitado={enviando}
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Una pregunta por pantalla                                        */
  /* ---------------------------------------------------------------- */
  if (pregunta === undefined) return null;

  return (
    <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            onCambio={(v) => setRespuestas((prev) => ({ ...prev, [pregunta.campo]: v }))}
          />
        </View>

        {error !== null && (
          <Text style={{ color: colors.rojoClaro, paddingHorizontal: spacing.lg }}>{error}</Text>
        )}

        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {paso > 0 && (
              <Boton texto="Atrás" variante="secundario" onPress={() => setPaso((p) => p - 1)} style={{ flex: 0 }} />
            )}
            <Boton
              texto={enviando ? 'Guardando…' : esUltima ? 'Terminar' : 'Siguiente'}
              onPress={() => (esUltima ? enviarPreguntas() : setPaso((p) => p + 1))}
              deshabilitado={enviando}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => (esUltima ? enviarPreguntas() : setPaso((p) => p + 1))}
              disabled={enviando}
              accessibilityRole="button"
              style={{ padding: spacing.sm }}
            >
              <Text style={theme.textoTenue}>Prefiero no responder</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)')} accessibilityRole="button" style={{ padding: spacing.sm }}>
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>Salir sin guardar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
