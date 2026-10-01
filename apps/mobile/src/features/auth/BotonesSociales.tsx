import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { proveedoresVisibles, type ProveedorSocial } from '@reset-alfa/shared';
import { proveedoresLoginSocial, supabase } from '../../lib/supabase';
import { colors, spacing, theme } from '../../theme';

/**
 * Acceso con Google y con Apple, solo si estan configurados de verdad.
 *
 * NO se ensena ningun boton si el proveedor no esta en
 * EXPO_PUBLIC_LOGIN_SOCIAL, que esta vacio por defecto. Un boton que falla al
 * pulsarlo es motivo de rechazo en la revision, y perder el registro de quien
 * lo intenta es peor que no ofrecerlo.
 *
 * Apple exige que, si una app ofrece inicio de sesion con un proveedor social
 * de terceros, ofrezca tambien Sign in with Apple en iOS. Por eso en iOS, si
 * falta Apple, no se ensena ninguno (ver proveedoresVisibles).
 *
 * El flujo usa el navegador del sistema (no un WebView embebido), que es lo que
 * exigen las politicas de Google desde 2021 y lo que permite aprovechar la
 * sesion ya iniciada del usuario.
 */
export function BotonesSociales() {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<ProveedorSocial | null>(null);

  const visibles = proveedoresVisibles(proveedoresLoginSocial, Platform.OS === 'ios');

  async function entrarCon(provider: ProveedorSocial) {
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

  if (visibles.length === 0) return null;

  return (
    <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <Text style={[theme.textoTenue, { textAlign: 'center' }]}>o</Text>

      {visibles.map((p) => (
        <Pressable
          key={p}
          style={[theme.botonSecundario, p === 'apple' && { backgroundColor: colors.blanco }]}
          onPress={() => void entrarCon(p)}
          disabled={cargando !== null}
          accessibilityRole="button"
        >
          <Text style={[theme.textoBoton, p === 'apple' && { color: colors.negro }]}>
            {cargando === p
              ? 'Abriendo...'
              : `Continuar con ${p === 'google' ? 'Google' : 'Apple'}`}
          </Text>
        </Pressable>
      ))}

      {error !== null && (
        <Text style={{ color: colors.rojoClaro, textAlign: 'center' }}>{error}</Text>
      )}
    </View>
  );
}
