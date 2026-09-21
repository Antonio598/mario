import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { mostrarDias } from '@reset-alfa/shared';
import { Calendario } from '../../src/features/calendar/Calendario';
import { HistorialRecaidas } from '../../src/features/calendar/HistorialRecaidas';
import { obtenerCalendario, obtenerEstadoDiario, type DiaCalendario, type EstadoDiario } from '../../src/features/streak/api';
import {
  historialRecaidas,
  obtenerAcceso,
  obtenerPerfil,
  plantillasRellenadas,
  type EntradaHistorial,
  type Perfil,
} from '../../src/features/perfil/api';
import { AccionesPAD, TareaPAD } from '../../src/features/pad/PAD';
import { AccionesCarta, TareaCarta } from '../../src/features/carta/Carta';
import { Logros } from '../../src/features/logros/Logros';
import { AvisoAcceso, Bloqueado, Cabecera, Tarjeta, TEXTO_ACCESO_NATIVO } from '../../src/components/ui';
import { colors, fontSize, spacing, theme } from '../../src/theme';

export default function CalendarioScreen() {
  const router = useRouter();
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [dias, setDias] = useState<DiaCalendario[]>([]);
  const [estado, setEstado] = useState<EstadoDiario | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [rellenadas, setRellenadas] = useState(0);
  const [esPremium, setEsPremium] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const [d, e, p, h, r, a] = await Promise.all([
      obtenerCalendario(anio, mes),
      obtenerEstadoDiario(),
      obtenerPerfil(),
      historialRecaidas(50),
      plantillasRellenadas(),
      obtenerAcceso(),
    ]);
    setDias(d);
    setEstado(e);
    setPerfil(p);
    setHistorial(h);
    setRellenadas(r);
    setEsPremium(a.esPremium);
  }, [anio, mes]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
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

  function cambiarMes(delta: number) {
    const m = mes + delta;
    if (m < 1) {
      setMes(12);
      setAnio((a) => a - 1);
    } else if (m > 12) {
      setMes(1);
      setAnio((a) => a + 1);
    } else {
      setMes(m);
    }
  }

  const recargar = () => void cargar().catch(() => undefined);
  const pad = perfil?.pad ?? null;
  const carta = perfil?.carta ?? null;

  return (
    <ScrollView style={theme.pantalla} contentContainerStyle={{ padding: spacing.lg }}>
      <Cabecera kicker="Tu registro" titulo="Calendario" entradilla="Tu racha, tu historia, tu transformación." />

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        {[
          { t: 'Racha actual', v: mostrarDias(estado?.racha_actual ?? 0, esPremium) },
          { t: 'Récord', v: mostrarDias(estado?.record_personal ?? 0, esPremium) },
          { t: 'Días totales', v: String(estado?.dias_totales ?? 0) },
        ].map((s) => (
          <Tarjeta key={s.t} style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs }}>
            <Text style={[theme.etiquetaEstadistica, { fontSize: 10, textAlign: 'center' }]}>{s.t}</Text>
            <Text style={theme.valorEstadistica}>
              {s.v}
              <Text style={[theme.textoTenue, { fontSize: 10 }]}> días</Text>
            </Text>
          </Tarjeta>
        ))}
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        {pad !== null ? (
          <AccionesPAD pad={pad} bloqueado={!esPremium} onGuardado={recargar} />
        ) : esPremium ? (
          <TareaPAD onGuardado={recargar} />
        ) : (
          <Bloqueado titulo="Tu P.A.D" texto="La acción concreta que ejecutas cuando aparece el deseo.">
            <TareaPAD onGuardado={recargar} />
          </Bloqueado>
        )}
        {carta !== null ? (
          <AccionesCarta carta={carta} bloqueado={!esPremium} onGuardado={recargar} />
        ) : esPremium ? (
          <TareaCarta onGuardado={recargar} />
        ) : (
          <Bloqueado titulo="Tu carta anti-recaída" texto="Un mensaje de ti para ti, para el momento de la tentación.">
            <TareaCarta onGuardado={recargar} />
          </Bloqueado>
        )}
        {!esPremium && <AvisoAcceso texto="Tu Bitácora de NOFAP con cada recaída, y tu racha entera." />}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        {cargando && dias.length === 0 ? (
          <ActivityIndicator color={colors.rojo} />
        ) : (
          <Tarjeta style={{ paddingHorizontal: spacing.sm }}>
            <Calendario
              anio={anio}
              mes={mes}
              dias={dias}
              esPremium={esPremium}
              onMes={cambiarMes}
              onDia={(d) => {
                if (esPremium) router.push({ pathname: '/recaida/[id]', params: { id: d.fecha } });
                else Alert.alert('Bitácora de NOFAP', `Las respuestas de ese día son Premium. ${TEXTO_ACCESO_NATIVO}`);
              }}
            />
          </Tarjeta>
        )}
      </View>

      {historial.length > 0 && (
        <Pressable
          onPress={() => router.push({ pathname: '/(modals)/hito/[clave]', params: { clave: 'recaida', modo: 'pagina' } })}
          accessibilityRole="button"
          style={[theme.tarjeta, { marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 18 }]}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.rojo, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play" size={16} color={colors.blancoPuro} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={theme.kicker}>Después de una recaída</Text>
            <Text style={[theme.texto, { color: colors.blanco, fontSize: fontSize.sm }]}>Qué hacer para que la próxima no te pille sin plan.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.rojo} />
        </Pressable>
      )}

      <Logros
        datos={{
          record: estado?.record_personal ?? 0,
          diasTotales: estado?.dias_totales ?? 0,
          tienePad: pad !== null,
          tieneCarta: carta !== null,
          plantillasRellenadas: rellenadas,
          esPremium,
        }}
      />

      <HistorialRecaidas entradas={historial} esPremium={esPremium} />

      <Tarjeta style={{ marginTop: spacing.xl }}>
        <Text style={[theme.texto, { fontSize: fontSize.sm }]}>
          <Text style={{ color: colors.rojo, fontSize: fontSize.lg }}>“ </Text>
          No se trata de nunca caer, sino de levantarte cada vez más fuerte.
        </Text>
      </Tarjeta>
    </ScrollView>
  );
}
