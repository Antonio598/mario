import { ActivityIndicator, View } from 'react-native';
import { colors } from '../../src/theme';

/**
 * Destino del deep link resetalfa://(auth)/callback tras el retorno de OAuth.
 *
 * Solo muestra un indicador. El canje del codigo por sesion ya lo hace
 * BotonesSociales cuando openAuthSessionAsync devuelve el control, y en cuanto
 * la sesion existe el guardia de app/_layout.tsx redirige a las pestanas.
 */
export default function AuthCallbackScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.negro, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.rojo} />
    </View>
  );
}
