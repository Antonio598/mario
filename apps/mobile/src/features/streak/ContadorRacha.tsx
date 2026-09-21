import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { LIMITE_RACHA_GRATIS, mostrarDias, rachaRecortada } from '@reset-alfa/shared';
import { ajustarRacha } from '../perfil/api';
import { Boton, EnlacePremium, MensajeError, Tarjeta, textoAcceso } from '../../components/ui';
import { colors, fontSize, spacing, theme } from '../../theme';

const HITOS = [7, 21, 30, 90, 180, 365] as const;

/** Cuenta desde cero al valor final al montar. */
function useCuenta(destino: number, duracion = 900): number {
  const [valor, setValor] = useState(destino);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (destino === 0) {
      setValor(0);
      return;
    }
    anim.setValue(0);
    const id = anim.addListener(({ value }) => setValor(Math.round(destino * value)));
    Animated.timing(anim, { toValue: 1, duration: duracion, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [destino, duracion, anim]);

  return valor;
}

/**
 * Contador de racha. En gratis se detiene en 30: la racha real sigue contando
 * en el servidor y se dice cual es. Sin precio: el paywall lo pone la tienda
 * (ver textoAcceso y EnlacePremium en components/ui).
 */
export function ContadorRacha({
  dias,
  record,
  diasTotales,
  esPremium,
}: {
  dias: number;
  record: number;
  diasTotales: number;
  esPremium: boolean;
}) {
  const recortada = rachaRecortada(dias, esPremium);
  const visibles = recortada ? LIMITE_RACHA_GRATIS : dias;
  const mostrado = useCuenta(visibles);
  const hitos = esPremium ? HITOS : HITOS.filter((h) => h <= LIMITE_RACHA_GRATIS);
  const siguiente = hitos.find((h) => h > visibles) ?? null;

  return (
    <View style={{ gap: spacing.md }}>
      <Tarjeta>
        <Text style={theme.etiquetaEstadistica}>Racha actual</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: 4 }}>
          <Text
            style={{
              color: colors.blanco,
              fontSize: fontSize['4xl'] + 16,
              fontWeight: '700',
              lineHeight: fontSize['4xl'] + 20,
              fontVariant: ['tabular-nums'],
            }}
            accessibilityLabel={`Racha actual: ${mostrarDias(dias, esPremium)} días`}
          >
            {mostrado}
            {recortada && <Text style={{ color: colors.rojo, fontSize: fontSize['2xl'] }}>+</Text>}
          </Text>
          <Text style={{ color: colors.grisTexto, fontSize: fontSize.xl, fontWeight: '500' }}>
            {visibles === 1 ? 'día' : 'días'}
          </Text>
        </View>
        <Text style={[theme.textoTenue, { marginTop: 2 }]}>Sin porno</Text>

        {recortada && (
          <View
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.rojoTenue,
              borderRadius: 12,
              padding: spacing.md,
            }}
          >
            <Text style={[theme.texto, { color: colors.blanco, fontSize: fontSize.sm }]}>
              Tu racha real es de <Text style={{ fontWeight: '700' }}>{dias} días</Text>. Sigue
              contando.
            </Text>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]}>
              {textoAcceso()}
            </Text>
            <EnlacePremium texto="Ver Premium →" />
          </View>
        )}

        {siguiente !== null && (
          <View style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[theme.textoTenue, { fontSize: 11 }]}>Siguiente hito: {siguiente} días</Text>
              <Text style={{ color: colors.rojo, fontSize: 11, fontWeight: '500' }}>
                {siguiente - visibles} {siguiente - visibles === 1 ? 'día' : 'días'} más
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.negroBorde,
                marginTop: 6,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(100, (visibles / siguiente) * 100)}%`,
                  backgroundColor: colors.rojo,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        )}
      </Tarjeta>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          { t: 'Récord', v: mostrarDias(record, esPremium) },
          { t: 'Días totales', v: String(diasTotales) },
        ].map((s) => (
          <Tarjeta key={s.t} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={theme.etiquetaEstadistica}>{s.t}</Text>
            <Text style={theme.valorEstadistica}>{s.v}</Text>
          </Tarjeta>
        ))}
      </View>
    </View>
  );
}

/** Ajuste manual: quien lleva meses sin porno no empieza en cero al instalar. */
export function AjustarRacha({ diasActuales, onAjustado }: { diasActuales: number; onAjustado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState(String(diasActuales));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    const n = Number(dias);
    if (!Number.isInteger(n) || n < 0 || n > 3650) {
      setError('Introduce un número entre 0 y 3650.');
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await ajustarRacha(n);
      setAbierto(false);
      onAjustado();
    } catch (e) {
      setError(`No hemos podido guardarlo. ${e instanceof Error ? e.message : ''}`.trim());
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <Boton
        texto="Ajustar mis días de racha"
        variante="fantasma"
        onPress={() => setAbierto(true)}
        style={{ marginTop: spacing.sm }}
      />
    );
  }

  return (
    <Tarjeta style={{ marginTop: spacing.md }}>
      <Text style={[theme.subtitulo]}>Ajustar la racha</Text>
      <Text style={[theme.textoTenue, { marginTop: 4 }]}>
        ¿Cuántos días llevas ya? Si empezaste antes de instalar la app, ponlo aquí.
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
        <TextInput
          keyboardType="number-pad"
          value={dias}
          onChangeText={setDias}
          accessibilityLabel="Días de racha"
          style={[theme.campo, { width: 110, textAlign: 'center', fontSize: fontSize.xl, fontWeight: '700' }]}
        />
        <Text style={theme.texto}>días</Text>
      </View>
      <MensajeError mensaje={error} />
      <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: spacing.sm }]}>
        Tu récord y tus días totales se recalculan solos.
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <Boton
          texto="Cancelar"
          variante="secundario"
          onPress={() => {
            setAbierto(false);
            setDias(String(diasActuales));
            setError(null);
          }}
          style={{ flex: 1 }}
        />
        <Boton
          texto={guardando ? 'Guardando…' : 'Guardar'}
          onPress={() => void guardar()}
          deshabilitado={guardando}
          style={{ flex: 1 }}
        />
      </View>
    </Tarjeta>
  );
}
