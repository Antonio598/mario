'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

  async function confirmarRacha() {
    setError(null);
    setEnviando(true);

    const supabase = createClient();
    const { error: err } = await supabase.rpc('registrar_checkin');

    setEnviando(false);

    if (err) {
      setError('No hemos podido guardar tu check-in. Inténtalo de nuevo.');
      return;
    }
    router.refresh();
  }

  if (fase === 'formulario') {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-ra-fondo">
        <FormularioRecaida
          consiente={estado.consiente_sensibles}
          onTerminar={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-arranque"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ra-fondo px-5"
    >
      <div className="mg-entrada w-full max-w-sm text-center">
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
  );
}
