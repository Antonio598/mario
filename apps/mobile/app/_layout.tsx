import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/features/auth/SessionProvider';
import { colors } from '../src/theme';

/**
 * Portero de sesion.
 *
 * Vive dentro del provider porque necesita leer el estado de sesion, y la
 * redireccion se hace en un efecto y no durante el render: navegar mientras se
 * renderiza provoca un aviso de React y, en algunos casos, un bucle.
 */
function Guardia() {
  const { session, cargando } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;

    const enFlujoDeAuth = segments[0] === '(auth)';

    if (session === null && !enFlujoDeAuth) {
      router.replace('/(auth)/sign-in');
    } else if (session !== null && enFlujoDeAuth) {
      router.replace('/(tabs)');
    }
  }, [session, cargando, segments, router]);

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.negro, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Guardia />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
