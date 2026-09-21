import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { esClaveHito } from '@reset-alfa/shared';
import { obtenerAcceso } from '../../../src/features/perfil/api';
import { HitoLanding } from '../../../src/features/hitos/HitoLanding';
import { colors, theme } from '../../../src/theme';

/**
 * /hito/7-dias, /hito/30-dias, /hito/recaida.
 *
 * `modo` distingue el interstitial que abre Inicio (marca el hito como visto
 * al salir) del acceso posterior desde Calendario (solo vuelve).
 */
export default function HitoModal() {
  const router = useRouter();
  const { clave, modo } = useLocalSearchParams<{ clave: string; modo?: string }>();
  const [esPremium, setEsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    void obtenerAcceso()
      .then((a) => setEsPremium(a.esPremium))
      .catch(() => setEsPremium(false));
  }, []);

  if (typeof clave !== 'string' || !esClaveHito(clave)) {
    router.replace('/(tabs)');
    return null;
  }

  if (esPremium === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  return (
    <HitoLanding
      clave={clave}
      esPremium={esPremium}
      modo={modo === 'pagina' ? 'pagina' : 'interstitial'}
      onSalir={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
    />
  );
}
