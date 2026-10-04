import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { faltaConfiguracion } from '../src/lib/supabase';
import { SessionProvider, useSession } from '../src/features/auth/SessionProvider';
import { sincronizarIdentidadCompras } from '../src/features/premium/compras';
import { colors, fontSize, spacing } from '../src/theme';

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

  return (
    <Stack
      screenOptions={{
        /**
         * Sin cabecera por defecto: las pestanas traen la suya y las pantallas
         * a pantalla completa (acceso, test de entrada, modales) estan
         * disenadas sin ella.
         *
         * Las de detalle la activan abajo, y eso es lo que les da el boton de
         * volver. Antes este layout usaba <Slot>, que no crea navegador: el
         * detalle de una masterclass se abria sin cabecera y sin forma de
         * salir, y el contenido empezaba pegado a la barra de estado.
         */
        headerShown: false,
        headerStyle: { backgroundColor: colors.negro },
        headerTintColor: colors.blanco,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        // Solo la flecha: el texto de al lado lo pone el sistema en su idioma.
        headerBackButtonDisplayMode: 'minimal' as const,
        // Evita el destello blanco entre pantallas sobre fondo negro.
        contentStyle: { backgroundColor: colors.negro },
      }}
    >
      <Stack.Screen name="curso/[slug]" options={{ headerShown: true, title: 'Formación' }} />
      <Stack.Screen name="recaida/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}

/**
 * Build sin configurar: se dice QUE falta, en la pantalla.
 *
 * Un build al que le faltan las variables no puede funcionar, pero tampoco
 * debe cerrarse solo: una app que se cierra al abrir no da ninguna pista y es
 * rechazo seguro en la revision. Esto solo puede verlo quien compila.
 */
function SinConfigurar({ variables }: { variables: readonly string[] }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.negro }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md }}
    >
      <Text style={{ color: colors.rojo, fontSize: fontSize.sm, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
        Build sin configurar
      </Text>
      <Text style={{ color: colors.blanco, fontSize: fontSize.xl, fontWeight: '700' }}>
        Faltan variables de entorno
      </Text>
      <Text style={{ color: colors.grisTexto, fontSize: fontSize.sm }}>
        Este build se compilo sin estos valores, asi que no puede conectarse:
      </Text>
      {variables.map((v) => (
        <Text key={v} style={{ color: colors.rojoClaro, fontSize: fontSize.sm, fontWeight: '600' }}>
          · {v}
        </Text>
      ))}
      <Text style={{ color: colors.grisTenue, fontSize: fontSize.xs }}>
        Se definen en apps/mobile/eas.json, en el perfil con el que se compilo, y hace falta
        volver a compilar. Si estas viendo esto como usuario, escribenos: no es culpa tuya.
      </Text>
    </ScrollView>
  );
}

export default function RootLayout() {
  if (faltaConfiguracion.length > 0) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SinConfigurar variables={faltaConfiguracion} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Guardia />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
