import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { calcularLogros, type DatosLogros, type Logro } from '@reset-alfa/shared';
import { Chip, Tarjeta, TituloSeccion } from '../../components/ui';
import { colors, fontSize, spacing, theme } from '../../theme';

/**
 * Medallas. El calculo es el compartido con la web (calcularLogros); aqui
 * solo se pintan. Conseguida: circulo rojo con la marca. Pendiente: contorno
 * y candado. Premium en gratis: candado y la palabra "Premium".
 */
function Medalla({ logro }: { logro: Logro }) {
  return (
    <Tarjeta style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs, opacity: logro.conseguido ? 1 : 0.5 }}>
      <View
        accessibilityLabel={`${logro.titulo}: ${logro.conseguido ? 'conseguido' : 'pendiente'}`}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: logro.conseguido ? colors.rojo : colors.negroElevado,
          borderWidth: 2,
          borderColor: logro.conseguido ? colors.rojoOscuro : colors.negroBorde,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logro.conseguido ? (
          <Text
            style={{
              color: colors.blancoPuro,
              fontWeight: '700',
              fontSize: logro.marca.length > 2 ? 11 : 15,
            }}
          >
            {logro.marca}
          </Text>
        ) : (
          <Ionicons name="lock-closed" size={14} color={colors.grisTenue} />
        )}
      </View>
      <Text
        style={{
          color: colors.blanco,
          fontSize: fontSize.xs,
          fontWeight: '700',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        {logro.titulo}
      </Text>
      <Text style={[theme.textoTenue, { fontSize: 10, textAlign: 'center', lineHeight: 13 }]}>
        {logro.premium ? 'Premium' : logro.descripcion}
      </Text>
    </Tarjeta>
  );
}

export function Logros({ datos }: { datos: DatosLogros }) {
  const logros = calcularLogros(datos);
  const conseguidos = logros.filter((l) => l.conseguido).length;
  const ordenados = [...logros.filter((l) => l.conseguido), ...logros.filter((l) => !l.conseguido)];

  // Filas de tres.
  const filas: Logro[][] = [];
  for (let i = 0; i < ordenados.length; i += 3) filas.push(ordenados.slice(i, i + 3));

  return (
    <View style={{ marginTop: spacing.xl }}>
      <TituloSeccion derecha={<Chip>{`${conseguidos} de ${logros.length}`}</Chip>}>Logros</TituloSeccion>
      <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]}>
        Las medallas de racha se quedan aunque después recaigas. Lo conseguido, conseguido está.
      </Text>
      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {filas.map((fila, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
            {fila.map((l) => (
              <Medalla key={l.id} logro={l} />
            ))}
            {fila.length < 3 && Array.from({ length: 3 - fila.length }).map((_, j) => <View key={j} style={{ flex: 1 }} />)}
          </View>
        ))}
      </View>
    </View>
  );
}
