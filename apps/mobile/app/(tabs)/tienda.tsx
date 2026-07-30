import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listarProductos, abrirFichaEnWeb, type Producto } from '../../src/features/learning/api';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

/**
 * Tienda: catalogo INFORMATIVO.
 *
 * Sin carrito, sin precios y sin pago. Cada tarjeta abre la ficha en el
 * navegador externo, donde ocurre toda la venta.
 *
 * `precio_cents` llega de la base de datos —la web lo necesita— pero esta
 * pantalla no lo pinta a proposito. Mostrarlo convertiria la app en un
 * escaparate de venta y activaria la obligacion de usar la compra integrada de
 * Apple y Google, con su comision del 15-30 %.
 */
export default function TiendaScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      void listarProductos()
        .then((p) => {
          if (activo) setProductos(p);
        })
        .catch(() => undefined)
        .finally(() => {
          if (activo) setCargando(false);
        });

      return () => {
        activo = false;
      };
    }, []),
  );

  if (cargando && productos.length === 0) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[theme.textoTenue, { marginBottom: spacing.lg }]}>
        Toca cualquier ficha para consultarla en la web.
      </Text>

      {productos.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => void abrirFichaEnWeb(p)}
          accessibilityRole="button"
          accessibilityHint="Se abre en el navegador"
          style={{
            borderWidth: 1,
            borderColor: colors.negroBorde,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            backgroundColor: colors.negroElevado,
          }}
        >
          <Text style={[theme.titulo, { fontSize: fontSize.lg }]}>{p.nombre}</Text>
          {p.descripcion !== null && (
            <Text style={[theme.texto, { marginTop: spacing.sm }]}>{p.descripcion}</Text>
          )}
          <Text style={[theme.textoTenue, { marginTop: spacing.md }]}>Ver en la web</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
