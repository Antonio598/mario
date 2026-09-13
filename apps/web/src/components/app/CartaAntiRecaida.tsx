'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBloqueoScroll } from '@/lib/app/useBloqueoScroll';
import {
  MAX_RESPUESTA_CARTA,
  PREGUNTAS_CARTA,
  type RespuestasCarta,
} from '@/lib/app/carta';
import { Portal } from './Portal';

/* -------------------------------------------------------------------------- */
/* Lectura: la carta a pantalla completa                                       */
/* -------------------------------------------------------------------------- */

/**
 * La carta se lee en una hoja que ocupa toda la pantalla, sin nada más.
 *
 * Es el uso para el que existe: alguien con el móvil en la mano en el momento
 * de la tentación. Cualquier otro elemento en pantalla —la barra, el
 * contador, un botón rojo— es una distracción de lo único que tiene que leer.
 */
export function LeerCarta({ carta, onCerrar }: { carta: RespuestasCarta; onCerrar: () => void }) {
  useBloqueoScroll(true);

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tu carta anti-recaída"
        className="ra-hoja fixed inset-0 z-[70] overflow-y-auto bg-ra-fondo"
      >
        <div className="mx-auto max-w-md px-6 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
          <p className="ra-kicker">Tu carta anti-recaída</p>
          <h1 className="ra-titulo mt-3">Léela entera</h1>
          <p className="mt-2 text-sm text-ra-texto-tenue">
            La escribiste tú, en un momento de claridad. Hazle caso.
          </p>

          <div className="mt-8 space-y-7">
            {PREGUNTAS_CARTA.map((p) => {
              const valor = carta[p.clave];
              if (valor === undefined) return null;
              return (
                <section key={p.clave} className="border-l-2 border-ra-rojo pl-4">
                  <h2 className="font-titular text-[11px] font-bold tracking-[0.2em] text-ra-rojo uppercase">
                    {p.encabezado}
                  </h2>
                  <p className="mt-2 text-base leading-relaxed whitespace-pre-line text-ra-texto">
                    {valor}
                  </p>
                </section>
              );
            })}
          </div>

          <button type="button" onClick={onCerrar} className="ra-boton mt-10">
            Ya la he leído
          </button>
        </div>
      </div>
    </Portal>
  );
}

/* -------------------------------------------------------------------------- */
/* Creación / edición                                                          */
/* -------------------------------------------------------------------------- */

interface PropsCrear {
  actual: RespuestasCarta | null;
  onCancelar: () => void;
}

/**
 * Formulario de la carta: las cinco preguntas en una sola pantalla.
 *
 * A diferencia del protocolo post-recaída, aquí no va una pregunta por
 * pantalla. Aquello se rellena en caliente y hay que reducir fricción; esto se
 * escribe en frío, con calma, y ver las cinco preguntas juntas ayuda a que las
 * respuestas se hablen entre sí.
 *
 * Ninguna es obligatoria salvo que haya al menos una: una línea sincera vale
 * más que un formulario abandonado por exigir cinco.
 */
export function CrearCarta({ actual, onCancelar }: PropsCrear) {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<RespuestasCarta>(actual ?? {});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rellenas = PREGUNTAS_CARTA.filter((p) => (respuestas[p.clave] ?? '').trim() !== '').length;
  const listo = rellenas > 0;

  function responder(clave: keyof RespuestasCarta, v: string) {
    setRespuestas((prev) => ({ ...prev, [clave]: v }));
  }

  async function guardar() {
    if (!listo) return;
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.rpc('guardar_carta', { p_respuestas: respuestas });

    setGuardando(false);

    if (err) {
      setError(`No hemos podido guardarla. ${err.code ?? ''} ${err.message}`.trim());
      return;
    }
    router.refresh();
  }

  return (
    <div className="ra-card mg-entrada px-5 py-6">
      <p className="ra-kicker">{actual === null ? 'Tu tarea pendiente' : 'Modificar'}</p>
      <h2 className="ra-titulo mt-2 text-2xl">
        {actual === null ? 'Escribe tu carta anti-recaída' : 'Cambia tu carta'}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-ra-texto-sec">
        Un mensaje de ti para ti, para leerlo justo cuando aparezca la tentación. Responde a lo
        que puedas; con una sola respuesta sincera ya tienes carta.
      </p>

      <div className="mt-6 space-y-6">
        {PREGUNTAS_CARTA.map((p, i) => (
          <div key={p.clave}>
            <label htmlFor={`carta-${p.clave}`} className="block">
              <span className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ra-rojo font-titular text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-ra-texto">{p.titulo}</span>
              </span>
              <span className="mt-1 block pl-[30px] text-xs text-ra-texto-tenue">{p.ayuda}</span>
            </label>
            <textarea
              id={`carta-${p.clave}`}
              rows={3}
              maxLength={MAX_RESPUESTA_CARTA}
              value={respuestas[p.clave] ?? ''}
              onChange={(e) => responder(p.clave, e.target.value)}
              placeholder={p.placeholder}
              className="mt-2 w-full resize-none rounded-xl border border-ra-borde bg-ra-fondo px-4 py-3 text-base leading-relaxed text-ra-texto placeholder:text-ra-texto-tenue"
            />
          </div>
        ))}
      </div>

      {error !== null && <p className="mt-4 text-sm break-words text-ra-rojo">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onCancelar} className="ra-boton-sec ra-boton-auto">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!listo || guardando}
          className="ra-boton flex-1"
        >
          {guardando ? 'Guardando…' : actual === null ? 'Guardar mi carta' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarea pendiente                                                             */
/* -------------------------------------------------------------------------- */

export function TareaCarta() {
  const [creando, setCreando] = useState(false);

  if (creando) return <CrearCarta actual={null} onCancelar={() => setCreando(false)} />;

  return (
    <section
      className="ra-card mg-entrada px-5 py-5"
      style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 45%, transparent)' }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ra-rojo"
        />
        <div className="min-w-0 flex-1">
          <p className="ra-kicker">Tarea pendiente</p>
          <h2 className="mt-1.5 font-titular text-xl font-bold text-ra-texto uppercase">
            Escribe tu carta anti-recaída
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ra-texto-sec">
            Un mensaje recordándote por qué no deberías ver porno ni masturbarte, para leerlo en
            el momento en que aparezca la tentación.
          </p>
        </div>
      </div>

      <button type="button" onClick={() => setCreando(true)} className="ra-boton mt-5">
        Escribir mi carta
      </button>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Con carta: leerla (Inicio) o leerla y modificarla (Calendario)              */
/* -------------------------------------------------------------------------- */

export function RecordatorioCarta({ carta }: { carta: RespuestasCarta }) {
  const [leyendo, setLeyendo] = useState(false);

  return (
    <>
      <section className="ra-card mg-entrada flex items-center gap-4 px-5 py-4">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16v12H4z" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-titular text-[11px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Tu carta anti-recaída
          </p>
          <p className="mt-0.5 text-sm text-ra-texto-sec">Para el momento de la tentación.</p>
        </div>
        <button
          type="button"
          onClick={() => setLeyendo(true)}
          className="ra-boton ra-boton-auto min-h-[40px] px-4 text-xs"
        >
          Leer
        </button>
      </section>

      {leyendo && <LeerCarta carta={carta} onCerrar={() => setLeyendo(false)} />}
    </>
  );
}

export function AccionesCarta({
  carta,
  bloqueado = false,
}: {
  carta: RespuestasCarta;
  bloqueado?: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);

  if (editando) return <CrearCarta actual={carta} onCancelar={() => setEditando(false)} />;

  return (
    <>
      <section className="ra-card mg-entrada px-5 py-5">
        <p className="font-titular text-[11px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
          Tu carta anti-recaída
        </p>
        <p className="mt-1 text-sm text-ra-texto-sec">
          {Object.keys(carta).length} de {PREGUNTAS_CARTA.length} respuestas escritas.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setLeyendo(true)} className="ra-boton">
            Leer
          </button>
          {bloqueado ? (
            <a href="/app/premium?desde=carta" className="ra-boton-sec">
              Modificar · Premium
            </a>
          ) : (
            <button type="button" onClick={() => setEditando(true)} className="ra-boton-sec">
              Modificar
            </button>
          )}
        </div>
      </section>

      {leyendo && <LeerCarta carta={carta} onCerrar={() => setLeyendo(false)} />}
    </>
  );
}
