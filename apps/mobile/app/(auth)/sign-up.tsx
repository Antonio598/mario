import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, theme } from '../../src/theme';
import { Casilla } from '../../src/components/Casilla';

/**
 * Alta de usuario y RECOGIDA DEL CONSENTIMIENTO.
 *
 * Esta pantalla es donde se cumple —o se incumple— el art. 9 RGPD:
 *
 *  · El consentimiento para los registros de recaida va SEPARADO del resto y
 *    empieza DESMARCADO. Una casilla premarcada no es consentimiento valido
 *    (art. 4.11 y sentencia Planet49 del TJUE).
 *  · Se puede crear la cuenta SIN aceptarlo. El consentimiento no puede
 *    condicionarse a la prestacion del servicio (art. 7.4). Sin el, la app
 *    funciona: solo que no se guarda el detalle de las recaidas.
 *  · Cada decision queda registrada en `consents` junto con la version del
 *    texto legal aceptado, que es la prueba exigida por el art. 7.1.
 */
export default function SignUpScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaSensibles, setAceptaSensibles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const versionPolitica = String(
    Constants.expoConfig?.extra?.['privacyPolicyVersion'] ?? '2026-07-30',
  );

  async function registrar() {
    setError(null);

    if (!aceptaTerminos) {
      setError('Debes aceptar la politica de privacidad para crear la cuenta.');
      return;
    }
    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    setEnviando(true);

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre } },
    });

    if (err) {
      setError('No hemos podido crear la cuenta. Revisa tus datos.');
      setEnviando(false);
      return;
    }

    // Se registran AMBAS decisiones, tambien la negativa: poder demostrar que
    // el usuario dijo que no es tan importante como que dijo que si.
    if (data.user !== null) {
      await supabase.from('consents').insert([
        {
          user_id: data.user.id,
          tipo: 'datos_sensibles',
          concedido: aceptaSensibles,
          version_politica: versionPolitica,
          origen: 'app',
        },
        {
          user_id: data.user.id,
          tipo: 'analitica',
          concedido: false,
          version_politica: versionPolitica,
          origen: 'app',
        },
      ]);
    }

    setEnviando(false);
  }

  return (
    <KeyboardAvoidingView
      style={theme.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: colors.rojo, letterSpacing: 3, marginBottom: spacing.sm }}>
          MODO GUERRERO
        </Text>
        <Text style={theme.titulo}>Crear cuenta</Text>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <TextInput
            style={theme.campo}
            placeholder="Nombre"
            placeholderTextColor={colors.grisTenue}
            autoComplete="name"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={theme.campo}
            placeholder="Correo electronico"
            placeholderTextColor={colors.grisTenue}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={theme.campo}
            placeholder="Contrasena (minimo 8 caracteres)"
            placeholderTextColor={colors.grisTenue}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Casilla
            marcada={aceptaTerminos}
            onCambio={setAceptaTerminos}
            etiqueta="He leido y acepto la politica de privacidad."
          />

          <Casilla
            marcada={aceptaSensibles}
            onCambio={setAceptaSensibles}
            etiqueta="Acepto que se guarden mis registros de recaida, que incluyen informacion sobre mi vida sexual, para poder consultar mi historial y detectar patrones."
            ayuda="Opcional. Puedes crear la cuenta y usar la app sin aceptarlo, y puedes retirarlo cuando quieras desde Ajustes."
          />
        </View>

        {error !== null && (
          <Text style={{ color: colors.rojoClaro, marginTop: spacing.md }}>{error}</Text>
        )}

        <Pressable
          style={[theme.botonPrimario, { marginTop: spacing.lg }, enviando && { opacity: 0.6 }]}
          onPress={() => void registrar()}
          disabled={enviando}
          accessibilityRole="button"
        >
          <Text style={theme.textoBoton}>{enviando ? 'Creando...' : 'Crear cuenta'}</Text>
        </Pressable>

        <Link href="/(auth)/sign-in" style={{ marginTop: spacing.xl }}>
          <Text style={theme.textoTenue}>Ya tienes cuenta? Entrar</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
