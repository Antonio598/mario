import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CTA_LLAMADA_ADMISION, ENLACE_LLAMADA_ADMISION, cursoDesbloqueado } from '@reset-alfa/shared';
import { listarCursos, misPermisos, type Curso, type Permiso } from '../../src/features/learning/api';
import { obtenerAcceso, obtenerPerfil, type Perfil } from '../../src/features/perfil/api';
import { TareaPAD } from '../../src/features/pad/PAD';
import { TareaCarta } from '../../src/features/carta/Carta';
import { AvisoAcceso, Bloqueado, Boton, Cabecera, Chip, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

/**
 * Formacion: masterclasses gratuitas y programa.
 *
 * Los cursos NO se alojan aqui: viven en modoguerrero.es y en YouTube. Cada
 * boton abre el navegador externo.
 *
 * REGLA DE PLATAFORMA: el programa se accede por una llamada de admision,
 * que es un servicio con una persona y no contenido digital; enlazar a
 * reservarla esta permitido. Lo que no se muestra es precio ni compra de
 * nada digital.
 */
export default function FormacionScreen() {
  const router = useRouter();
  const [pestana, setPestana] = useState<'gratis' | 'premium'>('gratis');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [esPremium, setEsPremium] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const [c, p, pf, a] = await Promise.all([listarCursos(), misPermisos(), obtenerPerfil(), obtenerAcceso()]);
    setCursos(c.filter((x) => x.publicado));
    setPermisos(p);
    setPerfil(pf);
    setEsPremium(a.esPremium);
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

  if (cargando && cursos.length === 0) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  const gratis = cursos.filter((c) => c.tipo === 'gratis');
  const premium = cursos.filter((c) => c.tipo === 'premium');
  const tieneProgramaAlgunCurso = premium.some((c) => cursoDesbloqueado(c, permisos));
  const recargar = () => void cargar().catch(() => undefined);

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Cabecera kicker="Escuela" titulo="Formación" entradilla="Aprende con recursos gratuitos y contenido premium." />

      {!esPremium && <AvisoAcceso texto="Las herramientas del método, no solo las masterclasses." />}

      {perfil !== null && perfil.pad === null && (
        esPremium ? (
          <TareaPAD onGuardado={recargar} />
        ) : (
          <Bloqueado titulo="Tu P.A.D" texto="La acción concreta que ejecutas cuando aparece el deseo.">
            <TareaPAD onGuardado={recargar} />
          </Bloqueado>
        )
      )}
      {perfil !== null && perfil.carta === null && (
        esPremium ? (
          <TareaCarta onGuardado={recargar} />
        ) : (
          <Bloqueado titulo="Tu carta anti-recaída" texto="Un mensaje de ti para ti, para el momento de la tentación.">
            <TareaCarta onGuardado={recargar} />
          </Bloqueado>
        )
      )}

      {/* Pestanas */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.negroElevado, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.negroBorde }}>
        {(['gratis', 'premium'] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPestana(p)}
            accessibilityRole="tab"
            accessibilityState={{ selected: pestana === p }}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.sm,
              backgroundColor: pestana === p ? colors.rojo : 'transparent',
            }}
          >
            <Text style={{ color: pestana === p ? colors.blancoPuro : colors.grisTenue, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: fontSize.sm }}>
              {p === 'gratis' ? 'Gratis' : 'Premium'}
            </Text>
          </Pressable>
        ))}
      </View>

      {pestana === 'gratis' ? (
        <>
          <TituloSeccion derecha={<Chip>{`${gratis.length} disponibles`}</Chip>}>Recursos gratuitos</TituloSeccion>
          <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: -8 }]}>Masterclasses y protocolos para empezar.</Text>
          {gratis.length === 0 && <Text style={theme.textoTenue}>Todavía no hay contenido disponible.</Text>}
          {gratis.map((c) => (
            <Tarjeta key={c.id} style={{ overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: colors.rojo, paddingHorizontal: 10, paddingVertical: 4, borderTopLeftRadius: radius.lg, borderBottomRightRadius: 10 }}>
                <Text style={{ color: colors.blancoPuro, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>GRATIS</Text>
              </View>
              <Text style={[theme.titulo, { fontSize: fontSize.lg, marginTop: spacing.md }]}>{c.titulo}</Text>
              {c.descripcion !== null && <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: 4 }]}>{c.descripcion}</Text>}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                {c.url_externa !== null && (
                  <Boton texto="Ver masterclass" icono="play" onPress={() => void WebBrowser.openBrowserAsync(c.url_externa as string)} style={{ flex: 1, minWidth: 150 }} />
                )}
                {c.url_protocolo !== null && (
                  <Boton texto="Protocolo PDF" variante="secundario" icono="document-outline" onPress={() => void WebBrowser.openBrowserAsync(c.url_protocolo as string)} style={{ flex: 0 }} />
                )}
              </View>
            </Tarjeta>
          ))}
        </>
      ) : (
        <>
          <TituloSeccion derecha={<Chip>{`${premium.length} cursos`}</Chip>}>Formación para alumnos</TituloSeccion>
          <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: -8 }]}>Se accede tras la llamada de admisión.</Text>

          {!tieneProgramaAlgunCurso && (
            <View style={{ backgroundColor: colors.rojo, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: colors.blancoPuro, fontWeight: '700', fontSize: fontSize.sm, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
                Programa Online de{'\n'}Liderazgo Reset Alfa
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 }}>
                Desencadenado, Transmutación Sexual, Liderazgo y el archivo completo de mentorías grabadas.
              </Text>
              <Boton texto={CTA_LLAMADA_ADMISION} variante="invertido" icono="call-outline" onPress={() => void WebBrowser.openBrowserAsync(ENLACE_LLAMADA_ADMISION)} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
            </View>
          )}

          {premium.map((c) => {
            const abierto = cursoDesbloqueado(c, permisos);
            return (
              <Tarjeta key={c.id} style={{ opacity: abierto ? 1 : 0.75 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.titulo, { fontSize: fontSize.lg }]}>{c.titulo}</Text>
                    {c.descripcion !== null && <Text style={[theme.texto, { fontSize: fontSize.sm, marginTop: 4 }]}>{c.descripcion}</Text>}
                  </View>
                  {!abierto && (
                    <Chip>
                      <Ionicons name="lock-closed" size={10} /> Bloqueado
                    </Chip>
                  )}
                </View>
                {abierto && c.url_externa !== null && (
                  <Boton texto="Entrar al curso" icono="open-outline" onPress={() => void WebBrowser.openBrowserAsync(c.url_externa as string)} style={{ marginTop: spacing.md }} />
                )}
                {!abierto && (
                  <Pressable onPress={() => router.push({ pathname: '/curso/[slug]', params: { slug: c.slug } })} accessibilityRole="button" style={{ marginTop: spacing.sm }}>
                    <Text style={{ color: colors.rojo, fontWeight: '600', fontSize: fontSize.sm }}>Ver detalle →</Text>
                  </Pressable>
                )}
              </Tarjeta>
            );
          })}

          {!tieneProgramaAlgunCurso && (
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, textAlign: 'center' }]}>
              ¿Ya eres alumno?{' '}
              <Text style={{ color: colors.rojo, textDecorationLine: 'underline' }} onPress={() => void WebBrowser.openBrowserAsync('https://modoguerrero.es/escuela')}>
                Entra en la academia
              </Text>
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}
