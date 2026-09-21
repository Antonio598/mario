import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CARACTERISTICAS_PAD, MAX_PAD, OPCIONES_PAD, VIDEO_PAD } from '@reset-alfa/shared';
import { guardarPad } from '../perfil/api';
import { Boton, EnlacePremium, MensajeError, Kicker, Opcion, Tarjeta, textoAcceso } from '../../components/ui';
import { colors, fontSize, spacing, theme } from '../../theme';

/**
 * P.A.D en la app nativa. Mismo contenido y mismas reglas que en la web:
 * primero las cuatro caracteristicas, despues las opciones; una sola eleccion;
 * "Personalizar" abre un campo de texto.
 */

function BotonQueEs() {
  return (
    <Boton
      texto="¿Qué es el P.A.D?"
      variante="secundario"
      icono="play"
      onPress={() => void WebBrowser.openBrowserAsync(VIDEO_PAD)}
    />
  );
}

export function CrearPAD({
  actual,
  onCancelar,
  onGuardado,
}: {
  actual: string | null;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const esOpcion = (OPCIONES_PAD as readonly string[]).includes(actual ?? '');
  const [elegida, setElegida] = useState<string | null>(esOpcion ? actual : null);
  const [personalizado, setPersonalizado] = useState(!esOpcion && actual !== null);
  const [texto, setTexto] = useState(!esOpcion && actual !== null ? actual : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valor = personalizado ? texto.trim() : (elegida ?? '');
  const listo = valor.length > 0 && valor.length <= MAX_PAD;

  async function guardar() {
    if (!listo) return;
    setGuardando(true);
    setError(null);
    try {
      await guardarPad(valor);
      onGuardado();
    } catch (e) {
      setError(`No hemos podido guardarlo. ${e instanceof Error ? e.message : ''}`.trim());
      setGuardando(false);
    }
  }

  return (
    <Tarjeta>
      <Kicker>{actual === null ? 'Tu primera tarea' : 'Modificar'}</Kicker>
      <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.sm }]}>
        {actual === null ? 'Crea tu P.A.D' : 'Cambia tu P.A.D'}
      </Text>
      <Text style={[theme.texto, { marginTop: spacing.sm, fontSize: fontSize.sm }]}>
        Es una <Text style={{ color: colors.blanco, fontWeight: '700' }}>acción o tarea concreta</Text>{' '}
        que llevas a cabo en el momento en que aparece el deseo. Tiene que cumplir cuatro
        características:
      </Text>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {CARACTERISTICAS_PAD.map((c, i) => (
          <View key={c.titulo} style={{ flexDirection: 'row', gap: spacing.md }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.rojo,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.blancoPuro, fontWeight: '700', fontSize: fontSize.xs }}>
                {i + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.blanco, fontWeight: '600', fontSize: fontSize.sm }}>
                {c.titulo}
              </Text>
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{c.detalle}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[theme.separador, { marginVertical: spacing.lg }]} />

      <Text style={{ color: colors.blanco, fontWeight: '600', fontSize: fontSize.sm }}>
        Elige uno o crea el tuyo
      </Text>
      <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 2 }]}>
        Si no tienes ideas, cualquiera de estos vale.
      </Text>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {OPCIONES_PAD.map((o) => (
          <Opcion
            key={o}
            texto={o}
            activa={!personalizado && elegida === o}
            onPress={() => {
              setPersonalizado(false);
              setElegida(o);
            }}
          />
        ))}
        <Opcion
          texto="Personalizar el mío"
          activa={personalizado}
          onPress={() => {
            setPersonalizado(true);
            setElegida(null);
          }}
        />
      </View>

      {personalizado && (
        <View style={{ marginTop: spacing.sm }}>
          <TextInput
            autoFocus
            maxLength={MAX_PAD}
            value={texto}
            onChangeText={setTexto}
            placeholder="Ducha fría de dos minutos"
            placeholderTextColor={colors.grisApagado}
            accessibilityLabel="Tu P.A.D"
            style={theme.campo}
          />
          <Text style={[theme.textoTenue, { fontSize: 11, textAlign: 'right', marginTop: 4 }]}>
            {texto.length}/{MAX_PAD}
          </Text>
        </View>
      )}

      <MensajeError mensaje={error} />

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        <Boton texto="Cancelar" variante="secundario" onPress={onCancelar} style={{ flex: 0 }} />
        <Boton
          texto={guardando ? 'Guardando…' : actual === null ? 'Guardar mi P.A.D' : 'Guardar'}
          onPress={() => void guardar()}
          deshabilitado={!listo || guardando}
          style={{ flex: 1 }}
        />
      </View>
    </Tarjeta>
  );
}

export function TareaPAD({ onGuardado }: { onGuardado: () => void }) {
  const [creando, setCreando] = useState(false);
  if (creando) {
    return <CrearPAD actual={null} onCancelar={() => setCreando(false)} onGuardado={onGuardado} />;
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
            Crea tu P.A.D
          </Text>
          <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: spacing.xs }]}>
            Tu Protocolo Anti-Deseo: lo que haces en el momento exacto en que aparece el deseo.
            Sin él, cada recaída te pilla sin plan.
          </Text>
        </View>
      </View>
      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <BotonQueEs />
        <Boton texto="Crear mi P.A.D" onPress={() => setCreando(true)} />
      </View>
    </Tarjeta>
  );
}

export function RecordatorioPAD({ pad }: { pad: string }) {
  return (
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
          <Ionicons name="checkmark" size={20} color={colors.blancoPuro} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={theme.etiquetaEstadistica}>Tu P.A.D</Text>
          <Text style={{ color: colors.blanco, fontWeight: '600', fontSize: fontSize.base }}>
            {pad}
          </Text>
        </View>
      </View>
    </Tarjeta>
  );
}

export function AccionesPAD({
  pad,
  bloqueado,
  onGuardado,
}: {
  pad: string;
  bloqueado: boolean;
  onGuardado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return <CrearPAD actual={pad} onCancelar={() => setEditando(false)} onGuardado={onGuardado} />;
  }
  return (
    <Tarjeta>
      <Text style={theme.etiquetaEstadistica}>Tu P.A.D</Text>
      <Text style={{ color: colors.blanco, fontWeight: '600', fontSize: fontSize.base, marginTop: 2 }}>
        {pad}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <BotonQueEs />
        </View>
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
            Modificarlo es Premium. {textoAcceso()}
          </Text>
          <EnlacePremium />
        </>
      )}
    </Tarjeta>
  );
}
