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
      /*
        El tinte verde se calcula desde el token de exito con `color-mix`, no
        con un `bg-green-50` fijo: ese verde clarisimo sobre el fondo negro del
        modo oscuro seria un panel encendido en mitad de la pantalla.
      */
      <div
        className="mg-entrada ra-card flex items-center gap-3 px-5 py-4"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-ra-exito) 35%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--color-ra-exito) 8%, var(--color-ra-superficie))',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-ra-exito)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
        <div className="text-left">
          <p className="font-titular text-sm font-bold tracking-wider text-ra-exito uppercase">
            Hoy ya está registrado
          </p>
          <p className="text-sm text-ra-texto-sec">Nos vemos mañana.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ra-card px-5 py-6 text-center">
      <h2 className="font-titular text-2xl font-bold text-ra-texto uppercase">
        ¿Sigues en racha?
      </h2>
      <p className="mt-2 text-sm text-ra-texto-sec">
        Responde con la verdad. El contador solo sirve si es real.
      </p>

      {error !== null && <p className="mt-4 text-sm text-ra-rojo">{error}</p>}

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => void confirmarRacha()}
          disabled={enviando}
          className="ra-boton"
        >
          {enviando ? 'Guardando…' : 'Sí, sigo'}
        </button>

        {/*
          Deliberadamente secundario. No por esconderlo -mentir al contador lo
          inutiliza-, sino porque el boton que se pulsa casi todos los dias es el
          otro, y darles el mismo peso obliga a leer dos veces cada mañana.
        */}
        <a href="/app/recaida" className="ra-boton-sec">
          He recaído
        </a>
      </div>
    </div>
  );
}
