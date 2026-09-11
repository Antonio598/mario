'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CARACTERISTICAS_PAD, MAX_PAD, OPCIONES_PAD, VIDEO_PAD } from '@/lib/app/pad';

/* -------------------------------------------------------------------------- */
/* Piezas comunes                                                              */
/* -------------------------------------------------------------------------- */

function IconoVideo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

/** Botón «¿Qué es el P.A.D?». Siempre lleva al mismo vídeo. */
function BotonQueEs({ secundario = false }: { secundario?: boolean }) {
  return (
    <a
      href={VIDEO_PAD}
      target="_blank"
      rel="noopener noreferrer"
      className={secundario ? 'ra-boton-sec' : 'ra-boton'}
    >
      <IconoVideo />
      ¿Qué es el P.A.D?
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Creación / edición                                                          */
/* -------------------------------------------------------------------------- */

interface PropsCrear {
  /** P.A.D actual, si lo hay. Con valor, la pantalla es de edición. */
  actual: string | null;
  onCancelar: () => void;
}

/**
 * Formulario de creación del P.A.D.
 *
 * Primero las cuatro características, después las opciones. El orden importa:
 * quien lee antes qué tiene que cumplir elige mejor, y quien elige antes de
 * leer suele elegir "no ver porno", que no es una acción.
 *
 * Las opciones son botones de una sola elección y no una lista desplegable:
 * en móvil se ven todas de un vistazo y se eligen con un toque. "Personalizar"
 * abre un campo de texto y deselecciona cualquier opción.
 */
export function CrearPAD({ actual, onCancelar }: PropsCrear) {
  const router = useRouter();

  const esOpcion = (OPCIONES_PAD as readonly string[]).includes(actual ?? '');
  const [elegida, setElegida] = useState<string | null>(esOpcion ? actual : null);
  const [personalizado, setPersonalizado] = useState(!esOpcion && actual !== null);
  const [texto, setTexto] = useState(!esOpcion && actual !== null ? actual : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valor = personalizado ? texto.trim() : (elegida ?? '');
  const listo = valor.length > 0 && valor.length <= MAX_PAD;

  async function guardar() {
    if (!listo) return;
    setGuardando(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.rpc('guardar_pad', { p_texto: valor });

    setGuardando(false);

    if (err) {
      setError(`No hemos podido guardarlo. ${err.code ?? ''} ${err.message}`.trim());
      return;
    }
    // refresh() y no cerrar a mano: el estado del servidor es el que decide qué
    // pinta cada pantalla, y las tres (Inicio, Formación, Calendario) tienen que
    // cambiar a la vez.
    router.refresh();
  }

  return (
    <div className="ra-card mg-entrada px-5 py-6">
      <p className="ra-kicker">{actual === null ? 'Tu primera tarea' : 'Modificar'}</p>
      <h2 className="ra-titulo mt-2 text-2xl">
        {actual === null ? 'Crea tu P.A.D' : 'Cambia tu P.A.D'}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-ra-texto-sec">
        Es una <strong className="text-ra-texto">acción o tarea concreta</strong> que llevas a cabo
        en el momento en que aparece el deseo. Tiene que cumplir cuatro características:
      </p>

      <ol className="mt-4 space-y-2.5">
        {CARACTERISTICAS_PAD.map((c, i) => (
          <li key={c.titulo} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ra-rojo font-titular text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ra-texto">{c.titulo}</span>
              <span className="block text-xs text-ra-texto-tenue">{c.detalle}</span>
            </span>
          </li>
        ))}
      </ol>

      <hr className="ra-separador my-6" />

      <p className="text-sm font-semibold text-ra-texto">Elige uno o crea el tuyo</p>
      <p className="mt-1 text-xs text-ra-texto-tenue">Si no tienes ideas, cualquiera de estos vale.</p>

      <div role="radiogroup" aria-label="Opciones de P.A.D" className="mt-4 grid gap-2">
        {OPCIONES_PAD.map((o) => {
          const activa = !personalizado && elegida === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={activa}
              onClick={() => {
                setPersonalizado(false);
                setElegida(o);
              }}
              className={`mg-pulsable flex min-h-[48px] items-center gap-3 rounded-xl border px-4 text-left text-sm transition-colors ${
                activa
                  ? 'border-ra-rojo bg-ra-rojo/10 font-semibold text-ra-texto'
                  : 'border-ra-borde text-ra-texto-sec hover:border-ra-texto-tenue'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                  activa ? 'border-ra-rojo bg-ra-rojo' : 'border-ra-borde'
                }`}
              />
              {o}
            </button>
          );
        })}

        <button
          type="button"
          role="radio"
          aria-checked={personalizado}
          onClick={() => {
            setPersonalizado(true);
            setElegida(null);
          }}
          className={`mg-pulsable flex min-h-[48px] items-center gap-3 rounded-xl border px-4 text-left text-sm transition-colors ${
            personalizado
              ? 'border-ra-rojo bg-ra-rojo/10 font-semibold text-ra-texto'
              : 'border-ra-borde text-ra-texto-sec hover:border-ra-texto-tenue'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 rounded-full border-2 ${
              personalizado ? 'border-ra-rojo bg-ra-rojo' : 'border-ra-borde'
            }`}
          />
          Personalizar el mío
        </button>
      </div>

      {personalizado && (
        <div className="mg-entrada mt-3">
          <input
            type="text"
            autoFocus
            maxLength={MAX_PAD}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ducha fría de dos minutos"
            aria-label="Tu P.A.D"
            className="w-full rounded-xl border border-ra-borde bg-ra-fondo px-4 py-3 text-base text-ra-texto placeholder:text-ra-texto-tenue"
          />
          <p className="mt-1.5 text-right text-[11px] text-ra-texto-tenue">
            {texto.length}/{MAX_PAD}
          </p>
        </div>
      )}

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
          {guardando ? 'Guardando…' : actual === null ? 'Guardar mi P.A.D' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarea pendiente: el usuario aún no tiene P.A.D                              */
/* -------------------------------------------------------------------------- */

/**
 * Tarjeta de tarea pendiente. Aparece en Inicio, Formación y Calendario hasta
 * que el usuario crea su P.A.D; entonces desaparece de las tres a la vez.
 *
 * Dos botones y no uno: quien acaba de registrarse no sabe qué es un P.A.D, y
 * pedirle que lo cree antes de explicárselo es pedirle que invente. El vídeo va
 * primero.
 */
export function TareaPAD() {
  const [creando, setCreando] = useState(false);

  if (creando) return <CrearPAD actual={null} onCancelar={() => setCreando(false)} />;

  return (
    <section
      className="ra-card mg-entrada px-5 py-5"
      style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 45%, transparent)' }}
    >
      <div className="flex items-start gap-3">
        {/* Casilla vacía: es una tarea, y se ve que está sin hacer. */}
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ra-rojo"
        />
        <div className="min-w-0 flex-1">
          <p className="ra-kicker">Tarea pendiente</p>
          <h2 className="mt-1.5 font-titular text-xl font-bold text-ra-texto uppercase">
            Crea tu P.A.D
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ra-texto-sec">
            Tu Protocolo Anti-Deseo: lo que haces en el momento exacto en que aparece el
            deseo. Sin él, cada recaída te pilla sin plan.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <BotonQueEs secundario />
        <button type="button" onClick={() => setCreando(true)} className="ra-boton">
          Crear mi P.A.D
        </button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Recordatorio en Inicio: el usuario ya tiene P.A.D                           */
/* -------------------------------------------------------------------------- */

export function RecordatorioPAD({ pad }: { pad: string }) {
  return (
    <section className="ra-card mg-entrada flex items-center gap-4 px-5 py-4">
      {/* Casilla marcada: la tarea está hecha. */}
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
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-titular text-[11px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
          Tu P.A.D
        </p>
        <p className="mt-0.5 text-base font-semibold text-ra-texto break-words">{pad}</p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendario: recordar y modificar                                            */
/* -------------------------------------------------------------------------- */

export function AccionesPAD({ pad }: { pad: string }) {
  const [editando, setEditando] = useState(false);

  if (editando) return <CrearPAD actual={pad} onCancelar={() => setEditando(false)} />;

  return (
    <section className="ra-card mg-entrada px-5 py-5">
      <p className="font-titular text-[11px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
        Tu P.A.D
      </p>
      <p className="mt-1 text-base font-semibold text-ra-texto break-words">{pad}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <BotonQueEs secundario />
        <button type="button" onClick={() => setEditando(true)} className="ra-boton-sec">
          Modificar
        </button>
      </div>
    </section>
  );
}
