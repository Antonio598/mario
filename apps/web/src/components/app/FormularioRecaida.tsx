'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { publicEnv } from '@/lib/env';
import type { RespuestasRecaida } from '@/lib/app/tipos';

type Tipo = 'texto' | 'hora' | 'si_no';

interface Pregunta {
  campo: keyof RespuestasRecaida;
  tipo: Tipo;
  titulo: string;
  ayuda: string;
  placeholder?: string;
}

/**
 * Las nueve preguntas de la Plantilla post-recaída, en el orden del método.
 *
 * El texto de cada `titulo` reproduce el de la plantilla en papel. Que
 * coincidan importa: el usuario que ya trabaja con el cuaderno reconoce las
 * mismas preguntas, y el registro digital y el de papel siguen siendo
 * comparables.
 *
 * La plantilla pide "lugar exacto Y hora" en una sola línea; aquí van en dos
 * pantallas porque la hora usa un selector propio y mezclarla con texto libre
 * daría respuestas inconsistentes, imposibles de agregar para el análisis de
 * patrones.
 *
 * TODAS SON OMITIBLES. Es minimización del RGPD —son datos de categoría
 * especial— y también sentido común: quien acaba de recaer no siempre puede
 * responderlo todo, y un formulario que bloquea es un formulario que se cierra.
 *
 * El tono interroga los hechos, nunca a la persona: eso es lo que evita que el
 * registro se convierta en un castigo y se deje de usar.
 */
const PREGUNTAS: readonly Pregunta[] = [
  {
    campo: 'lugar',
    tipo: 'texto',
    titulo: 'Lugar exacto de la recaída',
    ayuda: 'Cuanto más concreto, más fácil será cambiarlo.',
    placeholder: 'Mi habitación, en la cama',
  },
  {
    campo: 'hora',
    tipo: 'hora',
    titulo: 'Hora de la recaída',
    ayuda: 'Los patrones aparecen solos cuando acumulas varios registros.',
  },
  {
    campo: 'trigger',
    tipo: 'texto',
    titulo: 'Trigger o disparador',
    ayuda: 'El momento exacto en que algo cambió: un pensamiento, una imagen, un estado.',
    placeholder: 'Aburrimiento mirando el móvil sin rumbo',
  },
  {
    campo: 'accion_correctiva',
    tipo: 'texto',
    titulo: 'Acción que puedo aplicar ahora para eliminar el trigger',
    ayuda: 'Una acción concreta y pequeña. No un propósito.',
    placeholder: 'Dejar el móvil cargando en la cocina por la noche',
  },
  {
    campo: 'ejecuto_pad',
    tipo: 'si_no',
    titulo: '¿Ejecuté mi P.A.D?',
    ayuda: 'Tu Protocolo Anti-Deseo.',
  },
  {
    campo: 'motivo_fallo',
    tipo: 'texto',
    titulo: 'Si lo ejecutaste, ¿por qué falló? Si no, ¿por qué no lo ejecutaste?',
    ayuda: 'Los hechos, sin juicio. Es información, no una falta.',
    placeholder: 'No me acordé en el momento',
  },
  {
    campo: 'ajuste_pad',
    tipo: 'texto',
    titulo: '¿Qué debo cambiar en mi P.A.D para hacerlo 100 % efectivo?',
    ayuda: 'Un ajuste concreto para la próxima vez.',
    placeholder: 'Añadir un paso antes: levantarme y salir de la habitación',
  },
  {
    campo: 'contexto_ambiental',
    tipo: 'texto',
    titulo: 'Contexto ambiental',
    ayuda: 'Solo o acompañado, dentro o fuera, con o sin pantallas.',
    placeholder: 'Solo en casa, de noche, sin nada planificado',
  },
  {
    campo: 'contexto_emocional',
    tipo: 'texto',
    titulo: 'Contexto psicológico y emocional',
    ayuda: 'Cansancio, estrés, soledad, euforia. Lo que hubiera.',
    placeholder: 'Cansado y con la sensación de haber perdido el día',
  },
];

interface PropsFormulario {
  consiente: boolean;
  /** Se invoca al cerrar. Permite usarlo como pantalla o dentro del modal. */
  onTerminar?: () => void;
}

export function FormularioRecaida({ consiente, onTerminar }: PropsFormulario) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasRecaida>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  // El consentimiento puede concederse aquí mismo, así que el valor que llega
  // por props es solo el punto de partida.
  const [tieneConsentimiento, setTieneConsentimiento] = useState(consiente);

  /**
   * Activa el consentimiento del art. 9 sin salir de la pantalla.
   *
   * La casilla del registro es opcional y arranca desmarcada —tiene que serlo:
   * una casilla premarcada no es consentimiento válido—, así que la mayoría de
   * usuarios llegan aquí sin haberla marcado. Mandarlos a Perfil para volver
   * después es garantizar que no vuelven, y con ello se pierde justo el
   * registro que más información aporta.
   *
   * Concederlo aquí es igual de válido, y probablemente mejor: es explícito,
   * específico y se da en el momento en que el usuario entiende para qué sirve.
   */
  async function activarConsentimiento() {
    setEnviando(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user === null) {
      setEnviando(false);
      setError('Tu sesión ha caducado. Vuelve a entrar.');
      return;
    }

    // Se INSERTA una fila nueva; el historial completo es la prueba que exige
    // el art. 7.1 RGPD.
    const { error: err } = await supabase.from('consents').insert({
      user_id: user.id,
      tipo: 'datos_sensibles',
      concedido: true,
      version_politica: publicEnv.privacyPolicyVersion,
      origen: 'web',
    });

    setEnviando(false);

    if (err) {
      setError('No hemos podido guardar tu decisión. Inténtalo de nuevo.');
      return;
    }
    setTieneConsentimiento(true);
  }

  async function enviar(datos: RespuestasRecaida) {
    setEnviando(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.rpc('guardar_recaida', {
      p_lugar: datos.lugar ?? null,
      p_hora: datos.hora ?? null,
      p_trigger: datos.trigger ?? null,
      p_accion_correctiva: datos.accion_correctiva ?? null,
      p_ejecuto_pad: datos.ejecuto_pad ?? null,
      p_motivo_fallo: datos.motivo_fallo ?? null,
      p_ajuste_pad: datos.ajuste_pad ?? null,
      p_contexto_ambiental: datos.contexto_ambiental ?? null,
      p_contexto_emocional: datos.contexto_emocional ?? null,
    });

    setEnviando(false);

    if (err) {
      setError('No hemos podido guardarlo. Inténtalo de nuevo.');
      return;
    }
    setHecho(true);
  }

  /* ------------------------------------------------------------------ */
  /* Sin consentimiento todavía: se ofrece darlo aquí mismo              */
  /* ------------------------------------------------------------------ */
  if (!tieneConsentimiento && !hecho) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10">
        <p className="font-titular text-[11px] font-semibold tracking-[0.25em] text-ra-rojo uppercase">
          Protocolo post-recaída
        </p>

        <h1 className="mt-3 font-titular text-3xl font-bold text-ra-texto">
          Antes de empezar
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-ra-texto-sec">
          El protocolo te va a preguntar dónde, cuándo y en qué estado ocurrió. Esa
          información describe aspectos de tu vida sexual, así que la ley exige tu permiso
          explícito para guardarla.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-ra-texto-sec">
          Solo la ves tú. Puedes exportarla o borrarla cuando quieras desde Perfil.
        </p>

        {error !== null && <p className="mt-4 text-sm text-ra-rojo">{error}</p>}

        <button
          type="button"
          onClick={() => void activarConsentimiento()}
          disabled={enviando}
          className="mg-pulsable mt-8 min-h-[56px] w-full rounded-lg bg-ra-rojo px-6 font-titular text-base font-bold tracking-wider text-white uppercase disabled:opacity-60"
        >
          {enviando ? 'Un momento…' : 'Acepto, empezar el protocolo'}
        </button>

        {/*
          Salida sin consentir. El art. 7.4 RGPD exige que negarse no impida
          usar el servicio: el día se registra igual, solo que sin detalle.
        */}
        <button
          type="button"
          onClick={() => void enviar({})}
          disabled={enviando}
          className="mg-pulsable mt-3 min-h-[52px] w-full rounded-lg border border-ra-borde px-6 text-sm font-semibold text-ra-texto-sec disabled:opacity-60"
        >
          Registrar solo el día, sin detalle
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Cierre: reencuadre, nunca castigo                                */
  /* ---------------------------------------------------------------- */
  if (hecho) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <p className="mg-kicker">Registrado</p>
        <h1 className="mt-3 text-3xl">Esto no borra lo anterior</h1>

        <p className="mt-5 text-mg-gris-texto">
          Los días que ya sostuviste siguen siendo tuyos. Ahora tienes algo que antes no tenías:
          sabes dónde, cuándo y qué lo disparó.
        </p>
        <p className="mt-3 text-mg-gris-texto">
          Mañana el contador vuelve a empezar. Hoy solo tienes que cerrar esta pantalla.
        </p>

        <button
          type="button"
          onClick={() => (onTerminar ? onTerminar() : router.push('/app'))}
          className="mt-9 min-h-[52px] w-full rounded-md bg-mg-rojo px-6 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase"
        >
          Volver
        </button>


      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Una pregunta por pantalla                                        */
  /* ---------------------------------------------------------------- */
  const pregunta = PREGUNTAS[paso];
  if (pregunta === undefined) return null;

  const valor = respuestas[pregunta.campo];
  const esUltima = paso === PREGUNTAS.length - 1;

  function responder(v: string | boolean | null) {
    setRespuestas((prev) => ({ ...prev, [pregunta!.campo]: v }));
  }

  function avanzar() {
    if (esUltima) {
      void enviar(respuestas);
    } else {
      setPaso((p) => p + 1);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-96px)] max-w-md flex-col px-5 py-8">
      {/* Barra de progreso: saber cuánto queda es lo que evita el abandono. */}
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={PREGUNTAS.length}
        aria-valuenow={paso + 1}
        className="h-[3px] w-full overflow-hidden rounded bg-mg-negro-borde"
      >
        <div
          className="h-full bg-mg-rojo transition-[width] duration-300 ease-out"
          style={{ width: `${((paso + 1) / PREGUNTAS.length) * 100}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-mg-gris-tenue">
        {paso + 1} de {PREGUNTAS.length}
      </p>

      <div className="mt-10 flex-1">
        {/*
          `key` fuerza a React a remontar el bloque en cada pregunta. Sin él,
          el navegador conserva el valor escrito en el campo anterior porque
          reutiliza el mismo nodo del DOM.
        */}
        <div key={pregunta.campo} className="mg-entrada">
          <h1 className="text-2xl sm:text-3xl">{pregunta.titulo}</h1>
          <p className="mt-3 text-sm text-mg-gris-tenue">{pregunta.ayuda}</p>

          <div className="mt-7">
            {pregunta.tipo === 'si_no' ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: true, t: 'Sí' },
                  { v: false, t: 'No' },
                ].map((o) => (
                  <button
                    key={o.t}
                    type="button"
                    onClick={() => responder(o.v)}
                    className={`min-h-[52px] rounded-md border font-titular tracking-wider uppercase transition-colors ${
                      valor === o.v
                        ? 'border-mg-rojo bg-mg-rojo text-mg-blanco-puro'
                        : 'border-mg-negro-borde text-mg-gris-texto hover:border-mg-gris-tenue'
                    }`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            ) : pregunta.tipo === 'hora' ? (
              <input
                type="time"
                value={typeof valor === 'string' ? valor : ''}
                onChange={(e) => responder(e.target.value === '' ? null : e.target.value)}
                className="w-full rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 py-3 text-lg"
              />
            ) : (
              <textarea
                rows={4}
                autoFocus
                value={typeof valor === 'string' ? valor : ''}
                placeholder={pregunta.placeholder}
                onChange={(e) => responder(e.target.value === '' ? null : e.target.value)}
                className="w-full resize-none rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 py-3 text-base placeholder:text-mg-gris-apagado"
              />
            )}
          </div>
        </div>
      </div>

      {error !== null && <p className="mb-3 text-sm text-mg-rojo-claro">{error}</p>}

      <div className="flex items-center gap-3">
        {paso > 0 && (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="min-h-[52px] rounded-md border border-mg-negro-borde px-5 text-mg-gris-texto"
          >
            Atrás
          </button>
        )}

        <button
          type="button"
          onClick={avanzar}
          disabled={enviando}
          className="min-h-[52px] flex-1 rounded-md bg-mg-rojo px-6 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : esUltima ? 'Terminar' : 'Siguiente'}
        </button>
      </div>

      {/* Omitir siempre visible: ninguna pregunta puede bloquear el registro. */}
      <button
        type="button"
        onClick={avanzar}
        className="mt-4 self-center text-sm text-mg-gris-tenue hover:text-mg-gris-texto"
      >
        Prefiero no responder
      </button>

      <Link href="/app" className="mt-6 self-center text-xs text-mg-gris-apagado">
        Salir sin guardar
      </Link>
    </div>
  );
}
