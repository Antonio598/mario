import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CTA_LLAMADA_ADMISION, ENLACE_LLAMADA_ADMISION } from '@reset-alfa/shared';
import { listarProductos, type Producto } from '../../src/features/learning/api';
import { obtenerAcceso } from '../../src/features/perfil/api';
import { siteUrl } from '../../src/lib/supabase';
import { AvisoAcceso, Boton, Cabecera, Chip, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

/**
 * Tienda: catalogo INFORMATIVO, como en la web pero con una regla mas.
 *
 * Sin precios (la web tampoco los muestra ya). Los libros abren Amazon o la
 * tienda de la marca: son productos fisicos, y eso Apple lo permite. El
 * programa abre la reserva de la llamada de admision: un servicio. La
 * suscripcion Premium es contenido digital y aqui NO tiene enlace ni precio:
 * solo se dice que existe (ver TEXTO_ACCESO_NATIVO).
 */
export default function TiendaScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [esPremium, setEsPremium] = useState(false);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      void Promise.all([listarProductos(), obtenerAcceso()])
        .then(([p, a]) => {
          if (!activo) return;
          setProductos(p.filter((x) => x.activo));
          setEsPremium(a.esPremium);
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

  if (cargando && productos.length === 0) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  const programa = productos.filter((p) => p.tipo === 'programa');
  const libros = productos.filter((p) => p.tipo === 'libro');

  // Portadas: las rutas relativas (/libros/...) viven en la web.
  const portada = (url: string | null) =>
    url === null ? null : url.startsWith('/') ? `${siteUrl}${url}` : url;

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Cabecera kicker="Recursos" titulo="Tienda" entradilla="Libros y programas para sostener el cambio." />

      {!esPremium && <AvisoAcceso texto="La app completa: Bitácora de NOFAP, P.A.D, carta y racha sin límite." />}

      {programa.map((p) => (
        <Tarjeta key={p.id} destacada style={{ alignItems: 'center' }}>
          <Image source={{ uri: `${siteUrl}/logos/programa.png` }} style={{ width: 160, height: 48 }} contentFit="contain" accessibilityLabel="Programa Reset Alfa" />
          {p.descripcion !== null && (
            <Text style={[theme.texto, { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md }]}>{p.descripcion}</Text>
          )}
          <Boton
            texto={p.cta_texto ?? CTA_LLAMADA_ADMISION}
            icono="call-outline"
            onPress={() => void WebBrowser.openBrowserAsync(ENLACE_LLAMADA_ADMISION)}
            style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
          />
        </Tarjeta>
      ))}

      <TituloSeccion derecha={libros.length > 0 ? <Chip>{`${libros.length} títulos`}</Chip> : undefined}>Libros</TituloSeccion>
      {libros.length === 0 && <Text style={theme.textoTenue}>Todavía no hay libros disponibles.</Text>}
      {libros.map((p) => {
        const uri = portada(p.imagen_url);
        return (
          <Tarjeta key={p.id}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {uri !== null ? (
                <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: radius.sm }} contentFit="cover" accessibilityLabel={p.nombre} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: radius.sm, backgroundColor: colors.negroBordeSuave }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[theme.titulo, { fontSize: fontSize.base }]}>{p.nombre}</Text>
                {p.descripcion !== null && (
                  <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]} numberOfLines={4}>{p.descripcion}</Text>
                )}
              </View>
            </View>
            {p.url_web !== null && (
              <Boton texto="Conseguir el libro" variante="secundario" icono="open-outline" onPress={() => void WebBrowser.openBrowserAsync(p.url_web as string)} style={{ marginTop: spacing.md, borderColor: colors.rojo }} />
            )}
          </Tarjeta>
        );
      })}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[
          { i: 'lock-closed-outline' as const, t: 'Pago seguro', s: 'En el navegador' },
          { i: 'flash-outline' as const, t: 'Acceso inmediato', s: 'Al instante' },
          { i: 'checkmark-outline' as const, t: 'Garantía', s: 'Si no es para ti' },
        ].map((b) => (
          <Tarjeta key={b.t} style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs }}>
            <Ionicons name={b.i} size={18} color={colors.rojo} />
            <Text style={{ color: colors.blanco, fontSize: 10, fontWeight: '600', marginTop: 6, textAlign: 'center' }}>{b.t}</Text>
            <Text style={[theme.textoTenue, { fontSize: 10, textAlign: 'center' }]}>{b.s}</Text>
          </Tarjeta>
        ))}
      </View>
    </ScrollView>
  );
}
