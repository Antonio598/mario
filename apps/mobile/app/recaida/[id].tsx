import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fechaLarga } from '@reset-alfa/shared';
import { supabase } from '../../src/lib/supabase';
import { colors, fontSize, spacing, theme } from '../../src/theme';
import { PREGUNTAS } from '../../src/features/relapse/preguntas';

type Detalle = Record<string, string | boolean | null> & { created_at: string };

/**
 * Detalle de una recaida.
 *
 * Se abre al tocar un dia marcado en el calendario o una fila del historial.
 * Solo lectura: revisar el propio registro es lo que da valor al formulario.
 *
 * Las preguntas sin respuesta no se pintan. Ver huecos en blanco convierte una
 * omision deliberada en un reproche.
 */
export default function DetalleRecaidaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    void supabase
      .from('relapses')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!activo) return;
        setDetalle(data as Detalle | null);
        setCargando(false);
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

  if (detalle === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center', padding: spacing.lg }]}>
        <Text style={theme.texto}>No hemos encontrado este registro.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Registro' }} />

      <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[theme.titulo, { fontSize: fontSize.xl }]}>
          {fechaLarga(detalle.created_at.slice(0, 10))}
        </Text>

        {PREGUNTAS.map((p) => {
          const valor = detalle[p.campo];
          if (valor === null || valor === undefined || valor === '') return null;

          return (
            <View key={p.campo} style={{ marginTop: spacing.lg }}>
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{p.titulo}</Text>
              <Text style={[theme.texto, { marginTop: spacing.xs, color: colors.blanco }]}>
                {typeof valor === 'boolean' ? (valor ? 'Si' : 'No') : String(valor)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}
