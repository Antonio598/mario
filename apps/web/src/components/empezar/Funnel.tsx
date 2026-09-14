'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CLAVE_ALMACEN,
  PREGUNTAS_PLAN,
  planCompleto,
  type PreguntaPlan,
  type RespuestasPlan,
} from '@/lib/empezar/preguntas';
import {
  HITOS_MEJORA,
  equivalencias,
  fechaObjetivo,
  formatearFecha,
  fraseObjetivo,
  horasEnTotal,
  horasPorAnio,
  mejora,
} from '@/lib/empezar/calculos';

/* -------------------------------------------------------------------------- */
/* Persistencia en el navegador                                                */
/* -------------------------------------------------------------------------- */

function leerAlmacen(): RespuestasPlan {
  try {
    const bruto = localStorage.getItem(CLAVE_ALMACEN);
    if (bruto === null) return {};
    const obj = JSON.parse(bruto) as unknown;
    return typeof obj === 'object' && obj !== null ? (obj as RespuestasPlan) : {};
  } catch {
    return {};
  }
}

function escribirAlmacen(r: RespuestasPlan): void {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(r));
  } catch {
    // Modo incógnito o almacenamiento lleno: el test sigue funcionando, solo
    // que no sobrevive a una recarga.
  }
}

/* -------------------------------------------------------------------------- */
/* Pasos                                                                       */
/* -------------------------------------------------------------------------- */

type PasoResultado = 'coste' | 'equivalencias' | 'lugar' | 'grafica' | 'plan';
const RESULTADOS: readonly PasoResultado[] = ['coste', 'equivalencias', 'lugar', 'grafica', 'plan'];
const TOTAL_PASOS = PREGUNTAS_PLAN.length + RESULTADOS.length;

/**
 * El embudo de entrada: ocho preguntas y cinco pantallas de resultado.
 *
 * Una pantalla por paso, con barra de progreso, porque el usuario que sabe
 * cuánto queda no abandona a la mitad. Las respuestas se guardan en el
 * navegador en cada cambio: si recarga o cierra, retoma donde estaba.
 *
 * Con sesión abierta (usuario antiguo al que el gate manda aquí) hay un
 * enlace para saltar el test. Sin sesión no hay salida: el test ES la
 * entrada, y la cuenta se crea al final.
 */
export function Funnel({ haySesion }: { haySesion: boolean }) {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<RespuestasPlan>({});
  const [paso, setPaso] = useState(0);
  const [listo, setListo] = useState(false);
  const [ofrecerContinuar, setOfrecerContinuar] = useState(false);
  const [saltando, setSaltando] = useState(false);

  // Se lee el almacén al montar, nunca en el render: en el servidor no existe.
  useEffect(() => {
    const previas = leerAlmacen();
    setRespuestas(previas);
    if (planCompleto(previas)) setOfrecerContinuar(true);
    setListo(true);
  }, []);

  function responder(clave: keyof RespuestasPlan, valor: RespuestasPlan[keyof RespuestasPlan]) {
    setRespuestas((prev) => {
      const nuevo = { ...prev, [clave]: valor };
      escribirAlmacen(nuevo);
      return nuevo;
    });
  }

  function avanzar() {
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS - 1));
  }

  function retroceder() {
    setPaso((p) => Math.max(p - 1, 0));
  }

  async function saltar() {
    setSaltando(true);
    const supabase = createClient();
    await supabase.rpc('guardar_plan', { p_plan: null });
    router.replace('/app');
  }

  function crearCuenta() {
    // La fecha objetivo se fija aquí, al terminar, no al empezar: es la de hoy
    // más 90, y "hoy" es el día en que decidió.
    const conFecha = { ...respuestas, fecha_objetivo: fechaObjetivo().toISOString() };
    escribirAlmacen(conFecha);
    router.push(haySesion ? '/empezar/guardar' : '/entrar?siguiente=/empezar/guardar&registro=1');
  }

  if (!listo) return null;

  /* ---------------------------------------------------------------- */
  /* Retomar un test ya completo                                      */
  /* ---------------------------------------------------------------- */
  if (ofrecerContinuar) {
    return (
      <Marco progreso={1}>
        <p className="ra-kicker">Tu plan</p>
        <h1 className="ra-titulo mt-3">Ya tenías el test hecho</h1>
        <p className="mt-4 text-sm text-ra-texto-sec">
          Tus respuestas están guardadas en este navegador. Puedes continuar desde el resultado o
          empezar de cero.
        </p>
        <button
          type="button"
          onClick={() => {
            setOfrecerContinuar(false);
            setPaso(PREGUNTAS_PLAN.length);
          }}
          className="ra-boton mt-8"
        >
          Continuar donde lo dejé
        </button>
        <button
          type="button"
          onClick={() => {
            setRespuestas({});
            escribirAlmacen({});
            setOfrecerContinuar(false);
            setPaso(0);
          }}
          className="ra-boton-fantasma mt-2"
        >
          Empezar de cero
        </button>
      </Marco>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Preguntas                                                        */
  /* ---------------------------------------------------------------- */
  if (paso < PREGUNTAS_PLAN.length) {
    const pregunta = PREGUNTAS_PLAN[paso];
    if (pregunta === undefined) return null;

    return (
      <Marco
        progreso={(paso + 1) / TOTAL_PASOS}
        atras={paso > 0 ? retroceder : undefined}
        saltar={haySesion ? saltar : undefined}
        saltando={saltando}
      >
        <p className="text-xs text-ra-texto-tenue">
          {paso + 1} de {PREGUNTAS_PLAN.length}
        </p>
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

  /* ---------------------------------------------------------------- */
  /* Resultados                                                       */
  /* ---------------------------------------------------------------- */
  const resultado = RESULTADOS[paso - PREGUNTAS_PLAN.length];
  const hAnio = horasPorAnio(respuestas);
  const hTotal = horasEnTotal(respuestas);

  return (
    <Marco progreso={(paso + 1) / TOTAL_PASOS} atras={retroceder}>
      {resultado === 'coste' && <ResultadoCoste horas={hAnio} onAvanzar={avanzar} />}
      {resultado === 'equivalencias' && (
        <Equivalencias
          horasAnio={hAnio}
          horasTotal={hTotal}
          objetivo={respuestas.objetivo}
          onAvanzar={avanzar}
        />
      )}
      {resultado === 'lugar' && <LugarCorrecto onAvanzar={avanzar} />}
      {resultado === 'grafica' && <GraficaMejora onAvanzar={avanzar} />}
      {resultado === 'plan' && <PlanListo haySesion={haySesion} onCrearCuenta={crearCuenta} />}
    </Marco>
  );
}

/* -------------------------------------------------------------------------- */
/* Marco: barra de progreso, atrás, saltar                                     */
/* -------------------------------------------------------------------------- */

function Marco({
  progreso,
  atras,
  saltar,
  saltando,
  children,
}: {
  progreso: number;
  atras?: () => void;
  saltar?: () => void;
  saltando?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center gap-3">
        {atras !== undefined ? (
          <button
            type="button"
            onClick={atras}
            aria-label="Atrás"
            className="mg-pulsable flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ra-borde text-ra-texto-sec"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18 9 12l6-6" />
            </svg>
          </button>
        ) : (
          <span className="h-9 w-9 shrink-0" />
        )}

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
          className="h-[3px] flex-1 overflow-hidden rounded bg-ra-borde"
        >
          <div
            className="h-full bg-ra-rojo transition-[width] duration-300 ease-out"
            style={{ width: `${progreso * 100}%` }}
          />
        </div>

        {saltar !== undefined ? (
          <button
            type="button"
            onClick={saltar}
            disabled={saltando}
            className="shrink-0 text-xs font-semibold text-ra-texto-tenue"
          >
            {saltando ? '…' : 'Saltar'}
          </button>
        ) : (
          <span className="w-9 shrink-0" />
        )}
      </div>

      <div key={String(progreso)} className="mg-entrada mt-8 flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pregunta: opciones de una o varias                                          */
/* -------------------------------------------------------------------------- */

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
    // Auto-avance: una elección única no necesita un segundo toque. El retardo
    // deja ver la selección marcada, que es lo que confirma que se ha pulsado.
    window.setTimeout(onAvanzar, 220);
  }

  return (
    <>
      <h1 className="ra-titulo mt-3">{pregunta.titulo}</h1>
      {pregunta.ayuda !== undefined && (
        <p className="mt-2 text-sm text-ra-texto-tenue">{pregunta.ayuda}</p>
      )}

      <div
        role={pregunta.multiple ? 'group' : 'radiogroup'}
        aria-label={pregunta.titulo}
        className="mt-7 grid gap-2"
      >
        {pregunta.opciones.map((o) => {
          const activa = seleccion.some((s) => String(s) === String(o.valor));
          return (
            <button
              key={String(o.valor)}
              type="button"
              role={pregunta.multiple ? 'checkbox' : 'radio'}
              aria-checked={activa}
              onClick={() => elegir(o.valor)}
              className={`mg-pulsable flex min-h-[52px] items-center gap-3 rounded-xl border px-4 text-left text-base transition-colors ${
                activa
                  ? 'border-ra-rojo bg-ra-rojo/10 font-semibold text-ra-texto'
                  : 'border-ra-borde text-ra-texto-sec hover:border-ra-texto-tenue'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 border-2 ${pregunta.multiple ? 'rounded' : 'rounded-full'} ${
                  activa ? 'border-ra-rojo bg-ra-rojo' : 'border-ra-borde'
                }`}
              />
              {o.etiqueta}
            </button>
          );
        })}
      </div>

      {pregunta.multiple && (
        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={onAvanzar}
            disabled={seleccion.length === 0}
            className="ra-boton"
          >
            Siguiente
          </button>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Resultado 1: tiempo perdido                                                 */
/* -------------------------------------------------------------------------- */

function ResultadoCoste({ horas, onAvanzar }: { horas: number; onAvanzar: () => void }) {
  // Anillo: el arco representa la fracción del año despierto (≈ 5.800 h).
  const fraccion = Math.min(1, horas / 5800);
  const radio = 76;
  const circ = 2 * Math.PI * radio;

  return (
    <>
      <p className="ra-kicker">Tu resultado</p>
      <h1 className="ra-titulo mt-3">Tiempo perdido este año</h1>

      <div className="mx-auto mt-10 grid place-items-center">
        <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={radio} fill="none" stroke="var(--color-ra-borde)" strokeWidth="14" />
          <circle
            cx="100"
            cy="100"
            r={radio}
            fill="none"
            stroke="var(--color-ra-rojo)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - Math.max(0.06, fraccion))}
            transform="rotate(-90 100 100)"
            className="mg-trazo"
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
          />
          <text
            x="100"
            y="96"
            textAnchor="middle"
            fontFamily="var(--font-titular)"
            fontWeight="700"
            fontSize="46"
            fill="var(--color-ra-rojo)"
          >
            {horas}
          </text>
          <text
            x="100"
            y="126"
            textAnchor="middle"
            fontFamily="var(--font-titular)"
            fontWeight="700"
            fontSize="18"
            fill="var(--color-ra-texto)"
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
          >
            HORAS
          </text>
        </svg>
      </div>

      <p className="mt-8 text-center text-base leading-relaxed text-ra-texto-sec">
        Aproximadamente. Es el tiempo que el hábito te quita cada año, y que podrías estar usando
        para construir algo.
      </p>

      <div className="mt-auto pt-8">
        <button type="button" onClick={onAvanzar} className="ra-boton">
          Ver en qué se traduce
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Resultado 2: equivalencias                                                  */
/* -------------------------------------------------------------------------- */

function Equivalencias({
  horasAnio,
  horasTotal,
  objetivo,
  onAvanzar,
}: {
  horasAnio: number;
  horasTotal: number;
  objetivo: string | undefined;
  onAvanzar: () => void;
}) {
  const lista = equivalencias(horasAnio, horasTotal);

  return (
    <>
      <p className="ra-kicker">Lo que podrías haber hecho</p>
      <h1 className="ra-titulo mt-3">Con ese tiempo</h1>

      <div className="mg-escalonado mt-7 grid grid-cols-2 gap-3">
        {lista.map((e) => (
          <div key={e.etiqueta} className="ra-card px-4 py-5">
            <p className="font-titular text-4xl leading-none font-bold text-ra-rojo tabular-nums">
              {e.cantidad}
            </p>
            <p className="mt-2 font-titular text-sm font-bold text-ra-texto uppercase">
              {e.etiqueta}
            </p>
            <p className="mt-0.5 text-xs text-ra-texto-tenue">{e.detalle}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 font-titular text-2xl leading-tight font-bold text-ra-texto uppercase">
        {fraseObjetivo(objetivo)}
      </p>

      <div className="mt-auto pt-8">
        <button type="button" onClick={onAvanzar} className="ra-boton">
          Recuperar el control
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Resultado 3: estás en el lugar correcto                                     */
/* -------------------------------------------------------------------------- */

const HERRAMIENTAS: ReadonlyArray<{ t: string; d: string; premium?: boolean }> = [
  { t: 'Contador de racha', d: 'Cada día limpio, contado. El récord se queda aunque caigas.' },
  { t: 'Check-in diario', d: 'Una pregunta al abrir la app. Responderla es el método.' },
  { t: 'P.A.D', d: 'La acción exacta que ejecutas cuando aparece el deseo.', premium: true },
  { t: 'Carta anti-recaída', d: 'Un mensaje de ti para ti, para el momento crítico.', premium: true },
  {
    t: 'Bitácora de NOFAP',
    d: 'Nueve preguntas que convierten una caída en información.',
    premium: true,
  },
  { t: 'Masterclasses', d: 'El método explicado por quien lo creó.' },
];

function LugarCorrecto({ onAvanzar }: { onAvanzar: () => void }) {
  return (
    <>
      <p className="ra-kicker">Reset Alfa</p>
      <h1 className="ra-titulo mt-3">Estás en el lugar correcto</h1>
      <p className="mt-2 text-sm text-ra-texto-tenue">
        Esto es lo que te ayudará a recuperar el control a partir de hoy.
      </p>

      <ol className="mg-escalonado relative mt-7 space-y-3 border-l-2 border-ra-borde pl-6">
        {HERRAMIENTAS.map((h) => (
          <li key={h.t} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-4 -left-[31px] h-3 w-3 rounded-full bg-ra-rojo ring-4 ring-ra-fondo"
            />
            <div className="ra-card px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-titular text-sm font-bold text-ra-texto uppercase">{h.t}</p>
                {h.premium && <span className="ra-chip">Premium</span>}
              </div>
              <p className="mt-1 text-xs text-ra-texto-sec">{h.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-8">
        <button type="button" onClick={onAvanzar} className="ra-boton">
          Continuar
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Resultado 4: gráfica de mejora                                              */
/* -------------------------------------------------------------------------- */

function GraficaMejora({ onAvanzar }: { onAvanzar: () => void }) {
  const W = 320;
  const H = 180;
  const izq = 28;
  const abajo = 150;
  const escalaX = (dia: number) => izq + (dia / 100) * (W - izq - 12);
  const escalaY = (v: number) => abajo - (v / 100) * (abajo - 20);

  const puntos = Array.from({ length: 101 }, (_, d) => `${escalaX(d)},${escalaY(mejora(d))}`);
  const linea = `M${puntos.join(' L')}`;
  const area = `${linea} L${escalaX(100)},${abajo} L${escalaX(0)},${abajo} Z`;

  return (
    <>
      <p className="ra-kicker">Lo que viene</p>
      <h1 className="ra-titulo mt-3">Los primeros 90 días</h1>
      <p className="mt-2 text-sm text-ra-texto-tenue">
        Curva orientativa. Sube rápido al principio y se estabiliza: por eso los primeros 30 días
        son los que más cambian.
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 w-full" role="img" aria-label="Curva de mejora">
        <defs>
          <linearGradient id="ra-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-ra-rojo)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--color-ra-rojo)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={izq} y1={abajo} x2={W - 8} y2={abajo} stroke="var(--color-ra-borde)" />
        <line x1={izq} y1={abajo} x2={izq} y2={16} stroke="var(--color-ra-borde)" />
        <path d={area} fill="url(#ra-area)" />
        <path d={linea} fill="none" stroke="var(--color-ra-rojo)" strokeWidth="3" strokeLinecap="round" />
        {HITOS_MEJORA.map((h) => (
          <g key={h.dia}>
            <circle
              cx={escalaX(h.dia)}
              cy={escalaY(mejora(h.dia))}
              r="6"
              fill="var(--color-ra-rojo)"
              stroke="var(--color-ra-fondo)"
              strokeWidth="3"
            />
            <text
              x={escalaX(h.dia)}
              y={abajo + 16}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="var(--color-ra-texto)"
            >
              {h.dia} días
            </text>
          </g>
        ))}
      </svg>

      <ul className="mt-5 space-y-2">
        {HITOS_MEJORA.map((h) => (
          <li key={h.dia} className="flex items-center gap-3 text-sm">
            <span className="w-14 shrink-0 font-titular font-bold text-ra-rojo">Día {h.dia}</span>
            <span className="text-ra-texto">{h.texto}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <button type="button" onClick={onAvanzar} className="ra-boton">
          Ver mi plan
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Resultado 5: plan listo                                                     */
/* -------------------------------------------------------------------------- */

function PlanListo({ haySesion, onCrearCuenta }: { haySesion: boolean; onCrearCuenta: () => void }) {
  const fecha = formatearFecha(fechaObjetivo());

  return (
    <>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ra-rojo text-white">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1 className="ra-titulo mt-6 text-center">Tu plan está listo</h1>
      <p className="mt-3 text-center text-sm text-ra-texto-sec">
        Deberías tener el control del deseo antes del
      </p>
      <p className="mt-3 rounded-xl bg-ra-superficie px-4 py-3 text-center font-titular text-xl font-bold text-ra-rojo uppercase">
        {fecha}
      </p>

      <hr className="ra-separador my-8" />

      <p className="text-center font-titular text-2xl leading-tight font-bold text-ra-texto uppercase">
        Conviértete en el hombre que admiras
      </p>
      <p className="mt-2 text-center text-sm text-ra-texto-tenue">
        Disciplina · Enfoque · Libertad
      </p>

      <div className="mt-auto pt-8">
        <button type="button" onClick={onCrearCuenta} className="ra-boton">
          {haySesion ? 'Guardar mi plan' : 'Crear mi cuenta'}
        </button>
      </div>
    </>
  );
}
