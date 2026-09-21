import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../src/features/auth/SessionProvider';
import { Funnel } from '../src/features/empezar/Funnel';
import { borrarPlanLocal } from '../src/features/empezar/almacen';
import { guardarPlan } from '../src/features/perfil/api';
import { colors, theme } from '../src/theme';

/**
 * El test de entrada. Accesible sin sesion (el portero de sesion lo deja
 * pasar): es lo primero que ve un usuario nuevo, antes de crear la cuenta.
 *
 * Sin sesion: al terminar va al registro; el plan espera en el dispositivo y
 * lo guarda Inicio en cuanto hay cuenta. Con sesion (usuario antiguo al que
 * Inicio manda aqui): guarda directo, o salta.
 */
export default function EmpezarScreen() {
  const router = useRouter();
  const { session, cargando } = useSession();
  const [guardando, setGuardando] = useState(false);

  if (cargando) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  async function guardar(plan: Parameters<typeof guardarPlan>[0]) {
    setGuardando(true);
    try {
      await guardarPlan(plan);
      await borrarPlanLocal();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('No hemos podido guardar tu plan', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
      setGuardando(false);
    }
  }

  if (guardando) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  return (
    <Funnel
      haySesion={session !== null}
      onCrearCuenta={() => router.push('/(auth)/sign-up')}
      onGuardar={(plan) => void guardar(plan)}
      onSaltar={() => void guardar(null)}
    />
  );
}
