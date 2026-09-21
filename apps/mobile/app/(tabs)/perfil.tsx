import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AVISO_NO_TERAPEUTICO, GRACIA_HORAS } from '@reset-alfa/shared';
import { siteUrl, supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/features/auth/SessionProvider';
import { obtenerEstadoDiario, type EstadoDiario } from '../../src/features/streak/api';
import { darConsentimiento, obtenerAcceso, obtenerPerfil, type Acceso, type Perfil } from '../../src/features/perfil/api';
import { Boton, Cabecera, Candado, Tarjeta, TituloSeccion, TEXTO_ACCESO_NATIVO } from '../../src/components/ui';
import { colors, fontSize, spacing, theme } from '../../src/theme';

function fechaCorta(iso: string): string {
  const sinGracia = new Date(new Date(iso).getTime() - GRACIA_HORAS * 3_600_000);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(sinGracia);
}

/**
 * Perfil. Estado de la suscripcion (sin gestion ni compra: eso es en la web),
 * consentimiento del art. 9, zona horaria, exportacion, cierre de sesion y
 * ELIMINACION DE CUENTA, que Apple y Google exigen desde dentro de la app.
 */
export default function PerfilScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [estado, setEstado] = useState<EstadoDiario | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [acceso, setAcceso] = useState<Acceso>({ esPremium: false, expiraEn: null, cancelaAlFinal: false });
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);

  const versionPolitica = String(Constants.expoConfig?.extra?.['privacyPolicyVersion'] ?? '2026-07-30');

  const cargar = useCallback(async () => {
    const [e, p, a] = await Promise.all([obtenerEstadoDiario(), obtenerPerfil(), obtenerAcceso()]);
    setEstado(e);
    setPerfil(p);
    setAcceso(a);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      void cargar()
        .catch(() => undefined)
        .finally(() => {
          if (activo) setCargando(false);
        });
      return () => {
        activo = false;
      };
    }, [cargar]),
  );

  async function cambiarConsentimiento(nuevo: boolean) {
    setTrabajando(true);
    try {
      await darConsentimiento(nuevo, versionPolitica);
      await cargar();
    } catch (e) {
      Alert.alert('No hemos podido guardar tu decisión', e instanceof Error ? e.message : '');
    } finally {
      setTrabajando(false);
    }
  }

  async function exportar() {
    setTrabajando(true);
    try {
      const { data, error } = await supabase.rpc('export_my_data');
      if (error) throw new Error(error.message);
      await Share.share({ message: JSON.stringify(data, null, 2) });
    } catch {
      Alert.alert('No hemos podido exportar tus datos', 'Inténtalo de nuevo más tarde.');
    } finally {
      setTrabajando(false);
    }
  }

  /**
   * Eliminacion de cuenta. La hace el servidor web (/api/cuenta/eliminar),
   * que es quien puede borrar la identidad ademas de los datos. Doble
   * confirmacion y lenguaje explicito sobre la irreversibilidad.
   */
  function eliminarCuenta() {
    Alert.alert(
      'Eliminar tu cuenta',
      'Se borrarán tu perfil, tus rachas, tu bitácora, tu P.A.D y tu carta. Es irreversible: no hay copia que recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Confírmalo una vez más', 'Esta acción no se puede deshacer.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sí, eliminar',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    setTrabajando(true);
                    try {
                      const res = await fetch(`${siteUrl}/api/cuenta/eliminar`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
                      });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    } catch {
                      setTrabajando(false);
                      Alert.alert('No hemos podido eliminar la cuenta', 'Inténtalo de nuevo o escríbenos.');
                      return;
                    }
                    await supabase.auth.signOut();
                    router.replace('/(auth)/sign-in');
                  })();
                },
              },
            ]),
        },
      ],
    );
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  if (cargando && estado === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Cabecera kicker="Cuenta" titulo={perfil?.nombre ?? 'Perfil'} entradilla={session?.user.email ?? undefined} />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          { t: 'Récord', v: estado?.record_personal ?? 0 },
          { t: 'Días totales', v: estado?.dias_totales ?? 0 },
        ].map((s) => (
          <Tarjeta key={s.t} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={theme.etiquetaEstadistica}>{s.t}</Text>
            <Text style={[theme.valorEstadistica, { fontSize: fontSize['2xl'] }]}>{s.v}</Text>
          </Tarjeta>
        ))}
      </View>

      {/* Suscripcion: estado, sin compra ni gestion (eso es en la web). */}
      <Tarjeta destacada={!acceso.esPremium}>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
          <Candado tamano={14} />
          <View style={{ flex: 1 }}>
            <Text style={theme.kicker}>{acceso.esPremium ? 'Premium activo' : 'Plan gratuito'}</Text>
            <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: 4 }]}>
              {acceso.esPremium
                ? acceso.expiraEn === null
                  ? 'Acceso sin fecha de fin.'
                  : acceso.cancelaAlFinal
                    ? `Cancelado. Conservas el acceso hasta el ${fechaCorta(acceso.expiraEn)}.`
                    : `Se renueva el ${fechaCorta(acceso.expiraEn)}.`
                : 'Bitácora de NOFAP, P.A.D, carta anti-recaída y racha sin límite.'}
            </Text>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]}>{TEXTO_ACCESO_NATIVO}</Text>
          </View>
        </View>
      </Tarjeta>

      <TituloSeccion>Ajustes y datos</TituloSeccion>

      <Tarjeta>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.blanco, fontSize: fontSize.sm, fontWeight: '500' }}>Guardar el detalle de mis recaídas</Text>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 2 }]}>
              Incluye información sobre tu vida sexual y se envía al equipo de Modo Guerrero para tu seguimiento. Sin esto se registra el día, pero no las respuestas de la bitácora.
            </Text>
          </View>
          <Switch
            value={estado?.consiente_sensibles ?? false}
            onValueChange={(v) => void cambiarConsentimiento(v)}
            disabled={trabajando}
            trackColor={{ true: colors.rojo, false: colors.negroBorde }}
            thumbColor={colors.blancoPuro}
          />
        </View>
      </Tarjeta>

      <Tarjeta>
        <Text style={[theme.texto, { fontSize: fontSize.sm }]}>
          Zona horaria: <Text style={{ color: colors.blanco, fontWeight: '500' }}>{perfil?.timezone ?? 'Europe/Madrid'}</Text>
        </Text>
        <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 2 }]}>Determina cuándo empieza tu día para el check-in.</Text>
      </Tarjeta>

      <Boton texto="Exportar mis datos" variante="secundario" onPress={() => void exportar()} deshabilitado={trabajando} />
      <Boton texto="Cerrar sesión" variante="secundario" onPress={() => void cerrarSesion()} deshabilitado={trabajando} />
      <Boton texto="Eliminar mi cuenta" variante="fantasma" onPress={eliminarCuenta} deshabilitado={trabajando} style={{ borderWidth: 1, borderColor: colors.rojo }} />

      <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: spacing.md }]}>{AVISO_NO_TERAPEUTICO}</Text>
    </ScrollView>
  );
}
