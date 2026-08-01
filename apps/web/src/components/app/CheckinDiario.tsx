'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EstadoDiario } from '@/lib/app/tipos';

/**
 * Check-in del día.
 *
 * En la app nativa esto es un modal a pantalla completa al abrir. Aquí va
 * integrado en la pantalla de inicio: en web, un modal que aparece solo al
 * cargar se percibe como un anuncio y se cierra por reflejo antes de leerlo.
 *
 * TONO: exigente, nunca humillante. El botón de recaída dice "He recaído", no
 * "He fallado". La diferencia decide si el usuario registra la verdad o miente
 * al contador, y un contador al que se le miente no sirve para nada.
 */
export function CheckinDiario({ estado }: { estado: EstadoDiario }) {
  const router = useRouter();
  const [enviando, empezarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function confirmarRacha() {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.rpc('registrar_checkin');

    if (err) {
      setError('No hemos podido guardar tu check-in. Inténtalo de nuevo.');
      return;
    }
    // refresh() y no reload(): vuelve a pedir el Server Component conservando
    // el estado de la página, sin recarga completa del navegador.
    empezarTransicion(() => router.refresh());
  }

  if (!estado.necesita_checkin) {
    return (
      <div className="rounded-lg border border-mg-exito/30 bg-mg-exito/10 px-5 py-4 text-center">
        <p className="font-titular tracking-wider text-mg-exito uppercase">Hoy ya está registrado</p>
        <p className="mt-1 text-sm text-mg-gris-texto">Nos vemos mañana.</p>
      </div>
    );
  }

  return (
    <div className="mg-card px-5 py-6 text-center">
      <h2 className="text-xl">¿Sigues en racha?</h2>
      <p className="mt-2 text-sm text-mg-gris-texto">
        Responde con la verdad. El contador solo sirve si es real.
      </p>

      {error !== null && <p className="mt-4 text-sm text-mg-rojo-claro">{error}</p>}

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => void confirmarRacha()}
          disabled={enviando}
          className="min-h-[52px] rounded-md bg-mg-rojo px-6 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Sí, sigo'}
        </button>

        <a
          href="/app/recaida"
          className="flex min-h-[52px] items-center justify-center rounded-md border border-mg-negro-borde px-6 font-titular font-semibold tracking-wider text-mg-gris-texto uppercase transition-colors hover:border-mg-gris-tenue hover:text-mg-blanco"
        >
          He recaído
        </a>
      </div>
    </div>
  );
}
