import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { obtenerEstadoDiario, type EstadoDiario } from '../../src/features/streak/api';
import { mensajeDelDia } from '../../src/features/streak/mensajes';
import { colors, fontSize, spacing, theme } from '../../src/theme';

/**
 * Pantalla de Inicio.
 *
 * El contador grande es lo primero y ocupa el espacio que merece: es la razon
 * por la que el usuario abre la app.
 *
 * La comprobacion del check-in diario vive aqui y no en el layout raiz. Si
 * estuviera en el layout, el modal podria aparecer encima del formulario de
 * recaida a medio rellenar.
 */
export default function InicioScreen() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoDiario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    const e = await obtenerEstadoDiario();
    setEstado(e);
    if (e.necesita_checkin) router.replace('/(modals)/checkin');
    return e;
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);

      void cargar()
        .catch(() => undefined)
        .finally(() => {
          if (activo) setCargando(false);
        });

      return () => {
        activo = false;
      };
    }, [cargar]),
  );

  if (cargando && estado === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  const racha = estado?.racha_actual ?? 0;

  return (
    <ScrollView
      style={theme.pantalla}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          tintColor={colors.rojo}
          onRefresh={() => {
            setRefrescando(true);
            void cargar()
              .catch(() => undefined)
              .finally(() => setRefrescando(false));
          }}
        />
      }
    >
      <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
        <Text
          style={{
            color: colors.blanco,
            fontSize: fontSize.contador,
            fontWeight: '700',
            lineHeight: fontSize.contador * 1.05,
          }}
          accessibilityLabel={`Racha actual: ${racha} ${racha === 1 ? 'dia' : 'dias'}`}
        >
          {racha}
        </Text>
        <Text style={{ color: colors.rojo, letterSpacing: 4, fontSize: fontSize.sm }}>
          {racha === 1 ? 'DIA' : 'DIAS'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl }}>
        {[
          { valor: estado?.record_personal ?? 0, etiqueta: 'Record' },
          { valor: estado?.dias_totales ?? 0, etiqueta: 'Dias totales' },
        ].map((s) => (
          <View key={s.etiqueta} style={{ flex: 1 }}>
            <Text style={{ color: colors.blanco, fontSize: fontSize.xl, fontWeight: '700' }}>
              {s.valor}
            </Text>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{s.etiqueta}</Text>
          </View>
        ))}
      </View>

      <View
        style={{
          borderLeftWidth: 2,
          borderLeftColor: colors.rojo,
          paddingLeft: spacing.md,
          marginBottom: spacing.xl,
        }}
      >
        <Text style={[theme.texto, { color: colors.blanco }]}>{mensajeDelDia(racha)}</Text>
      </View>

      {/* Carrusel de formacion, banner de mision y articulo del dia: fases 3 y 4. */}
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.negroBorde,
          borderRadius: 8,
          padding: spacing.md,
        }}
      >
        <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>
          Formacion, mision y articulo del dia llegan con las fases 3 y 4.
        </Text>
      </View>
    </ScrollView>
  );
}
