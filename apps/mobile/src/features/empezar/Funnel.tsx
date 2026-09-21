import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import {
  HITOS_MEJORA,
  PREGUNTAS_PLAN,
  equivalencias,
  fechaObjetivo,
  formatearFecha,
  fraseObjetivo,
  horasEnTotal,
  horasPorAnio,
  mejora,
  planCompleto,
  type PreguntaPlan,
  type RespuestasPlan,
} from '@reset-alfa/shared';
import { escribirPlanLocal, leerPlanLocal } from './almacen';
import { Boton, Chip, Kicker, Opcion, Tarjeta } from '../../components/ui';
import { colors, fontSize, radius, spacing, theme } from '../../theme';

type PasoResultado = 'coste' | 'equivalencias' | 'lugar' | 'grafica' | 'plan';
const RESULTADOS: readonly PasoResultado[] = ['coste', 'equivalencias', 'lugar', 'grafica', 'plan'];
const TOTAL = PREGUNTAS_PLAN.length + RESULTADOS.length;

/**
 * El embudo de entrada, mismo contenido que la web: ocho preguntas y cinco
 * pantallas de resultado. Termina en "Crear mi cuenta" (sin sesion) o en
 * "Guardar mi plan" (con sesion). NO hay pantalla de precios despues: en la
 * app nativa no se vende la suscripcion.
 */
export function Funnel({
  haySesion,
  onCrearCuenta,
  onGuardar,
  onSaltar,
}: {
  haySesion: boolean;
  onCrearCuenta: () => void;
  onGuardar: (plan: RespuestasPlan) => void;
  onSaltar: () => void;
}) {
  const [respuestas, setRespuestas] = useState<RespuestasPlan>({});
  const [paso, setPaso] = useState(0);
  const [listo, setListo] = useState(false);
  const [ofrecerContinuar, setOfrecerContinuar] = useState(false);

  useEffect(() => {
    void leerPlanLocal().then((previas) => {
      setRespuestas(previas);
      if (planCompleto(previas)) setOfrecerContinuar(true);
      setListo(true);
    });
  }, []);

  function responder(clave: keyof RespuestasPlan, valor: RespuestasPlan[keyof RespuestasPlan]) {
    setRespuestas((prev) => {
      const nuevo = { ...prev, [clave]: valor };
      void escribirPlanLocal(nuevo);
      return nuevo;
    });
  }

  const avanzar = () => setPaso((p) => Math.min(p + 1, TOTAL - 1));
  const retroceder = () => setPaso((p) => Math.max(p - 1, 0));

  function terminar() {
    const conFecha = { ...respuestas, fecha_objetivo: fechaObjetivo().toISOString() };
    void escribirPlanLocal(conFecha).then(() => (haySesion ? onGuardar(conFecha) : onCrearCuenta()));
  }

  if (!listo) return null;

  if (ofrecerContinuar) {
    return (
      <Marco progreso={1}>
        <Kicker>Tu plan</Kicker>
        <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Ya tenías el test hecho</Text>
        <Text style={[theme.texto, { marginTop: spacing.md, fontSize: fontSize.sm }]}>
          Tus respuestas están guardadas en este dispositivo. Puedes continuar desde el resultado o empezar de cero.
        </Text>
        <Boton
          texto="Continuar donde lo dejé"
          onPress={() => {
            setOfrecerContinuar(false);
            setPaso(PREGUNTAS_PLAN.length);
          }}
          style={{ marginTop: spacing.xl }}
        />
        <Boton
          texto="Empezar de cero"
          variante="fantasma"
          onPress={() => {
            setRespuestas({});
            void escribirPlanLocal({});
            setOfrecerContinuar(false);
            setPaso(0);
          }}
          style={{ marginTop: spacing.sm }}
        />
      </Marco>
    );
  }

  if (paso < PREGUNTAS_PLAN.length) {
    const pregunta = PREGUNTAS_PLAN[paso];
    if (pregunta === undefined) return null;
    return (
      <Marco progreso={(paso + 1) / TOTAL} atras={paso > 0 ? retroceder : undefined} saltar={haySesion ? onSaltar : undefined}>
        <Text style={theme.textoTenue}>
          {paso + 1} de {PREGUNTAS_PLAN.length}
        </Text>
        <Pregunta
          key={pregunta.clave}
          pregunta={pregunta}
          valor={respuestas[pregunta.clave]}
          onResponder={(v) => responder(pregunta.clave, v)}
          onAvanzar={avanzar}
        />
      </Marco>
    );
  }

  const resultado = RESULTADOS[paso - PREGUNTAS_PLAN.length];
  const hAnio = horasPorAnio(respuestas);
  const hTotal = horasEnTotal(respuestas);

  return (
    <Marco progreso={(paso + 1) / TOTAL} atras={retroceder}>
      {resultado === 'coste' && <ResultadoCoste horas={hAnio} onAvanzar={avanzar} />}
      {resultado === 'equivalencias' && (
        <Equivalencias horasAnio={hAnio} horasTotal={hTotal} objetivo={respuestas.objetivo} onAvanzar={avanzar} />
      )}
      {resultado === 'lugar' && <LugarCorrecto onAvanzar={avanzar} />}
      {resultado === 'grafica' && <GraficaMejora onAvanzar={avanzar} />}
      {resultado === 'plan' && <PlanListo haySesion={haySesion} onTerminar={terminar} />}
    </Marco>
  );
}

/* -------------------------------------------------------------------------- */

function Marco({
  progreso,
  atras,
  saltar,
  children,
}: {
  progreso: number;
  atras?: () => void;
  saltar?: () => void;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={theme.pantalla} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        {atras !== undefined ? (
          <Pressable onPress={atras} accessibilityRole="button" accessibilityLabel="Atrás" style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.negroBorde, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={18} color={colors.grisTexto} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.negroBorde, overflow: 'hidden' }}>
          <View style={{ width: `${progreso * 100}%`, height: '100%', backgroundColor: colors.rojo }} />
        </View>
        {saltar !== undefined ? (
          <Pressable onPress={saltar} accessibilityRole="button" style={{ minWidth: 36 }}>
            <Text style={[theme.textoTenue, { fontSize: fontSize.xs, fontWeight: '600' }]}>Saltar</Text>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pregunta({
  pregunta,
  valor,
  onResponder,
  onAvanzar,
}: {
  pregunta: PreguntaPlan;
  valor: RespuestasPlan[keyof RespuestasPlan];
  onResponder: (v: RespuestasPlan[keyof RespuestasPlan]) => void;
  onAvanzar: () => void;
}) {
  const seleccion: (string | number)[] = pregunta.multiple
    ? Array.isArray(valor)
      ? valor
      : []
    : valor === undefined
      ? []
      : [valor as string | number];

  function elegir(v: string | number) {
    if (pregunta.multiple) {
      const actual = seleccion as string[];
      const sv = String(v);
      onResponder(actual.includes(sv) ? actual.filter((x) => x !== sv) : [...actual, sv]);
      return;
    }
    onResponder(v);
    setTimeout(onAvanzar, 220);
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={[theme.titulo, { marginTop: spacing.sm }]}>{pregunta.titulo}</Text>
      {pregunta.ayuda !== undefined && <Text style={[theme.textoTenue, { marginTop: spacing.xs }]}>{pregunta.ayuda}</Text>}
      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        {pregunta.opciones.map((o) => (
          <Opcion
            key={String(o.valor)}
            texto={o.etiqueta}
            activa={seleccion.some((s) => String(s) === String(o.valor))}
            onPress={() => elegir(o.valor)}
            multiple={pregunta.multiple === true}
          />
        ))}
      </View>
      {pregunta.multiple && (
        <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
          <Boton texto="Siguiente" onPress={onAvanzar} deshabilitado={seleccion.length === 0} />
        </View>
      )}
    </View>
  );
}

function ResultadoCoste({ horas, onAvanzar }: { horas: number; onAvanzar: () => void }) {
  const fraccion = Math.max(0.06, Math.min(1, horas / 5800));
  const r = 76;
  const circ = 2 * Math.PI * r;
  return (
    <View style={{ flex: 1 }}>
      <Kicker>Tu resultado</Kicker>
      <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Tiempo perdido este año</Text>
      <View style={{ alignItems: 'center', marginTop: spacing['2xl'] }}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Circle cx={100} cy={100} r={r} fill="none" stroke={colors.negroBorde} strokeWidth={14} />
          <Circle cx={100} cy={100} r={r} fill="none" stroke={colors.rojo} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - fraccion)} transform="rotate(-90 100 100)" />
          <SvgText x={100} y={96} textAnchor="middle" fontSize={46} fontWeight="700" fill={colors.rojo}>
            {String(horas)}
          </SvgText>
          <SvgText x={100} y={126} textAnchor="middle" fontSize={16} fontWeight="700" fill={colors.blanco} letterSpacing={2}>
            HORAS
          </SvgText>
        </Svg>
      </View>
      <Text style={[theme.texto, { textAlign: 'center', marginTop: spacing.xl }]}>
        Aproximadamente. Es el tiempo que el hábito te quita cada año, y que podrías estar usando para construir algo.
      </Text>
      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <Boton texto="Ver en qué se traduce" onPress={onAvanzar} />
      </View>
    </View>
  );
}

function Equivalencias({ horasAnio, horasTotal, objetivo, onAvanzar }: { horasAnio: number; horasTotal: number; objetivo: string | undefined; onAvanzar: () => void }) {
  const lista = equivalencias(horasAnio, horasTotal);
  const filas: (typeof lista)[] = [];
  for (let i = 0; i < lista.length; i += 2) filas.push(lista.slice(i, i + 2));
  return (
    <View style={{ flex: 1 }}>
      <Kicker>Lo que podrías haber hecho</Kicker>
      <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Con ese tiempo</Text>
      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        {filas.map((fila, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
            {fila.map((e) => (
              <Tarjeta key={e.etiqueta} style={{ flex: 1 }}>
                <Text style={{ color: colors.rojo, fontSize: fontSize['3xl'], fontWeight: '700', fontVariant: ['tabular-nums'] }}>{e.cantidad}</Text>
                <Text style={{ color: colors.blanco, fontWeight: '700', textTransform: 'uppercase', fontSize: fontSize.sm, marginTop: 4 }}>{e.etiqueta}</Text>
                <Text style={[theme.textoTenue, { fontSize: fontSize.xs }]}>{e.detalle}</Text>
              </Tarjeta>
            ))}
            {fila.length < 2 && <View style={{ flex: 1 }} />}
          </View>
        ))}
      </View>
      <Text style={[theme.titulo, { fontSize: fontSize.xl, marginTop: spacing.xl }]}>{fraseObjetivo(objetivo)}</Text>
      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <Boton texto="Recuperar el control" onPress={onAvanzar} />
      </View>
    </View>
  );
}

const HERRAMIENTAS: readonly { t: string; d: string; premium?: boolean }[] = [
  { t: 'Contador de racha', d: 'Cada día limpio, contado. El récord se queda aunque caigas.' },
  { t: 'Check-in diario', d: 'Una pregunta al abrir la app. Responderla es el método.' },
  { t: 'P.A.D', d: 'La acción exacta que ejecutas cuando aparece el deseo.', premium: true },
  { t: 'Carta anti-recaída', d: 'Un mensaje de ti para ti, para el momento crítico.', premium: true },
  { t: 'Bitácora de NOFAP', d: 'Nueve preguntas que convierten una caída en información.', premium: true },
  { t: 'Masterclasses', d: 'El método explicado por quien lo creó.' },
];

function LugarCorrecto({ onAvanzar }: { onAvanzar: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Kicker>Reset Alfa</Kicker>
      <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Estás en el lugar correcto</Text>
      <Text style={[theme.textoTenue, { marginTop: spacing.xs }]}>Esto es lo que te ayudará a recuperar el control a partir de hoy.</Text>
      <View style={{ marginTop: spacing.lg, borderLeftWidth: 2, borderLeftColor: colors.negroBorde, paddingLeft: spacing.lg, gap: spacing.sm }}>
        {HERRAMIENTAS.map((h) => (
          <View key={h.t}>
            <View style={{ position: 'absolute', left: -spacing.lg - 7, top: 16, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rojo, borderWidth: 3, borderColor: colors.negro }} />
            <Tarjeta>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ color: colors.blanco, fontWeight: '700', textTransform: 'uppercase', fontSize: fontSize.sm, flex: 1 }}>{h.t}</Text>
                {h.premium && <Chip>Premium</Chip>}
              </View>
              <Text style={[theme.textoTenue, { fontSize: fontSize.xs, marginTop: 4 }]}>{h.d}</Text>
            </Tarjeta>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <Boton texto="Continuar" onPress={onAvanzar} />
      </View>
    </View>
  );
}

function GraficaMejora({ onAvanzar }: { onAvanzar: () => void }) {
  const W = 320;
  const H = 180;
  const izq = 28;
  const abajo = 150;
  const ex = (d: number) => izq + (d / 100) * (W - izq - 12);
  const ey = (v: number) => abajo - (v / 100) * (abajo - 20);
  const puntos = Array.from({ length: 101 }, (_, d) => `${ex(d)},${ey(mejora(d))}`);
  const linea = `M${puntos.join(' L')}`;
  const area = `${linea} L${ex(100)},${abajo} L${ex(0)},${abajo} Z`;
  return (
    <View style={{ flex: 1 }}>
      <Kicker>Lo que viene</Kicker>
      <Text style={[theme.titulo, { marginTop: spacing.sm }]}>Los primeros 90 días</Text>
      <Text style={[theme.textoTenue, { marginTop: spacing.xs }]}>Curva orientativa. Sube rápido al principio y se estabiliza: por eso los primeros 30 días son los que más cambian.</Text>
      <Svg width="100%" height={200} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: spacing.lg }}>
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.rojo} stopOpacity={0.28} />
            <Stop offset="1" stopColor={colors.rojo} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Line x1={izq} y1={abajo} x2={W - 8} y2={abajo} stroke={colors.negroBorde} />
        <Line x1={izq} y1={abajo} x2={izq} y2={16} stroke={colors.negroBorde} />
        <Path d={area} fill="url(#area)" />
        <Path d={linea} fill="none" stroke={colors.rojo} strokeWidth={3} strokeLinecap="round" />
        {HITOS_MEJORA.map((h) => (
          <Circle key={h.dia} cx={ex(h.dia)} cy={ey(mejora(h.dia))} r={6} fill={colors.rojo} stroke={colors.negro} strokeWidth={3} />
        ))}
        {HITOS_MEJORA.map((h) => (
          <SvgText key={`t${h.dia}`} x={ex(h.dia)} y={abajo + 16} textAnchor="middle" fontSize={11} fontWeight="700" fill={colors.blanco}>
            {`${h.dia} días`}
          </SvgText>
        ))}
      </Svg>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {HITOS_MEJORA.map((h) => (
          <View key={h.dia} style={{ flexDirection: 'row', gap: spacing.md }}>
            <Text style={{ color: colors.rojo, fontWeight: '700', width: 64 }}>Día {h.dia}</Text>
            <Text style={[theme.texto, { color: colors.blanco, fontSize: fontSize.sm }]}>{h.texto}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <Boton texto="Ver mi plan" onPress={onAvanzar} />
      </View>
    </View>
  );
}

function PlanListo({ haySesion, onTerminar }: { haySesion: boolean; onTerminar: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: colors.rojo, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="checkmark" size={30} color={colors.blancoPuro} />
      </View>
      <Text style={[theme.titulo, { textAlign: 'center', marginTop: spacing.lg }]}>Tu plan está listo</Text>
      <Text style={[theme.texto, { textAlign: 'center', marginTop: spacing.sm, fontSize: fontSize.sm }]}>Deberías tener el control del deseo antes del</Text>
      <View style={{ backgroundColor: colors.negroElevado, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm }}>
        <Text style={{ color: colors.rojo, fontWeight: '700', textTransform: 'uppercase', fontSize: fontSize.xl, textAlign: 'center' }}>
          {formatearFecha(fechaObjetivo())}
        </Text>
      </View>
      <View style={[theme.separador, { marginVertical: spacing.xl }]} />
      <Text style={[theme.titulo, { fontSize: fontSize.xl, textAlign: 'center' }]}>Conviértete en el hombre que admiras</Text>
      <Text style={[theme.textoTenue, { textAlign: 'center', marginTop: spacing.xs }]}>Disciplina · Enfoque · Libertad</Text>
      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <Boton texto={haySesion ? 'Guardar mi plan' : 'Crear mi cuenta'} onPress={onTerminar} />
      </View>
    </View>
  );
}
