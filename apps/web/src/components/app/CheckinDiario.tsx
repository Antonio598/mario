'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EstadoDiario } from '@/lib/app/tipos';

/**
 * Check-in del día — Reset Alfa tema claro.
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
      <div className="mg-entrada ra-card border-ra-exito/30 bg-green-50 px-5 py-4 text-center">
        <p className="font-titular tracking-wider text-ra-exito uppercase">Hoy ya está registrado</p>
        <p className="mt-1 text-sm text-ra-texto-sec">Nos vemos mañana.</p>
      </div>
    );
  }

  return (
    <div className="ra-card px-5 py-6 text-center">
      <h2 className="font-titular text-xl text-ra-negro uppercase">¿Sigues en racha?</h2>
      <p className="mt-2 text-sm text-ra-texto-sec">
        Responde con la verdad. El contador solo sirve si es real.
      </p>

      {error !== null && <p className="mt-4 text-sm text-ra-rojo">{error}</p>}

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => void confirmarRacha()}
          disabled={enviando}
          className="mg-pulsable min-h-[52px] rounded-xl bg-ra-rojo px-6 font-titular font-semibold tracking-wider text-white uppercase transition-colors hover:bg-ra-rojo-oscuro disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Sí, sigo'}
        </button>

        <a
          href="/app/recaida"
          className="mg-pulsable flex min-h-[52px] items-center justify-center rounded-xl border border-ra-borde px-6 font-titular font-semibold tracking-wider text-ra-texto-sec uppercase transition-colors hover:border-ra-rojo hover:text-ra-rojo"
        >
          He recaído
        </a>
      </div>
    </div>
  );
}
