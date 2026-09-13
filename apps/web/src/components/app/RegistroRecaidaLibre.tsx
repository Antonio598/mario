'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PREGUNTAS } from '@/lib/app/preguntas-recaida';
import { Bloqueado } from './Bloqueado';

/**
 * Registro de recaída para el plan gratuito.
 *
 * El DÍA se registra igual que en Premium: el contador tiene que decir la
 * verdad para todo el mundo, y un contador al que no se le puede contar una
 * recaída es un contador al que se le miente. Lo que es Premium es el
 * protocolo de 9 preguntas —dónde, cuándo, por qué— que se muestra detrás del
 * candado como lo que se está perdiendo.
 *
 * Usa `guardar_recaida` sin argumentos: exactamente lo que hace "Registrar
 * solo el día" en la versión Premium.
 */
export function RegistroRecaidaLibre({ onTerminar }: { onTerminar?: () => void }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function registrar() {
    setEnviando(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.rpc('guardar_recaida', {});
    setEnviando(false);
    if (err) {
      setError(`No hemos podido guardarlo. ${err.code ?? ''} ${err.message}`.trim());
      return;
    }
    setHecho(true);
  }

  const primera = PREGUNTAS[0];

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10">
      <p className="ra-kicker">Recaída</p>

      {hecho ? (
        <>
          <h1 className="ra-titulo mt-3">Registrado</h1>
          <p className="mt-4 text-sm leading-relaxed text-ra-texto-sec">
            Los días que ya sostuviste siguen siendo tuyos. Mañana el contador vuelve a empezar.
          </p>
        </>
      ) : (
        <>
          <h1 className="ra-titulo mt-3">Hoy cuenta como recaída</h1>
          <p className="mt-4 text-sm leading-relaxed text-ra-texto-sec">
            Se registra el día y la racha vuelve a empezar mañana. Es lo que hace que el contador
            sea real.
          </p>
          {error !== null && <p className="mt-4 text-sm break-words text-ra-rojo">{error}</p>}
          <button
            type="button"
            onClick={() => void registrar()}
            disabled={enviando}
            className="ra-boton mt-6"
          >
            {enviando ? 'Guardando…' : 'Registrar el día'}
          </button>
        </>
      )}

      <div className="mt-8">
        <Bloqueado
          titulo="El protocolo post-recaída"
          texto="Nueve preguntas que te dicen dónde, cuándo y por qué. Es lo que convierte una recaída en información."
          desde="protocolo"
        >
          {/* Vista previa: la primera pregunta, sin datos de nadie. */}
          <div className="px-5 py-8">
            <p className="text-xs text-ra-texto-tenue">1 de {PREGUNTAS.length}</p>
            <h2 className="ra-titulo mt-3 text-2xl">{primera?.titulo}</h2>
            <p className="mt-3 text-sm text-ra-texto-tenue">{primera?.ayuda}</p>
            <div className="mt-6 h-24 rounded-xl border border-ra-borde bg-ra-fondo" />
            <div className="ra-boton mt-6">Siguiente</div>
          </div>
        </Bloqueado>
      </div>

      <button
        type="button"
        onClick={() => (onTerminar ? onTerminar() : router.push('/app'))}
        className="ra-boton-sec mt-6"
      >
        {hecho ? 'Volver' : 'Salir sin registrar'}
      </button>
    </div>
  );
}
