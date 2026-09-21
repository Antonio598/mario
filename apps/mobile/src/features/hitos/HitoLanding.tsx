import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import {
  ENLACE_LIBRO_ENERGIA,
  ENLACE_SESION_DIAGNOSTICA,
  HITOS,
  PRECIO_SESION_DIAGNOSTICA,
  type ClaveHito,
} from '@reset-alfa/shared';
import { siteUrl } from '../../lib/supabase';
import { marcarHito } from '../perfil/api';
import { AvisoAcceso, Boton, Kicker, Tarjeta } from '../../components/ui';
import { colors, fontSize, radius, spacing, theme } from '../../theme';

/**
 * Landing de hito: video y llamadas a la accion del momento.
 *
 * El video se reproduce desde la web (app.modoguerrero.es/videos/...) y no va
 * dentro del binario: son 37 MB que engordarian cada descarga de la App Store
 * por tres pantallas que se ven una vez.
 *
 * REGLAS DE PLATAFORMA EN LOS CTA:
 *   - Sesion diagnostica: es un servicio prestado fuera de la app (una llamada
 *     con una persona), no contenido digital. Apple lo permite pagar fuera
 *     (3.1.3(e)). Se abre en el navegador externo.
 *   - Libro: producto fisico en Amazon. Igual.
 *   - Premium: contenido digital. NI precio NI enlace (ver TEXTO_ACCESO_NATIVO).
 */
export function HitoLanding({
  clave,
  esPremium,
  modo,
  onSalir,
}: {
  clave: ClaveHito;
  esPremium: boolean;
  /** interstitial: marca el hito como visto al salir. */
  modo: 'interstitial' | 'pagina';
  onSalir: () => void;
}) {
  const def = HITOS[clave];
  const [saliendo, setSaliendo] = useState(false);
  const player = useVideoPlayer(`${siteUrl}${def.video}`, (p) => {
    p.loop = false;
  });

  async function continuar() {
    setSaliendo(true);
    if (modo === 'interstitial' && clave !== 'recaida') {
      await marcarHito(clave).catch(() => undefined);
    }
    onSalir();
  }

  return (
    <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Kicker>{def.kicker}</Kicker>
        <Text style={theme.titulo}>{def.titulo}</Text>
        <Text style={[theme.texto, { fontSize: fontSize.sm }]}>{def.texto}</Text>

        <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000', marginTop: spacing.sm }}>
          <VideoView
            player={player}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            nativeControls
            contentFit="contain"
            allowsFullscreen
          />
        </View>

        {clave === '30-dias' && (
          <Tarjeta destacada style={{ marginTop: spacing.sm }}>
            <Kicker>Sesión diagnóstica</Kicker>
            <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.sm }]}>
              Una hora con Mario, a solas
            </Text>
            <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: spacing.sm }]}>
              Revisáis tu caso, tus patrones y el plan para los siguientes 60 días. Con un mes de
              racha ya tienes datos que analizar.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
              <Text style={{ color: colors.blanco, fontSize: fontSize.xl, fontWeight: '700' }}>
                {PRECIO_SESION_DIAGNOSTICA}
              </Text>
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>Pago único · en el navegador</Text>
            </View>
            <Boton
              texto="Reservar mi sesión"
              icono="open-outline"
              onPress={() => void WebBrowser.openBrowserAsync(ENLACE_SESION_DIAGNOSTICA)}
              style={{ marginTop: spacing.md }}
            />
          </Tarjeta>
        )}

        {clave === 'recaida' && (
          <>
            {!esPremium && (
              <AvisoAcceso texto="Que la próxima no te pille sin plan: Bitácora de NOFAP, P.A.D y carta anti-recaída." />
            )}
            <Tarjeta style={{ flexDirection: 'row', gap: spacing.md }}>
              <Image
                source={{ uri: `${siteUrl}/libros/energia-sexual-masculina.jpg` }}
                style={{ width: 88, height: 88, borderRadius: radius.sm }}
                contentFit="cover"
                accessibilityLabel="Portada de Energía Sexual Masculina"
              />
              <View style={{ flex: 1 }}>
                <Kicker>El libro</Kicker>
                <Text style={[theme.titulo, { fontSize: fontSize.lg, marginTop: 4 }]}>
                  Energía Sexual Masculina
                </Text>
                <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]}>
                  El poder de la retención seminal, explicado para transmutarlo en disciplina.
                </Text>
                <Boton
                  texto="Conseguir el libro"
                  variante="fantasma"
                  icono="open-outline"
                  onPress={() => void WebBrowser.openBrowserAsync(ENLACE_LIBRO_ENERGIA)}
                  style={{ alignSelf: 'flex-start', paddingHorizontal: 0, minHeight: 36 }}
                />
              </View>
            </Tarjeta>
          </>
        )}

        {clave === '7-dias' && !esPremium && (
          <AvisoAcceso texto="La segunda semana es donde más se cae. Ten las herramientas antes." />
        )}

        <Boton
          texto={clave === '7-dias' ? 'Seguir con mi racha' : 'Volver a la app'}
          variante={clave === '7-dias' ? 'primario' : 'secundario'}
          onPress={() => void continuar()}
          deshabilitado={saliendo}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
