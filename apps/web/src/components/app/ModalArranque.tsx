'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBloqueoScroll } from '@/lib/app/useBloqueoScroll';
import { Portal } from './Portal';
import { FormularioRecaida } from './FormularioRecaida';
import type { EstadoDiario } from '@/lib/app/tipos';

/**
 * Modal de arranque diario.
 *
 * Al abrir la app cada día natural pregunta "¿Sigues en racha?". Si el usuario
 * responde que no, el formulario del protocolo se despliega AQUÍ MISMO, sin
 * navegar a otra pantalla.
 *
 * Esa diferencia importa: una redirección da un instante para arrepentirse y
 * cerrar la app, y el registro que más información aporta es justo el que se
 * hace en caliente. El formulario aparece en el mismo gesto que la respuesta.
 *
 * Bloquea la pantalla a propósito —no hay botón de cerrar— porque es una única
 * pregunta al día y responderla es el producto. Lo que sí se puede es omitir
 * cada pregunta del formulario: ninguna es obligatoria.
 */
export function ModalArranque({ estado }: { estado: EstadoDiario }) {
  const router = useRouter();
  const [fase, setFase] = useState<'pregunta' | 'formulario'>('pregunta');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Mensaje de cierre cuando no hay nada que registrar hoy. */
  const [resuelto, setResuelto] = useState<string | null>(null);

  useBloqueoScroll(true);

  async function confirmarRacha() {
    setError(null);
    setEnviando(true);

    const supabase = createClient();
    const { data, error: err } = await supabase.rpc('registrar_checkin');

    setEnviando(false);

    if (err) {
      // Se muestra el mensaje del servidor. Sin el, un fallo de permisos y uno
      // de red se ven exactamente igual y hay que adivinar cual es.
      setError(
        `No hemos podido guardar tu check-in. ${err.code ?? ''} ${err.message}`.trim(),
      );
      return;
    }

    /*
      EL RPC PUEDE RESPONDER "NO" SIN QUE SEA UN ERROR.

      `registrar_checkin` devuelve {registrado:false, motivo:...} en dos casos:
      cuando hoy ya consta registrado y cuando la racha activa empieza manana
      (el dia de una recaida). Antes esos dos casos caian en el camino de exito
      y se llamaba a router.refresh(), que volvia a pintar el mismo modal: el
      usuario tocaba el boton y NO PASABA NADA, sin error ni explicacion.

      Es la definicion exacta de "el check-in no funciona".
    */
    const respuesta = (data ?? {}) as { registrado?: boolean; motivo?: string };

    if (respuesta.registrado === false) {
      if (respuesta.motivo === 'racha_no_iniciada') {
        // Hoy quedo marcado como recaida: la racha nueva arranca manana. No
        // hay nada que registrar, asi que se explica y se deja salir.
        setResuelto('Hoy ya quedó registrado como recaída. Tu racha nueva empieza mañana.');
        return;
      }
      // 'ya_registrado' y cualquier otro motivo: el estado del servidor es el
      // bueno, se recarga y el modal desaparece solo.
      router.refresh();
      return;
    }

    router.refresh();
  }

  if (resuelto !== null) {
    return (
      <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="ra-hoja fixed inset-0 z-[60] overflow-y-auto bg-ra-fondo px-5 py-10"
      >
        <div className="mg-entrada mx-auto flex min-h-full w-full max-w-sm flex-col justify-center text-center">
          <p className="ra-kicker justify-center">Check-in de hoy</p>
          <h1 className="ra-titulo mt-4">Nada que registrar</h1>
          <p className="mt-4 text-sm text-ra-texto-sec">{resuelto}</p>

          <button type="button" onClick={() => router.refresh()} className="ra-boton mt-9">
            Entendido
          </button>
        </div>
      </div>
      </Portal>
    );
  }

  if (fase === 'formulario') {
    return (
      <Portal>
        <div className="ra-hoja fixed inset-0 z-[60] overflow-y-auto bg-ra-fondo">
          <FormularioRecaida
            consiente={estado.consiente_sensibles}
            onTerminar={() => router.refresh()}
          />
        </div>
      </Portal>
    );
  }

  return (
    <Portal>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-arranque"
      /*
        `overflow-y-auto` no es opcional: mientras el modal esta abierto el
        scroll del body esta bloqueado, asi que si el contenido no cabe -un
        telefono bajo, o con el teclado abierto- los botones quedarian fuera de
        la pantalla y sin forma de alcanzarlos.

        `py-10` y `my-auto` en vez de `items-center`: centrado cuando sobra
        sitio, desplazable cuando falta.
      */
      className="ra-hoja fixed inset-0 z-[60] overflow-y-auto bg-ra-fondo px-5 py-10"
    >
      <div className="mg-entrada mx-auto flex min-h-full w-full max-w-sm flex-col justify-center text-center">
        <p className="ra-kicker justify-center">Check-in de hoy</p>

        <h1 id="titulo-arranque" className="ra-titulo mt-4 text-4xl">
          ¿Sigues en racha?
        </h1>

        <p className="mt-4 text-sm text-ra-texto-sec">
          Responde con la verdad. El contador solo sirve si es real.
        </p>

        {error !== null && <p className="mt-5 text-sm text-ra-rojo">{error}</p>}

        <div className="mt-9 grid gap-3">
          <button
            type="button"
            onClick={() => void confirmarRacha()}
            disabled={enviando}
            className="ra-boton"
          >
            {enviando ? 'Guardando…' : 'Sí, sigo'}
          </button>

          <button
            type="button"
            onClick={() => setFase('formulario')}
            disabled={enviando}
            className="ra-boton-sec"
          >
            He recaído
          </button>
        </div>

        <p className="mt-8 text-xs text-ra-texto-tenue">
          Una recaída registrada vale más que una ocultada.
        </p>
      </div>
    </div>
    </Portal>
  );
}
