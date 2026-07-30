import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fechaLarga } from '@reset-alfa/shared';
import { supabase } from '../../lib/supabase';
import { colors, fontSize, spacing, theme } from '../../theme';

interface Fila {
  id: string;
  created_at: string;
  trigger: string | null;
  lugar: string | null;
  checkin_id: string;
}

/**
 * Historial de recaidas, bajo el calendario.
 *
 * Se lee directamente de `relapses` porque la RLS ya limita las filas a las del
 * propio usuario: no hace falta un RPC para esto.
 *
 * Si el usuario no dio consentimiento del art. 9, no habra ninguna fila y la
 * lista no se muestra. Es el comportamiento correcto: sus recaidas constan en
 * el calendario, pero el detalle nunca se guardo.
 */
export function HistorialRecaidas() {
  const router = useRouter();
  const [filas, setFilas] = useState<Fila[]>([]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      void supabase
        .from('relapses')
        .select('id, created_at, trigger, lugar, checkin_id')
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => {
          if (activo && data !== null) setFilas(data as Fila[]);
        });

      return () => {
        activo = false;
      };
    }, []),
  );

  if (filas.length === 0) return null;

  return (
    <View style={{ marginTop: spacing['2xl'] }}>
      <Text style={[theme.titulo, { fontSize: fontSize.lg }]}>Historial</Text>

      {filas.map((f) => (
        <Pressable
          key={f.id}
          onPress={() => router.push(`/recaida/${f.id}`)}
          accessibilityRole="button"
          style={{
            marginTop: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.negroBorde,
          }}
        >
          <Text style={{ color: colors.grisTexto, fontSize: fontSize.sm }}>
            {fechaLarga(f.created_at.slice(0, 10))}
          </Text>
          <Text style={[theme.textoTenue, { marginTop: 2 }]} numberOfLines={1}>
            {f.trigger ?? f.lugar ?? 'Sin detalle'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
