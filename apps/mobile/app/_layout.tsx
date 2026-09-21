import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/features/auth/SessionProvider';
import { sincronizarIdentidadCompras } from '../src/features/premium/compras';
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

  // RevenueCat sigue a la sesion: el mismo id de usuario en las dos casas,
  // que es lo que permite al webhook conceder el acceso a quien compra.
  useEffect(() => {
    if (cargando) return;
    void sincronizarIdentidadCompras(session?.user.id ?? null);
  }, [session, cargando]);

  useEffect(() => {
    if (cargando) return;

    const enFlujoDeAuth = segments[0] === '(auth)';
    // El test de entrada se hace ANTES de tener cuenta: es la unica pantalla
    // publica fuera del flujo de acceso.
    const enEmbudo = segments[0] === 'empezar';

    if (session === null && !enFlujoDeAuth && !enEmbudo) {
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
