'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RECURSOS_AYUDA } from '@reset-alfa/shared';
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
 * Las ocho preguntas del protocolo, en el orden del método.
 *
 * TODAS SON OMITIBLES. Es minimización del RGPD —son datos de categoría
 * especial— y también sentido común: quien acaba de recaer no siempre puede
 * responderlo todo, y un formulario que bloquea es un formulario que se cierra.
 *
 * El tono interroga los hechos, nunca a la persona. Nada de "por qué has
 * fallado": eso convierte el registro en un castigo y hace que se deje de usar.
 */
const PREGUNTAS: readonly Pregunta[] = [
  {
    campo: 'lugar',
    tipo: 'texto',
    titulo: '¿Dónde ha pasado?',
    ayuda: 'El sitio exacto. Cuanto más concreto, más fácil será cambiarlo.',
    placeholder: 'Mi habitación, en la cama',
  },
  {
    campo: 'hora',
    tipo: 'hora',
    titulo: '¿A qué hora?',
    ayuda: 'Los patrones aparecen solos cuando acumulas varios registros.',
  },
  {
    campo: 'trigger',
    tipo: 'texto',
    titulo: '¿Qué lo ha disparado?',
    ayuda: 'El momento exacto en que algo cambió: un pensamiento, una imagen, un estado.',
    placeholder: 'Aburrimiento mirando el móvil sin rumbo',
  },
  {
    campo: 'accion_correctiva',
    tipo: 'texto',
    titulo: '¿Qué puedes hacer hoy para eliminar ese disparador?',
    ayuda: 'Una acción concreta y pequeña. No un propósito.',
    placeholder: 'Dejar el móvil cargando en la cocina por la noche',
  },
  {
    campo: 'ejecuto_pad',
    tipo: 'si_no',
    titulo: '¿Ejecutaste tu P.A.D?',
    ayuda: 'Tu Protocolo Anti-Deseo.',
  },
  {
    campo: 'motivo_fallo',
    tipo: 'texto',
    titulo: '¿Qué falló?',
    ayuda: 'Si no lo ejecutaste, qué te lo impidió. Si lo ejecutaste, dónde se rompió.',
    placeholder: 'No me acordé en el momento',
  },
  {
    campo: 'ajuste_pad',
    tipo: 'texto',
    titulo: '¿Qué cambias en tu P.A.D?',
    ayuda: 'Un ajuste concreto para la próxima vez.',
    placeholder: 'Añadir un paso antes: levantarme y salir de la habitación',
  },
  {
    campo: 'contexto_emocional',
    tipo: 'texto',
    titulo: '¿Cómo estabas?',
    ayuda: 'Cansancio, estrés, soledad, euforia. Lo que hubiera.',
    placeholder: 'Cansado y con la sensación de haber perdido el día',
  },
];

export function FormularioRecaida({ consiente }: { consiente: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestasRecaida>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

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
  /* Sin consentimiento: se registra la recaída y se salta el formulario */
  /* ------------------------------------------------------------------ */
  if (!consiente && !hecho) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-2xl">Registrar la recaída</h1>
        <p className="mt-4 text-mg-gris-texto">
          El detalle del protocolo incluye información sobre tu vida sexual. Para guardarlo
          necesitamos tu consentimiento explícito, y no lo has dado.
        </p>
        <p className="mt-3 text-mg-gris-texto">
          Podemos registrar el día igualmente y no guardar nada más. Puedes activarlo cuando
          quieras desde Perfil.
        </p>

        {error !== null && <p className="mt-4 text-sm text-mg-rojo-claro">{error}</p>}

        <button
          type="button"
          onClick={() => void enviar({})}
          disabled={enviando}
          className="mt-8 min-h-[52px] w-full rounded-md bg-mg-rojo px-6 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Registrar solo el día'}
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
          onClick={() => router.push('/app')}
          className="mt-9 min-h-[52px] w-full rounded-md bg-mg-rojo px-6 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase"
        >
          Volver
        </button>

        {/*
          Enlace discreto a ayuda profesional. Requisito del proyecto: protege
          legalmente y es lo correcto. Discreto y no destacado a propósito: no
          se trata de sugerir que cualquier recaída es un problema clínico.
        */}
        <details className="mt-10 text-sm">
          <summary className="cursor-pointer text-mg-gris-tenue hover:text-mg-gris-texto">
            Si necesitas hablar con alguien
          </summary>
          <ul className="mt-4 space-y-3 text-mg-gris-texto">
            {RECURSOS_AYUDA.map((r) => (
              <li key={r.nombre}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mg-rojo-claro underline underline-offset-2"
                >
                  {r.nombre}
                </a>
                {r.telefono !== null && <span className="text-mg-gris-tenue"> · {r.telefono}</span>}
                <p className="text-xs text-mg-gris-tenue">{r.descripcion}</p>
              </li>
            ))}
          </ul>
        </details>
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
