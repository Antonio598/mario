import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { cursoDesbloqueado } from '@reset-alfa/shared';
import {
  listarCursos,
  misPermisos,
  abrirFichaEnWeb,
  type Curso,
  type Permiso,
} from '../../src/features/learning/api';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

/**
 * Formacion, con pestanas Gratis y Premium.
 *
 * REGLA DE PLATAFORMA: aqui NO se muestra ningun precio ni ningun boton de
 * compra. Un curso bloqueado ofrece "Ver en la web", que abre el navegador
 * externo. Cualquier otra cosa entra en el ambito de la comision del 15-30 %
 * de Apple y Google.
 *
 * El candado es cortesia visual. La proteccion real es la politica RLS de
 * `lessons`: aunque este componente se equivocara y pintara el curso como
 * desbloqueado, el contenido seguiria sin llegar desde el servidor.
 */
export default function FormacionScreen() {
  const [pestana, setPestana] = useState<'gratis' | 'premium'>('gratis');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      void Promise.all([listarCursos(), misPermisos()])
        .then(([c, p]) => {
          if (!activo) return;
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

  const visibles = cursos.filter((c) => c.tipo === pestana);

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {(['gratis', 'premium'] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPestana(p)}
            accessibilityRole="tab"
            accessibilityState={{ selected: pestana === p }}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderBottomWidth: 2,
              borderBottomColor: pestana === p ? colors.rojo : colors.negroBorde,
            }}
          >
            <Text
              style={{
                color: pestana === p ? colors.blanco : colors.grisTenue,
                textAlign: 'center',
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: fontSize.sm,
              }}
            >
              {p === 'gratis' ? 'Gratis' : 'Premium'}
            </Text>
          </Pressable>
        ))}
      </View>

      {cargando && cursos.length === 0 ? (
        <ActivityIndicator color={colors.rojo} />
      ) : (
        visibles.map((curso) => {
          const desbloqueado = cursoDesbloqueado(curso, permisos);

          return (
            <View
              key={curso.id}
              style={{
                borderWidth: 1,
                borderColor: colors.negroBorde,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                backgroundColor: colors.negroElevado,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[theme.titulo, { fontSize: fontSize.lg, flex: 1 }]}>
                  {curso.titulo}
                </Text>
                {!desbloqueado && (
                  <Text
                    style={{ color: colors.grisTenue, fontSize: fontSize.lg }}
                    accessibilityLabel="Contenido bloqueado"
                  >
                    ×
                  </Text>
                )}
              </View>

              {curso.descripcion !== null && (
                <Text style={[theme.texto, { marginTop: spacing.sm }]}>{curso.descripcion}</Text>
              )}

              {desbloqueado ? (
                <Pressable
                  style={[theme.botonPrimario, { marginTop: spacing.md }]}
                  accessibilityRole="button"
                >
                  <Text style={theme.textoBoton}>Abrir</Text>
                </Pressable>
              ) : (
                <>
                  <Text style={[theme.textoTenue, { marginTop: spacing.md }]}>
                    Este contenido forma parte del programa. Puedes consultarlo en la web.
                  </Text>

                  {/* Sin precio y sin la palabra "comprar": solo un enlace
                      informativo, que es lo que permiten las tiendas. */}
                  <Pressable
                    style={[theme.botonSecundario, { marginTop: spacing.sm }]}
                    accessibilityRole="button"
                    accessibilityHint="Se abre en el navegador"
                    onPress={() => {
                      void abrirFichaEnWeb({ slug: curso.slug, url_web: null });
                    }}
                  >
                    <Text style={theme.textoBoton}>Ver en la web</Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
