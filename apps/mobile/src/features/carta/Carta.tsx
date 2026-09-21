import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  MAX_RESPUESTA_CARTA,
  PREGUNTAS_CARTA,
  type RespuestasCarta,
} from '@reset-alfa/shared';
import { guardarCarta } from '../perfil/api';
import { Boton, EnlacePremium, MensajeError, Kicker, Tarjeta, textoAcceso } from '../../components/ui';
import { colors, fontSize, spacing, theme } from '../../theme';

/* -------------------------------------------------------------------------- */
/* Lectura a pantalla completa                                                 */
/* -------------------------------------------------------------------------- */

export function LeerCarta({
  carta,
  visible,
  onCerrar,
}: {
  carta: RespuestasCarta;
  visible: boolean;
  onCerrar: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xl }}>
          <Kicker>Tu carta anti-recaída</Kicker>
          <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Léela entera</Text>
          <Text style={[theme.textoTenue, { marginTop: spacing.xs }]}>
            La escribiste tú, en un momento de claridad. Hazle caso.
          </Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.xl }}>
            {PREGUNTAS_CARTA.map((p) => {
              const valor = carta[p.clave];
              if (valor === undefined) return null;
              return (
                <View
                  key={p.clave}
                  style={{ borderLeftWidth: 2, borderLeftColor: colors.rojo, paddingLeft: spacing.md }}
                >
                  <Text style={theme.kicker}>{p.encabezado}</Text>
                  <Text style={[theme.texto, { color: colors.blanco, marginTop: spacing.sm }]}>
                    {valor}
                  </Text>
                </View>
              );
            })}
          </View>

          <Boton texto="Ya la he leído" onPress={onCerrar} style={{ marginTop: spacing['2xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Creacion / edicion                                                          */
/* -------------------------------------------------------------------------- */

export function CrearCarta({
  actual,
  onCancelar,
  onGuardado,
}: {
  actual: RespuestasCarta | null;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [respuestas, setRespuestas] = useState<RespuestasCarta>(actual ?? {});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rellenas = PREGUNTAS_CARTA.filter((p) => (respuestas[p.clave] ?? '').trim() !== '').length;

  async function guardar() {
    if (rellenas === 0) return;
    setGuardando(true);
    setError(null);
    try {
      await guardarCarta(respuestas);
      onGuardado();
    } catch (e) {
      setError(`No hemos podido guardarla. ${e instanceof Error ? e.message : ''}`.trim());
      setGuardando(false);
    }
  }

  return (
    <Tarjeta>
      <Kicker>{actual === null ? 'Tu tarea pendiente' : 'Modificar'}</Kicker>
      <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.sm }]}>
        {actual === null ? 'Escribe tu carta anti-recaída' : 'Cambia tu carta'}
      </Text>
      <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: spacing.sm }]}>
        Un mensaje de ti para ti, para leerlo justo cuando aparezca la tentación. Responde a lo que
        puedas; con una sola respuesta sincera ya tienes carta.
      </Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        {PREGUNTAS_CARTA.map((p, i) => (
          <View key={p.clave}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.rojo,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Text style={{ color: colors.blancoPuro, fontWeight: '700', fontSize: 10 }}>
                  {i + 1}
                </Text>
              </View>
              <Text
                style={{ flex: 1, color: colors.blanco, fontWeight: '600', fontSize: fontSize.sm }}
              >
                {p.titulo}
              </Text>
            </View>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4, marginLeft: 28 }]}>
              {p.ayuda}
            </Text>
            <TextInput
              multiline
              maxLength={MAX_RESPUESTA_CARTA}
              value={respuestas[p.clave] ?? ''}
              onChangeText={(v) => setRespuestas((prev) => ({ ...prev, [p.clave]: v }))}
              placeholder={p.placeholder}
              placeholderTextColor={colors.grisApagado}
              accessibilityLabel={p.titulo}
              style={[theme.campo, { marginTop: spacing.sm, minHeight: 84, textAlignVertical: 'top' }]}
            />
          </View>
        ))}
      </View>

      <MensajeError mensaje={error} />

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        <Boton texto="Cancelar" variante="secundario" onPress={onCancelar} style={{ flex: 0 }} />
        <Boton
          texto={guardando ? 'Guardando…' : actual === null ? 'Guardar mi carta' : 'Guardar'}
          onPress={() => void guardar()}
          deshabilitado={rellenas === 0 || guardando}
          style={{ flex: 1 }}
        />
      </View>
    </Tarjeta>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarea, recordatorio y acciones                                              */
/* -------------------------------------------------------------------------- */

export function TareaCarta({ onGuardado }: { onGuardado: () => void }) {
  const [creando, setCreando] = useState(false);
  if (creando) {
    return <CrearCarta actual={null} onCancelar={() => setCreando(false)} onGuardado={onGuardado} />;
  }
  return (
    <Tarjeta destacada>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            width: 24,
            height: 24,
            marginTop: 2,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: colors.rojo,
          }}
        />
        <View style={{ flex: 1 }}>
          <Kicker>Tarea pendiente</Kicker>
          <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.xs }]}>
            Escribe tu carta anti-recaída
          </Text>
          <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: spacing.xs }]}>
            Un mensaje recordándote por qué no deberías ver porno ni masturbarte, para leerlo en el
            momento en que aparezca la tentación.
          </Text>
        </View>
      </View>
      <Boton texto="Escribir mi carta" onPress={() => setCreando(true)} style={{ marginTop: spacing.lg }} />
    </Tarjeta>
  );
}

export function RecordatorioCarta({ carta }: { carta: RespuestasCarta }) {
  const [leyendo, setLeyendo] = useState(false);
  return (
    <>
      <Tarjeta>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.rojo,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="mail" size={18} color={colors.blancoPuro} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={theme.etiquetaEstadistica}>Tu carta anti-recaída</Text>
            <Text style={[theme.textoTenue, { fontSize: fontSize.sm }]}>
              Para el momento de la tentación.
            </Text>
          </View>
          <Boton texto="Leer" onPress={() => setLeyendo(true)} style={{ minHeight: 40, paddingHorizontal: spacing.md }} />
        </View>
      </Tarjeta>
      <LeerCarta carta={carta} visible={leyendo} onCerrar={() => setLeyendo(false)} />
    </>
  );
}

export function AccionesCarta({
  carta,
  bloqueado,
  onGuardado,
}: {
  carta: RespuestasCarta;
  bloqueado: boolean;
  onGuardado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  if (editando) {
    return <CrearCarta actual={carta} onCancelar={() => setEditando(false)} onGuardado={onGuardado} />;
  }
  return (
    <>
      <Tarjeta>
        <Text style={theme.etiquetaEstadistica}>Tu carta anti-recaída</Text>
        <Text style={[theme.textoTenue, { fontSize: fontSize.sm, marginTop: 2 }]}>
          {Object.keys(carta).length} de {PREGUNTAS_CARTA.length} respuestas escritas.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Boton texto="Leer" onPress={() => setLeyendo(true)} style={{ flex: 1 }} />
          {!bloqueado && (
            <Boton
              texto="Modificar"
              variante="secundario"
              onPress={() => setEditando(true)}
              style={{ flex: 1 }}
            />
          )}
        </View>
        {bloqueado && (
          <>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: spacing.sm }]}>
              Modificarla es Premium. {textoAcceso()}
            </Text>
            <EnlacePremium />
          </>
        )}
      </Tarjeta>
      <LeerCarta carta={carta} visible={leyendo} onCerrar={() => setLeyendo(false)} />
    </>
  );
}
