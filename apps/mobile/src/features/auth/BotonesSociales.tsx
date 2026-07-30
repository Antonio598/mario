import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, soportaAppleSignIn } from '../../lib/supabase';
import { colors, spacing, theme } from '../../theme';

/**
 * Acceso con Google y con Apple.
 *
 * Apple exige que, si una app ofrece inicio de sesion con un proveedor social
 * de terceros, ofrezca tambien Sign in with Apple en iOS. Sin ello, la app es
 * rechazada en la revision.
 *
 * El flujo usa el navegador del sistema (no un WebView embebido), que es lo que
 * exigen las politicas de Google desde 2021 y lo que permite aprovechar la
 * sesion ya iniciada del usuario.
 */
export function BotonesSociales() {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<'google' | 'apple' | null>(null);

  async function entrarCon(provider: 'google' | 'apple') {
    setError(null);
    setCargando(provider);

    try {
      const redirectTo = Linking.createURL('/(auth)/callback');

      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (err || data.url === null) {
        setError('No hemos podido abrir el acceso. Intentalo de nuevo.');
        return;
      }

      const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (resultado.type !== 'success') return;

      // El codigo PKCE viaja en la URL de retorno y se canjea por una sesion.
      const { queryParams } = Linking.parse(resultado.url);
      const code = queryParams?.['code'];

      if (typeof code === 'string') {
        const { error: errCanje } = await supabase.auth.exchangeCodeForSession(code);
        if (errCanje) setError('No hemos podido completar el acceso.');
      }
    } finally {
      setCargando(null);
    }
  }

  return (
    <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <Text style={[theme.textoTenue, { textAlign: 'center' }]}>o</Text>

      <Pressable
        style={theme.botonSecundario}
        onPress={() => void entrarCon('google')}
        disabled={cargando !== null}
        accessibilityRole="button"
      >
        <Text style={theme.textoBoton}>
          {cargando === 'google' ? 'Abriendo...' : 'Continuar con Google'}
        </Text>
      </Pressable>

      {soportaAppleSignIn && (
        <Pressable
          style={[theme.botonSecundario, { backgroundColor: colors.blanco }]}
          onPress={() => void entrarCon('apple')}
          disabled={cargando !== null}
          accessibilityRole="button"
        >
          <Text style={[theme.textoBoton, { color: colors.negro }]}>
            {cargando === 'apple' ? 'Abriendo...' : 'Continuar con Apple'}
          </Text>
        </Pressable>
      )}

      {error !== null && (
        <Text style={{ color: colors.rojoClaro, textAlign: 'center' }}>{error}</Text>
      )}
    </View>
  );
}
