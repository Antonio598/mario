import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendario } from '../../src/features/calendar/Calendario';
import { HistorialRecaidas } from '../../src/features/calendar/HistorialRecaidas';
import {
  obtenerCalendario,
  obtenerEstadoDiario,
  type DiaCalendario,
  type EstadoDiario,
} from '../../src/features/streak/api';
import { colors, fontSize, spacing, theme } from '../../src/theme';

export default function CalendarioScreen() {
  const router = useRouter();
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [dias, setDias] = useState<DiaCalendario[]>([]);
  const [estado, setEstado] = useState<EstadoDiario | null>(null);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect y no useEffect: al volver de registrar una recaida, el
  // calendario debe reflejarla sin que el usuario tenga que refrescar a mano.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);

      void Promise.all([obtenerCalendario(anio, mes), obtenerEstadoDiario()])
        .then(([d, e]) => {
          if (!activo) return;
          setDias(d);
          setEstado(e);
        })
        .catch(() => undefined)
        .finally(() => {
          if (activo) setCargando(false);
        });

      return () => {
        activo = false;
      };
    }, [anio, mes]),
  );

  function cambiarMes(delta: number) {
    const m = mes + delta;
    if (m < 1) {
      setMes(12);
      setAnio((a) => a - 1);
    } else if (m > 12) {
      setMes(1);
      setAnio((a) => a + 1);
    } else {
      setMes(m);
    }
  }

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl }}>
        {[
          { valor: estado?.racha_actual ?? 0, etiqueta: 'Racha actual' },
          { valor: estado?.record_personal ?? 0, etiqueta: 'Record' },
          { valor: estado?.dias_totales ?? 0, etiqueta: 'Dias totales' },
        ].map((s) => (
          <View key={s.etiqueta} style={{ flex: 1 }}>
            <Text style={{ color: colors.blanco, fontSize: fontSize['2xl'], fontWeight: '700' }}>
              {s.valor}
            </Text>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{s.etiqueta}</Text>
          </View>
        ))}
      </View>

      {cargando && dias.length === 0 ? (
        <ActivityIndicator color={colors.rojo} />
      ) : (
        <Calendario
          anio={anio}
          mes={mes}
          dias={dias}
          onMes={cambiarMes}
          onDia={(d) => {
            if (d.relapse_id !== null) router.push(`/recaida/${d.relapse_id}`);
          }}
        />
      )}

      <HistorialRecaidas />
    </ScrollView>
  );
}
