import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GRACIA_HORAS } from '@reset-alfa/shared';
import { siteUrl } from '../../src/lib/supabase';
import { obtenerAcceso, type Acceso } from '../../src/features/perfil/api';
import {
  comprarPremium,
  comprasDisponibles,
  obtenerOferta,
  restaurarCompras,
  urlGestionSuscripcion,
  type OfertaPremium,
} from '../../src/features/premium/compras';
import { Boton, Candado, Kicker, MensajeError, Tarjeta, TEXTO_ACCESO_NATIVO } from '../../src/components/ui';
import { colors, fontSize, spacing, theme } from '../../src/theme';

/**
 * Paywall nativo. La misma pantalla que /app/premium en la web, con una
 * diferencia que no es de diseno: el precio lo pone la TIENDA (en la moneda
 * del usuario) y el boton abre la hoja de pago de Apple o de Google. Nada de
 * Stripe, nada de enlaces a la web para pagar (Apple 3.1.1).
 *
 * Las dos opciones tienen el mismo peso visual. Sin cuenta atras, sin "oferta
 * unica", sin precio tachado: esas tecnicas suben la conversion del primer
 * dia y hunden la retencion del segundo mes.
 *
 * Apple exige, en la propia pantalla: el precio y la duracion, que se
 * renueva sola, como se cancela, y enlaces a la politica de privacidad y a
 * las condiciones. Todo esta abajo. "Restaurar compras" tambien es
 * obligatorio.
 */

const FILAS: readonly { f: string; gratis: string | boolean; premium: string | boolean }[] = [
  { f: 'Contador de racha', gratis: 'Hasta 30 días', premium: 'Sin límite' },
  { f: 'Check-in diario', gratis: true, premium: true },
  { f: 'Registrar una recaída', gratis: true, premium: true },
  { f: 'Bitácora de NOFAP (9 preguntas por recaída)', gratis: false, premium: true },
  { f: 'P.A.D — Protocolo Anti-Deseo', gratis: false, premium: true },
  { f: 'Carta anti-recaída', gratis: false, premium: true },
  { f: 'Medallas de 90, 180 y 365 días', gratis: false, premium: true },
  { f: 'Masterclasses y protocolos PDF', gratis: true, premium: true },
];

const ENLACE_CONDICIONES_APPLE = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

function Celda({ v }: { v: string | boolean }) {
  if (typeof v === 'string') {
    return <Text style={[theme.textoTenue, { fontSize: 11, textAlign: 'center' }]}>{v}</Text>;
  }
  return v ? (
    <Ionicons name="checkmark" size={16} color={colors.exito} accessibilityLabel="Incluido" />
  ) : (
    <Text style={[theme.textoTenue, { textAlign: 'center' }]} accessibilityLabel="No incluido">
      —
    </Text>
  );
}

function fechaCorta(iso: string): string {
  const sinGracia = new Date(new Date(iso).getTime() - GRACIA_HORAS * 3_600_000);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(sinGracia);
}

export default function PremiumModal() {
  const router = useRouter();
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [oferta, setOferta] = useState<OfertaPremium | null | 'error'>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recienActivado, setRecienActivado] = useState(false);

  const cargar = useCallback(async () => {
    const [a, o] = await Promise.all([
      obtenerAcceso(),
      comprasDisponibles() ? obtenerOferta().catch(() => 'error' as const) : Promise.resolve(null),
    ]);
    setAcceso(a);
    setOferta(o);
  }, []);

  useEffect(() => {
    void cargar().catch(() => setAcceso({ esPremium: false, expiraEn: null, cancelaAlFinal: false, origen: null }));
  }, [cargar]);

  const salir = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  async function comprar() {
    if (oferta === null || oferta === 'error') return;
    setTrabajando(true);
    setError(null);
    try {
      const r = await comprarPremium(oferta.paquete);
      if (r === 'activo') {
        setRecienActivado(true);
        await cargar();
      } else if (r === 'pendiente') {
        Alert.alert(
          'Pago en proceso',
          'La tienda está confirmando el pago. El acceso se activará solo en cuanto termine.',
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No hemos podido completar la compra.');
    } finally {
      setTrabajando(false);
    }
  }

  async function restaurar() {
    setTrabajando(true);
    setError(null);
    try {
      const activo = await restaurarCompras();
      await cargar();
      if (!activo) {
        Alert.alert('Nada que restaurar', 'No hay ninguna suscripción activa asociada a tu cuenta de la tienda.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No hemos podido restaurar las compras.');
    } finally {
      setTrabajando(false);
    }
  }

  async function gestionar() {
    const url = await urlGestionSuscripcion();
    if (url === null) {
      Alert.alert('Gestionar suscripción', 'Se gestiona desde los ajustes de suscripciones de tu cuenta de la tienda.');
      return;
    }
    await Linking.openURL(url);
  }

  if (acceso === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Vista premium                                                    */
  /* ---------------------------------------------------------------- */
  if (acceso.esPremium) {
    const enTienda = acceso.origen === 'apple' || acceso.origen === 'google';
    return (
      <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Kicker>Premium</Kicker>
          <Text style={theme.titulo}>{recienActivado ? 'Ya está' : 'Premium activo'}</Text>
          <Text style={theme.textoTenue}>
            {recienActivado
              ? 'Todas las herramientas están desbloqueadas. Gracias por confiar.'
              : 'Todas las herramientas están desbloqueadas.'}
          </Text>

          <Tarjeta>
            <Text style={[theme.texto, { fontSize: fontSize.sm }]}>
              {acceso.expiraEn === null
                ? 'Acceso sin fecha de fin.'
                : acceso.cancelaAlFinal
                  ? `Cancelado. Conservas el acceso hasta el ${fechaCorta(acceso.expiraEn)}.`
                  : `Se renueva el ${fechaCorta(acceso.expiraEn)}.`}
            </Text>
            {enTienda ? (
              <Boton texto="Gestionar suscripción" variante="secundario" onPress={() => void gestionar()} style={{ marginTop: spacing.md }} />
            ) : (
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: spacing.sm }]}>
                Suscripción contratada en la web. {TEXTO_ACCESO_NATIVO}
              </Text>
            )}
          </Tarjeta>

          <Boton texto="Ir a mi racha" onPress={() => router.replace('/(tabs)')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Vista gratuita: la oferta                                        */
  /* ---------------------------------------------------------------- */
  const comprable = comprasDisponibles();
  const precio = oferta !== null && oferta !== 'error' ? oferta.precio : null;

  return (
    <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Kicker>Elige cómo seguir</Kicker>
            <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Gratis o Premium</Text>
          </View>
          <Pressable onPress={salir} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12} style={{ padding: 4 }}>
            <Ionicons name="close" size={26} color={colors.grisTenue} />
          </Pressable>
        </View>
        <Text style={theme.textoTenue}>
          Las dos versiones registran tu racha. La diferencia está en lo que haces con una recaída.
        </Text>

        {/* Comparativa */}
        <Tarjeta style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.negroBorde }}>
            <Text style={[theme.textoTenue, { flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }]}>Incluye</Text>
            <Text style={[theme.textoTenue, { width: 64, textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }]}>Gratis</Text>
            <Text style={{ width: 64, textAlign: 'center', color: colors.rojo, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Premium</Text>
          </View>
          {FILAS.map((r, i) => (
            <View
              key={r.f}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: i === FILAS.length - 1 ? 0 : 1, borderBottomColor: colors.negroBorde }}
            >
              <Text style={[theme.texto, { flex: 1, fontSize: fontSize.sm }]}>{r.f}</Text>
              <View style={{ width: 64, alignItems: 'center' }}>
                <Celda v={r.gratis} />
              </View>
              <View style={{ width: 64, alignItems: 'center' }}>
                <Celda v={r.premium} />
              </View>
            </View>
          ))}
        </Tarjeta>

        {/* Las dos opciones, mismo peso */}
        <Tarjeta destacada>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Kicker>Premium</Kicker>
              <Text style={{ color: colors.blanco, fontSize: fontSize['2xl'], fontWeight: '700', marginTop: 4 }}>
                {precio !== null ? `${precio} / mes` : comprable ? '…' : 'Plan mensual'}
              </Text>
            </View>
            <Candado tamano={18} />
          </View>
          <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: spacing.sm }]}>
            Todas las herramientas del método. Sin permanencia: cancelas cuando quieras desde los ajustes de tu cuenta de la tienda.
          </Text>

          {comprable ? (
            <>
              <Boton
                texto={trabajando ? 'Un momento…' : precio !== null ? `Suscribirme por ${precio} al mes` : 'Cargando precio…'}
                onPress={() => void comprar()}
                deshabilitado={trabajando || precio === null}
                style={{ marginTop: spacing.md }}
              />
              {oferta === 'error' && (
                <MensajeError mensaje="No hemos podido cargar la oferta de la tienda. Comprueba la conexión e inténtalo de nuevo." />
              )}
              <MensajeError mensaje={error} />
            </>
          ) : (
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: spacing.md }]}>{TEXTO_ACCESO_NATIVO}</Text>
          )}
        </Tarjeta>

        <Tarjeta>
          <Kicker>Gratis</Kicker>
          <Text style={{ color: colors.blanco, fontSize: fontSize['2xl'], fontWeight: '700', marginTop: 4 }}>0</Text>
          <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: spacing.sm }]}>
            Contador hasta 30 días, check-in, registro de recaídas y las masterclasses.
          </Text>
          <Boton texto="Seguir con la versión gratuita" variante="secundario" onPress={salir} style={{ marginTop: spacing.md }} />
        </Tarjeta>

        {comprable && (
          <>
            <Boton texto="Restaurar compras" variante="fantasma" onPress={() => void restaurar()} deshabilitado={trabajando} />
            <Text style={[theme.textoTenue, { fontSize: 11, textAlign: 'center', lineHeight: 16 }]}>
              Suscripción mensual que se renueva automáticamente{precio !== null ? ` por ${precio}` : ''} salvo que la canceles
              al menos 24 horas antes del fin del periodo. El cargo se hace en tu cuenta de{' '}
              {Platform.OS === 'ios' ? 'Apple' : 'Google Play'} al confirmar la compra. Puedes gestionarla o cancelarla en los
              ajustes de suscripciones de tu cuenta.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
              <Pressable onPress={() => void WebBrowser.openBrowserAsync(`${siteUrl}/privacidad`)} accessibilityRole="link" hitSlop={8}>
                <Text style={{ color: colors.grisTenue, fontSize: 11, textDecorationLine: 'underline' }}>Política de privacidad</Text>
              </Pressable>
              <Pressable
                onPress={() => void WebBrowser.openBrowserAsync(Platform.OS === 'ios' ? ENLACE_CONDICIONES_APPLE : `${siteUrl}/privacidad`)}
                accessibilityRole="link"
                hitSlop={8}
              >
                <Text style={{ color: colors.grisTenue, fontSize: 11, textDecorationLine: 'underline' }}>Condiciones de uso</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
