import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { hitoPendiente } from '@reset-alfa/shared';
import { obtenerEstadoDiario, type EstadoDiario } from '../../src/features/streak/api';
import { mensajeDelDia } from '../../src/features/streak/mensajes';
import { AjustarRacha, ContadorRacha } from '../../src/features/streak/ContadorRacha';
import { guardarPlan, obtenerAcceso, obtenerPerfil, type Acceso, type Perfil } from '../../src/features/perfil/api';
import { listarCursos, type Curso } from '../../src/features/learning/api';
import { RecordatorioPAD, TareaPAD } from '../../src/features/pad/PAD';
import { borrarPlanLocal, hayPlanLocalCompleto } from '../../src/features/empezar/almacen';
import { RecordatorioCarta, TareaCarta } from '../../src/features/carta/Carta';
import { AvisoAcceso, Bloqueado, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { colors, fontSize, radius, spacing, theme } from '../../src/theme';

/**
 * Inicio. Mismo orden que la web: contador, ajuste, check-in, P.A.D, carta,
 * aviso de acceso, mensaje del dia, formacion y mision.
 *
 * Tres decisiones de navegacion viven aqui y no en el layout raiz:
 *   1. El check-in diario pendiente abre el modal.
 *   2. El test de entrada pendiente abre el embudo (usuario antiguo).
 *   3. El hito de 7 o 30 dias, solo con el check-in ya hecho.
 * Si estuvieran en el layout, el modal podria aparecer encima del formulario
 * de recaida a medio rellenar.
 */
export default function InicioScreen() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoDiario | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [acceso, setAcceso] = useState<Acceso>({ esPremium: false, expiraEn: null, cancelaAlFinal: false });
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    const [e, p, a, c] = await Promise.all([
      obtenerEstadoDiario(),
      obtenerPerfil(),
      obtenerAcceso(),
      listarCursos().catch(() => [] as Curso[]),
    ]);
    setEstado(e);
    setPerfil(p);
    setAcceso(a);
    setCursos(c.filter((x) => x.tipo === 'gratis' && x.publicado).slice(0, 4));

    // Perfil sin flag. Si el test ya esta hecho en este dispositivo (acaba de
    // crear la cuenta), se guarda y se sigue; si no, al embudo.
    let perfilActual = p;
    if (perfilActual === null || !perfilActual.onboardingCompletado) {
      const plan = await hayPlanLocalCompleto();
      if (plan !== null) {
        await guardarPlan(plan);
        await borrarPlanLocal();
        perfilActual = await obtenerPerfil();
        setPerfil(perfilActual);
      } else {
        router.replace('/empezar');
        return e;
      }
    }
    if (e.necesita_checkin) {
      router.replace('/(modals)/checkin');
      return e;
    }
    const hito = hitoPendiente(e.racha_actual, perfilActual?.hitosVistos ?? []);
    if (hito !== null) router.push({ pathname: '/(modals)/hito/[clave]', params: { clave: hito } });
    return e;
  }, [router]);

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

  if (cargando && estado === null) {
    return (
      <View style={[theme.pantalla, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.rojo} />
      </View>
    );
  }

  const racha = estado?.racha_actual ?? 0;
  const esPremium = acceso.esPremium;
  const pad = perfil?.pad ?? null;
  const carta = perfil?.carta ?? null;
  const recargar = () => void cargar().catch(() => undefined);

  return (
    <ScrollView
      style={theme.pantalla}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          tintColor={colors.rojo}
          onRefresh={() => {
            setRefrescando(true);
            void cargar()
              .catch(() => undefined)
              .finally(() => setRefrescando(false));
          }}
        />
      }
    >
      <ContadorRacha
        dias={racha}
        record={estado?.record_personal ?? 0}
        diasTotales={estado?.dias_totales ?? 0}
        esPremium={esPremium}
      />
      <AjustarRacha diasActuales={racha} onAjustado={recargar} />

      {/* Check-in de hoy: si llega aqui, ya esta hecho (el modal lo captura antes). */}
      <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: 'rgba(62,158,69,0.35)', backgroundColor: colors.exitoTenue }}>
        <Ionicons name="checkmark-circle-outline" size={22} color={colors.exito} />
        <View>
          <Text style={{ color: colors.exito, fontWeight: '700', fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' }}>
            Hoy ya está registrado
          </Text>
          <Text style={[theme.textoTenue, { fontSize: fontSize.sm }]}>Nos vemos mañana.</Text>
        </View>
      </Tarjeta>

      {/* P.A.D */}
      {pad !== null ? (
        <RecordatorioPAD pad={pad} />
      ) : esPremium ? (
        <TareaPAD onGuardado={recargar} />
      ) : (
        <Bloqueado titulo="Tu P.A.D" texto="La acción concreta que ejecutas cuando aparece el deseo.">
          <TareaPAD onGuardado={recargar} />
        </Bloqueado>
      )}

      {/* Carta */}
      {carta !== null ? (
        <RecordatorioCarta carta={carta} />
      ) : esPremium ? (
        <TareaCarta onGuardado={recargar} />
      ) : (
        <Bloqueado titulo="Tu carta anti-recaída" texto="Un mensaje de ti para ti, para el momento de la tentación.">
          <TareaCarta onGuardado={recargar} />
        </Bloqueado>
      )}

      {!esPremium && <AvisoAcceso texto="Bitácora de NOFAP, P.A.D, carta y racha sin límite." />}

      {/* Mensaje del dia */}
      <Tarjeta style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.negro, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="flame-outline" size={20} color={colors.rojo} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.blanco, fontWeight: '700', fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' }}>
            Mensaje del día
          </Text>
          <Text style={[theme.texto, { marginTop: 4, fontSize: fontSize.sm }]}>{mensajeDelDia(racha)}</Text>
        </View>
      </Tarjeta>

      {/* Formacion */}
      {cursos.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <TituloSeccion
            derecha={
              <Pressable onPress={() => router.push('/(tabs)/formacion')} accessibilityRole="link">
                <Text style={{ color: colors.rojo, fontWeight: '600', fontSize: fontSize.sm }}>Ver todo →</Text>
              </Pressable>
            }
          >
            Formación
          </TituloSeccion>
          <Text style={[theme.textoTenue, { fontSize: fontSize.sm, marginTop: 2 }]}>
            Masterclasses y protocolos para transformar tu vida.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}>
            {cursos.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/curso/[slug]', params: { slug: c.slug } })}
                accessibilityRole="button"
                style={[theme.tarjeta, { width: 150, borderRadius: radius.lg, alignItems: 'center', paddingTop: spacing.lg }]}
              >
                <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: colors.rojo, paddingHorizontal: 8, paddingVertical: 3, borderTopLeftRadius: radius.lg, borderBottomRightRadius: 8 }}>
                  <Text style={{ color: colors.blancoPuro, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>GRATIS</Text>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.negro, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}>
                  <Ionicons name="school-outline" size={22} color={colors.rojo} />
                </View>
                <Text style={{ color: colors.blanco, fontWeight: '700', fontSize: fontSize.xs, textTransform: 'uppercase', textAlign: 'center', marginTop: spacing.sm }} numberOfLines={2}>
                  {c.titulo}
                </Text>
                {c.descripcion !== null && (
                  <Text style={[theme.textoTenue, { fontSize: 11, textAlign: 'center', marginTop: 4 }]} numberOfLines={2}>
                    {c.descripcion}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Mision */}
      <View style={{ backgroundColor: colors.rojo, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark-circle-outline" size={22} color={colors.blancoPuro} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.blancoPuro, fontWeight: '700', fontSize: fontSize.sm, letterSpacing: 1, textTransform: 'uppercase' }}>
            Recuerda tu misión
          </Text>
          <Text style={{ color: colors.blancoPuro, fontSize: fontSize.sm, marginTop: 4, lineHeight: 20 }}>
            No es solo dejar el porno,{' '}
            <Text style={{ color: '#000', fontWeight: '700' }}>es construir al hombre que admiras.</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
