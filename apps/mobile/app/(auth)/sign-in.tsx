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
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, theme } from '../../src/theme';
import { BotonesSociales } from '../../src/features/auth/BotonesSociales';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setError(null);
    setEnviando(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    // Mensaje generico a proposito: distinguir "usuario no existe" de
    // "contrasena incorrecta" permite enumerar las cuentas registradas.
    if (err) setError('No hemos podido iniciar sesion. Revisa tus datos.');
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
        <Text style={theme.titulo}>Entra</Text>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
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
            placeholder="Contrasena"
            placeholderTextColor={colors.grisTenue}
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />

          {error !== null && <Text style={{ color: colors.rojoClaro }}>{error}</Text>}

          <Pressable
            style={[theme.botonPrimario, enviando && { opacity: 0.6 }]}
            onPress={() => void entrar()}
            disabled={enviando}
            accessibilityRole="button"
          >
            <Text style={theme.textoBoton}>{enviando ? 'Entrando...' : 'Entrar'}</Text>
          </Pressable>
        </View>

        <BotonesSociales />

        <Link href="/(auth)/sign-up" style={{ marginTop: spacing.xl }}>
          <Text style={theme.textoTenue}>No tienes cuenta? Crear una</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
