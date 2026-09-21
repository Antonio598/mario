import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CTA_LLAMADA_ADMISION, ENLACE_LLAMADA_ADMISION, cursoDesbloqueado } from '@reset-alfa/shared';
import { listarCursos, misPermisos, type Curso, type Permiso } from '../../src/features/learning/api';
import { Boton, Chip, Kicker, Tarjeta } from '../../src/components/ui';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

/**
 * Detalle de una masterclass o curso. Es a donde llevan las tarjetas del
 * carrusel de Inicio: hay recursos solo con PDF y ningun video, asi que un
 * enlace externo directo no tendria a donde ir.
 */
export default function CursoScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [curso, setCurso] = useState<Curso | null | undefined>(undefined);
  const [permisos, setPermisos] = useState<Permiso[]>([]);

  useEffect(() => {
    void Promise.all([listarCursos(), misPermisos()])
      .then(([c, p]) => {
        setCurso(c.find((x) => x.slug === slug && x.publicado) ?? null);
        setPermisos(p);
      })
      .catch(() => setCurso(null));
  }, [slug]);

  if (curso === undefined) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  if (curso === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center', padding: spacing.lg }]}>
        <Stack.Screen options={{ title: 'Formación' }} />
        <Text style={theme.titulo}>No encontrado</Text>
        <Text style={[theme.texto, { marginTop: spacing.sm }]}>Este recurso ya no está disponible.</Text>
      </View>
    );
  }

  const tieneAcceso = curso.tipo === 'gratis' || cursoDesbloqueado(curso, permisos);
  const sinRecursos = curso.url_externa === null && curso.url_protocolo === null;

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Stack.Screen options={{ title: 'Formación' }} />
      {curso.tipo === 'gratis' ? <Chip rojo>GRATIS</Chip> : <Kicker>Para alumnos</Kicker>}
      <Text style={theme.titulo}>{curso.titulo}</Text>
      {curso.descripcion !== null && <Text style={[theme.texto, { fontSize: fontSize.sm }]}>{curso.descripcion}</Text>}

      {tieneAcceso ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {curso.url_externa !== null && (
            <Boton
              texto={curso.tipo === 'gratis' ? 'Ver masterclass' : 'Entrar al curso'}
              icono="play"
              onPress={() => void WebBrowser.openBrowserAsync(curso.url_externa as string)}
            />
          )}
          {curso.url_protocolo !== null && (
            <Boton texto="Descargar protocolo (PDF)" variante="secundario" icono="document-outline" onPress={() => void WebBrowser.openBrowserAsync(curso.url_protocolo as string)} />
          )}
          {sinRecursos && (
            <Tarjeta>
              <Text style={theme.textoTenue}>Este recurso todavía no tiene material publicado. Estará disponible en breve.</Text>
            </Tarjeta>
          )}
        </View>
      ) : (
        <View style={{ backgroundColor: colors.rojo, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm }}>
          <Text style={{ color: colors.blancoPuro, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', fontSize: fontSize.sm }}>
            Contenido para alumnos
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18 }}>
            Forma parte del Programa Online de Liderazgo Reset Alfa. El acceso se decide en una llamada de admisión.
          </Text>
          <Boton texto={CTA_LLAMADA_ADMISION} variante="invertido" icono="call-outline" onPress={() => void WebBrowser.openBrowserAsync(ENLACE_LLAMADA_ADMISION)} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
        </View>
      )}

      <Text style={[theme.textoTenue, { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.md }]}>
        Se abre en el navegador. Cuando termines, vuelve aquí.
      </Text>
    </ScrollView>
  );
}
