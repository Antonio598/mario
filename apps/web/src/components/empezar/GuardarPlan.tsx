'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Json } from '@reset-alfa/shared';
import { createClient } from '@/lib/supabase/client';
import { CLAVE_ALMACEN, type RespuestasPlan } from '@/lib/empezar/preguntas';

/**
 * Guarda el plan del navegador en el perfil y sigue al paywall.
 *
 * Si no hay nada en el navegador (el usuario llego aqui sin hacer el test, o
 * lo hizo en otro dispositivo), se guarda null: el flag se pone igual y no
 * queda atrapado. Si el guardado falla, se ofrece reintentar en vez de
 * mandarlo a /app, donde el gate lo devolveria al test y perderia el hilo.
 */
export function GuardarPlan() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;

    void (async () => {
      let plan: RespuestasPlan | null = null;
      try {
        const bruto = localStorage.getItem(CLAVE_ALMACEN);
        plan = bruto === null ? null : (JSON.parse(bruto) as RespuestasPlan);
      } catch {
        plan = null;
      }

      const supabase = createClient();
      // RespuestasPlan es JSON plano (strings, numeros, listas de strings):
      // la conversion es segura y el RPC filtra por lista blanca de todos modos.
      const { error: err } = await supabase.rpc('guardar_plan', {
        p_plan: plan as unknown as Json,
      });
      if (!vivo) return;

      if (err) {
        setError(`${err.code ?? ''} ${err.message}`.trim());
        return;
      }

      try {
        localStorage.removeItem(CLAVE_ALMACEN);
      } catch {
        // Sin importancia: el plan ya esta en el servidor.
      }
      router.replace('/app/premium?bienvenida=1');
    })();

    return () => {
      vivo = false;
    };
  }, [router, intento]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-5 text-center">
      {error === null ? (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-ra-borde border-t-ra-rojo" />
          <p className="mt-6 font-titular text-xl font-bold text-ra-texto uppercase">
            Preparando tu plan
          </p>
          <p className="mt-2 text-sm text-ra-texto-tenue">Un segundo.</p>
        </>
      ) : (
        <>
          <p className="ra-kicker justify-center">Algo ha fallado</p>
          <p className="mt-3 text-sm text-ra-texto-sec">No hemos podido guardar tu plan.</p>
          <p className="mt-2 font-mono text-[11px] break-all text-ra-texto-tenue">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIntento((n) => n + 1);
            }}
            className="ra-boton mt-8"
          >
            Reintentar
          </button>
        </>
      )}
    </div>
  );
}
