import { Pressable, Text, View } from 'react-native';
import { diaSemanaLunes, diasDelMes, nombreMes } from '@reset-alfa/shared';
import type { DiaCalendario } from '../streak/api';
import { colors, fontSize, radius, spacing, theme } from '../../theme';

interface Props {
  anio: number;
  mes: number;
  dias: readonly DiaCalendario[];
  onMes: (delta: number) => void;
  onDia: (dia: DiaCalendario) => void;
}

const CABECERA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/**
 * Vista mensual con los tres estados: completado, recaida y sin registro.
 *
 * ACCESIBILIDAD, y no es un detalle menor aqui: cerca del 8 % de los hombres
 * tiene alguna deficiencia en la vision del rojo y el verde, y esta app es para
 * hombres. Por eso ningun estado se distingue SOLO por color:
 *
 *   completado    fondo verde + borde solido + punto
 *   recaida       fondo rojo  + barra diagonal
 *   sin registro  fondo neutro, sin adorno
 *
 * Ademas cada celda lleva su etiqueta de accesibilidad completa, de modo que un
 * lector de pantalla anuncia el estado y no solo el numero.
 */
export function Calendario({ anio, mes, dias, onMes, onDia }: Props) {
  const total = diasDelMes(anio, mes);
  const primerDia = diaSemanaLunes(`${anio}-${String(mes).padStart(2, '0')}-01`);

  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const celdas: (DiaCalendario | number | null)[] = [];

  for (let i = 0; i < primerDia; i += 1) celdas.push(null);
  for (let d = 1; d <= total; d += 1) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celdas.push(porFecha.get(fecha) ?? d);
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <Pressable onPress={() => onMes(-1)} accessibilityRole="button" accessibilityLabel="Mes anterior" style={{ padding: spacing.sm }}>
          <Text style={{ color: colors.grisTexto, fontSize: fontSize.lg }}>‹</Text>
        </Pressable>

        <Text style={[theme.titulo, { fontSize: fontSize.lg }]}>
          {nombreMes(mes)} {anio}
        </Text>

        <Pressable onPress={() => onMes(1)} accessibilityRole="button" accessibilityLabel="Mes siguiente" style={{ padding: spacing.sm }}>
          <Text style={{ color: colors.grisTexto, fontSize: fontSize.lg }}>›</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {CABECERA.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            style={[theme.textoTenue, { flex: 1, textAlign: 'center', fontSize: fontSize.xs }]}
          >
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
        {celdas.map((celda, i) => {
          if (celda === null) {
            return <View key={`v-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }

          const esRegistro = typeof celda !== 'number';
          const numero = esRegistro ? Number(celda.fecha.slice(8, 10)) : celda;
          const estado = esRegistro ? celda.estado : 'sin_registro';

          const fondo =
            estado === 'en_racha'
              ? colors.exito
              : estado === 'recaida'
                ? colors.recaida
                : colors.sinRegistro;

          return (
            <View key={`d-${numero}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
              <Pressable
                disabled={!esRegistro || celda.relapse_id === null}
                onPress={() => esRegistro && onDia(celda)}
                accessibilityRole={esRegistro && celda.relapse_id !== null ? 'button' : 'text'}
                accessibilityLabel={
                  `Dia ${numero}: ` +
                  (estado === 'en_racha'
                    ? 'completado'
                    : estado === 'recaida'
                      ? 'recaida'
                      : 'sin registro')
                }
                style={{
                  flex: 1,
                  backgroundColor: fondo,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Segunda senal, ademas del color.
                  borderWidth: estado === 'en_racha' ? 2 : 0,
                  borderColor: colors.blanco,
                  opacity: estado === 'sin_registro' ? 0.45 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.blanco,
                    fontSize: fontSize.sm,
                    fontWeight: estado === 'sin_registro' ? '400' : '700',
                  }}
                >
                  {numero}
                </Text>

                {/* Tercera senal: forma. Un punto para el dia completado, una
                    barra para la recaida. Distinguibles sin percibir el color. */}
                {estado === 'en_racha' && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.blanco,
                      marginTop: 2,
                    }}
                  />
                )}
                {estado === 'recaida' && (
                  <View
                    style={{
                      width: 12,
                      height: 2,
                      backgroundColor: colors.blanco,
                      marginTop: 3,
                      transform: [{ rotate: '-45deg' }],
                    }}
                  />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg }}>
        {[
          { color: colors.exito, etiqueta: 'Completado' },
          { color: colors.recaida, etiqueta: 'Recaida' },
          { color: colors.sinRegistro, etiqueta: 'Sin registro' },
        ].map((l) => (
          <View key={l.etiqueta} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color }} />
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{l.etiqueta}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
