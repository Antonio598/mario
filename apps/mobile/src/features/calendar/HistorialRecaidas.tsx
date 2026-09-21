import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { camposRecaida, fechaLarga, LEMA_BITACORA, NOMBRE_BITACORA, type CampoRecaida } from '@reset-alfa/shared';
import { detalleRecaida, type EntradaHistorial } from '../perfil/api';
import { Chip, Tarjeta, TituloSeccion, TEXTO_ACCESO_NATIVO } from '../../components/ui';
import { colors, fontSize, spacing, theme } from '../../theme';

/**
 * Bitacora de NOFAP en el calendario. Igual que la web: en Premium cada
 * entrada se despliega y muestra las respuestas; en gratis se ve la lista
 * -son sus dias- con candado, sin enlace ni precio.
 */
export function HistorialRecaidas({ entradas, esPremium }: { entradas: EntradaHistorial[]; esPremium: boolean }) {
  const [todas, setTodas] = useState(false);
  const visibles = todas ? entradas : entradas.slice(0, 5);

  return (
    <View style={{ marginTop: spacing.xl }}>
      <TituloSeccion
        derecha={
          entradas.length > 5 ? (
            <Pressable onPress={() => setTodas((v) => !v)} accessibilityRole="button">
              <Text style={{ color: colors.rojo, fontWeight: '600', fontSize: fontSize.sm }}>
                {todas ? 'Ver menos' : `Ver todas (${entradas.length})`}
              </Text>
            </Pressable>
          ) : undefined
        }
      >
        {NOMBRE_BITACORA}
      </TituloSeccion>
      <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]}>{LEMA_BITACORA}.</Text>

      {entradas.length === 0 ? (
        <Tarjeta style={{ marginTop: spacing.md, alignItems: 'center' }}>
          <Text style={theme.textoTenue}>Todavía no has registrado ninguna recaída. Sigue así.</Text>
        </Tarjeta>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {visibles.map((e) => (esPremium ? <EntradaPremium key={e.fecha} entrada={e} /> : <EntradaBloqueada key={e.fecha} entrada={e} />))}
        </View>
      )}
    </View>
  );
}

function Fila({ entrada, derecha }: { entrada: EntradaHistorial; derecha: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rojo }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.blanco, fontWeight: '600', fontSize: fontSize.sm }}>{fechaLarga(entrada.fecha)}</Text>
        <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>
          Racha anterior: {entrada.racha_anterior} {entrada.racha_anterior === 1 ? 'día' : 'días'}
        </Text>
      </View>
      {derecha}
    </View>
  );
}

function EntradaPremium({ entrada }: { entrada: EntradaHistorial }) {
  const [abierta, setAbierta] = useState(false);
  const [campos, setCampos] = useState<CampoRecaida[] | null>(null);
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    const siguiente = !abierta;
    setAbierta(siguiente);
    if (!siguiente || campos !== null) return;
    setCargando(true);
    try {
      const fila = await detalleRecaida(entrada.fecha);
      setCampos(fila === null ? [] : camposRecaida(fila));
    } catch {
      setCampos([]);
    } finally {
      setCargando(false);
    }
  }

  const contestadas = campos?.filter((c) => c.valor !== null) ?? [];

  return (
    <Tarjeta>
      <Pressable onPress={() => void alternar()} accessibilityRole="button" accessibilityState={{ expanded: abierta }}>
        <Fila entrada={entrada} derecha={<Ionicons name={abierta ? 'chevron-up' : 'chevron-down'} size={18} color={colors.rojo} />} />
      </Pressable>
      {abierta && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.negroBordeSuave, marginTop: spacing.md, paddingTop: spacing.md }}>
          {cargando ? (
            <Text style={theme.textoTenue}>Cargando…</Text>
          ) : contestadas.length === 0 ? (
            <Text style={theme.textoTenue}>Ese día se registró la recaída sin rellenar la bitácora.</Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {contestadas.map((c) => (
                <View key={c.etiqueta} style={{ borderLeftWidth: 2, borderLeftColor: colors.negroBorde, paddingLeft: spacing.sm }}>
                  <Text style={theme.etiquetaEstadistica}>{c.etiqueta}</Text>
                  <Text style={[theme.texto, { color: colors.blanco, fontSize: fontSize.sm, marginTop: 2 }]}>{c.valor}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Tarjeta>
  );
}

function EntradaBloqueada({ entrada }: { entrada: EntradaHistorial }) {
  const [aviso, setAviso] = useState(false);
  return (
    <Tarjeta>
      <Pressable onPress={() => setAviso((v) => !v)} accessibilityRole="button">
        <Fila
          entrada={entrada}
          derecha={
            <Chip rojo>
              <Ionicons name="lock-closed" size={10} /> Premium
            </Chip>
          }
        />
      </Pressable>
      {aviso && (
        <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: spacing.sm }]}>
          Las respuestas de la bitácora son Premium. {TEXTO_ACCESO_NATIVO}
        </Text>
      )}
    </Tarjeta>
  );
}
