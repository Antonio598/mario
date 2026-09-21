import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { camposRecaida, fechaLarga, NOMBRE_BITACORA, type CampoRecaida } from '@reset-alfa/shared';
import { detalleRecaida } from '../../src/features/perfil/api';
import { Kicker } from '../../src/components/ui';
import { colors, fontSize, spacing, theme } from '../../src/theme';

/**
 * Ficha de un dia de recaida. `id` es la fecha (YYYY-MM-DD): se abre al tocar
 * un dia rojo del calendario. Solo lectura. Las preguntas sin respuesta no se
 * pintan: ver huecos en blanco convierte una omision deliberada en un reproche.
 *
 * Las etiquetas son las MISMAS del formulario, generadas desde la lista
 * compartida de preguntas.
 */
export default function DetalleRecaidaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campos, setCampos] = useState<CampoRecaida[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    void detalleRecaida(id)
      .then((fila) => {
        if (!activo) return;
        setCampos(fila === null ? [] : camposRecaida(fila).filter((c) => c.valor !== null));
      })
      .catch(() => {
        if (activo) setCampos([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
      <Stack.Screen options={{ title: NOMBRE_BITACORA }} />
      <Kicker>{NOMBRE_BITACORA}</Kicker>
      <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.sm }]}>{fechaLarga(id)}</Text>

      {campos === null || campos.length === 0 ? (
        <Text style={[theme.texto, { marginTop: spacing.lg }]}>
          Ese día quedó registrado como recaída, pero no se guardó el detalle de la bitácora.
        </Text>
      ) : (
        <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
          {campos.map((c) => (
            <View key={c.etiqueta} style={{ borderLeftWidth: 2, borderLeftColor: colors.negroBorde, paddingLeft: spacing.md }}>
              <Text style={theme.etiquetaEstadistica}>{c.etiqueta}</Text>
              <Text style={[theme.texto, { color: colors.blanco, marginTop: 4 }]}>{c.valor}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
