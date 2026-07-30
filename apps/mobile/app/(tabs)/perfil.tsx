import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AVISO_NO_TERAPEUTICO,
  HITOS_RACHA,
  RECURSOS_AYUDA,
  cursoDesbloqueado,
} from '@reset-alfa/shared';
import { supabase } from '../../src/lib/supabase';
import { obtenerEstadoDiario, type EstadoDiario } from '../../src/features/streak/api';
import { listarCursos, misPermisos, type Curso, type Permiso } from '../../src/features/learning/api';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

export default function PerfilScreen() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoDiario | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      void Promise.all([obtenerEstadoDiario(), listarCursos(), misPermisos()])
        .then(([e, c, p]) => {
          if (!activo) return;
          setEstado(e);
          setCursos(c);
          setPermisos(p);
        })
        .catch(() => undefined)
        .finally(() => {
          if (activo) setCargando(false);
        });

      return () => {
        activo = false;
      };
    }, []),
  );

  /**
   * Art. 15 y 20 RGPD: exportacion.
   *
   * Se usa la hoja de compartir del sistema en vez de guardar un fichero: el
   * usuario decide donde acaban sus datos —correo, notas, disco— sin que la app
   * necesite permisos de almacenamiento ni conserve una copia.
   */
  async function exportar() {
    setTrabajando(true);
    try {
      const { data, error } = await supabase.rpc('export_my_data');
      if (error) throw new Error(error.message);
      await Share.share({ message: JSON.stringify(data, null, 2) });
    } catch {
      Alert.alert('No hemos podido exportar tus datos', 'Intentalo de nuevo mas tarde.');
    } finally {
      setTrabajando(false);
    }
  }

  /**
   * Art. 17 RGPD: supresion.
   *
   * Doble confirmacion y lenguaje explicito sobre la irreversibilidad. Es un
   * borrado real en cascada, no una desactivacion: si el usuario no entiende
   * eso antes de pulsar, la funcion esta mal presentada.
   */
  function eliminarCuenta() {
    Alert.alert(
      'Eliminar tu cuenta',
      'Se borraran tu perfil, tus rachas, tus registros y tu progreso. Es irreversible: no hay copia que recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmalo una vez mas', 'Esta accion no se puede deshacer.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Si, eliminar',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    const { error } = await supabase.rpc('delete_my_account');
                    if (error) {
                      Alert.alert('No hemos podido eliminar la cuenta', 'Intentalo de nuevo.');
                      return;
                    }
                    await supabase.auth.signOut();
                    router.replace('/(auth)/sign-in');
                  })();
                },
              },
            ]);
          },
        },
      ],
    );
  }

  if (cargando && estado === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  const adquiridos = cursos.filter((c) => c.tipo === 'premium' && cursoDesbloqueado(c, permisos));
  const record = estado?.record_personal ?? 0;

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
      <Seccion titulo="Estadisticas">
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          {[
            { v: estado?.racha_actual ?? 0, e: 'Racha actual' },
            { v: record, e: 'Record' },
            { v: estado?.dias_totales ?? 0, e: 'Dias totales' },
          ].map((s) => (
            <View key={s.e} style={{ flex: 1 }}>
              <Text style={{ color: colors.blanco, fontSize: fontSize.xl, fontWeight: '700' }}>
                {s.v}
              </Text>
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{s.e}</Text>
            </View>
          ))}
        </View>
      </Seccion>

      {/*
        Insignias por hitos. Se muestran TODAS, conseguidas y pendientes: ver
        cual es el siguiente escalon motiva mas que una rejilla que solo
        aparece cuando ya la has ganado.
      */}
      <Seccion titulo="Hitos">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {HITOS_RACHA.map((h) => {
            const conseguido = record >= h;
            return (
              <View
                key={h}
                accessibilityLabel={`Hito de ${h} dias: ${conseguido ? 'conseguido' : 'pendiente'}`}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: conseguido ? colors.rojo : colors.negroBorde,
                  backgroundColor: conseguido ? colors.rojo : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: conseguido ? colors.blanco : colors.grisTenue,
                    fontWeight: '700',
                    fontSize: fontSize.sm,
                  }}
                >
                  {h} d
                </Text>
              </View>
            );
          })}
        </View>
      </Seccion>

      <Seccion titulo="Mi biblioteca">
        {adquiridos.length === 0 ? (
          <Text style={theme.textoTenue}>
            Todavia no tienes contenido premium. Las masterclasses gratuitas estan en Formacion.
          </Text>
        ) : (
          adquiridos.map((c) => (
            <Text key={c.id} style={[theme.texto, { color: colors.blanco, marginBottom: spacing.sm }]}>
              {c.titulo}
            </Text>
          ))
        )}
      </Seccion>

      <Seccion titulo="Tus datos">
        <Boton texto="Exportar mis datos" onPress={() => void exportar()} deshabilitado={trabajando} />
        <Text style={[theme.textoTenue, { marginTop: spacing.xs, fontSize: fontSize.xs }]}>
          Una copia completa en formato legible por maquina (arts. 15 y 20 RGPD).
        </Text>

        <View style={{ marginTop: spacing.lg }}>
          <Boton texto="Eliminar cuenta" onPress={eliminarCuenta} destructivo />
          <Text style={[theme.textoTenue, { marginTop: spacing.xs, fontSize: fontSize.xs }]}>
            Borrado real e inmediato. No conservamos una copia desactivada.
          </Text>
        </View>
      </Seccion>

      <Seccion titulo="Ayuda">
        {RECURSOS_AYUDA.map((r) => (
          <Pressable
            key={r.nombre}
            onPress={() => void Linking.openURL(r.url)}
            accessibilityRole="link"
            style={{ marginBottom: spacing.md }}
          >
            <Text style={{ color: colors.grisTexto, fontSize: fontSize.sm }}>
              {r.nombre}
              {r.telefono !== null ? ` · ${r.telefono}` : ''}
            </Text>
            <Text style={{ color: colors.grisTenue, fontSize: fontSize.xs }}>{r.descripcion}</Text>
          </Pressable>
        ))}
        <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{AVISO_NO_TERAPEUTICO}</Text>
      </Seccion>

      <Boton
        texto="Cerrar sesion"
        onPress={() => {
          void supabase.auth.signOut();
        }}
      />
    </ScrollView>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <Text style={[theme.titulo, { fontSize: fontSize.lg, marginBottom: spacing.md }]}>
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Boton({
  texto,
  onPress,
  destructivo = false,
  deshabilitado = false,
}: {
  texto: string;
  onPress: () => void;
  destructivo?: boolean;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={[
        theme.botonSecundario,
        destructivo && { borderColor: colors.rojo },
        deshabilitado && { opacity: 0.6 },
      ]}
    >
      <Text style={[theme.textoBoton, destructivo && { color: colors.rojoClaro }]}>{texto}</Text>
    </Pressable>
  );
}
