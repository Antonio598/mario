'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registrarConsentimiento } from '@/lib/app/consentimiento';
import type { RespuestasRecaida } from '@/lib/app/tipos';
import { PREGUNTAS } from '@/lib/app/preguntas-recaida';

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
  const [detalleError, setDetalleError] = useState<string | null>(null);
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
    setDetalleError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user === null) {
      setEnviando(false);
      setError('Tu sesión ha caducado. Vuelve a entrar.');
      return;
    }

    const res = await registrarConsentimiento(supabase, {
      userId: user.id,
      tipo: 'datos_sensibles',
      concedido: true,
    });

    setEnviando(false);

    if (!res.ok) {
      setError('No hemos podido guardar tu decisión. Inténtalo de nuevo.');
      // El detalle tecnico se muestra en pequeño. Sin él, un fallo aquí es
      // indistinguible de otro y hay que adivinarlo a ciegas; el usuario que
      // reporta el problema puede leerlo tal cual.
      setDetalleError(res.detalle ?? null);
      return;
    }
    setTieneConsentimiento(true);
  }

  async function enviar(datos: RespuestasRecaida) {
    setEnviando(true);
    setError(null);

    const supabase = createClient();
    const { data, error: err } = await supabase.rpc('guardar_recaida', {
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

    /*
      Aviso por correo al equipo. Va DESPUES de guardar y sin `await`: el
      registro ya esta en la base, y esperar a un servicio externo solo serviria
      para dejar mirando una pantalla de carga a quien acaba de recaer.

      Tampoco se comprueba el resultado. Si el correo falla, falla en el log del
      servidor, no delante del usuario: el registro es lo que importa y ya
      esta hecho.

      El servidor vuelve a comprobar el consentimiento antes de enviar nada.
    */
    const resumen = (data ?? {}) as { racha_anterior?: number };
    void fetch('/api/aviso-recaida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, racha_anterior: resumen.racha_anterior ?? null }),
    }).catch(() => undefined);
  }

  /* ------------------------------------------------------------------ */
  /* Sin consentimiento todavía: se ofrece darlo aquí mismo              */
  /* ------------------------------------------------------------------ */
  if (!tieneConsentimiento && !hecho) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10">
        <p className="ra-kicker">Protocolo post-recaída</p>

        <h1 className="ra-titulo mt-3">Antes de empezar</h1>

        <p className="mt-4 text-sm leading-relaxed text-ra-texto-sec">
          El protocolo te va a preguntar dónde, cuándo y en qué estado ocurrió. Esa
          información describe aspectos de tu vida sexual, así que la ley exige tu permiso
          explícito para guardarla.
        </p>

        {/*
          Este parrafo dice la verdad completa a proposito. Las respuestas se
          envian por correo al equipo de Modo Guerrero para el seguimiento, y un
          consentimiento que oculta a quien van a llegar los datos no es valido:
          el art. 13.1.e RGPD obliga a nombrar a los destinatarios ANTES.
        */}
        <p className="mt-3 text-sm leading-relaxed text-ra-texto-sec">
          Tus respuestas se guardan en tu historial y se envían al equipo de Modo Guerrero
          para poder darte seguimiento. Nadie más las ve. Puedes exportarlas o borrarlas
          cuando quieras desde Perfil.
        </p>

        {error !== null && (
          <div className="mt-4">
            <p className="text-sm text-ra-rojo">{error}</p>
            {detalleError !== null && (
              <p className="mt-1 font-mono text-[11px] break-all text-ra-texto-tenue">
                {detalleError}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => void activarConsentimiento()}
          disabled={enviando}
          className="ra-boton mt-8"
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
          className="ra-boton-sec mt-3"
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
        <p className="ra-kicker">Registrado</p>
        <h1 className="ra-titulo mt-3">Esto no borra lo anterior</h1>

        <p className="mt-5 text-ra-texto-sec">
          Los días que ya sostuviste siguen siendo tuyos. Ahora tienes algo que antes no tenías:
          sabes dónde, cuándo y qué lo disparó.
        </p>
        <p className="mt-3 text-ra-texto-sec">
          Mañana el contador vuelve a empezar. Hoy solo tienes que cerrar esta pantalla.
        </p>

        <button
          type="button"
          onClick={() => (onTerminar ? onTerminar() : router.push('/app'))}
          className="ra-boton mt-9"
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
        className="h-[3px] w-full overflow-hidden rounded bg-ra-borde"
      >
        <div
          className="h-full bg-ra-rojo transition-[width] duration-300 ease-out"
          style={{ width: `${((paso + 1) / PREGUNTAS.length) * 100}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-ra-texto-tenue">
        {paso + 1} de {PREGUNTAS.length}
      </p>

      <div className="mt-10 flex-1">
        {/*
          `key` fuerza a React a remontar el bloque en cada pregunta. Sin él,
          el navegador conserva el valor escrito en el campo anterior porque
          reutiliza el mismo nodo del DOM.
        */}
        <div key={pregunta.campo} className="mg-entrada">
          <h1 className="ra-titulo text-2xl sm:text-3xl">{pregunta.titulo}</h1>
          <p className="mt-3 text-sm text-ra-texto-tenue">{pregunta.ayuda}</p>

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
                        ? 'border-ra-rojo bg-ra-rojo text-white'
                        : 'border-ra-borde text-ra-texto-sec hover:border-ra-texto-tenue'
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
                className="w-full rounded-md border border-ra-borde bg-ra-fondo px-4 py-3 text-lg"
              />
            ) : (
              <textarea
                rows={4}
                autoFocus
                value={typeof valor === 'string' ? valor : ''}
                placeholder={pregunta.placeholder}
                onChange={(e) => responder(e.target.value === '' ? null : e.target.value)}
                className="w-full resize-none rounded-md border border-ra-borde bg-ra-fondo px-4 py-3 text-base placeholder:text-ra-texto-tenue"
              />
            )}
          </div>
        </div>
      </div>

      {error !== null && <p className="mb-3 text-sm text-ra-rojo">{error}</p>}

      <div className="flex items-center gap-3">
        {paso > 0 && (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="ra-boton-sec ra-boton-auto"
          >
            Atrás
          </button>
        )}

        <button
          type="button"
          onClick={avanzar}
          disabled={enviando}
          className="ra-boton flex-1"
        >
          {enviando ? 'Guardando…' : esUltima ? 'Terminar' : 'Siguiente'}
        </button>
      </div>

      {/* Omitir siempre visible: ninguna pregunta puede bloquear el registro. */}
      <button
        type="button"
        onClick={avanzar}
        className="mt-4 self-center text-sm text-ra-texto-tenue hover:text-ra-texto-sec"
      >
        Prefiero no responder
      </button>

      <Link href="/app" className="mt-6 self-center text-xs text-ra-texto-tenue">
        Salir sin guardar
      </Link>
    </div>
  );
}
